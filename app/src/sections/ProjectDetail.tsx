import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Project } from '@/types';
import { ArrowLeft, MapPin, TrendingUp, DollarSign, Clock, BarChart3, FileText, CheckCircle, Share2, Bookmark, Cpu, Users, Sparkles, Target, Globe, Zap, Calendar, Bot } from 'lucide-react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { assessFinancial } from '@/lib/enhancedFinancialEngine';
import { assessRegulatory } from '@/lib/regulatoryAssessmentEngine';
import { assessTechnical } from '@/lib/technicalAssessmentEngine';
import { ProductionAssessmentDashboard } from '@/sections/ProductionAssessmentDashboard';
import { LegalDocumentChatbot } from '@/sections/LegalDocumentChatbot';
import { useMemo } from 'react';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

export function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  const { getMatchScore, trackInteraction } = useRecommendations();
  
  const score = useMemo(() => getMatchScore(project), [getMatchScore, project]);
  
  // Production-grade assessments
  const financialAssessment = useMemo(() => assessFinancial(
    project.id, project.investmentValue, project.irr, project.npv,
    project.paybackPeriod, project.sector, project.tags.includes('Tax Holiday'),
    project.sector === 'Manufacturing' || project.sector === 'Digital' ? 20 : 10
  ), [project]);
  
  const regulatoryAssessment = useMemo(() => assessRegulatory(
    project.id, project.sector, project.subSector, project.province,
    project.location, project.investmentValue, project.tags
  ), [project]);
  
  const technicalAssessment = useMemo(() => assessTechnical(project.id), [project.id]);
  
  const handleSave = () => trackInteraction(project.id, 'save');
  const handleShare = () => trackInteraction(project.id, 'share');
  const handleExpressInterest = () => trackInteraction(project.id, 'inquiry');

  // Color helper for score bars
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-[#1B4D5C]';
    if (value >= 40) return 'bg-[#C9963B]';
    return 'bg-red-400';
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <div className="relative h-80 md:h-96 overflow-hidden">
        <img
          src={project.image}
          alt={project.nameEn}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C2A33] via-[#1C2A33]/40 to-transparent" />
        <div className="absolute top-4 left-4">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/90 text-[#1B4D5C] hover:bg-white"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Projects
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <Badge className="bg-green-500 text-white">{project.status}</Badge>
              <Badge className="bg-[#C9963B] text-white">{project.category}</Badge>
              <Badge className="bg-[#1B4D5C] text-white flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Match: {score.overall}%
              </Badge>
              <Badge 
                className={`text-white ${
                  score.confidence === 'High' ? 'bg-green-600' : 
                  score.confidence === 'Medium' ? 'bg-blue-600' : 'bg-gray-500'
                }`}
              >
                {score.confidence === 'High' ? 'High Confidence' : 
                 score.confidence === 'Medium' ? 'Medium Confidence' : 'Profile-Based'}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{project.nameEn}</h1>
            <p className="text-lg text-white/80">{project.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-[#1B4D5C] mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Project Description
                </h2>
                <p className="text-[#1C2A33] leading-relaxed text-lg">{project.description}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-[#1B4D5C] mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" /> Location & Infrastructure
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1B4D5C]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#1B4D5C]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1C2A33]">Province</p>
                      <p className="text-[#6B7B8D]">{project.province}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1B4D5C]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#1B4D5C]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1C2A33]">Location</p>
                      <p className="text-[#6B7B8D]">{project.location}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-[#1B4D5C] mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Tags & Classification
                </h2>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="px-3 py-1 text-sm">{tag}</Badge>
                  ))}
                  <Badge variant="outline" className="px-3 py-1 text-sm">{project.sector}</Badge>
                  <Badge variant="outline" className="px-3 py-1 text-sm">{project.subSector}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* AI Match Reasons */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-[#1B4D5C] mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Why This Project Matches Your Profile
                </h2>
                <div className="space-y-3">
                  {score.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-[#F5F3EF] rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-[#C9963B]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-[#C9963B]" />
                      </div>
                      <p className="text-sm text-[#1C2A33]">{reason}</p>
                    </div>
                  ))}
                  {score.reasons.length === 0 && (
                    <p className="text-sm text-[#6B7B8D]">Complete your investor profile to see personalized match reasons.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* PRODUCTION ASSESSMENT DASHBOARD */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#1B4D5C] flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1B4D5C]">Production Due Diligence Assessment</h2>
                  <p className="text-xs text-[#6B7B8D]">Financial • Regulatory • Technical — Phase 3 Full Assessment</p>
                </div>
              </div>
              <ProductionAssessmentDashboard 
                financial={financialAssessment}
                regulatory={regulatoryAssessment}
                technical={technicalAssessment}
              />
            </div>

            {/* AI LEGAL DOCUMENT CHATBOT — NVIDIA Stack */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#1B4D5C] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1B4D5C]">AI Legal Document Analysis</h2>
                  <p className="text-xs text-[#6B7B8D]">NVIDIA Build Stack: Qwen3.5-122B-A10B + Nemotron Embed + Nemotron Rerank</p>
                </div>
              </div>
              <LegalDocumentChatbot project={project} />
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-md bg-[#1B4D5C]">
              <CardContent className="p-6 text-white">
                <h3 className="text-lg font-bold mb-4">Financial Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/20">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-[#C9963B]" />
                      <span className="text-white/80">Investment Value</span>
                    </div>
                    <span className="font-bold text-lg">Rp {project.investmentValue}T</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/20">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#C9963B]" />
                      <span className="text-white/80">IRR</span>
                    </div>
                    <span className="font-bold text-lg text-[#C9963B]">{project.irr}%</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/20">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#C9963B]" />
                      <span className="text-white/80">NPV</span>
                    </div>
                    <span className="font-bold text-lg">Rp {project.npv}T</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#C9963B]" />
                      <span className="text-white/80">Payback Period</span>
                    </div>
                    <span className="font-bold text-lg">{project.paybackPeriod} years</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Match Analysis with REAL scores */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-[#1B4D5C] mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C9963B]" /> AI Match Analysis
                </h3>
                <p className="text-xs text-[#6B7B8D] mb-4">
                  Based on your profile: {score.overall}% overall match
                </p>
                
                <div className="space-y-4">
                  {/* Overall Score */}
                  <div className="p-3 bg-[#1B4D5C]/5 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-[#1B4D5C]">Overall Match</span>
                      <span className="text-lg font-bold text-[#C9963B]">{score.overall}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full transition-all ${getScoreColor(score.overall)}`} 
                        style={{ width: `${score.overall}%` }} 
                      />
                    </div>
                  </div>

                  {/* Content-Based vs Collaborative */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-[#1B4D5C]/5 rounded-lg text-center">
                      <Cpu className="w-4 h-4 text-[#1B4D5C] mx-auto mb-1" />
                      <p className="text-xs text-[#6B7B8D]">Content-Based</p>
                      <p className="font-bold text-[#1B4D5C]">{score.contentBased}%</p>
                    </div>
                    <div className="p-2 bg-[#C9963B]/5 rounded-lg text-center">
                      <Users className="w-4 h-4 text-[#C9963B] mx-auto mb-1" />
                      <p className="text-xs text-[#6B7B8D]">Collaborative</p>
                      <p className="font-bold text-[#C9963B]">{score.collaborative}%</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    {/* Sector Alignment */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#6B7B8D] flex items-center gap-1">
                          <Target className="w-3 h-3" /> Sector Match
                        </span>
                        <span className="font-bold text-[#1B4D5C]">{score.contentDetails.sectorMatch}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getScoreColor(score.contentDetails.sectorMatch)}`} 
                          style={{ width: `${score.contentDetails.sectorMatch}%` }} 
                        />
                      </div>
                    </div>

                    {/* Location Fit */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#6B7B8D] flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Region Fit
                        </span>
                        <span className="font-bold text-[#1B4D5C]">{score.contentDetails.regionMatch}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getScoreColor(score.contentDetails.regionMatch)}`} 
                          style={{ width: `${score.contentDetails.regionMatch}%` }} 
                        />
                      </div>
                    </div>

                    {/* Ticket Size */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#6B7B8D] flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Ticket Size Fit
                        </span>
                        <span className="font-bold text-[#1B4D5C]">{score.contentDetails.ticketSizeFit}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getScoreColor(score.contentDetails.ticketSizeFit)}`} 
                          style={{ width: `${score.contentDetails.ticketSizeFit}%` }} 
                        />
                      </div>
                    </div>

                    {/* Risk Alignment */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#6B7B8D] flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Risk Alignment
                        </span>
                        <span className="font-bold text-[#1B4D5C]">{score.contentDetails.riskAlignment}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getScoreColor(score.contentDetails.riskAlignment)}`} 
                          style={{ width: `${score.contentDetails.riskAlignment}%` }} 
                        />
                      </div>
                    </div>

                    {/* Horizon Fit */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#6B7B8D] flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Horizon Fit
                        </span>
                        <span className="font-bold text-[#1B4D5C]">{score.contentDetails.horizonFit}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getScoreColor(score.contentDetails.horizonFit)}`} 
                          style={{ width: `${score.contentDetails.horizonFit}%` }} 
                        />
                      </div>
                    </div>

                    {/* Focus Area */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#6B7B8D] flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Focus Area Match
                        </span>
                        <span className="font-bold text-[#1B4D5C]">{score.contentDetails.focusAreaMatch}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getScoreColor(score.contentDetails.focusAreaMatch)}`} 
                          style={{ width: `${score.contentDetails.focusAreaMatch}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button 
                className="w-full bg-[#C9963B] hover:bg-[#B0802F] text-white py-6 text-lg font-semibold"
                onClick={handleExpressInterest}
              >
                Express Interest
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 py-5" onClick={handleSave}>
                  <Bookmark className="w-4 h-4 mr-2" /> Save
                </Button>
                <Button variant="outline" className="flex-1 py-5" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
