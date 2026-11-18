import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Check, X, AlertCircle } from 'lucide-react';

interface ClaimNodeData {
  label: string;
  status: string;
  confidence: number;
  source_id: string;
  color?: string;
}

export const ClaimNode = memo(({ data }: { data: ClaimNodeData }) => {
  const isSupported = data.status === 'Supported';
  const isContradicted = data.status === 'Contradicted' || data.status === 'Misleading';
  const isPartial = data.status === 'Partially Supported';

  return (
    <div className={`bg-[#191B1D] border rounded-md p-2 min-w-[200px] max-w-[230px] text-xs shadow-sm ${
      isSupported ? 'border-[#63C995]/50' :
      isContradicted ? 'border-[#E36F6F]/50' :
      isPartial ? 'border-[#E3B45F]/50' : 'border-[#34383B]'
    }`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-[#70777D]" />
      
      <div className="flex items-center gap-1 mb-1">
        {isSupported && <Check className="w-3 h-3 text-[#63C995]" />}
        {isContradicted && <X className="w-3 h-3 text-[#E36F6F]" />}
        {(!isSupported && !isContradicted) && <AlertCircle className="w-3 h-3 text-[#E3B45F]" />}
        <span className={`text-[9.5px] font-mono uppercase tracking-wider font-semibold ${
          isSupported ? 'text-[#63C995]' :
          isContradicted ? 'text-[#E36F6F]' : 'text-[#E3B45F]'
        }`}>
          {data.status}
        </span>
        <span className="ml-auto text-[9.5px] font-mono text-[#70777D]">
          {data.confidence}% conf.
        </span>
      </div>

      <p className="text-[11px] text-[#F0F1F2] line-clamp-3 leading-snug">
        "{data.label}"
      </p>

      <div className="mt-1 text-[9px] font-mono text-[#70777D] text-right">
        Ref: {data.source_id}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-[#70777D]" />
    </div>
  );
});
