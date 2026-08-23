/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateMLCEngine, MLCEngine, InitProgressReport, prebuiltAppConfig } from '@mlc-ai/web-llm';

export interface WebLLMModelOption {
  id: string;
  name: string;
  size: string;
  memoryReq: string;
  description: string;
  recommendedFor: string;
  isDefault?: boolean;
}

export const WEBL_MODELS: WebLLMModelOption[] = [
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 360M (Ultra-Light)',
    size: '~207 MB',
    memoryReq: '1 GB+ RAM / GPU',
    description: 'Smallest footprint model for quick browser testing.',
    recommendedFor: 'Good for less powerful devices and quick testing.',
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 0.5B (Ultra-Light)',
    size: '~290 MB',
    memoryReq: '1 GB+ RAM / GPU',
    description: 'Very small model for devices with limited storage and memory.',
    recommendedFor: 'Good for low-storage PCs and lower-memory devices.',
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Meta Llama 3.2 1B (Lightweight)',
    size: '~700 MB',
    memoryReq: '2 GB+ RAM / GPU',
    description: 'Small general-purpose conversational model.',
    recommendedFor: 'Good for modest PCs and devices with limited memory.',
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 1.5B (Balanced)',
    size: '~880 MB',
    memoryReq: '3 GB+ RAM / GPU',
    description: 'Balanced option for everyday browser AI.',
    recommendedFor: 'Good balance of capability and resource use.',
  },
  {
    id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 1.7B (Ultra-Light)',
    size: '~1.0 GB',
    memoryReq: '2 GB+ RAM / GPU',
    description: 'Small footprint model for quick browser testing.',
    recommendedFor: 'Good for less powerful devices and quick testing.',
  },
  {
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 3B (Fast & High Precision)',
    size: '~1.9 GB',
    memoryReq: '4 GB+ RAM / GPU',
    description: '',
    recommendedFor: 'Best all-rounder for phones, laptops, and quick in-browser inference',
    isDefault: true,
  },
  {
    id: 'gemma-2-2b-it-q4f16_1-MLC',
    name: 'Google Gemma 2 2B (Lightweight)',
    size: '~1.4 GB',
    memoryReq: '3 GB+ RAM / GPU',
    description: '',
    recommendedFor: 'Budget laptops, tablets, or devices with less memory',
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Meta Llama 3.2 3B (High-quality conversational synthesis)',
    size: '~2.1 GB',
    memoryReq: '4 GB+ RAM / GPU',
    description: '',
    recommendedFor: 'Best for modern phones, tablets and laptops with enough available memory for a 3B model.',
  },
  {
    id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 7B (Flagship Capability)',
    size: '~4.3 GB',
    memoryReq: '8 GB+ RAM / GPU',
    description: '',
    recommendedFor: 'Modern desktops and laptops with a dedicated graphics card (8GB+ RAM)',
  },
];

export interface WebGPUCapability {
  supported: boolean;
  adapterName?: string;
  reason?: string;
}

let activeEngine: MLCEngine | null = null;
let currentLoadedModelId: string | null = null;
let isInitializing = false;

export async function checkWebGPUSupport(): Promise<WebGPUCapability> {
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  if (!nav || !nav.gpu) {
    return {
      supported: false,
      reason: 'WebGPU is not supported or enabled in this browser (Chrome 113+, Edge 113+, Firefox 115+, Safari 18+ required).',
    };
  }
  try {
    const adapter = await nav.gpu.requestAdapter();
    if (!adapter) {
      return { supported: false, reason: 'No compatible WebGPU graphics adapter found. Check hardware acceleration settings.' };
    }
    const info = (await (adapter as any).requestAdapterInfo?.()) || {};
    return { supported: true, adapterName: info.description || info.vendor || 'Standard WebGPU Adapter' };
  } catch (err: any) {
    return { supported: false, reason: err?.message || 'Failed to initialize WebGPU adapter.' };
  }
}

/**
 * Create the WebLLM app configuration with the model weights routed through
 * Pessoa's same-origin proxy. Hugging Face resolver/CDN responses can otherwise
 * fail browser CORS checks before WebLLM can initialise the model.
 */
function getBrowserAIAppConfig(registeredModel: any) {
  const modelUrl = registeredModel.model as string;
  if (typeof window === 'undefined' || !modelUrl?.startsWith('https://huggingface.co/')) {
    return prebuiltAppConfig;
  }

  const repoPath = new URL(modelUrl).pathname;
  const proxiedModelUrl = `${window.location.origin}/api/browser-ai/model${repoPath}`;

  return {
    ...prebuiltAppConfig,
    model_list: [
      {
        ...registeredModel,
        model: proxiedModelUrl,
      },
    ],
  };
}

export async function getOrInitWebLLMEngine(
  modelId: string = 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
  onProgress?: (report: InitProgressReport) => void
): Promise<MLCEngine> {
  const registeredModel = prebuiltAppConfig.model_list.find(
    (model) => model.model_id?.toLowerCase() === modelId.toLowerCase()
  );
  const canonicalModelId = registeredModel?.model_id || modelId;

  if (!registeredModel) {
    throw new Error(`The selected browser AI model is not available in this WebLLM build: ${modelId}`);
  }
  if (activeEngine && currentLoadedModelId === canonicalModelId) return activeEngine;

  if (isInitializing) {
    while (isInitializing) await new Promise((resolve) => setTimeout(resolve, 300));
    if (activeEngine && currentLoadedModelId === canonicalModelId) return activeEngine;
  }

  isInitializing = true;
  try {
    if (activeEngine) {
      try {
        await activeEngine.unload();
      } catch (e) {
        console.warn('Error unloading previous WebLLM model:', e);
      }
      activeEngine = null;
      currentLoadedModelId = null;
    }

    const appConfig = getBrowserAIAppConfig(registeredModel);
    const engine = await CreateMLCEngine(canonicalModelId, {
      appConfig,
      initProgressCallback: (report) => {
        if (onProgress) onProgress(report);
      },
    });

    activeEngine = engine;
    currentLoadedModelId = canonicalModelId;
    return engine;
  } finally {
    isInitializing = false;
  }
}

export function safeExtractJson<T = any>(rawText: string): T {
  if (!rawText) return {} as T;
  let clean = rawText.replace(/^```json/gim, '').replace(/^```/gim, '').replace(/```$/gim, '').trim();
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  let startIdx = -1;
  let isObject = true;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    isObject = true;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    isObject = false;
  }
  if (startIdx !== -1) {
    const lastChar = isObject ? '}' : ']';
    const endIdx = clean.lastIndexOf(lastChar);
    if (endIdx > startIdx) clean = clean.substring(startIdx, endIdx + 1);
  }
  try {
    return JSON.parse(clean);
  } catch {
    try {
      return JSON.parse(clean.replace(/,\s*([}\]])/g, '$1').replace(/[\n\r\t]/g, ' '));
    } catch {
      throw new Error(`Model returned text that could not be parsed as structured JSON: ${rawText.slice(0, 150)}...`);
    }
  }
}

export async function executeWebLLMPrompt(
  systemPrompt: string,
  userPrompt: string,
  modelId: string = 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
  jsonMode: boolean = true,
  onProgress?: (progress: number, text: string) => void
): Promise<any> {
  const engine = await getOrInitWebLLMEngine(modelId, (report) => {
    if (onProgress) onProgress(report.progress, report.text);
  });
  const response = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: jsonMode ? `${systemPrompt}\n\nIMPORTANT: You must respond ONLY with raw, valid JSON. No conversational chatter, no preambles, no explanation outside JSON.` : systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.15,
    response_format: jsonMode ? { type: 'json_object' } : undefined,
  });
  const outputText = response.choices[0]?.message?.content || '';
  return jsonMode ? safeExtractJson(outputText) : outputText;
}
