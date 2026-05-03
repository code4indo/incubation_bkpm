import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { projects, regions } from '@/data/realData';
import { ports, airports, keks, tollRoads, railwayStations, typedPorts, typedAirports } from '@/data/infrastructureData';
import { computeRegionalScores } from '@/lib/scoringEngine';
import { getPirZones } from '@/lib/geoJsonUtil';
import { formatIdrCompact } from '@/lib/formatters';
import type { Project, Region } from '@/types';
import type { GeoJSON as LeafletGeoJSON } from 'leaflet';
import { Anchor, TrendingUp, DollarSign, Users, Factory } from 'lucide-react';

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

const kekIcon = L.divIcon({
  className: 'custom-div-icon',
  html: '<div style="background:#22c55e;width:10px;height:10px;border-radius:3px;border:2px solid white;"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

const tollIcon = L.divIcon({
  className: 'custom-div-icon',
  html: '<div style="background:#9333ea;width:8px;height:8px;border-radius:50%;border:2px solid white;opacity:0.8;"></div>',
  iconSize: [8, 8],
  iconAnchor: [4, 4]
});

const railIcon = L.divIcon({
  className: 'custom-div-icon',
  html: '<div style="background:#f59e0b;width:7px;height:7px;border-radius:1px;border:1.5px solid white;transform:rotate(45deg);"></div>',
  iconSize: [7, 7],
  iconAnchor: [3, 3]
});

const railIcon = L.divIcon({
  className: 'custom-div-icon',
  html: '<div style="background:#f59e0b;width:7px;height:7px;border-radius:1px;border:1.5px solid white;transform:rotate(45deg);"></div>',
  iconSize: [7, 7],
  iconAnchor: [3, 3]
});

// Map bounds fitter — only fires on initial mount, not on every re-render
function MapBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  const hasFit = useRef(false);
  useEffect(() => {
    if (!hasFit.current) {
      map.fitBounds(bounds, { padding: [30, 30] });
      hasFit.current = true;
    }
  }, [map, bounds]);
  return null;
}

// Fly to selected project location
function MapFlyTo({ lat, lng, enabled }: { lat: number; lng: number; enabled: boolean }) {
  const map = useMap();
  const prevRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const key = `${lat}:${lng}`;
    if (prevRef.current && prevRef.current.lat === lat && prevRef.current.lng === lng) return;
    prevRef.current = { lat, lng };
    map.flyTo([lat, lng], 8, { duration: 1.2 });
  }, [map, lat, lng, enabled]);
  return null;
}

interface MapVisualizationProps {
  selectedProject?: Project | null;
  showHeatmap?: boolean;
  showProjects?: boolean;
  showInfrastructure?: boolean;
  showZones?: boolean;
  showRailways?: boolean;
  height?: string;
}

export function MapVisualization({
  selectedProject = null,
  showHeatmap = true,
  showProjects = true,
  showInfrastructure = false,
  showZones = false,
  showRailways = false,
  height = '500px'
}: MapVisualizationProps) {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const scores = useMemo(() => computeRegionalScores(regions, typedPorts, typedAirports), []);

  // Load merged PIR zones (KEK + KI from Kemenperin)
  const pirZones = useMemo(() => {
    try {
      return getPirZones().features;
    } catch {
      return [];
    }
  }, []);

  // Convert to Leaflet-compatible GeoJSON
  const pirGeoJsonData = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: pirZones,
  }), [pirZones]);

  // Style function for PIR zone polygons — color by zone type
  const zoneStyle = (feature: any) => {
    const isHovered = hoveredZone === feature?.properties?.name;
    const isKEK = feature?.properties?.type === 'KEK';
    if (isKEK) {
      return {
        fillColor: '#22c55e',
        fillOpacity: isHovered ? 0.4 : 0.2,
        color: '#16a34a',
        weight: isHovered ? 3 : 1.5,
      };
    }
    return {
      fillColor: '#9333ea',
      fillOpacity: isHovered ? 0.35 : 0.15,
      color: '#7c3aed',
      weight: isHovered ? 2.5 : 1,
      dashArray: '4, 4',
    };
  };

  // Map bounds for Indonesia (memoized to avoid re-fitBounds on every render)
  const indonesiaBounds = useMemo<L.LatLngBoundsExpression>(() => [
    [-11.0, 95.0],
    [6.5, 141.0]
  ], []);

  const selectedProjectRegion = useMemo(() =>
    selectedProject
      ? regions.find(r => r.name === selectedProject.province)
      : null,
    [selectedProject]
  );

  // Check if project has valid coordinates for highlight/fly-to
  const hasValidCoords = selectedProject
    && selectedProject.coordinates
    && selectedProject.coordinates.lat !== 0
    && selectedProject.coordinates.lng !== 0;

  return (
    <div className="space-y-4">
      {/* Map */}
      <div style={{ height: height === '100%' ? '500px' : height }} className="rounded-xl overflow-hidden border border-gray-200 shadow-md relative">
        <MapContainer
          center={[-2.5, 118]}
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
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
                      <p className="font-bold text-[#1B4D5C]">{formatIdrCompact(project.investmentValue * 1_000_000)}</p>
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
                  <p className="text-xs text-gray-500">{airport.province}</p>
                  <p className="text-xs text-gray-600 mt-1">{airport.detail}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* KEK markers */}
          {showInfrastructure && keks.map((kek) => (
            <Marker
              key={kek.name}
              position={[kek.lat, kek.lng]}
              icon={kekIcon}
            >
              <Popup>
                <div>
                  <p className="font-semibold text-sm">{kek.name}</p>
                  <p className="text-xs text-gray-500">{kek.province}</p>
                  <p className="text-xs text-gray-600 mt-1">{kek.detail}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Toll Road markers */}
          {showInfrastructure && tollRoads.map((toll) => (
            <Marker
              key={toll.name}
              position={[toll.lat, toll.lng]}
              icon={tollIcon}
            >
              <Popup>
                <div>
                  <p className="font-semibold text-sm">{toll.name}</p>
                  <p className="text-xs text-gray-500">{toll.detail}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Railway Station markers */}
          {showRailways && railwayStations.map((station) => (
            <Marker
              key={station.name}
              position={[station.lat, station.lng]}
              icon={railIcon}
            >
              <Popup>
                <div>
                  <p className="font-semibold text-sm">{station.name}</p>
                  <p className="text-xs text-gray-500">{station.detail}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* PIR Zone GeoJSON Polygon Overlay — merged KEK + KI (Kemenperin) */}
          {showZones && (
            <GeoJSON
              key="pir-zones"
              data={pirGeoJsonData as any}
              style={zoneStyle}
              onEachFeature={(feature: any, layer: LeafletGeoJSON) => {
                const props = feature.properties;
                const isKEK = props.type === 'KEK';
                const statusOrLuas = isKEK
                  ? `<p style="font-size:12px;color:#666;margin-bottom:2px"><b>Status:</b> ${props.status || '-'}</p>`
                  : `<p style="font-size:12px;color:#666;margin-bottom:2px"><b>Luas:</b> ${props.luas_ha || '-'} ha</p>`;
                const pengelolaOrDesc = isKEK
                  ? `<p style="font-size:12px;color:#444;margin-bottom:4px">${props.description || ''}</p>`
                  : `<p style="font-size:12px;color:#444;margin-bottom:4px"><b>Pengelola:</b> ${props.pengelola || '-'}</p>`;
                const kabOrProv = isKEK
                  ? ''
                  : `<p style="font-size:12px;color:#666;margin-bottom:2px">${props.kabupaten || ''}</p>`;

                layer.bindPopup(`
                  <div style="min-width:220px">
                    <h4 style="font-weight:700;margin-bottom:2px;color:#1B4D5C">
                      ${props.name} <span style="font-size:10px;color:${isKEK ? '#16a34a' : '#7c3aed'}">[${props.type}]</span>
                    </h4>
                    <p style="font-size:12px;color:#666;margin-bottom:4px">${props.province}</p>
                    ${kabOrProv}
                    ${statusOrLuas}
                    ${pengelolaOrDesc}
                    ${(props.sectors || []).length > 0 ? `
                    <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:4px">
                      ${props.sectors.map((s: string) =>
                        `<span style="background:#f0f0f0;padding:1px 6px;border-radius:3px;font-size:10px">${s}</span>`
                      ).join('')}
                    </div>` : ''}
                    ${(props.incentives || []).length > 0 ? `
                    <div style="display:flex;flex-wrap:wrap;gap:3px">
                      ${props.incentives.map((inc: string) =>
                        `<span style="background:#dcfce7;color:#166534;padding:1px 6px;border-radius:3px;font-size:10px">${inc}</span>`
                      ).join('')}
                    </div>` : ''}
                  </div>
                `);
                layer.on({
                  mouseover: () => setHoveredZone(props.name),
                  mouseout: () => setHoveredZone(null),
                });
              }}
            />
          )}

          {/* Selected project highlight — visible marker + pulsing ring + fly-to */}
          {hasValidCoords && (
            <>
              <MapFlyTo lat={selectedProject!.coordinates.lat} lng={selectedProject!.coordinates.lng} enabled={true} />
              <CircleMarker
                center={[selectedProject!.coordinates.lat, selectedProject!.coordinates.lng]}
                radius={30}
                pathOptions={{
                  fillColor: '#C9963B',
                  fillOpacity: 0.12,
                  color: '#C9963B',
                  weight: 4,
                  dashArray: '8, 4'
                }}
              />
              <CircleMarker
                center={[selectedProject!.coordinates.lat, selectedProject!.coordinates.lng]}
                radius={8}
                pathOptions={{
                  fillColor: '#C9963B',
                  fillOpacity: 0.9,
                  color: '#1B4D5C',
                  weight: 3,
                }}
              />
              <Popup
                position={[selectedProject!.coordinates.lat, selectedProject!.coordinates.lng]}
              >
                <div className="min-w-[220px]">
                  <h4 className="font-bold text-[#1B4D5C] text-sm mb-1">{selectedProject!.nameEn}</h4>
                  <p className="text-xs text-gray-500 mb-2">{selectedProject!.province} — {selectedProject!.location}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Investment</span>
                      <p className="font-bold text-[#1B4D5C]">{formatIdrCompact(selectedProject!.investmentValue * 1_000_000)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">IRR</span>
                      <p className="font-bold text-[#C9963B]">{selectedProject!.irr}%</p>
                    </div>
                  </div>
                </div>
              </Popup>
            </>
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
                <span className="text-xs text-gray-600">Port (132)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-600 inline-block"></span>
                <span className="text-xs text-gray-600">Airport (106)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-500 inline-block"></span>
                <span className="text-xs text-gray-600">KEK (20)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-600 inline-block opacity-80"></span>
                <span className="text-xs text-gray-600">Toll (20)</span>
              </div>
              {showRailways && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rotate-45 bg-amber-500 inline-block border border-white"></span>
                  <span className="text-xs text-gray-600">Railway (20)</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
