import asyncio
from typing import List, Dict, Any

class BiasAgent:
    """Stub Bias and Perspective Agent – returns mock bias analysis.
    """

    def __init__(self, demo: bool = True):
        self.demo = demo

    async def run(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        if self.demo:
            return [
                {"aspect": "Commercial bias", "description": "No commercial bias detected in the demo sources."},
                {"aspect": "Geographic bias", "description": "Sources span multiple regions; no dominant geographic bias."},
            ]
        return []
