from __future__ import annotations
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime

# Enums & Literals
AgentType = Literal[
    "orchestrator",
    "discovery",
    "deep_research",
    "claim_extraction",
    "fact_verification",
    "contradiction_detection",
    "source_credibility",
    "bias_perspective",
    "statistical_analysis",
    "skeptic",
    "synthesis_auditor"
]

ResearchStatus = Literal[
    "idle",
    "planning",
    "discovering",
    "deep_researching",
    "extracting_claims",
    "verifying",
    "analyzing_contradictions",
    "evaluating_credibility",
    "evaluating_bias",
    "statistical_review",
    "skeptic_review",
    "gap_analysis",
    "synthesizing",
    "completed",
    "paused",
    "failed"
]

VerificationStatus = Literal[
    "Supported",
    "Partially Supported",
    "Contradicted",
    "Unverified",
    "Misleading",
    "Outdated",
    "Inconclusive"
]

SourceType = Literal[
    "academic",
    "government",
    "news",
    "institutional",
    "industry",
    "primary_document",
    "dataset",
    "general_web"
]

ConflictCategory = Literal[
    "temporal",
    "methodological",
    "definitional",
    "geographic_population",
    "empirical",
    "interpretative"
]

ReportType = Literal[
    "comprehensive",
    "executive_summary",
    "claim_verification",
    "contradiction_analysis",
    "source_credibility",
    "statistical_findings",
    "gap_report",
    "balanced_debate"
]

# Core Entities
class Source(BaseModel):
    id: str
    url: str
    title: str
    publisher: str
    author: Optional[str] = "Unknown"
    published_date: Optional[str] = "Undated"
    source_type: SourceType = "general_web"
    credibility_score: int = Field(default=50, ge=0, le=100)
    publisher_authority: int = Field(default=50, ge=0, le=100)
    methodological_transparency: int = Field(default=50, ge=0, le=100)
    is_primary: bool = False
    is_syndicated: bool = False
    syndication_root_id: Optional[str] = None
    snippet: str = ""
    raw_content: Optional[str] = None
    retrieved_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class Claim(BaseModel):
    id: str
    text: str
    original_quote: str = ""
    source_id: str
    source_title: Optional[str] = ""
    source_url: Optional[str] = ""
    page_number: Optional[int] = None
    paragraph_number: Optional[int] = None
    is_numerical: bool = False
    numerical_metrics: Optional[Dict[str, Any]] = None  # e.g. {"value": 14.2, "unit": "%", "metric": "growth"}
    verification_status: VerificationStatus = "Unverified"
    confidence_score: int = Field(default=50, ge=0, le=100)
    explanation: str = ""
    corroborating_source_ids: List[str] = Field(default_factory=list)
    contradicting_source_ids: List[str] = Field(default_factory=list)
    evidence_excerpts: List[str] = Field(default_factory=list)

class Contradiction(BaseModel):
    id: str
    claim_a_id: str
    claim_b_id: str
    claim_a_text: str
    claim_b_text: str
    source_a_id: str
    source_b_id: str
    conflict_category: ConflictCategory
    severity: Literal["critical", "moderate", "minor"] = "moderate"
    explanation: str
    why_sources_disagree: str
    is_resolved: bool = False
    resolution_notes: Optional[str] = None

class SourceCredibilityDetail(BaseModel):
    source_id: str
    source_title: str
    publisher_authority: int
    author_expertise: int
    publication_freshness: int
    methodology_score: int
    conflict_of_interest_risk: Literal["low", "medium", "high"] = "low"
    is_syndicated: bool = False
    syndicated_occurrences: int = 1
    overall_score: int
    rationale: str

class BiasAssessment(BaseModel):
    source_id: str
    bias_category: Literal["commercial", "institutional", "methodological", "ideological", "neutral"]
    framing_description: str
    missing_perspectives: List[str] = Field(default_factory=list)
    confidence: int = Field(default=60, ge=0, le=100)

class StatisticalFinding(BaseModel):
    id: str
    claim_id: str
    metric_label: str
    reported_stat: str
    verified_stat: Optional[str] = None
    denominator_checked: bool = True
    unit_consistency: bool = True
    assessment: Literal["valid", "misleading_comparison", "flawed_denominator", "unverifiable", "outdated_sample"]
    analysis_notes: str

class SkepticChallenge(BaseModel):
    id: str
    target_type: Literal["claim", "preliminary_conclusion", "methodology"]
    target_id: str
    target_text: str
    challenge_argument: str
    counterevidence_found: List[str] = Field(default_factory=list)
    unstated_assumptions: List[str] = Field(default_factory=list)
    vulnerability_score: int = Field(default=50, ge=0, le=100)  # how vulnerable the conclusion is
    orchestrator_decision: Literal["requires_further_investigation", "accepted_with_caveats", "dismissed_with_evidence"]

class ResearchGap(BaseModel):
    id: str
    gap_type: Literal[
        "insufficient_evidence",
        "missing_primary_source",
        "conflicting_unresolved_statistics",
        "outdated_dataset",
        "geographic_imbalance",
        "underrepresented_perspective",
        "unverified_critical_claim"
    ]
    description: str
    suggested_investigation_query: str
    severity: Literal["high", "medium", "low"] = "medium"
    can_auto_spawn: bool = True

class DebateExchange(BaseModel):
    id: str
    round: int
    speaker: AgentType
    role_description: str
    argument: str
    citations: List[str] = Field(default_factory=list)
    referenced_claim_ids: List[str] = Field(default_factory=list)

class AgentLog(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().strftime("%H:%M:%S"))
    agent: AgentType
    action: str
    message: str
    level: Literal["info", "success", "warning", "error"] = "info"
    details: Optional[Dict[str, Any]] = None

class ResearchPlanSubtask(BaseModel):
    id: str
    title: str
    agent: AgentType
    status: Literal["pending", "running", "completed", "failed", "skipped"] = "pending"
    description: str
    dependencies: List[str] = Field(default_factory=list)

class GraphNode(BaseModel):
    id: str
    type: str  # 'questionNode', 'taskNode', 'agentNode', 'sourceNode', 'claimNode', 'verificationNode', 'contradictionNode', 'reportNode'
    position: Dict[str, float]
    data: Dict[str, Any]

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    animated: Optional[bool] = False
    style: Optional[Dict[str, Any]] = None

class ResearchReport(BaseModel):
    id: str
    research_id: str
    title: str
    question: str
    report_type: ReportType = "comprehensive"
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    executive_summary: str
    scope_and_methodology: str
    key_findings: List[str] = Field(default_factory=list)
    evidence_backed_claims: List[Dict[str, Any]] = Field(default_factory=list)
    contradictions_identified: List[Dict[str, Any]] = Field(default_factory=list)
    source_credibility_summary: str
    statistical_findings_summary: str
    skeptic_critique_summary: str
    research_gaps_identified: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    unresolved_questions: List[str] = Field(default_factory=list)
    final_verdict: str
    bibliography: List[Dict[str, str]] = Field(default_factory=list)
    markdown_content: str = ""

class ResearchSession(BaseModel):
    id: str
    question: str
    status: ResearchStatus = "idle"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    depth_mode: Literal["fast", "comprehensive"] = "comprehensive"
    source_preference: Literal["academic_first", "balanced", "news_first"] = "balanced"
    scope_region: Optional[str] = "Global"
    subtasks: List[ResearchPlanSubtask] = Field(default_factory=list)
    sources: List[Source] = Field(default_factory=list)
    claims: List[Claim] = Field(default_factory=list)
    contradictions: List[Contradiction] = Field(default_factory=list)
    credibility_assessments: List[SourceCredibilityDetail] = Field(default_factory=list)
    bias_assessments: List[BiasAssessment] = Field(default_factory=list)
    statistical_findings: List[StatisticalFinding] = Field(default_factory=list)
    skeptic_challenges: List[SkepticChallenge] = Field(default_factory=list)
    research_gaps: List[ResearchGap] = Field(default_factory=list)
    debate_history: List[DebateExchange] = Field(default_factory=list)
    reports: Dict[ReportType, ResearchReport] = Field(default_factory=dict)
    active_report_type: ReportType = "comprehensive"
    logs: List[AgentLog] = Field(default_factory=list)
    graph_nodes: List[GraphNode] = Field(default_factory=list)
    graph_edges: List[GraphEdge] = Field(default_factory=list)

# API Request/Response Schemas
class StartResearchRequest(BaseModel):
    question: str
    depth_mode: Literal["fast", "comprehensive"] = "comprehensive"
    source_preference: Literal["academic_first", "balanced", "news_first"] = "balanced"
    scope_region: Optional[str] = "Global"
    uploaded_file_ids: List[str] = Field(default_factory=list)

class SystemSettings(BaseModel):
    gemini_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None
    serpapi_api_key: Optional[str] = None
    default_depth: Literal["fast", "comprehensive"] = "comprehensive"
    demo_mode: bool = False
    max_sources: int = 15
    model_name: str = "gemini-1.5-flash"
