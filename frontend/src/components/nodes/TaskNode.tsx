import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cpu, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { agentLabel } from '../../lib/utils';

interface TaskNodeData {
  label: string;
  agent: string;
  status: string;
  description: string;
}

export const TaskNode = memo(({ data }: { data: TaskNodeData }) => {
  const isRunning = data.status === 'running';
  const isCompleted = data.status === 'completed';
  const isFailed = data.status === 'failed';

  return (
    <div className={`bg-[#191B1D] border rounded-lg p-2.5 min-w-[200px] max-w-[240px] text-xs transition-colors shadow-md ${
      isRunning ? 'border-[#6FA9DC] shadow-[0_0_12px_rgba(111,169,220,0.25)]' :
      isCompleted ? 'border-[#63C995]/60' :
      isFailed ? 'border-[#E36F6F]/60' : 'border-[#34383B]'
    }`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-[#70777D]" />
      
      <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono text-[#A0A5AA]">
        <Cpu className="w-3.5 h-3.5 text-[#6FA9DC]" />
        <span className="truncate flex-1 font-semibold text-[#F0F1F2]">{data.label}</span>
        {isRunning && <Clock className="w-3.5 h-3.5 text-[#6FA9DC] animate-spin" />}
        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#63C995]" />}
        {isFailed && <AlertTriangle className="w-3.5 h-3.5 text-[#E36F6F]" />}
      </div>

      <div className="text-[10px] text-[#A0A5AA] truncate font-mono mb-1">
        {agentLabel(data.agent)}
      </div>

      <p className="text-[10px] text-[#70777D] line-clamp-2 leading-tight">
        {data.description}
      </p>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-[#70777D]" />
    </div>
  );
});
