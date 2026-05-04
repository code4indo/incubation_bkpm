/**
 * ANALYSIS PAGE — Analyst Agent + PIR Zone Validator
 * MAS Architecture Component — BKPM AI Incubation for Public Sector
 * 
 * Displays comprehensive feasibility analysis powered by the Analyst Agent:
 * - Financial validation (IRR/NPV benchmark checks)
 * - PIR Zone validation (RTRW/KEK/Kawasan Industri overlay)
 * - Infrastructure gap analysis
 * - Risk flag calculation
 */

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AnalystReportPanel } from './AnalystReportPanel';
import { runAnalystAgent } from '@/lib/analystAgent';
import { runEnhancedAnalystAgent } from '@/lib/analystLLM';
import type { AnalystReport } from '@/lib/analystAgent';
import type { EnhancedAnalystReport } from '@/lib/analystLLM';
import type { Project } from '@/types';
import { projects } from '@/data/realData';
import { regions } from '@/data/mockData';
import { typedPorts as ports, typedAirports as airports } from '@/data/infrastructureData';
import { SuitabilityOverlayPanel } from './SuitabilityOverlayPanel';
import {
  Activity,
  FileSearch,
  BarChart3,
  Cpu,
  Sparkles,
  Bot,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';

export function AnalysisPage({ onProjectClick, onAnalysisComplete }: {
  onProjectClick: (project: Project) => void;
  onAnalysisComplete: (report: AnalystReport, enhanced: EnhancedAnalystReport | null) => void;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [report, setReport] = useState<AnalystReport | null>(null);
  const [enhancedReport, setEnhancedReport] = useState<EnhancedAnalystReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [useAI, setUseAI] = useState(true);
  // Default AI as available — will verify during actual analysis call
  const [llmHealth, setLlmHealth] = useState<{ available: boolean; model: string }>({ available: true, model: 'qwen2.5:14b' });
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analyst' | 'suitability'>('analyst');

  // Find selected project
  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find(p => p.id === Number(selectedProjectId)) || null;
  }, [selectedProjectId]);

  // Find matching region for the project
  const matchingRegion = useMemo(() => {
    if (!selectedProject) return null;
    return regions.find(r =>
      selectedProject.province.toLowerCase().includes(r.name.toLowerCase()) ||
      r.name.toLowerCase().includes(selectedProject.province.toLowerCase())
    ) || regions[0]; // Fallback to first region
  }, [selectedProject]);

  // Default AI as available — CORS prevents health check from browser, verify during actual call
  useEffect(() => {
    // Skip browser health check due to CORS — verify during actual analysis instead
    setLlmHealth({ available: true, model: 'qwen2.5:14b' });
  }, []);

  const handleRunAnalysis = async () => {
    if (!selectedProject || !matchingRegion) return;
    setIsAnalyzing(true);
    setEnhancedReport(null);
    setAiError(null);

    // Step 1: Rule-based analysis (always runs — fast & deterministic)
    const baseReport = runAnalystAgent(selectedProject, matchingRegion, ports, airports);
    setReport(baseReport);
    onAnalysisComplete(baseReport, null);

    // Step 2: LLM enhancement (if enabled)
    if (useAI) {
      try {
        const enhanced = await runEnhancedAnalystAgent(
          baseReport,
          selectedProject.nameEn || selectedProject.name,
          selectedProject.sector,
          selectedProject.province,
        );
        setEnhancedReport(enhanced);
        onAnalysisComplete(baseReport, enhanced);
        if (!enhanced.llmSuccess) {
          setAiError('AI enhancement unavailable (CORS/network). Showing rule-based analysis only.');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[AnalysisPage] LLM enhancement failed:', msg);
        setAiError(`AI unavailable: ${msg}. Rule-based analysis shown.`);
        setLlmHealth({ available: false, model: 'none' });
      }
    }

    setIsAnalyzing(false);
  };

  // Get pre-analyzed projects for dropdown (translated projects first)
  const analyzedProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => (b.hasTranslation ? 1 : 0) - (a.hasTranslation ? 1 : 0));
  }, []);

  return (
    <motion.main
      key="analysis"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="pt-24 pb-12 px-4 sm:px-8 lg:px-16 bg-[#1B4D5C]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#C9963B]/20 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-[#C9963B]" />
            </div>
            <Badge className="bg-[#C9963B]/20 text-[#C9963B] border-[#C9963B]/30">
              <Cpu className="w-3 h-3 mr-1" /> MAS Agent
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Analyst Agent & PIR Zone Validator
          </h1>
          <p className="text-white/80 text-lg max-w-3xl">
            AI-powered feasibility analysis, financial validation, zone alignment scoring,
            infrastructure gap detection, and risk flag identification.
          </p>
        </div>
      </div>

      {/* Analysis Pipeline Steps */}
      <div className="py-6 px-4 sm:px-8 lg:px-16 bg-white border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {[
              { step: '1', label: 'Select Project', icon: FileSearch, active: !selectedProject },
              { step: '2', label: 'Run Analysis', icon: BarChart3, active: !!selectedProject && !report },
              { step: '3', label: 'View Report', icon: Sparkles, active: !!report },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${item.active ? 'bg-[#1B4D5C] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className={`text-sm font-medium ${item.active ? 'text-[#1B4D5C]' : 'text-gray-400'}`}>
                  {item.label}
                </span>
                {i < 2 && <div className="w-8 h-px bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('analyst')}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'analyst'
                ? 'bg-[#1B4D5C] text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Analyst Report
          </button>
          <button
            onClick={() => setActiveTab('suitability')}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'suitability'
                ? 'bg-[#1B4D5C] text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Suitability Overlay GIS
          </button>
        </div>

        {/* Suitability Tab */}
        {activeTab === 'suitability' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <SuitabilityOverlayPanel />
          </motion.div>
        )}
        {/* Analyst Tab Content */}
        {activeTab === 'analyst' && (
          <>
            {/* Project Selector */}
            <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="text-sm font-semibold text-[#1C2A33] mb-2 block">
                  Select Investment Project
                </label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="py-6">
                    <SelectValue placeholder="Choose a project to analyze..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {analyzedProjects.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        <div className="flex items-center gap-2">
                          <span className="truncate">{p.nameEn || p.name}</span>
                          {p.hasTranslation && (
                            <Badge className="bg-[#27AE60]/10 text-[#27AE60] border-0 text-[9px]">
                              EN
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="lg"
                  className="bg-[#1B4D5C] hover:bg-[#163a47] text-white px-8 py-6"
                  disabled={!selectedProject || isAnalyzing}
                  onClick={handleRunAnalysis}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      {useAI && llmHealth.available ? 'AI Analyzing...' : 'Analyzing...'}
                    </>
                  ) : (
                    <>
                      {useAI && llmHealth.available ? <Sparkles className="w-5 h-5 mr-2" /> : <Activity className="w-5 h-5 mr-2" />}
                      {useAI && llmHealth.available ? 'Run AI Analysis' : 'Run Analysis'}
                    </>
                  )}
                </Button>
                {/* AI Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUseAI(!useAI)}
                    disabled={!llmHealth.available}
                    className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-colors ${
                      useAI && llmHealth.available
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : 'bg-gray-100 text-gray-400 border-gray-200'
                    }`}
                  >
                    <Bot className="w-3 h-3" />
                    {llmHealth.available ? (useAI ? 'AI ON' : 'AI OFF') : 'AI Unavailable'}
                  </button>
                  {aiError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      {aiError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Project Preview */}
            {selectedProject && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-gray-50 rounded-lg flex flex-wrap gap-4"
              >
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Project</p>
                  <p className="text-sm font-semibold text-[#1C2A33]">{selectedProject.nameEn || selectedProject.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Sector</p>
                  <p className="text-sm text-gray-700">{selectedProject.sector}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Location</p>
                  <p className="text-sm text-gray-700">{selectedProject.location}, {selectedProject.province}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Investment</p>
                  <p className="text-sm text-gray-700">Rp {(selectedProject.investmentValue / 1000).toFixed(1)}T</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">IRR</p>
                  <p className="text-sm text-gray-700">{selectedProject.irr}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Region Match</p>
                  <p className="text-sm text-gray-700">{matchingRegion?.name || 'N/A'}</p>
                </div>
                <div className="flex items-end ml-auto">
                  <button
                    onClick={() => onProjectClick(selectedProject)}
                    className="flex items-center gap-1 text-sm font-semibold text-[#1B4D5C] hover:text-[#C9963B] transition-colors py-1 px-2 rounded hover:bg-[#1B4D5C]/10"
                  >
                    Full Details <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Analyst Report */}
        <AnalystReportPanel report={report} enhancedReport={enhancedReport} />
        </>
      )}
      </div>
    </motion.main>
  );
}
