import json
import os
from datetime import datetime, timezone
from typing import Optional
from models.schemas import Task, Project, Tag, Status

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "projects")


def _project_dir(project_id: str) -> str:
    return os.path.join(DATA_DIR, project_id)


def _tasks_dir(project_id: str) -> str:
    return os.path.join(_project_dir(project_id), "tasks")


def _project_file(project_id: str) -> str:
    return os.path.join(_project_dir(project_id), "project.json")


def _task_file(project_id: str, task_id: str) -> str:
    return os.path.join(_tasks_dir(project_id), f"{task_id}.json")


def ensure_project(project_id: str) -> None:
    os.makedirs(_tasks_dir(project_id), exist_ok=True)
    if not os.path.exists(_project_file(project_id)):
        project = Project(
            id=project_id,
            name="Untitled Project",
            tags=[
                Tag(name="场景", color="#1d4ed8"),
                Tag(name="组件", color="#be185d"),
                Tag(name="核心", color="#065f46"),
            ],
            createdAt=datetime.now(timezone.utc).isoformat(),
        )
        with open(_project_file(project_id), "w", encoding="utf-8") as f:
            json.dump(project.model_dump(), f, ensure_ascii=False, indent=2)


def get_project(project_id: str) -> Optional[Project]:
    path = _project_file(project_id)
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    tasks = list_tasks(project_id)
    data["tasks"] = tasks
    return Project(**data)


def list_tasks(project_id: str) -> list[Task]:
    tasks_dir = _tasks_dir(project_id)
    if not os.path.exists(tasks_dir):
        return []
    tasks = []
    for fname in sorted(os.listdir(tasks_dir)):
        if fname.endswith(".json"):
            with open(os.path.join(tasks_dir, fname), "r", encoding="utf-8") as f:
                data = json.load(f)
            tasks.append(Task(**data))
    return tasks


def get_task(project_id: str, task_id: str) -> Optional[Task]:
    path = _task_file(project_id, task_id)
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return Task(**data)


def save_task(project_id: str, task: Task) -> Task:
    path = _task_file(project_id, task.id)
    task.updatedAt = datetime.now(timezone.utc).isoformat()
    if not task.createdAt:
        task.createdAt = task.updatedAt
    with open(path, "w", encoding="utf-8") as f:
        json.dump(task.model_dump(), f, ensure_ascii=False, indent=2)
    return task


def delete_task(project_id: str, task_id: str) -> bool:
    path = _task_file(project_id, task_id)
    if os.path.exists(path):
        os.remove(path)
        return True
    return False
