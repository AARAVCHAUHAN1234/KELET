import asyncio
from typing import Dict, Any

class SynthesisAgent:
    """Stub Synthesis / Quality Auditor – builds a final report from the context.
    In demo mode it assembles a concise markdown report.
    """

    def __init__(self, demo: bool = True):
        self.demo = demo

    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        if self.demo:
            # Pull together key sections from the mock context
            question = context.get("question", "")
            sources = context.get("sources", [])
            claims = context.get("claims", [])
            verification = context.get("verification", [])
            contradictions = context.get("contradictions", [])
            bias = context.get("bias", [])
            redteam = context.get("redteam", [])

            # Build a simple structured dict (could be rendered as markdown later)
            report = {
                "question": question,
                "executed_at": "demo",
                "sources": sources,
                "claims": claims,
                "verification": verification,
                "contradictions": contradictions,
                "bias_analysis": bias,
                "redteam_findings": redteam,
                "summary": "Demo report generated from deterministic mock agents.",
            }
            return report
        return {}
