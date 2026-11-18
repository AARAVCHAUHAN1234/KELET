import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  FileType, 
  CheckCircle2, 
  ExternalLink,
  Printer,
  Copy,
  Check
} from 'lucide-react';

const REPORT_TYPES = [
  { id: 'comprehensive', label: 'Comprehensive Research Dossier' },
  { id: 'executive_summary', label: 'Executive Summary' },
  { id: 'claim_verification', label: 'Claim Verification Audit' },
  { id: 'contradiction_analysis', label: 'Contradiction Analysis' },
  { id: 'source_credibility', label: 'Source Credibility Matrix' },
  { id: 'statistical_findings', label: 'Statistical Findings' },
  { id: 'gap_report', label: 'Research Gap Report' },
  { id: 'balanced_debate', label: 'Balanced Debate & Counterarguments' },
];

export const ReportsPage: React.FC = () => {
  const { activeSessionId, sessionData } = useAppStore();
  const [selectedType, setSelectedType] = useState('comprehensive');
  const [copied, setCopied] = useState(false);

  const report = sessionData?.reports?.[selectedType] || sessionData?.reports?.['comprehensive'];

  const handleDownload = (format: 'pdf' | 'docx' | 'markdown') => {
    if (!activeSessionId) return;
    const url = api.getExportUrl(activeSessionId, format);
    window.open(url, '_blank');
  };

  const handleCopyMarkdown = () => {
    if (!report?.markdown_content) return;
    navigator.clipboard.writeText(report.markdown_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!sessionData) {
    return (
      <div className="p-12 text-center text-xs font-mono text-[#70777D] space-y-2">
        <FileText className="w-8 h-8 text-[#70777D] mx-auto" />
        <p className="text-[#F0F1F2] font-semibold">No Investigation Selected</p>
        <p>Select or start an investigation to inspect and export evidence reports.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-[#34383B] pb-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F0F1F2]">Research Intelligence Reports</h1>
          <p className="text-xs text-[#70777D] font-mono">Traceable, evidence-backed publications across 8 analytical perspectives with PDF, DOCX, and Markdown export</p>
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload('pdf')}
            className="px-3 py-1.5 rounded bg-[#222528] hover:bg-[#2C3033] border border-[#34383B] text-xs font-mono text-[#F0F1F2] flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#E36F6F]" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => handleDownload('docx')}
            className="px-3 py-1.5 rounded bg-[#222528] hover:bg-[#2C3033] border border-[#34383B] text-xs font-mono text-[#F0F1F2] flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#6FA9DC]" />
            <span>DOCX</span>
          </button>

          <button
            onClick={() => handleDownload('markdown')}
            className="px-3 py-1.5 rounded bg-[#222528] hover:bg-[#2C3033] border border-[#34383B] text-xs font-mono text-[#F0F1F2] flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#63C995]" />
            <span>Markdown</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="p-1.5 rounded bg-[#222528] hover:bg-[#2C3033] border border-[#34383B] text-[#A0A5AA] hover:text-[#F0F1F2] transition-colors"
            title="Copy Markdown text"
          >
            {copied ? <Check className="w-4 h-4 text-[#63C995]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#34383B] pb-3">
        {REPORT_TYPES.map((rt) => (
          <button
            key={rt.id}
            onClick={() => setSelectedType(rt.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
              selectedType === rt.id
                ? 'bg-[#6FA9DC] text-[#101112] font-semibold'
                : 'bg-[#191B1D] text-[#A0A5AA] hover:text-[#F0F1F2] border border-[#34383B]'
            }`}
          >
            {rt.label}
          </button>
        ))}
      </div>

      {/* Report Preview Document */}
      {report ? (
        <div className="bg-[#191B1D] border border-[#34383B] rounded-xl p-8 space-y-6 shadow-xl text-xs leading-relaxed">
          {/* Document Header */}
          <div className="space-y-2 border-b border-[#34383B] pb-6">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#70777D]">
              <span>KELET RESEARCH REPORT • {selectedType.toUpperCase()}</span>
              <span>{report.generated_at}</span>
            </div>
            <h2 className="text-xl font-bold font-mono text-[#F0F1F2]">
              {report.title}
            </h2>
            <div className="text-xs text-[#6FA9DC] font-mono">
              Inquiry: {report.question}
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold font-mono text-[#F0F1F2] uppercase tracking-wider text-[#6FA9DC]">
              1. Executive Summary
            </h3>
            <p className="text-[#A0A5AA] text-justify leading-relaxed whitespace-pre-line">
              {report.executive_summary}
            </p>
          </div>

          {/* Section 2: Scope & Methodology */}
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-bold font-mono text-[#F0F1F2] uppercase tracking-wider text-[#6FA9DC]">
              2. Scope & Research Methodology
            </h3>
            <p className="text-[#A0A5AA] leading-relaxed">
              {report.scope_and_methodology}
            </p>
          </div>

          {/* Section 3: Key Findings */}
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-bold font-mono text-[#F0F1F2] uppercase tracking-wider text-[#6FA9DC]">
              3. Key Evidence-Backed Findings
            </h3>
            <div className="space-y-1.5 pl-2">
              {report.key_findings?.map((finding, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[#F0F1F2]">
                  <span className="font-mono text-[#63C995] font-semibold">{idx+1}.</span>
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Verified Claims Table */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold font-mono text-[#F0F1F2] uppercase tracking-wider text-[#6FA9DC]">
              4. Extracted Claims & Verification Audit Trail
            </h3>
            <div className="border border-[#34383B] rounded-lg overflow-hidden divide-y divide-[#34383B]">
              {(sessionData.claims || []).slice(0, 8).map((claim) => (
                <div key={claim.id} className="p-3 bg-[#101112] space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#70777D]">[{claim.id}]</span>
                    <span className={`px-2 py-0.2 rounded border font-semibold ${
                      claim.verification_status === 'Supported' ? 'text-[#63C995] border-[#63C995]/30' :
                      claim.verification_status === 'Contradicted' ? 'text-[#E36F6F] border-[#E36F6F]/30' :
                      'text-[#E3B45F] border-[#E3B45F]/30'
                    }`}>
                      {claim.verification_status} ({claim.confidence_score}%)
                    </span>
                  </div>
                  <p className="text-xs text-[#F0F1F2] font-medium font-mono">
                    {claim.text}
                  </p>
                  {claim.original_quote && (
                    <p className="text-[11px] text-[#A0A5AA] italic">
                      "{claim.original_quote}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Final Verdict */}
          <div className="space-y-2 pt-4 border-t border-[#34383B]">
            <h3 className="text-sm font-bold font-mono text-[#F0F1F2] uppercase tracking-wider text-[#63C995]">
              5. Final Synthesized Verdict
            </h3>
            <p className="text-[#F0F1F2] font-medium leading-relaxed bg-[#222528] p-4 rounded-lg border border-[#34383B]">
              {report.final_verdict}
            </p>
          </div>

          {/* Section 6: Bibliography */}
          <div className="space-y-2 pt-4 border-t border-[#34383B]">
            <h3 className="text-sm font-bold font-mono text-[#F0F1F2] uppercase tracking-wider text-[#6FA9DC]">
              6. Traceable Bibliography & Real Sources
            </h3>
            <div className="space-y-1 font-mono text-[11px]">
              {(sessionData.sources || []).map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded bg-[#101112]">
                  <span className="text-[#A0A5AA]">
                    [{s.id}] {s.publisher} — <strong className="text-[#F0F1F2]">{s.title}</strong> ({s.published_date})
                  </span>
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-[#6FA9DC] hover:underline flex items-center gap-1 shrink-0 ml-2">
                      <span>Visit</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-xs font-mono text-[#70777D] bg-[#191B1D] border border-[#34383B] rounded-xl">
          Report generation in progress or pending pipeline completion.
        </div>
      )}
    </div>
  );
};
