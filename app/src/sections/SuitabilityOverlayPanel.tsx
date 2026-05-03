/**
 * Suitability Overlay Panel — Weighted Overlay GIS Visualization
 * Displays 21-layer investment suitability analysis with:
 * - Overall score with gauge
 * - Per-layer breakdown with weights
 * - Sector-specific recommendations
 * - Constraint warnings
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  provincialSuitabilityIndices, 
  calculateWeightedScore, 
  getTopProvincesForProject,
  rankProvincesForSector,
  type SuitabilityIndices 
} from '@/data/suitability/provincialSuitabilityIndices';
import { layerRegistry, getReadyLayers, getConstraintLayers, layerCategoryLabels } from '@/data/suitability/layerRegistry';
import { 
  MapPin, 
  Factory, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  BarChart3,
  Layers,
  Target,
  Zap
} from 'lucide-react';

const sectorOptions = [
  'Manufacturing', 'Agroindustry', 'Mining', 'Tourism', 
  'Energy', 'Digital', 'Fisheries', 'Logistics'
];

const categoryColors: Record<string, string> = {
  spatial: 'bg-blue-500',
  socioeconomic: 'bg-green-500',
  regulatory: 'bg-red-500',
  pir: 'bg-purple-500',
};

const categoryBgColors: Record<string, string> = {
  spatial: 'bg-blue-50',
  socioeconomic: 'bg-green-50',
  regulatory: 'bg-red-50',
  pir: 'bg-purple-50',
};

export function SuitabilityOverlayPanel() {
  const [selectedSector, setSelectedSector] = useState('Manufacturing');
  const [selectedProvince, setSelectedProvince] = useState<string>(
    provincialSuitabilityIndices[0]?.province || ''
  );
  const [showAllLayers, setShowAllLayers] = useState(false);

  const currentIndices = useMemo(() => {
    return provincialSuitabilityIndices.find(p => p.province === selectedProvince);
  }, [selectedProvince]);

  const overallScore = useMemo(() => {
    if (!currentIndices) return 0;
    return calculateWeightedScore(currentIndices, undefined, selectedSector);
  }, [currentIndices, selectedSector]);

  const rankedProvinces = useMemo(() => {
    return rankProvincesForSector(selectedSector);
  }, [selectedSector]);

  const topProvinces = useMemo(() => {
    return getTopProvincesForProject(selectedSector, 5);
  }, [selectedSector]);

  const readyLayers = getReadyLayers();
  const constraintLayers = getConstraintLayers();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Highly Suitable';
    if (score >= 60) return 'Suitable';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Low Suitability';
    return 'Not Suitable';
  };

  if (!currentIndices) {
    return <div className="p-6">Loading suitability data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#1B4D5C]" />
          <span className="font-semibold text-gray-700">Target Sector:</span>
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sectorOptions.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#1B4D5C]" />
          <span className="font-semibold text-gray-700">Province:</span>
          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {provincialSuitabilityIndices.map(p => (
                <SelectItem key={p.province} value={p.province}>{p.province}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overall Score Gauge */}
      <Card className="border-2 border-[#1B4D5C]/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Investment Suitability Score</h3>
              <p className="text-sm text-gray-500">{selectedProvince} — {selectedSector}</p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
              <Badge className={getScoreBg(overallScore) + ' text-white mt-1'}>
                {getScoreLabel(overallScore)}
              </Badge>
            </div>
          </div>
          <Progress value={overallScore} className="h-3" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </CardContent>
      </Card>

      {/* Layer Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Opportunity Layers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1B4D5C]" />
              Layer Breakdown ({readyLayers.length} of {layerRegistry.length - constraintLayers.length} ready)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {layerRegistry
              .filter(l => !l.isConstraint)
              .map(layer => {
                const value = currentIndices[layer.id as keyof SuitabilityIndices] as number;
                return (
                  <div key={layer.id} className={`p-3 rounded-lg ${categoryBgColors[layer.category]}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${categoryColors[layer.category]}`} />
                        <span className="text-sm font-medium text-gray-700">{layer.name}</span>
                        <Badge variant="outline" className="text-xs">{layer.weight}%</Badge>
                      </div>
                      <span className={`text-sm font-bold ${getScoreColor(value)}`}>{value}</span>
                    </div>
                    <Progress value={value} className="h-1.5" />
                    <p className="text-xs text-gray-400 mt-1">{layer.description}</p>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {/* Constraint Checks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Regulatory Constraints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {constraintLayers.map(layer => {
              const value = currentIndices[layer.id as keyof SuitabilityIndices] as number;
              const isClear = value === 1;
              return (
                <div key={layer.id} className={`p-3 rounded-lg ${isClear ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-3">
                    {isClear ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-700">{layer.name}</div>
                      <div className="text-xs text-gray-400">{layer.description}</div>
                    </div>
                    <Badge className={isClear ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                      {isClear ? 'CLEAR' : 'BLOCKED'}
                    </Badge>
                  </div>
                </div>
              );
            })}
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-xs text-yellow-700">
                  <strong>Note:</strong> Regulatory constraints use proxy data. For legal decisions,
                  verify with ATR/BPN (RTRW), KLHK (protected areas), and ESDM (mining concessions).
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Provinces for Sector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1B4D5C]" />
            Top 5 Provinces for {selectedSector}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topProvinces.map((prov, idx) => (
              <div key={prov.province} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#1B4D5C] text-white flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{prov.province}</span>
                    <span className={`text-lg font-bold ${getScoreColor(prov.score)}`}>{prov.score}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {prov.matchReasons.map(reason => (
                      <Badge key={reason} variant="secondary" className="text-xs bg-green-100 text-green-700 border-0">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Sources Footer */}
      <div className="p-4 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
        <div className="font-semibold text-gray-600">Data Sources & Methodology:</div>
        <div>Spatial layers: BIG MapServer, Kemenperin, OpenStreetMap, NASA SRTM</div>
        <div>Socio-economic: BPS (Sensus 2020, PDRB, APS), Kemenaker (UMR)</div>
        <div>PIR-specific: BKPM project data, provincial investment realization</div>
        <div>Constraints: KLHK (protected areas), UNEP-WCMC, ATR/BPN proxy</div>
        <div className="mt-2 text-[#1B4D5C] font-medium">
          Total weight = {getReadyLayers().reduce((s, l) => s + l.weight, 0)}% from {readyLayers.length} ready layers
          + {getConstraintLayers().length} constraint checks
        </div>
      </div>
    </div>
  );
}
