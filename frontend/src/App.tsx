import React, { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { Layout } from './components/Layout';
import { useResearchWebSocket } from './hooks/useWebSocket';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { AgentMonitoringPage } from './pages/AgentMonitoringPage';
import { EvidenceExplorerPage } from './pages/EvidenceExplorerPage';
import { ClaimVerificationCenterPage } from './pages/ClaimVerificationCenterPage';
import { ContradictionAnalysisPage } from './pages/ContradictionAnalysisPage';
import { SourceIntelligencePage } from './pages/SourceIntelligencePage';
import { ResearchLibraryPage } from './pages/ResearchLibraryPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const { currentPage, activeSessionId } = useAppStore();

  // Connect live WebSocket telemetry when an investigation is active
  useResearchWebSocket(activeSessionId);

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'workspace':
        return <WorkspacePage />;
      case 'projects':
        return <ProjectsPage />;
      case 'agents':
        return <AgentMonitoringPage />;
      case 'evidence':
        return <EvidenceExplorerPage />;
      case 'claims':
        return <ClaimVerificationCenterPage />;
      case 'contradictions':
        return <ContradictionAnalysisPage />;
      case 'sources':
        return <SourceIntelligencePage />;
      case 'library':
        return <ResearchLibraryPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
}
