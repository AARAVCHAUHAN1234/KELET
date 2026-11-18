import asyncio
from typing import List, Dict, Any
from .utils import safe_search

class DiscoveryAgent:
    """Discovery Agent – performs a real web search using Bing (or fallback).
    Returns a list of source metadata dictionaries.
    """

    def __init__(self, demo: bool = True):
        self.demo = demo

    async def run(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        if self.demo:
            # deterministic mock data (used when demo flag is True)
            return [
                {"title": "Sample Academic Paper", "url": "https://example.com/paper1", "authors": ["Doe, J."], "year": 2023, "type": "paper"},
                {"title": "News Article on Topic", "url": "https://example.com/news", "authors": ["Smith, A."], "year": 2024, "type": "news"},
            ]
        # Real implementation – use the research question from context
        query = context.get('question', '')
        if not query:
            raise ValueError('DiscoveryAgent: no question provided in context')
        # Perform web search (may raise RuntimeError if API missing)
        results = safe_search(query)
        # Normalize result format to match mock structure
        sources = []
        for r in results:
            sources.append({
                "title": r.get('title'),
                "url": r.get('url'),
                "authors": [],  # not always available from search
                "year": None,
                "type": "web",
                "snippet": r.get('snippet'),
            })
        return sources
