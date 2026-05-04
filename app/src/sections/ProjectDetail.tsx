import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Project } from '@/types';
import type { AnalystReport, RiskFlag } from '@/lib/analystAgent';
import type { EnhancedAnalystReport } from '@/lib/analystLLM';
import { getRiskSeverityColor, getFeasibilityColor, getFeasibilityLabel } from '@/lib/analystAgent';
import { getProjectImage } from '@/lib/projectImage';
import { formatIdr } from '@/lib/formatters';
import { useLanguage, getStoredLanguage } from '@/context/LanguageContext';
import { ArrowLeft, MapPin, TrendingUp, DollarSign, Clock, BarChart3, FileText, CheckCircle, Share2, Bookmark, Cpu, Users, Sparkles, Target, Globe, Zap, Calendar, Bot } from 'lucide-react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { getEnrichedProject } from '@/data/bkpmFullDataLoader';
import type { EnrichedProject } from '@/data/bkpmFullDataLoader';
import { ProjectEnrichment } from '@/sections/ProjectEnrichment';
import { assessFinancial } from '@/lib/enhancedFinancialEngine';
import { assessRegulatory } from '@/lib/regulatoryAssessmentEngine';
import { assessTechnical } from '@/lib/technicalAssessmentEngine';
import { ProductionAssessmentDashboard } from '@/sections/ProductionAssessmentDashboard';
import { LegalDocumentChatbot } from '@/sections/LegalDocumentChatbot';
import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  analystReport?: AnalystReport | null;
  enhancedAnalystReport?: EnhancedAnalystReport | null;
}

export function ProjectDetail({ project, onBack, analystReport, enhancedAnalystReport }: ProjectDetailProps) {
  const { language: _lang } = useLanguage(); void _lang; // subscribe for re-render
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

  // Check if we have enriched data for this project
  const enrichedProject = useMemo(() => {
    const enriched = getEnrichedProject(project.id);
    if (enriched) return enriched;
    // Cast existing project if it already has enrichment fields
    if ('incentives' in project) return project as unknown as EnrichedProject;
    return null;
  }, [project]);

  // Color helper for score bars
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-[#1B4D5C]';
    if (value >= 40) return 'bg-[#C9963B]';
    return 'bg-red-400';
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 overflow-hidden">
        <img
          src={project.image}
          alt={(() => {
            const currentLang = getStoredLanguage();
            return currentLang === 'en' && project.nameEn ? project.nameEn : project.nameId || project.name;
          })()}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = getProjectImage(project.sector);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C2A33] via-[#1C2A33]/40 to-transparent" />
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/90 text-[#1B4D5C] hover:bg-white text-xs sm:text-sm"
            onClick={onBack}
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Back
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-10">
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
              {/* Language indicator */}
              {project.hasTranslation && (
                <Badge className="bg-[#27AE60] text-white flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {(() => {
                    const currentLang = getStoredLanguage();
                    return currentLang === 'en' ? 'EN' : 'ID';
                  })()}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {(() => {
                const currentLang = getStoredLanguage();
                return currentLang === 'en' && project.nameEn ? project.nameEn : project.nameId || project.name;
              })()}
            </h1>
            {(() => {
              const currentLang = getStoredLanguage();
              return currentLang === 'en' && project.nameId && (
                <p className="text-lg text-white/60 italic">{project.nameId}</p>
              );
            })()}
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
                  {project.hasTranslation && (
                    <Badge className="bg-[#27AE60] text-white text-[10px] ml-2">
                      <Globe className="w-3 h-3 mr-1" /> EN Available
                    </Badge>
                  )}
                </h2>
                <p className="text-[#1C2A33] leading-relaxed text-lg">
                  {(() => {
                    const currentLang = getStoredLanguage();
                    return currentLang === 'en' && project.descriptionEn ? project.descriptionEn : project.descriptionId || project.description;
                  })()}
                </p>
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
                {/* Project Location Map */}
                {project.coordinates.lat !== 0 && project.coordinates.lng !== 0 ? (
                  <div className="mt-4 rounded-lg overflow-hidden border border-gray-200" style={{ height: '280px' }}>
                    <MapContainer
                      center={[project.coordinates.lat, project.coordinates.lng]}
                      zoom={12}
                      scrollWheelZoom={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[project.coordinates.lat, project.coordinates.lng]}>
                        <Popup>
                          <div className="min-w-[180px]">
                            <p className="font-bold text-sm text-[#1B4D5C]">{project.nameEn || project.name}</p>
                            <p className="text-xs text-gray-500">{project.province} — {project.location}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {project.coordinates.lat.toFixed(4)}, {project.coordinates.lng.toFixed(4)}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-400">
                    Map coordinates not available for this project
                  </div>
                )}
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
                    <span className="font-bold text-lg">{formatIdr(project.investmentValue * 1_000_000)}</span>
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
                    <span className="font-bold text-lg">{formatIdr(project.npv * 1_000_000)}</span>
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

            {/* Enrichment Data (Incentives, Contacts, Gallery, etc.) */}
            {enrichedProject && (
              <ProjectEnrichment project={enrichedProject} />
            )}

            {/* Analyst Report (from Analysis Page) */}
            {analystReport && (
              <AnalystReportCard report={analystReport} enhanced={enhancedAnalystReport} />
            )}

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

function AnalystReportCard({ report, enhanced }: { report: AnalystReport; enhanced?: EnhancedAnalystReport | null }) {
  const color = getFeasibilityColor(report.overallFeasibility);
  const label = getFeasibilityLabel(report.overallFeasibility);
  const summary = enhanced?.llmSuccess ? enhanced.llmSummary : report.summary;

  return (
    <Card className="border-0 shadow-md mt-6" style={{ borderLeft: `4px solid ${color}` }}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-5 h-5 text-[#1B4D5C]" />
          <h3 className="font-bold text-[#1C2A33] text-lg">Analyst Report</h3>
          {enhanced?.llmSuccess && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px]">
              <Sparkles className="w-3 h-3 mr-1" /> AI Enhanced
            </Badge>
          )}
        </div>

        {/* Overall Score */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: color }}
          >
            {report.overallFeasibility}
          </div>
          <div>
            <p className="font-semibold text-[#1C2A33]">{label}</p>
            <p className="text-xs text-gray-500">Confidence: {Math.round(report.confidenceScore * 100)}%</p>
          </div>
        </div>

        {/* Four-dimension scores */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-[10px] text-gray-500">Financial</p>
            <p className="font-bold text-sm text-[#1B4D5C]">{report.financial.score}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-[10px] text-gray-500">Zone</p>
            <p className="font-bold text-sm text-[#1B4D5C]">{report.zone.alignmentScore}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-[10px] text-gray-500">Infra</p>
            <p className="font-bold text-sm text-[#1B4D5C]">{report.zone.infrastructureStatus === 'Ready' ? '✓' : report.zone.infrastructureStatus}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-[10px] text-gray-500">Risks</p>
            <p className="font-bold text-sm text-red-600">{report.riskFlags.length}</p>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-gray-600 leading-relaxed mb-3">{summary}</p>

        {/* Zones */}
        {report.zone.nearestIndustrialZones.length > 0 && (
          <div className="text-xs text-gray-500 mb-2">
            <span className="font-semibold">Nearest KEK/KI: </span>
            {report.zone.nearestIndustrialZones.slice(0, 2).join(', ')}
          </div>
        )}

        {/* Risk quick view */}
        {report.riskFlags.filter(r => r.severity === 'Critical' || r.severity === 'High').length > 0 && (
          <div className="space-y-1">
            {report.riskFlags
              .filter(r => r.severity === 'Critical' || r.severity === 'High')
              .slice(0, 3)
              .map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <Badge
                    className="text-[10px] px-1.5 py-0 flex-shrink-0"
                    style={{ backgroundColor: getRiskSeverityColor(r.severity), color: 'white' }}
                  >
                    {r.severity}
                  </Badge>
                  <span className="text-gray-600">{r.description}</span>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
