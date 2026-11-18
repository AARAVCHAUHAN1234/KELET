import re
import ipaddress
import urllib.parse
from typing import List, Dict, Any, Optional
import httpx
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from app.models.schemas import Source, SourceType

# SSRF Protection: Prevent accessing internal IP addresses
PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

def is_safe_url(url: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = parsed.hostname
        if not hostname:
            return False
        if hostname.lower() in ("localhost", "127.0.0.1", "0.0.0.0", "::1"):
            return False
        # Try resolving IP if literal
        try:
            ip = ipaddress.ip_address(hostname)
            for net in PRIVATE_NETWORKS:
                if ip in net:
                    return False
        except ValueError:
            pass # Domain name, ok
        return True
    except Exception:
        return False

def classify_source_domain(url: str) -> SourceType:
    url_lower = url.lower()
    if any(ext in url_lower for ext in [".edu", ".ac.uk", "arxiv.org", "sciencedirect.com", "nature.com", "ieee.org", "springer.com", "nih.gov", "ncbi.nlm.nih.gov", "jstor.org"]):
        return "academic"
    if any(ext in url_lower for ext in [".gov", "who.int", "un.org", "oecd.org", "europa.eu", "worldbank.org", "imf.org", "cdc.gov", "fda.gov"]):
        return "government"
    if any(ext in url_lower for ext in ["reuters.com", "apnews.com", "bloomberg.com", "ft.com", "wsj.com", "bbc.com", "bbc.co.uk", "theguardian.com", "nytimes.com", "economist.com"]):
        return "news"
    if any(ext in url_lower for ext in ["dataset", "kaggle.com", "github.com", "data.gov", "statista.com"]):
        return "dataset"
    if any(ext in url_lower for ext in ["mckinsey.com", "gartner.com", "pwc.com", "deloitte.com", "iea.org"]):
        return "institutional"
    return "general_web"

def extract_publisher(url: str, title: str) -> str:
    try:
        parsed = urllib.parse.urlparse(url)
        domain = parsed.hostname or ""
        domain = re.sub(r"^www\.", "", domain)
        # Well known publishers
        mapping = {
            "reuters.com": "Reuters",
            "apnews.com": "Associated Press",
            "bloomberg.com": "Bloomberg",
            "nature.com": "Nature Publishing Group",
            "sciencedirect.com": "ScienceDirect / Elsevier",
            "arxiv.org": "arXiv.org (Cornell University)",
            "nih.gov": "National Institutes of Health (NIH)",
            "cdc.gov": "Centers for Disease Control and Prevention",
            "who.int": "World Health Organization (WHO)",
            "bbc.com": "BBC News",
            "bbc.co.uk": "BBC News",
            "theguardian.com": "The Guardian",
            "nytimes.com": "The New York Times",
            "wsj.com": "The Wall Street Journal",
            "ft.com": "Financial Times",
            "iea.org": "International Energy Agency (IEA)",
            "wikipedia.org": "Wikipedia Foundation",
        }
        for k, v in mapping.items():
            if k in domain:
                return v
        return domain.capitalize() if domain else "External Publisher"
    except Exception:
        return "External Publisher"

class SearchService:
    def __init__(self, tavily_api_key: Optional[str] = None):
        self.tavily_api_key = tavily_api_key

    def search_duckduckgo(self, query: str, max_results: int = 8) -> List[Dict[str, Any]]:
        results = []
        try:
            with DDGS() as ddgs:
                ddg_gen = ddgs.text(query, max_results=max_results)
                for r in ddg_gen:
                    url = r.get("href") or r.get("link") or ""
                    if url and is_safe_url(url):
                        results.append({
                            "title": r.get("title", ""),
                            "url": url,
                            "snippet": r.get("body", ""),
                            "source": "duckduckgo"
                        })
        except Exception as e:
            print(f"[SearchService] DuckDuckGo search error: {e}")
        return results

    async def search_wikipedia(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        results = []
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    "https://en.wikipedia.org/w/api.php",
                    params={
                        "action": "query",
                        "list": "search",
                        "srsearch": query,
                        "format": "json",
                        "srlimit": limit
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    search_items = data.get("query", {}).get("search", [])
                    for item in search_items:
                        title = item.get("title", "")
                        page_id = item.get("pageid", "")
                        snippet = BeautifulSoup(item.get("snippet", ""), "html.parser").get_text()
                        url = f"https://en.wikipedia.org/?curid={page_id}"
                        results.append({
                            "title": f"Wikipedia: {title}",
                            "url": url,
                            "snippet": snippet,
                            "source": "wikipedia"
                        })
        except Exception as e:
            print(f"[SearchService] Wikipedia search error: {e}")
        return results

    async def search_arxiv(self, query: str, max_results: int = 3) -> List[Dict[str, Any]]:
        results = []
        try:
            clean_q = re.sub(r"[^\w\s]", "", query)
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    "http://export.arxiv.org/api/query",
                    params={
                        "search_query": f"all:{clean_q}",
                        "start": 0,
                        "max_results": max_results
                    }
                )
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "xml")
                    entries = soup.find_all("entry")
                    for entry in entries:
                        title = entry.find("title").get_text().strip().replace("\n", " ") if entry.find("title") else "arXiv Research Paper"
                        summary = entry.find("summary").get_text().strip().replace("\n", " ") if entry.find("summary") else ""
                        id_elem = entry.find("id")
                        url = id_elem.get_text().strip() if id_elem else ""
                        pub_date = entry.find("published").get_text()[:10] if entry.find("published") else "Recent"
                        if url and is_safe_url(url):
                            results.append({
                                "title": f"[arXiv] {title}",
                                "url": url,
                                "snippet": summary[:400] + "...",
                                "published_date": pub_date,
                                "source": "arxiv"
                            })
        except Exception as e:
            print(f"[SearchService] arXiv search error: {e}")
        return results

    async def search_tavily(self, query: str, max_results: int = 6) -> List[Dict[str, Any]]:
        if not self.tavily_api_key:
            return []
        results = []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    "https://api.tavily.com/search",
                    json={
                        "api_key": self.tavily_api_key,
                        "query": query,
                        "search_depth": "advanced",
                        "max_results": max_results
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    for r in data.get("results", []):
                        url = r.get("url", "")
                        if url and is_safe_url(url):
                            results.append({
                                "title": r.get("title", ""),
                                "url": url,
                                "snippet": r.get("content", ""),
                                "published_date": r.get("published_date", ""),
                                "source": "tavily"
                            })
        except Exception as e:
            print(f"[SearchService] Tavily search error: {e}")
        return results

    async def fetch_webpage_content(self, url: str) -> Optional[str]:
        if not is_safe_url(url):
            return None
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 KELET-ResearchBot/1.0"
            }
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True, verify=False) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    # Remove scripts, styles, navs
                    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
                        tag.decompose()
                    paragraphs = [p.get_text().strip() for p in soup.find_all(["p", "article", "section"]) if len(p.get_text().strip()) > 40]
                    content = "\n\n".join(paragraphs[:15])
                    return content[:5000] if content else None
        except Exception as e:
            print(f"[SearchService] Failed to fetch content for {url}: {e}")
        return None

    async def discover_sources(self, query: str, count: int = 10, include_academic: bool = True) -> List[Source]:
        discovered_raw: List[Dict[str, Any]] = []
        
        # 1. Primary Tavily if available
        if self.tavily_api_key:
            tavily_res = await self.search_tavily(query, max_results=count)
            discovered_raw.extend(tavily_res)
            
        # 2. DuckDuckGo Search (Real web discovery)
        ddg_res = self.search_duckduckgo(query, max_results=count)
        discovered_raw.extend(ddg_res)

        # 3. Wikipedia knowledge integration
        wiki_res = await self.search_wikipedia(query, limit=2)
        discovered_raw.extend(wiki_res)

        # 4. Academic papers from arXiv if academic scope
        if include_academic:
            arxiv_res = await self.search_arxiv(query, max_results=3)
            discovered_raw.extend(arxiv_res)

        # Deduplicate by URL
        seen_urls = set()
        unique_sources: List[Source] = []
        source_idx = 1

        for item in discovered_raw:
            url = item.get("url", "")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)

            source_type = classify_source_domain(url)
            publisher = extract_publisher(url, item.get("title", ""))
            
            # Base credibility computation from domain authority
            credibility = 60
            if source_type == "academic":
                credibility = 92
            elif source_type == "government":
                credibility = 88
            elif source_type == "news" and publisher in ["Reuters", "Associated Press", "Bloomberg"]:
                credibility = 86
            elif source_type == "institutional":
                credibility = 80
            elif "wikipedia" in url:
                credibility = 74

            is_primary = source_type in ["academic", "government", "dataset"]
            
            # Generate deterministic source ID
            s_id = f"src_{source_idx:03d}"
            source_idx += 1

            source = Source(
                id=s_id,
                url=url,
                title=item.get("title", "Untitled Source"),
                publisher=publisher,
                author=item.get("author", "Editorial Staff" if source_type == "news" else "Research Contributor"),
                published_date=item.get("published_date", "2024-2025"),
                source_type=source_type,
                credibility_score=credibility,
                publisher_authority=credibility - 5,
                methodological_transparency=85 if is_primary else 65,
                is_primary=is_primary,
                snippet=item.get("snippet", ""),
                raw_content=None
            )
            unique_sources.append(source)
            if len(unique_sources) >= count:
                break

        return unique_sources
