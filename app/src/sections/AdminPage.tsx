/**
 * ADMIN PAGE — System Administration Dashboard
 * 
 * Harmonizer Agent Console:
 * - Project language status evaluation (Scout pre-check)
 * - One-click harmonization (ID → EN translation via LLM)
 * - Batch harmonization for all pending projects
 * - Real-time status tracking
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { realProjects } from '@/data/realData';
import {
  evaluateAllProjects,
  calculateStats,
} from '@/lib/harmonizerAgent';
import { checkLLMHealth } from '@/lib/analystLLM';
import { setHarmonizedResult } from '@/lib/harmonizationStore';
import type { LanguageEvaluation, HarmonizationResult, AdminStats } from '@/lib/harmonizerAgent';
import {
  Shield,
  Search,
  Languages,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  RefreshCw,
  Zap,
  XCircle,
  Sparkles,
  BarChart3,
  Globe,
  ExternalLink,
  Cpu,
  Wifi,
  WifiOff,
  Server,
  Bot,
  Database,
  Activity,
  Info,
  ChevronDown,
  ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '@/types';

type TabFilter = 'all' | 'needs_name' | 'needs_description' | 'needs_full' | 'ready';

export function AdminPage({ onProjectClick }: { onProjectClick: (project: Project) => void }) {
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState<TabFilter>('needs_full');
  const [evaluations, setEvaluations] = useState<LanguageEvaluation[]>(() => evaluateAllProjects());
  const [harmonizingIds, setHarmonizingIds] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<Map<number, HarmonizationResult>>(new Map());
  const [pipelineLogs, setPipelineLogs] = useState<Map<number, string[]>>(new Map());
  const [verdicts, setVerdicts] = useState<Map<number, { verdict: string; score: number; traceId: string }>>(new Map());
  const [error, setError] = useState<string | null>(null);

  // Health check
  const [llmHealth, setLlmHealth] = useState<{
    available: boolean;
    model: string;
    latencyMs: number;
    error?: string;
  } | null>(null);
  const [healthChecking, setHealthChecking] = useState(false);

  const stats = useMemo(() => calculateStats(evaluations), [evaluations]);

  // Data stats
  const dataStats = useMemo(() => ({
    totalProjects: realProjects.length,
    withRealCoords: realProjects.filter(p => p.coordinates.lat !== 0 && p.coordinates.lng !== 0).length,
    pendingTranslations: stats.needsFullCount + stats.needsNameCount + stats.needsDescriptionCount,
  }), [stats]);

  // Run LLM health check on mount
  const runHealthCheck = useCallback(async () => {
    setHealthChecking(true);
    try {
      const health = await checkLLMHealth();
      setLlmHealth(health);
    } catch {
      setLlmHealth({ available: false, model: 'unknown', latencyMs: 0, error: 'Health check failed' });
    }
    setHealthChecking(false);
  }, []);

  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  // Re-evaluate all projects
  const handleRefresh = useCallback(() => {
    setEvaluations(evaluateAllProjects());
    setResults(new Map());
    setError(null);
  }, []);

  // Get evaluation for a specific project
  const getEval = useCallback((projectId: number) =>
    evaluations.find(e => e.projectId === projectId),
    [evaluations],
  );

  // Harmonize a single project via Backend Agent MAS (SSE)
  const handleHarmonize = useCallback(async (projectId: number) => {
    const ev = getEval(projectId);
    if (!ev || harmonizingIds.has(projectId)) return;

    setError(null);
    setHarmonizingIds(prev => new Set(prev).add(projectId));
    setPipelineLogs(prev => new Map(prev).set(projectId, ['🚀 Pipeline triggered...']));

    // Mark as harmonizing
    setEvaluations(prev => prev.map(e =>
      e.projectId === projectId ? { ...e, status: 'harmonizing' as const } : e
    ));

    try {
      // Use Server-Sent Events for real-time agent progress
      const eventSource = new EventSource(`/api/agents/harmonize/${projectId}/stream`);

      eventSource.addEventListener('pipeline_start', (e) => {
        const data = JSON.parse(e.data);
        setPipelineLogs(prev => {
          const logs = prev.get(projectId) || [];
          return new Map(prev).set(projectId, [...logs, `🆔 Trace ID: ${data.trace_id}`]);
        });
      });

      eventSource.addEventListener('agent_start', (e) => {
        const data = JSON.parse(e.data);
        setPipelineLogs(prev => {
          const logs = prev.get(projectId) || [];
          return new Map(prev).set(projectId, [...logs, `🤖 ${data.agent.toUpperCase()} starting...`]);
        });
      });

      eventSource.addEventListener('agent_complete', (e) => {
        const data = JSON.parse(e.data);
        setPipelineLogs(prev => {
          const logs = prev.get(projectId) || [];
          let detail = '';
          if (data.agent === 'scout') detail = ` (${data.result.status})`;
          if (data.agent === 'harmonizer') detail = ` (Q: ${data.result.quality_score}/10)`;
          if (data.agent === 'guardian') detail = ` [${data.result.verdict}]`;
          
          return new Map(prev).set(projectId, [...logs, `✅ ${data.agent.toUpperCase()} complete${detail}`]);
        });
      });

      eventSource.addEventListener('pipeline_complete', (e) => {
        const data = JSON.parse(e.data);
        const res = data.result;
        
        eventSource.close();
        setHarmonizingIds(prev => {
          const next = new Set(prev);
          next.delete(projectId);
          return next;
        });

        // Store verdict
        setVerdicts(prev => new Map(prev).set(projectId, {
          verdict: res.guardian_verdict,
          score: res.guardian_score,
          traceId: data.trace_id
        }));

        // Store result
        const harmResult: HarmonizationResult = {
          success: res.guardian_verdict !== 'REJECT',
          projectId,
          nameEn: res.name_en,
          descriptionEn: res.description_en,
          model: res.model,
          latencyMs: data.total_ms,
          error: res.guardian_verdict === 'REJECT' ? 'Rejected by Guardian Agent' : undefined
        };
        setResults(prev => new Map(prev).set(projectId, harmResult));

        if (harmResult.success) {
          // Update global state
          setHarmonizedResult({
            projectId,
            nameEn: res.name_en,
            descriptionEn: res.description_en,
            timestamp: Date.now(),
            model: res.model,
          });

          setEvaluations(prev => prev.map(e => {
            if (e.projectId !== projectId) return e;
            return {
              ...e,
              nameEn: res.name_en,
              descriptionEn: res.description_en,
              nameEnIsCopy: false,
              descriptionEnIsCopy: false,
              action: 'SKIP' as const,
              status: 'done' as const,
              qualityScore: res.quality_score > 0 ? res.quality_score : 8,
              problems: [],
            };
          }));
        } else {
          setEvaluations(prev => prev.map(e =>
            e.projectId === projectId ? { ...e, status: 'needs_full' as const } : e
          ));
          setError(`Guardian rejected project ${projectId}: ${res.guardian_issues.join(', ')}`);
        }
      });

      eventSource.onerror = (e) => {
        console.error('SSE Error:', e);
        eventSource.close();
        setHarmonizingIds(prev => {
          const next = new Set(prev);
          next.delete(projectId);
          return next;
        });
        setEvaluations(prev => prev.map(e =>
          e.projectId === projectId ? { ...e, status: 'needs_full' as const } : e
        ));
        setError(`Connection lost during harmonization for project ${projectId}`);
      };

    } catch (err) {
      setHarmonizingIds(prev => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
      setEvaluations(prev => prev.map(e =>
        e.projectId === projectId ? { ...e, status: 'needs_full' as const } : e
      ));
      setError(String(err));
    }
  }, [harmonizingIds, getEval]);

  // Harmonize all pending
  const handleHarmonizeAll = useCallback(async () => {
    const pending = evaluations.filter(
      e => e.status === 'needs_name' || e.status === 'needs_description' || e.status === 'needs_full'
    );
    for (const ev of pending) {
      await handleHarmonize(ev.projectId);
    }
  }, [evaluations, handleHarmonize]);

  // Filter and search
  const filtered = useMemo(() => {
    let list = evaluations;
    if (tabFilter !== 'all') {
      list = list.filter(e => e.status === tabFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.nameId.toLowerCase().includes(q) ||
        e.descriptionId.toLowerCase().includes(q) ||
        String(e.projectId).includes(q)
      );
    }
    return list;
  }, [evaluations, tabFilter, search]);

  const pendingCount = stats.needsNameCount + stats.needsDescriptionCount + stats.needsFullCount;

  return (
    <motion.main
      key="admin"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="pt-20 pb-6 md:pt-24 md:pb-8 px-4 sm:px-8 lg:px-16 bg-[#1B4D5C]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2 md:mb-3">
            <div className="bg-red-500/20 p-1.5 md:p-2 rounded-lg">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
            </div>
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px] md:text-xs">
              System Administration
            </Badge>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3">
            Harmonizer Console
          </h1>
          <p className="text-white/70 text-sm md:text-lg max-w-3xl leading-relaxed">
            Language evaluation pipeline — Monitor and standardize project content for international investors.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-8">
        {/* Stats Cards */}
        {/* Stats Cards - Horizontal Scroll on Mobile */}
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6 scrollbar-hide">
          <StatCard icon={BarChart3} label="Total" value={stats.totalProjects} color="text-[#1B4D5C]" bg="bg-[#1B4D5C]/10" />
          <StatCard icon={CheckCircle2} label="Ready (EN)" value={stats.readyCount} color="text-green-600" bg="bg-green-50" />
          <StatCard icon={AlertTriangle} label="Needs Name" value={stats.needsNameCount} color="text-amber-600" bg="bg-amber-50" />
          <StatCard icon={AlertTriangle} label="Needs Desc" value={stats.needsDescriptionCount} color="text-orange-600" bg="bg-orange-50" />
          <StatCard icon={XCircle} label="Needs Full" value={stats.needsFullCount} color="text-red-600" bg="bg-red-50" />
          <StatCard icon={Clock} label="In Progress" value={stats.harmonizingCount} color="text-purple-600" bg="bg-purple-50" />
        </div>

        {/* System Health Check */}
        <Card className="border-0 shadow-md mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#1B4D5C]" /> System Health
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={runHealthCheck} disabled={healthChecking} className="text-xs h-7">
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${healthChecking ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {/* LLM Connection */}
              <HealthItem
                icon={llmHealth?.available ? Wifi : WifiOff}
                label="LLM (Ollama)"
                value={llmHealth ? (llmHealth.available ? 'Online' : 'Offline') : 'Checking...'}
                sub={llmHealth ? `Model: ${llmHealth.model}` : undefined}
                color={llmHealth?.available ? 'text-green-600' : llmHealth ? 'text-red-500' : 'text-gray-400'}
              />

              {/* LLM Latency */}
              <HealthItem
                icon={Clock}
                label="LLM Latency"
                value={llmHealth ? `${llmHealth.latencyMs}ms` : '...'}
                sub="Response time"
                color={llmHealth ? (llmHealth.latencyMs < 2000 ? 'text-green-600' : 'text-amber-600') : 'text-gray-400'}
              />

              {/* Scout Agent */}
              <HealthItem
                icon={Search}
                label="Scout Agent"
                value="Online"
                sub="Language detection"
                color="text-green-600"
              />

              {/* Harmonizer Agent */}
              <HealthItem
                icon={Languages}
                label="Harmonizer"
                value="Ready"
                sub={llmHealth?.available ? 'LLM available' : 'LLM offline'}
                color={llmHealth?.available ? 'text-green-600' : 'text-amber-600'}
              />

              {/* Analyst Agent */}
              <HealthItem
                icon={Bot}
                label="Analyst Agent"
                value="Online"
                sub="Rule-based scoring"
                color="text-green-600"
              />

              {/* Data Source */}
              <HealthItem
                icon={Database}
                label="Data Sources"
                value={`${dataStats.totalProjects} projects`}
                sub={`${dataStats.pendingTranslations} need translation`}
                color={dataStats.pendingTranslations > 0 ? 'text-amber-600' : 'text-green-600'}
              />
            </div>

            {/* LLM Error Detail */}
            {llmHealth?.error && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">LLM Health Check Note</p>
                  <p className="text-amber-600">{llmHealth.error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Bar - Sticky on Mobile */}
        <div className="sticky top-14 md:top-16 z-30 bg-[#F5F3EF]/80 backdrop-blur-md -mx-4 px-4 md:mx-0 md:px-0 mb-6">
          <div className="bg-white rounded-xl shadow-md border p-3 md:p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#1B4D5C] flex items-center gap-2">
                  <Languages className="w-5 h-5" /> <span className="hidden sm:inline">Language Analysis</span>
                </h3>
                <div className="md:hidden flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="h-8 w-8 p-0"
                    title="Re-evaluate"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  className="pl-9 h-10"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="hidden md:flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" /> Re-evaluate
                </Button>
                {pendingCount > 0 && (
                  <Button
                    size="sm"
                    onClick={handleHarmonizeAll}
                    disabled={harmonizingIds.size > 0}
                    className="bg-[#1B4D5C] hover:bg-[#163a47] text-white flex items-center gap-1 shadow-sm"
                  >
                    {harmonizingIds.size > 0 ? (
                      <> <RefreshCw className="w-4 h-4 animate-spin" /> Harmonizing... </>
                    ) : (
                      <> <Play className="w-4 h-4" /> Harmonize All ({pendingCount}) </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Tab Filters */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
              {([
                { key: 'all', label: 'All', count: stats.totalProjects },
                { key: 'needs_full', label: 'Needs Full', count: stats.needsFullCount },
                { key: 'needs_name', label: 'Needs Name', count: stats.needsNameCount },
                { key: 'needs_description', label: 'Needs Desc', count: stats.needsDescriptionCount },
                { key: 'ready', label: 'Ready', count: stats.readyCount },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setTabFilter(tab.key as TabFilter)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                    tabFilter === tab.key
                      ? 'bg-[#1B4D5C] text-white shadow-sm scale-105'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Project Table / Cards */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#1B4D5C]" />
              Project Language Status
              <span className="text-sm font-normal text-gray-400">
                ({filtered.length} projects)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold text-[#1B4D5C] w-16">ID</th>
                    <th className="text-left p-3 font-semibold text-[#1B4D5C]">Name (ID)</th>
                    <th className="text-left p-3 font-semibold text-[#1B4D5C]">Name (EN)</th>
                    <th className="text-left p-3 font-semibold text-[#1B4D5C] w-24">Status</th>
                    <th className="text-left p-3 font-semibold text-[#1B4D5C] w-12">Q</th>
                    <th className="text-left p-3 font-semibold text-[#1B4D5C]">Problems</th>
                    <th className="text-center p-3 font-semibold text-[#1B4D5C] w-32">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map(ev => {
                    const result = results.get(ev.projectId);
                    const isHarmonizing = harmonizingIds.has(ev.projectId);
                    const project = realProjects.find(p => p.id === ev.projectId);

                    return (
                      <tr key={ev.projectId} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          {project ? (
                            <button
                              onClick={() => onProjectClick(project)}
                              className="font-mono text-xs text-[#1B4D5C] hover:text-[#C9963B] hover:underline flex items-center gap-1"
                              title="View project details"
                            >
                              #{ev.projectId} <ExternalLink className="w-3 h-3 opacity-50" />
                            </button>
                          ) : (
                            <span className="font-mono text-xs text-gray-500">#{ev.projectId}</span>
                          )}
                        </td>
                        <td className="p-3 max-w-[240px]">
                          {project ? (
                            <button
                              onClick={() => onProjectClick(project)}
                              className="text-left w-full hover:text-[#C9963B] transition-colors"
                              title="View project details"
                            >
                              <p className="truncate text-gray-800 font-medium hover:text-[#1B4D5C]">{ev.nameId}</p>
                            </button>
                          ) : (
                            <p className="truncate text-gray-800 font-medium">{ev.nameId}</p>
                          )}
                          <p className="text-xs text-gray-400 truncate mt-0.5">{ev.descriptionId?.slice(0, 60)}...</p>
                        </td>
                        <td className="p-3 max-w-[300px]">
                          {result?.success ? (
                            <div>
                              <p className="truncate text-green-700 font-medium">{result.nameEn}</p>
                              <p className="text-xs text-gray-400 truncate mt-0.5">{result.descriptionEn?.slice(0, 60)}...</p>
                              <p className="text-[10px] text-gray-300 mt-1">
                                LLM: {result.model} · {result.latencyMs}ms
                              </p>
                            </div>
                          ) : result?.error ? (
                            <div>
                              <span className="text-red-500 text-xs font-medium">Translation failed</span>
                              <p className="text-[10px] text-red-400 mt-0.5">{result.error}</p>
                              <p className="text-[10px] text-gray-300 mt-0.5">
                                LLM: {result.model} · {result.latencyMs}ms
                              </p>
                            </div>
                          ) : ev.nameEnIsCopy ? (
                            <span className="text-red-400 text-xs italic">Same as ID (copy)</span>
                          ) : (
                            <div>
                              <p className="truncate text-gray-600">{ev.nameEn}</p>
                              <p className="text-xs text-gray-400 truncate mt-0.5">{ev.descriptionEn?.slice(0, 60) || <span className="italic text-red-400">Empty</span>}</p>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <StatusBadge status={ev.status} isHarmonizing={isHarmonizing} />
                        </td>
                        <td className="p-3 font-mono text-xs">
                          <span className={ev.qualityScore >= 8 ? 'text-green-600' : ev.qualityScore >= 5 ? 'text-amber-600' : 'text-red-500'}>
                            {ev.qualityScore}/10
                          </span>
                        </td>
                        <td className="p-3 max-w-[260px]">
                          <div className="flex flex-wrap gap-1">
                            {isHarmonizing ? (
                              <div className="space-y-1 w-full">
                                {(pipelineLogs.get(ev.projectId) || []).slice(-2).map((log, i) => (
                                  <div key={i} className="text-[10px] text-purple-600 font-mono animate-pulse">
                                    {log}
                                  </div>
                                ))}
                              </div>
                            ) : ev.status === 'done' && verdicts.has(ev.projectId) ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <Badge className={`text-[9px] px-1 py-0 ${
                                    verdicts.get(ev.projectId)?.verdict === 'APPROVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {verdicts.get(ev.projectId)?.verdict}
                                  </Badge>
                                  <span className="text-[10px] text-gray-400">Score: {verdicts.get(ev.projectId)?.score}/10</span>
                                </div>
                                <a 
                                  href={`/api/agents/audit/${verdicts.get(ev.projectId)?.traceId}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[9px] text-[#1B4D5C] hover:underline flex items-center gap-0.5"
                                >
                                  <Info className="w-2.5 h-2.5" /> View Audit Trail
                                </a>
                              </div>
                            ) : ev.problems.length > 0 ? ev.problems.map((problem, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 border-red-200 text-red-600 bg-red-50 whitespace-normal text-left leading-tight"
                              >
                                {problem}
                              </Badge>
                            )) : (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> No issues
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {ev.status === 'done' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                          ) : isHarmonizing ? (
                            <RefreshCw className="w-5 h-5 text-purple-500 animate-spin mx-auto" />
                          ) : ev.status !== 'ready' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleHarmonize(ev.projectId)}
                              disabled={isHarmonizing}
                              className="text-xs h-8 flex items-center gap-1 border-[#1B4D5C] text-[#1B4D5C] hover:bg-[#1B4D5C] hover:text-white"
                            >
                              <Zap className="w-3 h-3" /> Harmonize
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Portrait Cards - Reimagined for Vertical Screens */}
            <div className="xl:hidden divide-y divide-gray-100">
              {filtered.slice(0, 100).map(ev => {
                const result = results.get(ev.projectId);
                const isHarmonizing = harmonizingIds.has(ev.projectId);
                const project = realProjects.find(p => p.id === ev.projectId);
                
                return (
                  <MobileProjectCard 
                    key={ev.projectId}
                    ev={ev}
                    result={result}
                    isHarmonizing={isHarmonizing}
                    project={project}
                    onProjectClick={onProjectClick}
                    onHarmonize={handleHarmonize}
                    pipelineLogs={pipelineLogs.get(ev.projectId) || []}
                    verdict={verdicts.get(ev.projectId)}
                  />
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <Globe className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No projects match this filter</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Architecture Reference */}
        <Card className="border-0 shadow-md mt-6">
          <CardContent className="p-5">
            <h3 className="font-bold text-[#1B4D5C] mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Harmonizer Pipeline (KG1 Architecture)
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <PipelineBadge label="1. Scout" desc="Language detection" color="bg-blue-50 text-blue-700 border-blue-200" />
              <span className="text-gray-300">→</span>
              <PipelineBadge label="2. Orchestrator" desc="Routing decision" color="bg-purple-50 text-purple-700 border-purple-200" />
              <span className="text-gray-300">→</span>
              <PipelineBadge label="3. Harmonizer" desc="ID→EN translation" color="bg-amber-50 text-amber-700 border-amber-200" />
              <span className="text-gray-300">→</span>
              <PipelineBadge label="4. Guardian" desc="Legal accuracy" color="bg-green-50 text-green-700 border-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button for Harmonize All on Mobile */}
      {pendingCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
          <Button
            size="lg"
            onClick={handleHarmonizeAll}
            disabled={harmonizingIds.size > 0}
            className="rounded-full w-14 h-14 bg-[#1B4D5C] hover:bg-[#163a47] text-white shadow-2xl flex items-center justify-center p-0 transition-transform active:scale-95"
          >
            {harmonizingIds.size > 0 ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <div className="relative">
                <Zap className="w-6 h-6 fill-current" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                  {pendingCount}
                </span>
              </div>
            )}
          </Button>
        </div>
      )}
    </motion.main>
  );
}

// ── Sub-components ──

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl p-3 text-center`}>
      <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
      <p className="text-2xl font-bold text-[#1C2A33]">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase font-semibold">{label}</p>
    </div>
  );
}

function StatusBadge({ status, isHarmonizing }: { status: LanguageEvaluation['status']; isHarmonizing?: boolean }) {
  if (isHarmonizing) {
    return <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px]"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Harmonizing</Badge>;
  }
  switch (status) {
    case 'ready': return <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">Ready</Badge>;
    case 'done': return <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">Done ✓</Badge>;
    case 'needs_name': return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Needs Name</Badge>;
    case 'needs_description': return <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px]">Needs Desc</Badge>;
    case 'needs_full': return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">Needs Full</Badge>;
    case 'harmonizing': return <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px]"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />In Progress</Badge>;
    default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

function PipelineBadge({ label, desc, color }: { label: string; desc: string; color: string }) {
  return (
    <div className={`px-3 py-1.5 rounded-lg border ${color} flex items-center gap-1.5`}>
      <span className="font-bold">{label}</span>
      <span className="opacity-60 hidden sm:inline">{desc}</span>
    </div>
  );
}

function HealthItem({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-2 md:p-3 border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${color}`} />
        <span className="text-[10px] md:text-xs font-semibold text-[#1C2A33] truncate">{label}</span>
      </div>
      <p className={`text-xs md:text-sm font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[9px] md:text-[10px] text-gray-400 mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

/**
 * Enhanced Mobile Project Card for Vertical Screens
 */
function MobileProjectCard({ 
  ev, 
  result, 
  isHarmonizing, 
  project, 
  onProjectClick, 
  onHarmonize,
  pipelineLogs,
  verdict
}: {
  ev: LanguageEvaluation;
  result?: HarmonizationResult;
  isHarmonizing: boolean;
  project?: Project;
  onProjectClick: (p: Project) => void;
  onHarmonize: (id: number) => void;
  pipelineLogs: string[];
  verdict?: { verdict: string; score: number; traceId: string };
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-4 hover:bg-gray-50/50 transition-colors">
      {/* Header: ID, Status, and Action */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {project ? (
            <button
              onClick={() => onProjectClick(project)}
              className="bg-gray-100 px-2 py-1 rounded font-mono text-[10px] text-[#1B4D5C] font-bold flex items-center gap-1"
            >
              #{ev.projectId}
            </button>
          ) : (
            <span className="bg-gray-100 px-2 py-1 rounded font-mono text-[10px] text-gray-500 font-bold">#{ev.projectId}</span>
          )}
          <StatusBadge status={ev.status} isHarmonizing={isHarmonizing} />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px]">
            <span className={ev.qualityScore >= 8 ? 'text-green-600' : ev.qualityScore >= 5 ? 'text-amber-600' : 'text-red-500'}>
              Q:{ev.qualityScore}/10
            </span>
          </span>
          {ev.status !== 'done' && !isHarmonizing && ev.status !== 'ready' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onHarmonize(ev.projectId)}
              className="h-7 px-2 text-[10px] border-[#1B4D5C] text-[#1B4D5C]"
            >
              <Zap className="w-3 h-3 mr-1" /> Harmonize
            </Button>
          )}
        </div>
      </div>

      {/* Main Content: ID vs EN */}
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[9px] px-1 py-0 border-gray-300 text-gray-500 bg-white">ID</Badge>
            {project ? (
              <button
                onClick={() => onProjectClick(project)}
                className="text-left font-medium text-xs text-gray-800 hover:text-[#1B4D5C] line-clamp-1"
              >
                {ev.nameId}
              </button>
            ) : (
              <p className="font-medium text-xs text-gray-800 line-clamp-1">{ev.nameId}</p>
            )}
          </div>
          <p className="text-[10px] text-gray-400 line-clamp-1 pl-6">{ev.descriptionId}</p>
        </div>

        <div className="bg-[#1B4D5C]/5 rounded-lg p-2 border border-[#1B4D5C]/10 space-y-1">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[9px] px-1 py-0 border-blue-200 text-blue-600 bg-blue-50">EN</Badge>
            {result?.success ? (
              <p className="font-bold text-xs text-green-700 line-clamp-1">{result.nameEn}</p>
            ) : result?.error ? (
              <p className="text-xs text-red-500 font-medium italic">Translation failed</p>
            ) : ev.nameEnIsCopy ? (
              <p className="text-xs text-amber-600 italic">Matches ID (Copy)</p>
            ) : (
              <p className="font-medium text-xs text-gray-700 line-clamp-1">{ev.nameEn || '—'}</p>
            )}
          </div>
          {result?.success ? (
            <p className="text-[10px] text-gray-500 line-clamp-1 pl-6">{result.descriptionEn}</p>
          ) : (
            <p className="text-[10px] text-gray-400 line-clamp-1 pl-6 italic">{ev.descriptionEn || 'No translation'}</p>
          )}
        </div>
      </div>

      {/* Expandable Footer: Logs, Problems, Verdict */}
      <div className="mt-3">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-1 text-[10px] text-gray-400 border-t border-dashed flex items-center justify-center gap-1 hover:text-gray-600"
        >
          {isExpanded ? 'Hide Details' : 'Show Details & Logs'}
          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-3">
                {/* Problems */}
                {ev.problems.length > 0 && !isHarmonizing && (
                  <div className="flex flex-wrap gap-1.5">
                    {ev.problems.map((problem, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 border-red-200 text-red-600 bg-red-50 leading-tight"
                      >
                        {problem}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Logs */}
                {isHarmonizing && pipelineLogs.length > 0 && (
                  <div className="bg-gray-900 rounded-lg p-2 font-mono text-[9px] text-green-400 space-y-1">
                    {pipelineLogs.slice(-4).map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="opacity-50">[{i}]</span>
                        <span className={i === pipelineLogs.length - 1 ? 'animate-pulse' : ''}>{log}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Verdict & Audit */}
                {ev.status === 'done' && verdict && (
                  <div className="bg-white border rounded-lg p-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[9px] px-1.5 py-0 ${
                        verdict.verdict === 'APPROVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {verdict.verdict}
                      </Badge>
                      <span className="text-[10px] text-gray-400">Score: {verdict.score}/10</span>
                    </div>
                    <a 
                      href={`/api/agents/audit/${verdict.traceId}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[9px] text-[#1B4D5C] font-bold flex items-center gap-0.5 hover:underline"
                    >
                      Audit Trail <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}

                {!isHarmonizing && ev.problems.length === 0 && ev.status !== 'done' && (
                  <p className="text-[10px] text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready for harmonization
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

