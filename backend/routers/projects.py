from fastapi import APIRouter
from services.storage import get_project, ensure_project

router = APIRouter(prefix="/api", tags=["projects"])


@router.get("/projects/{project_id}")
def get_project_info(project_id: str):
    ensure_project(project_id)
    project = get_project(project_id)
    if not project:
        return {"id": project_id, "name": "Untitled", "tasks": [], "tags": []}
    return project.model_dump()


@router.post("/projects/{project_id}/init")
def init_project(project_id: str, name: str = "Untitled Project"):
    ensure_project(project_id)
    return {"ok": True, "project_id": project_id}
