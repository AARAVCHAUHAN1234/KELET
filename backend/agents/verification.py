import asyncio
from typing import List, Dict, Any
from .utils import gemini_generate
import json

class VerificationAgent:
    """Fact Verification Agent – uses Gemini to assess each claim.
    In demo mode assigns deterministic statuses; otherwise invokes Gemini.
    """

    def __init__(self, demo: bool = True):
        self.demo = demo

    async def run(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        if self.demo:
            claims = context.get('claims', [])
            results = []
            for claim in claims:
                status = 'Supported' if claim.get('type') == 'numerical' else 'Partially Supported'
                results.append({
                    'claim': claim['claim'],
                    'status': status,
                    'explanation': f'Demo verification marks this as {status.lower()}.',
                    'sources': [claim.get('evidence_source')] if claim.get('evidence_source') else [],
                })
            return results
        # Real implementation: ask Gemini to verify each claim against its source snippet.
        claims = context.get('claims', [])
        if not claims:
            raise ValueError('VerificationAgent: no claims provided')
        results = []
        for claim in claims:
            source = claim.get('evidence_source', {})
            source_snippet = source.get('snippet', '')
            prompt = (
                f"You are a fact‑checker. Verify the following claim using the provided source snippet.\n"
                f"Claim: {claim['claim']}\n"
                f"Source title: {source.get('title', 'N/A')}\n"
                f"Source URL: {source.get('url', 'N/A')}\n"
                f"Snippet: {source_snippet}\n"
                "Respond with a JSON object containing: status (Supported, Partially Supported, Contradicted, Unverified, Misleading, Outdated, Inconclusive), "
                "explanation, and any additional sources if needed."
            )
            response = gemini_generate(prompt)
            try:
                result = json.loads(response)
            except Exception:
                result = {
                    'status': 'Unverified',
                    'explanation': 'Gemini output could not be parsed as JSON.',
                    'sources': []
                }
            # Ensure required keys
            result.setdefault('claim', claim['claim'])
            results.append(result)
        return results
