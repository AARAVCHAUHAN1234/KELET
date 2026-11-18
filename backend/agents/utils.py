import os
import json
import hashlib
from pathlib import Path
import requests
from typing import List, Dict, Any

# Load API keys from environment variables
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
BING_API_KEY = os.getenv('BING_API_KEY')  # optional; if absent, Gemini fallback is used.

# ---------- Gemini LLM helper ----------
def gemini_generate(prompt: str) -> str:
    """Generate a response using Google Gemini.
    Returns the text response. Raises RuntimeError if the API key is missing.
    """
    if not GEMINI_API_KEY:
        raise RuntimeError('GEMINI_API_KEY not set in environment')
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(prompt)
    return response.text

# ---------- Simple Bing Web Search helper ----------
def bing_web_search(query: str, count: int = 5) -> List[Dict[str, Any]]:
    """Perform a web search using Bing Search API.
    Returns a list of result dicts with title, url, snippet.
    Raises RuntimeError if the API key is missing.
    """
    if not BING_API_KEY:
        raise RuntimeError('BING_API_KEY not set in environment')
    endpoint = 'https://api.bing.microsoft.com/v7.0/search'
    headers = {'Ocp-Apim-Subscription-Key': BING_API_KEY}
    params = {'q': query, 'count': count, 'responseFilter': 'Webpages'}
    resp = requests.get(endpoint, headers=headers, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    results: List[Dict[str, Any]] = []
    for item in data.get('webPages', {}).get('value', []):
        results.append({
            'title': item.get('name'),
            'url': item.get('url'),
            'snippet': item.get('snippet'),
        })
    return results

# ---------- Cache handling ----------
CACHE_DIR = Path(__file__).resolve().parent.parent / 'cache'
CACHE_DIR.mkdir(parents=True, exist_ok=True)
_search_cache: Dict[str, List[Dict[str, Any]]] = {}

def _cache_key(query: str) -> str:
    """Create a stable cache key for a query string."""
    return hashlib.sha256(query.encode('utf-8')).hexdigest()

def _load_from_file(key: str) -> List[Dict[str, Any]] | None:
    file_path = CACHE_DIR / f"{key}.json"
    if file_path.is_file():
        try:
            return json.loads(file_path.read_text())
        except Exception:
            return None
    return None

def _save_to_file(key: str, data: List[Dict[str, Any]]) -> None:
    file_path = CACHE_DIR / f"{key}.json"
    file_path.write_text(json.dumps(data, ensure_ascii=False, indent=2))

# ---------- Safe search with fallback and caching ----------
def safe_search(query: str) -> List[Dict[str, Any]]:
    """Try Bing first; if unavailable fall back to Gemini knowledge generation.
    Returns a list of source dicts. Results are cached in‑memory and on disk.
    """
    key = _cache_key(query)
    # Check in‑memory cache
    if key in _search_cache:
        return _search_cache[key]
    # Check persisted cache file
    cached = _load_from_file(key)
    if cached is not None:
        _search_cache[key] = cached
        return cached
    # Attempt Bing search
    try:
        results = bing_web_search(query)
    except Exception as e:
        # Bing failed – fall back to Gemini to suggest reputable sources (including DOI/publisher URLs when possible)
        if not GEMINI_API_KEY:
            raise RuntimeError(f'Web search failed (no API key) and Gemini fallback unavailable: {e}')
        prompt = (
            f"You are a researcher. For the query '{query}', list up to 5 reputable, publicly available sources such as peer‑reviewed papers, official reports, or major news articles. "
            "Provide each source as a JSON object with the keys: title, description, url (real URL if known, otherwise null), doi (if applicable, otherwise null). "
            "Do NOT fabricate URLs or DOIs that you are not certain exist."
        )
        response = gemini_generate(prompt)
        try:
            sources = json.loads(response)
        except Exception:
            sources = []
        results = []
        for s in sources:
            results.append({
                'title': s.get('title'),
                'url': s.get('url'),
                'authors': [],
                'year': None,
                'type': 'knowledge',
                'snippet': s.get('description', ''),
                'doi': s.get('doi'),
            })
    # Cache the results for future calls
    _search_cache[key] = results
    _save_to_file(key, results)
    return results
