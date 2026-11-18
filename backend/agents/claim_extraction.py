import asyncio
import json
from typing import List, Dict, Any
from .utils import gemini_generate


class ClaimExtractionAgent:
    """Extracts factual claims from the sources using Gemini.
    In demo mode returns mock claims; otherwise asks Gemini to list verifiable statements.
    """

    def __init__(self, demo: bool = True):
        self.demo = demo

    async def run(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        if self.demo:
            sources = context.get("sources", [])
            return [
                {
                    "claim": "The global AI market will exceed $500B by 2025.",
                    "evidence_source": sources[0] if sources else None,
                    "type": "numerical",
                },
                {
                    "claim": "OpenAI released GPT‑4 in March 2023.",
                    "evidence_source": sources[1] if len(sources) > 1 else None,
                    "type": "fact",
                },
            ]
        # Real implementation: ask Gemini to extract factual claims from the source snippets.
        sources = context.get('sources', [])
        if not sources:
            raise ValueError('ClaimExtractionAgent: no sources provided')
        # Build a prompt with titles and snippets.
        source_text = "\n".join([
            f"- {s.get('title')} ({s.get('url')}): {s.get('snippet', '')}" for s in sources
        ])
        prompt = (
            "You are an expert researcher. From the following list of source snippets, extract a "
            "list of individual factual, verifiable claims. For each claim, provide the claim text, "
            "the type (numerical/fact/opinion) and reference the source title and URL. "
            "Do not fabricate any information. Return a JSON array of objects with keys: claim, "
            "type, evidence_source (object with title and url).\n"
            f"Sources:\n{source_text}\n"
        )
        response = gemini_generate(prompt)
        try:
            claims = json.loads(response)
        except Exception:
            # Fallback: return empty list if Gemini output is not valid JSON.
            claims = []
        return claims
