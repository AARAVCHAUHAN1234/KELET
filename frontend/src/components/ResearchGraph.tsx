import React from 'react';
import { ReactFlowProvider, Background, Controls } from '@xyflow/react';

interface ResearchGraphProps {
  report: any;
}

const ResearchGraph: React.FC<ResearchGraphProps> = ({ report }) => {
  // Placeholder – in a real app you would convert report data into nodes/edges.
  return (
    <div className="h-64 bg-raised rounded border border-border p-2 overflow-auto">
      <ReactFlowProvider>
        <div className="text-muted">[Research graph placeholder – nodes/edges to be implemented]</div>
        <Background />
        <Controls />
      </ReactFlowProvider>
    </div>
  );
};

export default ResearchGraph;
