import { create } from 'zustand';
import type { ResearchSession, AgentLog } from '../types';

export type Page =
  | 'landing'
  | 'dashboard'
  | 'workspace'
  | 'projects'
  | 'agents'
  | 'evidence'
  | 'claims'
  | 'contradictions'
  | 'sources'
  | 'library'
  | 'reports'
  | 'settings';

interface AppState {
  currentPage: Page;
  setPage: (page: Page) => void;

  activeSessionId: string | null;
  setActiveSession: (id: string | null) => void;

  sessionData: ResearchSession | null;
  setSessionData: (data: ResearchSession | null) => void;

  liveLogs: AgentLog[];
  addLog: (log: AgentLog) => void;
  clearLogs: () => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'landing',
  setPage: (page) => set({ currentPage: page }),

  activeSessionId: null,
  setActiveSession: (id) => set({ activeSessionId: id }),

  sessionData: null,
  setSessionData: (data) => set({ sessionData: data }),

  liveLogs: [],
  addLog: (log) => set((state) => ({ liveLogs: [...state.liveLogs.slice(-200), log] })),
  clearLogs: () => set({ liveLogs: [] }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
