import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { agentLabel, agentIcon } from '../lib/utils';
import { 
  Activity, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Filter,
  Cpu
} from 'lucide-react';

const AGENT_LIST = [
  'orchestrator',
  'discovery',
  'deep_research',
  'claim_extraction',
  'fact_verification',
  'contradiction_detection',
  'source_credibility',
  'bias_perspective',
  'statistical_analysis',
  'skeptic',
  'synthesis_auditor'
];

export const AgentMonitoringPage: React.FC = () => {
  const { sessionData, liveLogs } = useAppStore();
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');

  const allLogs = liveLogs.length > 0 ? liveLogs : (sessionData?.logs || []);

  const filteredLogs = selectedAgentFilter === 'all' 
    ? allLogs 
    : allLogs.filter(l => l.agent === selectedAgentFilter);

  // Compute status for each agent
  const getAgentStatus = (agentName: string) => {
    const running = allLogs.find(l => l.agent === agentName && l.action.includes('start'));
    const completed = allLogs.find(l => l.agent === agentName && (l.action.includes('complete') || l.level === 'success'));
    const error = allLogs.find(l => l.agent === agentName && l.level === 'error');

    if (error) return 'error';
    if (completed) return 'completed';
    if (running) return 'running';
    return 'idle';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-[#34383B] pb-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F0F1F2]">Agent Telemetry & Monitoring</h1>
          <p className="text-xs text-[#70777D] font-mono">Real-time status, execution metrics, and error boundaries across all 11 autonomous research agents</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#70777D]">Filter Agent:</span>
          <select
            value={selectedAgentFilter}
            onChange={(e) => setSelectedAgentFilter(e.target.value)}
            className="bg-[#191B1D] border border-[#34383B] rounded-md px-3 py-1.5 text-xs text-[#F0F1F2] font-mono focus:outline-none"
          >
            <option value="all">All Agents</option>
            {AGENT_LIST.map((ag) => (
              <option key={ag} value={ag}>{agentLabel(ag)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Agents Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {AGENT_LIST.map((ag) => {
          const status = getAgentStatus(ag);
          const agentLogsCount = allLogs.filter(l => l.agent === ag).length;
          const isSelected = selectedAgentFilter === ag;

          return (
            <div
              key={ag}
              onClick={() => setSelectedAgentFilter(isSelected ? 'all' : ag)}
              className={`bg-[#191B1D] border rounded-lg p-3.5 cursor-pointer transition-all space-y-2 ${
                isSelected 
                  ? 'border-[#6FA9DC] bg-[#222528]' 
                  : 'border-[#34383B] hover:border-[#6FA9DC]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{agentIcon(ag)}</span>
                  <span className="text-xs font-mono font-semibold text-[#F0F1F2] truncate">
                    {agentLabel(ag)}
                  </span>
                </div>
                
                <span className={`w-2 h-2 rounded-full ${
                  status === 'completed' ? 'bg-[#63C995]' :
                  status === 'running' ? 'bg-[#6FA9DC] animate-pulse' :
                  status === 'error' ? 'bg-[#E36F6F]' : 'bg-[#70777D]'
                }`} />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#70777D] pt-1 border-t border-[#34383B]/60">
                <span className="capitalize">{status}</span>
                <span>{agentLogsCount} telemetry events</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Stream Terminal */}
      <div className="bg-[#191B1D] border border-[#34383B] rounded-xl overflow-hidden flex flex-col h-[480px]">
        <div className="h-10 bg-[#101112] border-b border-[#34383B] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-[#F0F1F2]">
            <Terminal className="w-4 h-4 text-[#6FA9DC]" />
            <span>Agent Telemetry Stream {selectedAgentFilter !== 'all' && `[${agentLabel(selectedAgentFilter)}]`}</span>
          </div>
          <span className="text-[10px] font-mono text-[#70777D]">
            Showing {filteredLogs.length} events
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs bg-[#101112]">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-[#70777D] py-12">
              No telemetry events recorded for this selection.
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-3 p-2 rounded bg-[#191B1D] border border-[#34383B]/50 hover:border-[#34383B] transition-colors"
              >
                <span className="text-[10px] text-[#70777D] shrink-0 mt-0.5">{log.timestamp}</span>
                <span className="text-[10px] text-[#6FA9DC] font-semibold shrink-0 uppercase">[{log.agent}]</span>
                <span className="text-[10px] text-[#A0A5AA] shrink-0 font-medium">{log.action}:</span>
                <span className={`flex-1 text-[11px] leading-relaxed ${
                  log.level === 'success' ? 'text-[#63C995]' :
                  log.level === 'warning' ? 'text-[#E3B45F]' :
                  log.level === 'error' ? 'text-[#E36F6F]' : 'text-[#F0F1F2]'
                }`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
