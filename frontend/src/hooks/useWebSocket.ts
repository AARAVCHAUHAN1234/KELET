import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import type { AgentLog } from '../types';

export function useResearchWebSocket(sessionId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const addLog = useAppStore((s) => s.addLog);
  const setSessionData = useAppStore((s) => s.setSessionData);

  const connect = useCallback(() => {
    if (!sessionId) return;
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws/${sessionId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'agent_log') {
          addLog(msg.data as AgentLog);
        } else if (msg.type === 'status_update' && msg.data?.session) {
          setSessionData(msg.data.session);
        }
      } catch { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      // Auto-reconnect after 2s
      setTimeout(() => {
        if (sessionId) connect();
      }, 2000);
    };
  }, [sessionId, addLog, setSessionData]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return wsRef;
}
