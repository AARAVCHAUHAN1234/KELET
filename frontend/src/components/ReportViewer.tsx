import React from 'react';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

interface ReportViewerProps {
  report: any;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ report }) => {
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    saveAs(blob, 'report.json');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const jsonString = JSON.stringify(report, null, 2);
    const lines = doc.splitTextToSize(jsonString, 180);
    doc.text(lines, 10, 10);
    doc.save('report.pdf');
  };

  return (
    <div className="h-64 bg-raised rounded border border-border p-2 overflow-auto">
      <h2 className="text-lg mb-2 flex justify-between items-center">
        Report Viewer
        <div className="space-x-2">
          <button className="px-2 py-1 bg-info text-white rounded" onClick={downloadJSON}>JSON</button>
          <button className="px-2 py-1 bg-success text-white rounded" onClick={downloadPDF}>PDF</button>
        </div>
      </h2>
      {report ? (
        <pre className="text-sm text-muted whitespace-pre-wrap">
          {JSON.stringify(report, null, 2)}
        </pre>
      ) : (
        <p className="text-muted">No report data.</p>
      )}
    </div>
  );
};

export default ReportViewer;
