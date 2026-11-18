import React, { useState } from 'react';
import { useAppStore, Page } from '../store/appStore';
import { 
  Home, 
  LayoutDashboard, 
  Network, 
  FolderGit2, 
  Activity, 
  Compass, 
  CheckCheck, 
  GitFork, 
  Database, 
  Library, 
  FileSpreadsheet, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Shield,
  Radio,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { StartResearchModal } from './StartResearchModal';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'landing', label: 'Explore & Hero', icon: Home },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'workspace', label: 'Investigation Canvas', icon: Network },
  { id: 'projects', label: 'Projects Registry', icon: FolderGit2 },
  { id: 'agents', label: 'Swarm Telemetry', icon: Activity },
  { id: 'evidence', label: 'Evidence Explorer', icon: Compass },
  { id: 'claims', label: 'Claim Verification', icon: CheckCheck },
  { id: 'contradictions', label: 'Contradiction Intel', icon: GitFork },
  { id: 'sources', label: 'Source Intelligence', icon: Database },
  { id: 'library', label: 'Research Library', icon: Library },
  { id: 'reports', label: 'Reports & Exports', icon: FileSpreadsheet },
  { id: 'settings', label: 'Platform Settings', icon: Settings },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentPage, setPage, sidebarCollapsed, toggleSidebar, activeSessionId, sessionData } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-[#00EA64]/10 text-[#00EA64] border-[#00EA64]/40';
      case 'failed': return 'bg-danger/10 text-danger border-danger/40';
      case 'idle': return 'bg-raised text-text-muted border-border';
      default: return 'bg-[#00EA64]/10 text-[#00EA64] border-[#00EA64]/30 animate-pulse';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-text-primary font-sans antialiased selection:bg-[#00EA64]/30 selection:text-white">
      {/* Sidebar */}
      <aside 
        className={`flex flex-col bg-[#0A0A0A] border-r border-[#1F2421] transition-all duration-300 z-30 select-none ${
          sidebarCollapsed ? 'w-[70px]' : 'w-[260px]'
        }`}
      >
        {/* Brand Header — HackerRank style with bright green block logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-[#1F2421]/80">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage('landing')}>
              <div className="flex items-center font-bold text-lg tracking-tight text-white">
                <span>KELET</span>
                <span className="w-2.5 h-2.5 bg-[#00EA64] inline-block ml-0.5 rounded-[1px] shadow-[0_0_8px_#00EA64]"></span>
              </div>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#161819] text-text-muted border border-[#232729]">
                AI
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded bg-[#161819] border border-[#262A2D] flex items-center justify-center font-bold text-sm text-[#00EA64] shadow-[0_0_10px_rgba(0,234,100,0.2)]">
              K<span className="w-1.5 h-1.5 bg-[#00EA64] rounded-full inline-block ml-0.5"></span>
            </div>
          )}
          
          <button 
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-text-muted hover:text-white hover:bg-[#1A1D1F] transition-colors"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Green CTA */}
        <div className="p-3">
          <button
            onClick={() => setModalOpen(true)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#00EA64] hover:bg-[#00FF6A] text-black font-semibold text-xs transition-all shadow-[0_0_20px_-3px_rgba(0,234,100,0.4)] active:scale-[0.98] ${
              sidebarCollapsed ? 'p-2.5' : ''
            }`}
            title="Start New Investigation"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            {!sidebarCollapsed && <span className="tracking-tight">New Research</span>}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive 
                    ? 'bg-[#141815] text-[#00EA64] border border-[#00EA64]/30 shadow-[inset_0_0_12px_rgba(0,234,100,0.08)] font-semibold' 
                    : 'text-text-secondary hover:text-white hover:bg-[#151718]'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#00EA64]' : 'text-text-muted'}`} />
                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {!sidebarCollapsed && item.badge && (
                  <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1C2022] text-text-muted">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-3 border-t border-[#1F2421] text-[11px] text-text-muted">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono text-[10px]">
                <Shield className="w-3.5 h-3.5 text-[#00EA64]" />
                11-Agent Swarm
              </span>
              <span className="font-mono text-[10px] text-text-muted/70">v2.4</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <Shield className="w-4 h-4 text-[#00EA64]" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg">
        {/* Top Navbar — HackerRank dark aesthetic with navigation links & Green CTA */}
        <header className="h-16 bg-[#000000]/80 backdrop-blur-md border-b border-[#1F2421] flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-6 min-w-0">
            {/* Quick Breadcrumb / Current Topic */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs uppercase tracking-wider text-text-muted font-mono font-medium">
                Research Desk:
              </span>
              <div className="flex items-center gap-2 max-w-md truncate">
                <p className="text-xs text-white font-medium truncate">
                  {sessionData?.question || activeSessionId || 'Ready for investigation'}
                </p>
                {sessionData && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase ${getStatusColor(sessionData.status)}`}>
                    {sessionData.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top Right Action & Nav Items */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-5 text-xs text-text-secondary font-medium">
              <button onClick={() => setPage('workspace')} className="hover:text-white transition-colors">
                Workspace
              </button>
              <button onClick={() => setPage('agents')} className="hover:text-white transition-colors">
                Agents
              </button>
              <button onClick={() => setPage('evidence')} className="hover:text-white transition-colors">
                Evidence
              </button>
              <button onClick={() => setPage('reports')} className="hover:text-white transition-colors">
                Reports
              </button>
            </div>

            {sessionData && sessionData.status !== 'idle' && sessionData.status !== 'completed' && sessionData.status !== 'failed' && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00EA64]/10 border border-[#00EA64]/30 text-xs font-mono text-[#00EA64]">
                <Radio className="w-3.5 h-3.5 animate-pulse text-[#00EA64]" />
                <span>Live Swarm Running</span>
              </div>
            )}

            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#00EA64] hover:bg-[#00FF6A] text-black font-semibold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_-3px_rgba(0,234,100,0.3)] active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Launch Research</span>
            </button>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-auto bg-bg">
          {children}
        </main>
      </div>

      {/* Start Research Modal */}
      {modalOpen && (
        <StartResearchModal onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
};
