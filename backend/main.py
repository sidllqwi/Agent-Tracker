from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import tasks, projects

app = FastAPI(
    title="Agent-Tracker API",
    description="AI 项目进度追踪与可视化系统",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5563", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(projects.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
