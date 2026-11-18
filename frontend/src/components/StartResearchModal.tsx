import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import { X, Upload, Sparkles, Loader2, FileCheck, ArrowRight } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const TEMPLATES = [
  "Are solid-state batteries ready for commercial EV scale by 2026?",
  "Global microplastic dietary ingestion rates and physiological health risks",
  "Post-quantum cryptography migration deadlines and critical vulnerabilities",
  "Economic productivity impacts of generative AI on software engineering"
];

export const StartResearchModal: React.FC<Props> = ({ onClose }) => {
  const { setActiveSession, setPage, setSessionData, clearLogs } = useAppStore();
  const [question, setQuestion] = useState('');
  const [depthMode, setDepthMode] = useState<'fast' | 'comprehensive'>('comprehensive');
  const [sourcePref, setSourcePref] = useState('balanced');
  const [scopeRegion, setScopeRegion] = useState('Global');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const res = await api.uploadDocument(file);
      setUploadedFiles(prev => [...prev, { id: res.file_id, name: res.filename }]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Please provide a research question or hypothesis.');
      return;
    }

    setLoading(true);
    setError(null);
    clearLogs();

    try {
      const res = await api.startResearch({
        question: question.trim(),
        depth_mode: depthMode,
        source_preference: sourcePref,
        scope_region: scopeRegion
      });

      setActiveSession(res.session_id);
      const sess = await api.getSession(res.session_id);
      setSessionData(sess as any);
      setPage('workspace');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start research';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0A0D0B] border border-[#1F2C23] rounded-2xl max-w-2xl w-full shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1F2C23]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#141A16] border border-[#00EA64]/40 flex items-center justify-center text-[#00EA64] font-bold text-sm shadow-[0_0_10px_rgba(0,234,100,0.2)]">
              K
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">Initialize Multi-Agent Investigation</h2>
              <p className="text-xs text-[#71717A]">11 autonomous agents cross-examining live web sources</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-[#18201B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-medium">
              {error}
            </div>
          )}

          {/* Research Question Input */}
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] uppercase tracking-wider mb-2 font-mono">
              Research Question / Topic
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. 'What is the empirical efficacy of solid-state electrolyte batteries versus NMC lithium-ion?'"
              rows={3}
              className="w-full bg-[#050606] border border-[#1F2C23] focus:border-[#00EA64] rounded-xl p-3.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:ring-1 focus:ring-[#00EA64] resize-none transition-all"
            />
          </div>

          {/* Quick Suggestions */}
          <div>
            <span className="text-[11px] font-mono text-[#71717A] flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#00EA64]" />
              Sample Topics:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setQuestion(tmpl)}
                  className="text-left text-[11px] px-3 py-1.5 rounded-lg bg-[#101411] hover:bg-[#18201B] border border-[#1F2C23] hover:border-[#00EA64]/40 text-[#A1A1AA] hover:text-white transition-colors"
                >
                  {tmpl}
                </button>
              ))}
            </div>
          </div>

          {/* Parameter Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-mono text-[#A1A1AA] mb-1.5 uppercase">
                Investigation Depth
              </label>
              <select
                value={depthMode}
                onChange={(e) => setDepthMode(e.target.value as any)}
                className="w-full bg-[#050606] border border-[#1F2C23] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00EA64]"
              >
                <option value="comprehensive">Comprehensive (11 Agents)</option>
                <option value="fast">Fast (Core Verification)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#A1A1AA] mb-1.5 uppercase">
                Source Preference
              </label>
              <select
                value={sourcePref}
                onChange={(e) => setSourcePref(e.target.value)}
                className="w-full bg-[#050606] border border-[#1F2C23] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00EA64]"
              >
                <option value="balanced">Balanced (Academic & News)</option>
                <option value="academic_first">Academic / arXiv First</option>
                <option value="news_first">News & Institutional First</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#A1A1AA] mb-1.5 uppercase">
                Geographic Scope
              </label>
              <select
                value={scopeRegion}
                onChange={(e) => setScopeRegion(e.target.value)}
                className="w-full bg-[#050606] border border-[#1F2C23] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00EA64]"
              >
                <option value="Global">Global</option>
                <option value="North America">North America</option>
                <option value="European Union">European Union</option>
                <option value="Asia-Pacific">Asia-Pacific</option>
              </select>
            </div>
          </div>

          {/* Document Upload */}
          <div className="pt-3 border-t border-[#1F2C23]">
            <label className="block text-xs font-mono font-medium text-[#A1A1AA] uppercase tracking-wider mb-2">
              Attach Primary Documents (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#101411] hover:bg-[#18201B] border border-[#1F2C23] hover:border-[#00EA64]/40 text-xs text-[#A1A1AA] hover:text-white cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#00EA64]" />
                <span>Upload PDF / DOCX / CSV</span>
                <input 
                  type="file" 
                  accept=".pdf,.docx,.txt,.csv,.md" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
              {uploading && (
                <div className="flex items-center gap-1.5 text-xs text-[#00EA64]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Processing document...</span>
                </div>
              )}
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {uploadedFiles.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 text-xs font-mono text-[#00EA64] bg-[#141A16] px-3 py-1.5 rounded-lg border border-[#00EA64]/30">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{f.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1F2C23]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-xs font-medium text-[#71717A] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#00EA64] hover:bg-[#00FF6A] disabled:opacity-50 text-black font-semibold text-xs flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(0,234,100,0.35)] active:scale-95"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />}
              <span>Launch Swarm</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
