"""
KELET – FastAPI Main Application
---------------------------------
REST + WebSocket endpoints for the multi-agent research platform.
All active research sessions are held in-memory.
Completed research data is persisted on the frontend via IndexedDB.
"""
import asyncio
import uuid
import os
import json
from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from app.config import settings
from app.models.schemas import (
    ResearchSession, StartResearchRequest, SystemSettings,
    AgentLog, ResearchReport, ReportType
)
from app.services.gemini_service import GeminiService
from app.services.search_service import SearchService
from app.services.report_service import ReportService
from app.services.document_service import DocumentService
from app.agents.pipeline import ResearchPipeline

# ──────────────────── Application Setup ──────────────────
app = FastAPI(
    title="KELET Multi-Agent Research Platform",
    description="Multi-agent research & fact-checking API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────── In-Memory State ──────────────────
sessions: Dict[str, ResearchSession] = {}
active_tasks: Dict[str, asyncio.Task] = {}
ws_connections: Dict[str, List[WebSocket]] = {}  # session_id -> list of websockets
runtime_settings = SystemSettings()

# ──────────────────── Service Factories ──────────────────
def get_gemini() -> GeminiService:
    api_key = runtime_settings.gemini_api_key or settings.GEMINI_API_KEY
    model = runtime_settings.model_name or settings.DEFAULT_MODEL
    return GeminiService(api_key=api_key, model_name=model)

def get_search() -> SearchService:
    tavily_key = runtime_settings.tavily_api_key or settings.TAVILY_API_KEY
    return SearchService(tavily_api_key=tavily_key if tavily_key else None)


# ──────────────────── WebSocket Log Broadcasting ──────────────────
async def broadcast_log(session_id: str, log: AgentLog):
    if session_id in ws_connections:
        payload = json.dumps({
            "type": "agent_log",
            "data": log.model_dump()
        })
        dead = []
        for ws in ws_connections[session_id]:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            ws_connections[session_id].remove(ws)

async def broadcast_status(session_id: str, status: str, session_data: dict = None):
    if session_id in ws_connections:
        payload = json.dumps({
            "type": "status_update",
            "data": {"status": status, "session": session_data}
        })
        dead = []
        for ws in ws_connections[session_id]:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            ws_connections[session_id].remove(ws)

# ──────────────────── API Routes ──────────────────

# --- Health Check ---
@app.get("/api/health")
async def health_check():
    gemini = get_gemini()
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "gemini_available": gemini.is_available,
        "demo_mode": runtime_settings.demo_mode or not gemini.is_available,
        "active_sessions": len(sessions),
        "active_tasks": len(active_tasks)
    }

# --- Settings ---
class UpdateSettingsRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None
    serpapi_api_key: Optional[str] = None
    default_depth: Optional[str] = None
    demo_mode: Optional[bool] = None
    max_sources: Optional[int] = None
    model_name: Optional[str] = None

@app.get("/api/settings")
async def get_settings():
    gemini = get_gemini()
    return {
        "gemini_configured": bool(runtime_settings.gemini_api_key or settings.GEMINI_API_KEY),
        "tavily_configured": bool(runtime_settings.tavily_api_key or settings.TAVILY_API_KEY),
        "demo_mode": runtime_settings.demo_mode or not gemini.is_available,
        "default_depth": runtime_settings.default_depth,
        "max_sources": runtime_settings.max_sources,
        "model_name": runtime_settings.model_name,
        "gemini_available": gemini.is_available
    }

@app.post("/api/settings")
async def update_settings(req: UpdateSettingsRequest):
    if req.gemini_api_key is not None:
        runtime_settings.gemini_api_key = req.gemini_api_key
    if req.tavily_api_key is not None:
        runtime_settings.tavily_api_key = req.tavily_api_key
    if req.serpapi_api_key is not None:
        runtime_settings.serpapi_api_key = req.serpapi_api_key
    if req.default_depth is not None:
        runtime_settings.default_depth = req.default_depth
    if req.demo_mode is not None:
        runtime_settings.demo_mode = req.demo_mode
    if req.max_sources is not None:
        runtime_settings.max_sources = req.max_sources
    if req.model_name is not None:
        runtime_settings.model_name = req.model_name
    return {"status": "updated"}

# --- Research Sessions ---
@app.post("/api/research/start")
async def start_research(req: StartResearchRequest):
    if not req.question or len(req.question.strip()) < 5:
        raise HTTPException(status_code=400, detail="Research question must be at least 5 characters")

    session_id = f"rs_{uuid.uuid4().hex[:12]}"
    session = ResearchSession(
        id=session_id,
        question=req.question.strip(),
        depth_mode=req.depth_mode,
        source_preference=req.source_preference,
        scope_region=req.scope_region or "Global"
    )
    sessions[session_id] = session

    gemini = get_gemini()
    search = get_search()

    async def log_callback(log: AgentLog):
        await broadcast_log(session_id, log)
        # Also broadcast session status
        await broadcast_status(session_id, session.status)

    pipeline = ResearchPipeline(session, gemini, search, on_log=log_callback)

    async def run_pipeline():
        try:
            await pipeline.run()
        except Exception as e:
            session.status = "failed"
            await broadcast_log(session_id, AgentLog(agent="orchestrator", action="pipeline_error", message=str(e), level="error"))
        finally:
            if session_id in active_tasks:
                del active_tasks[session_id]
            await broadcast_status(session_id, session.status, session.model_dump())

    task = asyncio.create_task(run_pipeline())
    active_tasks[session_id] = task

    return {"session_id": session_id, "status": "started", "question": session.question}

@app.get("/api/research/{session_id}")
async def get_research_session(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Research session not found")
    return sessions[session_id].model_dump()

@app.get("/api/research/{session_id}/status")
async def get_research_status(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Research session not found")
    s = sessions[session_id]
    return {
        "id": s.id,
        "status": s.status,
        "question": s.question,
        "sources_count": len(s.sources),
        "claims_count": len(s.claims),
        "contradictions_count": len(s.contradictions),
        "has_report": bool(s.reports),
        "subtasks": [st.model_dump() for st in s.subtasks]
    }

@app.get("/api/research")
async def list_sessions():
    return [
        {
            "id": s.id,
            "question": s.question,
            "status": s.status,
            "created_at": s.created_at,
            "sources_count": len(s.sources),
            "claims_count": len(s.claims),
            "depth_mode": s.depth_mode
        }
        for s in sessions.values()
    ]

@app.post("/api/research/{session_id}/pause")
async def pause_research(session_id: str):
    if session_id in active_tasks:
        active_tasks[session_id].cancel()
        del active_tasks[session_id]
    if session_id in sessions:
        sessions[session_id].status = "paused"
    return {"status": "paused"}

@app.delete("/api/research/{session_id}")
async def delete_session(session_id: str):
    if session_id in active_tasks:
        active_tasks[session_id].cancel()
        del active_tasks[session_id]
    if session_id in sessions:
        del sessions[session_id]
    return {"status": "deleted"}

# --- Sources ---
@app.get("/api/research/{session_id}/sources")
async def get_sources(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return [s.model_dump() for s in sessions[session_id].sources]

# --- Claims ---
@app.get("/api/research/{session_id}/claims")
async def get_claims(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return [c.model_dump() for c in sessions[session_id].claims]

# --- Contradictions ---
@app.get("/api/research/{session_id}/contradictions")
async def get_contradictions(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return [c.model_dump() for c in sessions[session_id].contradictions]

# --- Credibility ---
@app.get("/api/research/{session_id}/credibility")
async def get_credibility(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return [c.model_dump() for c in sessions[session_id].credibility_assessments]

# --- Skeptic Challenges ---
@app.get("/api/research/{session_id}/skeptic")
async def get_skeptic_challenges(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return [c.model_dump() for c in sessions[session_id].skeptic_challenges]

# --- Research Gaps ---
@app.get("/api/research/{session_id}/gaps")
async def get_research_gaps(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return [g.model_dump() for g in sessions[session_id].research_gaps]

# --- Logs ---
@app.get("/api/research/{session_id}/logs")
async def get_logs(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return [l.model_dump() for l in sessions[session_id].logs]

# --- Graph Data ---
@app.get("/api/research/{session_id}/graph")
async def get_graph(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    s = sessions[session_id]
    return {
        "nodes": [n.model_dump() for n in s.graph_nodes],
        "edges": [e.model_dump() for e in s.graph_edges]
    }

# --- Debate / Research Discussion ---
@app.get("/api/research/{session_id}/debate")
async def get_debate(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return [d.model_dump() for d in sessions[session_id].debate_history]

# --- Reports ---
@app.get("/api/research/{session_id}/report")
async def get_report(session_id: str, report_type: str = "comprehensive"):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    s = sessions[session_id]
    if report_type in s.reports:
        return s.reports[report_type].model_dump()
    raise HTTPException(status_code=404, detail=f"Report type '{report_type}' not generated yet")

@app.get("/api/research/{session_id}/report/export")
async def export_report(session_id: str, format: str = "markdown"):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    s = sessions[session_id]
    report = s.reports.get("comprehensive")
    if not report:
        raise HTTPException(status_code=404, detail="No report generated yet")

    export_dir = settings.EXPORT_DIR
    os.makedirs(export_dir, exist_ok=True)

    if format == "markdown":
        md_content = report.markdown_content or ReportService.generate_markdown(report, s)
        file_path = os.path.join(export_dir, f"kelet_report_{session_id}.md")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(md_content)
        return FileResponse(file_path, filename=f"kelet_report_{session_id}.md", media_type="text/markdown")

    elif format == "docx":
        file_path = os.path.join(export_dir, f"kelet_report_{session_id}.docx")
        ReportService.export_docx(report, s, file_path)
        return FileResponse(file_path, filename=f"kelet_report_{session_id}.docx", media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")

    elif format == "pdf":
        file_path = os.path.join(export_dir, f"kelet_report_{session_id}.pdf")
        ReportService.export_pdf(report, s, file_path)
        return FileResponse(file_path, filename=f"kelet_report_{session_id}.pdf", media_type="application/pdf")

    raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")

# --- Document Upload ---
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".csv", ".md"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type '{ext}' not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 20MB limit")

    file_id = f"doc_{uuid.uuid4().hex[:8]}"
    file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{ext}")
    with open(file_path, "wb") as f:
        f.write(content)

    result = DocumentService.process_file(file_path, file.filename or "document", file_id)
    if result["success"]:
        return {
            "file_id": file_id,
            "filename": file.filename,
            "source": result["source"].model_dump() if result["source"] else None,
            "passages_count": result["total_passages"],
            "total_pages": result.get("total_pages", 1)
        }
    raise HTTPException(status_code=500, detail=f"Failed to process document: {result.get('error', 'Unknown error')}")

# --- WebSocket for Live Updates ---
@app.websocket("/api/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    if session_id not in ws_connections:
        ws_connections[session_id] = []
    ws_connections[session_id].append(websocket)

    try:
        # Send current state if session exists
        if session_id in sessions:
            await websocket.send_text(json.dumps({
                "type": "initial_state",
                "data": {"status": sessions[session_id].status}
            }))

        # Keep connection alive
        while True:
            data = await websocket.receive_text()
            # Handle client messages (e.g., ping)
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        if session_id in ws_connections:
            ws_connections[session_id] = [ws for ws in ws_connections[session_id] if ws != websocket]
    except Exception:
        if session_id in ws_connections:
            ws_connections[session_id] = [ws for ws in ws_connections[session_id] if ws != websocket]

# --- Statistical Findings ---
@app.get("/api/research/{session_id}/statistics")
async def get_statistics(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return [s.model_dump() for s in sessions[session_id].statistical_findings]

# --- Bias Assessments ---
@app.get("/api/research/{session_id}/bias")
async def get_bias(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return [b.model_dump() for b in sessions[session_id].bias_assessments]
