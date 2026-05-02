import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Project } from '@/types';
import { getProjectImage } from '@/lib/projectImage';
import { formatIdrCompact, formatPercent, formatYears } from '@/lib/formatters';
import { MapPin, Star, Filter, Cpu, Users, Sparkles, Globe } from 'lucide-react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useMemo } from 'react';
import { useLanguage, getStoredLanguage } from '@/context/LanguageContext';

interface ProjectsPageProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export function ProjectsPage({ projects, onProjectClick }: ProjectsPageProps) {
  const { language } = useLanguage();
  const { getMatchScore, trackInteraction } = useRecommendations();
  
  // Calculate real match scores for all projects
  const scoredProjects = useMemo(() => {
    return projects.map(project => {
      const score = getMatchScore(project);
      return { project, score };
    }).sort((a, b) => b.score.overall - a.score.overall); // Sort by match score
  }, [projects, getMatchScore]);
  
  const handleClick = (project: Project) => {
    trackInteraction(project.id, 'view');
    onProjectClick(project);
  };

  // Helpers that read from localStorage at runtime — Vite CANNOT DCE these
  // because localStorage is a browser API unknown at build time
  const getDisplayName = (project: Project): string => {
    const currentLang = getStoredLanguage();
    if (currentLang === 'en' && project.nameEn) return project.nameEn;
    return project.nameId || project.name;
  };

  const getDisplayDescription = (project: Project): string => {
    const currentLang = getStoredLanguage();
    if (currentLang === 'en' && project.descriptionEn && project.descriptionEn.length > 50) {
      return project.descriptionEn;
    }
    return project.descriptionId || project.description;
  };

  const showEnSubtitle = (project: Project): boolean => {
    const currentLang = getStoredLanguage();
    return currentLang === 'en' && !!project.nameId && !!project.nameEn;
  };

  return (
    <section className="py-12 px-4 sm:px-8 lg:px-16 bg-[#F5F3EF] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* DEBUG: Language State */}
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
          <p className="text-sm font-mono text-yellow-800">
            DEBUG: language=<strong>{language}</strong> (from Context) | localStorage=<strong>{getStoredLanguage()}</strong> | 
            project384 descEn={scoredProjects.find(s => s.project.id === 384)?.project.descriptionEn?.length || 0} chars | 
            descId={scoredProjects.find(s => s.project.id === 384)?.project.descriptionId?.length || 0} chars
          </p>
        </div>

        {/* Engine info banner */}
        <div className="mb-6 p-4 bg-[#1B4D5C]/5 rounded-xl border border-[#1B4D5C]/10">
          <div className="flex items-center gap-4">
            <Sparkles className="w-5 h-5 text-[#C9963B]" />
            <div>
              <p className="text-sm font-semibold text-[#1B4D5C]">AI-Powered Project Ranking</p>
              <p className="text-xs text-[#6B7B8D]">
                Sorted by hybrid score: Content-Based (60%) + Collaborative Filtering (40%)
              </p>
            </div>
            <div className="ml-auto flex gap-3 text-xs text-[#6B7B8D]">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Content-Based
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> Collaborative
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <p className="text-[#6B7B8D]">
            Showing <strong className="text-[#1C2A33]">{projects.length}</strong> projects
            <span className="text-xs ml-2 text-[#C9963B]">(sorted by AI match score)</span>
          </p>
          <Button variant="outline" size="sm" className="text-[#6B7B8D]">
            <Filter className="w-4 h-4 mr-1" /> Filter
          </Button>
        </div>

        {scoredProjects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-[#6B7B8D]">No projects found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scoredProjects.map(({ project, score }) => (
              <Card
                key={project.id}
                className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => handleClick(project)}
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.nameEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = getProjectImage(project.sector);
                    }}
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                    <Badge className="bg-[#C9963B] text-white font-bold flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {score.overall}% Match
                    </Badge>
                    <Badge 
                      className={`text-white text-[10px] ${
                        score.confidence === 'High' ? 'bg-green-600' : 
                        score.confidence === 'Medium' ? 'bg-blue-600' : 'bg-gray-500'
                      }`}
                    >
                      {score.confidence === 'High' ? 'AI High' : 
                       score.confidence === 'Medium' ? 'AI Medium' : 'Profile'}
                    </Badge>
                    {/* Bilingual badge */}
                    {project.hasTranslation && (
                      <Badge className="bg-[#27AE60] text-white text-[10px] flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        EN
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 flex gap-1 flex-wrap justify-end max-w-[50%]">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-white/90 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                    <Badge className={`${project.status === 'Verified' ? 'bg-green-500' : 'bg-blue-500'} text-white text-xs`}>
                      {project.status}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5">
                  {/* Match breakdown bar */}
                  <div className="mb-3 p-2 bg-[#F5F3EF] rounded-lg">
                    <div className="flex items-center justify-between text-[10px] text-[#6B7B8D] mb-1">
                      <span>Content-Based: {score.contentBased}%</span>
                      <span>Collaborative: {score.collaborative}%</span>
                    </div>
                    <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-gray-200">
                      <div 
                        className="bg-[#1B4D5C] h-full" 
                        style={{ width: `${score.contentBased * 0.6}%` }} 
                      />
                      <div 
                        className="bg-[#C9963B] h-full" 
                        style={{ width: `${score.collaborative * 0.4}%` }} 
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-[#6B7B8D] mb-2">
                    <MapPin className="w-4 h-4" />
                    {project.province} — {project.location}
                  </div>
                  <h3 className="text-lg font-bold text-[#1C2A33] mb-1 group-hover:text-[#1B4D5C] transition-colors">
                    {getDisplayName(project)}
                  </h3>
                  {showEnSubtitle(project) && (
                    <p className="text-xs text-[#6B7B8D] italic mb-1">{project.nameId}</p>
                  )}
                  <p className="text-sm text-[#6B7B8D] mb-3 line-clamp-2">
                    {getDisplayDescription(project)}
                  </p>
                  
                  {/* Top match reason */}
                  {score.reasons.length > 0 && (
                    <div className="mb-3 text-xs text-[#6B7B8D] bg-white p-2 rounded border border-gray-100">
                      <strong className="text-[#1B4D5C]">Why matched:</strong> {score.reasons[0]}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                    <div className="text-center">
                      <p className="text-xs text-[#6B7B8D]">Investment</p>
                      <p className="text-sm font-bold text-[#1B4D5C]">{formatIdrCompact(project.investmentValue * 1_000_000)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#6B7B8D]">IRR</p>
                      <p className="text-sm font-bold text-[#C9963B]">{formatPercent(project.irr)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#6B7B8D]">Payback</p>
                      <p className="text-sm font-bold text-[#1B4D5C]">{formatYears(project.paybackPeriod)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
