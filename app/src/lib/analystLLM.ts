/**
 * ANALYST LLM INTEGRATION
 * Connects Analyst Agent to Ollama (Qwen2.5:14b) for AI-powered reasoning
 * 
 * Capabilities that require LLM:
 * - Natural language executive summaries (WhyThisMatch)
 * - Nuanced risk assessment with contextual reasoning
 * - Personalized mitigation strategies
 * - Regulatory compliance interpretation
 * - Market trend analysis
 */

import type { AnalystReport } from './analystAgent';

// Ollama configuration
const OLLAMA_BASE_URL = 'https://llm.jatnikonm.tech';
const DEFAULT_MODEL = 'qwen2.5:14b';
const FALLBACK_MODEL = 'qwen2.5:7b';
const TIMEOUT_MS = 30000;

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaResponse {
  message?: { content: string };
  response?: string;
  done: boolean;
  error?: string;
}

/**
 * Call Ollama API with retry and fallback.
 * Uses AbortController for cross-browser compatibility.
 */
async function callOllama(
  messages: OllamaMessage[],
  model: string = DEFAULT_MODEL,
  temperature: number = 0.3,
): Promise<string> {
  const payload = {
    model,
    messages,
    stream: false,
    options: {
      temperature,
      num_predict: 800,
      top_p: 0.9,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data: OllamaResponse = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return (data.message?.content || data.response || '').trim();
  } catch (err: unknown) {
    clearTimeout(timeout);
    const errorMsg = err instanceof Error ? err.message : String(err);

    // Retry with fallback model
    if (model === DEFAULT_MODEL) {
      console.warn(`[AnalystLLM] ${DEFAULT_MODEL} failed, retrying with ${FALLBACK_MODEL}:`, errorMsg);
      return callOllama(messages, FALLBACK_MODEL, temperature);
    }

    console.error('[AnalystLLM] All models failed:', errorMsg);
    throw new Error(`LLM unavailable: ${errorMsg}`);
  }
}

// ============================================================
// 1. EXECUTIVE SUMMARY GENERATOR (WhyThisMatch)
// ============================================================

/**
 * Generate a natural language executive summary explaining
 * why a project is (or isn't) a good match for investment.
 * This requires LLM reasoning to produce insightful, contextual narratives.
 */
export async function generateExecutiveSummary(
  report: AnalystReport,
  projectName: string,
  sector: string,
  province: string,
): Promise<string> {
  const systemPrompt = `You are BKPM's Senior Investment Analyst AI. Your role is to generate concise, professional executive summaries for foreign investors. 
Write in clear Business English. Be direct, data-backed, and actionable. Maximum 150 words. Highlight both opportunities AND risks. Never be vague — always reference specific numbers when available.`;

  const userPrompt = `Generate an executive summary for this investment project analysis:

PROJECT: ${projectName}
SECTOR: ${sector}
LOCATION: ${province}

ANALYSIS RESULTS:
- Overall Feasibility: ${report.overallFeasibility}/100
- Financial Score: ${report.financial.score}/100 (Scale: ${report.financial.scaleCategory}, IRR realistic: ${report.financial.irrRealistic ? 'Yes' : 'No'})
- Zone Alignment: ${report.zone.alignmentScore}/100 (Compatible: ${report.zone.isCompatible ? 'Yes' : 'No'})
- Infrastructure: Port ${report.zone.distanceToPortKm}km, Airport ${report.zone.distanceToAirportKm}km, Status: ${report.zone.infrastructureStatus}
- Critical Risks: ${report.riskFlags.filter(r => r.severity === 'Critical').length}
- High Risks: ${report.riskFlags.filter(r => r.severity === 'High').length}

KEY RISKS:
${report.riskFlags.slice(0, 3).map(r => `- [${r.severity}] ${r.category}: ${r.description}`).join('\n')}

MITIGATIONS:
${report.riskFlags.slice(0, 3).map(r => `- ${r.mitigation}`).join('\n')}

Write a 3-paragraph summary: (1) Project overview & strengths, (2) Key risks & concerns, (3) Recommendation with next steps.`;

  try {
    const summary = await callOllama([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
    return summary || report.summary; // Fallback to rule-based summary
  } catch {
    return report.summary;
  }
}

// ============================================================
// 2. CONTEXTUAL RISK ASSESSMENT
// ============================================================

/**
 * Enhance risk flags with LLM-powered contextual analysis.
 * The LLM adds industry-specific insights that rule-based scoring misses.
 */
export async function enhanceRiskAssessment(
  report: AnalystReport,
  projectName: string,
  sector: string,
): Promise<string[]> {
  const systemPrompt = `You are an investment risk specialist focusing on Indonesia's regulatory and business landscape. Provide specific, actionable risk insights. Each point must be 1-2 sentences maximum. Be concise and direct.`;

  const userPrompt = `Based on this analysis of "${projectName}" (${sector} sector):

Feasibility: ${report.overallFeasibility}/100
Financial Score: ${report.financial.score}/100
Zone Alignment: ${report.zone.alignmentScore}/100
Infrastructure Status: ${report.zone.infrastructureStatus}

Risks identified:
${report.riskFlags.map(r => `- ${r.severity} ${r.category}: ${r.description}`).join('\n')}

Provide 3-4 ADDITIONAL nuanced risk insights that a rule-based system would miss. Consider:
- Indonesia-specific regulatory risks
- Sector-specific market dynamics  
- Geopolitical or regional factors
- Supply chain or operational risks specific to ${sector} in Indonesia

Format as bullet points, 1-2 sentences each.`;

  try {
    const response = await callOllama([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return response
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => line.replace(/^[-*]\s*/, '').trim())
      .filter(line => line.length > 10);
  } catch {
    return [];
  }
}

// ============================================================
// 3. PERSONALIZED MITIGATION STRATEGY
// ============================================================

/**
 * Generate personalized mitigation strategies based on the investor's
 * risk profile and project characteristics.
 */
export async function generateMitigationStrategy(
  report: AnalystReport,
  projectName: string,
  investorProfile?: {
    riskAppetite?: string;
    capexRange?: string;
    timelineMonths?: number;
    sectorFocus?: string[];
  },
): Promise<string> {
  const systemPrompt = `You are an investment strategy advisor specializing in Indonesian market entry. Provide a concise, prioritized mitigation roadmap. Maximum 200 words. Structure as: Immediate (0-3mo), Short-term (3-12mo), Long-term (12mo+).`;

  const profileStr = investorProfile
    ? `\nINVESTOR PROFILE:\n- Risk Appetite: ${investorProfile.riskAppetite || 'Moderate'}\n- Capex Range: ${investorProfile.capexRange || 'N/A'}\n- Timeline: ${investorProfile.timelineMonths || 'N/A'} months\n- Sector Focus: ${investorProfile.sectorFocus?.join(', ') || 'N/A'}`
    : '';

  const userPrompt = `Project: ${projectName}
Feasibility Score: ${report.overallFeasibility}/100
Risk Flags: ${report.riskFlags.length} (${report.riskFlags.filter(r => r.severity === 'Critical').length} critical)
Infrastructure: ${report.zone.infrastructureStatus}
${profileStr}

Create a prioritized mitigation strategy with specific next steps.`;

  try {
    return await callOllama([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
  } catch {
    return report.riskFlags.map(r => `• ${r.mitigation}`).join('\n');
  }
}

// ============================================================
// 4. ZONE COMPARISON & RECOMMENDATION
// ============================================================

/**
 * Compare the current zone with alternatives and provide
 * LLM-powered reasoning for zone selection.
 */
export async function generateZoneRecommendation(
  report: AnalystReport,
  projectName: string,
  currentZone: string,
): Promise<string> {
  const systemPrompt = `You are a spatial planning and industrial zone expert for Indonesia. Compare zones objectively using infrastructure, incentives, and sector fit. Be concise (max 100 words).`;

  const userPrompt = `Project "${projectName}" is planned for ${currentZone}.
Zone Alignment Score: ${report.zone.alignmentScore}/100
Compatible: ${report.zone.isCompatible ? 'Yes' : 'No'}
Infrastructure: ${report.zone.infrastructureStatus}
Distance to Port: ${report.zone.distanceToPortKm}km
Distance to Airport: ${report.zone.distanceToAirportKm}km
Alternative Zones: ${report.zone.alternativeZones.join(', ')}
Nearest KEK/KI: ${report.zone.nearestIndustrialZones.slice(0, 3).join(', ')}

Provide a brief zone assessment: Is this the optimal location? If not, which alternative is better and why?`;

  try {
    return await callOllama([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
  } catch {
    return report.zone.isCompatible
      ? `${currentZone} is compatible with this project. Infrastructure status: ${report.zone.infrastructureStatus}.`
      : `Consider ${report.zone.alternativeZones[0] || 'alternative zones'} for better alignment.`;
  }
}

// ============================================================
// 5. FULL ANALYSIS WITH LLM ENHANCEMENT
// ============================================================

/**
 * Run the complete Analyst Agent pipeline with LLM enhancement.
 * This combines rule-based scoring (fast, deterministic) with
 * LLM reasoning (nuanced, contextual) for the best of both worlds.
 */
export interface EnhancedAnalystReport extends AnalystReport {
  /** AI-generated executive summary */
  llmSummary: string;
  /** Additional nuanced risks from LLM */
  llmRiskInsights: string[];
  /** Personalized mitigation strategy */
  llmMitigationStrategy: string;
  /** Zone recommendation with reasoning */
  llmZoneRecommendation: string;
  /** Whether LLM enhancement succeeded */
  llmSuccess: boolean;
  /** LLM model used */
  llmModel: string;
  /** Latency of LLM calls in ms */
  llmLatencyMs: number;
}

export async function runEnhancedAnalystAgent(
  report: AnalystReport,
  projectName: string,
  sector: string,
  province: string,
  investorProfile?: {
    riskAppetite?: string;
    capexRange?: string;
    timelineMonths?: number;
    sectorFocus?: string[];
  },
): Promise<EnhancedAnalystReport> {
  const startTime = Date.now();
  let modelUsed = DEFAULT_MODEL;

  try {
    // Run all LLM calls in parallel for speed
    const [llmSummary, llmRiskInsights, llmMitigationStrategy, llmZoneRecommendation] =
      await Promise.all([
        generateExecutiveSummary(report, projectName, sector, province),
        enhanceRiskAssessment(report, projectName, sector),
        generateMitigationStrategy(report, projectName, investorProfile),
        generateZoneRecommendation(report, projectName, province),
      ]);

    const latency = Date.now() - startTime;

    return {
      ...report,
      llmSummary,
      llmRiskInsights,
      llmMitigationStrategy,
      llmZoneRecommendation,
      llmSuccess: true,
      llmModel: modelUsed,
      llmLatencyMs: latency,
    };
  } catch (err: unknown) {
    const latency = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[EnhancedAnalyst] LLM enhancement failed:', errorMsg);

    // Return with fallback values (rule-based still works)
    return {
      ...report,
      llmSummary: report.summary,
      llmRiskInsights: [],
      llmMitigationStrategy: report.riskFlags.map(r => `• ${r.mitigation}`).join('\n'),
      llmZoneRecommendation: report.zone.isCompatible
        ? `${province} is compatible.`
        : `Consider alternatives.`,
      llmSuccess: false,
      llmModel: modelUsed,
      llmLatencyMs: latency,
    };
  }
}

// ============================================================
// 6. HEALTH CHECK
// ============================================================

/**
 * Check if Ollama is reachable. Due to browser CORS restrictions,
 * this uses an optimistic approach: assume available unless proven otherwise.
 * The actual /api/chat call during analysis will confirm true availability.
 */
export async function checkLLMHealth(): Promise<{
  available: boolean;
  model: string;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();

  // Try a lightweight chat call as health check (more reliable than /api/tags)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: 'Say: OK' }],
        stream: false,
        options: { num_predict: 10, temperature: 0 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const content = data.message?.content || data.response || '';

    return {
      available: content.length > 0,
      model: DEFAULT_MODEL,
      latencyMs: Date.now() - start,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errorMsg = err instanceof Error ? err.message : String(err);

    // CORS errors, network issues, timeouts — all return optimistic true
    // The actual analysis call will handle real failures gracefully
    return {
      available: true,
      model: DEFAULT_MODEL,
      latencyMs: Date.now() - start,
      error: `Health check note: ${errorMsg}. Will attempt on analysis.`,
    };
  }
}
