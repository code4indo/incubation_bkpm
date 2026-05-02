/**
 * Project Image Helper
 * Maps project sector to a local fallback image when external BKPM images fail
 * Uses longest-match-first for accurate sector classification
 */

const sectorImageMap: Record<string, string> = {
  // Agriculture (check these FIRST — more specific than "industri")
  'agro industri': '/images/project-agriculture.jpg',
  'pertanian': '/images/project-agriculture.jpg',
  'perkebunan': '/images/project-agriculture.jpg',
  'perikanan': '/images/project-agriculture.jpg',
  'peternakan': '/images/project-agriculture.jpg',
  'kelapa': '/images/project-agriculture.jpg',
  'kakao': '/images/project-agriculture.jpg',
  'kopi': '/images/project-agriculture.jpg',
  'sawit': '/images/project-agriculture.jpg',
  'pangan': '/images/project-agriculture.jpg',
  'padi': '/images/project-agriculture.jpg',
  'jagung': '/images/project-agriculture.jpg',
  'kedelai': '/images/project-agriculture.jpg',
  'hortikultura': '/images/project-agriculture.jpg',
  'budidaya': '/images/project-agriculture.jpg',
  'rumput laut': '/images/project-agriculture.jpg',
  'agro': '/images/project-agriculture.jpg',

  // Energy
  'energi terbarukan': '/images/project-energy.jpg',
  'energi': '/images/project-energy.jpg',
  'listrik': '/images/project-energy.jpg',
  'geothermal': '/images/project-energy.jpg',
  'surya': '/images/project-energy.jpg',
  'plta': '/images/project-energy.jpg',
  'plts': '/images/project-energy.jpg',
  'pltp': '/images/project-energy.jpg',
  'pltu': '/images/project-energy.jpg',

  // Digital / Technology
  'data center': '/images/project-datacenter.jpg',
  'digital': '/images/project-datacenter.jpg',
  'teknologi': '/images/project-datacenter.jpg',

  // Infrastructure / Tourism / Smart City
  'kawasan industri dan real estate': '/images/project-smartcity.jpg',
  'kawasan industri': '/images/project-smartcity.jpg',
  'infrastruktur': '/images/project-smartcity.jpg',
  'pariwisata': '/images/project-smartcity.jpg',
  'hotel': '/images/project-smartcity.jpg',
  'resort': '/images/project-smartcity.jpg',
  'transportasi': '/images/project-smartcity.jpg',
  'pelabuhan': '/images/project-smartcity.jpg',
  'logistik': '/images/project-smartcity.jpg',
  'konstruksi': '/images/project-smartcity.jpg',
  'pengangkutan': '/images/project-smartcity.jpg',
  'jasa dan kawasan': '/images/project-smartcity.jpg',

  // Industry / Manufacturing (check LAST — most generic)
  'industri manufaktur': '/images/project-steel.jpg',
  'manufaktur': '/images/project-steel.jpg',
  'mining': '/images/project-steel.jpg',
  'pengolahan': '/images/project-steel.jpg',
  'mineral': '/images/project-steel.jpg',
  'smelter': '/images/project-steel.jpg',
  'baja': '/images/project-steel.jpg',
  'aluminium': '/images/project-steel.jpg',
  'nikel': '/images/project-steel.jpg',
  'industri': '/images/project-steel.jpg',
  'perdagangan': '/images/project-steel.jpg',
  'sumber daya alam': '/images/project-steel.jpg',
};

/**
 * Get the best matching image for a project sector.
 * Uses longest-keyword-first matching for accuracy.
 * Example: "Agro Industri" matches "agro industri" (18 chars) before "industri" (8 chars)
 */
export function getProjectImage(sector: string): string {
  const normalized = sector.toLowerCase();

  // Sort by keyword length (longest first) for most specific match
  const sortedEntries = Object.entries(sectorImageMap).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [key, image] of sortedEntries) {
    if (normalized.includes(key)) {
      return image;
    }
  }

  // Default fallback
  return '/images/project-steel.jpg';
}
