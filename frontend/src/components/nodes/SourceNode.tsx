import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Globe, BookOpen, ShieldCheck } from 'lucide-react';

interface SourceNodeData {
  label: string;
  publisher: string;
  credibility: number;
  type: string;
  url: string;
}

export const SourceNode = memo(({ data }: { data: SourceNodeData }) => {
  const isHighCred = data.credibility >= 80;

  return (
    <div className="bg-[#191B1D] border border-[#34383B] hover:border-[#6FA9DC]/60 rounded-md p-2 min-w-[190px] max-w-[220px] text-xs shadow-sm transition-all group">
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-[#70777D]" />
      
      <div className="flex items-center gap-1.5 mb-1">
        {data.type === 'academic' ? (
          <BookOpen className="w-3.5 h-3.5 text-[#6FA9DC]" />
        ) : (
          <Globe className="w-3.5 h-3.5 text-[#A0A5AA]" />
        )}
        <span className="font-mono text-[10px] text-[#A0A5AA] truncate flex-1 uppercase">
          {data.publisher || 'Web Source'}
        </span>
        <div className={`flex items-center gap-0.5 text-[10px] font-mono px-1 py-0.2 rounded border ${
          isHighCred ? 'text-[#63C995] border-[#63C995]/30 bg-[#63C995]/10' : 'text-[#E3B45F] border-[#E3B45F]/30 bg-[#E3B45F]/10'
        }`}>
          <ShieldCheck className="w-2.5 h-2.5" />
          <span>{data.credibility}%</span>
        </div>
      </div>

      <p className="text-[11px] text-[#F0F1F2] font-medium truncate mb-1" title={data.label}>
        {data.label}
      </p>

      {data.url && (
        <a 
          href={data.url} 
          target="_blank" 
          rel="noreferrer" 
          className="text-[9px] text-[#6FA9DC] truncate block hover:underline font-mono"
        >
          {data.url.replace(/^https?:\/\//, '').split('/')[0]}
        </a>
      )}

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-[#70777D]" />
    </div>
  );
});
