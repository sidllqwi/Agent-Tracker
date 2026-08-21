from fastapi import APIRouter, HTTPException, Query
from models.schemas import (
    Task, TaskCreate, TaskStatusUpdate, TaskLogAdd,
    EvidenceSubmit, DependencyAdd, Status
)
from services.storage import get_task, save_task, delete_task, list_tasks, ensure_project
from services.dag_validator import would_create_cycle
from datetime import datetime, timezone

router = APIRouter(prefix="/api", tags=["tasks"])

# Default project for demo
DEFAULT_PROJECT = "demo-001"


@router.get("/projects/{project_id}/tasks")
def get_project_tasks(project_id: str):
    """Lightweight task list (token-efficient: only essential fields)."""
    ensure_project(project_id)
    tasks = list_tasks(project_id)
    return [
        {
            "id": t.id,
            "title": t.title,
            "status": t.status,
            "tags": t.tags,
            "reviewMode": t.reviewMode,
            "summary": t.summary,
            "dependencies": t.dependencies,
            "evidence": t.evidence,
        }
        for t in tasks
    ]


@router.get("/tasks/{task_id}")
def get_task_detail(task_id: str, project_id: str = Query(default=DEFAULT_PROJECT)):
    """Full task detail (lazy loading)."""
    task = get_task(project_id, task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task.model_dump()


@router.post("/tasks")
def create_task(task: TaskCreate, project_id: str = Query(default=DEFAULT_PROJECT)):
    ensure_project(project_id)
    existing = get_task(project_id, task.id)
    if existing:
        raise HTTPException(status_code=409, detail=f"Task {task.id} already exists")

    now = datetime.now(timezone.utc).isoformat()
    full_task = Task(
        **task.model_dump(),
        detailedLog=[],
        evidence=[],
        createdAt=now,
        updatedAt=now,
    )
    return save_task(project_id, full_task).model_dump()


@router.patch("/tasks/{task_id}/status")
def update_task_status(
    task_id: str,
    body: TaskStatusUpdate,
    project_id: str = Query(default=DEFAULT_PROJECT),
):
    task = get_task(project_id, task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    task.status = body.status
    return save_task(project_id, task).model_dump()


@router.post("/tasks/{task_id}/log")
def add_task_log(
    task_id: str,
    body: TaskLogAdd,
    project_id: str = Query(default=DEFAULT_PROJECT),
):
    task = get_task(project_id, task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    now = datetime.now(timezone.utc).strftime("%H:%M")
    from models.schemas import LogEntry
    task.detailedLog.append(LogEntry(timestamp=now, message=body.detail))
    task.summary = body.summary
    return save_task(project_id, task).model_dump()


@router.post("/tasks/{task_id}/evidence")
def submit_evidence(
    task_id: str,
    body: EvidenceSubmit,
    project_id: str = Query(default=DEFAULT_PROJECT),
):
    task = get_task(project_id, task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    from models.schemas import Evidence
    task.evidence.append(Evidence(**body.model_dump()))

    # Auto-complete AI self-verified tasks
    if task.reviewMode.value == "ai" and task.status == Status.pending:
        task.status = Status.completed

    return save_task(project_id, task).model_dump()


@router.post("/tasks/{task_id}/dependencies")
def add_dependency(
    task_id: str,
    body: DependencyAdd,
    project_id: str = Query(default=DEFAULT_PROJECT),
):
    task = get_task(project_id, task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    if body.dependsOn in task.dependencies:
        raise HTTPException(status_code=409, detail="Dependency already exists")

    # DAG cycle detection
    all_tasks = [
        {"id": t.id, "dependencies": t.dependencies}
        for t in list_tasks(project_id)
    ]
    if would_create_cycle(all_tasks, body.dependsOn, task_id):
        raise HTTPException(
            status_code=400,
            detail=f"Adding dependency {body.dependsOn} -> {task_id} would create a cycle"
        )

    task.dependencies.append(body.dependsOn)
    return save_task(project_id, task).model_dump()


@router.delete("/tasks/{task_id}/dependencies/{depends_on}")
def remove_dependency(
    task_id: str,
    depends_on: str,
    project_id: str = Query(default=DEFAULT_PROJECT),
):
    task = get_task(project_id, task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    if depends_on not in task.dependencies:
        raise HTTPException(status_code=404, detail="Dependency not found")

    task.dependencies.remove(depends_on)
    return save_task(project_id, task).model_dump()


@router.delete("/tasks/{task_id}")
def delete_task_endpoint(
    task_id: str,
    project_id: str = Query(default=DEFAULT_PROJECT),
):
    if not delete_task(project_id, task_id):
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return {"ok": True}
