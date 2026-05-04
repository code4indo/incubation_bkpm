/**
 * ADMIN INVESTOR DATA PAGE — Comprehensive Investor Management Dashboard
 *
 * Features:
 *   - Overview statistics by investor type, nationality, risk appetite
 *   - Searchable & filterable investor table
 *   - Detailed investor profile card with all CMS fields
 *   - CMS scoring readiness indicators
 *   - Investment history & interaction data
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ALL_SYNTHETIC_INVESTORS, INVESTOR_STATS } from '@/data/semiSyntheticInvestors';
import type { InvestorProfile, InvestorType, RiskAppetite, CapexRange, InvestmentHorizon } from '@/types';
import { formatIdrCompact } from '@/lib/formatters';
import {
  Shield, Search, Users, Building2, Globe2, TrendingUp, DollarSign,
  ChevronLeft, ChevronRight, X, Eye, Database, BarChart3, MapPin,
  Target, Clock, AlertTriangle, CheckCircle2, Info, Filter,
  Landmark, Briefcase, UserCircle, Banknote, Sparkles, ArrowUpDown,
  Layers, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const INVESTOR_TYPE_META: Record<InvestorType, { label: string; color: string; bg: string; icon: typeof Building2 }> = {
  'SWF':           { label: 'Sovereign Wealth Fund', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-200', icon: Landmark },
  'DFI':           { label: 'Development Finance Inst.', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200', icon: Landmark },
  'PE':            { label: 'Private Equity', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200', icon: Briefcase },
  'VC':            { label: 'Venture Capital', color: 'text-pink-700', bg: 'bg-pink-100 border-pink-200', icon: Briefcase },
  'Corporate':     { label: 'Corporate', color: 'text-teal-700', bg: 'bg-teal-100 border-teal-200', icon: Building2 },
  'FamilyOffice':  { label: 'Family Office', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-200', icon: Banknote },
  'Institutional': { label: 'Institutional', color: 'text-indigo-700', bg: 'bg-indigo-100 border-indigo-200', icon: Landmark },
  'HNWI':          { label: 'High Net Worth Individual', color: 'text-green-700', bg: 'bg-green-100 border-green-200', icon: UserCircle },
};

const RISK_META: Record<RiskAppetite, { color: string; bg: string; dot: string }> = {
  'Conservative': { color: 'text-green-700', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
  'Moderate':     { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  'Aggressive':   { color: 'text-red-700', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
};

const CAPEX_META: Record<CapexRange, { color: string; label: string }> = {
  'Micro':  { color: 'text-gray-600', label: '< Rp 1T' },
  'Small':  { color: 'text-blue-600', label: 'Rp 1-10T' },
  'Medium': { color: 'text-teal-600', label: 'Rp 10-50T' },
  'Large':  { color: 'text-amber-600', label: 'Rp 50-200T' },
  'Mega':   { color: 'text-red-600', label: '> Rp 200T' },
};

const HORIZON_META: Record<InvestmentHorizon, { label: string; color: string }> = {
  'Short':  { label: '< 5 tahun', color: 'text-green-600' },
  'Medium': { label: '5-10 tahun', color: 'text-amber-600' },
  'Long':   { label: '> 10 tahun', color: 'text-blue-600' },
};

type SortField = 'name' | 'investorType' | 'nationality' | 'riskAppetite' | 'minTicketSize' | 'maxTicketSize' | 'totalInvestments' | 'profileCompleteness';
type SortDir = 'asc' | 'desc';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AdminInvestorPage() {
  const investors = ALL_SYNTHETIC_INVESTORS;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<InvestorType | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskAppetite | 'all'>('all');
  const [nationalityFilter, setNationalityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedInvestor, setSelectedInvestor] = useState<InvestorProfile | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  // ── Derived data ──
  const nationalities = useMemo(() => {
    const set = new Set(investors.map(i => i.nationality).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [investors]);

  const filtered = useMemo(() => {
    let list = [...investors];
    if (typeFilter !== 'all') list = list.filter(i => i.investorType === typeFilter);
    if (riskFilter !== 'all') list = list.filter(i => i.riskAppetite === riskFilter);
    if (nationalityFilter !== 'all') list = list.filter(i => i.nationality === nationalityFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.company.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        (i.nationality || '').toLowerCase().includes(q) ||
        i.sectorPreferences.some(s => s.toLowerCase().includes(q)) ||
        i.preferredProvinces.some(p => p.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'investorType': cmp = a.investorType.localeCompare(b.investorType); break;
        case 'nationality': cmp = (a.nationality || '').localeCompare(b.nationality || ''); break;
        case 'riskAppetite': cmp = a.riskAppetite.localeCompare(b.riskAppetite); break;
        case 'minTicketSize': cmp = a.minTicketSize - b.minTicketSize; break;
        case 'maxTicketSize': cmp = a.maxTicketSize - b.maxTicketSize; break;
        case 'totalInvestments': cmp = a.totalInvestments - b.totalInvestments; break;
        case 'profileCompleteness': cmp = a.profileCompleteness - b.profileCompleteness; break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [investors, typeFilter, riskFilter, nationalityFilter, search, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ── Stats ──
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const byNationality: Record<string, number> = {};
    const byRisk: Record<string, number> = {};
    let totalTicketMin = 0;
    let totalTicketMax = 0;
    let avgCompleteness = 0;

    investors.forEach(i => {
      byType[i.investorType] = (byType[i.investorType] || 0) + 1;
      byNationality[i.nationality || 'Unknown'] = (byNationality[i.nationality || 'Unknown'] || 0) + 1;
      byRisk[i.riskAppetite] = (byRisk[i.riskAppetite] || 0) + 1;
      totalTicketMin += i.minTicketSize;
      totalTicketMax += i.maxTicketSize;
      avgCompleteness += i.profileCompleteness;
    });

    return {
      total: investors.length,
      byType,
      byNationality,
      byRisk,
      totalTicketMin,
      totalTicketMax,
      avgCompleteness: Math.round(avgCompleteness / investors.length),
      coldStartCount: investors.filter(i => i.totalInvestments < 3).length,
      readyCount: investors.filter(i => i.totalInvestments >= 3 && i.profileCompleteness >= 80).length,
      syntheticCount: investors.filter(i => i.isSynthetic).length,
    };
  }, [investors]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-[#1B4D5C] transition-colors group"
    >
      {children}
      <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortField === field ? 'opacity-100 text-[#C9963B]' : 'opacity-30 group-hover:opacity-60'}`} />
    </button>
  );

  const clearFilters = () => {
    setTypeFilter('all');
    setRiskFilter('all');
    setNationalityFilter('all');
    setSearch('');
    setPage(0);
  };

  const hasActiveFilters = typeFilter !== 'all' || riskFilter !== 'all' || nationalityFilter !== 'all' || search !== '';

  return (
    <motion.main
      key="admin-investors"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="pt-20 pb-6 md:pt-24 md:pb-8 px-4 sm:px-8 lg:px-16 bg-[#1B4D5C]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2 md:mb-3">
            <div className="bg-[#C9963B]/20 p-1.5 md:p-2 rounded-lg">
              <Database className="w-5 h-5 md:w-6 md:h-6 text-[#C9963B]" />
            </div>
            <Badge className="bg-[#C9963B]/20 text-[#C9963B] border-[#C9963B]/30 text-[10px] md:text-xs">
              Data Investor
            </Badge>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3">
            Data Investor
          </h1>
          <p className="text-white/70 text-sm md:text-lg max-w-3xl leading-relaxed">
            Kelola dan pantau data investor secara lengkap — profil, preferensi investasi, riwayat, dan kesiapan CMS matching.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-8 space-y-6">
        {/* ── Overview Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          <StatCard icon={Users} label="Total Investor" value={stats.total} color="text-[#1B4D5C]" bg="bg-[#1B4D5C]/10" />
          <StatCard icon={CheckCircle2} label="CMS Ready" value={stats.readyCount} color="text-green-600" bg="bg-green-50" />
          <StatCard icon={AlertTriangle} label="Cold Start" value={stats.coldStartCount} color="text-amber-600" bg="bg-amber-50" />
          <StatCard icon={Target} label="Avg Completeness" value={`${stats.avgCompleteness}%`} color="text-[#C9963B]" bg="bg-[#C9963B]/10" />
          <StatCard icon={DollarSign} label="Min Ticket Total" value={`Rp ${stats.totalTicketMin.toFixed(0)}T`} color="text-teal-600" bg="bg-teal-50" />
          <StatCard icon={DollarSign} label="Max Ticket Total" value={`Rp ${stats.totalTicketMax.toFixed(0)}T`} color="text-indigo-600" bg="bg-indigo-50" />
        </div>

        {/* ── Type Distribution ── */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1B4D5C]" /> Distribusi Tipe Investor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
              {(Object.entries(INVESTOR_TYPE_META) as [InvestorType, typeof INVESTOR_TYPE_META[InvestorType]][]).map(([type, meta]) => {
                const count = stats.byType[type] || 0;
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                const Icon = meta.icon;
                return (
                  <button
                    key={type}
                    onClick={() => { setTypeFilter(typeFilter === type ? 'all' : type); setPage(0); }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      typeFilter === type
                        ? `${meta.bg} ring-2 ring-offset-1 ring-current ${meta.color}`
                        : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${meta.color}`} />
                    <p className="text-xl font-bold text-[#1C2A33]">{count}</p>
                    <p className="text-[10px] text-gray-500 font-semibold">{type}</p>
                    <p className="text-[9px] text-gray-400">{pct}%</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Search & Filters ── */}
        <div className="sticky top-14 md:top-16 z-30 bg-[#F5F3EF]/80 backdrop-blur-md -mx-4 px-4 md:mx-0 md:px-0">
          <div className="bg-white rounded-xl shadow-md border p-3 md:p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari investor, perusahaan, sektor, provinsi..."
                  className="pl-9 h-10"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                />
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-8 text-gray-500">
                  <X className="w-3 h-3 mr-1" /> Reset Filter
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Risk Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400 font-semibold mr-1">Risiko:</span>
                {(['all', 'Conservative', 'Moderate', 'Aggressive'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => { setRiskFilter(r); setPage(0); }}
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                      riskFilter === r
                        ? r === 'all' ? 'bg-[#1B4D5C] text-white' : `${RISK_META[r].bg} ${RISK_META[r].color}`
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {r === 'all' ? 'Semua' : r}
                  </button>
                ))}
              </div>

              {/* Nationality Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400 font-semibold mr-1">Negara:</span>
                <select
                  value={nationalityFilter}
                  onChange={e => { setNationalityFilter(e.target.value); setPage(0); }}
                  className="text-[10px] font-semibold px-2 py-1 rounded-md border border-gray-200 bg-white text-gray-600"
                >
                  <option value="all">Semua Negara</option>
                  {nationalities.map(n => (
                    <option key={n} value={n}>{n} ({stats.byNationality[n] || 0})</option>
                  ))}
                </select>
              </div>

              <div className="ml-auto text-[10px] text-gray-400 self-center">
                {filtered.length} investor ditemukan
              </div>
            </div>
          </div>
        </div>

        {/* ── Investor Table ── */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold text-[#1B4D5C]">
                      <SortHeader field="name">Investor</SortHeader>
                    </th>
                    <th className="text-left p-3 font-semibold text-[#1B4D5C]">
                      <SortHeader field="investorType">Tipe</SortHeader>
                    </th>
                    <th className="text-left p-3 font-semibold text-[#1B4D5C]">
                      <SortHeader field="nationality">Negara</SortHeader>
                    </th>
                    <th className="text-left p-3 font-semibold text-[#1B4D5C]">
                      <SortHeader field="riskAppetite">Risiko</SortHeader>
                    </th>
                    <th className="text-left p-3 font-semibold text-[#1B4D5C]">
                      <SortHeader field="minTicketSize">Ticket Size</SortHeader>
                    </th>
                    <th className="text-left p-3 font-semibold text-[#1B4D5C]">Sektor</th>
                    <th className="text-left p-3 font-semibold text-[#1B4D5C]">Horizon</th>
                    <th className="text-left p-3 font-semibold text-[#1B4D5C]">
                      <SortHeader field="totalInvestments">Investasi</SortHeader>
                    </th>
                    <th className="text-left p-3 font-semibold text-[#1B4D5C]">
                      <SortHeader field="profileCompleteness">Kelengkapan</SortHeader>
                    </th>
                    <th className="text-center p-3 font-semibold text-[#1B4D5C]">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(inv => (
                    <InvestorRow key={inv.id} investor={inv} onSelect={() => setSelectedInvestor(inv)} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-100">
              {paginated.map(inv => (
                <InvestorCard key={inv.id} investor={inv} onSelect={() => setSelectedInvestor(inv)} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Tidak ada investor yang cocok dengan filter</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Menampilkan {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filtered.length)} dari {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={page === i ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(i)}
                  className={`h-8 w-8 p-0 text-xs ${page === i ? 'bg-[#1B4D5C] hover:bg-[#163a47]' : ''}`}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Data Source Notice ── */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <h3 className="font-bold text-[#1B4D5C] mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" /> Sumber Data
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 text-xs text-gray-500">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] px-1.5">Semi-Sintetis</Badge>
                  <span>Profil investor dibuat berdasarkan statistik realisasi BKPM 2024/2025 dan data publik. Nama entitas nyata digunakan tetapi atribut adalah estimasi/simulasi.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[9px] px-1.5">CMS Ready</Badge>
                  <span>Investor dengan totalInvestments ≥ 3 dan profileCompleteness ≥ 80% dianggap siap untuk CMS matching (bukan cold-start).</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-[9px] px-1.5">KBLI 2020</Badge>
                  <span>Preferensi KBLI investor dipetakan berdasarkan aktivitas historis dan sektor fokus yang dilaporkan secara publik.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[9px] px-1.5">9 Kategori</Badge>
                  <span>SWF, DFI, PE, VC, Corporate, Family Office, Institutional, HNWI, dan Chinese FDI mewakili profil investor utama di Indonesia.</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Investor Detail Drawer ── */}
      <AnimatePresence>
        {selectedInvestor && (
          <InvestorDetailDrawer
            investor={selectedInvestor}
            onClose={() => setSelectedInvestor(null)}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl p-3 text-center border border-transparent`}>
      <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
      <p className="text-xl md:text-2xl font-bold text-[#1C2A33]">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase font-semibold">{label}</p>
    </div>
  );
}

function InvestorRow({ investor, onSelect }: { investor: InvestorProfile; onSelect: () => void }) {
  const typeMeta = INVESTOR_TYPE_META[investor.investorType];
  const riskMeta = RISK_META[investor.riskAppetite];
  const isColdStart = investor.totalInvestments < 3;

  return (
    <tr className="border-b hover:bg-gray-50/50 transition-colors">
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeMeta.bg}`}>
            <typeMeta.icon className={`w-4 h-4 ${typeMeta.color}`} />
          </div>
          <div>
            <p className="font-medium text-gray-800 text-xs line-clamp-1">{investor.company}</p>
            <p className="text-[10px] text-gray-400 line-clamp-1">{investor.name.replace(' (Synthetic)', '')}</p>
          </div>
        </div>
      </td>
      <td className="p-3">
        <Badge className={`text-[9px] px-1.5 py-0 border ${typeMeta.bg} ${typeMeta.color}`}>
          {investor.investorType}
        </Badge>
      </td>
      <td className="p-3 text-xs text-gray-600 flex items-center gap-1">
        <Globe2 className="w-3 h-3 text-gray-400" />
        {investor.nationality || '-'}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${riskMeta.dot}`} />
          <span className={`text-xs font-medium ${riskMeta.color}`}>{investor.riskAppetite}</span>
        </div>
      </td>
      <td className="p-3 text-xs">
        <span className="text-gray-500">Rp {investor.minTicketSize}-{investor.maxTicketSize}T</span>
        <Badge className={`ml-1 text-[8px] px-1 py-0 ${
          CAPEX_META[investor.capexRange].color
        } bg-gray-50 border-gray-200`}>
          {investor.capexRange}
        </Badge>
      </td>
      <td className="p-3">
        <div className="flex flex-wrap gap-0.5 max-w-[160px]">
          {investor.sectorPreferences.slice(0, 2).map(s => (
            <Badge key={s} variant="outline" className="text-[8px] px-1 py-0 border-gray-200 text-gray-600">
              {s}
            </Badge>
          ))}
          {investor.sectorPreferences.length > 2 && (
            <span className="text-[8px] text-gray-400">+{investor.sectorPreferences.length - 2}</span>
          )}
        </div>
      </td>
      <td className="p-3 text-xs text-gray-600">{investor.investmentHorizon}</td>
      <td className="p-3">
        <span className={`text-xs font-medium ${isColdStart ? 'text-amber-600' : 'text-green-600'}`}>
          {investor.totalInvestments}
        </span>
        {isColdStart && (
          <span className="text-[8px] text-amber-500 ml-1">cold</span>
        )}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <Progress value={investor.profileCompleteness} className="h-1.5 w-16" />
          <span className={`text-[10px] font-medium ${
            investor.profileCompleteness >= 90 ? 'text-green-600' :
            investor.profileCompleteness >= 70 ? 'text-amber-600' : 'text-red-500'
          }`}>
            {investor.profileCompleteness}%
          </span>
        </div>
      </td>
      <td className="p-3 text-center">
        <Button variant="ghost" size="sm" onClick={onSelect} className="h-7 px-2 text-[10px] text-[#1B4D5C] hover:text-[#C9963B]">
          <Eye className="w-3.5 h-3.5 mr-1" /> Detail
        </Button>
      </td>
    </tr>
  );
}

function InvestorCard({ investor, onSelect }: { investor: InvestorProfile; onSelect: () => void }) {
  const typeMeta = INVESTOR_TYPE_META[investor.investorType];
  const riskMeta = RISK_META[investor.riskAppetite];
  const isColdStart = investor.totalInvestments < 3;

  return (
    <div className="p-4 hover:bg-gray-50/50 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${typeMeta.bg}`}>
            <typeMeta.icon className={`w-4 h-4 ${typeMeta.color}`} />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-800">{investor.company}</p>
            <p className="text-[10px] text-gray-400">{investor.name.replace(' (Synthetic)', '')}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onSelect} className="h-7 px-2 text-[10px] text-[#1B4D5C]">
          <Eye className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge className={`text-[9px] px-1.5 py-0 border ${typeMeta.bg} ${typeMeta.color}`}>
          {investor.investorType}
        </Badge>
        <Badge className={`text-[9px] px-1.5 py-0 border ${riskMeta.bg} ${riskMeta.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${riskMeta.dot} mr-1 inline-block`} />
          {investor.riskAppetite}
        </Badge>
        <Badge className="text-[9px] px-1.5 py-0 bg-gray-50 border-gray-200 text-gray-600">
          <Globe2 className="w-2.5 h-2.5 mr-0.5" /> {investor.nationality || '-'}
        </Badge>
        {isColdStart && (
          <Badge className="text-[9px] px-1.5 py-0 bg-amber-50 border-amber-200 text-amber-600">
            Cold Start
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-gray-50 rounded-md p-2 text-center">
          <p className="text-[10px] text-gray-400">Ticket</p>
          <p className="font-semibold text-gray-700">{investor.minTicketSize}-{investor.maxTicketSize}T</p>
        </div>
        <div className="bg-gray-50 rounded-md p-2 text-center">
          <p className="text-[10px] text-gray-400">Horizon</p>
          <p className="font-semibold text-gray-700">{investor.investmentHorizon}</p>
        </div>
        <div className="bg-gray-50 rounded-md p-2 text-center">
          <p className="text-[10px] text-gray-400">Kelengkapan</p>
          <p className={`font-semibold ${
            investor.profileCompleteness >= 90 ? 'text-green-600' :
            investor.profileCompleteness >= 70 ? 'text-amber-600' : 'text-red-500'
          }`}>
            {investor.profileCompleteness}%
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INVESTOR DETAIL DRAWER
// ═══════════════════════════════════════════════════════════════════════════

function InvestorDetailDrawer({ investor, onClose }: { investor: InvestorProfile; onClose: () => void }) {
  const typeMeta = INVESTOR_TYPE_META[investor.investorType];
  const riskMeta = RISK_META[investor.riskAppetite];
  const isColdStart = investor.totalInvestments < 3;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] lg:w-[560px] bg-white z-50 shadow-2xl overflow-y-auto"
      >
        {/* Drawer Header */}
        <div className="sticky top-0 bg-[#1B4D5C] text-white p-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white/10`}>
                <typeMeta.icon className="w-5 h-5 text-[#C9963B]" />
              </div>
              <div>
                <h2 className="font-bold text-lg">{investor.company}</h2>
                <p className="text-white/60 text-xs">{investor.id}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge className={`text-[10px] ${typeMeta.bg} ${typeMeta.color} border-0`}>
              {typeMeta.label}
            </Badge>
            <Badge className={`text-[10px] ${riskMeta.bg} ${riskMeta.color} border-0`}>
              {investor.riskAppetite}
            </Badge>
            <Badge className="text-[10px] bg-white/10 text-white/80 border-0">
              <Globe2 className="w-3 h-3 mr-1" /> {investor.nationality || '-'}
            </Badge>
            {isColdStart && (
              <Badge className="text-[10px] bg-amber-500/20 text-amber-300 border-0">
                Cold Start
              </Badge>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* CMS Readiness */}
          <Card className={`border-0 shadow-sm ${isColdStart ? 'bg-amber-50' : 'bg-green-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {isColdStart ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                )}
                <span className="font-bold text-sm">
                  {isColdStart ? 'Cold Start — CMS Matching Terbatas' : 'CMS Ready — Matching Penuh'}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {isColdStart
                  ? `Investor ini memiliki ${investor.totalInvestments} investasi (minimum 3 diperlukan). Komponen S_behavior (β=0.25) akan dialihkan ke S_content (α_adj=0.60).`
                  : `Dengan ${investor.totalInvestments} investasi dan kelengkapan ${investor.profileCompleteness}%, semua komponen CMS aktif: S_content (α=0.35) + S_behavior (β=0.25) + S_policy (γ=0.25) + S_risk (δ=0.15).`
                }
              </p>
            </CardContent>
          </Card>

          {/* Profile Completeness */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#1B4D5C]">Kelengkapan Profil</span>
                <span className={`text-lg font-bold ${
                  investor.profileCompleteness >= 90 ? 'text-green-600' :
                  investor.profileCompleteness >= 70 ? 'text-amber-600' : 'text-red-500'
                }`}>
                  {investor.profileCompleteness}%
                </span>
              </div>
              <Progress value={investor.profileCompleteness} className="h-2" />
              <p className="text-[10px] text-gray-400 mt-1">Terakhir diperbarui: {investor.updatedAt}</p>
            </CardContent>
          </Card>

          {/* Investment Ticket Size */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-[#1B4D5C] text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Ticket Size & Skala
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-400">Minimum</p>
                  <p className="text-lg font-bold text-[#1B4D5C]">{formatIdrCompact(investor.minTicketSize * 1_000_000_000)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-400">Maksimum</p>
                  <p className="text-lg font-bold text-[#1B4D5C]">{formatIdrCompact(investor.maxTicketSize * 1_000_000_000)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Capex Range</span>
                <Badge className={`text-[10px] ${CAPEX_META[investor.capexRange].color} bg-gray-50`}>
                  {investor.capexRange} — {CAPEX_META[investor.capexRange].label}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400">Risk Tolerance</p>
                  <p className="text-sm font-semibold text-[#1B4D5C]">{investor.riskToleranceScore.toFixed(2)} / 1.0</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div className={`h-1.5 rounded-full ${riskMeta.dot}`} style={{ width: `${investor.riskToleranceScore * 100}%` }} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400">Investment Horizon</p>
                  <p className="text-sm font-semibold text-[#1B4D5C]">{investor.investmentHorizon}</p>
                  <p className="text-[10px] text-gray-400">{HORIZON_META[investor.investmentHorizon].label}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sector Preferences */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-[#1B4D5C] text-sm flex items-center gap-2">
                <Target className="w-4 h-4" /> Preferensi Sektor
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {investor.sectorPreferences.map(s => (
                  <Badge key={s} className="bg-[#1B4D5C] text-white px-2.5 py-1 text-xs">
                    {s}
                  </Badge>
                ))}
              </div>

              {investor.preferredKbliCodes.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold mb-1.5">KBLI 2020 Codes</p>
                  <div className="flex flex-wrap gap-1">
                    {investor.preferredKbliCodes.map(code => (
                      <Badge key={code} variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-[#1B4D5C]/30 text-[#1B4D5C]">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {investor.pastSectors.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold mb-1.5">Sektor Sebelumnya</p>
                  <div className="flex flex-wrap gap-1">
                    {investor.pastSectors.map(s => (
                      <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0 border-gray-200 text-gray-600">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Regional Preferences */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-[#1B4D5C] text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Preferensi Wilayah
              </h3>
              {investor.preferredRegions.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold mb-1.5">Pulau / Region</p>
                  <div className="flex flex-wrap gap-1.5">
                    {investor.preferredRegions.map(r => (
                      <Badge key={r} variant="secondary" className="px-2.5 py-1 text-xs">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {investor.preferredProvinces.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold mb-1.5">Provinsi</p>
                  <div className="flex flex-wrap gap-1.5">
                    {investor.preferredProvinces.map(p => (
                      <Badge key={p} variant="outline" className="border-[#1B4D5C]/30 text-[#1B4D5C] px-2 py-0.5 text-[11px]">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Focus Areas & Project Types */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-[#1B4D5C] text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Fokus & Tipe Proyek
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {investor.focusAreas.map(area => (
                  <Badge key={area} className="bg-[#C9963B]/20 text-[#C9963B] border border-[#C9963B]/30 px-2 py-0.5 text-[11px]">
                    {area}
                  </Badge>
                ))}
              </div>
              {investor.preferredProjectTypes.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold mb-1.5">Tipe Proyek Preferred</p>
                  <div className="flex flex-wrap gap-1.5">
                    {investor.preferredProjectTypes.map(pt => (
                      <Badge key={pt} variant="outline" className="border-teal-300 text-teal-700 px-2 py-0.5 text-[11px]">
                        {pt}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ESG Requirements */}
          {investor.esgRequirements.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-bold text-[#1B4D5C] text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Persyaratan ESG
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {investor.esgRequirements.map(esg => (
                    <Badge key={esg} className="bg-green-50 border-green-200 text-green-700 px-2 py-0.5 text-[11px]">
                      {esg}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Investment History */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-[#1B4D5C] text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Riwayat Investasi
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-400">Total</p>
                  <p className="text-xl font-bold text-[#1B4D5C]">{investor.totalInvestments}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-400">Timeline</p>
                  <p className="text-xl font-bold text-[#1B4D5C]">{investor.timelineMonths}bln</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-400">Pengalaman</p>
                  <p className="text-sm font-bold text-[#1B4D5C]">{investor.experienceLevel}</p>
                </div>
              </div>
              {investor.investmentHistory.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {investor.investmentHistory.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-xs">
                      <div className="w-6 h-6 rounded-full bg-[#1B4D5C]/10 flex items-center justify-center text-[10px] font-bold text-[#1B4D5C]">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-700">{h.projectSector} — {h.projectProvince}</p>
                        <p className="text-[10px] text-gray-400">
                          {h.projectType} · Rp {h.investmentValue}T · {h.investedAt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-gray-400">
                  <Database className="w-6 h-6 mx-auto mb-1 opacity-40" />
                  <p>Belum ada riwayat investasi tercatat</p>
                  {isColdStart && <p className="text-[10px] mt-1">Investor ini dalam status cold-start</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CMS Score Components */}
          <Card className="border-0 shadow-sm bg-[#1B4D5C] text-white">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#C9963B]" /> Komponen Skor CMS
              </h3>
              <p className="text-[10px] text-white/60">
                CMS(i,p) = α·S_content + β·S_behavior + γ·S_policy + δ·S_risk
              </p>

              <div className="space-y-2">
                <CMSBar
                  label="S_content"
                  weight={isColdStart ? 0.60 : 0.35}
                  desc={isColdStart ? 'α_adj (cold-start)' : 'α — Sector + Geo + Scale + Stage'}
                  color="bg-[#C9963B]"
                />
                <CMSBar
                  label="S_behavior"
                  weight={isColdStart ? 0 : 0.25}
                  desc={isColdStart ? 'β_adj = 0 (cold-start)' : 'β — Network Diffusion + Domain Pref.'}
                  color="bg-purple-400"
                  disabled={isColdStart}
                />
                <CMSBar
                  label="S_policy"
                  weight={0.25}
                  desc="γ — PSN + DNI + KEK + Priority + Jobs"
                  color="bg-teal-400"
                />
                <CMSBar
                  label="S_risk"
                  weight={0.15}
                  desc="δ — Risk Compatibility + Macro"
                  color="bg-blue-400"
                />
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 text-[10px] text-white/50">
                <p>Risk Tolerance Score: {investor.riskToleranceScore.toFixed(2)} (0=Konservatif, 1=Agresif)</p>
                <p>Confidence Level: {isColdStart ? 'Low' : investor.totalInvestments >= 5 ? 'High' : 'Medium'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-bold text-[#1B4D5C] text-sm mb-3">Metadata</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-[10px] text-gray-400">Dibuat</p>
                  <p className="font-medium text-gray-700">{investor.createdAt}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-[10px] text-gray-400">Diperbarui</p>
                  <p className="font-medium text-gray-700">{investor.updatedAt}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-[10px] text-gray-400">Tipe Data</p>
                  <p className="font-medium text-gray-700">
                    {investor.isSynthetic ? 'Semi-Sintetis' : 'Real'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-[10px] text-gray-400">Email</p>
                  <p className="font-medium text-gray-700">{investor.email || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </>
  );
}

function CMSBar({ label, weight, desc, color, disabled }: {
  label: string;
  weight: number;
  desc: string;
  color: string;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? 'opacity-40' : ''}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold">{label}</span>
        <span className="text-xs text-[#C9963B] font-mono">{weight.toFixed(2)}</span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${weight * 100}%` }} />
      </div>
      <p className="text-[9px] text-white/40 mt-0.5">{desc}</p>
    </div>
  );
}
