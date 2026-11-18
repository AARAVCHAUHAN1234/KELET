import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function statusColor(status: string): string {
  switch (status) {
    case 'Supported': return 'text-success';
    case 'Partially Supported': return 'text-warning';
    case 'Contradicted': case 'Misleading': return 'text-danger';
    case 'Unverified': case 'Inconclusive': case 'Outdated': return 'text-info';
    case 'completed': return 'text-success';
    case 'running': return 'text-info';
    case 'failed': return 'text-danger';
    default: return 'text-text-secondary';
  }
}

export function statusBg(status: string): string {
  switch (status) {
    case 'Supported': case 'completed': return 'bg-success/15 border-success/30';
    case 'Partially Supported': case 'running': return 'bg-warning/15 border-warning/30';
    case 'Contradicted': case 'Misleading': case 'failed': return 'bg-danger/15 border-danger/30';
    case 'Unverified': case 'Inconclusive': case 'Outdated': return 'bg-info/15 border-info/30';
    default: return 'bg-raised/60 border-border';
  }
}

export function agentLabel(agent: string): string {
  const labels: Record<string, string> = {
    orchestrator: 'Research Orchestrator',
    discovery: 'Discovery Agent',
    deep_research: 'Deep Research Agent',
    claim_extraction: 'Claim Extraction Agent',
    fact_verification: 'Fact Verification Agent',
    contradiction_detection: 'Contradiction Detection Agent',
    source_credibility: 'Source Credibility Agent',
    bias_perspective: 'Bias & Perspective Agent',
    statistical_analysis: 'Statistical Analysis Agent',
    skeptic: 'Skeptic / Red-Team Agent',
    synthesis_auditor: 'Synthesis & Quality Auditor',
  };
  return labels[agent] || agent;
}

export function agentIcon(agent: string): string {
  const icons: Record<string, string> = {
    orchestrator: '🔬',
    discovery: '🔍',
    deep_research: '📚',
    claim_extraction: '📋',
    fact_verification: '✅',
    contradiction_detection: '⚡',
    source_credibility: '🏛️',
    bias_perspective: '🔎',
    statistical_analysis: '📊',
    skeptic: '🛡️',
    synthesis_auditor: '📝',
  };
  return icons[agent] || '🤖';
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
