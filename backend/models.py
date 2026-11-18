from pydantic import BaseModel
from typing import List, Dict, Any

class ResearchRequest(BaseModel):
    question: str

class StatusResponse(BaseModel):
    task_id: str
    status: str

class ReportResponse(BaseModel):
    task_id: str
    report: Dict[str, Any]
