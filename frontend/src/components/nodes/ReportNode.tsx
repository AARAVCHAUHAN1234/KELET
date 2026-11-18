import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText, Award } from 'lucide-react';

interface ReportNodeData {
  label: string;
  status: string;
}

export const ReportNode = memo(({ data }: { data: ReportNodeData }) => {
  return (
    <div className="bg-[#191B1D] border-2 border-[#63C995] rounded-lg p-3 min-w-[240px] max-w-[300px] shadow-lg shadow-black/50">
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 !bg-[#63C995]" />
      
      <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-[#34383B]">
        <Award className="w-4 h-4 text-[#63C995]" />
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#63C995] font-semibold">
          Final Synthesis
        </span>
        <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#63C995]/10 text-[#63C995] border border-[#63C995]/30">
          Ready
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-[#F0F1F2] font-medium">
        <FileText className="w-4 h-4 text-[#A0A5AA]" />
        <span>{data.label || 'Evidence-Backed Report'}</span>
      </div>
    </div>
  );
});
