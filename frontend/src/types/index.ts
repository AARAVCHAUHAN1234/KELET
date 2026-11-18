// KELET Type Definitions — mirrors backend Pydantic schemas

export type AgentType =
  | 'orchestrator'
  | 'discovery'
  | 'deep_research'
  | 'claim_extraction'
  | 'fact_verification'
  | 'contradiction_detection'
  | 'source_credibility'
  | 'bias_perspective'
  | 'statistical_analysis'
  | 'skeptic'
  | 'synthesis_auditor';

export type ResearchStatus =
  | 'idle' | 'planning' | 'discovering' | 'deep_researching'
  | 'extracting_claims' | 'verifying' | 'analyzing_contradictions'
  | 'evaluating_credibility' | 'evaluating_bias' | 'statistical_review'
  | 'skeptic_review' | 'gap_analysis' | 'synthesizing'
  | 'completed' | 'paused' | 'failed';

export type VerificationStatus =
  | 'Supported' | 'Partially Supported' | 'Contradicted'
  | 'Unverified' | 'Misleading' | 'Outdated' | 'Inconclusive';

export type SourceType =
  | 'academic' | 'government' | 'news' | 'institutional'
  | 'industry' | 'primary_document' | 'dataset' | 'general_web';

export type ConflictCategory =
  | 'temporal' | 'methodological' | 'definitional'
  | 'geographic_population' | 'empirical' | 'interpretative';

export interface Source {
  id: string;
  url: string;
  title: string;
  publisher: string;
  author?: string;
  published_date?: string;
  source_type: SourceType;
  credibility_score: number;
  publisher_authority: number;
  methodological_transparency: number;
  is_primary: boolean;
  is_syndicated: boolean;
  snippet: string;
  retrieved_at: string;
}

export interface Claim {
  id: string;
  text: string;
  original_quote: string;
  source_id: string;
  source_title?: string;
  source_url?: string;
  page_number?: number;
  paragraph_number?: number;
  is_numerical: boolean;
  numerical_metrics?: Record<string, unknown>;
  verification_status: VerificationStatus;
  confidence_score: number;
  explanation: string;
  corroborating_source_ids: string[];
  contradicting_source_ids: string[];
  evidence_excerpts: string[];
}

export interface Contradiction {
  id: string;
  claim_a_id: string;
  claim_b_id: string;
  claim_a_text: string;
  claim_b_text: string;
  source_a_id: string;
  source_b_id: string;
  conflict_category: ConflictCategory;
  severity: 'critical' | 'moderate' | 'minor';
  explanation: string;
  why_sources_disagree: string;
  is_resolved: boolean;
}

export interface SkepticChallenge {
  id: string;
  target_type: string;
  target_id: string;
  target_text: string;
  challenge_argument: string;
  counterevidence_found: string[];
  unstated_assumptions: string[];
  vulnerability_score: number;
  orchestrator_decision: string;
}

export interface ResearchGap {
  id: string;
  gap_type: string;
  description: string;
  suggested_investigation_query: string;
  severity: 'high' | 'medium' | 'low';
}

export interface AgentLog {
  timestamp: string;
  agent: AgentType;
  action: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  details?: Record<string, unknown>;
}

export interface Subtask {
  id: string;
  title: string;
  agent: AgentType;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  description: string;
}

export interface ResearchReport {
  id: string;
  research_id: string;
  title: string;
  question: string;
  report_type: string;
  generated_at: string;
  executive_summary: string;
  scope_and_methodology: string;
  key_findings: string[];
  source_credibility_summary: string;
  statistical_findings_summary: string;
  skeptic_critique_summary: string;
  research_gaps_identified: string[];
  limitations: string[];
  unresolved_questions: string[];
  final_verdict: string;
  bibliography: { label: string; url: string }[];
  markdown_content: string;
}

export interface ResearchSession {
  id: string;
  question: string;
  status: ResearchStatus;
  created_at: string;
  updated_at: string;
  depth_mode: 'fast' | 'comprehensive';
  source_preference: string;
  scope_region: string;
  subtasks: Subtask[];
  sources: Source[];
  claims: Claim[];
  contradictions: Contradiction[];
  skeptic_challenges: SkepticChallenge[];
  research_gaps: ResearchGap[];
  logs: AgentLog[];
  reports: Record<string, ResearchReport>;
  graph_nodes: GraphNode[];
  graph_edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: Record<string, unknown>;
}
