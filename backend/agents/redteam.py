import asyncio
from typing import List, Dict, Any

class RedTeamAgent:
    """Stub Red‑Team / Skeptic Agent – challenges conclusions.
    Returns mock critical findings.
    """

    def __init__(self, demo: bool = True):
        self.demo = demo

    async def run(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        if self.demo:
            # Examine the synthesized insights and raise a generic challenge
            return [{
                "challenge": "Potential over‑reliance on a single academic source in the mock data.",
                "suggestion": "Seek additional peer‑reviewed studies to corroborate the claim."
            }]
        return []
