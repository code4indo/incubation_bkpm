/**
 * INVESTOR PROFILE PAGE — "My Profile" for simulated investor
 *
 * Key feature: CMS-powered investment suitability
 *   "Investment project apa yang cocok untuk saya?"
 *   → Top 10 peluang investasi terbaik berdasarkan profil investor
 *
 * Uses:
 *   - InvestorContext for global investor selection
 *   - CMS Engine (cmsEngine.ts) for real-time scoring
 *   - 20 BKPM sample projects as matching pool
 *
 * Since this is a simulation portal, the user can switch
 * between 42 investor profiles to see personalized results.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useInvestor } from '@/context/InvestorContext';
import { useLanguage } from '@/context/LanguageContext';
import { getCMSRecommendations, type CMSScoreBreakdown } from '@/lib/cmsEngine';
import { formatIdrCompact, formatPercent } from '@/lib/formatters';
import { SAMPLE_PROJECTS } from '@/data/sampleProjects';
import { ALL_SYNTHETIC_INVESTORS, SYNTHETIC_INTERACTIONS } from '@/data/semiSyntheticInvestors';
import { KBLI_TABLE } from '@/data/referenceData';
import type { InvestorProfile, InvestorType, Project } from '@/types';
import {
  User, Building2, MapPin, DollarSign, TrendingUp, Calendar,
  Target, Sparkles, Eye, Bookmark, Share2, MessageSquare,
  BarChart3, AlertTriangle, ChevronDown, ChevronUp, Zap,
  ShieldCheck, Layers, Leaf, Snowflake, ArrowRight, Trophy,
  Star, Flame, TrendingDown, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Color Maps ──────────────────────────────────────────────────────────────

const INVESTOR_TYPE_COLORS: Record<InvestorType, string> = {
  SWF: 'bg-amber-100 text-amber-800 border-amber-300',
  DFI: 'bg-teal-100 text-teal-800 border-teal-300',
  PE: 'bg-rose-100 text-rose-800 border-rose-300',
  VC: 'bg-purple-100 text-purple-800 border-purple-300',
  Corporate: 'bg-sky-100 text-sky-800 border-sky-300',
  FamilyOffice: 'bg-orange-100 text-orange-800 border-orange-300',
  Institutional: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  HNWI: 'bg-pink-100 text-pink-800 border-pink-300',
};

const INVESTOR_TYPE_LABELS: Record<InvestorType, string> = {
  SWF: 'Sovereign Wealth Fund',
  DFI: 'Development Finance Inst.',
  PE: 'Private Equity',
  VC: 'Venture Capital',
  Corporate: 'Corporate',
  FamilyOffice: 'Family Office',
  Institutional: 'Institutional',
  HNWI: 'High Net Worth Individual',
};

const SUB_SCORE_COLORS: Record<string, string> = {
  sContent: '#1B4D5C',
  sBehavior: '#C9963B',
  sPolicy: '#10B981',
  sRisk: '#6366F1',
};

const SUB_SCORE_BG: Record<string, string> = {
  sContent: 'bg-teal-50 border-teal-200',
  sBehavior: 'bg-amber-50 border-amber-200',
  sPolicy: 'bg-emerald-50 border-emerald-200',
  sRisk: 'bg-indigo-50 border-indigo-200',
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export function InvestorProfilePage() {
  const { investor, investorId, setInvestorById, isColdStart } = useInvestor();
  const { language } = useLanguage();

  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  // ── CMS Recommendations ──────────────────────────────────────────

  const recommendations = useMemo(
    () => getCMSRecommendations(investor, SAMPLE_PROJECTS, ALL_SYNTHETIC_INVESTORS, SYNTHETIC_INTERACTIONS, 10),
    [investor]
  );

  const topRecommendations = showAllRecommendations ? recommendations : recommendations.slice(0, 5);

  // Stats
  const avgScore = recommendations.length > 0
    ? (recommendations.reduce((s, r) => s + r.score.cms, 0) / recommendations.length * 100).toFixed(1)
    : '0';
  const topScore = recommendations.length > 0
    ? (recommendations[0].score.cms * 100).toFixed(1)
    : '0';

  // KBLI label helper
  function kbliLabel(code: string): string {
    const entry = KBLI_TABLE.find(k => k.code === code);
    if (!entry) return code;
    const label = language === 'en' ? entry.label_en : entry.label_id;
    return `${code} – ${label}`;
  }

  const riskColor = investor.riskAppetite === 'Aggressive' ? 'text-red-500' :
                    investor.riskAppetite === 'Moderate' ? 'text-[#C9963B]' : 'text-green-600';

  const horizonColor = investor.investmentHorizon === 'Short' ? 'text-green-600' :
                       investor.investmentHorizon === 'Medium' ? 'text-[#C9963B]' : 'text-[#1B4D5C]';

  return (
    <div className="min-h-screen bg-[#F5F3EF] pt-20 pb-12">
      {/* ── Header Banner with Investor Selector ─────────────────────── */}
      <div className="bg-[#1B4D5C] py-8 px-4 sm:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Investor Selector */}
          <div className="mb-6">
            <label className="text-xs text-teal-200 mb-1 block">
              {language === 'id' ? 'Simulasikan sebagai Investor' : 'Simulate as Investor'}
            </label>
            <Select value={investorId} onValueChange={setInvestorById}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white max-w-md hover:bg-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_SYNTHETIC_INVESTORS.map(inv => (
                  <SelectItem key={inv.id} value={inv.id}>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${INVESTOR_TYPE_COLORS[inv.investorType]}`}>
                        {INVESTOR_TYPE_LABELS[inv.investorType]}
                      </Badge>
                      {inv.company}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{investor.company}</h1>
                <Badge className={`text-xs ${INVESTOR_TYPE_COLORS[investor.investorType]}`}>
                  {INVESTOR_TYPE_LABELS[investor.investorType]}
                </Badge>
                {isColdStart && (
                  <Badge className="bg-blue-500 text-white text-xs flex items-center gap-1">
                    <Snowflake className="w-3 h-3" /> Cold Start
                  </Badge>
                )}
                <Badge className="bg-[#C9963B] text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Profile Active
                </Badge>
              </div>
              <p className="text-white/60 text-sm">{investor.name}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <QuickStat
              icon={<DollarSign className="w-4 h-4" />}
              label={language === 'id' ? 'Ticket Size' : 'Ticket Size'}
              value={`${investor.minTicketSize}-${investor.maxTicketSize}B`}
            />
            <QuickStat
              icon={<TrendingUp className="w-4 h-4" />}
              label={language === 'id' ? 'Risk Appetite' : 'Risk Appetite'}
              value={investor.riskAppetite}
            />
            <QuickStat
              icon={<Calendar className="w-4 h-4" />}
              label={language === 'id' ? 'Horizon' : 'Horizon'}
              value={investor.investmentHorizon}
            />
            <QuickStat
              icon={<Target className="w-4 h-4" />}
              label={language === 'id' ? 'Profile' : 'Profile'}
              value={`${investor.profileCompleteness}%`}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-8">
        {/* ══════════════════════════════════════════════════════════════
            KEY QUESTION: "Investment project apa yang cocok untuk saya?"
            ══════════════════════════════════════════════════════════════ */}
        <Card className="border-0 shadow-lg mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-[#1B4D5C] to-[#2A6B7F] p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#C9963B] flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {language === 'id'
                    ? 'Peluang Investasi Terbaik untuk Saya'
                    : 'Best Investment Opportunities for Me'}
                </h2>
                <p className="text-teal-100 text-sm sm:text-base">
                  {language === 'id'
                    ? `Berdasarkan profil ${investor.company} (${INVESTOR_TYPE_LABELS[investor.investorType]}), berikut adalah 10 proyek investasi paling cocok menggunakan algoritma CMS (Composite Matching Score).`
                    : `Based on ${investor.company}'s profile (${INVESTOR_TYPE_LABELS[investor.investorType]}), here are the top 10 most suitable investment projects using the CMS (Composite Matching Score) algorithm.`}
                </p>
              </div>
            </div>

            {/* CMS Formula */}
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <div className="font-mono text-xs text-white/90 leading-relaxed">
                CMS(i,p) = α·S<sub>content</sub> + β·S<sub>behavior</sub> + γ·S<sub>policy</sub> + δ·S<sub>risk</sub>
                <span className="text-teal-200 ml-2">
                  α={isColdStart ? '0.60' : '0.35'}, β={isColdStart ? '0.00' : '0.25'}, γ=0.25, δ=0.15
                </span>
                {isColdStart && (
                  <span className="block mt-1 text-amber-200 flex items-center gap-1">
                    <Snowflake className="w-3 h-3" /> Cold-start: β=0, α=0.60 (profile-based only)
                  </span>
                )}
              </div>
            </div>

            {/* Top-level Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-white/10 rounded-lg">
                <div className="text-2xl font-bold text-[#C9963B]">{topScore}%</div>
                <div className="text-xs text-teal-200">{language === 'id' ? 'Skor Terbaik' : 'Top Score'}</div>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-lg">
                <div className="text-2xl font-bold text-white">{avgScore}%</div>
                <div className="text-xs text-teal-200">{language === 'id' ? 'Rata-rata' : 'Average'}</div>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-lg">
                <div className="text-2xl font-bold text-white">{SAMPLE_PROJECTS.length}</div>
                <div className="text-xs text-teal-200">{language === 'id' ? 'Total Proyek' : 'Total Projects'}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Top 10 Recommendation Cards ─────────────────────────────── */}
        <div className="space-y-3 mb-8">
          {topRecommendations.map(rec => (
            <RecommendationCard
              key={rec.project.id}
              recommendation={rec}
              isExpanded={expandedProject === rec.project.id}
              onToggle={() => setExpandedProject(expandedProject === rec.project.id ? null : rec.project.id)}
              kbliLabel={kbliLabel}
              locale={language}
            />
          ))}

          {/* Show More / Show Less */}
          {recommendations.length > 5 && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                className="border-[#1B4D5C] text-[#1B4D5C] hover:bg-[#1B4D5C] hover:text-white"
                onClick={() => setShowAllRecommendations(!showAllRecommendations)}
              >
                {showAllRecommendations
                  ? (language === 'id' ? 'Tampilkan Lebih Sedikit' : 'Show Less')
                  : (language === 'id' ? `Lihat Semua 10 Rekomendasi` : `View All 10 Recommendations`)}
                {showAllRecommendations ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            INVESTOR PROFILE DETAILS (2-column layout)
            ══════════════════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Investment Preferences */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-[#1B4D5C] flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {language === 'id' ? 'Preferensi Investasi' : 'Investment Preferences'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sector Preferences */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-[#1B4D5C]" />
                    <span className="font-semibold text-[#1C2A33]">
                      {language === 'id' ? 'Sektor Pilihan' : 'Preferred Sectors'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {investor.sectorPreferences.map(sector => (
                      <Badge key={sector} className="bg-[#1B4D5C] text-white px-3 py-1">
                        {sector}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-[#6B7B8D] mt-2">
                    {language === 'id'
                      ? 'Proyek di sektor ini mendapat boost skor kecocokan hingga 25%'
                      : 'Projects in these sectors receive up to 25% match score boost'}
                  </p>
                </div>

                {/* Ticket Size Range */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-[#1B4D5C]" />
                    <span className="font-semibold text-[#1C2A33]">
                      {language === 'id' ? 'Kisaran Investasi' : 'Investment Ticket Size'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-[#F5F3EF] rounded-lg">
                    <div className="text-center flex-1">
                      <p className="text-xs text-[#6B7B8D]">{language === 'id' ? 'Minimum' : 'Minimum'}</p>
                      <p className="text-xl font-bold text-[#1B4D5C]">
                        {formatIdrCompact(investor.minTicketSize * 1_000_000_000, language)}
                      </p>
                    </div>
                    <div className="w-8 h-0.5 bg-[#C9963B]" />
                    <div className="text-center flex-1">
                      <p className="text-xs text-[#6B7B8D]">{language === 'id' ? 'Maksimum' : 'Maximum'}</p>
                      <p className="text-xl font-bold text-[#1B4D5C]">
                        {formatIdrCompact(investor.maxTicketSize * 1_000_000_000, language)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Two Column: Risk + Horizon */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F5F3EF] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-[#1B4D5C]" />
                      <span className="font-semibold text-[#1C2A33]">
                        {language === 'id' ? 'Selera Risiko' : 'Risk Appetite'}
                      </span>
                    </div>
                    <p className={`text-2xl font-bold ${riskColor}`}>{investor.riskAppetite}</p>
                    <p className="text-xs text-[#6B7B8D] mt-1">
                      {language === 'id' ? 'Skor: ' : 'Score: '}{(investor.riskToleranceScore * 100).toFixed(0)}/100
                      {' · '}
                      {investor.riskAppetite === 'Conservative'
                        ? (language === 'id' ? 'Target IRR: 10-16%' : 'Target IRR: 10-16%')
                        : investor.riskAppetite === 'Moderate'
                          ? (language === 'id' ? 'Target IRR: 15-22%' : 'Target IRR: 15-22%')
                          : (language === 'id' ? 'Target IRR: 20-30%' : 'Target IRR: 20-30%')}
                    </p>
                  </div>
                  <div className="p-4 bg-[#F5F3EF] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-[#1B4D5C]" />
                      <span className="font-semibold text-[#1C2A33]">
                        {language === 'id' ? 'Jangka Waktu' : 'Investment Horizon'}
                      </span>
                    </div>
                    <p className={`text-2xl font-bold ${horizonColor}`}>{investor.investmentHorizon}</p>
                    <p className="text-xs text-[#6B7B8D] mt-1">
                      {investor.investmentHorizon === 'Short'
                        ? (language === 'id' ? 'Payback: < 5 tahun' : 'Payback: < 5 years')
                        : investor.investmentHorizon === 'Medium'
                          ? (language === 'id' ? 'Payback: 5-10 tahun' : 'Payback: 5-10 years')
                          : (language === 'id' ? 'Payback: > 10 tahun' : 'Payback: > 10 years')}
                    </p>
                  </div>
                </div>

                {/* Project Types & KBLI Codes */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-4 h-4 text-[#1B4D5C]" />
                      <span className="font-semibold text-[#1C2A33] text-sm">
                        {language === 'id' ? 'Tipe Proyek' : 'Project Types'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {investor.preferredProjectTypes.map(pt => (
                        <Badge key={pt} variant="outline" className="border-[#1B4D5C] text-[#1B4D5C] px-2 py-0.5 text-xs">
                          {pt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-[#1B4D5C]" />
                      <span className="font-semibold text-[#1C2A33] text-sm">KBLI Codes</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {investor.preferredKbliCodes.map(code => (
                        <Badge key={code} variant="secondary" className="px-2 py-0.5 text-xs font-mono">
                          {kbliLabel(code)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regional Preferences */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-[#1B4D5C] flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {language === 'id' ? 'Preferensi Wilayah' : 'Regional Preferences'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {investor.preferredProvinces.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-[#1C2A33] mb-2">
                      {language === 'id' ? 'Provinsi Pilihan' : 'Preferred Provinces'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {investor.preferredProvinces.map(p => (
                        <Badge key={p} variant="outline" className="border-[#1B4D5C] text-[#1B4D5C] px-3 py-1">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {investor.preferredRegions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-[#1C2A33] mb-2">
                      {language === 'id' ? 'Pulau/Wilayah' : 'Preferred Islands/Regions'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {investor.preferredRegions.map(r => (
                        <Badge key={r} variant="secondary" className="px-3 py-1">{r}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Focus Areas & ESG */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-[#1B4D5C] flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {language === 'id' ? 'Fokus & ESG' : 'Focus Areas & ESG'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-[#1C2A33] mb-2">
                    {language === 'id' ? 'Area Fokus' : 'Focus Areas'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {investor.focusAreas.map(area => (
                      <Badge key={area} className="bg-[#C9963B]/20 text-[#C9963B] border border-[#C9963B]/30 px-3 py-1">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
                {investor.esgRequirements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-[#1C2A33] mb-2">
                      {language === 'id' ? 'Persyaratan ESG' : 'ESG Requirements'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {investor.esgRequirements.map(req => (
                        <Badge key={req} variant="outline" className="border-green-400 text-green-700 px-3 py-1">
                          <Leaf className="w-3 h-3 mr-1" /> {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Profile Impact & Insights */}
          <div className="space-y-6">
            {/* Profile Completeness */}
            <Card className="border-0 shadow-md bg-[#1B4D5C] text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {language === 'id' ? 'Dampak Profil terhadap Rekomendasi' : 'Profile Impact on Recommendations'}
                </h3>
                <div className="space-y-3">
                  <ImpactBar
                    label={language === 'id' ? 'Kecocokan Sektor' : 'Sector Match'}
                    weight="25%"
                    fill={investor.sectorPreferences.length > 0}
                  />
                  <ImpactBar
                    label={language === 'id' ? 'Kecocokan Skala' : 'Ticket Size Fit'}
                    weight="20%"
                    fill={investor.minTicketSize > 0 && investor.maxTicketSize > 0}
                  />
                  <ImpactBar
                    label={language === 'id' ? 'Kecocokan Wilayah' : 'Region Match'}
                    weight="20%"
                    fill={investor.preferredProvinces.length > 0 || investor.preferredRegions.length > 0}
                  />
                  <ImpactBar
                    label={language === 'id' ? 'Keselarasan Risiko' : 'Risk Alignment'}
                    weight="15%"
                    fill={investor.riskToleranceScore > 0}
                  />
                  <ImpactBar
                    label={language === 'id' ? 'Kecocokan Waktu' : 'Horizon Fit'}
                    weight="10%"
                    fill={investor.investmentHorizon !== undefined}
                  />
                  <ImpactBar
                    label={language === 'id' ? 'Kecocokan Fokus' : 'Focus Area Match'}
                    weight="10%"
                    fill={investor.focusAreas.length > 0}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Profile Score */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-[#6B7B8D] mb-2">
                  {language === 'id' ? 'Kelengkapan Profil' : 'Profile Completeness'}
                </p>
                <p className="text-4xl font-bold text-[#1B4D5C] mb-2">{investor.profileCompleteness}%</p>
                <Progress value={investor.profileCompleteness} className="h-2 mb-4" />
                <p className="text-xs text-[#6B7B8D]">
                  {investor.profileCompleteness >= 90
                    ? (language === 'id' ? 'Profil sangat lengkap — rekomendasi akurat' : 'Profile very complete — accurate recommendations')
                    : investor.profileCompleteness >= 70
                      ? (language === 'id' ? 'Profil cukup lengkap — tambahkan detail untuk akurasi lebih' : 'Profile fairly complete — add details for better accuracy')
                      : (language === 'id' ? 'Profil kurang lengkap — rekomendasi mungkin kurang akurat' : 'Profile incomplete — recommendations may be less accurate')}
                </p>
              </CardContent>
            </Card>

            {/* CMS Matching Info */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="font-bold text-[#1B4D5C] mb-3">
                  {language === 'id' ? 'Cara Kerja Rekomendasi' : 'How Recommendations Work'}
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#1B4D5C] text-white text-xs flex items-center justify-center flex-shrink-0">1</div>
                    <p className="text-[#6B7B8D]">
                      {language === 'id'
                        ? '<strong>Atribut profil</strong> (sektor, ticket size, wilayah) dicocokkan dengan setiap proyek → S_content'
                        : 'Your <strong>profile attributes</strong> (sector, ticket size, region) are matched against each project → S_content'}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#1B4D5C] text-white text-xs flex items-center justify-center flex-shrink-0">2</div>
                    <p className="text-[#6B7B8D]">
                      {language === 'id'
                        ? '<strong>Riwayat interaksi</strong> (view, save, inquiry) dibandingkan dengan investor serupa → S_behavior'
                        : 'Your <strong>interaction history</strong> (views, saves, inquiries) is compared with similar investors → S_behavior'}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#1B4D5C] text-white text-xs flex items-center justify-center flex-shrink-0">3</div>
                    <p className="text-[#6B7B8D]">
                      {language === 'id'
                        ? '<strong>Keselarasan kebijakan</strong> (PSN, DNI, KEK, prioritas sektor) dinilai → S_policy'
                        : '<strong>Policy alignment</strong> (PSN, DNI, KEK, sectoral priority) is evaluated → S_policy'}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#C9963B] text-white text-xs flex items-center justify-center flex-shrink-0">4</div>
                    <p className="text-[#6B7B8D]">
                      {language === 'id'
                        ? 'Keempat sinyal digabung: α·S_content + β·S_behavior + γ·S_policy + δ·S_risk → <strong>CMS Score</strong>'
                        : 'All four signals are combined: α·S_content + β·S_behavior + γ·S_policy + δ·S_risk → <strong>CMS Score</strong>'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cold Start Warning */}
            {isColdStart && (
              <Card className="border-0 shadow-md border-l-4 border-l-blue-400">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Snowflake className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-blue-700 mb-1">
                        {language === 'id' ? 'Mode Cold Start' : 'Cold Start Mode'}
                      </h3>
                      <p className="text-sm text-blue-600">
                        {language === 'id'
                          ? 'Investor ini memiliki sedikit data perilaku. Bobot β (behavior) dinonaktifkan dan dialihkan ke α (content) agar rekomendasi tetap berfungsi berdasarkan profil saja.'
                          : 'This investor has limited behavioral data. The β (behavior) weight is disabled and redistributed to α (content) so recommendations still work based on profile only.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Simulation Notice */}
            <Card className="border-0 shadow-md" style={{ borderLeft: '4px solid #C9963B' }}>
              <CardContent className="p-4 flex gap-3">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#C9963B' }} />
                <div>
                  <div className="font-semibold text-sm mb-1" style={{ color: '#1B4D5C' }}>
                    {language === 'id' ? 'Portal Simulasi' : 'Simulation Portal'}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {language === 'id'
                      ? 'Anda dapat memilih investor mana saja untuk disimulasikan. Setiap profil menghasilkan rekomendasi yang berbeda berdasarkan preferensi sektor, risiko, skala investasi, dan wilayah.'
                      : 'You can select any investor to simulate. Each profile produces different recommendations based on sector preferences, risk appetite, investment scale, and regional focus.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-white/10 rounded-lg">
      <div className="text-[#C9963B]">{icon}</div>
      <div>
        <div className="text-xs text-teal-200">{label}</div>
        <div className="text-sm font-semibold text-white">{value}</div>
      </div>
    </div>
  );
}

function ImpactBar({ label, weight, fill }: { label: string; weight: string; fill: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-[#C9963B]">{weight}</span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${fill ? 'bg-[#C9963B]' : 'bg-white/30'}`}
          style={{ width: fill ? '100%' : '30%' }}
        />
      </div>
    </div>
  );
}

function RecommendationCard({
  recommendation,
  isExpanded,
  onToggle,
  kbliLabel,
  locale,
}: {
  recommendation: { project: Project; score: CMSScoreBreakdown; rank: number };
  isExpanded: boolean;
  onToggle: () => void;
  kbliLabel: (code: string) => string;
  locale: 'id' | 'en';
}) {
  const { project, score, rank } = recommendation;
  const cmsPct = (score.cms * 100).toFixed(1);
  const scoreColor = score.cms >= 0.7 ? '#10B981' : score.cms >= 0.5 ? '#C9963B' : '#EF4444';

  // Rank badge style
  const rankBadge = rank === 1
    ? 'bg-gradient-to-br from-yellow-400 to-amber-600'
    : rank === 2
      ? 'bg-gradient-to-br from-gray-300 to-gray-500'
      : rank === 3
        ? 'bg-gradient-to-br from-amber-600 to-amber-800'
        : 'bg-[#1B4D5C]';

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div
        className="cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={onToggle}
      >
        <div className="p-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Rank */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${rankBadge}`}>
              {rank === 1 ? <Star className="w-5 h-5" /> : `#${rank}`}
            </div>

            {/* Project Info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate text-sm sm:text-base">{project.name}</div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                  {project.sector}
                </Badge>
                <span className="text-xs text-gray-500">{project.province}</span>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-xs text-gray-500">{project.projectType}</span>
              </div>
            </div>

            {/* Score */}
            <div className="flex-shrink-0 text-right">
              <div className="text-xl sm:text-2xl font-bold" style={{ color: scoreColor }}>{cmsPct}%</div>
              <div className="text-xs text-gray-400">CMS</div>
            </div>

            {/* Mini bars */}
            <div className="hidden md:flex flex-col gap-1 w-28">
              <MiniBar label="Content" value={score.sContent} color={SUB_SCORE_COLORS.sContent} />
              <MiniBar label="Behavior" value={score.sBehavior} color={SUB_SCORE_COLORS.sBehavior} />
              <MiniBar label="Policy" value={score.sPolicy} color={SUB_SCORE_COLORS.sPolicy} />
              <MiniBar label="Risk" value={score.sRisk} color={SUB_SCORE_COLORS.sRisk} />
            </div>

            {/* Expand arrow */}
            <div className="flex-shrink-0">
              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>
          </div>
        </div>
      </div>

      {/* ── Expanded Details ────────────────────────────────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t pt-4">
              {/* Sub-score breakdown */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SubScoreCard
                  title="S_content"
                  score={score.sContent}
                  alpha={score.alphaAdj}
                  icon={<Layers className="w-4 h-4" />}
                  color={SUB_SCORE_COLORS.sContent}
                  bg={SUB_SCORE_BG.sContent}
                  details={
                    <div className="space-y-1 text-xs">
                      <DetailRow label="Sector" value={score.contentDetails.sectorMatch} />
                      <DetailRow label="Geography" value={score.contentDetails.geoMatch} />
                      <DetailRow label="Scale" value={score.contentDetails.scaleMatch} />
                      <DetailRow label="Stage" value={score.contentDetails.stageMatch} />
                    </div>
                  }
                />
                <SubScoreCard
                  title="S_behavior"
                  score={score.sBehavior}
                  beta={score.betaAdj}
                  icon={<Eye className="w-4 h-4" />}
                  color={SUB_SCORE_COLORS.sBehavior}
                  bg={SUB_SCORE_BG.sBehavior}
                  details={
                    <div className="space-y-1 text-xs">
                      <DetailRow label="Network Diff." value={score.behaviorDetails.dNet} />
                      <DetailRow label="Domain Pref." value={score.behaviorDetails.pDomain} />
                      <div className="text-gray-400 mt-1">
                        {score.isColdStart ? 'Cold-start: no behavior data' : `${score.behaviorDetails.interactionCount} interactions`}
                      </div>
                    </div>
                  }
                />
                <SubScoreCard
                  title="S_policy"
                  score={score.sPolicy}
                  gamma={0.25}
                  icon={<Leaf className="w-4 h-4" />}
                  color={SUB_SCORE_COLORS.sPolicy}
                  bg={SUB_SCORE_BG.sPolicy}
                  details={
                    <div className="space-y-1 text-xs">
                      <DetailRow label="PSN Align" value={score.policyDetails.psnAlignment} />
                      <DetailRow label="DNI Align" value={score.policyDetails.dniAlignment} />
                      <DetailRow label="KEK Align" value={score.policyDetails.kekAlignment} />
                      <DetailRow label="Priority" value={score.policyDetails.sectoralPriority} />
                      <DetailRow label="Job Creation" value={score.policyDetails.jobCreationScore} />
                    </div>
                  }
                />
                <SubScoreCard
                  title="S_risk"
                  score={score.sRisk}
                  delta={0.15}
                  icon={<ShieldCheck className="w-4 h-4" />}
                  color={SUB_SCORE_COLORS.sRisk}
                  bg={SUB_SCORE_BG.sRisk}
                  details={
                    <div className="space-y-1 text-xs">
                      <DetailRow label="Investor Risk" value={score.riskDetails.investorRisk} />
                      <DetailRow label="Project Risk" value={score.riskDetails.projectRisk} />
                      <div className="text-gray-400 mt-1">
                        Δ = {score.riskDetails.riskDelta.toFixed(2)} | Macro: {score.riskDetails.macroAdjustment.toFixed(3)}
                      </div>
                    </div>
                  }
                />
              </div>

              {/* Project details & Reasons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Project Details</div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div><span className="text-gray-400">IRR:</span> {project.irr}%</div>
                    <div><span className="text-gray-400">Payback:</span> {project.paybackPeriod} years</div>
                    <div><span className="text-gray-400">Investment:</span> {formatIdrCompact(project.investmentValue * 1_000_000, locale)}</div>
                    <div><span className="text-gray-400">KBLI:</span> {(project.kbliCodes || []).map(kbliLabel).join(', ')}</div>
                    <div><span className="text-gray-400">Tags:</span> {project.tags.join(', ')}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    {locale === 'id' ? 'Alasan Kecocokan' : 'Match Reasons'}
                  </div>
                  <ul className="space-y-1">
                    {score.reasons.map((r, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <Zap className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#C9963B' }} />
                        {r}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2">
                    <Badge className={`text-xs ${score.confidence === 'High' ? 'bg-emerald-500' : score.confidence === 'Medium' ? 'bg-amber-500' : 'bg-red-500'} text-white`}>
                      {score.confidence} {locale === 'id' ? 'Kepercayaan' : 'Confidence'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-gray-400 w-12">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value * 100}%`, background: color }} />
      </div>
      <span className="text-[10px] text-gray-400 w-6 text-right">{(value * 100).toFixed(0)}</span>
    </div>
  );
}

function SubScoreCard({ title, score, alpha, beta, gamma, delta, icon, color, bg, details }: {
  title: string;
  score: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
  delta?: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  details: React.ReactNode;
}) {
  const weight = alpha ?? beta ?? gamma ?? delta ?? 0;
  const weightLabel = alpha !== undefined ? 'α' : beta !== undefined ? 'β' : gamma !== undefined ? 'γ' : 'δ';
  return (
    <div className={`p-3 rounded-lg border ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div style={{ color }}>{icon}</div>
          <span className="text-xs font-semibold" style={{ color }}>{title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">{weightLabel}={weight.toFixed(2)}</span>
          <span className="text-sm font-bold" style={{ color }}>{(score * 100).toFixed(1)}%</span>
        </div>
      </div>
      <Progress value={score * 100} className="h-1.5 mb-2" />
      {details}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gray-400" style={{ width: `${value * 100}%` }} />
        </div>
        <span className="font-mono text-gray-600 w-8 text-right">{(value * 100).toFixed(0)}</span>
      </div>
    </div>
  );
}
