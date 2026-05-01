/**
 * AI ARCHITECTURE CONFIGURATION
 * 
 * NVIDIA Build Platform Stack — Optimized for 32GB GPU Self-Hosted Deployment
 * 
 * Target Infrastructure:
 *   • GPU: NVIDIA RTX A100 32GB / RTX 4090 24GB (with offloading) / A6000 48GB
 *   • CPU: 16+ cores
 *   • RAM: 64GB+
 *   • Storage: NVMe SSD 500GB+
 * 
 * Model Sources: build.nvidia.com (all Apache 2.0 or NVIDIA Open License)
 */

// ============================================================================
// STACK DEFINITION
// ============================================================================

export interface AIModelConfig {
  name: string;
  buildId: string;              // NVIDIA Build model ID
  params: string;               // "1B" | "8B" | "122B" | "300M"
  vramGB: number;               // VRAM usage in 4-bit quantization
  vramGBFp16: number;           // VRAM usage in FP16 (for reference)
  contextTokens: number;
  languages: string[];
  license: string;
  useCase: string;
  quantization: 'int4' | 'int8' | 'fp16';
  backend: 'vLLM' | 'TGI' | 'llama.cpp' | 'TensorRT-LLM';
  deploymentNotes: string;
}

export interface AIStackConfig {
  stackName: string;
  targetGpuVRAM: number;
  models: {
    embedder: AIModelConfig;
    reranker: AIModelConfig;
    generator: AIModelConfig;
    ocr: AIModelConfig;
    guardrails?: AIModelConfig;
  };
  totalVramUsed: number;
  vramHeadroom: number;
  framework: string;
  deploymentType: 'docker' | 'kubernetes' | 'bare-metal';
}

// ============================================================================
// INDIVIDUAL MODEL CONFIGS
// ============================================================================

export const NEMOTRON_EMBED_1B: AIModelConfig = {
  name: 'llama-nemotron-embed-1b-v2',
  buildId: 'nvidia/llama-nemotron-embed-1b-v2',
  params: '1B',
  vramGB: 0.5,
  vramGBFp16: 2.0,
  contextTokens: 8192,
  languages: [
    'English', 'Indonesian', 'German', 'Spanish', 'French', 'Italian', 
    'Japanese', 'Korean', 'Portuguese', 'Russian', 'Chinese', 'Arabic',
    'Czech', 'Dutch', 'Greek', 'Hebrew', 'Hindi', 'Polish', 'Thai', 'Turkish', 'Vietnamese'
  ],
  license: 'NVIDIA Open Model License',
  useCase: 'Cross-lingual document embedding for RAG retrieval',
  quantization: 'int4',
  backend: 'TensorRT-LLM',
  deploymentNotes: 'Matryoshka embeddings reduce storage 35x. Use for vectorizing Perda/AMDAL documents AS-IS in Indonesian.',
};

export const LLAMA_RERANK_1B: AIModelConfig = {
  name: 'llama-3.2-nv-rerankqa-1b-v2',
  buildId: 'nvidia/llama-3.2-nv-rerankqa-1b-v2',
  params: '1B',
  vramGB: 0.5,
  vramGBFp16: 2.0,
  contextTokens: 8192,
  languages: ['English', 'Indonesian', 'Multilingual'],
  license: 'NVIDIA Open Model License',
  useCase: 'Second-stage reranking for legal document retrieval precision',
  quantization: 'int4',
  backend: 'TensorRT-LLM',
  deploymentNotes: 'Cross-encoder architecture. Re-scores top-200 candidates from embedder to top-5 with legal-grade precision.',
};

export const QWEN_122B_A10B: AIModelConfig = {
  name: 'qwen3.5-122b-a10b',
  buildId: 'qwen/qwen3.5-122b-a10b',
  params: '122B (MoE, 10B active)',
  vramGB: 22.0,
  vramGBFp16: 45.0, // Would need 2x GPU or offloading
  contextTokens: 128000,
  languages: [
    'English', 'Indonesian', 'Chinese', 'Japanese', 'Korean', 'German', 
    'French', 'Spanish', 'Italian', 'Russian', 'Arabic', 'Hindi', 'Vietnamese', 'Thai', 'Portuguese'
  ],
  license: 'Apache 2.0',
  useCase: 'Multilingual legal reasoning and generation — reads Indonesian Perda, answers in English',
  quantization: 'int4',
  backend: 'vLLM', // vLLM has best MoE support
  deploymentNotes: `CRITICAL: MoE architecture — only 10B params active per token. 
    • Full model: 122B total, ~61GB in int4 (all experts)
    • Active inference: 10B + selected experts = ~22GB
    • Requires vLLM 0.6.0+ with MoE routing support
    • KV cache: reserve 6-8GB for 32K context
    • If VRAM tight: use --max-model-len 65536 to reduce KV`,
};

export const NEMOTRON_OCR_1B: AIModelConfig = {
  name: 'nemotron-ocr-v1',
  buildId: 'nvidia/nemotron-ocr-v1',
  params: '1B',
  vramGB: 1.0,
  vramGBFp16: 2.5,
  contextTokens: 4096,
  languages: ['English', 'Indonesian', 'Multilingual'],
  license: 'NVIDIA Open Model License',
  useCase: 'OCR for scanned Perda PDFs, AMDAL documents, and RTRW maps',
  quantization: 'int4',
  backend: 'TensorRT-LLM',
  deploymentNotes: 'Processes PDF scans and images → structured text. Extracts tables, headers, and legal hierarchy.',
};

export const NEMOTRON_GUARD_8B: AIModelConfig = {
  name: 'nemotron-3-safety-guard-8b',
  buildId: 'nvidia/nemotron-3-safety-guard-8b',
  params: '8B',
  vramGB: 4.0,
  vramGBFp16: 16.0,
  contextTokens: 8192,
  languages: ['English', 'Multilingual'],
  license: 'NVIDIA Open Model License',
  useCase: 'Safety guardrails — prevents legal misinformation and harmful investment advice',
  quantization: 'int4',
  backend: 'TensorRT-LLM',
  deploymentNotes: 'Optional component. Filters LLM output for legal accuracy. Can run on CPU if GPU tight.',
};

// ============================================================================
// FULL STACK CONFIGS FOR DIFFERENT GPU SIZES
// ============================================================================

export const STACK_32GB: AIStackConfig = {
  stackName: 'NVIDIA Build — BKPM Legal RAG Stack (32GB)',
  targetGpuVRAM: 32,
  models: {
    embedder: NEMOTRON_EMBED_1B,
    reranker: LLAMA_RERANK_1B,
    generator: QWEN_122B_A10B,
    ocr: NEMOTRON_OCR_1B,
    guardrails: NEMOTRON_GUARD_8B,
  },
  totalVramUsed: 28.0, // 0.5 + 0.5 + 22 + 1 + 4
  vramHeadroom: 4.0,    // 32 - 28 = 4GB for KV cache & spikes
  framework: 'vLLM + TensorRT-LLM + LangChain',
  deploymentType: 'docker',
};

export const STACK_24GB: AIStackConfig = {
  stackName: 'NVIDIA Build — BKPM Legal RAG Stack (24GB fallback)',
  targetGpuVRAM: 24,
  models: {
    embedder: NEMOTRON_EMBED_1B,
    reranker: LLAMA_RERANK_1B,
    generator: QWEN_122B_A10B, // Same, but with reduced KV cache
    ocr: NEMOTRON_OCR_1B,
    // Guardrails omitted — run on CPU or omit
  },
  totalVramUsed: 24.0,
  vramHeadroom: 0, // Tight — need --max-model-len 32768
  framework: 'vLLM + LangChain',
  deploymentType: 'docker',
};

// ============================================================================
// DEPLOYMENT COMMANDS (Reference)
// ============================================================================

export const DEPLOYMENT_COMMANDS = {
  dockerCompose: `
# docker-compose.yml — 32GB GPU Deployment
version: '3.8'
services:
  vllm-generator:
    image: vllm/vllm-openai:v0.6.0
    command: >
      --model qwen/Qwen3.5-122B-A10B
      --quantization awq
      --tensor-parallel-size 1
      --max-model-len 65536
      --gpu-memory-utilization 0.85
      --enable-prefix-caching
      --port 8000
    runtime: nvidia
    environment:
      - CUDA_VISIBLE_DEVICES=0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    ports:
      - "8000:8000"

  trt-embedder:
    image: nvcr.io/nvidia/tritonserver:24.08-py3
    command: tritonserver --model-repository=/models
    volumes:
      - ./models/nemotron-embed-1b:/models/embed:ro
    runtime: nvidia
    ports:
      - "8001:8001"

  trt-reranker:
    image: nvcr.io/nvidia/tritonserver:24.08-py3
    command: tritonserver --model-repository=/models
    volumes:
      - ./models/llama-rerankqa-1b:/models/rerank:ro
    runtime: nvidia
    ports:
      - "8002:8001"

  trt-ocr:
    image: nvcr.io/nvidia/tritonserver:24.08-py3
    command: tritonserver --model-repository=/models
    volumes:
      - ./models/nemotron-ocr:/models/ocr:ro
    runtime: nvidia
    ports:
      - "8003:8001"

  vector-db:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_storage:/qdrant/storage

volumes:
  qdrant_storage:
  `,

  vllmCli: `
# Direct vLLM launch for Qwen3.5-122B-A10B (single GPU 32GB)
vllm serve qwen/Qwen3.5-122B-A10B \\
  --quantization awq \\
  --tensor-parallel-size 1 \\
  --max-model-len 65536 \\
  --gpu-memory-utilization 0.85 \\
  --enable-prefix-caching \\
  --port 8000

# For 24GB GPU — reduce context
vllm serve qwen/Qwen3.5-122B-A10B \\
  --quantization awq \\
  --max-model-len 32768 \\
  --gpu-memory-utilization 0.92 \\
  --port 8000
  `,

  nvidiaBuildDownload: `
# Download from NVIDIA Build (requires API key)
# https://build.nvidia.com

# 1. llama-nemotron-embed-1b-v2
ngc registry model download-version nvidia/llama-nemotron-embed-1b-v2

# 2. llama-3.2-nv-rerankqa-1b-v2  
ngc registry model download-version nvidia/llama-3.2-nv-rerankqa-1b-v2

# 3. nemotron-ocr-v1
ngc registry model download-version nvidia/nemotron-ocr-v1

# 4. qwen3.5-122b-a10b (from HuggingFace, not NGC)
huggingface-cli download qwen/Qwen3.5-122B-A10B --local-dir ./models/qwen-122b
  `,
};

// ============================================================================
// RAG PIPELINE CONFIG
// ============================================================================

export interface RAGPipelineConfig {
  chunkSize: number;
  chunkOverlap: number;
  topKRetrieve: number;
  topKFinal: number;
  similarityThreshold: number;
  useParentChild: boolean;
  parentChunkSize: number;
  childChunkSize: number;
  citationRequired: boolean;
  maxContextTokens: number;
}

export const LEGAL_RAG_CONFIG: RAGPipelineConfig = {
  chunkSize: 512,
  chunkOverlap: 128,
  topKRetrieve: 200,        // First stage: embedder retrieves 200
  topKFinal: 5,             // Second stage: reranker filters to 5
  similarityThreshold: 0.65,
  useParentChild: true,     // Parent = full pasal, Child = individual ayat
  parentChunkSize: 2048,    // Full pasal
  childChunkSize: 256,      // Individual ayat
  citationRequired: true,
  maxContextTokens: 32000,  // Qwen can handle 32K context
};

// ============================================================================
// HELPER: Get active stack based on GPU
// ============================================================================

export function getStackForGPU(gpuVRAM: number): AIStackConfig {
  if (gpuVRAM >= 32) return STACK_32GB;
  if (gpuVRAM >= 24) return STACK_24GB;
  throw new Error(`GPU ${gpuVRAM}GB insufficient. Minimum 24GB required.`);
}

export function formatVramUsage(stack: AIStackConfig): string {
  const lines = [
    `Stack: ${stack.stackName}`,
    `Target GPU: ${stack.targetGpuVRAM}GB`,
    '',
    'Models:',
    `  • Embedder: ${stack.models.embedder.name} (${stack.models.embedder.vramGB}GB)`,
    `  • Reranker: ${stack.models.reranker.name} (${stack.models.reranker.vramGB}GB)`,
    `  • Generator: ${stack.models.generator.name} (${stack.models.generator.vramGB}GB)`,
    `  • OCR: ${stack.models.ocr.name} (${stack.models.ocr.vramGB}GB)`,
  ];
  if (stack.models.guardrails) {
    lines.push(`  • Guardrails: ${stack.models.guardrails.name} (${stack.models.guardrails.vramGB}GB)`);
  }
  lines.push(
    '',
    `Total VRAM: ${stack.totalVramUsed}GB / ${stack.targetGpuVRAM}GB`,
    `Headroom: ${stack.vramHeadroom}GB`,
    `Framework: ${stack.framework}`,
  );
  return lines.join('\n');
}
