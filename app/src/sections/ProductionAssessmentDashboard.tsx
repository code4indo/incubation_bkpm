import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { EnhancedFinancialAssessment } from '@/lib/enhancedFinancialEngine';
import type { RegulatoryAssessment } from '@/lib/regulatoryAssessmentEngine';
import type { TechnicalAssessment } from '@/lib/technicalAssessmentEngine';
import {
  TrendingUp, ShieldCheck, HardHat, AlertTriangle, CheckCircle,
  DollarSign, FileText, Globe, Zap, Clock, BarChart3,
  AlertOctagon, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  financial: EnhancedFinancialAssessment;
  regulatory: RegulatoryAssessment;
  technical: TechnicalAssessment;
}

export function ProductionAssessmentDashboard({ financial, regulatory, technical }: Props) {
  const [expanded, setExpanded] = useState<string | null>('financial');

  const toggle = (section: string) => setExpanded(expanded === section ? null : section);

  const scoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-[#C9963B]';
    return 'text-red-500';
  };
  const scoreBg = (score: number) => {
    if (score >= 75) return 'bg-green-100 border-green-300';
    if (score >= 50) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };
  const progressColor = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-[#C9963B]';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Overall Assessment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Financial */}
        <Card className={`border-2 ${scoreBg(financial.overallFinancialHealth)}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#1B4D5C]" />
                <span className="font-semibold text-sm text-[#1C2A33]">Financial</span>
              </div>
              <span className={`text-2xl font-bold ${scoreColor(financial.overallFinancialHealth)}`}>
                {financial.overallFinancialHealth}%
              </span>
            </div>
            <Progress value={financial.overallFinancialHealth} className="h-2 mb-2" />
            <p className="text-xs text-[#6B7B8D]">
              IRR: {financial.baseMetrics.irrPct}% | ROI: {financial.baseMetrics.roiPct}%
              {financial.taxAnalysis.taxHolidayEligible && (
                <span className="text-green-600 ml-1 font-semibold">| Tax Holiday Eligible</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Regulatory */}
        <Card className={`border-2 ${scoreBg(regulatory.overallScore)}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#1B4D5C]" />
                <span className="font-semibold text-sm text-[#1C2A33]">Regulatory</span>
              </div>
              <span className={`text-2xl font-bold ${scoreColor(regulatory.overallScore)}`}>
                {regulatory.overallScore}%
              </span>
            </div>
            <Progress value={regulatory.overallScore} className="h-2 mb-2" />
            <div className="flex items-center gap-2">
              <Badge className={`text-[10px] ${
                regulatory.status === 'Investment Ready' ? 'bg-green-500' :
                regulatory.status === 'Permit In Progress' ? 'bg-[#C9963B]' :
                regulatory.status === 'Regulatory Risks' ? 'bg-red-500' : 'bg-gray-500'
              } text-white`}>
                {regulatory.status}
              </Badge>
              <span className="text-xs text-[#6B7B8D]">
                FDI: {regulatory.details.dniScreening.maxForeignOwnership}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Technical */}
        <Card className={`border-2 ${scoreBg(technical.overallScore)}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-[#1B4D5C]" />
                <span className="font-semibold text-sm text-[#1C2A33]">Technical</span>
              </div>
              <span className={`text-2xl font-bold ${scoreColor(technical.overallScore)}`}>
                {technical.overallScore}%
              </span>
            </div>
            <Progress value={technical.overallScore} className="h-2 mb-2" />
            <p className="text-xs text-[#6B7B8D]">
              {technical.status} | {technical.riskFactors.length === 0 ? 'No critical risks' : `${technical.riskFactors.length} risk factor(s)`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Flags */}
      {regulatory.riskFlags.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-700">Regulatory Risk Flags</span>
          </div>
          <ul className="space-y-1">
            {regulatory.riskFlags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* EXPANDABLE: Financial Detail */}
      <Card className="border shadow-sm">
        <button onClick={() => toggle('financial')} className="w-full">
          <CardHeader className="pb-3 flex flex-row items-center justify-between cursor-pointer">
            <CardTitle className="text-lg text-[#1B4D5C] flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Financial Assessment Detail
              <Badge variant="outline" className="text-[10px]">{financial.overallFinancialHealth}%</Badge>
            </CardTitle>
            {expanded === 'financial' ? <ChevronUp className="w-5 h-5 text-[#6B7B8D]" /> : <ChevronDown className="w-5 h-5 text-[#6B7B8D]" />}
          </CardHeader>
        </button>
        {expanded === 'financial' && (
          <CardContent className="space-y-6 pt-0">
            {/* Base Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-[#1B4D5C]/5 rounded-lg text-center">
                <p className="text-xs text-[#6B7B8D]">IRR (Base)</p>
                <p className="text-xl font-bold text-[#1B4D5C]">{financial.baseMetrics.irrPct}%</p>
              </div>
              <div className="p-3 bg-[#1B4D5C]/5 rounded-lg text-center">
                <p className="text-xs text-[#6B7B8D]">ROI</p>
                <p className="text-xl font-bold text-[#1B4D5C]">{financial.baseMetrics.roiPct}%</p>
              </div>
              <div className="p-3 bg-[#1B4D5C]/5 rounded-lg text-center">
                <p className="text-xs text-[#6B7B8D]">Payback</p>
                <p className="text-xl font-bold text-[#1B4D5C]">{financial.baseMetrics.paybackYears} yr</p>
              </div>
              <div className="p-3 bg-[#1B4D5C]/5 rounded-lg text-center">
                <p className="text-xs text-[#6B7B8D]">EBITDA Margin</p>
                <p className="text-xl font-bold text-[#1B4D5C]">{financial.baseMetrics.ebitdaMarginPct}%</p>
              </div>
            </div>

            {/* Tax Analysis */}
            <div>
              <h4 className="font-semibold text-[#1B4D5C] mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Tax Analysis
              </h4>
              <div className="grid md:grid-cols-2 gap-4 mb-3">
                <div className="p-3 bg-[#F5F3EF] rounded-lg">
                  <p className="text-xs text-[#6B7B8D]">Standard Tax Rate</p>
                  <p className="font-semibold">{financial.taxAnalysis.corporateTaxRate}%</p>
                </div>
                <div className="p-3 bg-[#F5F3EF] rounded-lg">
                  <p className="text-xs text-[#6B7B8D]">Effective Tax Rate</p>
                  <p className={`font-semibold ${financial.taxAnalysis.effectiveTaxRate === 0 ? 'text-green-600' : ''}`}>
                    {financial.taxAnalysis.effectiveTaxRate}%
                    {financial.taxAnalysis.taxHolidayEligible && <span className="text-green-600 text-xs ml-1">(Holiday Active)</span>}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700">NPV With Tax Holiday</p>
                  <p className="text-lg font-bold text-green-700">Rp {financial.taxAnalysis.npvWithTaxHoliday}T</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs text-red-700">NPV Without Tax Holiday</p>
                  <p className="text-lg font-bold text-red-700">Rp {financial.taxAnalysis.npvWithoutTaxHoliday}T</p>
                </div>
              </div>
              {financial.taxAnalysis.taxHolidayEligible && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-semibold">
                      Tax Holiday: {financial.taxAnalysis.taxHolidaySavingBillionIdr}T IDR saved over {financial.taxAnalysis.taxHolidayYears} years
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">{financial.taxAnalysis.annualTaxBurdens[0]?.taxSaving && `Year 1 saving: Rp ${financial.taxAnalysis.annualTaxBurdens[0].taxSaving}B`}</p>
                </div>
              )}
            </div>

            {/* Sensitivity */}
            <div>
              <h4 className="font-semibold text-[#1B4D5C] mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Sensitivity Analysis
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['optimistic', 'baseCase', 'pessimistic', 'worstCase'].map((key) => {
                  const s = financial.sensitivityAnalysis[key as keyof typeof financial.sensitivityAnalysis] as typeof financial.sensitivityAnalysis.baseCase;
                  return (
                    <div key={key} className={`p-3 rounded-lg text-center ${
                      key === 'optimistic' ? 'bg-green-50' : key === 'baseCase' ? 'bg-[#1B4D5C]/5' : key === 'pessimistic' ? 'bg-yellow-50' : 'bg-red-50'
                    }`}>
                      <p className="text-xs text-[#6B7B8D] mb-1">{s.scenario}</p>
                      <p className="text-lg font-bold text-[#1B4D5C]">{s.irrPct}%</p>
                      <p className="text-xs text-[#6B7B8D]">NPV: Rp {s.npvBillionIdr}T</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-[#1B4D5C]">Key Risk Variables:</p>
                {financial.sensitivityAnalysis.keyVariables.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-[#F5F3EF] rounded">
                    <span className="text-sm text-[#1C2A33]">{v.variable}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${v.impactOnNPV < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {v.impactOnNPV > 0 ? '+' : ''}{v.impactOnNPV}% NPV
                      </span>
                      <Badge className={`text-[10px] ${v.riskLevel === 'High' ? 'bg-red-500' : v.riskLevel === 'Medium' ? 'bg-[#C9963B]' : 'bg-green-500'} text-white`}>
                        {v.riskLevel}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Currency Risk */}
            <div>
              <h4 className="font-semibold text-[#1B4D5C] mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Currency Risk (USD/IDR)
              </h4>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-3 bg-[#F5F3EF] rounded-lg text-center">
                  <p className="text-xs text-[#6B7B8D]">USD Exposure</p>
                  <p className="text-lg font-bold text-[#1B4D5C]">{financial.currencyRisk.exposurePct}%</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-xs text-red-700">NPV if IDR -10%</p>
                  <p className="text-lg font-bold text-red-700">Rp {financial.currencyRisk.npvImpactPlus10pct}T</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-xs text-green-700">NPV if IDR +10%</p>
                  <p className="text-lg font-bold text-green-700">Rp {financial.currencyRisk.npvImpactMinus10pct}T</p>
                </div>
              </div>
              {financial.currencyRisk.hedgingRecommended && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#C9963B]" />
                  <span className="text-sm text-[#C9963B]">Currency hedging recommended (exposure &gt; 40%)</span>
                </div>
              )}
            </div>

            {/* Debt Structure */}
            <div>
              <h4 className="font-semibold text-[#1B4D5C] mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Debt Structure
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-[#F5F3EF] rounded-lg text-center">
                  <p className="text-xs text-[#6B7B8D]">Optimal D/E</p>
                  <p className="text-lg font-bold text-[#1B4D5C]">{financial.debtStructure.optimalDebtEquity.toFixed(1)}x</p>
                </div>
                <div className="p-3 bg-[#F5F3EF] rounded-lg text-center">
                  <p className="text-xs text-[#6B7B8D]">Debt Ratio</p>
                  <p className="text-lg font-bold text-[#1B4D5C]">{financial.debtStructure.recommendedDebtPct}%</p>
                </div>
                <div className="p-3 bg-[#F5F3EF] rounded-lg text-center">
                  <p className="text-xs text-[#6B7B8D]">DSCR</p>
                  <p className={`text-lg font-bold ${financial.debtStructure.dscr >= 1.5 ? 'text-green-600' : financial.debtStructure.dscr >= 1.2 ? 'text-[#C9963B]' : 'text-red-600'}`}>
                    {financial.debtStructure.dscr}x
                  </p>
                </div>
                <div className="p-3 bg-[#F5F3EF] rounded-lg text-center">
                  <p className="text-xs text-[#6B7B8D]">Rating</p>
                  <p className={`text-sm font-bold ${financial.debtStructure.rating === 'Investment Grade' ? 'text-green-600' : financial.debtStructure.rating === 'Speculative' ? 'text-[#C9963B]' : 'text-red-600'}`}>
                    {financial.debtStructure.rating}
                  </p>
                </div>
              </div>
            </div>

            {/* Transfer Pricing */}
            <div>
              <h4 className="font-semibold text-[#1B4D5C] mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Transfer Pricing Risk
              </h4>
              <div className="flex items-center gap-3">
                <Badge className={`${financial.transferPricingRisk.riskLevel === 'High' ? 'bg-red-500' : financial.transferPricingRisk.riskLevel === 'Medium' ? 'bg-[#C9963B]' : 'bg-green-500'} text-white`}>
                  {financial.transferPricingRisk.riskLevel} Risk
                </Badge>
                <span className="text-sm text-[#6B7B8D]">
                  Related party: {financial.transferPricingRisk.relatedPartyTransactionPct}% | 
                  Documentation: {financial.transferPricingRisk.armsLengthDocumentation}
                </span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* EXPANDABLE: Regulatory Detail */}
      <Card className="border shadow-sm">
        <button onClick={() => toggle('regulatory')} className="w-full">
          <CardHeader className="pb-3 flex flex-row items-center justify-between cursor-pointer">
            <CardTitle className="text-lg text-[#1B4D5C] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" /> Regulatory Assessment Detail
              <Badge variant="outline" className="text-[10px]">{regulatory.overallScore}%</Badge>
            </CardTitle>
            {expanded === 'regulatory' ? <ChevronUp className="w-5 h-5 text-[#6B7B8D]" /> : <ChevronDown className="w-5 h-5 text-[#6B7B8D]" />}
          </CardHeader>
        </button>
        {expanded === 'regulatory' && (
          <CardContent className="space-y-6 pt-0">
            {/* DNI Screening */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F5F3EF] rounded-lg">
                <p className="text-xs text-[#6B7B8D] mb-1">DNI Classification</p>
                <p className="text-lg font-bold text-[#1B4D5C]">{regulatory.details.dniScreening.classification}</p>
                <p className="text-xs text-[#6B7B8D] mt-1">{regulatory.details.dniScreening.conditionallyOpenNotes}</p>
              </div>
              <div className="p-4 bg-[#F5F3EF] rounded-lg">
                <p className="text-xs text-[#6B7B8D] mb-1">Max Foreign Ownership</p>
                <p className="text-lg font-bold text-[#1B4D5C]">{regulatory.details.dniScreening.maxForeignOwnership}%</p>
                {regulatory.details.dniScreening.prioritySector && (
                  <Badge className="bg-green-500 text-white text-[10px] mt-1">Priority Sector</Badge>
                )}
              </div>
            </div>

            {/* OSS & Tax */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F5F3EF] rounded-lg">
                <p className="text-xs text-[#6B7B8D] mb-1">OSS Risk Category</p>
                <p className="text-lg font-bold text-[#1B4D5C]">{regulatory.details.ossStatus.riskCategory}</p>
                <p className="text-xs text-[#6B7B8D] mt-1">
                  Permits: {regulatory.details.ossStatus.permitsObtained.length}/{regulatory.details.ossStatus.permitsRequired.length} obtained
                </p>
                <Progress value={regulatory.details.ossStatus.completionPct} className="h-2 mt-2" />
              </div>
              <div className="p-4 bg-[#F5F3EF] rounded-lg">
                <p className="text-xs text-[#6B7B8D] mb-1">Tax Holiday</p>
                <p className={`text-lg font-bold ${regulatory.details.taxHoliday.eligible ? 'text-green-600' : 'text-red-600'}`}>
                  {regulatory.details.taxHoliday.eligible ? 'ELIGIBLE' : 'Not Eligible'}
                </p>
                {regulatory.details.taxHoliday.eligible && (
                  <p className="text-xs text-green-700 mt-1">
                    {regulatory.details.taxHoliday.type} — {regulatory.details.taxHoliday.durationYears} years
                  </p>
                )}
                <p className="text-xs text-[#6B7B8D] mt-1">{regulatory.details.taxHoliday.notes}</p>
              </div>
            </div>

            {/* Environmental */}
            <div className="p-4 bg-[#F5F3EF] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[#6B7B8D]">Environmental Permit</p>
                <Badge className={`${
                  regulatory.details.environmentalPermit.riskLevel === 'Green' ? 'bg-green-500' :
                  regulatory.details.environmentalPermit.riskLevel === 'Orange' ? 'bg-[#C9963B]' : 'bg-red-500'
                } text-white text-[10px]`}>
                  {regulatory.details.environmentalPermit.riskLevel} — {regulatory.details.environmentalPermit.category}
                </Badge>
              </div>
              <p className="text-sm text-[#1C2A33]">
                Status: {regulatory.details.environmentalPermit.status} | 
                Estimated: {regulatory.details.environmentalPermit.estimatedTimeline}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {regulatory.details.environmentalPermit.keyRequirements.map((req, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{req}</Badge>
                ))}
              </div>
            </div>

            {/* Spatial Planning */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F5F3EF] rounded-lg">
                <p className="text-xs text-[#6B7B8D] mb-1">Zoning</p>
                <p className="text-lg font-bold text-[#1B4D5C]">{regulatory.details.spatialPlanning.zoningType}</p>
                <p className="text-xs text-[#6B7B8D] mt-1">
                  {regulatory.details.spatialPlanning.conformant ? 'Conformant' : 'Non-conformant'} with spatial plan
                </p>
              </div>
              <div className="p-4 bg-[#F5F3EF] rounded-lg">
                <p className="text-xs text-[#6B7B8D] mb-1">BKPM Masterlist</p>
                <p className="text-lg font-bold text-[#1B4D5C]">
                  {regulatory.details.bkpmMasterlist.listed ? 'Listed' : 'Not Listed'}
                </p>
                <Badge className={`text-[10px] mt-1 ${
                  regulatory.details.bkpmMasterlist.incentiveTier === 'National Strategic' ? 'bg-green-600' :
                  regulatory.details.bkpmMasterlist.incentiveTier === 'Priority' ? 'bg-[#C9963B]' : 'bg-gray-500'
                } text-white`}>
                  {regulatory.details.bkpmMasterlist.incentiveTier}
                </Badge>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <p className="text-sm font-semibold text-[#1B4D5C] mb-2">Permit Requirements Checklist:</p>
              <div className="space-y-2">
                {regulatory.requirements.map((req, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#F5F3EF] rounded-lg">
                    <div className="flex items-center gap-2">
                      {req.status === 'Completed' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                       req.status === 'In Progress' ? <Clock className="w-4 h-4 text-[#C9963B]" /> :
                       <XCircle className="w-4 h-4 text-gray-400" />}
                      <span className="text-sm text-[#1C2A33]">{req.requirement}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#6B7B8D]">{req.authority}</span>
                      <Badge className={`text-[10px] ${
                        req.status === 'Completed' ? 'bg-green-500' : req.status === 'In Progress' ? 'bg-[#C9963B]' : 'bg-gray-400'
                      } text-white`}>{req.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* EXPANDABLE: Technical Detail */}
      <Card className="border shadow-sm">
        <button onClick={() => toggle('technical')} className="w-full">
          <CardHeader className="pb-3 flex flex-row items-center justify-between cursor-pointer">
            <CardTitle className="text-lg text-[#1B4D5C] flex items-center gap-2">
              <HardHat className="w-5 h-5" /> Technical Assessment Detail
              <Badge variant="outline" className="text-[10px]">{technical.overallScore}%</Badge>
            </CardTitle>
            {expanded === 'technical' ? <ChevronUp className="w-5 h-5 text-[#6B7B8D]" /> : <ChevronDown className="w-5 h-5 text-[#6B7B8D]" />}
          </CardHeader>
        </button>
        {expanded === 'technical' && (
          <CardContent className="space-y-6 pt-0">
            {/* Readiness Matrix */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(technical.readiness).map(([key, value]) => (
                <div key={key} className="p-3 bg-[#F5F3EF] rounded-lg">
                  <p className="text-xs text-[#6B7B8D] mb-1">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${progressColor(value)}`} style={{ width: `${value}%` }} />
                    </div>
                    <span className={`text-sm font-bold ${scoreColor(value)}`}>{value}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Risk Factors */}
            {technical.riskFactors.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[#1B4D5C] mb-2">Technical Risk Factors:</p>
                <div className="space-y-2">
                  {technical.riskFactors.map((risk, i) => (
                    <div key={i} className={`p-3 rounded-lg ${
                      risk.level === 'Critical' ? 'bg-red-50 border border-red-200' :
                      risk.level === 'High' ? 'bg-orange-50 border border-orange-200' :
                      'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${
                          risk.level === 'Critical' ? 'bg-red-600' : risk.level === 'High' ? 'bg-orange-500' : 'bg-[#C9963B]'
                        } text-white`}>{risk.level}</Badge>
                        <span className="text-sm font-semibold text-[#1C2A33]">{risk.category}</span>
                      </div>
                      <p className="text-sm text-[#6B7B8D] mt-1">{risk.description}</p>
                      {risk.mitigation && <p className="text-xs text-green-700 mt-1">Mitigation: {risk.mitigation}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Infrastructure Access */}
            {technical.details.infrastructureAccess && (
              <div>
                <p className="text-sm font-semibold text-[#1B4D5C] mb-2">Infrastructure Access:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-[#F5F3EF] rounded-lg">
                    <p className="text-xs text-[#6B7B8D]">Nearest Port</p>
                    <p className="text-sm font-bold text-[#1B4D5C]">{technical.details.infrastructureAccess.nearestPort.name}</p>
                    <p className="text-xs text-[#6B7B8D]">{technical.details.infrastructureAccess.nearestPort.distanceKm} km | {technical.details.infrastructureAccess.nearestPort.score}%</p>
                  </div>
                  <div className="p-3 bg-[#F5F3EF] rounded-lg">
                    <p className="text-xs text-[#6B7B8D]">Grid Connection</p>
                    <p className="text-sm font-bold text-[#1B4D5C]">{technical.details.infrastructureAccess.gridConnection.availableCapacityMW}MW available</p>
                    <p className="text-xs text-[#6B7B8D]">{technical.details.infrastructureAccess.gridConnection.distanceKm} km | Queue: {technical.details.infrastructureAccess.gridConnection.connectionQueue} mo</p>
                  </div>
                  <div className="p-3 bg-[#F5F3EF] rounded-lg">
                    <p className="text-xs text-[#6B7B8D]">Water Supply</p>
                    <p className="text-sm font-bold text-[#1B4D5C]">{technical.details.infrastructureAccess.waterSupply.source}</p>
                    <p className="text-xs text-[#6B7B8D]">{technical.details.infrastructureAccess.waterSupply.availability} | {technical.details.infrastructureAccess.waterSupply.score}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Engineering */}
            {technical.details.engineeringReadiness && (
              <div className="p-4 bg-[#1B4D5C]/5 rounded-lg">
                <p className="text-sm font-semibold text-[#1B4D5C] mb-2">Engineering Status:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-[#6B7B8D]">Feasibility Study</p>
                    <p className={`font-semibold ${technical.details.engineeringReadiness.feasibilityStudy === 'Completed' ? 'text-green-600' : 'text-[#C9963B]'}`}>
                      {technical.details.engineeringReadiness.feasibilityStudy}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7B8D]">Detail Engineering</p>
                    <p className={`font-semibold ${technical.details.engineeringReadiness.detailEngineering === 'Completed' ? 'text-green-600' : 'text-[#C9963B]'}`}>
                      {technical.details.engineeringReadiness.detailEngineering}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7B8D]">Construction</p>
                    <p className="font-semibold text-[#1B4D5C]">{technical.details.engineeringReadiness.estimatedConstructionDuration}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
