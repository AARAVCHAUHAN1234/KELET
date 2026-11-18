import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { getLocalSessions, deleteLocalSession, clearLocalDatabase } from '../lib/db';
import { api } from '../lib/api';
import { 
  Library, 
  Search, 
  Trash2, 
  ExternalLink, 
  Download, 
  Upload, 
  Columns, 
  X,
  FileText
} from 'lucide-react';
import type { ResearchSession } from '../types';

export const ResearchLibraryPage: React.FC = () => {
  const { setActiveSession, setSessionData, setPage } = useAppStore();
  const [savedSessions, setSavedSessions] = useState<ResearchSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [compareA, setCompareA] = useState<ResearchSession | null>(null);
  const [compareB, setCompareB] = useState<ResearchSession | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    const list = await getLocalSessions();
    setSavedSessions(list);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteLocalSession(id);
    loadLibrary();
  };

  const handleOpen = (sess: ResearchSession) => {
    setActiveSession(sess.id);
    setSessionData(sess);
    setPage('workspace');
  };

  const handleExportJSON = (sess: ResearchSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sess, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kelet_investigation_${sess.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filtered = savedSessions.filter(s => 
    s.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#34383B] pb-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F0F1F2]">Research Library & Archive</h1>
          <p className="text-xs text-[#70777D] font-mono">
            Local-first IndexedDB archive of verified investigations, evidence packages, and comparative dossiers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#70777D]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search library..."
              className="bg-[#191B1D] border border-[#34383B] focus:border-[#6FA9DC] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#F0F1F2] placeholder-[#70777D] focus:outline-none font-mono"
            />
          </div>

          <button
            onClick={() => setIsComparing(!isComparing)}
            className={`px-3 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 border transition-colors ${
              isComparing 
                ? 'bg-[#6FA9DC] text-[#101112] border-[#6FA9DC] font-semibold' 
                : 'bg-[#191B1D] text-[#A0A5AA] border-[#34383B] hover:text-[#F0F1F2]'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Compare Mode</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Modal / Box */}
      {isComparing && (
        <div className="bg-[#191B1D] border-2 border-[#6FA9DC] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Columns className="w-4 h-4 text-[#6FA9DC]" />
              <h2 className="text-sm font-bold font-mono text-[#F0F1F2]">Comparative Investigation Matrix</h2>
            </div>
            <button onClick={() => setIsComparing(false)} className="text-[#70777D] hover:text-[#F0F1F2]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slot A */}
            <div className="bg-[#101112] border border-[#34383B] rounded-lg p-4 space-y-3">
              <span className="text-[10px] font-mono uppercase text-[#6FA9DC] block">Investigation Alpha</span>
              {compareA ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-[#F0F1F2]">{compareA.question}</h4>
                  <div className="text-[11px] font-mono text-[#70777D] space-y-1">
                    <div>Sources: {compareA.sources?.length || 0}</div>
                    <div>Claims: {compareA.claims?.length || 0}</div>
                    <div>Contradictions: {compareA.contradictions?.length || 0}</div>
                  </div>
                  <button onClick={() => setCompareA(null)} className="text-[10px] text-[#E36F6F] hover:underline font-mono">
                    Clear Selection
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[#70777D] italic">Select an investigation below to place in Alpha</p>
              )}
            </div>

            {/* Slot B */}
            <div className="bg-[#101112] border border-[#34383B] rounded-lg p-4 space-y-3">
              <span className="text-[10px] font-mono uppercase text-[#E3B45F] block">Investigation Beta</span>
              {compareB ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-[#F0F1F2]">{compareB.question}</h4>
                  <div className="text-[11px] font-mono text-[#70777D] space-y-1">
                    <div>Sources: {compareB.sources?.length || 0}</div>
                    <div>Claims: {compareB.claims?.length || 0}</div>
                    <div>Contradictions: {compareB.contradictions?.length || 0}</div>
                  </div>
                  <button onClick={() => setCompareB(null)} className="text-[10px] text-[#E36F6F] hover:underline font-mono">
                    Clear Selection
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[#70777D] italic">Select an investigation below to place in Beta</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved Investigations List */}
      <div className="space-y-3">
        {filtered.map((sess) => (
          <div
            key={sess.id}
            onClick={() => handleOpen(sess)}
            className="bg-[#191B1D] border border-[#34383B] hover:border-[#6FA9DC]/40 rounded-xl p-4 cursor-pointer flex items-center justify-between gap-4 transition-all"
          >
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#70777D]">[{sess.id}]</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222528] text-[#63C995] border border-[#34383B] uppercase">
                  {sess.status}
                </span>
                <span className="text-[10px] font-mono text-[#70777D]">
                  {new Date(sess.created_at).toLocaleDateString()}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-[#F0F1F2] truncate">
                {sess.question}
              </h3>

              <div className="flex items-center gap-4 text-[10px] font-mono text-[#70777D]">
                <span>{sess.sources?.length || 0} Sources</span>
                <span>•</span>
                <span>{sess.claims?.length || 0} Verified Claims</span>
                <span>•</span>
                <span>{sess.contradictions?.length || 0} Contradictions</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isComparing && (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setCompareA(sess)}
                    className="px-2 py-1 rounded bg-[#222528] text-[10px] font-mono text-[#6FA9DC] border border-[#34383B] hover:bg-[#2C3033]"
                  >
                    Set Alpha
                  </button>
                  <button
                    onClick={() => setCompareB(sess)}
                    className="px-2 py-1 rounded bg-[#222528] text-[10px] font-mono text-[#E3B45F] border border-[#34383B] hover:bg-[#2C3033]"
                  >
                    Set Beta
                  </button>
                </div>
              )}

              <button
                onClick={(e) => handleExportJSON(sess, e)}
                className="p-2 rounded hover:bg-[#222528] text-[#70777D] hover:text-[#F0F1F2] transition-colors"
                title="Export JSON Dossier"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => handleDelete(sess.id, e)}
                className="p-2 rounded hover:bg-[#222528] text-[#70777D] hover:text-[#E36F6F] transition-colors"
                title="Delete from Library"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-12 text-center text-xs font-mono text-[#70777D] bg-[#191B1D] border border-[#34383B] rounded-xl space-y-2">
            <Library className="w-8 h-8 text-[#70777D] mx-auto" />
            <p className="text-[#F0F1F2] font-semibold">No Investigations in Library Archive</p>
            <p>Completed research sessions automatically persist here in your browser's IndexedDB storage.</p>
          </div>
        )}
      </div>
    </div>
  );
};
