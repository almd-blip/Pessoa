/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateMLCEngine, MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';

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
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 3B (Fast & High Precision)',
    size: '~1.9 GB',
    memoryReq: '4 GB+ RAM / GPU',
    description: 'Ultra-fast, excellent structured JSON extraction, literature synthesis, and reasoning.',
    recommendedFor: 'Best all-rounder for phones, laptops, and quick in-browser inference',
    isDefault: true,
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    name: 'Meta Llama 3.2 3B',
    size: '~2.1 GB',
    memoryReq: '4 GB+ RAM / GPU',
    description: 'High-quality conversational synthesis and academic drafting from Meta.',
    recommendedFor: 'Research paper drafting, claim checking, and perspective testing',
  },
  {
    id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 7B (Flagship Capability)',
    size: '~4.3 GB',
    memoryReq: '8 GB+ RAM / GPU',
    description: 'Deep multi-paper thematic clustering, subtle evidence critiques, and dense extraction.',
    recommendedFor: 'Modern desktops and laptops with dedicated GPUs (8GB+ RAM)',
  },
  {
    id: 'Gemma-2-2B-It-q4f16_1-MLC',
    name: 'Google Gemma 2 2B (Lightweight)',
    size: '~1.4 GB',
    memoryReq: '3 GB+ RAM / GPU',
    description: 'Compact on-device model from Google with high clarity and low memory footprint.',
    recommendedFor: 'Budget laptops, tablets, or constrained memory environments',
  },
  {
    id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 1.7B (Ultra-Light)',
    size: '~1.0 GB',
    memoryReq: '2 GB+ RAM / GPU',
    description: 'Smallest footprint model for instant zero-install browser testing.',
    recommendedFor: 'Low-spec mobile devices and rapid zero-wait testing',
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

/**
 * Check if the current browser environment supports WebGPU.
 */
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
      return {
        supported: false,
        reason: 'No compatible WebGPU graphics adapter found. Check hardware acceleration settings.',
      };
    }
    const info = (await (adapter as any).requestAdapterInfo?.()) || {};
    return {
      supported: true,
      adapterName: info.description || info.vendor || 'Standard WebGPU Adapter',
    };
  } catch (err: any) {
    return {
      supported: false,
      reason: err?.message || 'Failed to initialize WebGPU adapter.',
    };
  }
}

/**
 * Get the singleton MLCEngine or initialize one.
 */
export async function getOrInitWebLLMEngine(
  modelId: string = 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
  onProgress?: (report: InitProgressReport) => void
): Promise<MLCEngine> {
  if (activeEngine && currentLoadedModelId === modelId) {
    return activeEngine;
  }

  if (isInitializing) {
    // Wait briefly if already loading
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    if (activeEngine && currentLoadedModelId === modelId) {
      return activeEngine;
    }
  }

  isInitializing = true;
  try {
    if (activeEngine) {
      try {
        await activeEngine.unload();
      } catch (e) {
        console.warn('Error unloading previous WebLLM model:', e);
      }
    }

    const engine = await CreateMLCEngine(modelId, {
      initProgressCallback: (report) => {
        if (onProgress) onProgress(report);
      },
    });

    activeEngine = engine;
    currentLoadedModelId = modelId;
    return engine;
  } finally {
    isInitializing = false;
  }
}

/**
 * Clean & resilient JSON extractor to handle smaller open-weight models that might
 * wrap JSON in markdown blocks or include conversational greetings.
 */
export function safeExtractJson<T = any>(rawText: string): T {
  if (!rawText) return {} as T;

  // 1. Strip markdown fences if present
  let clean = rawText
    .replace(/^```json/gim, '')
    .replace(/^```/gim, '')
    .replace(/```$/gim, '')
    .trim();

  // 2. Locate outermost JSON structure ({ ... } or [ ... ])
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
    if (endIdx > startIdx) {
      clean = clean.substring(startIdx, endIdx + 1);
    }
  }

  try {
    return JSON.parse(clean);
  } catch {
    // Attempt standard syntax repairs (trailing commas, unescaped newlines in strings)
    try {
      const repaired = clean
        .replace(/,\s*([}\]])/g, '$1') // remove trailing commas
        .replace(/[\n\r\t]/g, ' ');   // clean raw control characters
      return JSON.parse(repaired);
    } catch (parseErr) {
      console.warn('Failed to parse model output as JSON:', rawText);
      throw new Error(`Model returned text that could not be parsed as structured JSON: ${rawText.slice(0, 150)}...`);
    }
  }
}

/**
 * Run in-browser inference using WebLLM.
 */
export async function executeWebLLMPrompt(
  systemPrompt: string,
  userPrompt: string,
  modelId: string = 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
  jsonMode: boolean = true,
  onProgress?: (progress: number, text: string) => void
): Promise<any> {
  const engine = await getOrInitWebLLMEngine(modelId, (report) => {
    if (onProgress) {
      onProgress(report.progress, report.text);
    }
  });

  const response = await engine.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: jsonMode
          ? `${systemPrompt}\n\nIMPORTANT: You must respond ONLY with raw, valid JSON. No conversational chatter, no preambles, no explanation outside JSON.`
          : systemPrompt,
      },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.15,
    response_format: jsonMode ? { type: 'json_object' } : undefined,
  });

  const outputText = response.choices[0]?.message?.content || '';

  if (jsonMode) {
    return safeExtractJson(outputText);
  }

  return outputText;
}
