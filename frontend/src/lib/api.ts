const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => request<Record<string, unknown>>('/health'),
  getSettings: () => request<Record<string, unknown>>('/settings'),
  updateSettings: (data: Record<string, unknown>) => request<Record<string, unknown>>('/settings', { method: 'POST', body: JSON.stringify(data) }),

  startResearch: (data: { question: string; depth_mode?: string; source_preference?: string; scope_region?: string }) =>
    request<{ session_id: string; status: string }>('/research/start', { method: 'POST', body: JSON.stringify(data) }),

  getSession: (id: string) => request<Record<string, unknown>>(`/research/${id}`),
  getSessionStatus: (id: string) => request<Record<string, unknown>>(`/research/${id}/status`),
  listSessions: () => request<Record<string, unknown>[]>('/research'),
  deleteSession: (id: string) => request<unknown>(`/research/${id}`, { method: 'DELETE' }),
  pauseSession: (id: string) => request<unknown>(`/research/${id}/pause`, { method: 'POST' }),

  getSources: (id: string) => request<Record<string, unknown>[]>(`/research/${id}/sources`),
  getClaims: (id: string) => request<Record<string, unknown>[]>(`/research/${id}/claims`),
  getContradictions: (id: string) => request<Record<string, unknown>[]>(`/research/${id}/contradictions`),
  getCredibility: (id: string) => request<Record<string, unknown>[]>(`/research/${id}/credibility`),
  getSkeptic: (id: string) => request<Record<string, unknown>[]>(`/research/${id}/skeptic`),
  getGaps: (id: string) => request<Record<string, unknown>[]>(`/research/${id}/gaps`),
  getLogs: (id: string) => request<Record<string, unknown>[]>(`/research/${id}/logs`),
  getGraph: (id: string) => request<{ nodes: Record<string, unknown>[]; edges: Record<string, unknown>[] }>(`/research/${id}/graph`),
  getReport: (id: string) => request<Record<string, unknown>>(`/research/${id}/report`),
  getStatistics: (id: string) => request<Record<string, unknown>[]>(`/research/${id}/statistics`),
  getBias: (id: string) => request<Record<string, unknown>[]>(`/research/${id}/bias`),

  uploadDocument: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}/documents/upload`, { method: 'POST', body: form });
    if (!res.ok) throw new Error((await res.json().catch(() => ({ detail: 'Upload failed' }))).detail);
    return res.json();
  },

  getExportUrl: (id: string, format: string) => `${API_BASE}/research/${id}/report/export?format=${format}`,
};

export function createWebSocket(sessionId: string): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return new WebSocket(`${protocol}//${window.location.host}/api/ws/${sessionId}`);
}
