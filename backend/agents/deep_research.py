import asyncio
from typing import List, Dict, Any
from .utils import gemini_generate

class DeepResearchAgent:
    """Deep Research Agent – uses Gemini to expand on sources.
    In demo mode it returns mock insights; otherwise it sends a prompt to Gemini.
    """

    def __init__(self, demo: bool = True):
        self.demo = demo

    async def run(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        if self.demo:
            return [
                {"insight": "Background on the topic reveals a growing trend since 2020.", "details": "..."},
                {"insight": "Key stakeholders include X, Y, and Z.", "details": "..."},
            ]
        # Real implementation: ask Gemini to synthesize a concise overview from the sources.
        sources = context.get('sources', [])
        if not sources:
            raise ValueError('DeepResearchAgent: no sources available')
        # Build a prompt that lists source titles and URLs.
        source_list = "\n".join([f"- {s.get('title')} ({s.get('url')})" for s in sources])
        prompt = (
            f"You are a researcher. Given the following list of sources about a topic,\n"
            f"provide a concise background summary (2-3 paragraphs) highlighting key trends,\n"
            f"historical context, and major stakeholders. Do not fabricate information,\n"
            f"only use the provided sources.\n"
            f"Sources:\n{source_list}\n"
        )
        text = gemini_generate(prompt)
        # Simple split into paragraphs for each insight.
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        return [{"insight": p, "details": ""} for p in paragraphs]
