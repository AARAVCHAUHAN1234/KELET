"""
KELET Multi-Agent Research Pipeline Engine
-------------------------------------------
Implements the full 11-agent research orchestration pipeline.
Agents perform actual reasoning tasks via LLM or deterministic analysis.
In demo mode, structured placeholder data is used instead of live APIs.
"""
import asyncio
import uuid
import json
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Callable, Awaitable
from app.models.schemas import (
    ResearchSession, ResearchStatus, AgentType, Source, Claim,
    Contradiction, SourceCredibilityDetail, BiasAssessment,
    StatisticalFinding, SkepticChallenge, ResearchGap,
    DebateExchange, AgentLog, ResearchPlanSubtask, ResearchReport,
    GraphNode, GraphEdge
)
from app.services.gemini_service import GeminiService
from app.services.search_service import SearchService

# ──────────────────── Helper to broadcast logs via WebSocket ──────────────────
LogCallback = Optional[Callable[[AgentLog], Awaitable[None]]]

def _log(session: ResearchSession, agent: AgentType, action: str, message: str, level: str = "info", details: Dict | None = None) -> AgentLog:
    entry = AgentLog(agent=agent, action=action, message=message, level=level, details=details)
    session.logs.append(entry)
    return entry


# ──────────────────── Agent Implementations ──────────────────

class BaseAgent:
    """Shared plumbing for every agent."""

    agent_type: AgentType = "orchestrator"

    def __init__(self, gemini: GeminiService, search: SearchService, session: ResearchSession, on_log: LogCallback = None):
        self.gemini = gemini
        self.search = search
        self.session = session
        self.on_log = on_log

    async def log(self, action: str, message: str, level: str = "info", details: Dict | None = None):
        entry = _log(self.session, self.agent_type, action, message, level, details)
        if self.on_log:
            await self.on_log(entry)

    def _subtask_id(self, label: str) -> str:
        return f"task_{self.agent_type}_{label}_{uuid.uuid4().hex[:6]}"

    def _update_subtask_status(self, task_id: str, status: str):
        for st in self.session.subtasks:
            if st.id == task_id:
                st.status = status
                break


# ──────────────────── Agent 1: Orchestrator ──────────────────
class OrchestratorAgent(BaseAgent):
    agent_type: AgentType = "orchestrator"

    async def analyze_question(self) -> Dict[str, Any]:
        """Decompose the research question into subtasks and a plan."""
        await self.log("analyze_question", f"Analyzing research question: {self.session.question}")

        if self.gemini.is_available:
            prompt = f"""Analyze the following complex research question and create a research plan.

Research Question: {self.session.question}
Research Mode: {self.session.depth_mode}
Source Preference: {self.session.source_preference}
Geographic Scope: {self.session.scope_region}

You MUST respond with a JSON object with these fields:
{{
  "analysis": "a 3-4 sentence analysis of the question's scope and complexity",
  "search_queries": ["list of 4-6 specific web search queries to investigate this question"],
  "sub_questions": ["3-5 specific sub-questions that need investigation"],
  "key_domains": ["relevant domains/fields like economics, medicine, technology"],
  "expected_claim_types": ["types of claims we expect to find, e.g. statistical, causal, definitional"]
}}"""
            result = await self.gemini.call_json(prompt, system_instruction="You are a research planning AI. Decompose complex questions into actionable research tasks. Never fabricate sources or data.")
            if result:
                await self.log("plan_created", f"Research plan created with {len(result.get('search_queries', []))} search queries", "success")
                return result

        # Demo fallback
        return {
            "analysis": f"The question \"{self.session.question}\" requires multi-source investigation including academic literature, government reports, news analysis, and expert perspectives.",
            "search_queries": [
                self.session.question,
                f"{self.session.question} research evidence",
                f"{self.session.question} statistics data",
                f"{self.session.question} expert analysis",
                f"{self.session.question} recent developments 2024",
            ],
            "sub_questions": [
                f"What is the current state of evidence regarding {self.session.question}?",
                f"What are the main competing perspectives on {self.session.question}?",
                f"What data and statistics are available about {self.session.question}?",
            ],
            "key_domains": ["general research"],
            "expected_claim_types": ["statistical", "causal", "definitional", "predictive"]
        }

    async def create_subtasks(self, plan: Dict[str, Any]):
        """Generate structured subtask entries from the plan."""
        subtasks = [
            ResearchPlanSubtask(id="st_discovery", title="Source Discovery", agent="discovery", status="pending", description="Search the web for relevant sources"),
            ResearchPlanSubtask(id="st_deep", title="Deep Research", agent="deep_research", status="pending", description="Investigate key sub-questions in depth", dependencies=["st_discovery"]),
            ResearchPlanSubtask(id="st_claims", title="Claim Extraction", agent="claim_extraction", status="pending", description="Extract verifiable claims from sources", dependencies=["st_discovery", "st_deep"]),
            ResearchPlanSubtask(id="st_verify", title="Fact Verification", agent="fact_verification", status="pending", description="Verify extracted claims against evidence", dependencies=["st_claims"]),
            ResearchPlanSubtask(id="st_credibility", title="Source Credibility", agent="source_credibility", status="pending", description="Evaluate the credibility of each source", dependencies=["st_discovery"]),
            ResearchPlanSubtask(id="st_contradiction", title="Contradiction Detection", agent="contradiction_detection", status="pending", description="Find conflicting claims across sources", dependencies=["st_claims"]),
            ResearchPlanSubtask(id="st_bias", title="Bias & Perspective Analysis", agent="bias_perspective", status="pending", description="Identify biases and missing perspectives", dependencies=["st_credibility"]),
            ResearchPlanSubtask(id="st_stats", title="Statistical Analysis", agent="statistical_analysis", status="pending", description="Validate numerical and statistical claims", dependencies=["st_claims"]),
            ResearchPlanSubtask(id="st_skeptic", title="Skeptic / Red-Team Review", agent="skeptic", status="pending", description="Challenge preliminary conclusions", dependencies=["st_verify", "st_contradiction"]),
            ResearchPlanSubtask(id="st_synthesis", title="Synthesis & Quality Audit", agent="synthesis_auditor", status="pending", description="Combine findings into final report", dependencies=["st_skeptic", "st_bias", "st_stats"]),
        ]
        self.session.subtasks = subtasks
        await self.log("subtasks_created", f"Created {len(subtasks)} research subtasks", "success")


# ──────────────────── Agent 2: Discovery Agent ──────────────────
class DiscoveryAgent(BaseAgent):
    agent_type: AgentType = "discovery"

    async def discover(self, queries: List[str], max_sources: int = 12) -> List[Source]:
        self._update_subtask_status("st_discovery", "running")
        await self.log("start_discovery", f"Beginning source discovery with {len(queries)} queries")

        all_sources: List[Source] = []
        seen_urls = set()

        for query in queries:
            await self.log("search_query", f"Searching: \"{query}\"")
            sources = await self.search.discover_sources(query, count=max_sources // len(queries) + 2)
            for s in sources:
                if s.url not in seen_urls:
                    seen_urls.add(s.url)
                    all_sources.append(s)
                    await self.log("source_found", f"[{s.source_type}] {s.title} ({s.publisher})", "success", {"url": s.url, "credibility": s.credibility_score})

        # Fetch webpage content for top sources
        content_fetched = 0
        for source in all_sources[:8]:
            if source.url.startswith("http"):
                content = await self.search.fetch_webpage_content(source.url)
                if content:
                    source.raw_content = content
                    content_fetched += 1
                    await self.log("content_fetched", f"Fetched content from {source.publisher}", "info")

        await self.log("discovery_complete", f"Discovered {len(all_sources)} unique sources, fetched content from {content_fetched}", "success")
        self._update_subtask_status("st_discovery", "completed")
        return all_sources[:max_sources]


# ──────────────────── Agent 3: Deep Research Agent ──────────────────
class DeepResearchAgent(BaseAgent):
    agent_type: AgentType = "deep_research"

    async def investigate(self, sub_questions: List[str], sources: List[Source]) -> Dict[str, Any]:
        self._update_subtask_status("st_deep", "running")
        await self.log("start_deep_research", f"Investigating {len(sub_questions)} sub-questions across {len(sources)} sources")

        context_texts = []
        for s in sources:
            if s.raw_content:
                context_texts.append(f"SOURCE [{s.id}] - {s.title} ({s.publisher}):\n{s.raw_content[:2000]}")
            else:
                context_texts.append(f"SOURCE [{s.id}] - {s.title} ({s.publisher}):\n{s.snippet}")

        context = "\n\n---\n\n".join(context_texts[:8])
        insights = {}

        if self.gemini.is_available:
            for sq in sub_questions:
                prompt = f"""You are a deep research analyst. You have the following research sources:

{context}

Sub-question to investigate: {sq}

Analyze the sources and provide a detailed JSON response:
{{
  "sub_question": "{sq}",
  "summary": "2-3 paragraph summary of findings",
  "key_insights": ["list of 3-5 specific insights found"],
  "perspectives_found": ["list of different viewpoints discovered"],
  "missing_information": "what information is still missing",
  "relevant_source_ids": ["list of source IDs that contribute to this answer"]
}}

IMPORTANT: Only reference information actually found in the provided sources. Do not fabricate any findings."""
                result = await self.gemini.call_json(prompt, system_instruction="You are a thorough research analyst. Only state findings actually present in the provided sources.")
                if result:
                    insights[sq] = result
                    await self.log("insight_found", f"Investigated: {sq[:60]}...", "success", {"key_insights_count": len(result.get("key_insights", []))})
        else:
            for sq in sub_questions:
                insights[sq] = {
                    "sub_question": sq,
                    "summary": f"[DEMO] Based on the {len(sources)} sources retrieved, this sub-question requires further investigation with live AI analysis.",
                    "key_insights": [f"Multiple sources address aspects of: {sq}"],
                    "perspectives_found": ["Academic perspective", "Policy perspective", "Industry perspective"],
                    "missing_information": "Live AI analysis required for comprehensive investigation.",
                    "relevant_source_ids": [s.id for s in sources[:3]]
                }

        self._update_subtask_status("st_deep", "completed")
        await self.log("deep_research_complete", f"Generated insights for {len(insights)} sub-questions", "success")
        return insights


# ──────────────────── Agent 4: Claim Extraction Agent ──────────────────
class ClaimExtractionAgent(BaseAgent):
    agent_type: AgentType = "claim_extraction"

    async def extract_claims(self, sources: List[Source]) -> List[Claim]:
        self._update_subtask_status("st_claims", "running")
        await self.log("start_extraction", f"Extracting verifiable claims from {len(sources)} sources")
        claims: List[Claim] = []
        claim_idx = 1

        for source in sources:
            content = source.raw_content or source.snippet
            if not content or len(content) < 50:
                continue

            if self.gemini.is_available:
                prompt = f"""You are a claim extraction specialist. Extract independently verifiable factual claims from the following source text.

Source: {source.title} ({source.publisher})
Source ID: {source.id}
Text:
{content[:3000]}

Extract claims as a JSON object:
{{
  "claims": [
    {{
      "text": "the factual claim statement",
      "original_quote": "exact text from the source supporting this claim",
      "is_numerical": true/false,
      "numerical_metrics": null or {{"value": 14.2, "unit": "%", "metric": "growth rate"}},
      "claim_type": "statistical" | "causal" | "definitional" | "comparative" | "predictive"
    }}
  ]
}}

Rules:
- Extract only verifiable factual statements, not opinions or interpretations
- Each claim must be independently checkable
- Preserve the original quote that supports each claim
- Flag numerical claims properly
- Extract 3-7 claims per source"""

                result = await self.gemini.call_json(prompt, system_instruction="You are a precise claim extraction specialist. Never invent claims. Only extract what is explicitly stated in the source text.")
                if result and "claims" in result:
                    for c_data in result["claims"]:
                        claim = Claim(
                            id=f"clm_{claim_idx:03d}",
                            text=c_data.get("text", ""),
                            original_quote=c_data.get("original_quote", ""),
                            source_id=source.id,
                            source_title=source.title,
                            source_url=source.url,
                            is_numerical=c_data.get("is_numerical", False),
                            numerical_metrics=c_data.get("numerical_metrics"),
                        )
                        claims.append(claim)
                        claim_idx += 1
                        await self.log("claim_extracted", f"Claim {claim.id}: {claim.text[:80]}...", "info")
            else:
                # Demo mode: extract sentence-level pseudo-claims from snippet
                sentences = [s.strip() for s in re.split(r'[.!?]', content) if len(s.strip()) > 30]
                for sent in sentences[:3]:
                    has_numbers = bool(re.search(r'\d+', sent))
                    claim = Claim(
                        id=f"clm_{claim_idx:03d}",
                        text=sent,
                        original_quote=sent,
                        source_id=source.id,
                        source_title=source.title,
                        source_url=source.url,
                        is_numerical=has_numbers,
                        verification_status="Unverified"
                    )
                    claims.append(claim)
                    claim_idx += 1

        self._update_subtask_status("st_claims", "completed")
        await self.log("extraction_complete", f"Extracted {len(claims)} verifiable claims from {len(sources)} sources", "success")
        return claims


# ──────────────────── Agent 5: Fact Verification Agent ──────────────────
class FactVerificationAgent(BaseAgent):
    agent_type: AgentType = "fact_verification"

    async def verify_claims(self, claims: List[Claim], sources: List[Source]) -> List[Claim]:
        self._update_subtask_status("st_verify", "running")
        await self.log("start_verification", f"Verifying {len(claims)} claims against {len(sources)} sources")

        source_map = {s.id: s for s in sources}
        all_evidence = "\n".join([
            f"[{s.id}] {s.title}: {(s.raw_content or s.snippet)[:500]}"
            for s in sources if (s.raw_content or s.snippet)
        ])

        for claim in claims:
            if self.gemini.is_available:
                prompt = f"""You are a fact verification agent. Verify the following claim against the available evidence.

CLAIM: {claim.text}
ORIGINAL SOURCE: [{claim.source_id}] {claim.source_title}
ORIGINAL QUOTE: {claim.original_quote}

AVAILABLE EVIDENCE FROM ALL SOURCES:
{all_evidence[:4000]}

Respond with a JSON object:
{{
  "verification_status": "Supported" | "Partially Supported" | "Contradicted" | "Unverified" | "Misleading" | "Outdated" | "Inconclusive",
  "confidence_score": 0-100,
  "explanation": "2-3 sentence explanation of why this status was assigned",
  "corroborating_source_ids": ["list of source IDs that support this claim"],
  "contradicting_source_ids": ["list of source IDs that contradict this claim"],
  "evidence_excerpts": ["brief quotes from supporting or contradicting sources"]
}}

Rules:
- Only mark as "Supported" if independent evidence corroborates the claim
- "Partially Supported" if some aspects are confirmed but not all
- "Contradicted" if evidence directly opposes the claim
- "Unverified" if no independent evidence is available
- Never fabricate evidence. Only reference what is in the provided sources."""

                result = await self.gemini.call_json(prompt, system_instruction="You are a rigorous fact checker. Never fabricate evidence. Only use information from the provided sources.")
                if result:
                    claim.verification_status = result.get("verification_status", "Unverified")
                    claim.confidence_score = max(0, min(100, result.get("confidence_score", 50)))
                    claim.explanation = result.get("explanation", "")
                    claim.corroborating_source_ids = result.get("corroborating_source_ids", [])
                    claim.contradicting_source_ids = result.get("contradicting_source_ids", [])
                    claim.evidence_excerpts = result.get("evidence_excerpts", [])
                    
                    level = "success" if claim.verification_status == "Supported" else "warning" if claim.verification_status in ["Partially Supported", "Unverified", "Inconclusive"] else "error"
                    await self.log("claim_verified", f"[{claim.verification_status}] {claim.text[:60]}... (confidence: {claim.confidence_score}%)", level)
            else:
                # Demo verification based on source count
                n_sources = len(sources)
                if n_sources >= 3:
                    claim.verification_status = "Partially Supported"
                    claim.confidence_score = 55
                else:
                    claim.verification_status = "Unverified"
                    claim.confidence_score = 30
                claim.explanation = f"[DEMO MODE] This claim requires live AI verification. {n_sources} sources available for cross-reference."

        self._update_subtask_status("st_verify", "completed")
        supported = sum(1 for c in claims if c.verification_status == "Supported")
        await self.log("verification_complete", f"Verified {len(claims)} claims: {supported} supported, {len(claims) - supported} require attention", "success")
        return claims


# ──────────────────── Agent 6: Contradiction Detection Agent ──────────────────
class ContradictionDetectionAgent(BaseAgent):
    agent_type: AgentType = "contradiction_detection"

    async def detect_contradictions(self, claims: List[Claim], sources: List[Source]) -> List[Contradiction]:
        self._update_subtask_status("st_contradiction", "running")
        await self.log("start_contradiction_analysis", f"Analyzing {len(claims)} claims for contradictions")
        contradictions: List[Contradiction] = []

        if len(claims) < 2:
            self._update_subtask_status("st_contradiction", "completed")
            await self.log("no_contradictions", "Insufficient claims to analyze contradictions", "info")
            return contradictions

        if self.gemini.is_available:
            claims_text = "\n".join([
                f"- Claim [{c.id}] (from Source [{c.source_id}] - {c.source_title}): {c.text}"
                for c in claims
            ])
            prompt = f"""You are a contradiction detection agent. Analyze the following claims and identify any that conflict with each other.

CLAIMS:
{claims_text}

Identify contradicting pairs and respond with a JSON object:
{{
  "contradictions": [
    {{
      "claim_a_id": "clm_xxx",
      "claim_b_id": "clm_yyy",
      "claim_a_text": "text of claim A",
      "claim_b_text": "text of claim B",
      "source_a_id": "src_xxx",
      "source_b_id": "src_yyy",
      "conflict_category": "temporal" | "methodological" | "definitional" | "geographic_population" | "empirical" | "interpretative",
      "severity": "critical" | "moderate" | "minor",
      "explanation": "clear explanation of the contradiction",
      "why_sources_disagree": "possible reasons for the disagreement (different time periods, methodologies, definitions, populations, etc.)"
    }}
  ]
}}

Rules:
- Only report genuine contradictions, not complementary information
- Do NOT assume the newest source is automatically correct
- Explain WHY the sources might disagree
- If no contradictions found, return {{"contradictions": []}}"""

            result = await self.gemini.call_json(prompt, system_instruction="You are a contradiction detection specialist. Be precise and only flag genuine conflicts.")
            if result and "contradictions" in result:
                for idx, c_data in enumerate(result["contradictions"], 1):
                    contradiction = Contradiction(
                        id=f"ctr_{idx:03d}",
                        claim_a_id=c_data.get("claim_a_id", ""),
                        claim_b_id=c_data.get("claim_b_id", ""),
                        claim_a_text=c_data.get("claim_a_text", ""),
                        claim_b_text=c_data.get("claim_b_text", ""),
                        source_a_id=c_data.get("source_a_id", ""),
                        source_b_id=c_data.get("source_b_id", ""),
                        conflict_category=c_data.get("conflict_category", "empirical"),
                        severity=c_data.get("severity", "moderate"),
                        explanation=c_data.get("explanation", ""),
                        why_sources_disagree=c_data.get("why_sources_disagree", "")
                    )
                    contradictions.append(contradiction)
                    await self.log("contradiction_found", f"[{contradiction.severity.upper()}] {contradiction.conflict_category}: {contradiction.explanation[:80]}...", "warning")

        self._update_subtask_status("st_contradiction", "completed")
        await self.log("contradiction_analysis_complete", f"Found {len(contradictions)} contradictions", "success" if len(contradictions) == 0 else "warning")
        return contradictions


# ──────────────────── Agent 7: Source Credibility Agent ──────────────────
class SourceCredibilityAgent(BaseAgent):
    agent_type: AgentType = "source_credibility"

    async def evaluate_credibility(self, sources: List[Source]) -> List[SourceCredibilityDetail]:
        self._update_subtask_status("st_credibility", "running")
        await self.log("start_credibility", f"Evaluating credibility of {len(sources)} sources")
        assessments: List[SourceCredibilityDetail] = []

        for source in sources:
            if self.gemini.is_available:
                prompt = f"""Evaluate the credibility of this source:

Source: {source.title}
Publisher: {source.publisher}
URL: {source.url}
Type: {source.source_type}
Published Date: {source.published_date}

Respond with JSON:
{{
  "publisher_authority": 0-100,
  "author_expertise": 0-100,
  "publication_freshness": 0-100,
  "methodology_score": 0-100,
  "conflict_of_interest_risk": "low" | "medium" | "high",
  "is_syndicated": true/false,
  "overall_score": 0-100,
  "rationale": "2-3 sentence explanation"
}}"""
                result = await self.gemini.call_json(prompt, system_instruction="You are a source credibility evaluator. Be realistic and evidence-based.")
                if result:
                    detail = SourceCredibilityDetail(
                        source_id=source.id,
                        source_title=source.title,
                        publisher_authority=result.get("publisher_authority", source.publisher_authority),
                        author_expertise=result.get("author_expertise", 60),
                        publication_freshness=result.get("publication_freshness", 70),
                        methodology_score=result.get("methodology_score", source.methodological_transparency),
                        conflict_of_interest_risk=result.get("conflict_of_interest_risk", "low"),
                        is_syndicated=result.get("is_syndicated", False),
                        overall_score=result.get("overall_score", source.credibility_score),
                        rationale=result.get("rationale", "")
                    )
                    assessments.append(detail)
                    source.credibility_score = detail.overall_score
                    source.is_syndicated = detail.is_syndicated
                    await self.log("credibility_evaluated", f"[{detail.overall_score}/100] {source.publisher} - {source.title[:50]}", "info")
                    continue

            # Deterministic fallback
            detail = SourceCredibilityDetail(
                source_id=source.id,
                source_title=source.title,
                publisher_authority=source.publisher_authority,
                author_expertise=65 if source.is_primary else 55,
                publication_freshness=75,
                methodology_score=source.methodological_transparency,
                conflict_of_interest_risk="low" if source.source_type in ["academic", "government"] else "medium",
                is_syndicated=False,
                overall_score=source.credibility_score,
                rationale=f"Source type '{source.source_type}' from publisher '{source.publisher}'. {'Primary source with higher inherent credibility.' if source.is_primary else 'Secondary source requiring cross-verification.'}"
            )
            assessments.append(detail)

        self._update_subtask_status("st_credibility", "completed")
        await self.log("credibility_complete", f"Evaluated {len(assessments)} sources", "success")
        return assessments


# ──────────────────── Agent 8: Bias & Perspective Agent ──────────────────
class BiasAgent(BaseAgent):
    agent_type: AgentType = "bias_perspective"

    async def analyze_bias(self, sources: List[Source], claims: List[Claim]) -> List[BiasAssessment]:
        self._update_subtask_status("st_bias", "running")
        await self.log("start_bias_analysis", "Analyzing sources for potential biases and missing perspectives")
        assessments: List[BiasAssessment] = []

        if self.gemini.is_available:
            source_summaries = "\n".join([
                f"- [{s.id}] {s.publisher} ({s.source_type}): {s.title}"
                for s in sources
            ])
            prompt = f"""You are a bias and perspective analyst. Analyze the following sources for potential biases.

Research Question: {self.session.question}

Sources:
{source_summaries}

Respond with JSON:
{{
  "assessments": [
    {{
      "source_id": "src_xxx",
      "bias_category": "commercial" | "institutional" | "methodological" | "ideological" | "neutral",
      "framing_description": "how this source frames the topic",
      "missing_perspectives": ["perspectives not represented by this source"],
      "confidence": 0-100
    }}
  ],
  "overall_missing_perspectives": ["perspectives missing from the entire source set"]
}}"""
            result = await self.gemini.call_json(prompt, system_instruction="You are an objective bias analyst.")
            if result and "assessments" in result:
                for a in result["assessments"]:
                    assessments.append(BiasAssessment(
                        source_id=a.get("source_id", ""),
                        bias_category=a.get("bias_category", "neutral"),
                        framing_description=a.get("framing_description", ""),
                        missing_perspectives=a.get("missing_perspectives", []),
                        confidence=a.get("confidence", 60)
                    ))
        else:
            for source in sources:
                cat = "neutral"
                if source.source_type == "news":
                    cat = "institutional"
                elif source.source_type == "industry":
                    cat = "commercial"
                assessments.append(BiasAssessment(
                    source_id=source.id,
                    bias_category=cat,
                    framing_description=f"Source from {source.publisher} ({source.source_type})",
                    missing_perspectives=["Requires live AI analysis for detailed bias assessment"]
                ))

        self._update_subtask_status("st_bias", "completed")
        await self.log("bias_analysis_complete", f"Analyzed {len(assessments)} sources for bias", "success")
        return assessments


# ──────────────────── Agent 9: Statistical Analysis Agent ──────────────────
class StatisticalAgent(BaseAgent):
    agent_type: AgentType = "statistical_analysis"

    async def analyze_statistics(self, claims: List[Claim]) -> List[StatisticalFinding]:
        self._update_subtask_status("st_stats", "running")
        numerical_claims = [c for c in claims if c.is_numerical]
        await self.log("start_stats", f"Analyzing {len(numerical_claims)} numerical claims")
        findings: List[StatisticalFinding] = []

        if not numerical_claims:
            self._update_subtask_status("st_stats", "completed")
            await self.log("no_numerical_claims", "No numerical claims found to analyze", "info")
            return findings

        if self.gemini.is_available:
            claims_text = "\n".join([
                f"- [{c.id}] {c.text} (Source: {c.source_title})"
                for c in numerical_claims
            ])
            prompt = f"""You are a statistical analysis agent. Evaluate the following numerical claims for accuracy and potential misleading comparisons.

NUMERICAL CLAIMS:
{claims_text}

For each claim, respond with JSON:
{{
  "findings": [
    {{
      "claim_id": "clm_xxx",
      "metric_label": "what is being measured",
      "reported_stat": "the statistic as reported",
      "verified_stat": "the correct figure if different, or null",
      "denominator_checked": true/false,
      "unit_consistency": true/false,
      "assessment": "valid" | "misleading_comparison" | "flawed_denominator" | "unverifiable" | "outdated_sample",
      "analysis_notes": "explanation of the statistical assessment"
    }}
  ]
}}"""
            result = await self.gemini.call_json(prompt, system_instruction="You are a statistical verification specialist.")
            if result and "findings" in result:
                for f_data in result["findings"]:
                    finding = StatisticalFinding(
                        id=f"stat_{len(findings)+1:03d}",
                        claim_id=f_data.get("claim_id", ""),
                        metric_label=f_data.get("metric_label", ""),
                        reported_stat=f_data.get("reported_stat", ""),
                        verified_stat=f_data.get("verified_stat"),
                        denominator_checked=f_data.get("denominator_checked", True),
                        unit_consistency=f_data.get("unit_consistency", True),
                        assessment=f_data.get("assessment", "unverifiable"),
                        analysis_notes=f_data.get("analysis_notes", "")
                    )
                    findings.append(finding)
        else:
            for c in numerical_claims:
                findings.append(StatisticalFinding(
                    id=f"stat_{len(findings)+1:03d}",
                    claim_id=c.id,
                    metric_label=c.text[:50],
                    reported_stat=c.text,
                    assessment="unverifiable",
                    analysis_notes="[DEMO] Numerical claim requires live AI analysis for statistical validation."
                ))

        self._update_subtask_status("st_stats", "completed")
        await self.log("stats_complete", f"Analyzed {len(findings)} statistical claims", "success")
        return findings


# ──────────────────── Agent 10: Skeptic / Red-Team Agent ──────────────────
class SkepticAgent(BaseAgent):
    agent_type: AgentType = "skeptic"

    async def challenge_conclusions(self, claims: List[Claim], contradictions: List[Contradiction]) -> List[SkepticChallenge]:
        self._update_subtask_status("st_skeptic", "running")
        supported_claims = [c for c in claims if c.verification_status == "Supported" or c.confidence_score > 60]
        await self.log("start_skeptic", f"Red-teaming {len(supported_claims)} preliminary conclusions")
        challenges: List[SkepticChallenge] = []

        if self.gemini.is_available and supported_claims:
            claims_text = "\n".join([
                f"- [{c.id}] {c.text} (Status: {c.verification_status}, Confidence: {c.confidence_score}%)"
                for c in supported_claims[:8]
            ])
            prompt = f"""You are a skeptic / red-team agent. Your job is to challenge the following preliminary research conclusions.

Research Question: {self.session.question}

PRELIMINARY SUPPORTED CONCLUSIONS:
{claims_text}

For each conclusion you challenge, respond with JSON:
{{
  "challenges": [
    {{
      "target_id": "clm_xxx",
      "target_text": "the claim being challenged",
      "challenge_argument": "your counterargument or challenge",
      "counterevidence_found": ["points that weaken the conclusion"],
      "unstated_assumptions": ["assumptions the claim relies on without stating"],
      "vulnerability_score": 0-100,
      "orchestrator_decision": "requires_further_investigation" | "accepted_with_caveats" | "dismissed_with_evidence"
    }}
  ]
}}

Rules:
- Challenge at least the top 2-3 most confident conclusions
- Identify unstated assumptions
- Search for counterevidence
- Be genuinely critical, not just contrarian"""

            result = await self.gemini.call_json(prompt, system_instruction="You are a rigorous skeptic agent. Challenge conclusions constructively with evidence-based critiques.")
            if result and "challenges" in result:
                for idx, ch in enumerate(result["challenges"], 1):
                    challenge = SkepticChallenge(
                        id=f"skp_{idx:03d}",
                        target_type="claim",
                        target_id=ch.get("target_id", ""),
                        target_text=ch.get("target_text", ""),
                        challenge_argument=ch.get("challenge_argument", ""),
                        counterevidence_found=ch.get("counterevidence_found", []),
                        unstated_assumptions=ch.get("unstated_assumptions", []),
                        vulnerability_score=ch.get("vulnerability_score", 50),
                        orchestrator_decision=ch.get("orchestrator_decision", "requires_further_investigation")
                    )
                    challenges.append(challenge)
                    await self.log("challenge_raised", f"Challenged claim {challenge.target_id}: vulnerability {challenge.vulnerability_score}%", "warning")
        else:
            for c in supported_claims[:3]:
                challenges.append(SkepticChallenge(
                    id=f"skp_{len(challenges)+1:03d}",
                    target_type="claim",
                    target_id=c.id,
                    target_text=c.text,
                    challenge_argument=f"[DEMO] This conclusion requires adversarial review. What counter-evidence exists?",
                    vulnerability_score=40,
                    orchestrator_decision="requires_further_investigation"
                ))

        self._update_subtask_status("st_skeptic", "completed")
        await self.log("skeptic_complete", f"Raised {len(challenges)} challenges against preliminary conclusions", "success")
        return challenges


# ──────────────────── Agent 11: Synthesis & Quality Auditor ──────────────────
class SynthesisAgent(BaseAgent):
    agent_type: AgentType = "synthesis_auditor"

    async def synthesize_report(self, session: ResearchSession) -> ResearchReport:
        self._update_subtask_status("st_synthesis", "running")
        await self.log("start_synthesis", "Synthesizing findings and generating final report")

        if self.gemini.is_available:
            # Build a comprehensive summary of all findings
            claims_summary = "\n".join([
                f"- [{c.id}] {c.text} → {c.verification_status} ({c.confidence_score}%)"
                for c in session.claims[:15]
            ])
            contradictions_summary = "\n".join([
                f"- {c.claim_a_text} vs {c.claim_b_text} ({c.conflict_category})"
                for c in session.contradictions
            ]) or "No contradictions detected."
            skeptic_summary = "\n".join([
                f"- Challenge to {sc.target_text[:50]}...: {sc.challenge_argument[:80]}..."
                for sc in session.skeptic_challenges
            ]) or "No skeptic challenges."

            prompt = f"""You are a research synthesis and quality audit agent. Generate a comprehensive research report.

RESEARCH QUESTION: {session.question}
DEPTH MODE: {session.depth_mode}
TOTAL SOURCES: {len(session.sources)}
TOTAL CLAIMS EXTRACTED: {len(session.claims)}

VERIFIED CLAIMS SUMMARY:
{claims_summary}

CONTRADICTIONS:
{contradictions_summary}

SKEPTIC CHALLENGES:
{skeptic_summary}

Generate a JSON report:
{{
  "title": "Report title",
  "executive_summary": "3-4 paragraph executive summary",
  "scope_and_methodology": "Description of research scope and methods used",
  "key_findings": ["5-8 key findings"],
  "source_credibility_summary": "Overall assessment of source quality",
  "statistical_findings_summary": "Summary of statistical validation",
  "skeptic_critique_summary": "Summary of red-team challenges and responses",
  "research_gaps_identified": ["gaps that remain"],
  "limitations": ["limitations of this research"],
  "unresolved_questions": ["questions still unanswered"],
  "final_verdict": "2-3 paragraph balanced final assessment"
}}

Rules:
- Be balanced and evidence-based
- Acknowledge uncertainty where it exists
- Do not overstate confidence
- Note limitations honestly
- Never fabricate findings"""

            result = await self.gemini.call_json(prompt, system_instruction="You are a meticulous research synthesis agent. Produce evidence-based reports with honest uncertainty assessments.")
            if result:
                report = ResearchReport(
                    id=f"rpt_{uuid.uuid4().hex[:8]}",
                    research_id=session.id,
                    title=result.get("title", f"Research Report: {session.question}"),
                    question=session.question,
                    executive_summary=result.get("executive_summary", ""),
                    scope_and_methodology=result.get("scope_and_methodology", ""),
                    key_findings=result.get("key_findings", []),
                    source_credibility_summary=result.get("source_credibility_summary", ""),
                    statistical_findings_summary=result.get("statistical_findings_summary", ""),
                    skeptic_critique_summary=result.get("skeptic_critique_summary", ""),
                    research_gaps_identified=result.get("research_gaps_identified", []),
                    limitations=result.get("limitations", []),
                    unresolved_questions=result.get("unresolved_questions", []),
                    final_verdict=result.get("final_verdict", "")
                )
                self._update_subtask_status("st_synthesis", "completed")
                await self.log("report_generated", "Final research report generated successfully", "success")
                return report

        # Demo fallback report
        report = ResearchReport(
            id=f"rpt_{uuid.uuid4().hex[:8]}",
            research_id=session.id,
            title=f"Research Report: {session.question}",
            question=session.question,
            executive_summary=f"This report investigates the question: \"{session.question}\". "
                              f"A total of {len(session.sources)} sources were discovered and analyzed. "
                              f"{len(session.claims)} factual claims were extracted and subjected to verification. "
                              f"{len(session.contradictions)} contradictions were identified between sources. "
                              f"The research employed multiple specialized agents for discovery, verification, "
                              f"contradiction detection, credibility assessment, and adversarial review.",
            scope_and_methodology=f"Research conducted using {session.depth_mode} mode with {session.source_preference} source preference. "
                                  f"Geographic scope: {session.scope_region}. Sources included web search results, academic papers, and institutional publications.",
            key_findings=[
                f"Analyzed {len(session.sources)} sources from diverse publishers",
                f"Extracted {len(session.claims)} verifiable claims",
                f"Detected {len(session.contradictions)} contradictions between sources",
                f"Red-team agent raised {len(session.skeptic_challenges)} challenges to preliminary conclusions",
                "Full AI-powered analysis requires a configured Gemini API key"
            ],
            source_credibility_summary=f"Source credibility scores ranged from {min((s.credibility_score for s in session.sources), default=0)} to {max((s.credibility_score for s in session.sources), default=0)}.",
            statistical_findings_summary=f"{len(session.statistical_findings)} numerical claims were flagged for statistical review.",
            skeptic_critique_summary=f"{len(session.skeptic_challenges)} adversarial challenges were raised against preliminary conclusions.",
            research_gaps_identified=["Full AI analysis required for comprehensive gap identification"],
            limitations=["Demo mode active — full AI reasoning requires a Gemini API key", "In-memory session data is not persisted on backend restart"],
            unresolved_questions=[f"Further investigation needed: {session.question}"],
            final_verdict=f"Based on the evidence gathered from {len(session.sources)} sources, "
                          f"the research question \"{session.question}\" requires careful consideration of "
                          f"multiple perspectives. {len(session.claims)} claims were analyzed with "
                          f"{sum(1 for c in session.claims if c.verification_status == 'Supported')} fully supported, "
                          f"{sum(1 for c in session.claims if c.verification_status == 'Partially Supported')} partially supported, "
                          f"and {sum(1 for c in session.claims if c.verification_status in ['Contradicted', 'Misleading'])} contradicted or misleading. "
                          f"A total of {len(session.contradictions)} contradictions were identified, suggesting areas of genuine scientific or factual disagreement."
        )
        self._update_subtask_status("st_synthesis", "completed")
        await self.log("report_generated", "Research report generated (demo mode)", "success")
        return report


# ──────────────────── Research Gap Detection ──────────────────
class GapDetector:
    @staticmethod
    def detect_gaps(session: ResearchSession) -> List[ResearchGap]:
        gaps: List[ResearchGap] = []
        gap_idx = 1

        # 1. Unverified critical claims
        unverified = [c for c in session.claims if c.verification_status == "Unverified"]
        if unverified:
            gaps.append(ResearchGap(
                id=f"gap_{gap_idx:03d}",
                gap_type="unverified_critical_claim",
                description=f"{len(unverified)} claims remain unverified and need additional evidence",
                suggested_investigation_query=f"{session.question} evidence verification",
                severity="high" if len(unverified) > 3 else "medium"
            ))
            gap_idx += 1

        # 2. Missing primary sources
        primary_count = sum(1 for s in session.sources if s.is_primary)
        if primary_count < 2:
            gaps.append(ResearchGap(
                id=f"gap_{gap_idx:03d}",
                gap_type="missing_primary_source",
                description="Insufficient primary sources — most evidence is from secondary sources",
                suggested_investigation_query=f"{session.question} primary research data study",
                severity="high"
            ))
            gap_idx += 1

        # 3. Unresolved contradictions
        unresolved = [c for c in session.contradictions if not c.is_resolved]
        if unresolved:
            gaps.append(ResearchGap(
                id=f"gap_{gap_idx:03d}",
                gap_type="conflicting_unresolved_statistics",
                description=f"{len(unresolved)} contradictions remain unresolved",
                suggested_investigation_query=f"{session.question} conflicting evidence resolution",
                severity="high" if any(c.severity == "critical" for c in unresolved) else "medium"
            ))
            gap_idx += 1

        # 4. Source type imbalance
        source_types = set(s.source_type for s in session.sources)
        if "academic" not in source_types:
            gaps.append(ResearchGap(
                id=f"gap_{gap_idx:03d}",
                gap_type="underrepresented_perspective",
                description="No academic sources found — research may lack peer-reviewed evidence",
                suggested_investigation_query=f"{session.question} academic peer reviewed",
                severity="medium"
            ))
            gap_idx += 1

        return gaps


# ──────────────────── Graph Builder ──────────────────
class GraphBuilder:
    @staticmethod
    def build_graph(session: ResearchSession) -> tuple[List[GraphNode], List[GraphEdge]]:
        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []

        # Question node (center top)
        nodes.append(GraphNode(
            id="q_root",
            type="questionNode",
            position={"x": 400, "y": 20},
            data={"label": session.question[:80], "status": session.status}
        ))

        # Subtask nodes
        for i, st in enumerate(session.subtasks):
            x = 100 + (i % 5) * 200
            y = 150 + (i // 5) * 160
            nodes.append(GraphNode(
                id=st.id,
                type="taskNode",
                position={"x": x, "y": y},
                data={"label": st.title, "agent": st.agent, "status": st.status, "description": st.description}
            ))
            edges.append(GraphEdge(
                id=f"e_q_{st.id}",
                source="q_root",
                target=st.id,
                animated=st.status == "running"
            ))

        # Source nodes
        for i, source in enumerate(session.sources[:10]):
            nodes.append(GraphNode(
                id=source.id,
                type="sourceNode",
                position={"x": 50 + (i % 5) * 220, "y": 500 + (i // 5) * 100},
                data={"label": source.title[:50], "publisher": source.publisher, "credibility": source.credibility_score, "type": source.source_type, "url": source.url}
            ))
            edges.append(GraphEdge(
                id=f"e_disc_{source.id}",
                source="st_discovery",
                target=source.id
            ))

        # Claim nodes
        for i, claim in enumerate(session.claims[:10]):
            color = {"Supported": "#63C995", "Contradicted": "#E36F6F", "Partially Supported": "#E3B45F"}.get(claim.verification_status, "#6FA9DC")
            nodes.append(GraphNode(
                id=claim.id,
                type="claimNode",
                position={"x": 50 + (i % 5) * 220, "y": 750 + (i // 5) * 100},
                data={"label": claim.text[:60], "status": claim.verification_status, "confidence": claim.confidence_score, "source_id": claim.source_id, "color": color}
            ))
            edges.append(GraphEdge(
                id=f"e_clm_{claim.id}_{claim.source_id}",
                source=claim.source_id,
                target=claim.id,
                label="extracted from"
            ))

        # Contradiction edges
        for c in session.contradictions:
            edges.append(GraphEdge(
                id=f"e_ctr_{c.id}",
                source=c.claim_a_id,
                target=c.claim_b_id,
                label="contradicts",
                style={"stroke": "#E36F6F", "strokeDasharray": "5,5"}
            ))

        # Report node
        if session.reports:
            nodes.append(GraphNode(
                id="report_final",
                type="reportNode",
                position={"x": 400, "y": 1000},
                data={"label": "Final Research Report", "status": "completed"}
            ))
            edges.append(GraphEdge(
                id="e_synthesis_report",
                source="st_synthesis",
                target="report_final"
            ))

        return nodes, edges


# ──────────────────── Main Pipeline Orchestrator ──────────────────
class ResearchPipeline:
    def __init__(self, session: ResearchSession, gemini: GeminiService, search: SearchService, on_log: LogCallback = None):
        self.session = session
        self.gemini = gemini
        self.search = search
        self.on_log = on_log

    async def run(self):
        """Execute the full multi-agent research pipeline."""
        try:
            self.session.status = "planning"
            # 1. Orchestrator: Analyze + Plan
            orchestrator = OrchestratorAgent(self.gemini, self.search, self.session, self.on_log)
            plan = await orchestrator.analyze_question()
            await orchestrator.create_subtasks(plan)

            queries = plan.get("search_queries", [self.session.question])
            sub_questions = plan.get("sub_questions", [self.session.question])

            # 2. Discovery Agent
            self.session.status = "discovering"
            discovery = DiscoveryAgent(self.gemini, self.search, self.session, self.on_log)
            sources = await discovery.discover(queries, max_sources=12)
            self.session.sources = sources

            # 3. Deep Research Agent
            self.session.status = "deep_researching"
            deep_research = DeepResearchAgent(self.gemini, self.search, self.session, self.on_log)
            await deep_research.investigate(sub_questions, sources)

            # 4. Claim Extraction Agent
            self.session.status = "extracting_claims"
            claim_agent = ClaimExtractionAgent(self.gemini, self.search, self.session, self.on_log)
            claims = await claim_agent.extract_claims(sources)
            self.session.claims = claims

            # 5. Fact Verification Agent
            self.session.status = "verifying"
            verify_agent = FactVerificationAgent(self.gemini, self.search, self.session, self.on_log)
            self.session.claims = await verify_agent.verify_claims(claims, sources)

            # 6. Source Credibility Agent
            self.session.status = "evaluating_credibility"
            cred_agent = SourceCredibilityAgent(self.gemini, self.search, self.session, self.on_log)
            self.session.credibility_assessments = await cred_agent.evaluate_credibility(sources)

            # 7. Contradiction Detection Agent
            self.session.status = "analyzing_contradictions"
            contra_agent = ContradictionDetectionAgent(self.gemini, self.search, self.session, self.on_log)
            self.session.contradictions = await contra_agent.detect_contradictions(self.session.claims, sources)

            # 8. Bias & Perspective Agent
            self.session.status = "evaluating_bias"
            bias_agent = BiasAgent(self.gemini, self.search, self.session, self.on_log)
            self.session.bias_assessments = await bias_agent.analyze_bias(sources, self.session.claims)

            # 9. Statistical Analysis Agent
            self.session.status = "statistical_review"
            stats_agent = StatisticalAgent(self.gemini, self.search, self.session, self.on_log)
            self.session.statistical_findings = await stats_agent.analyze_statistics(self.session.claims)

            # 10. Skeptic / Red-Team Agent
            self.session.status = "skeptic_review"
            skeptic = SkepticAgent(self.gemini, self.search, self.session, self.on_log)
            self.session.skeptic_challenges = await skeptic.challenge_conclusions(self.session.claims, self.session.contradictions)

            # 11. Research Gap Detection (deterministic)
            self.session.status = "gap_analysis"
            self.session.research_gaps = GapDetector.detect_gaps(self.session)

            # 12. Synthesis & Report Generation
            self.session.status = "synthesizing"
            synth = SynthesisAgent(self.gemini, self.search, self.session, self.on_log)
            report = await synth.synthesize_report(self.session)

            # Generate markdown content for the report
            from app.services.report_service import ReportService
            report.markdown_content = ReportService.generate_markdown(report, self.session)
            self.session.reports["comprehensive"] = report

            # Build research graph
            nodes, edges = GraphBuilder.build_graph(self.session)
            self.session.graph_nodes = nodes
            self.session.graph_edges = edges

            self.session.status = "completed"
            self.session.updated_at = datetime.now(timezone.utc).isoformat()

            if self.on_log:
                await self.on_log(AgentLog(agent="orchestrator", action="pipeline_complete", message="Research pipeline completed successfully", level="success"))

        except Exception as e:
            self.session.status = "failed"
            if self.on_log:
                await self.on_log(AgentLog(agent="orchestrator", action="pipeline_error", message=f"Pipeline failed: {str(e)}", level="error"))
            raise
