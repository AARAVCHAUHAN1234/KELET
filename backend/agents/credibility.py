import asyncio
import json
from typing import List, Dict, Any
from .utils import gemini_generate

class CredibilityAgent:
    """Evaluates source credibility using Gemini.
    Demo mode returns a deterministic score; otherwise Gemini provides a short explanation.
    """

    def __init__(self, demo: bool = True):
        self.demo = demo

    async def run(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        if self.demo:
            sources = context.get('sources', [])
            results = []
            for src in sources:
                results.append({
                    'source': src,
                    'score': 0.85,
                    'explanation': 'Demo credibility evaluation assigns high trust to peer‑reviewed papers and reputable news outlets.'
                })
            return results
        # Real implementation: ask Gemini to score each source.
        sources = context.get('sources', [])
        results = []
        for src in sources:
            prompt = (
                f"You are evaluating the credibility of a source for academic research.\n"
                f"Source title: {src.get('title', 'N/A')}\n"
                f"URL: {src.get('url', 'N/A')}\n"
                f"Snippet: {src.get('snippet', '')}\n"
                "Provide a credibility score between 0 and 1 and a brief explanation. Return a JSON object with keys: score, explanation."
            )
            response = gemini_generate(prompt)
            try:
                result = json.loads(response)
            except Exception:
                result = {'score': 0.5, 'explanation': 'Could not parse Gemini output.'}
            results.append({
                'source': src,
                'score': result.get('score', 0.5),
                'explanation': result.get('explanation', '')
            })
        return results
