/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LocalAIProvider = 'gemini' | 'webllm' | 'ollama' | 'lmstudio' | 'gpt4all' | 'anythingllm' | 'custom';

export interface LocalAIConfig {
  enabled: boolean;
  provider: LocalAIProvider;
  baseUrl: string;
  model: string;
  apiKey?: string;
  customSystemPromptSuffix?: string;
}

export interface LocalHealthResult {
  status: 'connected' | 'offline' | 'testing';
  latencyMs?: number;
  detectedModels: string[];
  error?: string;
  details?: string;
  webGpuAdapter?: string;
}

export interface ProviderInstructionMeta {
  name: string;
  knowledgeLevel: 'Zero (Beginner)' | 'Low (1-Click App)' | 'Moderate (CLI/Daemon)' | 'Advanced (Custom Server)';
  effortLevel: 'Zero Effort' | 'Very Low (5 mins)' | 'Low (5 mins)' | 'Moderate (10 mins)';
  installationSteps: string[];
  prerequisites: string[];
  offlineSecurity: string;
}

export const PROVIDER_INSTRUCTIONS: Record<LocalAIProvider, ProviderInstructionMeta> = {
  webllm: {
    name: 'In-Browser WebGPU (Zero-Install)',
    knowledgeLevel: 'Zero (Beginner)',
    effortLevel: 'Zero Effort',
    installationSteps: [
      'No installation, downloads, terminal commands, or background apps needed.',
      'Select your preferred in-browser model (e.g. Qwen 2.5 3B or Llama 3.2 3B).',
      'The browser automatically downloads and caches the model weights into IndexedDB on the first run.',
      'Subsequent launches are instant and work 100% offline even without internet connection.',
    ],
    prerequisites: ['Modern Web browser with WebGPU enabled (Chrome 113+, Edge 113+, Firefox 115+, Safari 18+).'],
    offlineSecurity: 'Zero network traffic. Tensor execution happens entirely in your local GPU memory sandbox.',
  },
  ollama: {
    name: 'Ollama Daemon',
    knowledgeLevel: 'Low (1-Click App)',
    effortLevel: 'Very Low (5 mins)',
    installationSteps: [
      'Download and install Ollama from https://ollama.com.',
      'Open Terminal / Command Prompt and run: ollama run llama3.2 (or ollama run qwen2.5).',
      'Keep the Ollama app or daemon running in the background.',
      'Click "Test Connection" to auto-discover all models installed on your machine.',
    ],
    prerequisites: ['Ollama binary installed on macOS, Windows, or Linux.'],
    offlineSecurity: 'Runs on localhost:11434. Completely private and local.',
  },
  lmstudio: {
    name: 'LM Studio Desktop',
    knowledgeLevel: 'Zero (Beginner)',
    effortLevel: 'Very Low (5 mins)',
    installationSteps: [
      'Download the desktop application from https://lmstudio.ai.',
      'Search for any open model (e.g., Llama 3.2, Qwen 2.5, DeepSeek R1) and click "Download".',
      'Go to the "Local Server" tab (<->) on the left sidebar and click "Start Server".',
      'Ensure the server is running on http://localhost:1234.',
    ],
    prerequisites: ['LM Studio graphical application running on your PC/Mac.'],
    offlineSecurity: 'Zero telemetry local HTTP server running exclusively on your desktop.',
  },
  gpt4all: {
    name: 'GPT4All Desktop App',
    knowledgeLevel: 'Zero (Beginner)',
    effortLevel: 'Very Low (5 mins)',
    installationSteps: [
      'Download GPT4All from https://gpt4all.io and install the desktop app.',
      'Download an open model from the built-in model library.',
      'Go to Settings -> Application -> Enable "Local API Server" (port 4891).',
      'Click "Test Connection" in the app to link with GPT4All.',
    ],
    prerequisites: ['GPT4All desktop app installed with Local API enabled.'],
    offlineSecurity: 'Strictly zero telemetry with on-device quantized model execution.',
  },
  anythingllm: {
    name: 'AnythingLLM Desktop',
    knowledgeLevel: 'Low (1-Click App)',
    effortLevel: 'Low (5 mins)',
    installationSteps: [
      'Install AnythingLLM Desktop from https://useanything.com.',
      'Configure your local LLM provider inside AnythingLLM Settings.',
      'Enable the Developer API and paste your API key below if required.',
      'Default API URL is http://localhost:3001/api/v1.',
    ],
    prerequisites: ['AnythingLLM installed with local workspace knowledge base.'],
    offlineSecurity: 'Local RAG document indexing and private chat.',
  },
  custom: {
    name: 'Custom OpenAI-Compatible Server',
    knowledgeLevel: 'Advanced (Custom Server)',
    effortLevel: 'Moderate (10 mins)',
    installationSteps: [
      'Start your custom inference server (e.g., vLLM, Text-Generation-WebUI, LocalAI, or Docker).',
      'Ensure the server supports the /v1/chat/completions endpoint and CORS headers.',
      'Enter the base URL (e.g., http://localhost:8000/v1) and your Model Name below.',
      'Click "Test Connection" to verify the endpoint.',
    ],
    prerequisites: ['Custom backend with GPU acceleration or remote private inference cluster.'],
    offlineSecurity: 'Self-hosted and entirely within your own local or internal private network.',
  },
  gemini: {
    name: 'Google Gemini Cloud Server Proxy',
    knowledgeLevel: 'Zero (Beginner)',
    effortLevel: 'Zero Effort',
    installationSteps: [
      'Zero configuration or setup required.',
      'Securely routed via server-side API proxy.',
      'Provides high-speed synthesis and deep multi-document context.',
    ],
    prerequisites: ['Internet connection.'],
    offlineSecurity: 'Processed via Google Cloud infrastructure.',
  },
};

export interface OpenWeightModelPreset {
  id: string;
  name: string;
  family: 'gpt-oss' | 'llama' | 'mistral' | 'qwen' | 'deepseek' | 'gemma' | 'other';
  recommendedFor: string;
  defaultOllamaName: string;
}

export const OPEN_WEIGHT_MODELS: OpenWeightModelPreset[] = [
  {
    id: 'gpt-oss-20b',
    name: 'gpt-oss 20B (PC / Desktop High-Capability Flagship)',
    family: 'gpt-oss',
    recommendedFor: 'Deep academic synthesis, extensive reasoning effort tiers, multi-layered methodology & logic analysis (Requires 16GB+ RAM / 12GB+ VRAM)',
    defaultOllamaName: 'gpt-oss:20b',
  },
  {
    id: 'qwen-3',
    name: 'Qwen 3 (3B / 8B / 14B / 32B)',
    family: 'qwen',
    recommendedFor: 'State-of-the-art literature analysis, thinking on/off toggle, math/data patterns, and structured extraction across all device tiers',
    defaultOllamaName: 'qwen3:8b',
  },
  {
    id: 'qwen-2.5',
    name: 'Qwen 2.5 / Qwen Coder',
    family: 'qwen',
    recommendedFor: 'Complex data pattern analysis, multi-lingual literature, and code execution',
    defaultOllamaName: 'qwen2.5:latest',
  },
  {
    id: 'llama-3.2',
    name: 'Meta Llama 3.2 / 3.3',
    family: 'llama',
    recommendedFor: 'Fast reasoning, structured JSON extraction, and research drafting',
    defaultOllamaName: 'llama3.2:latest',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1 / V3',
    family: 'deepseek',
    recommendedFor: 'Deep step-by-step reasoning, critical partner debate, and hypothesis testing',
    defaultOllamaName: 'deepseek-r1:latest',
  },
  {
    id: 'mistral-small',
    name: 'Mistral / Mixtral',
    family: 'mistral',
    recommendedFor: 'High-precision literature analysis, logic checking, and evidence evaluation',
    defaultOllamaName: 'mistral:latest',
  },
  {
    id: 'gemma-2',
    name: 'Google Gemma 2',
    family: 'gemma',
    recommendedFor: 'Compact on-device execution with strong safety and research clarity',
    defaultOllamaName: 'gemma2:latest',
  },
];

import { checkWebGPUSupport, executeWebLLMPrompt, WEBL_MODELS } from './webLlmService';

export const PROVIDER_PRESETS: Record<Exclude<LocalAIProvider, 'gemini'>, { name: string; defaultUrl: string; defaultModel: string; description: string }> = {
  webllm: {
    name: 'In-Browser WebGPU (WebLLM)',
    defaultUrl: 'in-browser-gpu',
    defaultModel: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    description: 'Zero install & zero server. Runs directly in browser GPU memory and caches in IndexedDB for 100% offline use.',
  },
  ollama: {
    name: 'Ollama Local Runtime',
    defaultUrl: 'http://localhost:11434',
    defaultModel: 'llama3.2:latest',
    description: 'Popular open-source command line and daemon runner for local open-weight models.',
  },
  lmstudio: {
    name: 'LM Studio Desktop',
    defaultUrl: 'http://localhost:1234/v1',
    defaultModel: 'qwen2.5:latest',
    description: 'Local model management & testing GUI with OpenAI-compatible local HTTP server.',
  },
  gpt4all: {
    name: 'GPT4All Local App',
    defaultUrl: 'http://localhost:4891/v1',
    defaultModel: 'gpt4all-lora-quantized',
    description: 'Ecosystem for desktop offline LLM inference with zero data telemetry.',
  },
  anythingllm: {
    name: 'AnythingLLM Local Knowledge Engine',
    defaultUrl: 'http://localhost:3001/api/v1',
    defaultModel: 'default',
    description: 'Local knowledge-base management and document retrieval engine.',
  },
  custom: {
    name: 'Custom OpenAI-Compatible API Endpoint',
    defaultUrl: 'http://localhost:8000/v1',
    defaultModel: 'custom-model',
    description: 'Connect to vLLM, Text-Generation-WebUI, LocalAI, Ollama Docker, or custom GPU server.',
  },
};

const STORAGE_KEY = 'scholar_local_ai_config';

export const DEFAULT_LOCAL_AI_CONFIG: LocalAIConfig = {
  enabled: false,
  provider: 'webllm',
  baseUrl: 'in-browser-gpu',
  model: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
};

export function getLocalAIConfig(): LocalAIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LOCAL_AI_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_LOCAL_AI_CONFIG, ...parsed };
  } catch (err) {
    console.error('Failed to parse local AI config:', err);
    return DEFAULT_LOCAL_AI_CONFIG;
  }
}

export function saveLocalAIConfig(config: LocalAIConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('local_ai_config_updated', { detail: config }));
  } catch (err) {
    console.error('Failed to save local AI config:', err);
  }
}

/**
 * Test connectivity and detect loaded models from the local AI runtime or browser WebGPU.
 */
export async function testLocalAIConnection(config: LocalAIConfig): Promise<LocalHealthResult> {
  if (config.provider === 'gemini') {
    return {
      status: 'connected',
      detectedModels: ['gemini-3.5-flash (Google Cloud Server Proxy)'],
      details: 'Using secure server-side Gemini Cloud API.',
    };
  }

  if (config.provider === 'webllm') {
    const startTime = Date.now();
    const gpuCheck = await checkWebGPUSupport();
    const latencyMs = Date.now() - startTime;

    if (!gpuCheck.supported) {
      return {
        status: 'offline',
        latencyMs,
        detectedModels: [],
        error: gpuCheck.reason || 'WebGPU is not available in this browser.',
        details: 'Try opening in Chrome/Edge/Firefox or enable WebGPU hardware acceleration in browser settings.',
      };
    }

    return {
      status: 'connected',
      latencyMs,
      detectedModels: WEBL_MODELS.map(m => m.id),
      webGpuAdapter: gpuCheck.adapterName,
      details: `WebGPU Active (${gpuCheck.adapterName || 'Standard GPU'}). Ready for in-browser zero-install inference with IndexedDB caching.`,
    };
  }

  const startTime = Date.now();
  try {
    const response = await fetch('/api/local-ai/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: config.provider,
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
      }),
    });

    const latencyMs = Date.now() - startTime;
    const data = await response.json();

    if (!response.ok || !data.ok) {
      return {
        status: 'offline',
        latencyMs,
        detectedModels: [],
        error: data.error || 'Failed to reach local endpoint.',
        details: data.details || 'Check if your local AI app (Ollama/LM Studio/GPT4All/AnythingLLM) is running on your machine.',
      };
    }

    return {
      status: 'connected',
      latencyMs,
      detectedModels: data.models || [],
      details: data.details || `Successfully connected to ${config.provider.toUpperCase()} at ${config.baseUrl}`,
    };
  } catch (err: any) {
    return {
      status: 'offline',
      latencyMs: Date.now() - startTime,
      detectedModels: [],
      error: err.message || 'Network error connecting to local health proxy.',
      details: 'Ensure CORS/HTTP listening is enabled on your local AI runtime.',
    };
  }
}

/**
 * Standard fetch helper that attaches the user's Local AI configuration to API calls,
 * or routes directly to in-browser WebLLM if enabled.
 *
 * P0 privacy invariant (docs/P0-TRUST.md, docs/DECISIONS.md D-003): a failure of a
 * more private processing route must NEVER automatically escalate the task to a
 * less private one. If the user's explicitly selected route is browser-local
 * WebLLM and it fails, this function reports that failure and returns — it does
 * NOT silently send the task to the cloud endpoint instead. Switching providers
 * is always a separate, explicit action taken by the user in AI settings.
 */
export async function postWithAiRouting(url: string, payload: any): Promise<Response> {
  const localConfig = getLocalAIConfig();

  // If WebLLM In-Browser is chosen and enabled, processing must actually
  // happen in the browser — this is the only route that satisfies that.
  if (localConfig.enabled && localConfig.provider === 'webllm') {
    try {
      // Map common endpoints to direct in-browser inference
      const systemPrompt = `You are a rigorous, supportive academic research intelligence assistant. Provide thorough, high-precision academic analysis.`;
      let userPrompt = '';
      let isJson = true;

      if (url.includes('/api/gemini/summarize')) {
        userPrompt = `Analyze and provide a structured summary of this paper:\nTitle: ${payload.title}\nAuthors: ${payload.authors}\nAbstract: ${payload.abstract}\nNotes: ${payload.notes}\n\nRespond with a JSON object containing: researchQuestion, methods, participants, findings, limitations, evidenceExplanation, keyQuotations (array of strings), futureResearch.`;
      } else if (url.includes('/api/gemini/claim-checker')) {
        userPrompt = `Evaluate this claim critically:\nClaim: "${payload.claim}"\nContext: "${payload.context || ''}"\n\nRespond with a JSON object containing: alternativeHypotheses (array), counterArguments (array), unstatedAssumptions (array), reframingSuggestions (array).`;
      } else if (url.includes('/api/gemini/connect-literature')) {
        userPrompt = `Synthesize these research papers:\n${JSON.stringify(payload.papers || [])}\n\nRespond with a JSON object containing: agreements (string summary), disagreements (string summary), thematicClusters (array of { themeName: string, description: string, paperIds: string[] }).`;
      } else if (url.includes('/api/gemini/evidence-map')) {
        userPrompt = `Map the empirical evidence for this topic:\nTopic: ${payload.topic || 'Research Synthesis'}\nPapers: ${JSON.stringify(payload.papers || [])}\n\nRespond with a JSON object containing: clusters (array of { theme: string, strength: "Strong" | "Moderate" | "Emerging", summary: string, keyEvidence: string[] }), gaps (array of strings), synthesisOverview: string.`;
      } else if (url.includes('/api/gemini/spot-patterns')) {
        userPrompt = `Analyze research data patterns:\nData: ${JSON.stringify(payload.data || payload.notes || payload.abstract || payload.text || '')}\n\nRespond with a JSON object containing: patterns (array of { patternName: string, significance: string, confidence: "High" | "Medium" | "Exploratory", implications: string }), outliers (array of strings), summary: string.`;
      } else if (url.includes('/api/gemini/build-questions')) {
        userPrompt = `Generate rigorous research inquiry questions based on:\nTopic: ${payload.topic || 'Literature'}\nContext: ${payload.context || JSON.stringify(payload.papers || '')}\n\nRespond with a JSON object containing: descriptiveQuestions (array), relationalQuestions (array), causalQuestions (array), methodologicalConsiderations (array).`;
      } else if (url.includes('/api/gemini/writing-feedback') || url.includes('/api/gemini/draft-feedback')) {
        userPrompt = `Provide constructive academic feedback on this draft section:\nTitle: ${payload.title || ''}\nSection: ${payload.section || 'General'}\nContent:\n${payload.content || payload.draft || ''}\n\nRespond with a JSON object containing: strengths (array of strings), areasForImprovement (array of strings), clarityScore: number (1-10), suggestions (array of { original: string, suggestion: string, rationale: string }).`;
      } else {
        userPrompt = JSON.stringify(payload);
      }

      const result = await executeWebLLMPrompt(systemPrompt, userPrompt, localConfig.model, isJson);
      const body = typeof result === 'object' && result !== null
        ? { ...result, _processing: { route: 'local-browser', provider: 'webllm', model: localConfig.model } }
        : { text: result, _processing: { route: 'local-browser', provider: 'webllm', model: localConfig.model } };

      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (webLlmErr: any) {
      // Do not fall through to the cloud endpoint here. Report the local
      // failure and let the user decide — e.g. by switching to Gemini Cloud
      // in AI settings — rather than Pessoa silently deciding for them.
      console.warn('WebLLM in-browser execution failed. No automatic cloud fallback was attempted:', webLlmErr);
      return new Response(
        JSON.stringify({
          error: `In-browser WebGPU processing failed: ${webLlmErr?.message || 'Unknown error'}. Pessoa does not automatically send this task to a cloud provider after a local failure. To process this task in the cloud, switch your AI provider to Gemini Cloud in AI settings and try again.`,
          processingRoute: 'local-browser',
          provider: 'webllm',
          localFailure: true,
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Any other route (a configured local/self-hosted server, or Gemini Cloud)
  // is resolved server-side by the shared AI task layer in server.ts, which
  // enforces the same no-silent-fallback invariant for that route.
  const enrichedPayload = {
    ...payload,
    localAiConfig: localConfig.enabled ? localConfig : undefined,
  };

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Local-AI-Enabled': localConfig.enabled ? 'true' : 'false',
      'X-Local-AI-Provider': localConfig.provider,
    },
    body: JSON.stringify(enrichedPayload),
  });
}
