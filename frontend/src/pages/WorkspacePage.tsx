import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  type Node,
  type Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import { useResearchWebSocket } from '../hooks/useWebSocket';
import { saveSessionToLocal } from '../lib/db';
import { QuestionNode } from '../components/nodes/QuestionNode';
import { TaskNode } from '../components/nodes/TaskNode';
import { SourceNode } from '../components/nodes/SourceNode';
import { ClaimNode } from '../components/nodes/ClaimNode';
import { ReportNode } from '../components/nodes/ReportNode';

import { 
  Pause, 
  Play, 
  RotateCw, 
  FileText, 
  Maximize2, 
  Terminal, 
  Layers, 
  Info,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink
} from 'lucide-react';

export const WorkspacePage: React.FC = () => {
  const { activeSessionId, sessionData, setSessionData, liveLogs, setPage } = useAppStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [activeTab, setActiveTab] = useState<'inspector' | 'logs' | 'subtasks'>('inspector');
  const [isPaused, setIsPaused] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Hook up WebSocket
  useResearchWebSocket(activeSessionId);

  // Custom node types
  const nodeTypes = useMemo(() => ({
    questionNode: QuestionNode,
    taskNode: TaskNode,
    sourceNode: SourceNode,
    claimNode: ClaimNode,
    reportNode: ReportNode,
  }), []);

  // Fetch session data & graph
  const loadWorkspace = useCallback(async () => {
    if (!activeSessionId) return;
    try {
      const [sess, graph] = await Promise.all([
        api.getSession(activeSessionId),
        api.getGraph(activeSessionId).catch(() => ({ nodes: [], edges: [] }))
      ]);

      setSessionData(sess as any);
      saveSessionToLocal(sess as any);

      if (graph.nodes && graph.nodes.length > 0) {
        setNodes(graph.nodes as Node[]);
        setEdges(graph.edges as Edge[]);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    }
  }, [activeSessionId, setSessionData, setNodes, setEdges]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // Polling fallback when running
  useEffect(() => {
    if (!autoRefresh || !activeSessionId || !sessionData) return;
    if (sessionData.status === 'completed' || sessionData.status === 'failed') return;

    const interval = setInterval(() => {
      loadWorkspace();
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh, activeSessionId, sessionData, loadWorkspace]);

  const handlePauseResume = async () => {
    if (!activeSessionId) return;
    try {
      if (!isPaused) {
        await api.pauseSession(activeSessionId);
        setIsPaused(true);
      } else {
        setIsPaused(false);
        loadWorkspace();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setActiveTab('inspector');
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#101112]">
      {/* Central Interactive Graph Workspace */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Workspace Controls Header */}
        <div className="h-11 bg-[#191B1D]/80 backdrop-blur border-b border-[#34383B] flex items-center justify-between px-4 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-medium text-[#F0F1F2] flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#6FA9DC]" />
              <span>Research Graph</span>
            </span>
            <span className="text-[10px] font-mono text-[#70777D]">
              {nodes.length} Nodes • {edges.length} Connections
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePauseResume}
              className="px-2.5 py-1 rounded bg-[#222528] hover:bg-[#2C3033] border border-[#34383B] text-[11px] font-mono text-[#A0A5AA] hover:text-[#F0F1F2] flex items-center gap-1.5 transition-colors"
            >
              {isPaused ? <Play className="w-3 h-3 text-[#63C995]" /> : <Pause className="w-3 h-3 text-[#E3B45F]" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              onClick={loadWorkspace}
              className="p-1.5 rounded bg-[#222528] hover:bg-[#2C3033] border border-[#34383B] text-[#A0A5AA] hover:text-[#F0F1F2] transition-colors"
              title="Refresh Graph"
            >
              <RotateCw className="w-3 h-3" />
            </button>

            {sessionData?.reports?.comprehensive && (
              <button
                onClick={() => setPage('reports')}
                className="px-3 py-1 rounded bg-[#63C995] hover:bg-[#52B884] text-[11px] font-mono font-semibold text-[#101112] flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <FileText className="w-3 h-3" />
                <span>View Report</span>
              </button>
            )}
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1 w-full h-full bg-dot-grid relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            minZoom={0.2}
            maxZoom={1.8}
            defaultEdgeOptions={{ animated: false }}
          >
            <Background color="#34383B" gap={24} size={1} />
            <Controls className="!bg-[#191B1D] !border-[#34383B] !shadow-none" />
            <MiniMap 
              nodeColor={(node) => {
                if (node.type === 'questionNode') return '#6FA9DC';
                if (node.type === 'taskNode') return '#A0A5AA';
                if (node.type === 'sourceNode') return '#63C995';
                if (node.type === 'claimNode') return '#E3B45F';
                if (node.type === 'reportNode') return '#63C995';
                return '#70777D';
              }}
              className="!bg-[#191B1D] !border-[#34383B] !rounded-md"
              maskColor="rgba(16, 17, 18, 0.7)"
            />
          </ReactFlow>

          {/* Empty state overlay if no active investigation */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-[#191B1D]/90 border border-[#34383B] rounded-xl p-6 max-w-md text-center space-y-2 pointer-events-auto">
                <Info className="w-8 h-8 text-[#6FA9DC] mx-auto" />
                <h3 className="text-sm font-mono font-bold text-[#F0F1F2]">No Graph Nodes Yet</h3>
                <p className="text-xs text-[#A0A5AA]">
                  {sessionData ? 'Agents are currently discovering sources and structuring the research graph...' : 'No active investigation selected. Start one from the top header or dashboard.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Drawer: Node Inspector & Execution Logs */}
      <div className="w-96 bg-[#191B1D] border-l border-[#34383B] flex flex-col shrink-0">
        {/* Drawer Tabs */}
        <div className="flex border-b border-[#34383B] bg-[#101112]">
          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex-1 py-2.5 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'inspector' 
                ? 'border-[#6FA9DC] text-[#F0F1F2] bg-[#191B1D]' 
                : 'border-transparent text-[#70777D] hover:text-[#A0A5AA]'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Inspector</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-2.5 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'logs' 
                ? 'border-[#6FA9DC] text-[#F0F1F2] bg-[#191B1D]' 
                : 'border-transparent text-[#70777D] hover:text-[#A0A5AA]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Agent Stream</span>
            {liveLogs.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#63C995] animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('subtasks')}
            className={`flex-1 py-2.5 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'subtasks' 
                ? 'border-[#6FA9DC] text-[#F0F1F2] bg-[#191B1D]' 
                : 'border-transparent text-[#70777D] hover:text-[#A0A5AA]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pipeline</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'inspector' && (
            <div>
              {selectedNode ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#34383B]">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222528] text-[#6FA9DC] uppercase border border-[#34383B]">
                        {String(selectedNode.type || '')}
                      </span>
                      <span className="text-xs font-mono text-[#70777D]">
                        ID: {selectedNode.id}
                      </span>
                    </div>
                    <button 
                      onClick={() => setSelectedNode(null)}
                      className="p-1 rounded text-[#70777D] hover:text-[#F0F1F2]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Render node-specific details */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#70777D] block mb-1">Label / Title</span>
                      <p className="text-xs text-[#F0F1F2] font-medium leading-relaxed bg-[#101112] p-2.5 rounded border border-[#34383B]">
                        {String(selectedNode.data?.label || '')}
                      </p>
                    </div>

                    {Boolean(selectedNode.data?.publisher) && (
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#70777D] block mb-1">Publisher & Authority</span>
                        <div className="text-xs font-mono text-[#A0A5AA] bg-[#101112] p-2 rounded border border-[#34383B]">
                          {String(selectedNode.data.publisher)} • Credibility: {Number(selectedNode.data.credibility)}%
                        </div>
                      </div>
                    )}

                    {Boolean(selectedNode.data?.url) && (
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#70777D] block mb-1">Verified External URL</span>
                        <a 
                          href={String(selectedNode.data.url)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-[#6FA9DC] hover:underline flex items-center gap-1 font-mono break-all bg-[#101112] p-2 rounded border border-[#34383B]"
                        >
                          <span>{String(selectedNode.data.url)}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}

                    {Boolean(selectedNode.data?.status) && (
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#70777D] block mb-1">Verification Status</span>
                        <span className="text-xs font-mono px-2 py-1 rounded bg-[#222528] text-[#63C995] border border-[#34383B] inline-block">
                          {String(selectedNode.data.status)}
                        </span>
                      </div>
                    )}

                    {selectedNode.data?.confidence !== undefined && (
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#70777D] block mb-1">Confidence Score</span>
                        <div className="w-full bg-[#101112] rounded-full h-2 border border-[#34383B] overflow-hidden">
                          <div 
                            className="bg-[#63C995] h-full" 
                            style={{ width: `${selectedNode.data.confidence}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-[#70777D] mt-1 block">
                          {Number(selectedNode.data.confidence)}% verified confidence
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-2 text-[#70777D]">
                  <Info className="w-6 h-6 mx-auto text-[#34383B]" />
                  <p className="text-xs font-mono">Select any node in the graph to inspect its verification status, evidence excerpts, and source metadata.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2 font-mono text-[11px]">
              <div className="text-[10px] text-[#70777D] uppercase pb-1 border-b border-[#34383B] flex items-center justify-between">
                <span>Agent Execution Stream</span>
                <span>{liveLogs.length || (sessionData?.logs?.length || 0)} events</span>
              </div>
              
              <div className="space-y-1.5">
                {(liveLogs.length > 0 ? liveLogs : sessionData?.logs || []).map((log, idx) => (
                  <div 
                    key={idx}
                    className="p-2 rounded bg-[#101112] border border-[#34383B] space-y-0.5"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#6FA9DC] font-semibold">{log.agent}</span>
                      <span className="text-[#70777D]">{log.timestamp}</span>
                    </div>
                    <p className={`text-xs ${
                      log.level === 'success' ? 'text-[#63C995]' :
                      log.level === 'warning' ? 'text-[#E3B45F]' :
                      log.level === 'error' ? 'text-[#E36F6F]' : 'text-[#A0A5AA]'
                    }`}>
                      {log.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'subtasks' && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-[#70777D] uppercase pb-1 border-b border-[#34383B]">
                Autonomous Subtasks Pipeline
              </div>
              
              <div className="space-y-2">
                {(sessionData?.subtasks || []).map((st) => (
                  <div 
                    key={st.id}
                    className="p-2.5 rounded bg-[#101112] border border-[#34383B] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-medium text-[#F0F1F2]">{st.title}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        st.status === 'completed' ? 'text-[#63C995] border-[#63C995]/30 bg-[#63C995]/10' :
                        st.status === 'running' ? 'text-[#6FA9DC] border-[#6FA9DC]/30 bg-[#6FA9DC]/10' : 'text-[#70777D] border-[#34383B]'
                      }`}>
                        {st.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A0A5AA] leading-snug">
                      {st.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
