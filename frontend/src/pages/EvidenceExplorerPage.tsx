import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { 
  Compass, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  BookOpen, 
  Quote
} from 'lucide-react';

export const EvidenceExplorerPage: React.FC = () => {
  const { sessionData } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const claims = sessionData?.claims || [];
  const sourcesMap = new Map((sessionData?.sources || []).map(s => [s.id, s]));

  const filteredClaims = claims.filter(c => {
    const matchesSearch = c.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.original_quote?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-[#34383B] pb-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F0F1F2]">Evidence Relationship Explorer</h1>
          <p className="text-xs text-[#70777D] font-mono">Trace granular factual statements to their supporting, contradicting, and primary source excerpts</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#70777D]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search claims or quotes..."
              className="bg-[#191B1D] border border-[#34383B] focus:border-[#6FA9DC] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#F0F1F2] placeholder-[#70777D] focus:outline-none font-mono"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#191B1D] border border-[#34383B] rounded-md px-3 py-1.5 text-xs text-[#F0F1F2] font-mono focus:outline-none"
          >
            <option value="all">All Verification Statuses</option>
            <option value="Supported">Supported</option>
            <option value="Partially Supported">Partially Supported</option>
            <option value="Contradicted">Contradicted</option>
            <option value="Unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Evidence Relationships List */}
      <div className="space-y-4">
        {filteredClaims.map((claim) => {
          const primarySource = sourcesMap.get(claim.source_id);

          return (
            <div
              key={claim.id}
              className="bg-[#191B1D] border border-[#34383B] rounded-xl p-5 space-y-4 shadow-sm"
            >
              {/* Claim Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#70777D] uppercase">[{claim.id}]</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                      claim.verification_status === 'Supported' ? 'text-[#63C995] border-[#63C995]/30 bg-[#63C995]/10' :
                      claim.verification_status === 'Contradicted' ? 'text-[#E36F6F] border-[#E36F6F]/30 bg-[#E36F6F]/10' :
                      'text-[#E3B45F] border-[#E3B45F]/30 bg-[#E3B45F]/10'
                    }`}>
                      {claim.verification_status}
                    </span>
                    <span className="text-[10px] font-mono text-[#70777D]">
                      Confidence: {claim.confidence_score}%
                    </span>
                    {claim.is_numerical && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#222528] text-[#6FA9DC] border border-[#34383B]">
                        Numerical Metric
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-semibold text-[#F0F1F2] leading-snug">
                    {claim.text}
                  </h3>
                </div>
              </div>

              {/* Evidence Passage Box */}
              {claim.original_quote && (
                <div className="bg-[#101112] border border-[#34383B] rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#6FA9DC] uppercase tracking-wider">
                    <Quote className="w-3 h-3" />
                    <span>Verbatim Evidence Excerpt</span>
                  </div>
                  <p className="text-xs text-[#A0A5AA] italic leading-relaxed">
                    "{claim.original_quote}"
                  </p>
                </div>
              )}

              {/* Rationale & Source References */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                <div className="space-y-1 bg-[#222528]/50 p-3 rounded-lg border border-[#34383B]/50">
                  <span className="text-[10px] font-mono uppercase text-[#70777D] block">Verification Rationale</span>
                  <p className="text-[#A0A5AA] leading-relaxed">
                    {claim.explanation || 'Claim evaluated across retrieved multi-source evidence.'}
                  </p>
                </div>

                <div className="space-y-1 bg-[#222528]/50 p-3 rounded-lg border border-[#34383B]/50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#70777D] block">Primary Source Attribution</span>
                    <div className="text-[#F0F1F2] font-medium truncate">
                      {claim.source_title || primarySource?.title || 'External Source'}
                    </div>
                    <div className="text-[11px] font-mono text-[#70777D]">
                      Publisher: {primarySource?.publisher || 'Web'} • Authority: {primarySource?.publisher_authority || 70}%
                    </div>
                  </div>

                  {claim.source_url && (
                    <a
                      href={claim.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-[#6FA9DC] hover:underline flex items-center gap-1 pt-1 truncate"
                    >
                      <span>Visit Source URL</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredClaims.length === 0 && (
          <div className="p-12 text-center text-xs font-mono text-[#70777D] bg-[#191B1D] border border-[#34383B] rounded-xl">
            No claims available for this investigation. Start an investigation from the dashboard.
          </div>
        )}
      </div>
    </div>
  );
};
