import os
import json
import sqlite3
from typing import Dict, Optional, List, Tuple

class TaskManager:
    """Manages in‑memory task state *and* persists final reports.
    Stores per‑agent status updates in the ``log`` list as dicts with
    ``agent`` and ``status`` keys.
    """

    def __init__(self):
        self._tasks: Dict[str, Dict] = {}
        # Base directory (backend folder)
        self.base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        # Directory for JSON report files
        self.reports_dir = os.path.join(self.base_dir, 'reports')
        os.makedirs(self.reports_dir, exist_ok=True)
        # SQLite DB for persistent storage
        self.db_path = os.path.join(self.base_dir, 'reports.db')
        self._init_db()

    # ---------------------------------------------------------------------
    # SQLite helpers
    # ---------------------------------------------------------------------
    def _init_db(self) -> None:
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS reports (
                    task_id TEXT PRIMARY KEY,
                    report_json TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.commit()
        finally:
            conn.close()

    def _save_report_to_db(self, task_id: str, report: Dict) -> None:
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute(
                "INSERT OR REPLACE INTO reports (task_id, report_json) VALUES (?, ?)",
                (task_id, json.dumps(report, ensure_ascii=False))
            )
            conn.commit()
        finally:
            conn.close()

    def _list_reports(self, offset: int, limit: int) -> List[Tuple[str, str]]:
        """Return a list of (task_id, created_at) tuples for pagination."""
        conn = sqlite3.connect(self.db_path)
        try:
            cur = conn.execute(
                "SELECT task_id, created_at FROM reports ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, offset)
            )
            return [(row[0], row[1]) for row in cur.fetchall()]
        finally:
            conn.close()

    # ---------------------------------------------------------------------
    # Public API used by FastAPI routes / orchestrator
    # ---------------------------------------------------------------------
    def create_task(self, task_id: str, status: str) -> None:
        self._tasks[task_id] = {"status": status, "report": None, "log": []}

    def update_status(self, task_id: str, status: str, agent: str | None = None) -> None:
        if task_id in self._tasks:
            self._tasks[task_id]["status"] = status
            entry = {"status": status}
            if agent:
                entry["agent"] = agent
            self._tasks[task_id]["log"].append(entry)

    def set_report(self, task_id: str, report: Dict) -> None:
        if task_id not in self._tasks:
            return
        self._tasks[task_id]["report"] = report
        self._tasks[task_id]["status"] = "completed"
        self._tasks[task_id]["log"].append({"status": "completed"})
        # --- JSON file ---------------------------------------------------
        try:
            json_path = os.path.join(self.reports_dir, f"{task_id}.json")
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(report, f, ensure_ascii=False, indent=2)
        except Exception as e:
            self._tasks[task_id]["log"].append({"json_error": str(e)})
        # --- SQLite ------------------------------------------------------
        try:
            self._save_report_to_db(task_id, report)
        except Exception as e:
            self._tasks[task_id]["log"].append({"db_error": str(e)})

    def get_status(self, task_id: str) -> Optional[str]:
        return self._tasks.get(task_id, {}).get("status")

    def get_report(self, task_id: str) -> Optional[Dict]:
        # In‑memory
        task = self._tasks.get(task_id)
        if task and task.get("report"):
            return task["report"]
        # JSON file fallback
        try:
            json_path = os.path.join(self.reports_dir, f"{task_id}.json")
            if os.path.isfile(json_path):
                with open(json_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception:
            pass
        # SQLite fallback
        conn = sqlite3.connect(self.db_path)
        try:
            cur = conn.execute("SELECT report_json FROM reports WHERE task_id = ?", (task_id,))
            row = cur.fetchone()
            if row:
                return json.loads(row[0])
        finally:
            conn.close()
        return None

    def get_log(self, task_id: str) -> List[Dict]:
        return self._tasks.get(task_id, {}).get("log", [])

    def list_reports(self, page: int = 1, page_size: int = 10) -> List[Tuple[str, str]]:
        """Convenience wrapper for the API – calculates offset and returns tuples."""
        offset = (page - 1) * page_size
        return self._list_reports(offset, page_size)
