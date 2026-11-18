import asyncio
from typing import List, Dict, Any

class ContradictionAgent:
    """Stub Contradiction Detection – returns empty list (no contradictions in demo).
    """

    def __init__(self, demo: bool = True):
        self.demo = demo

    async def run(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        if self.demo:
            # No contradictions in the mock data
            return []
        return []
