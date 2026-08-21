from pydantic import BaseModel
from typing import Optional
from enum import Enum


class Status(str, Enum):
    planned = "planned"
    inprogress = "inprogress"
    pending = "pending"
    completed = "completed"
    blocked = "blocked"


class ReviewMode(str, Enum):
    human = "human"
    ai = "ai"


class LogEntry(BaseModel):
    timestamp: str
    message: str


class Evidence(BaseModel):
    type: str
    path: str
    description: str


class TaskBase(BaseModel):
    id: str
    title: str
    status: Status
    reviewMode: ReviewMode
    tags: list[str] = []
    dependencies: list[str] = []
    summary: str = ""


class Task(TaskBase):
    detailedLog: list[LogEntry] = []
    evidence: list[Evidence] = []
    createdAt: str = ""
    updatedAt: str = ""


class TaskCreate(BaseModel):
    id: str
    title: str
    status: Status = Status.planned
    reviewMode: ReviewMode = ReviewMode.human
    tags: list[str] = []
    dependencies: list[str] = []
    summary: str = ""


class TaskStatusUpdate(BaseModel):
    status: Status


class TaskLogAdd(BaseModel):
    summary: str
    detail: str


class EvidenceSubmit(BaseModel):
    type: str
    path: str
    description: str


class DependencyAdd(BaseModel):
    dependsOn: str


class Tag(BaseModel):
    name: str
    color: str


class Project(BaseModel):
    id: str
    name: str
    tasks: list[Task] = []
    tags: list[Tag] = []
    createdAt: str = ""


class ProjectConfig(BaseModel):
    name: str = "Untitled Project"
