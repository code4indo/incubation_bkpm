/**
 * ANALYST AGENT REPORT PANEL
 * Displays comprehensive feasibility analysis from the Analyst Agent + Zone Validator
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import type { AnalystReport, RiskFlag, InfrastructureGap } from '@/lib/analystAgent';
import type { EnhancedAnalystReport } from '@/lib/analystLLM';
import {
  getRiskSeverityColor,
  getInfrastructureSeverityColor,
  getFeasibilityColor,
  getFeasibilityLabel,
} from '@/lib/analystAgent';
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  Anchor,
  Plane,
  Zap,
  Route,
  Wifi,
  Droplets,
  ShieldAlert,
  TrendingUp,
  DollarSign,
  Clock,
  FileSearch,
  Activity,
  Sparkles,
} from 'lucide-react';

interface AnalystReportPanelProps {
  report: AnalystReport | null;
  enhancedReport?: EnhancedAnalystReport | null;
}

export function AnalystReportPanel({ report, enhancedReport }: AnalystReportPanelProps) {
  if (!report) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-6 text-center text-gray-400">
          <FileSearch className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select a project to run Analyst Agent analysis</p>
        </CardContent>
      </Card>
    );
  }

  const hasLLM = enhancedReport?.llmSuccess;
  const displaySummary = hasLLM ? enhancedReport!.llmSummary : report.summary;

  const feasibilityColor = getFeasibilityColor(report.overallFeasibility);
  const feasibilityLabel = getFeasibilityLabel(report.overallFeasibility);
  const criticalRisks = report.riskFlags.filter(r => r.severity === 'Critical').length;
  const highRisks = report.riskFlags.filter(r => r.severity === 'High').length;

  return (
    <div className="space-y-4">
      {/* Header — Overall Feasibility */}
      <Card className="border-0 shadow-md" style={{ borderLeft: `4px solid ${feasibilityColor}` }}>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: feasibilityColor }}
              >
                {report.overallFeasibility}
              </div>
              <div>
                <h3 className="font-bold text-[#1C2A33] text-lg">{feasibilityLabel}</h3>
                <p className="text-xs text-gray-500">
                  Analyst Agent · Confidence: {Math.round(report.confidenceScore * 100)}%
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {criticalRisks > 0 && (
                <Badge className="bg-red-100 text-red-700 border-red-200">
                  <ShieldAlert className="w-3 h-3 mr-1" /> {criticalRisks} Critical
                </Badge>
              )}
              {highRisks > 0 && (
                <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                  <AlertTriangle className="w-3 h-3 mr-1" /> {highRisks} High
                </Badge>
              )}
            </div>
          </div>
          {hasLLM && (
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                <Sparkles className="w-3 h-3 mr-1" /> AI Enhanced · {enhancedReport!.llmModel}
              </Badge>
              <span className="text-[10px] text-gray-400">{enhancedReport!.llmLatencyMs}ms</span>
            </div>
          )}
          <p className="text-sm text-gray-600 mt-3">{displaySummary}</p>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400 font-mono">
            <span>Trace: {report.traceId}</span>
            <span>·</span>
            <span>{new Date(report.timestamp).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ScoreCard
          label="Financial"
          score={report.financial.score}
          icon={<DollarSign className="w-4 h-4" />}
          color="#1B4D5C"
          detail={report.financial.scaleCategory}
        />
        <ScoreCard
          label="Zone Alignment"
          score={report.zone.alignmentScore}
          icon={<MapPin className="w-4 h-4" />}
          color="#C9963B"
          detail={report.zone.isCompatible ? 'Compatible' : 'Conflicts'}
        />
        <ScoreCard
          label="Infrastructure"
          score={Math.max(0, 100 - report.infrastructureGaps.filter(g => g.severity !== 'None').length * 15)}
          icon={<Zap className="w-4 h-4" />}
          color="#16a34a"
          detail={report.zone.infrastructureStatus}
        />
        <ScoreCard
          label="Risk Score"
          score={Math.max(0, 100 - (criticalRisks * 20 + highRisks * 10))}
          icon={<ShieldAlert className="w-4 h-4" />}
          color={criticalRisks > 0 ? '#dc2626' : highRisks > 0 ? '#ea580c' : '#16a34a'}
          detail={`${report.riskFlags.length} flags`}
        />
      </div>

      {/* Financial Validation Detail */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#1B4D5C] flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Financial Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <ValidationBadge
              label="IRR"
              valid={report.financial.irrRealistic}
              icon={<TrendingUp className="w-3 h-3" />}
            />
            <ValidationBadge
              label="NPV"
              valid={report.financial.npvRealistic}
              icon={<DollarSign className="w-3 h-3" />}
            />
            <ValidationBadge
              label="Payback"
              valid={report.financial.paybackReasonable}
              icon={<Clock className="w-3 h-3" />}
            />
          </div>
          <div className="space-y-1">
            {report.financial.notes.map((note, i) => (
              <p key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[#1B4D5C] flex-shrink-0 mt-0.5" />
                {note}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Zone Validation Detail */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#1B4D5C] flex items-center gap-2">
            <MapPin className="w-4 h-4" /> PIR Zone Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <DistanceBadge
              label="Port"
              distance={report.zone.distanceToPortKm}
              icon={<Anchor className="w-3 h-3" />}
            />
            <DistanceBadge
              label="Airport"
              distance={report.zone.distanceToAirportKm}
              icon={<Plane className="w-3 h-3" />}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Infrastructure:</span>
            <Badge
              className="text-xs"
              style={{
                backgroundColor: report.zone.infrastructureStatus === 'Ready' ? '#dcfce7' :
                  report.zone.infrastructureStatus === 'Developing' ? '#fef9c3' :
                  report.zone.infrastructureStatus === 'Limited' ? '#ffedd5' : '#fee2e2',
                color: report.zone.infrastructureStatus === 'Ready' ? '#16a34a' :
                  report.zone.infrastructureStatus === 'Developing' ? '#ca8a04' :
                  report.zone.infrastructureStatus === 'Limited' ? '#ea580c' : '#dc2626',
              }}
            >
              {report.zone.infrastructureStatus}
            </Badge>
          </div>
          {report.zone.conflicts.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              <p className="text-xs font-semibold text-red-700 mb-1">Zone Conflicts:</p>
              {report.zone.conflicts.map((c, i) => (
                <p key={i} className="text-xs text-red-600 flex items-start gap-1">
                  <XCircle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {c}
                </p>
              ))}
            </div>
          )}
          {report.zone.nearestIndustrialZones.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Nearest KEK/KI:</p>
              <div className="flex flex-wrap gap-1">
                {report.zone.nearestIndustrialZones.map((z, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{z}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Infrastructure Gaps */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#1B4D5C] flex items-center gap-2">
            <Activity className="w-4 h-4" /> Infrastructure Gaps
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {report.infrastructureGaps.map((gap, i) => (
              <InfrastructureGapCard key={i} gap={gap} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Flags */}
      {report.riskFlags.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#1B4D5C] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Risk Flags ({report.riskFlags.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {report.riskFlags.map((risk, i) => (
              <RiskFlagCard key={i} risk={risk} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* LLM Enhanced Insights */}
      {hasLLM && enhancedReport && (
        <>
          {/* AI Risk Insights */}
          {enhancedReport.llmRiskInsights.length > 0 && (
            <Card className="border-0 shadow-md" style={{ borderLeft: '4px solid #9333ea' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-purple-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI Nuanced Risk Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {enhancedReport.llmRiskInsights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2 bg-purple-50 rounded-lg p-3">
                      <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-purple-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Mitigation Strategy */}
          <Card className="border-0 shadow-md" style={{ borderLeft: '4px solid #0d9488' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-teal-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI Mitigation Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
                <p className="text-xs text-teal-800 whitespace-pre-line leading-relaxed">
                  {enhancedReport.llmMitigationStrategy}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Zone Recommendation */}
          <Card className="border-0 shadow-md" style={{ borderLeft: '4px solid #2563eb' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-blue-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI Zone Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-xs text-blue-800 leading-relaxed">
                  {enhancedReport.llmZoneRecommendation}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function ScoreCard({
  label,
  score,
  icon,
  color,
  detail,
}: {
  label: string;
  score: number;
  icon: React.ReactNode;
  color: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border p-3" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="flex items-center gap-2 mb-1" style={{ color }}>
        {icon}
        <span className="text-xs font-semibold uppercase">{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{score}</p>
      <p className="text-[10px] text-gray-500">{detail}</p>
    </div>
  );
}

function ValidationBadge({ label, valid, icon }: { label: string; valid: boolean; icon: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${valid ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
      <span className={valid ? 'text-green-600' : 'text-red-500'}>{icon}</span>
      <div>
        <p className="text-xs font-semibold text-gray-700">{label}</p>
        <p className={`text-[10px] font-bold ${valid ? 'text-green-600' : 'text-red-500'}`}>
          {valid ? 'Realistic' : 'Review'}
        </p>
      </div>
    </div>
  );
}

function DistanceBadge({ label, distance, icon }: { label: string; distance: number; icon: React.ReactNode }) {
  const color = distance <= 50 ? '#16a34a' : distance <= 150 ? '#ca8a04' : distance <= 300 ? '#ea580c' : '#dc2626';
  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
      <span style={{ color }}>{icon}</span>
      <div>
        <p className="text-xs font-semibold text-gray-700">{label}</p>
        <p className="text-xs font-bold" style={{ color }}>{distance} km</p>
      </div>
    </div>
  );
}

function InfrastructureGapCard({ gap }: { gap: InfrastructureGap }) {
  const iconMap: Record<string, React.ReactNode> = {
    Port: <Anchor className="w-4 h-4" />,
    Airport: <Plane className="w-4 h-4" />,
    Road: <Route className="w-4 h-4" />,
    Energy: <Zap className="w-4 h-4" />,
    Water: <Droplets className="w-4 h-4" />,
    Telecom: <Wifi className="w-4 h-4" />,
  };

  const color = getInfrastructureSeverityColor(gap.severity);

  return (
    <div className="flex items-center gap-2 rounded-lg border p-2" style={{ borderLeft: `3px solid ${color}` }}>
      <span style={{ color }}>{iconMap[gap.category] || <Zap className="w-4 h-4" />}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">{gap.category}</p>
          <Badge
            className="text-[9px] px-1.5 py-0"
            style={{ backgroundColor: color + '20', color, borderColor: color + '40' }}
          >
            {gap.severity}
          </Badge>
        </div>
        <p className="text-[10px] text-gray-500 truncate">{gap.description}</p>
      </div>
    </div>
  );
}

function RiskFlagCard({ risk }: { risk: RiskFlag }) {
  const color = getRiskSeverityColor(risk.severity);

  return (
    <div className="rounded-lg border p-3" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="flex items-center gap-2 mb-1">
        <Badge
          className="text-[10px] px-1.5 py-0"
          style={{ backgroundColor: color + '15', color }}
        >
          {risk.severity}
        </Badge>
        <span className="text-xs font-semibold text-gray-700">{risk.category}</span>
      </div>
      <p className="text-xs text-gray-600 mb-1">{risk.description}</p>
      <p className="text-[10px] text-[#1B4D5C] bg-[#1B4D5C]/5 rounded px-2 py-1">
        <strong>Mitigation:</strong> {risk.mitigation}
      </p>
    </div>
  );
}
