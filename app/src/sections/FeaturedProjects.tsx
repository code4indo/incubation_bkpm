import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { Project } from '@/types';
import { getProjectImage } from '@/lib/projectImage';
import { formatIdrCompact } from '@/lib/formatters';
import { useLanguage, getStoredLanguage } from '@/context/LanguageContext';
import { MapPin, ArrowRight, Star, Cpu, Users, TrendingUp } from 'lucide-react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useMemo } from 'react';

interface FeaturedProjectsProps {
  onProjectClick: (project: Project) => void;
}

export function FeaturedProjects({ onProjectClick }: FeaturedProjectsProps) {
  const { getRecommendations, trackInteraction } = useRecommendations();
  const { language } = useLanguage();
  
  const recommendations = useMemo(() => {
    return getRecommendations(3);
  }, [getRecommendations]);
  
  const handleClick = (project: Project) => {
    trackInteraction(project.id, 'view');
    onProjectClick(project);
  };

  const getDisplayName = (project: Project) => {
    const currentLang = getStoredLanguage();
    if (currentLang === 'en' && project.nameEn) return project.nameEn;
    return project.nameId || project.name;
  };

  return (
    <section className="py-20 px-4 sm:px-8 lg:px-16 bg-[#F5F3EF]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4D5C] mb-2">
              AI-Recommended Projects
            </h2>
            <p className="text-sm sm:text-base text-[#6B7B8D]">
              Personalized matches powered by hybrid Content-Based + Collaborative Filtering
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 text-xs text-[#6B7B8D]">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Content-Based Filtering
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> Collaborative Filtering
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-[#1B4D5C] text-[#1B4D5C] hover:bg-[#1B4D5C] hover:text-white flex-shrink-0"
            onClick={() => {}}
          >
            View All <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
            <Card
              key={rec.project.id}
              className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => handleClick(rec.project)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={rec.project.image}
                  alt={rec.project.nameEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = getProjectImage(rec.project.sector);
                  }}
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Badge className="bg-[#C9963B] text-white font-bold flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {rec.score.overall}% Match
                  </Badge>
                  <Badge 
                    className={`text-white text-[10px] ${
                      rec.score.confidence === 'High' ? 'bg-green-600' : 
                      rec.score.confidence === 'Medium' ? 'bg-blue-600' : 'bg-gray-500'
                    }`}
                  >
                    {rec.score.confidence === 'High' ? 'AI High Confidence' : 
                     rec.score.confidence === 'Medium' ? 'AI Medium Confidence' : 'Profile-Based'}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3 flex gap-1">
                  {rec.project.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-white/90 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <CardContent className="p-5">
                {/* Match Score Breakdown */}
                <div className="mb-3 p-2 bg-[#F5F3EF] rounded-lg">
                  <div className="flex items-center gap-2 text-[10px] text-[#6B7B8D] mb-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>CB: {rec.score.contentBased}% | CF: {rec.score.collaborative}%</span>
                  </div>
                  <div className="flex gap-1">
                    <div 
                      className="h-1 rounded-full bg-[#1B4D5C]" 
                      style={{ width: `${rec.score.contentBased * 0.6}%` }} 
                    />
                    <div 
                      className="h-1 rounded-full bg-[#C9963B]" 
                      style={{ width: `${rec.score.collaborative * 0.4}%` }} 
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-[#6B7B8D] mb-2">
                  <MapPin className="w-4 h-4" />
                  {rec.project.province}
                </div>
                <h3 className="text-lg font-bold text-[#1C2A33] mb-1 group-hover:text-[#1B4D5C] transition-colors">
                  {getDisplayName(rec.project)}
                </h3>
                {(() => {
                  const currentLang = getStoredLanguage();
                  return currentLang === 'en' && rec.project.nameId && rec.project.nameEn && (
                    <p className="text-xs text-[#6B7B8D] italic mb-2">{rec.project.nameId}</p>
                  );
                })()}
                <p className="text-sm text-[#6B7B8D] mb-4 line-clamp-2">
                  {(() => {
                    const currentLang = getStoredLanguage();
                    return currentLang === 'en' && rec.project.descriptionEn
                      ? rec.project.descriptionEn
                      : rec.project.descriptionId || rec.project.name;
                  })()}
                </p>
                
                {/* Top match reason */}
                {rec.score.reasons.length > 0 && (
                  <div className="mb-3 text-xs text-[#6B7B8D] bg-white p-2 rounded border border-gray-100">
                    <strong className="text-[#1B4D5C]">Why:</strong> {rec.score.reasons[0]}
                  </div>
                )}
                
                <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                  <div className="text-center">
                    <p className="text-xs text-[#6B7B8D]">Investment</p>
                    <p className="text-sm font-bold text-[#1B4D5C]">{formatIdrCompact(rec.project.investmentValue * 1_000_000, language)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#6B7B8D]">IRR</p>
                    <p className="text-sm font-bold text-[#C9963B]">{rec.project.irr}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#6B7B8D]">Sector</p>
                    <p className="text-sm font-bold text-[#1B4D5C]">{rec.project.sector}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
