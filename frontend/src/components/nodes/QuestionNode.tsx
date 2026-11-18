import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { HelpCircle } from 'lucide-react';

interface QuestionNodeData {
  label: string;
  status: string;
}

export const QuestionNode = memo(({ data }: { data: QuestionNodeData }) => {
  return (
    <div className="bg-[#191B1D] border-2 border-[#6FA9DC] rounded-lg p-3 min-w-[280px] max-w-[360px] shadow-lg shadow-black/40">
      <div className="flex items-center gap-2 mb-2 pb-1 border-b border-[#34383B]">
        <HelpCircle className="w-4 h-4 text-[#6FA9DC]" />
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#6FA9DC] font-semibold">Research Root</span>
        <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#222528] text-[#A0A5AA] border border-[#34383B]">
          {data.status || 'Active'}
        </span>
      </div>
      <p className="text-xs text-[#F0F1F2] font-medium leading-relaxed">
        {data.label}
      </p>
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 !bg-[#6FA9DC] border border-[#101112]" />
    </div>
  );
});
