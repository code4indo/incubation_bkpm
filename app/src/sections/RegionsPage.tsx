import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MapVisualization } from '@/components/MapVisualization';
import { regions, projects, ports, airports } from '@/data/mockData';
import { computeRegionalScores } from '@/lib/scoringEngine';
import { MapPin, Users, TrendingUp, DollarSign, Building2, Anchor, BarChart3 } from 'lucide-react';

export function RegionsPage() {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showProjects, setShowProjects] = useState(true);
  const [showInfrastructure, setShowInfrastructure] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const scores = useMemo(() => computeRegionalScores(regions, ports, airports), []);

  const selectedProject = useMemo(() =>
    projects.find(p => p.id === selectedProjectId) || null,
    [selectedProjectId]
  );

  // Sort regions by score for ranking table
  const rankedRegions = useMemo(() => {
    return scores
      .map(s => ({ ...s, region: regions.find(r => r.id === s.regionId)! }))
      .sort((a, b) => b.overallScore - a.overallScore);
  }, [scores]);

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      {/* Header */}
      <div className="pt-24 pb-8 px-4 sm:px-8 lg:px-16 bg-[#1B4D5C]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Geospatial Intelligence
          </h1>
          <p className="text-white/80 text-lg max-w-3xl">
            AI-powered regional scoring, project-location alignment, and interactive heatmap across Indonesia's 38 provinces
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-8">
        {/* Map Controls */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap items-center gap-6">
            <h3 className="font-bold text-[#1B4D5C] flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Map Layers
            </h3>
            <div className="flex items-center gap-3">
              <Switch checked={showHeatmap} onCheckedChange={setShowHeatmap} id="heatmap" />
              <label htmlFor="heatmap" className="text-sm font-medium cursor-pointer">Regional Heatmap</label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={showProjects} onCheckedChange={setShowProjects} id="projects" />
              <label htmlFor="projects" className="text-sm font-medium cursor-pointer">Investment Projects</label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={showInfrastructure} onCheckedChange={setShowInfrastructure} id="infra" />
              <label htmlFor="infra" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                <Anchor className="w-3.5 h-3.5" /> Infrastructure
              </label>
            </div>
            <div className="ml-auto">
              <select
                className="border rounded-lg px-3 py-1.5 text-sm bg-white"
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Select project for alignment...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.nameEn}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="h-[50vh] sm:h-[55vh] md:h-[550px] lg:h-[600px]">
          <MapVisualization
            selectedProject={selectedProject}
            showHeatmap={showHeatmap}
            showProjects={showProjects}
            showInfrastructure={showInfrastructure}
            height="100%"
          />
        </div>

        {/* Scoring Methodology */}
        <div className="mt-10 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-bold text-[#1B4D5C] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" /> AI Scoring Engine Methodology
          </h3>
          <p className="text-gray-600 mb-6">
            Each province is scored on a 0-100 scale using a composite algorithm that weights five dimensions:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Infrastructure', weight: '30%', desc: 'Roads, ports, airports, energy access + distance to nearest logistics hub', icon: Anchor, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Market Access', weight: '25%', desc: 'Export/import volume, port proximity, consumer market size', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Workforce', weight: '25%', desc: 'Labor pool size, education level, UMR competitiveness', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Investment Climate', weight: '20%', desc: 'Realization value, project count, policy stability', icon: DollarSign, color: 'text-[#C9963B]', bg: 'bg-yellow-50' },
            ].map((dim) => (
              <div key={dim.label} className={`${dim.bg} rounded-lg p-4 border`}>
                <dim.icon className={`w-6 h-6 ${dim.color} mb-2`} />
                <p className="font-bold text-[#1C2A33] text-sm">{dim.label}</p>
                <p className="text-xs text-[#C9963B] font-semibold mb-1">Weight: {dim.weight}</p>
                <p className="text-xs text-gray-500">{dim.desc}</p>
              </div>
            ))}
          </div>

          {/* Regional Ranking Table */}
          <h4 className="font-bold text-[#1B4D5C] mb-3">Regional Investment Ranking</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#1B4D5C]">
                  <th className="text-left py-2 px-3 font-bold text-[#1B4D5C]">Rank</th>
                  <th className="text-left py-2 px-3 font-bold text-[#1B4D5C]">Province</th>
                  <th className="text-center py-2 px-3 font-bold text-[#1B4D5C]">Overall</th>
                  <th className="text-center py-2 px-3 font-bold text-[#1B4D5C]">Infra</th>
                  <th className="text-center py-2 px-3 font-bold text-[#1B4D5C]">Market</th>
                  <th className="text-center py-2 px-3 font-bold text-[#1B4D5C]">Workforce</th>
                  <th className="text-center py-2 px-3 font-bold text-[#1B4D5C]">Climate</th>
                  <th className="text-center py-2 px-3 font-bold text-[#1B4D5C]">Port (km)</th>
                </tr>
              </thead>
              <tbody>
                {rankedRegions.map((item, idx) => (
                  <tr key={item.regionId} className="border-b hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-bold text-[#C9963B]">#{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold">{item.regionName}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className="font-bold px-2 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: item.color + '20',
                          color: item.color
                        }}
                      >
                        {item.overallScore}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-gray-600">{item.infrastructureScore}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600">{item.marketAccessScore}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600">{item.workforceScore}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600">{item.investmentClimateScore}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600">{item.portDistance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regional Cards */}
        <div className="mt-10">
          <h3 className="text-xl font-bold text-[#1B4D5C] mb-6">Regional Profiles</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region) => {
              const score = scores.find(s => s.regionId === region.id);
              return (
                <Card key={region.id} className="border-0 shadow-lg hover:shadow-xl transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#1B4D5C]/10 flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-[#1B4D5C]" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-[#1B4D5C]">{region.name}</CardTitle>
                          <p className="text-sm text-[#6B7B8D]">{region.area.toLocaleString()} km²</p>
                        </div>
                      </div>
                      {score && (
                        <div className="text-right">
                          <p className="text-2xl font-bold" style={{ color: score.color }}>{score.overallScore}</p>
                          <p className="text-xs text-[#6B7B8D]">AI Score</p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#F5F3EF] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-[#1B4D5C]" />
                          <p className="text-xs text-[#6B7B8D]">Population</p>
                        </div>
                        <p className="font-bold text-[#1C2A33]">{(region.population / 1000000).toFixed(1)}M</p>
                      </div>
                      <div className="bg-[#F5F3EF] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-[#1B4D5C]" />
                          <p className="text-xs text-[#6B7B8D]">Workforce</p>
                        </div>
                        <p className="font-bold text-[#1C2A33]">{(region.workforce / 1000000).toFixed(1)}M</p>
                      </div>
                      <div className="bg-[#F5F3EF] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-[#C9963B]" />
                          <p className="text-xs text-[#6B7B8D]">UMR/Month</p>
                        </div>
                        <p className="font-bold text-[#C9963B]">Rp {(region.umr / 1000000).toFixed(1)}M</p>
                      </div>
                      <div className="bg-[#F5F3EF] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-[#1B4D5C]" />
                          <p className="text-xs text-[#6B7B8D]">Projects</p>
                        </div>
                        <p className="font-bold text-[#1C2A33]">{region.projects}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <p className="text-xs text-[#6B7B8D]">Investment Realization</p>
                        <p className="font-bold text-[#1B4D5C]">Rp {region.investmentRealization}T</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#6B7B8D]">Export</p>
                        <p className="font-bold text-[#C9963B]">${region.export}M</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7B8D] mb-2">Top Sectors</p>
                      <div className="flex flex-wrap gap-1.5">
                        {region.topSectors.map((s) => (
                          <Badge key={s} className="bg-[#1B4D5C] text-white text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
