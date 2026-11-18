import React from 'react';
import { useAppStore } from '../store/appStore';
import { 
  GitFork, 
  AlertTriangle, 
  Clock, 
  HelpCircle, 
  Scale, 
  CheckCircle,
  FileText
} from 'lucide-react';

export const ContradictionAnalysisPage: React.FC = () => {
  const { sessionData } = useAppStore();
  const contradictions = sessionData?.contradictions || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-[#34383B] pb-4">
        <h1 className="text-xl font-bold font-mono text-[#F0F1F2]">Contradiction & Divergence Intelligence</h1>
        <p className="text-xs text-[#70777D] font-mono">
          Detects empirical, temporal, definitional, and methodological conflicts between independent sources
        </p>
      </div>

      {/* Summary Banner */}
      <div className="bg-[#191B1D] border border-[#34383B] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E36F6F]/10 border border-[#E36F6F]/30 flex items-center justify-center text-[#E36F6F]">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold font-mono text-[#F0F1F2]">
              {contradictions.length} Active Contradictions Identified
            </div>
            <div className="text-xs text-[#70777D]">
              Sources disagree due to temporal baseline drift, differing definitions, or divergent sample populations.
            </div>
          </div>
        </div>

        <div className="text-right text-xs font-mono text-[#70777D]">
          Do not assume newest source is automatically accurate.
        </div>
      </div>

      {/* Contradiction Cards */}
      <div className="space-y-4">
        {contradictions.map((c) => (
          <div
            key={c.id}
            className="bg-[#191B1D] border border-[#34383B] rounded-xl p-5 space-y-4 shadow-sm"
          >
            {/* Header / Category */}
            <div className="flex items-center justify-between pb-2 border-b border-[#34383B]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#70777D]">[{c.id}]</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E36F6F]/10 text-[#E36F6F] border border-[#E36F6F]/30 uppercase font-semibold">
                  Conflict: {c.conflict_category}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  c.severity === 'critical' ? 'text-[#E36F6F] border-[#E36F6F]/30' : 'text-[#E3B45F] border-[#E3B45F]/30'
                }`}>
                  Severity: {c.severity}
                </span>
              </div>
            </div>

            {/* Side-by-Side Statements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Position A */}
              <div className="bg-[#101112] border border-[#34383B] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#70777D]">
                  <span className="text-[#6FA9DC] font-semibold">POSITION A</span>
                  <span>Source: {c.source_a_id}</span>
                </div>
                <p className="text-xs text-[#F0F1F2] leading-relaxed font-medium">
                  "{c.claim_a_text}"
                </p>
              </div>

              {/* Position B */}
              <div className="bg-[#101112] border border-[#34383B] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#70777D]">
                  <span className="text-[#E36F6F] font-semibold">POSITION B</span>
                  <span>Source: {c.source_b_id}</span>
                </div>
                <p className="text-xs text-[#F0F1F2] leading-relaxed font-medium">
                  "{c.claim_b_text}"
                </p>
              </div>
            </div>

            {/* Explanations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div className="space-y-1 bg-[#222528]/40 p-3 rounded-lg border border-[#34383B]/50">
                <span className="text-[10px] font-mono uppercase text-[#70777D] block">
                  Root Cause of Disagreement
                </span>
                <p className="text-[#A0A5AA] leading-relaxed">
                  {c.why_sources_disagree || 'Sources employ differing definitions or sample windows.'}
                </p>
              </div>

              <div className="space-y-1 bg-[#222528]/40 p-3 rounded-lg border border-[#34383B]/50">
                <span className="text-[10px] font-mono uppercase text-[#70777D] block">
                  Analytical Resolution Notes
                </span>
                <p className="text-[#A0A5AA] leading-relaxed">
                  {c.explanation || 'Recorded as an active empirical contradiction for red-team audit.'}
                </p>
              </div>
            </div>
          </div>
        ))}

        {contradictions.length === 0 && (
          <div className="p-12 text-center text-xs font-mono text-[#70777D] bg-[#191B1D] border border-[#34383B] rounded-xl space-y-2">
            <CheckCircle className="w-8 h-8 text-[#63C995] mx-auto" />
            <p className="text-[#F0F1F2] font-semibold">No Direct Contradictions Detected</p>
            <p>Retrieved source claims are either aligned or mutually non-exclusive.</p>
          </div>
        )}
      </div>
    </div>
  );
};
