/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LocalAIConfig,
  LocalAIProvider,
  LocalHealthResult,
  OPEN_WEIGHT_MODELS,
  PROVIDER_PRESETS,
  PROVIDER_INSTRUCTIONS,
  getLocalAIConfig,
  saveLocalAIConfig,
  testLocalAIConnection,
} from '../lib/localAiService';
import { WEBL_MODELS, checkWebGPUSupport } from '../lib/webLlmService';
import {
  Cpu,
  Server,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  HardDrive,
  Shield,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface LocalAIRuntimeManagerProps {
  onConfigSaved?: (config: LocalAIConfig) => void;
  compact?: boolean;
}

export default function LocalAIRuntimeManager({
  onConfigSaved,
  compact = false,
}: LocalAIRuntimeManagerProps) {
  const [config, setConfig] = useState<LocalAIConfig>(getLocalAIConfig);
  const [health, setHealth] = useState<LocalHealthResult>({
    status: 'testing',
    detectedModels: [],
  });
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showGuideFor, setShowGuideFor] = useState<LocalAIProvider | null>('webllm');
  const [webGpuStatus, setWebGpuStatus] = useState<{ supported: boolean; adapterName?: string; reason?: string } | null>(null);

  useEffect(() => {
    checkWebGPUSupport().then(setWebGpuStatus);
  }, []);

  // Auto-run health check on load or provider change
  useEffect(() => {
    runHealthCheck(config);
  }, [config.provider, config.baseUrl]);

  const runHealthCheck = async (cfgToTest: LocalAIConfig) => {
    setIsTesting(true);
    const res = await testLocalAIConnection(cfgToTest);
    setHealth(res);
    setIsTesting(false);
  };

  const handleProviderSelect = (provider: LocalAIProvider) => {
    let newUrl = config.baseUrl;
    let newModel = config.model;

    if (provider !== 'gemini' && PROVIDER_PRESETS[provider]) {
      newUrl = PROVIDER_PRESETS[provider].defaultUrl;
      newModel = PROVIDER_PRESETS[provider].defaultModel;
    }

    const updated: LocalAIConfig = {
      ...config,
      provider,
      enabled: provider !== 'gemini',
      baseUrl: newUrl,
      model: newModel,
    };
    setConfig(updated);
    setShowGuideFor(provider);
  };

  const handleModelSelect = (modelName: string) => {
    setConfig((prev) => ({ ...prev, model: modelName }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveLocalAIConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    if (onConfigSaved) onConfigSaved(config);
  };

  const selectedMeta = PROVIDER_INSTRUCTIONS[config.provider] || PROVIDER_INSTRUCTIONS.webllm;

  return (
    <div className="space-y-6 font-sans text-left" id="local-ai-runtime-manager">
      {/* Infrastructure Mode Banner */}
      <div className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#912A4A]/10 text-[#912A4A] dark:bg-rose-950/40 dark:text-rose-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                <span>AI Engine & Local Offline Runtime</span>
                <span className="text-[10px] bg-[#912A4A]/10 text-[#912A4A] dark:bg-rose-950/60 dark:text-rose-300 px-2 py-0.5 rounded font-mono font-bold uppercase">
                  Zero Telemetry Option
                </span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Run AI right in your browser, on your computer, or in the cloud. You can hook up different models and switch between them anytime with one click.
              </p>
            </div>
          </div>

          {/* Quick Engine Switcher */}
          <div className="flex items-center bg-white dark:bg-stone-950 p-1 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => handleProviderSelect('webllm')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                config.provider === 'webllm'
                  ? 'bg-[#912A4A] text-white font-bold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>In-Browser WebGPU</span>
            </button>

            <button
              type="button"
              onClick={() => handleProviderSelect('ollama')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                config.provider !== 'gemini' && config.provider !== 'webllm'
                  ? 'bg-[#912A4A] text-white font-bold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Desktop App / Daemon</span>
            </button>

            <button
              type="button"
              onClick={() => handleProviderSelect('gemini')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                config.provider === 'gemini'
                  ? 'bg-[#912A4A] text-white font-bold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Gemini Cloud</span>
            </button>
          </div>
        </div>

        {/* Dynamic Capability & Privacy Card */}
        <div className="p-3.5 bg-amber-50/40 dark:bg-stone-900/40 border border-stone-200/70 dark:border-stone-800 rounded-lg text-xs text-stone-700 dark:text-stone-300 leading-relaxed flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-[#912A4A] dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-stone-900 dark:text-stone-100 font-semibold block">
              100% Client-Side Privacy Guarantee:
            </strong>
            <span>
              All literature notes, synthesis drafts, and claim verifications remain strictly in your browser or local machine.
              {config.provider === 'webllm' && ' In WebGPU mode, neural weights run directly on your graphics card and are cached in IndexedDB.'}
            </span>
          </div>
        </div>

        {/* Which Model Should You Use? Context & Hardware Decision Guide */}
        <div className="p-3.5 bg-stone-100/70 dark:bg-stone-950/80 border border-stone-200 dark:border-stone-800 rounded-lg text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
              <span>Which Model Should You Choose for Your Device?</span>
            </div>
            <span className="text-[10px] text-stone-500 font-medium">Plain-language guide</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] text-stone-600 dark:text-stone-400 pt-0.5">
            {/* 1. Light Tier */}
            <div className="p-3 rounded-md bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-1.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <strong className="text-stone-900 dark:text-stone-200 font-semibold block text-xs">
                    📱 1. Light & Fast (1.7B – 3B)
                  </strong>
                  <span className="text-[9px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-400 font-mono">2-4GB RAM</span>
                </div>
                <p className="leading-snug text-stone-500 dark:text-stone-400 mt-1">
                  <strong>Best for:</strong> Phones, tablets, and older laptops.
                </p>
                <p className="leading-snug text-stone-600 dark:text-stone-300 mt-1">
                  <span className="text-[#912A4A] dark:text-rose-400 font-medium">Qwen 2.5 (3B)</span> runs right inside your web browser. Zero setup, fast, and won't slow down your device.
                </p>
              </div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold pt-1 border-t border-stone-100 dark:border-stone-850">
                ✓ Zero install & instant launch
              </div>
            </div>

            {/* 2. In-Between Sweet Spot */}
            <div className="p-3 rounded-md bg-white dark:bg-stone-900 border-2 border-[#912A4A]/40 dark:border-rose-400/40 space-y-1.5 flex flex-col justify-between relative shadow-xs">
              <div className="absolute -top-2 right-2 px-1.5 py-0.5 bg-[#912A4A] text-white text-[9px] font-bold rounded">
                ⭐️ The "In-Between" Sweet Spot
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <strong className="text-stone-900 dark:text-stone-100 font-bold block text-xs">
                    💻 2. The Sweet Spot (7B – 8B)
                  </strong>
                  <span className="text-[9px] bg-rose-100/80 dark:bg-rose-950/80 text-[#912A4A] dark:text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold">8GB RAM</span>
                </div>
                <p className="leading-snug text-stone-500 dark:text-stone-400 mt-1">
                  <strong>Best for:</strong> Standard everyday laptops & desktops.
                </p>
                <p className="leading-snug text-stone-600 dark:text-stone-300 mt-1">
                  <span className="text-[#912A4A] dark:text-rose-400 font-medium">Qwen 2.5 (7B)</span> or <span className="font-medium">Qwen 3 (8B)</span>. Noticeably smarter at finding mistakes and writing without needing a heavy gaming computer.
                </p>
              </div>
              <div className="text-[10px] text-[#912A4A] dark:text-rose-400 font-semibold pt-1 border-t border-stone-100 dark:border-stone-850">
                ✓ Best balance of smarts & speed
              </div>
            </div>

            {/* 3. Heavyweight Powerhouse */}
            <div className="p-3 rounded-md bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-1.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <strong className="text-stone-900 dark:text-stone-200 font-semibold block text-xs">
                    🖥️ 3. Heavyweight (14B – 20B)
                  </strong>
                  <span className="text-[9px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-400 font-mono">16GB+ RAM</span>
                </div>
                <p className="leading-snug text-stone-500 dark:text-stone-400 mt-1">
                  <strong>Best for:</strong> Powerful gaming PCs & workstations.
                </p>
                <p className="leading-snug text-stone-600 dark:text-stone-300 mt-1">
                  <span className="text-[#912A4A] dark:text-rose-400 font-medium">gpt-oss (20B)</span> or <span className="font-medium">DeepSeek R1</span>. The "big brain" option for solving difficult, multi-layered research questions.
                </p>
              </div>
              <div className="text-[10px] text-stone-600 dark:text-stone-400 font-medium pt-1 border-t border-stone-100 dark:border-stone-850">
                ✓ Deepest academic reasoning
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROVIDER CARDS SELECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-sans text-xs text-stone-800 dark:text-stone-200 font-bold block">
            Select Your Preferred AI Engine Provider:
          </label>
          <span className="text-[11px] text-stone-500">
            Click any card to see setup steps and difficulty rating
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* WebLLM In-Browser (Featured Zero-Install) */}
          <button
            type="button"
            onClick={() => handleProviderSelect('webllm')}
            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-full space-y-3 relative overflow-hidden ${
              config.provider === 'webllm'
                ? 'bg-rose-50/50 dark:bg-[#912A4A]/20 border-[#912A4A] dark:border-rose-400 ring-1 ring-[#912A4A] shadow-xs'
                : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
                  <span>In-Browser WebGPU</span>
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                  Zero Install
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                Runs directly in browser GPU memory. No terminal, background servers, or installations required.
              </p>
            </div>

            <div className="pt-2 border-t border-stone-150 dark:border-stone-850 flex items-center justify-between text-[10px]">
              <span className="text-stone-400">Knowledge: <strong className="text-emerald-700 dark:text-emerald-400">Beginner (Zero)</strong></span>
              <span className="text-stone-400">Effort: <strong className="text-emerald-700 dark:text-emerald-400">Zero (1-Click)</strong></span>
            </div>
          </button>

          {/* Desktop Daemons & Custom */}
          {(Object.keys(PROVIDER_PRESETS) as Array<keyof typeof PROVIDER_PRESETS>)
            .filter((p) => p !== 'webllm')
            .map((provKey) => {
              const preset = PROVIDER_PRESETS[provKey];
              const meta = PROVIDER_INSTRUCTIONS[provKey];
              const isSelected = config.provider === provKey;

              return (
                <button
                  key={provKey}
                  type="button"
                  onClick={() => handleProviderSelect(provKey)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-full space-y-3 ${
                    isSelected
                      ? 'bg-rose-50/50 dark:bg-[#912A4A]/20 border-[#912A4A] dark:border-rose-400 ring-1 ring-[#912A4A] shadow-xs'
                      : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-[#912A4A] dark:text-rose-300' : 'text-stone-800 dark:text-stone-200'}`}>
                        {preset.name}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#1D9E75] dark:text-[#28c093]" />}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                      {preset.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-150 dark:border-stone-850 flex items-center justify-between text-[10px]">
                    <span className="text-stone-400">Knowledge: <strong className="text-stone-700 dark:text-stone-300">{meta?.knowledgeLevel.split(' ')[0] || 'Beginner'}</strong></span>
                    <span className="text-stone-400">Effort: <strong className="text-stone-700 dark:text-stone-300">{meta?.effortLevel || 'Low'}</strong></span>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* SETUP GUIDE & EFFORT ACCORDION FOR SELECTED PROVIDER */}
      <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-stone-150 dark:border-stone-850 pb-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#912A4A] dark:text-rose-400" />
            <h4 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100">
              Setup Instructions & Effort Guide: {selectedMeta.name}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-850 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
              Knowledge: <strong>{selectedMeta.knowledgeLevel}</strong>
            </span>
            <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-850 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
              Effort: <strong>{selectedMeta.effortLevel}</strong>
            </span>
          </div>
        </div>

        {/* Step-by-step guidance */}
        <div className="space-y-2 pt-1 text-xs text-stone-600 dark:text-stone-300">
          <ol className="space-y-1.5 list-decimal list-inside">
            {selectedMeta.installationSteps.map((step, idx) => (
              <li key={idx} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-stone-500 border-t border-stone-100 dark:border-stone-900">
            <div>
              <strong>Prerequisite:</strong> {selectedMeta.prerequisites.join(', ')}
            </div>
            <div>
              <strong>Privacy:</strong> {selectedMeta.offlineSecurity}
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE ENGINE CONFIGURATION FORM */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* WEBGPU IN-BROWSER MODEL SELECTION */}
        {config.provider === 'webllm' && (
          <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-150 dark:border-stone-850 pb-2.5">
              <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
                <span>In-Browser Model Selection (WebGPU Accelerated)</span>
              </h4>

              {webGpuStatus && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded ${
                  webGpuStatus.supported
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {webGpuStatus.supported ? `WebGPU: ${webGpuStatus.adapterName || 'Ready'}` : 'WebGPU Unavailable'}
                </span>
              )}
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400">
              The model weights download automatically on first use and remain permanently cached in your browser's IndexedDB for complete offline capability.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {WEBL_MODELS.map((m) => {
                const isSelected = config.model === m.id;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleModelSelect(m.id)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-rose-50/50 dark:bg-[#912A4A]/20 border-[#912A4A] dark:border-rose-400 ring-1 ring-[#912A4A]'
                        : 'bg-stone-50/50 dark:bg-stone-900/30 border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs font-semibold text-stone-900 dark:text-stone-100">
                        {m.name}
                      </span>
                      <span className="font-mono text-[10px] bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-700 dark:text-stone-300">
                        {m.size}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                      {m.description}
                    </p>
                    <div className="pt-1.5 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between text-[10px] text-stone-400">
                      <span>{m.recommendedFor}</span>
                      <span className="font-mono text-stone-600 dark:text-stone-300">{m.memoryReq}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* DESKTOP DAEMON CONFIGURATION & DIAGNOSTICS */}
        {config.provider !== 'gemini' && config.provider !== 'webllm' && (
          <>
            <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-150 dark:border-stone-850 pb-2.5">
                <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
                  <span>Desktop Server Connection Status</span>
                </h4>

                {/* Live Status Badge */}
                <div className="flex items-center gap-2">
                  {isTesting ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Testing connection...
                    </span>
                  ) : health.status === 'connected' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Connected ({health.latencyMs}ms)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-bold border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-3 h-3 text-red-600" />
                      Local server offline
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => runHealthCheck(config)}
                    className="px-2.5 py-1 text-[11px] font-sans font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded border border-stone-200 dark:border-stone-800 transition-colors cursor-pointer"
                  >
                    Test connection again
                  </button>
                </div>
              </div>

              {/* Inputs: Base URL & API Key */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block">
                    Server URL
                  </label>
                  <input
                    type="text"
                    value={config.baseUrl}
                    onChange={(e) => setConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="e.g. http://localhost:11434"
                    className="w-full font-mono text-xs p-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:ring-2 focus:ring-[#912A4A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block">
                    API key (optional)
                  </label>
                  <input
                    type="password"
                    value={config.apiKey || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Leave blank if not required"
                    className="w-full font-mono text-xs p-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:ring-2 focus:ring-[#912A4A]"
                  />
                </div>
              </div>

              {/* Diagnostic Message */}
              {health.details && (
                <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-900/50 p-2.5 rounded border border-stone-150 dark:border-stone-850">
                  {health.details}
                </p>
              )}

              {/* Detected Local Models List */}
              {health.detectedModels.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-stone-150 dark:border-stone-850">
                  <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 block">
                    Auto-detected models on your system ({health.detectedModels.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {health.detectedModels.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleModelSelect(m)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          config.model === m
                            ? 'bg-[#912A4A] text-white border-[#912A4A] font-bold'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Open-Weight Models Catalog */}
            <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-4 sm:p-5 space-y-3 shadow-2xs">
              <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5 border-b border-stone-150 dark:border-stone-850 pb-2">
                <HardDrive className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
                <span>Open-Weight Model Library Presets</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {OPEN_WEIGHT_MODELS.map((m) => {
                  const isSelected = config.model === m.defaultOllamaName;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleModelSelect(m.defaultOllamaName)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-rose-50/50 dark:bg-[#912A4A]/20 border-[#912A4A] dark:border-rose-400'
                          : 'bg-stone-50/50 dark:bg-stone-900/30 border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-xs font-semibold text-stone-800 dark:text-stone-200">
                          {m.name}
                        </span>
                        <span className="font-mono text-[9px] bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-300">
                          {m.defaultOllamaName}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500 mt-1">{m.recommendedFor}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 space-y-1">
                <label className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block">
                  Active Model Identifier
                </label>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
                  placeholder="e.g. llama3.2, qwen2.5, mistral"
                  className="w-full font-mono text-xs p-2 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:ring-2 focus:ring-[#912A4A]"
                />
              </div>
            </div>
          </>
        )}

        {/* PRIVACY & GOVERNANCE TOGGLES */}
        {config.provider !== 'gemini' && (
          <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-4 sm:p-5 space-y-3 text-xs shadow-2xs">
            <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5 border-b border-stone-150 dark:border-stone-850 pb-2">
              <Shield className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
              <span>Offline Isolation & Cloud Safeguards</span>
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900/40 rounded-lg border border-stone-200 dark:border-stone-800">
                <div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200 block text-xs">
                    Strict Offline Mode (Air-Gapped Privacy)
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    Blocks all outbound web calls if local inference is unreachable.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.strictOffline}
                  onChange={(e) => setConfig((prev) => ({ ...prev, strictOffline: e.target.checked }))}
                  className="w-4 h-4 accent-[#1D9E75] dark:accent-[#28c093] rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900/40 rounded-lg border border-stone-200 dark:border-stone-800">
                <div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200 block text-xs">
                    Auto-Fallback to Cloud AI
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    Use server-side Gemini Cloud temporarily if your local GPU is busy.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoFallback}
                  onChange={(e) => setConfig((prev) => ({ ...prev, autoFallback: e.target.checked }))}
                  className="w-4 h-4 accent-[#1D9E75] dark:accent-[#28c093] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* SAVE CONFIGURATION BUTTON */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            className="font-sans text-xs bg-[#912A4A] hover:bg-[#78223d] text-white font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Apply & Save AI Configuration
          </button>

          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              Settings saved successfully.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
