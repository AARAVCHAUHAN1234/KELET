import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { StartResearchModal } from '../components/StartResearchModal';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Search, 
  GitFork, 
  Flame, 
  Database, 
  Fingerprint, 
  Layers, 
  Bot, 
  FileCheck2,
  Check,
  TrendingUp,
  Cpu
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setPage } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-full bg-black text-white selection:bg-[#00EA64]/30">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,234,100,0.15),rgba(255,255,255,0))] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 py-12 md:py-20 space-y-24">
        
        {/* HERO SECTION — Matching Screenshot 1 */}
        <div className="text-center space-y-8 max-w-4xl mx-auto pt-6">
          
          {/* Subtle Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0A0D0B] border border-[#1F2C23] text-xs font-mono text-[#00EA64] shadow-[0_0_15px_-3px_rgba(0,234,100,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00EA64] animate-ping" />
            <span>Autonomous Multi-Agent Fact-Checking Platform</span>
          </div>

          {/* Main Giant Headline — "The future of development is human + AI" aesthetic */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] font-sans">
            The future <br />
            of research <br />
            is{' '}
            <span className="inline-flex items-center gap-2 align-middle text-[#00EA64]">
              <Fingerprint className="w-12 h-12 md:w-16 md:h-16 inline-block stroke-[1.8] text-[#00EA64]" />
              human
            </span>
            {' '}+{' '}
            <span className="inline-flex items-center gap-2 align-middle bg-gradient-to-r from-[#00EA64] via-[#00FF88] to-[#38BDF8] bg-clip-text text-transparent">
              <Sparkles className="w-10 h-10 md:w-14 md:h-14 inline-block text-[#00EA64] animate-pulse" />
              AI
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed font-sans">
            We help you investigate complex questions, audit contradictory claims across the live web, 
            and synthesize adversarial-tested intelligence reports with zero hallucinations.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#00EA64] hover:bg-[#00FF6A] text-black font-semibold text-sm transition-all shadow-[0_0_30px_rgba(0,234,100,0.35)] active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Join The Investigation</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            
            <button
              onClick={() => setPage('dashboard')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#0F1112] hover:bg-[#181B1C] border border-[#272B2E] text-sm font-medium text-white transition-colors"
            >
              View Research Dashboard
            </button>
          </div>

          {/* Cookie style prompt bottom badge */}
          <div className="pt-8">
            <div className="inline-flex items-center gap-4 px-4 py-2.5 rounded-full bg-[#0D0F10] border border-[#1F2421] text-xs text-[#71717A]">
              <span>Powered by 11 Specialized Verification Agents & Live DuckDuckGo Engine</span>
              <span className="w-1 h-1 rounded-full bg-[#00EA64]"></span>
              <span className="text-[#00EA64] font-mono">100% Traceable Citations</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: "Choose Your Adventure" — Matching Screenshot 2 */}
        <div className="space-y-10 pt-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-sans">
              Choose Your <span className="text-[#00EA64]">Adventure</span>
            </h2>
            <p className="text-sm text-[#A1A1AA] max-w-xl mx-auto">
              Autonomous workflows designed for deep investigative intelligence, truth verification, and executive decision-making.
            </p>
          </div>

          {/* Two Large Black Feature Cards with neon accents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: For Analysts & Developers */}
            <div className="group relative bg-[#090A0B] rounded-2xl border border-[#1F2421] p-8 hover:border-[#00EA64]/50 transition-all duration-300 hover:shadow-[0_0_35px_-10px_rgba(0,234,100,0.25)] flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#00EA64]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#00EA64]/10 transition-colors" />

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2 font-sans">For Analysts & Researchers</h3>
                  <p className="text-xs text-[#A1A1AA]">
                    Autonomous tools that cross-examine sources, detect hidden bias, and map citation networks.
                  </p>
                </div>

                <ul className="space-y-3 text-xs text-[#D4D4D8]">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00EA64]" />
                    <span>Real-time DuckDuckGo live web and arXiv academic mining</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00EA64]" />
                    <span>Automated claim extraction & sentence-level verification</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00EA64]" />
                    <span>Interactive visual node graphs powered by ReactFlow</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00EA64]" />
                    <span>Instant export to Markdown, PDF, and Word DOCX formats</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => setPage('workspace')}
                  className="w-full py-3 rounded-xl bg-[#00EA64] hover:bg-[#00FF6A] text-black font-semibold text-xs transition-all shadow-[0_0_15px_rgba(0,234,100,0.3)] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>Open Investigation Canvas</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card 2: For Teams & Enterprises */}
            <div className="group relative bg-[#090A0B] rounded-2xl border border-[#1F2421] p-8 hover:border-[#00EA64]/50 transition-all duration-300 hover:shadow-[0_0_35px_-10px_rgba(0,234,100,0.25)] flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#00EA64]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#00EA64]/10 transition-colors" />

              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 font-sans">For Enterprise Intelligence</h3>
                    <p className="text-xs text-[#A1A1AA]">
                      Adversarial red-teaming to uncover contradictions and test mission-critical conclusions.
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-[#00EA64]/10 border border-[#00EA64]/30 text-[#00EA64] text-xs font-mono font-semibold">
                    GenAI
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-[#D4D4D8]">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00EA64]" />
                    <span>Contradiction Detection Agent isolates conflicting metrics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00EA64]" />
                    <span>Skeptic Agent red-teams hypotheses for hidden biases</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00EA64]" />
                    <span>Source Credibility scoring across tier-1 publishers & journals</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00EA64]" />
                    <span>Upload proprietary PDF, DOCX, and CSV dossiers securely</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => setPage('agents')}
                  className="w-full py-3 rounded-xl bg-[#161819] hover:bg-[#202426] border border-[#2B3033] text-white font-medium text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>Explore 11 Autonomous Agents</span>
                  <ArrowRight className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 3: Agent Swarm Matrix */}
        <div className="space-y-8 pt-8 border-t border-[#1F2421]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight font-sans">
                AI Changing <span className="text-[#00EA64]">Research & Fact Verification</span>
              </h3>
              <p className="text-xs text-[#71717A] mt-1">
                Every report is the result of 11 distinct micro-agents communicating across an orchestration pipeline.
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="text-xs text-[#00EA64] hover:underline font-mono inline-flex items-center gap-1.5"
            >
              <span>Initialize Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Orchestrator Agent', desc: 'Synthesizes inquiries into targeted subtasks and schedules pipeline stages.' },
              { title: 'Discovery Agent', desc: 'Conducts live multi-query web and arXiv searches to gather primary citations.' },
              { title: 'Claim Extraction', desc: 'Isolates distinct factual claims, verifiable numbers, and core assertions.' },
              { title: 'Fact Verification', desc: 'Validates claims against external evidence and classifies verification states.' },
              { title: 'Contradiction Intel', desc: 'Identifies conflicting statistics, opposing viewpoints, and temporal shifts.' },
              { title: 'Skeptic Red-Team', desc: 'Aggressively stress-tests conclusions to identify gaps and missing data.' },
            ].map((ag, i) => (
              <div 
                key={i} 
                className="bg-[#0A0D0B] border border-[#1F2C23] hover:border-[#00EA64]/40 rounded-xl p-5 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white font-sans group-hover:text-[#00EA64] transition-colors">
                    {ag.title}
                  </span>
                  <span className="text-[10px] font-mono text-[#00EA64]/70">
                    Agent 0{i + 1}
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  {ag.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {modalOpen && (
        <StartResearchModal onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
};
