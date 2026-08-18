/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
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
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HardDrive,
  Info,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  Zap,
  Cloud,
} from 'lucide-react';

interface LocalAIRuntimeManagerProps {
  onConfigSaved?: (config: LocalAIConfig) => void;
  compact?: boolean;
}

const intermediateProviders: LocalAIProvider[] = ['ollama', 'lmstudio', 'gpt4all', 'anythingllm'];

function SectionHeader({
  title,
  description,
  open,
  onToggle,
}: {
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="w-full min-h-11 text-left flex items-center justify-between gap-4 py-3.5 px-4 sm:px-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors"
    >
      <span className="min-w-0">
        <span className="block text-base font-semibold text-[#1B0A3B] dark:text-stone-100 leading-snug">
          {title}
        </span>
        <span className="block mt-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
          {description}
        </span>
      </span>
      <span className="shrink-0 text-[#1D9E75]" aria-hidden="true">
        {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </span>
    </button>
  );
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
  const [webGpuStatus, setWebGpuStatus] = useState<{ supported: boolean; adapterName?: string; reason?: string } | null>(null);
  const [openSection, setOpenSection] = useState<'beginner' | 'intermediate' | 'advanced' | 'guidance'>('beginner');
  const [showGuideFor, setShowGuideFor] = useState<LocalAIProvider | null>(null);

  useEffect(() => {
    checkWebGPUSupport().then(setWebGpuStatus);
  }, []);

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

  const toggleSection = (section: 'beginner' | 'intermediate' | 'advanced' | 'guidance') => {
    setOpenSection((current) => (current === section ? section : section));
  };

  const openProviderGuide = (provider: LocalAIProvider) => {
    handleProviderSelect(provider);
    setShowGuideFor(provider);
  };

  return (
    <div className="space-y-4 font-sans text-left" id="local-ai-runtime-manager">
      <div className="space-y-3">
        <SectionHeader
          title="Beginner — Zero setup"
          description="Use AI directly in your browser. Nothing to install. Your model downloads once and can then work offline on this device."
          open={openSection === 'beginner'}
          onToggle={() => toggleSection('beginner')}
        />

        {openSection === 'beginner' && (
          <div className="space-y-4 pl-0 sm:pl-2">
            <div className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-950 p-4 sm:p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-[#1D9E75] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-[#1B0A3B] dark:text-stone-100">In-browser AI</h3>
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                    Pessoa can run a model in your browser using your device's graphics processor. The model is cached on this device for later offline use.
                  </p>
                </div>
              </div>

              {webGpuStatus && (
                <div className={`text-sm rounded-lg px-3.5 py-3 border ${webGpuStatus.supported ? 'border-[#1D9E75]/30 bg-[#1D9E75]/5 text-stone-700 dark:text-stone-300' : 'border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/20 text-stone-700 dark:text-stone-300'}`}>
                  <strong>{webGpuStatus.supported ? 'Browser support: ready' : 'Browser support: not available'}</strong>
                  {webGpuStatus.adapterName && ` — ${webGpuStatus.adapterName}`}
                  {!webGpuStatus.supported && webGpuStatus.reason && <span> {webGpuStatus.reason}</span>}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#1B0A3B] dark:text-stone-100 mb-2">Choose a model</label>
                <div className="space-y-2">
                  {WEBL_MODELS.map((model) => {
                    const selected = config.provider === 'webllm' && config.model === model.id;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          handleProviderSelect('webllm');
                          handleModelSelect(model.id);
                        }}
                        className={`w-full min-h-11 text-left rounded-lg border px-3.5 py-3 transition-colors ${selected ? 'border-[#1D9E75] bg-[#1D9E75]/5' : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900'}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#1B0A3B] dark:text-stone-100">{model.name}</span>
                          <span className="text-xs text-stone-500">{model.size}</span>
                        </div>
                        <span className="block mt-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{model.description}</span>
                        <span className="block mt-1 text-xs text-stone-500">{model.recommendedFor} · {model.memoryReq}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-stone-200 dark:border-stone-800 pt-3 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                <strong className="text-[#1B0A3B] dark:text-stone-100">Privacy:</strong> when using WebGPU, processing happens in the browser and the model is cached locally.
              </div>
            </div>

            <details className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/30">
              <summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-semibold text-[#1B0A3B] dark:text-stone-100">Device and model guidance</summary>
              <div className="px-4 pb-4 text-sm text-stone-600 dark:text-stone-400 leading-relaxed space-y-2">
                <p><strong className="text-[#1B0A3B] dark:text-stone-100">Smaller models:</strong> better suited to phones, tablets and older computers.</p>
                <p><strong className="text-[#1B0A3B] dark:text-stone-100">Medium models:</strong> a useful balance for many everyday laptops and desktops.</p>
                <p><strong className="text-[#1B0A3B] dark:text-stone-100">Larger models:</strong> need more memory and a more powerful computer.</p>
                <p className="text-xs">The existing model choices remain unchanged.</p>
              </div>
            </details>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Intermediate — Basic setup"
          description="Connect Pessoa to an AI app on your computer. Choose the app you already use, then use the saved connection details."
          open={openSection === 'intermediate'}
          onToggle={() => toggleSection('intermediate')}
        />

        {openSection === 'intermediate' && (
          <div className="space-y-3 pl-0 sm:pl-2">
            <div className="grid grid-cols-1 gap-2">
              {intermediateProviders.map((provider) => {
                const preset = PROVIDER_PRESETS[provider];
                const selected = config.provider === provider;
                return (
                  <div key={provider} className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => openProviderGuide(provider)}
                      className="w-full min-h-11 text-left px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-stone-50 dark:hover:bg-stone-900"
                    >
                      <span className="min-w-0">
                        <span className={`block text-sm font-semibold ${selected ? 'text-[#1D9E75]' : 'text-[#1B0A3B] dark:text-stone-100'}`}>{preset.name}</span>
                        <span className="block mt-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{preset.description}</span>
                      </span>
                      {showGuideFor === provider ? <ChevronUp className="w-5 h-5 shrink-0" /> : <ChevronDown className="w-5 h-5 shrink-0" />}
                    </button>

                    {showGuideFor === provider && (
                      <ProviderSetup
                        provider={provider}
                        meta={PROVIDER_INSTRUCTIONS[provider]}
                        config={config}
                        health={health}
                        isTesting={isTesting}
                        onTest={() => runHealthCheck(config)}
                        onModelSelect={handleModelSelect}
                        onConfigChange={setConfig}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Advanced — Cloud or private server setup"
          description="Use your own private AI server or a cloud AI service. Choose this only if you already know how your server or API is set up."
          open={openSection === 'advanced'}
          onToggle={() => toggleSection('advanced')}
        />

        {openSection === 'advanced' && (
          <div className="space-y-3 pl-0 sm:pl-2">
            {(['custom', 'gemini'] as LocalAIProvider[]).map((provider) => {
              const meta = PROVIDER_INSTRUCTIONS[provider];
              const selected = config.provider === provider;
              const title = provider === 'custom' ? 'Custom OpenAI-compatible server' : 'Gemini Cloud API';
              const description = provider === 'custom'
                ? 'Connect to a private server such as vLLM, Text-Generation-WebUI or LocalAI, or another OpenAI-compatible endpoint.'
                : 'Use Pessoa with the Gemini cloud service when you choose a cloud connection.';
              return (
                <div key={provider} className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => openProviderGuide(provider)}
                    className="w-full min-h-11 text-left px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-stone-50 dark:hover:bg-stone-900"
                  >
                    <span className="min-w-0">
                      <span className={`block text-sm font-semibold ${selected ? 'text-[#1D9E75]' : 'text-[#1B0A3B] dark:text-stone-100'}`}>{title}</span>
                      <span className="block mt-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{description}</span>
                    </span>
                    {showGuideFor === provider ? <ChevronUp className="w-5 h-5 shrink-0" /> : <ChevronDown className="w-5 h-5 shrink-0" />}
                  </button>

                  {showGuideFor === provider && (
                    <ProviderSetup
                      provider={provider}
                      meta={meta}
                      config={config}
                      health={health}
                      isTesting={isTesting}
                      onTest={() => runHealthCheck(config)}
                      onModelSelect={handleModelSelect}
                      onConfigChange={setConfig}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Guidance & privacy"
          description="Choose how Pessoa should support your work. These settings help it protect your voice, use citations carefully, and avoid pretending it knows something it cannot verify."
          open={openSection === 'guidance'}
          onToggle={() => toggleSection('guidance')}
        />

        {openSection === 'guidance' && (
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-4 sm:p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#912A4A] shrink-0 mt-0.5" />
              <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                <p className="text-[#1B0A3B] dark:text-stone-100 font-semibold">Privacy and responsible AI guidance</p>
                <p className="mt-1">Pessoa keeps the existing safety, privacy and AI guidance behaviour. This section simply makes those choices easier to understand.</p>
              </div>
            </div>

            {config.provider !== 'gemini' && (
              <div className="space-y-3">
                <SettingToggle
                  label="Strict offline mode"
                  description="Blocks outbound web calls when local AI cannot be used."
                  checked={config.strictOffline}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, strictOffline: checked }))}
                />
                <SettingToggle
                  label="Allow cloud fallback"
                  description="Allows Pessoa to use Gemini Cloud if your local AI is unavailable."
                  checked={config.autoFallback}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, autoFallback: checked }))}
                />
              </div>
            )}

            <div className="rounded-lg bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 p-3.5 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              <strong className="text-[#1B0A3B] dark:text-stone-100">Current connection:</strong> {selectedMeta.name}. {selectedMeta.offlineSecurity}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          className="min-h-11 font-sans text-sm bg-[#912A4A] hover:bg-[#78223d] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          Apply & Save AI Configuration
        </button>
        {saveSuccess && (
          <span className="text-sm font-semibold text-[#1D9E75] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Settings saved successfully.
          </span>
        )}
      </form>
    </div>
  );
}

function ProviderSetup({
  provider,
  meta,
  config,
  health,
  isTesting,
  onTest,
  onModelSelect,
  onConfigChange,
}: {
  provider: LocalAIProvider;
  meta: (typeof PROVIDER_INSTRUCTIONS)[LocalAIProvider];
  config: LocalAIConfig;
  health: LocalHealthResult;
  isTesting: boolean;
  onTest: () => void;
  onModelSelect: (model: string) => void;
  onConfigChange: React.Dispatch<React.SetStateAction<LocalAIConfig>>;
}) {
  return (
    <div className="border-t border-stone-200 dark:border-stone-800 px-4 py-4 space-y-4">
      <div className="space-y-2 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
        <p className="font-semibold text-[#1B0A3B] dark:text-stone-100">How to connect</p>
        <ol className="list-decimal list-inside space-y-1.5">
          {meta.installationSteps.map((step, index) => <li key={index}>{step}</li>)}
        </ol>
        <p><strong className="text-[#1B0A3B] dark:text-stone-100">You need:</strong> {meta.prerequisites.join(', ')}</p>
      </div>

      {provider !== 'gemini' && provider !== 'webllm' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm text-stone-600 dark:text-stone-400">
              <span className="block mb-1 font-semibold text-[#1B0A3B] dark:text-stone-100">Server URL</span>
              <input
                type="text"
                value={config.baseUrl}
                onChange={(e) => onConfigChange((prev) => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="e.g. http://localhost:11434"
                className="w-full min-h-11 px-3 py-2 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
            </label>
            <label className="block text-sm text-stone-600 dark:text-stone-400">
              <span className="block mb-1 font-semibold text-[#1B0A3B] dark:text-stone-100">API key (optional)</span>
              <input
                type="password"
                value={config.apiKey || ''}
                onChange={(e) => onConfigChange((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Leave blank if not required"
                className="w-full min-h-11 px-3 py-2 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={onTest} className="min-h-11 px-4 py-2 text-sm font-medium rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900">
              {isTesting ? <span className="inline-flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Testing connection...</span> : 'Test connection'}
            </button>
            {!isTesting && health.status === 'connected' && <span className="text-sm text-[#1D9E75] inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Connected{health.latencyMs ? ` (${health.latencyMs}ms)` : ''}</span>}
            {!isTesting && health.status === 'offline' && <span className="text-sm text-amber-700 dark:text-amber-300 inline-flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Local server offline</span>}
          </div>

          {health.details && <p className="text-xs font-mono text-stone-500 bg-stone-50 dark:bg-stone-900/50 p-3 rounded-lg break-words">{health.details}</p>}

          {health.detectedModels.length > 0 && (
            <div className="space-y-2">
              <span className="block text-sm font-semibold text-[#1B0A3B] dark:text-stone-100">Models found on this device</span>
              <div className="flex flex-wrap gap-2">
                {health.detectedModels.map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => onModelSelect(model)}
                    className={`min-h-11 px-3 rounded-lg border text-sm font-mono ${config.model === model ? 'bg-[#1D9E75]/10 border-[#1D9E75] text-[#1B0A3B] dark:text-stone-100' : 'border-stone-200 dark:border-stone-800'}`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {provider === 'webllm' && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-[#1B0A3B] dark:text-stone-100">Browser model</label>
          <div className="grid grid-cols-1 gap-2">
            {WEBL_MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => onModelSelect(model.id)}
                className={`min-h-11 text-left px-3 py-3 rounded-lg border ${config.model === model.id ? 'border-[#1D9E75] bg-[#1D9E75]/5' : 'border-stone-200 dark:border-stone-800'}`}
              >
                <span className="text-sm font-semibold text-[#1B0A3B] dark:text-stone-100">{model.name}</span>
                <span className="block mt-1 text-sm text-stone-600 dark:text-stone-400">{model.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {provider !== 'gemini' && provider !== 'webllm' && (
        <div className="space-y-3 border-t border-stone-200 dark:border-stone-800 pt-3">
          <label className="block text-sm font-semibold text-[#1B0A3B] dark:text-stone-100">Model name</label>
          <input
            type="text"
            value={config.model}
            onChange={(e) => onConfigChange((prev) => ({ ...prev, model: e.target.value }))}
            placeholder="e.g. llama3.2, qwen2.5, mistral"
            className="w-full min-h-11 px-3 py-2 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-sm rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OPEN_WEIGHT_MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => onModelSelect(model.defaultOllamaName)}
                className={`min-h-11 text-left px-3 py-2.5 rounded-lg border ${config.model === model.defaultOllamaName ? 'border-[#1D9E75] bg-[#1D9E75]/5' : 'border-stone-200 dark:border-stone-800'}`}
              >
                <span className="block text-sm font-semibold text-[#1B0A3B] dark:text-stone-100">{model.name}</span>
                <span className="block mt-1 text-xs text-stone-500 leading-relaxed">{model.recommendedFor}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-stone-200 dark:border-stone-800 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
        <strong className="text-[#1B0A3B] dark:text-stone-100">Privacy:</strong> {meta.offlineSecurity}
      </div>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="min-h-11 flex items-center justify-between gap-4 rounded-lg border border-stone-200 dark:border-stone-800 px-3.5 py-3 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900">
      <span>
        <span className="block text-sm font-semibold text-[#1B0A3B] dark:text-stone-100">{label}</span>
        <span className="block mt-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 shrink-0 accent-[#1D9E75]"
      />
    </label>
  );
}
