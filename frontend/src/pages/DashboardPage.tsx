import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import { StartResearchModal } from '../components/StartResearchModal';
import { 
  CheckCircle2, 
  Database, 
  GitFork, 
  ShieldAlert, 
  FileText, 
  ArrowUpRight, 
  Trash2, 
  PlusCircle,
  Activity,
  Server
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { setPage, setActiveSession, setSessionData } = useAppStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [sessList, health] = await Promise.all([
        api.listSessions().catch(() => []),
        api.health().catch(() => null)
      ]);
      setSessions(sessList);
      setSystemHealth(health);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSession = async (id: string) => {
    setActiveSession(id);
    try {
      const sess = await api.getSession(id);
      setSessionData(sess as any);
    } catch {}
    setPage('workspace');
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate aggregates
  const totalSources = sessions.reduce((acc, s) => acc + (s.sources_count || 0), 0);
  const totalClaims = sessions.reduce((acc, s) => acc + (s.claims_count || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F0F1F2]">Research Operations Dashboard</h1>
          <p className="text-xs text-[#70777D] font-mono">Overview of autonomous research pipelines, active investigations, and system telemetry</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-md bg-[#63C995] hover:bg-[#52B884] text-xs font-mono font-semibold text-[#101112] flex items-center gap-2 transition-all shadow-md"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Investigation</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#191B1D] border border-[#34383B] rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[#70777D]">
            <span className="text-[11px] font-mono uppercase tracking-wider">Active & Saved Investigations</span>
            <FileText className="w-4 h-4 text-[#6FA9DC]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F0F1F2]">{sessions.length}</div>
          <div className="text-[11px] text-[#A0A5AA] font-mono">All investigation sessions</div>
        </div>

        <div className="bg-[#191B1D] border border-[#34383B] rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[#70777D]">
            <span className="text-[11px] font-mono uppercase tracking-wider">Discovered External Sources</span>
            <Database className="w-4 h-4 text-[#63C995]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F0F1F2]">{totalSources}</div>
          <div className="text-[11px] text-[#A0A5AA] font-mono">Web, academic & primary docs</div>
        </div>

        <div className="bg-[#191B1D] border border-[#34383B] rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[#70777D]">
            <span className="text-[11px] font-mono uppercase tracking-wider">Extracted & Verified Claims</span>
            <CheckCircle2 className="w-4 h-4 text-[#E3B45F]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F0F1F2]">{totalClaims}</div>
          <div className="text-[11px] text-[#A0A5AA] font-mono">Fact-checked across sources</div>
        </div>

        <div className="bg-[#191B1D] border border-[#34383B] rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[#70777D]">
            <span className="text-[11px] font-mono uppercase tracking-wider">Backend System Status</span>
            <Server className="w-4 h-4 text-[#6FA9DC]" />
          </div>
          <div className="text-sm font-bold font-mono text-[#63C995] flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-[#63C995] animate-pulse"></span>
            <span>{systemHealth ? 'Online & Healthy' : 'Connecting...'}</span>
          </div>
          <div className="text-[10px] text-[#70777D] font-mono truncate">
            {systemHealth?.demo_mode ? 'Demo Mode Active' : 'Gemini AI Linked'}
          </div>
        </div>
      </div>

      {/* Investigations Table */}
      <div className="bg-[#191B1D] border border-[#34383B] rounded-xl overflow-hidden space-y-0">
        <div className="p-4 border-b border-[#34383B] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-mono font-bold text-[#F0F1F2] uppercase tracking-wider">
              Research Investigations Registry
            </h2>
            <p className="text-xs text-[#70777D]">Click an investigation to open its interactive research workspace</p>
          </div>
          <button 
            onClick={loadDashboard}
            className="text-xs font-mono text-[#A0A5AA] hover:text-[#F0F1F2] transition-colors"
          >
            Refresh
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Activity className="w-8 h-8 text-[#70777D] mx-auto" />
            <p className="text-sm text-[#A0A5AA] font-mono">No investigations found.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 rounded-md bg-[#222528] hover:bg-[#2C3033] border border-[#34383B] text-xs font-mono text-[#63C995] inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Start Your First Investigation</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#34383B]">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                onClick={() => handleOpenSession(sess.id)}
                className="p-4 hover:bg-[#222528]/50 cursor-pointer flex items-center justify-between gap-4 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#70777D] uppercase">[{sess.id}]</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222528] text-[#6FA9DC] border border-[#34383B] uppercase">
                      {sess.status}
                    </span>
                    <span className="text-[10px] font-mono text-[#70777D]">
                      {new Date(sess.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xs font-medium text-[#F0F1F2] truncate">
                    {sess.question}
                  </h3>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-[#70777D]">
                    <span>{sess.sources_count || 0} Sources</span>
                    <span>•</span>
                    <span>{sess.claims_count || 0} Claims</span>
                    <span>•</span>
                    <span className="capitalize">{sess.depth_mode} Mode</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="p-2 rounded hover:bg-[#101112] text-[#70777D] hover:text-[#E36F6F] transition-colors"
                    title="Delete investigation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-2 rounded bg-[#222528] text-[#A0A5AA] hover:text-[#F0F1F2]">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <StartResearchModal onClose={() => { setModalOpen(false); loadDashboard(); }} />
      )}
    </div>
  );
};
