import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { projects, regions, ports, airports } from '@/data/mockData';
import { computeRegionalScores, scoreProjectRegionAlignment } from '@/lib/scoringEngine';
import type { Project, Region } from '@/types';
import { Anchor, TrendingUp, DollarSign, Users, Activity } from 'lucide-react';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons
const projectIcon = L.divIcon({
  className: 'custom-div-icon',
  html: '<div style="background:#1B4D5C;width:14px;height:14px;border-radius:50%;border:3px solid #C9963B;box-shadow:0 0 8px rgba(201,150,59,0.5);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const portIcon = L.divIcon({
  className: 'custom-div-icon',
  html: '<div style="background:#2563eb;width:10px;height:10px;border-radius:50%;border:2px solid white;"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

const airportIcon = L.divIcon({
  className: 'custom-div-icon',
  html: '<div style="background:#0891b2;width:10px;height:10px;border-radius:50%;border:2px solid white;"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

// Map bounds fitter
function MapBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, bounds]);
  return null;
}

interface MapVisualizationProps {
  selectedProject?: Project | null;
  showHeatmap?: boolean;
  showProjects?: boolean;
  showInfrastructure?: boolean;
  height?: string;
}

export function MapVisualization({
  selectedProject = null,
  showHeatmap = true,
  showProjects = true,
  showInfrastructure = false,
  height = '500px'
}: MapVisualizationProps) {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const scores = useMemo(() => computeRegionalScores(regions, ports, airports), []);

  // Compute project-region alignment for selected project
  const alignments = useMemo(() => {
    if (!selectedProject) return [];
    return regions.map(region =>
      scoreProjectRegionAlignment(selectedProject, region)
    ).sort((a, b) => b.alignmentScore - a.alignmentScore);
  }, [selectedProject]);

  // Map bounds for Indonesia
  const indonesiaBounds: L.LatLngBoundsExpression = [
    [-11.0, 95.0],
    [6.5, 141.0]
  ];

  const selectedProjectRegion = selectedProject
    ? regions.find(r => r.name === selectedProject.province)
    : null;

  return (
    <div className="space-y-4">
      {/* Map */}
      <div style={{ height }} className="rounded-xl overflow-hidden border border-gray-200 shadow-md">
        <MapContainer
          center={[-2.5, 118]}
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          minZoom={4}
          maxZoom={10}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapBounds bounds={indonesiaBounds} />

          {/* Heatmap-style regional scoring circles */}
          {showHeatmap && scores.map((score) => (
            <CircleMarker
              key={score.regionId}
              center={[score.coordinates.lat, score.coordinates.lng]}
              radius={score.radius}
              pathOptions={{
                fillColor: score.color,
                fillOpacity: activeRegion === score.regionName ? 0.7 : 0.45,
                color: score.color,
                weight: activeRegion === score.regionName ? 2 : 1,
                opacity: 0.8
              }}
              eventHandlers={{
                mouseover: () => setActiveRegion(score.regionName),
                mouseout: () => setActiveRegion(null),
                click: () => {
                  const region = regions.find(r => r.id === score.regionId) || null;
                  setSelectedRegion(region);
                }
              }}
            >
              <Popup>
                <div className="min-w-[240px]">
                  <h4 className="font-bold text-[#1B4D5C] text-base mb-2">{score.regionName}</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Overall Score</span>
                      <span className="font-bold" style={{ color: score.color }}>{score.overallScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Infrastructure</span>
                      <span className="font-semibold">{score.infrastructureScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Market Access</span>
                      <span className="font-semibold">{score.marketAccessScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Workforce</span>
                      <span className="font-semibold">{score.workforceScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Investment Climate</span>
                      <span className="font-semibold">{score.investmentClimateScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nearest Port</span>
                      <span className="font-semibold">{score.portDistance} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nearest Airport</span>
                      <span className="font-semibold">{score.airportDistance} km</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Project markers */}
          {showProjects && projects.map((project) => (
            <Marker
              key={project.id}
              position={[project.coordinates.lat, project.coordinates.lng]}
              icon={projectIcon}
            >
              <Popup>
                <div className="min-w-[220px]">
                  <h4 className="font-bold text-[#1B4D5C] text-sm mb-1">{project.nameEn}</h4>
                  <p className="text-xs text-gray-500 mb-2">{project.province} — {project.location}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {project.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Investment</span>
                      <p className="font-bold text-[#1B4D5C]">Rp {project.investmentValue}T</p>
                    </div>
                    <div>
                      <span className="text-gray-500">IRR</span>
                      <p className="font-bold text-[#C9963B]">{project.irr}%</p>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Port markers */}
          {showInfrastructure && ports.map((port) => (
            <Marker
              key={port.name}
              position={[port.lat, port.lng]}
              icon={portIcon}
            >
              <Popup>
                <div>
                  <p className="font-semibold text-sm">{port.name}</p>
                  <p className="text-xs text-gray-500">{port.type} — {port.capacity}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Airport markers */}
          {showInfrastructure && airports.map((airport) => (
            <Marker
              key={airport.name}
              position={[airport.lat, airport.lng]}
              icon={airportIcon}
            >
              <Popup>
                <div>
                  <p className="font-semibold text-sm">{airport.name}</p>
                  <p className="text-xs text-gray-500">{airport.type} ({airport.iata})</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Selected project highlight */}
          {selectedProject && selectedProjectRegion && (
            <CircleMarker
              center={[selectedProject.coordinates.lat, selectedProject.coordinates.lng]}
              radius={25}
              pathOptions={{
                fillColor: '#C9963B',
                fillOpacity: 0.15,
                color: '#C9963B',
                weight: 3,
                dashArray: '5, 5'
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 uppercase">Regional Score:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
            <span className="text-xs">75-100</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
            <span className="text-xs">55-74</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
            <span className="text-xs">40-54</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
            <span className="text-xs">&lt;40</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#1B4D5C] border-2 border-[#C9963B] inline-block"></span>
            <span className="text-xs text-gray-600">Project</span>
          </div>
          {showInfrastructure && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                <span className="text-xs text-gray-600">Port</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-600 inline-block"></span>
                <span className="text-xs text-gray-600">Airport</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Project-Region Alignment Panel */}
      {selectedProject && alignments.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <h4 className="font-bold text-[#1B4D5C] mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              AI Alignment: <span className="text-[#C9963B]">{selectedProject.nameEn}</span> × Regional Potential
            </h4>
            <div className="grid md:grid-cols-2 gap-3">
              {alignments.slice(0, 6).map((alignment, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${idx === 0 ? 'border-[#C9963B] bg-[#C9963B]/5' : 'border-gray-100 bg-white'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-[#1C2A33]">{alignment.regionName}</span>
                    <span className={`text-sm font-bold ${alignment.alignmentScore >= 70 ? 'text-green-600' : alignment.alignmentScore >= 50 ? 'text-[#C9963B]' : 'text-gray-500'}`}>
                      {alignment.alignmentScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${alignment.alignmentScore}%`,
                        backgroundColor: alignment.alignmentScore >= 70 ? '#22c55e' : alignment.alignmentScore >= 50 ? '#C9963B' : '#9ca3af'
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {alignment.reasons.slice(0, 2).map((reason, ridx) => (
                      <span key={ridx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Region Detail */}
      {selectedRegion && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <h4 className="font-bold text-[#1B4D5C] mb-3">
              {selectedRegion.name} — Regional Profile
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#F5F3EF] rounded-lg p-3">
                <Users className="w-4 h-4 text-[#1B4D5C] mb-1" />
                <p className="text-xs text-gray-500">Workforce</p>
                <p className="font-bold text-[#1C2A33]">{(selectedRegion.workforce / 1000000).toFixed(1)}M</p>
              </div>
              <div className="bg-[#F5F3EF] rounded-lg p-3">
                <DollarSign className="w-4 h-4 text-[#C9963B] mb-1" />
                <p className="text-xs text-gray-500">UMR/Month</p>
                <p className="font-bold text-[#C9963B]">Rp {(selectedRegion.umr / 1000000).toFixed(1)}M</p>
              </div>
              <div className="bg-[#F5F3EF] rounded-lg p-3">
                <TrendingUp className="w-4 h-4 text-[#1B4D5C] mb-1" />
                <p className="text-xs text-gray-500">Infra Score</p>
                <p className="font-bold text-[#1C2A33]">{selectedRegion.infrastructureScore}/100</p>
              </div>
              <div className="bg-[#F5F3EF] rounded-lg p-3">
                <Anchor className="w-4 h-4 text-blue-600 mb-1" />
                <p className="text-xs text-gray-500">Projects</p>
                <p className="font-bold text-[#1C2A33]">{selectedRegion.projects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
