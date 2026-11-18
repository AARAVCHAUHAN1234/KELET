import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { clearLocalDatabase } from '../lib/db';
import { 
  Settings, 
  Key, 
  Search, 
  Sliders, 
  Trash2, 
  Save, 
  Check, 
  AlertCircle,
  Database,
  ShieldCheck,
  Server
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [geminiKey, setGeminiKey] = useState('');
  const [tavilyKey, setTavilyKey] = useState('');
  const [serpapiKey, setSerpapiKey] = useState('');
  const [depthMode, setDepthMode] = useState('comprehensive');
  const [demoMode, setDemoMode] = useState(false);
  const [modelName, setModelName] = useState('gemini-1.5-flash');
  
  const [saved, setSaved] = useState(false);
  const [clearedDb, setClearedDb] = useState(false);
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [settingsData, health] = await Promise.all([
        api.getSettings(),
        api.health()
      ]);
      setSystemHealth(health);
      if (settingsData) {
        setDepthMode(String(settingsData.default_depth || 'comprehensive'));
        setDemoMode(Boolean(settingsData.demo_mode));
        setModelName(String(settingsData.model_name || 'gemini-1.5-flash'));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        gemini_api_key: geminiKey || undefined,
        tavily_api_key: tavilyKey || undefined,
        serpapi_api_key: serpapiKey || undefined,
        default_depth: depthMode,
        demo_mode: demoMode,
        model_name: modelName
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      loadSettings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearDb = async () => {
    if (window.confirm("Are you sure you want to clear all locally cached IndexedDB investigations?")) {
      await clearLocalDatabase();
      setClearedDb(true);
      setTimeout(() => setClearedDb(false), 2500);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-[#34383B] pb-4">
        <h1 className="text-xl font-bold font-mono text-[#F0F1F2]">Settings & API Integrations</h1>
        <p className="text-xs text-[#70777D] font-mono">
          Configure external reasoning engines, search provider keys, research default bounds, and local-first storage
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* System Status Banner */}
        <div className="bg-[#191B1D] border border-[#34383B] rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-[#63C995]" />
            <div>
              <div className="text-xs font-mono font-semibold text-[#F0F1F2]">
                Backend Status: {systemHealth ? 'Connected (FastAPI :8000)' : 'Connecting...'}
              </div>
              <div className="text-[11px] font-mono text-[#70777D]">
                Gemini Available: {systemHealth?.gemini_available ? 'YES (Live API Key)' : 'NO (Heuristic Engine)'}
              </div>
            </div>
          </div>

          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
            systemHealth?.demo_mode ? 'bg-[#E3B45F]/15 text-[#E3B45F] border-[#E3B45F]/30' : 'bg-[#63C995]/15 text-[#63C995] border-[#63C995]/30'
          }`}>
            {systemHealth?.demo_mode ? 'Demo Mode Active' : 'Production Mode'}
          </span>
        </div>

        {/* AI Model Keys */}
        <div className="bg-[#191B1D] border border-[#34383B] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#34383B] text-xs font-mono font-semibold text-[#F0F1F2] uppercase tracking-wider">
            <Key className="w-4 h-4 text-[#6FA9DC]" />
            <span>AI Reasoning Provider (Google Gemini)</span>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#A0A5AA] mb-1.5">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy... (Leave empty to use GEMINI_API_KEY from .env or heuristic mode)"
              className="w-full bg-[#101112] border border-[#34383B] focus:border-[#6FA9DC] rounded-md px-3 py-2 text-xs text-[#F0F1F2] placeholder-[#70777D] focus:outline-none font-mono"
            />
            <span className="text-[11px] text-[#70777D] font-mono mt-1 block">
              If unset, the platform uses deterministic, grounded multi-agent reasoning on real search results.
            </span>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#A0A5AA] mb-1.5">
              Gemini Model Selection
            </label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full bg-[#101112] border border-[#34383B] rounded-md px-3 py-2 text-xs text-[#F0F1F2] font-mono focus:outline-none"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended: Fast & High Throughput)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Multi-Agent Reasoning)</option>
            </select>
          </div>
        </div>

        {/* Search Providers */}
        <div className="bg-[#191B1D] border border-[#34383B] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#34383B] text-xs font-mono font-semibold text-[#F0F1F2] uppercase tracking-wider">
            <Search className="w-4 h-4 text-[#63C995]" />
            <span>Search & Discovery Providers</span>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#A0A5AA] mb-1.5">
              Tavily Search API Key (Optional)
            </label>
            <input
              type="password"
              value={tavilyKey}
              onChange={(e) => setTavilyKey(e.target.value)}
              placeholder="tvly-... (Optional external search grounding)"
              className="w-full bg-[#101112] border border-[#34383B] focus:border-[#6FA9DC] rounded-md px-3 py-2 text-xs text-[#F0F1F2] placeholder-[#70777D] focus:outline-none font-mono"
            />
            <span className="text-[11px] text-[#70777D] font-mono mt-1 block">
              Default live web discovery runs through DuckDuckGo Search, arXiv, and Wikipedia APIs without keys.
            </span>
          </div>
        </div>

        {/* Research Pipeline Defaults */}
        <div className="bg-[#191B1D] border border-[#34383B] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#34383B] text-xs font-mono font-semibold text-[#F0F1F2] uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-[#E3B45F]" />
            <span>Pipeline Defaults</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#A0A5AA] mb-1.5">
                Default Research Depth
              </label>
              <select
                value={depthMode}
                onChange={(e) => setDepthMode(e.target.value)}
                className="w-full bg-[#101112] border border-[#34383B] rounded-md px-3 py-2 text-xs text-[#F0F1F2] font-mono focus:outline-none"
              >
                <option value="comprehensive">Comprehensive (11 Specialized Agents)</option>
                <option value="fast">Fast (Core Verification)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="demoModeToggle"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
                className="rounded border-[#34383B] text-[#6FA9DC] focus:ring-0 bg-[#101112] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="demoModeToggle" className="text-xs font-mono text-[#F0F1F2] cursor-pointer">
                Force Demo / Offline Mode
              </label>
            </div>
          </div>
        </div>

        {/* Browser Local Storage */}
        <div className="bg-[#191B1D] border border-[#34383B] rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#34383B] text-xs font-mono font-semibold text-[#F0F1F2] uppercase tracking-wider">
            <Database className="w-4 h-4 text-[#E36F6F]" />
            <span>Local-First Storage Maintenance</span>
          </div>

          <p className="text-xs text-[#A0A5AA]">
            Investigations and research graphs are saved locally in your browser's IndexedDB. You can clear them anytime.
          </p>

          <button
            type="button"
            onClick={handleClearDb}
            className="px-3.5 py-2 rounded bg-[#222528] hover:bg-[#E36F6F]/20 border border-[#34383B] hover:border-[#E36F6F]/50 text-xs font-mono text-[#E36F6F] flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{clearedDb ? 'IndexedDB Cleared!' : 'Clear All Local Investigations'}</span>
          </button>
        </div>

        {/* Save CTA */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="text-xs font-mono text-[#63C995] flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Settings Saved Successfully</span>
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-[#63C995] hover:bg-[#52B884] text-xs font-mono font-semibold text-[#101112] flex items-center gap-2 transition-all shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
