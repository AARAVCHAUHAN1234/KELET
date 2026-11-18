
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
from models import ResearchRequest, StatusResponse, ReportResponse
from task_manager import TaskManager
from agents.orchestrator import OrchestratorAgent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

task_manager = TaskManager()

@app.post("/research", response_model=StatusResponse)
async def start_research(req: ResearchRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    task_manager.create_task(task_id, "queued")
    orchestrator = OrchestratorAgent(task_manager, task_id, req.question)
    background_tasks.add_task(orchestrator.run)
    return StatusResponse(task_id=task_id, status="queued")

@app.get("/research/{task_id}/status", response_model=StatusResponse)
async def get_status(task_id: str):
    status = task_manager.get_status(task_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return StatusResponse(task_id=task_id, status=status)

@app.get("/research/{task_id}/report", response_model=ReportResponse)
async def get_report(task_id: str):
    report = task_manager.get_report(task_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not ready")
    return ReportResponse(task_id=task_id, report=report)
