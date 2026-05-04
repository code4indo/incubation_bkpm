/**
 * CMS MATCHING DEMO PAGE — Interactive investor-project matching
 *
 * Features:
 *   - Investor selector with 42 semi-synthetic profiles
 *   - Compare mode: select two investors to compare scores side-by-side
 *   - Expandable project cards with full sub-score breakdowns
 *   - Visual progress bars for each component (content, behavior, policy, risk)
 *   - Match reasons with confidence badges
 *   - Cold-start indicator and weight adjustment display
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, ChevronDown, ChevronUp, Layers, Eye, Leaf,
  ShieldCheck, Zap, Info, Snowflake
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ALL_SYNTHETIC_INVESTORS, SYNTHETIC_INTERACTIONS } from '@/data/semiSyntheticInvestors';
import { SAMPLE_PROJECTS } from '@/data/sampleProjects';
import { calculateCMS, getCMSRecommendations, type CMSScoreBreakdown } from '@/lib/cmsEngine';
import { KBLI_TABLE } from '@/data/referenceData';
import { useLanguage, type Language } from '@/context/LanguageContext';
import type { InvestorProfile, InvestorType } from '@/types';
import type { Project } from '@/types';

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

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export function CMSMatchingPage() {
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>(ALL_SYNTHETIC_INVESTORS[0].id);
  const [compareInvestorId, setCompareInvestorId] = useState<string | null>(null);
  const [topN, setTopN] = useState(10);
  const [expandedProject, setExpandedProject] = useState<number | null>(null);

  // ── Compute recommendations ──────────────────────────────────────────

  const selectedInvestor = useMemo(
    () => ALL_SYNTHETIC_INVESTORS.find(i => i.id === selectedInvestorId)!,
    [selectedInvestorId]
  );

  const recommendations = useMemo(
    () => getCMSRecommendations(selectedInvestor, SAMPLE_PROJECTS, ALL_SYNTHETIC_INVESTORS, SYNTHETIC_INTERACTIONS, topN),
    [selectedInvestor, topN]
  );

  const compareRecommendations = useMemo(() => {
    if (!compareInvestorId) return null;
    const compareInv = ALL_SYNTHETIC_INVESTORS.find(i => i.id === compareInvestorId);
    if (!compareInv) return null;
    return getCMSRecommendations(compareInv, SAMPLE_PROJECTS, ALL_SYNTHETIC_INVESTORS, SYNTHETIC_INTERACTIONS, topN);
  }, [compareInvestorId, topN]);

  // ── Stats ────────────────────────────────────────────────────────────

  const avgScore = recommendations.length > 0
    ? (recommendations.reduce((s, r) => s + r.score.cms, 0) / recommendations.length * 100).toFixed(1)
    : '0';
  const topScore = recommendations.length > 0
    ? (recommendations[0].score.cms * 100).toFixed(1)
    : '0';
  const coldStartCount = recommendations.filter(r => r.score.isColdStart).length;

  const { language } = useLanguage();

  function kbliLabel(code: string): string {
    const entry = KBLI_TABLE.find(k => k.code === code);
    if (!entry) return code;
    const label = language === 'en' ? entry.label_en : entry.label_id;
    return `${code} – ${label}`;
  }

  // ═════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen" style={{ background: '#F5F3EF' }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden" style={{ background: '#1B4D5C' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, #C9963B 0%, transparent 70%)', transform: 'translate(30%, -40%)' }} />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, #C9963B 0%, transparent 70%)', transform: 'translate(-30%, 40%)' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-8 h-8" style={{ color: '#C9963B' }} />
            <span className="text-sm font-medium tracking-wider uppercase" style={{ color: '#C9963B' }}>
              BKPM Investment Matching
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
            CMS Matching Engine
          </h1>
          <p className="text-teal-100 text-sm sm:text-base max-w-3xl">
            AI-powered investor-project matching using the Composite Matching Score (CMS) formula: α·S_content + β·S_behavior + γ·S_policy + δ·S_risk. Select an investor to see top recommended projects.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Investor Selector ──────────────────────────────────────── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold" style={{ color: '#1B4D5C' }}>
              Select Investor Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary investor */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Primary Investor</label>
                <Select value={selectedInvestorId} onValueChange={setSelectedInvestorId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_SYNTHETIC_INVESTORS.map(inv => (
                      <SelectItem key={inv.id} value={inv.id}>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${INVESTOR_TYPE_COLORS[inv.investorType]}`}>
                            {INVESTOR_TYPE_LABELS[inv.investorType]}
                          </Badge>
                          {inv.company} — {inv.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Compare investor */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Compare With (Optional)</label>
                <Select value={compareInvestorId || '_none'} onValueChange={v => setCompareInvestorId(v === '_none' ? null : v)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="No comparison" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No comparison</SelectItem>
                    {ALL_SYNTHETIC_INVESTORS
                      .filter(i => i.id !== selectedInvestorId)
                      .map(inv => (
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
            </div>

            {/* Selected investor info card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InvestorInfoCard investor={selectedInvestor} />
              {compareInvestorId && (() => {
                const cmp = ALL_SYNTHETIC_INVESTORS.find(i => i.id === compareInvestorId);
                return cmp ? <InvestorInfoCard investor={cmp} isCompare /> : null;
              })()}
            </div>
          </CardContent>
        </Card>

        {/* ── CMS Formula & Stats ────────────────────────────────────── */}
        <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #C9963B' }}>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-start gap-6">
              <div className="flex-1 min-w-[300px]">
                <div className="text-sm font-semibold mb-2" style={{ color: '#1B4D5C' }}>CMS Formula (Active Weights)</div>
                <div className="font-mono text-xs bg-gray-50 p-3 rounded-lg border text-gray-700 leading-relaxed">
                  CMS(i,p) = α·S<sub>content</sub> + β·S<sub>behavior</sub> + γ·S<sub>policy</sub> + δ·S<sub>risk</sub><br />
                  <span className="text-gray-400">
                    α={recommendations[0]?.score.isColdStart ? '0.60' : '0.35'}, β={recommendations[0]?.score.isColdStart ? '0.00' : '0.25'}, γ=0.25, δ=0.15
                  </span>
                  {recommendations[0]?.score.isColdStart && (
                    <span className="block mt-1 text-amber-600 flex items-center gap-1">
                      <Snowflake className="w-3 h-3" /> Cold-start mode: β=0, α=0.60 (profile-based only)
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <StatBox label="Avg Score" value={`${avgScore}%`} accent="#1B4D5C" />
                <StatBox label="Top Score" value={`${topScore}%`} accent="#C9963B" />
                <StatBox label="Projects" value={String(SAMPLE_PROJECTS.length)} accent="#6366F1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Top N selector ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Show top</span>
          <Select value={String(topN)} onValueChange={v => setTopN(parseInt(v))}>
            <SelectTrigger className="w-[80px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-gray-400">of {SAMPLE_PROJECTS.length} projects</span>
        </div>

        {/* ── Recommendations List ────────────────────────────────────── */}
        <div className="space-y-3">
          {recommendations.map(rec => {
            const compareRec = compareRecommendations?.find(cr => cr.project.id === rec.project.id);
            return (
              <RecommendationCard
                key={rec.project.id}
                recommendation={rec}
                compareScore={compareRec?.score}
                isExpanded={expandedProject === rec.project.id}
                onToggle={() => setExpandedProject(expandedProject === rec.project.id ? null : rec.project.id)}
                kbliLabel={kbliLabel}
                locale={language}
              />
            );
          })}
        </div>

        {/* ── Data Source Notice ──────────────────────────────────────── */}
        <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #C9963B' }}>
          <CardContent className="p-4 flex gap-3">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#C9963B' }} />
            <div>
              <div className="font-semibold text-sm mb-1" style={{ color: '#1B4D5C' }}>Demo Data Source</div>
              <p className="text-xs text-gray-600 leading-relaxed">
                This demo uses 20 sample BKPM projects and 42 semi-synthetic investor profiles. CMS scores are computed
                in real-time using the full 4-component formula with cold-start handling. Select different investor types
                (SWF, VC, HNWI) to see how the formula adapts. Cold-start investors (low profile completeness / few
                interactions) will have β=0 and α=0.60, making matching profile-based only.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

function StatBox({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold" style={{ color: accent }}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function InvestorInfoCard({ investor, isCompare = false }: {
  investor: InvestorProfile;
  isCompare?: boolean;
}) {
  const border = isCompare ? 'border-amber-300 bg-amber-50/30' : 'border-teal-300 bg-teal-50/30';
  return (
    <div className={`p-3 rounded-lg border ${border}`}>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className={`text-xs ${INVESTOR_TYPE_COLORS[investor.investorType]}`}>
          {INVESTOR_TYPE_LABELS[investor.investorType]}
        </Badge>
        <span className="font-semibold text-sm text-gray-900">{investor.company}</span>
        {investor.profileCompleteness < 50 && (
          <Badge className="bg-red-500 text-white text-xs flex items-center gap-1">
            <Snowflake className="w-3 h-3" /> Cold Start
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
        <div><span className="text-gray-400">Risk:</span> {investor.riskAppetite}</div>
        <div><span className="text-gray-400">Horizon:</span> {investor.investmentHorizon}</div>
        <div><span className="text-gray-400">Ticket:</span> ${investor.minTicketSize}-${investor.maxTicketSize}B</div>
        <div><span className="text-gray-400">Sectors:</span> {investor.sectorPreferences.slice(0, 3).join(', ')}</div>
        <div><span className="text-gray-400">Provinces:</span> {investor.preferredProvinces.slice(0, 2).join(', ')}</div>
        <div><span className="text-gray-400">Complete:</span> {investor.profileCompleteness}%</div>
      </div>
    </div>
  );
}

function RecommendationCard({
  recommendation,
  compareScore,
  isExpanded,
  onToggle,
  kbliLabel,
  locale,
}: {
  recommendation: { project: Project; score: CMSScoreBreakdown; rank: number };
  compareScore?: CMSScoreBreakdown;
  isExpanded: boolean;
  onToggle: () => void;
  kbliLabel: (code: string) => string;
  locale: 'id' | 'en';
}) {
  const { project, score, rank } = recommendation;
  const cmsPct = (score.cms * 100).toFixed(1);
  const comparePct = compareScore ? (compareScore.cms * 100).toFixed(1) : null;

  const scoreColor = score.cms >= 0.7 ? '#10B981' : score.cms >= 0.5 ? '#C9963B' : '#EF4444';

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div
        className="cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={onToggle}
      >
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Rank */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: rank <= 3 ? '#C9963B' : '#1B4D5C' }}>
              #{rank}
            </div>

            {/* Project Info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">{project.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
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
              <div className="text-2xl font-bold" style={{ color: scoreColor }}>{cmsPct}%</div>
              <div className="text-xs text-gray-400">CMS</div>
              {comparePct && (
                <div className="text-xs text-amber-600 mt-0.5">vs {comparePct}%</div>
              )}
            </div>

            {/* Mini bars */}
            <div className="hidden sm:flex flex-col gap-1 w-32">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
                      <DetailRow label="Network Diffusion" value={score.behaviorDetails.dNet} />
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
                    <div><span className="text-gray-400">Investment Value:</span> Rp {(project.investmentValue / 1000).toLocaleString(locale === 'en' ? 'en-US' : 'id-ID', { maximumFractionDigits: 1 })}T</div>
                    <div><span className="text-gray-400">KBLI:</span> {(project.kbliCodes || []).map(kbliLabel).join(', ')}</div>
                    <div><span className="text-gray-400">Tags:</span> {project.tags.join(', ')}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Match Reasons</div>
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
                      {score.confidence} Confidence
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Compare section */}
              {compareScore && (
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/30">
                  <div className="text-xs font-semibold text-amber-700 mb-2">Score Comparison (Primary vs Compare)</div>
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500">Content</div>
                      <div className="font-mono">{(score.sContent * 100).toFixed(0)} vs {(compareScore.sContent * 100).toFixed(0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Behavior</div>
                      <div className="font-mono">{(score.sBehavior * 100).toFixed(0)} vs {(compareScore.sBehavior * 100).toFixed(0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Policy</div>
                      <div className="font-mono">{(score.sPolicy * 100).toFixed(0)} vs {(compareScore.sPolicy * 100).toFixed(0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Risk</div>
                      <div className="font-mono">{(score.sRisk * 100).toFixed(0)} vs {(compareScore.sRisk * 100).toFixed(0)}</div>
                    </div>
                  </div>
                </div>
              )}
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
