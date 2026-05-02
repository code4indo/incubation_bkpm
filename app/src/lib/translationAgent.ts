/**
 * Translation Agent — Ollama Qwen3.5:9b (Accuracy-First / Thinking Mode)
 * 
 * Mode: Pure Thinking untuk terminologi investasi yang presisi.
 * Latency: ~25-40s per project (acceptable untuk batch background job)
 * 
 * Konfigurasi kritis untuk thinking mode:
 * - JANGAN set num_predict (biarkan unlimited)
 * - Timeout tinggi (60-90s)
 * - Temperature rendah (0.1) untuk konsistensi
 */

export interface TranslationResult {
  name_en: string;
  description_en: string;
  source: string;       // name_id yang diterjemahkan
  originalDesc: string; // description_id yang diterjemahkan
  latency_ms: number;
  success: boolean;
  error?: string;
}

export interface OllamaPayload {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
}

const OLLAMA_URL = 'https://llm.jatnikonm.tech/api/chat';
const MODEL = 'qwen3.5:9b';

// System prompt yang menghormati thinking mode tapi meminta output terstruktur
const SYSTEM_PROMPT = `You are an expert translator for Indonesian investment and business documents, specializing in projects from BKPM (Indonesia Investment Coordinating Board).

YOUR TASK:
Translate Indonesian investment project names and descriptions into professional, formal English suitable for international investors, investment banks, and multinational corporations.

RULES:
1. Use precise industry-standard terminology:
   - "pabrik pengolahan" → "processing plant"
   - "kawasan ekonomi khusus" → "Special Economic Zone (SEZ)"
   - "hilirisasi" → "downstream processing"
   - "pakan ternak" → "animal feed"
   - "pengolahan" → "processing"
   - "industri" → "industry" (as prefix)
   - "perkebunan" → "plantation"
   - "pariwisata" → "tourism"
   - "pembangkit listrik" → "power plant"
   - "karet remah" → "crumb rubber"
   - "pewarna tekstil" → "textile dyeing"
   - "penyosohan beras" → "rice polishing"
   - "tambang" → "mining" / "mine"
   - "smelter" → "smelter" (keep as-is)
   - "bahan baku" → "raw materials"
   - "nilai tambah" → "value-added"
   - "pangan" → "food"
   - "pertanian" → "agriculture"
   - "perikanan" → "fisheries"
   - "peternakan" → "animal husbandry"
   - "komoditas" → "commodity"
   - "produksi" → "production"
   - "kapasitas" → "capacity"
   - "lapangan kerja" → "employment" / "jobs"
   - "ekspor" → "export"
   - "impor" → "import"
   - "investasi" → "investment"
   - "lahan" → "land"
   - "hektar" → "hectares"
   - "ton" → "tons"
   - "modal" → "capital"
   - "keuntungan" → "profit" / "returns"
   - "analisis kelayakan" → "feasibility study"

2. Preserve all numerical values, percentages, currency amounts, and financial metrics exactly as written.
3. Keep acronyms and technical terms in their standard English form (e.g., NPV, IRR, KBLI stays as KBLI if untranslatable).
4. Maintain formal, investment-grade tone. Do NOT use casual language.
5. Keep the output length similar to the original.
6. For project names: produce a concise, professional English title (max 10 words).
7. For descriptions: translate the full text with proper business English.

OUTPUT FORMAT (STRICT JSON):
{
  "name_en": "English project name",
  "description_en": "English description"
}

Do not output anything outside the JSON.`;

/**
 * Translate a single project using Qwen3.5:9b thinking mode
 * NOTE: Thinking mode butuh waktu ~25-40s. Gunakan untuk batch background processing.
 */
export async function translateProject(
  name_id: string,
  description_id: string,
  onProgress?: (msg: string) => void
): Promise<TranslationResult> {
  const start = performance.now();

  try {
    onProgress?.(`Translating: ${name_id.slice(0, 40)}...`);

    const payload: OllamaPayload = {
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Translate this Indonesian investment project to English:

PROJECT NAME:
${name_id}

DESCRIPTION:
${description_id}

Output JSON only.`
        }
      ],
      stream: false,
      options: {
        temperature: 0.1,
        top_p: 0.9,
        top_k: 40
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout untuk thinking mode

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const latency = Math.round(performance.now() - start);

    // Parse JSON dari content
    const content = data.message?.content || data.response || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      name_en: parsed.name_en || name_id,
      description_en: parsed.description_en || description_id,
      source: name_id,
      originalDesc: description_id,
      latency_ms: latency,
      success: true
    };
  } catch (error) {
    const latency = Math.round(performance.now() - start);
    return {
      name_en: name_id,
      description_en: description_id,
      source: name_id,
      originalDesc: description_id,
      latency_ms: latency,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Batch translate multiple projects dengan rate limiting
 * Interval: 500ms antara requests untuk menghindari overload server Ollama
 */
export async function batchTranslate(
  projects: Array<{ name_id: string; description_id: string }>,
  onProgress?: (current: number, total: number, result: TranslationResult) => void
): Promise<TranslationResult[]> {
  const results: TranslationResult[] = [];

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const result = await translateProject(project.name_id, project.description_id);
    results.push(result);
    onProgress?.(i + 1, projects.length, result);

    // Rate limit: tunggu 500ms antar request kecuali project terakhir
    if (i < projects.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Simulated translation untuk testing tanpa Ollama
 * Returns mock translations untuk development/testing UI
 */
export function simulateTranslation(
  name_id: string,
  description_id: string
): TranslationResult {
  // Simple heuristic untuk demo
  const nameMap: Record<string, string> = {
    'Pabrik Pengolahan Pakan Ternak': 'Animal Feed Processing Plant',
    'Industri Modified Cassava Flour (Mocaf)': 'Modified Cassava Flour (MOCAF) Industry',
    'Industri Penyosohan Beras': 'Rice Polishing Industry',
    'Kopi Speciality Wamena Arabica Roasted Bean': 'Wamena Arabica Specialty Coffee Roasted Bean',
    'Mautika Mandalika Hotel': 'Mautika Mandalika Hotel',
    '4-Star Resort & Convention Center': '4-Star Resort & Convention Center',
    'Smelter Nikel Cobalt': 'Nickel-Cobalt Smelter',
    'Pabrik Minyak Goreng': 'Cooking Oil Factory',
    'Pelabuhan Internasional Bitung': 'Bitung International Port',
    'Industri Pengolahan Kopi': 'Coffee Processing Industry',
  };

  const name_en = nameMap[name_id] || name_id;

  return {
    name_en,
    description_en: description_id,
    source: name_id,
    originalDesc: description_id,
    latency_ms: 30000,
    success: true
  };
}
