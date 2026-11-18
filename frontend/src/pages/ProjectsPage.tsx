import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import { 
  FolderGit2, 
  FolderPlus, 
  Search, 
  Tag, 
  Calendar, 
  ExternalLink, 
  FileText,
  Filter
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { setActiveSession, setPage } = useAppStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const list = await api.listSessions();
      setSessions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = s.question?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedTag === 'all' || s.status === selectedTag;
    return matchesSearch && matchesStatus;
  });

  const handleOpen = (id: string) => {
    setActiveSession(id);
    setPage('workspace');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-[#34383B] pb-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-[#F0F1F2]">Research Projects Directory</h1>
          <p className="text-xs text-[#70777D] font-mono">Organize investigations, manage active hypotheses, and track research deliverables</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#70777D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="bg-[#191B1D] border border-[#34383B] focus:border-[#6FA9DC] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#F0F1F2] placeholder-[#70777D] focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#191B1D] border border-[#34383B] rounded-md p-1">
            {['all', 'completed', 'planning', 'failed'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase transition-colors ${
                  selectedTag === tag 
                    ? 'bg-[#222528] text-[#F0F1F2] border border-[#34383B] font-semibold' 
                    : 'text-[#70777D] hover:text-[#A0A5AA]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSessions.map((sess) => (
          <div
            key={sess.id}
            onClick={() => handleOpen(sess.id)}
            className="bg-[#191B1D] border border-[#34383B] hover:border-[#6FA9DC]/60 rounded-xl p-5 cursor-pointer space-y-3 transition-all hover:shadow-lg group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#70777D] uppercase">[{sess.id}]</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  sess.status === 'completed' ? 'text-[#63C995] border-[#63C995]/30 bg-[#63C995]/10' :
                  sess.status === 'failed' ? 'text-[#E36F6F] border-[#E36F6F]/30 bg-[#E36F6F]/10' :
                  'text-[#6FA9DC] border-[#6FA9DC]/30 bg-[#6FA9DC]/10'
                }`}>
                  {sess.status}
                </span>
              </div>

              <h3 className="text-sm font-medium text-[#F0F1F2] line-clamp-2 leading-snug group-hover:text-[#6FA9DC] transition-colors">
                {sess.question}
              </h3>
            </div>

            <div className="pt-3 border-t border-[#34383B] flex items-center justify-between text-[11px] font-mono text-[#70777D]">
              <div className="flex items-center gap-3">
                <span>{sess.sources_count || 0} Sources</span>
                <span>•</span>
                <span>{sess.claims_count || 0} Claims</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#70777D] group-hover:text-[#F0F1F2]" />
            </div>
          </div>
        ))}
      </div>

      {filteredSessions.length === 0 && (
        <div className="p-12 text-center text-xs font-mono text-[#70777D] bg-[#191B1D] border border-[#34383B] rounded-xl">
          No projects matched the search filters.
        </div>
      )}
    </div>
  );
};
