"""
MCP Server for Agent-Tracker.

This module implements the MCP (Model Context Protocol) server that allows
AI agents to interact with the Agent-Tracker system.

Key design principles:
1. Token-efficient: only return lightweight data by default
2. Lazy loading: full details only on explicit request
3. Context reset: broadcast when humans modify state
"""

from mcp.server.fastmcp import FastMCP
import json
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from services.storage import (
    get_task, save_task, list_tasks, ensure_project,
    get_project, delete_task as storage_delete_task,
)
from services.dag_validator import would_create_cycle
from models.schemas import Task, Status, ReviewMode, LogEntry, Evidence
from datetime import datetime, timezone

mcp = FastMCP("Agent-Tracker")

DEFAULT_PROJECT = "demo-001"


@mcp.tool()
def get_project_status(project_id: str = DEFAULT_PROJECT) -> str:
    """
    Get lightweight project status (token-efficient).
    Returns only id, title, status, tags for each task.
    Use this before taking any action to understand current state.
    """
    ensure_project(project_id)
    tasks = list_tasks(project_id)
    result = [
        {"id": t.id, "title": t.title, "status": t.status.value,
         "tags": t.tags, "reviewMode": t.reviewMode.value,
         "summary": t.summary}
        for t in tasks
    ]
    return json.dumps(result, ensure_ascii=False, indent=2)


@mcp.tool()
def get_task_detail(task_id: str, project_id: str = DEFAULT_PROJECT) -> str:
    """
    Get full task detail including logs and evidence.
    Only call this when you need the complete information for a specific task.
    """
    task = get_task(project_id, task_id)
    if not task:
        return json.dumps({"error": f"Task {task_id} not found"})
    return json.dumps(task.model_dump(), ensure_ascii=False, indent=2)


@mcp.tool()
def create_task(
    task_id: str,
    title: str,
    review_mode: str = "human",
    tags: str = "",
    dependencies: str = "",
    summary: str = "",
    project_id: str = DEFAULT_PROJECT,
) -> str:
    """
    Create a new task.

    Args:
        task_id: Unique task ID (e.g., T-101)
        title: Task title
        review_mode: "human" or "ai" (determines verification track)
        tags: Comma-separated tags (e.g., "场景,核心")
        dependencies: Comma-separated task IDs this depends on
        summary: Brief execution summary (max 100 chars)
    """
    ensure_project(project_id)
    existing = get_task(project_id, task_id)
    if existing:
        return json.dumps({"error": f"Task {task_id} already exists"})

    now = datetime.now(timezone.utc).isoformat()
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    dep_list = [d.strip() for d in dependencies.split(",") if d.strip()] if dependencies else []

    # Validate dependencies exist
    for dep_id in dep_list:
        dep_task = get_task(project_id, dep_id)
        if not dep_task:
            return json.dumps({"error": f"Dependency task {dep_id} not found"})

    task = Task(
        id=task_id,
        title=title,
        status=Status.planned,
        reviewMode=ReviewMode.human if review_mode == "human" else ReviewMode.ai,
        tags=tag_list,
        dependencies=dep_list,
        summary=summary,
        detailedLog=[],
        evidence=[],
        createdAt=now,
        updatedAt=now,
    )
    save_task(project_id, task)
    return json.dumps({"ok": True, "task_id": task_id}, ensure_ascii=False)


@mcp.tool()
def batch_init_tasks(
    tasks_json: str,
    project_id: str = DEFAULT_PROJECT,
) -> str:
    """
    Batch initialize multiple tasks at once.

    Args:
        tasks_json: JSON array of task objects, each with:
            - id, title, reviewMode ("human"/"ai"), tags ([]), dependencies ([]), summary
    """
    ensure_project(project_id)
    try:
        task_list = json.loads(tasks_json)
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON"})

    created = []
    errors = []
    now = datetime.now(timezone.utc).isoformat()

    for t in task_list:
        existing = get_task(project_id, t["id"])
        if existing:
            errors.append(f"{t['id']}: already exists")
            continue

        task = Task(
            id=t["id"],
            title=t["title"],
            status=Status.planned,
            reviewMode=ReviewMode(t.get("reviewMode", "human")),
            tags=t.get("tags", []),
            dependencies=t.get("dependencies", []),
            summary=t.get("summary", ""),
            detailedLog=[],
            evidence=[],
            createdAt=now,
            updatedAt=now,
        )
        save_task(project_id, task)
        created.append(t["id"])

    return json.dumps({"created": created, "errors": errors}, ensure_ascii=False)


@mcp.tool()
def update_task_status(
    task_id: str,
    status: str,
    project_id: str = DEFAULT_PROJECT,
) -> str:
    """
    Update task status. Follows the state machine:
    planned -> inprogress -> pending/completed/blocked -> completed

    Args:
        task_id: Task to update
        status: New status (planned/inprogress/pending/completed/blocked)
    """
    task = get_task(project_id, task_id)
    if not task:
        return json.dumps({"error": f"Task {task_id} not found"})

    try:
        new_status = Status(status)
    except ValueError:
        return json.dumps({"error": f"Invalid status: {status}"})

    task.status = new_status
    save_task(project_id, task)
    return json.dumps({"ok": True, "task_id": task_id, "status": status})


@mcp.tool()
def add_log(
    task_id: str,
    summary: str,
    detail: str,
    project_id: str = DEFAULT_PROJECT,
) -> str:
    """
    Add a layered log entry to a task.
    - summary: Brief summary (displayed on card, max 100 chars)
    - detail: Detailed log entry (displayed in sidebar)
    """
    task = get_task(project_id, task_id)
    if not task:
        return json.dumps({"error": f"Task {task_id} not found"})

    now = datetime.now(timezone.utc).strftime("%H:%M")
    task.detailedLog.append(LogEntry(timestamp=now, message=detail))
    task.summary = summary[:100]
    save_task(project_id, task)
    return json.dumps({"ok": True, "task_id": task_id})


@mcp.tool()
def submit_evidence(
    task_id: str,
    evidence_type: str,
    path: str,
    description: str = "",
    project_id: str = DEFAULT_PROJECT,
) -> str:
    """
    Submit verification evidence for a task.
    For AI self-verified tasks, this auto-completes the task.

    Args:
        task_id: Task to submit evidence for
        evidence_type: "file", "screenshot", "test", or "diff"
        path: File path or reference
        description: Human-readable description
    """
    task = get_task(project_id, task_id)
    if not task:
        return json.dumps({"error": f"Task {task_id} not found"})

    task.evidence.append(Evidence(
        type=evidence_type,
        path=path,
        description=description,
    ))

    # Auto-complete AI self-verified tasks
    if task.reviewMode == ReviewMode.ai and task.status == Status.pending:
        task.status = Status.completed

    save_task(project_id, task)
    return json.dumps({"ok": True, "task_id": task_id, "auto_completed": task.status == Status.completed})


@mcp.tool()
def add_dependency(
    task_id: str,
    depends_on: str,
    project_id: str = DEFAULT_PROJECT,
) -> str:
    """
    Add a dependency (with automatic DAG cycle detection).
    Will reject if creating a cycle.
    """
    task = get_task(project_id, task_id)
    if not task:
        return json.dumps({"error": f"Task {task_id} not found"})

    if depends_on in task.dependencies:
        return json.dumps({"error": "Dependency already exists"})

    all_tasks = [
        {"id": t.id, "dependencies": t.dependencies}
        for t in list_tasks(project_id)
    ]
    if would_create_cycle(all_tasks, depends_on, task_id):
        return json.dumps({
            "error": f"Adding dependency {depends_on} -> {task_id} would create a cycle"
        })

    task.dependencies.append(depends_on)
    save_task(project_id, task)
    return json.dumps({"ok": True, "task_id": task_id, "depends_on": depends_on})


@mcp.tool()
def remove_dependency(
    task_id: str,
    depends_on: str,
    project_id: str = DEFAULT_PROJECT,
) -> str:
    """Remove a dependency between tasks."""
    task = get_task(project_id, task_id)
    if not task:
        return json.dumps({"error": f"Task {task_id} not found"})

    if depends_on not in task.dependencies:
        return json.dumps({"error": "Dependency not found"})

    task.dependencies.remove(depends_on)
    save_task(project_id, task)
    return json.dumps({"ok": True, "task_id": task_id, "removed": depends_on})


@mcp.tool()
def delete_task(task_id: str, project_id: str = DEFAULT_PROJECT) -> str:
    """Delete a task."""
    if storage_delete_task(project_id, task_id):
        return json.dumps({"ok": True, "task_id": task_id})
    return json.dumps({"error": f"Task {task_id} not found"})


@mcp.resource("agent-tracker://status")
def get_status_resource() -> str:
    """Resource: current project status overview."""
    tasks = list_tasks(DEFAULT_PROJECT)
    return json.dumps({
        "total": len(tasks),
        "by_status": {
            s.value: len([t for t in tasks if t.status == s])
            for s in Status
        }
    }, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    mcp.run()
