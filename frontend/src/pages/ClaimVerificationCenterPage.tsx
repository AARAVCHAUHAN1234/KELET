import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { 
  CheckCheck, 
  Check, 
  X, 
  AlertTriangle, 
  ExternalLink, 
  ShieldCheck, 
  Calendar,
  Layers
} from 'lucide-react';

export const ClaimVerificationCenterPage: React.FC = () => {
  const { sessionData } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const claims = sessionData?.claims || [];

  const filteredClaims = activeFilter === 'all'
    ? claims
    : claims.filter(c => c.verification_status.toLowerCase() === activeFilter.toLowerCase());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Supported':
        return <span className="px-2 py-0.5 rounded bg-[#63C995]/15 border border-[#63C995]/30 text-[#63C995] font-mono text-[10px] uppercase font-semibold">Supported</span>;
      case 'Contradicted':
      case 'Misleading':
        return <span className="px-2 py-0.5 rounded bg-[#E36F6F]/15 border border-[#E36F6F]/30 text-[#E36F6F] font-mono text-[10px] uppercase font-semibold">{status}</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-[#E3B45F]/15 border border-[#E3B45F]/30 text-[#E3B45F] font-mono text-[10px] uppercase font-semibold">{status}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#34383B] pb-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F0F1F2]">Claim Verification Center</h1>
          <p className="text-xs text-[#70777D] font-mono">Audited statement-by-statement verification verdicts, confidence calibration, and cross-source checks</p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-[#191B1D] border border-[#34383B] rounded-md p-1">
          {['all', 'Supported', 'Partially Supported', 'Contradicted', 'Unverified'].map((st) => (
            <button
              key={st}
              onClick={() => setActiveFilter(st)}
              className={`px-3 py-1 rounded text-[11px] font-mono transition-colors ${
                activeFilter === st 
                  ? 'bg-[#222528] text-[#F0F1F2] border border-[#34383B] font-semibold' 
                  : 'text-[#70777D] hover:text-[#A0A5AA]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Claims List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredClaims.map((claim) => (
          <div
            key={claim.id}
            className="bg-[#191B1D] border border-[#34383B] rounded-xl p-5 space-y-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#70777D]">[{claim.id}]</span>
                  {getStatusBadge(claim.verification_status)}
                  <span className="text-[10px] font-mono text-[#70777D]">
                    Confidence: {claim.confidence_score}%
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-[#F0F1F2] leading-snug">
                  {claim.text}
                </h3>
              </div>

              {/* Confidence Meter Bar */}
              <div className="w-32 shrink-0 space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-[#70777D]">
                  <span>Confidence</span>
                  <span>{claim.confidence_score}%</span>
                </div>
                <div className="w-full bg-[#101112] rounded-full h-1.5 overflow-hidden border border-[#34383B]">
                  <div 
                    className={`h-full ${
                      claim.confidence_score >= 70 ? 'bg-[#63C995]' :
                      claim.confidence_score >= 40 ? 'bg-[#E3B45F]' : 'bg-[#E36F6F]'
                    }`}
                    style={{ width: `${claim.confidence_score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Evidence & Quote */}
            {claim.original_quote && (
              <div className="bg-[#101112] border border-[#34383B] rounded-lg p-3 text-xs text-[#A0A5AA] italic">
                "{claim.original_quote}"
              </div>
            )}

            {/* Explanation and Source Attribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1 border-t border-[#34383B]/50">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#70777D] block mb-1">
                  Verification Explanation
                </span>
                <p className="text-[#A0A5AA] leading-relaxed">
                  {claim.explanation || 'Verification performed using retrieved independent evidence.'}
                </p>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#70777D] block mb-1">
                    Primary Attribution
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#F0F1F2] truncate">{claim.source_title || 'Document Source'}</span>
                    {claim.source_url && (
                      <a
                        href={claim.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-mono text-[#6FA9DC] hover:underline flex items-center gap-1"
                      >
                        <span>Source Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {claim.corroborating_source_ids && claim.corroborating_source_ids.length > 0 && (
                  <div className="text-[10px] font-mono text-[#63C995]">
                    Corroborated by: {claim.corroborating_source_ids.join(', ')}
                  </div>
                )}
                {claim.contradicting_source_ids && claim.contradicting_source_ids.length > 0 && (
                  <div className="text-[10px] font-mono text-[#E36F6F]">
                    Contradicted by: {claim.contradicting_source_ids.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredClaims.length === 0 && (
          <div className="p-12 text-center text-xs font-mono text-[#70777D] bg-[#191B1D] border border-[#34383B] rounded-xl">
            No claims found matching this verification filter.
          </div>
        )}
      </div>
    </div>
  );
};
