import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { 
  Database, 
  ExternalLink, 
  ShieldCheck, 
  BookOpen, 
  Globe, 
  Layers, 
  Search, 
  Copy,
  Calendar,
  UserCheck
} from 'lucide-react';

export const SourceIntelligencePage: React.FC = () => {
  const { sessionData } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const sources = sessionData?.sources || [];

  const filteredSources = sources.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.publisher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || s.source_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#34383B] pb-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F0F1F2]">Source Intelligence & Credibility Registry</h1>
          <p className="text-xs text-[#70777D] font-mono">Inventory of discovered external citations, publisher authority benchmarks, and syndication deduplication</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#70777D]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search publishers or titles..."
              className="bg-[#191B1D] border border-[#34383B] focus:border-[#6FA9DC] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#F0F1F2] placeholder-[#70777D] focus:outline-none font-mono"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#191B1D] border border-[#34383B] rounded-md px-3 py-1.5 text-xs text-[#F0F1F2] font-mono focus:outline-none"
          >
            <option value="all">All Source Types</option>
            <option value="academic">Academic / Preprints</option>
            <option value="government">Government & Policy</option>
            <option value="news">News Publications</option>
            <option value="institutional">Institutional Reports</option>
            <option value="primary_document">Primary Documents</option>
          </select>
        </div>
      </div>

      {/* Sources Table / Cards */}
      <div className="space-y-3">
        {filteredSources.map((source) => (
          <div
            key={source.id}
            className="bg-[#191B1D] border border-[#34383B] rounded-xl p-4 space-y-3 shadow-sm hover:border-[#6FA9DC]/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#70777D]">[{source.id}]</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222528] text-[#6FA9DC] border border-[#34383B] uppercase">
                    {source.source_type}
                  </span>
                  {source.is_primary && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#63C995]/15 text-[#63C995] border border-[#63C995]/30 uppercase font-semibold">
                      Primary Source
                    </span>
                  )}
                  {source.is_syndicated && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E3B45F]/15 text-[#E3B45F] border border-[#E3B45F]/30 uppercase">
                      Syndicated Wire
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-[#F0F1F2]">
                  {source.title}
                </h3>

                <div className="flex items-center gap-3 text-[11px] font-mono text-[#70777D]">
                  <span>Publisher: <strong className="text-[#A0A5AA]">{source.publisher}</strong></span>
                  <span>•</span>
                  <span>Date: {source.published_date || 'Undated'}</span>
                  <span>•</span>
                  <span>Author: {source.author || 'Staff'}</span>
                </div>
              </div>

              {/* Credibility Score Box */}
              <div className="text-right shrink-0">
                <div className="text-xs font-mono text-[#70777D] uppercase">Credibility</div>
                <div className="text-xl font-bold font-mono text-[#63C995]">
                  {source.credibility_score}/100
                </div>
              </div>
            </div>

            {/* Snippet */}
            {source.snippet && (
              <p className="text-xs text-[#A0A5AA] bg-[#101112] p-3 rounded-lg border border-[#34383B] leading-relaxed line-clamp-3">
                {source.snippet}
              </p>
            )}

            {/* Footer / URL */}
            <div className="flex items-center justify-between pt-2 border-t border-[#34383B]/50 text-xs font-mono">
              <span className="text-[10px] text-[#70777D]">
                Crawled: {new Date(source.retrieved_at).toLocaleTimeString()}
              </span>

              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#6FA9DC] hover:underline flex items-center gap-1"
                >
                  <span className="truncate max-w-sm">{source.url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              )}
            </div>
          </div>
        ))}

        {filteredSources.length === 0 && (
          <div className="p-12 text-center text-xs font-mono text-[#70777D] bg-[#191B1D] border border-[#34383B] rounded-xl">
            No sources found in current investigation.
          </div>
        )}
      </div>
    </div>
  );
};
