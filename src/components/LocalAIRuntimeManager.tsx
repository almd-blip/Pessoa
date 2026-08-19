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
import { WEBL_MODELS, checkWebGPUSupport, getOrInitWebLLMEngine } from '../lib/webLlmService';
import { CheckCircle2, ChevronDown, ChevronUp, Shield } from 'lucide-react';

interface LocalAIRuntimeManagerProps {
  onConfigSaved?: (config: LocalAIConfig) => void;
  compact?: boolean;
}

const intermediateProviders: LocalAIProvider[] = ['ollama', 'lmstudio', 'gpt4all', 'anythingllm'];
type SettingsSection = 'beginner' | 'intermediate' | 'advanced' | 'guidance';

function SectionHeader({ title, description, open, onToggle }: { title: string; description: string; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} className="w-full min-h-11 text-left flex items-center justify-between gap-4 py-3.5 border-b border-stone-200 dark:border-stone-800 hover:bg-stone-50/50 dark:hover:bg-stone-900/30 transition-colors">
      <span className="min-w-0">
        <span className="block text-base font-semibold text-[#1B0A3B] dark:text-stone-100 leading-snug">{title}</span>
        <span className="block mt-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{description}</span>
      </span>
      <span className="shrink-0 text-[#1D9E75]" aria-hidden="true">{open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</span>
    </button>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-[#1B0A3B] dark:text-stone-100">{number}. {title}</p>
      <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{children}</div>
    </div>
  );
}

export default function LocalAIRuntimeManager({ onConfigSaved, compact = false }: LocalAIRuntimeManagerProps) {
  const [config, setConfig] = useState<LocalAIConfig>(getLocalAIConfig);
  const [health, setHealth] = useState<LocalHealthResult>({ status: 'testing', detectedModels: [] });
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [webGpuStatus, setWebGpuStatus] = useState<{ supported: boolean; adapterName?: string; reason?: string } | null>(null);
  const [openSection, setOpenSection] = useState<SettingsSection | null>('beginner');
  const [showGuideFor, setShowGuideFor] = useState<LocalAIProvider | null>(null);
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadMessage, setDownloadMessage] = useState('');

  useEffect(() => { checkWebGPUSupport().then(setWebGpuStatus); }, []);
  useEffect(() => { runHealthCheck(config); }, [config.provider, config.baseUrl]);

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
    const updated: LocalAIConfig = { ...config, provider, enabled: provider !== 'gemini', baseUrl: newUrl, model: newModel };
    setConfig(updated);
    setShowGuideFor(provider);
  };

  const handleModelSelect = (modelName: string) => setConfig((prev) => ({ ...prev, model: modelName }));

  const handleDownloadModel = async (modelId: string) => {
    if (!webGpuStatus?.supported || downloadingModel) return;
    setConfig((prev) => ({ ...prev, provider: 'webllm', model: modelId, enabled: true }));
    setDownloadingModel(modelId);
    setDownloadProgress(0);
    setDownloadMessage('Starting download…');
    try {
      await getOrInitWebLLMEngine(modelId, (report) => {
        setDownloadProgress(Math.round((report.progress || 0) * 100));
        setDownloadMessage(report.text || 'Downloading model…');
      });
      setDownloadProgress(100);
      setDownloadMessage('Ready to use offline.');
    } catch (error) {
      console.error('Failed to download browser AI model:', error);
      setDownloadProgress(null);
      setDownloadMessage('The download could not be completed. Check your browser and internet connection and try again.');
    } finally {
      setDownloadingModel(null);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveLocalAIConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    onConfigSaved?.(config);
  };

  const toggleSection = (section: SettingsSection) => setOpenSection((current) => (current === section ? null : section));
  const openProviderGuide = (provider: LocalAIProvider) => { handleProviderSelect(provider); setShowGuideFor(provider); };

  return (
    <div className="space-y-4 font-sans text-left" id="local-ai-runtime-manager">
      <div className="space-y-1 text-left">
        <p className="text-base font-semibold text-[#1B0A3B] dark:text-stone-100">Choose how Pessoa connects to offline AI.</p>
        <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">The options below are suggestions to help you get started. Other compatible models and AI services may also be available.</p>
      </div>

      <div className="space-y-3">
        <SectionHeader title="Beginner — Use AI in your browser" description="No AI app to install. Pessoa runs the AI model directly on this device." open={openSection === 'beginner'} onToggle={() => toggleSection('beginner')} />
        {openSection === 'beginner' && (
          <div className="space-y-6 pt-2">
            <Step number={1} title="Check your browser">
              <p>Pessoa checks whether your browser can use <strong>WebGPU</strong>, the technology that lets the AI model run on your device.</p>
              {webGpuStatus && <p className={`mt-3 font-semibold ${webGpuStatus.supported ? 'text-[#1D9E75]' : 'text-amber-700 dark:text-amber-300'}`}><strong>{webGpuStatus.supported ? '✓ Browser ready' : 'Browser not ready'}</strong>{!webGpuStatus.supported && webGpuStatus.reason ? ` — ${webGpuStatus.reason}` : ''}</p>}
            </Step>

            <Step number={2} title="Choose a model">
              <p className="mb-4">Not sure? Start with the recommended model. Smaller models use less space; larger models may be better for more demanding work.</p>
              <div className="space-y-5">
                {WEBL_MODELS.map((model, index) => {
                  const selected = config.provider === 'webllm' && config.model === model.id;
                  return (
                    <div key={model.id} className="text-left">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-[#1B0A3B] dark:text-stone-100">{index === 0 ? 'Recommended: ' : ''}{model.name}</p>
                        <span className="text-xs text-stone-500">{model.size}</span>
                      </div>
                      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{model.description}</p>
                      <p className="mt-1 text-xs text-stone-500">{model.recommendedFor}</p>
                      <button type="button" onClick={() => { handleProviderSelect('webllm'); handleModelSelect(model.id); handleDownloadModel(model.id); }} disabled={!webGpuStatus?.supported || !!downloadingModel} className={`mt-2 min-h-10 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${selected ? 'bg-[#912A4A] text-white' : 'text-[#912A4A] border border-[#912A4A]/40 hover:bg-[#912A4A]/5'} disabled:opacity-50 disabled:cursor-not-allowed`}>{downloadingModel === model.id ? 'Downloading…' : 'Download'}</button>
                    </div>
                  );
                })}
              </div>
            </Step>

            <Step number={3} title="Download the model">
              <p>You need internet access the first time. The model is saved on this device, so you do not have to download it every time.</p>
              <p className="mt-1">Keep this page open while it downloads. The amount of data depends on the model you chose.</p>
              {downloadProgress !== null && <div className="mt-3 space-y-2"><div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"><div className="h-full bg-[#1D9E75] transition-all" style={{ width: `${downloadProgress}%` }} /></div><p className="text-sm">{downloadProgress}% — {downloadMessage}</p></div>}
              {downloadProgress === 100 && !downloadingModel && <p className="mt-2 font-semibold text-[#1D9E75]">✓ Download complete</p>}
            </Step>

            <Step number={4} title="You're ready">
              <p>Pessoa can now use this model in your browser. When you use browser AI, processing happens on this device.</p>
            </Step>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <SectionHeader title="Intermediate — Connect an AI app on your computer" description="Use an AI app such as Ollama or LM Studio. Pessoa will guide you through choosing, installing and connecting it." open={openSection === 'intermediate'} onToggle={() => toggleSection('intermediate')} />
        {openSection === 'intermediate' && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-stone-600 dark:text-stone-400">Choose an app you already use, or choose one to get started. You do not need to understand the technical details.</p>
            <div className="space-y-5">
              {intermediateProviders.map((provider) => {
                const preset = PROVIDER_PRESETS[provider];
                const selected = config.provider === provider;
                return (
                  <div key={provider}>
                    <button type="button" onClick={() => openProviderGuide(provider)} className="w-full min-h-11 text-left flex items-center justify-between gap-3 py-2 hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                      <span className="min-w-0"><span className={`block text-sm font-semibold ${selected ? 'text-[#1D9E75]' : 'text-[#1B0A3B] dark:text-stone-100'}`}>{preset.name}</span><span className="block mt-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{preset.description}</span></span>
                      {showGuideFor === provider ? <ChevronUp className="w-5 h-5 shrink-0 text-[#1D9E75]" /> : <ChevronDown className="w-5 h-5 shrink-0 text-[#1D9E75]" />}
                    </button>
                    {showGuideFor === provider && <ProviderSetup provider={provider} meta={PROVIDER_INSTRUCTIONS[provider]} config={config} health={health} isTesting={isTesting} onTest={() => runHealthCheck(config)} onModelSelect={handleModelSelect} onConfigChange={setConfig} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <SectionHeader title="Advanced — Use your own server or cloud AI" description="Connect Pessoa to a private server or a cloud AI service you have already set up." open={openSection === 'advanced'} onToggle={() => toggleSection('advanced')} />
        {openSection === 'advanced' && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-stone-600 dark:text-stone-400">Choose the kind of connection you have. Pessoa will then ask for only the information it needs.</p>
            {(['custom', 'gemini'] as LocalAIProvider[]).map((provider) => {
              const meta = PROVIDER_INSTRUCTIONS[provider];
              const selected = config.provider === provider;
              const title = provider === 'custom' ? 'Private server' : 'Gemini Cloud API';
              const description = provider === 'custom' ? 'For vLLM, Text-Generation-WebUI, LocalAI, or another OpenAI-compatible server.' : 'Use Pessoa with the Gemini cloud service.';
              return (
                <div key={provider}>
                  <button type="button" onClick={() => openProviderGuide(provider)} className="w-full min-h-11 text-left flex items-center justify-between gap-3 py-2 hover:bg-stone-50/50 dark:hover:bg-stone-900/30">
                    <span className="min-w-0"><span className={`block text-sm font-semibold ${selected ? 'text-[#1D9E75]' : 'text-[#1B0A3B] dark:text-stone-100'}`}>{title}</span><span className="block mt-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{description}</span></span>
                    {showGuideFor === provider ? <ChevronUp className="w-5 h-5 shrink-0 text-[#1D9E75]" /> : <ChevronDown className="w-5 h-5 shrink-0 text-[#1D9E75]" />}
                  </button>
                  {showGuideFor === provider && <ProviderSetup provider={provider} meta={meta} config={config} health={health} isTesting={isTesting} onTest={() => runHealthCheck(config)} onModelSelect={handleModelSelect} onConfigChange={setConfig} />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <SectionHeader title="Guidance & privacy" description="Choose how Pessoa should support your work and handle evidence, citations and uncertainty." open={openSection === 'guidance'} onToggle={() => toggleSection('guidance')} />
        {openSection === 'guidance' && <div className="pt-2"><div className="flex items-start gap-3"><Shield className="w-5 h-5 text-[#912A4A] shrink-0 mt-0.5" /><div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed"><p className="font-semibold text-[#1B0A3B] dark:text-stone-100">Privacy and guidance</p><p className="mt-1">Pessoa can help protect your voice, use citations carefully, and tell you when something cannot be verified.</p></div></div></div>}
      </div>

      <form onSubmit={handleSave} className="flex flex-wrap items-center gap-3 pt-2">
        <button type="submit" className="min-h-11 font-sans text-sm bg-[#912A4A] hover:bg-[#78223d] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer">Apply & Save AI Configuration</button>
        {saveSuccess && <span className="text-sm font-semibold text-[#1D9E75] flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />Settings saved successfully.</span>}
      </form>
    </div>
  );
}

function ProviderSetup({ provider, meta, config, health, isTesting, onTest, onModelSelect, onConfigChange }: {
  provider: LocalAIProvider;
  meta: any;
  config: LocalAIConfig;
  health: LocalHealthResult;
  isTesting: boolean;
  onTest: () => void;
  onModelSelect: (model: string) => void;
  onConfigChange: React.Dispatch<React.SetStateAction<LocalAIConfig>>;
}) {
  return (
    <div className="pt-4 space-y-5">
      <Step number={1} title={provider === 'gemini' ? 'Choose this service' : 'Install or open your AI app'}>
        <div className="space-y-2">{meta?.steps?.map((step: string, index: number) => <p key={index}>{step}</p>)}</div>
        {provider !== 'gemini' && <p className="mt-2">When you have finished installing or opening the app, come back here and continue.</p>}
      </Step>

      {provider !== 'gemini' && <Step number={2} title="Choose a model">
        <label className="block font-semibold text-[#1B0A3B] dark:text-stone-100">AI model<select value={config.model} onChange={(e) => onModelSelect(e.target.value)} className="mt-1.5 w-full min-h-11 bg-transparent border-b border-stone-300 dark:border-stone-700 px-0 text-sm font-normal">{OPEN_WEIGHT_MODELS.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}</select></label>
      </Step>}

      <Step number={provider === 'gemini' ? 2 : 3} title="Connect Pessoa">
        {provider !== 'gemini' && <label className="block font-semibold text-[#1B0A3B] dark:text-stone-100">Server address<input type="url" value={config.baseUrl} onChange={(e) => onConfigChange((prev) => ({ ...prev, baseUrl: e.target.value }))} className="mt-1.5 w-full min-h-11 bg-transparent border-b border-stone-300 dark:border-stone-700 px-0 text-sm font-normal" /></label>}
        <button type="button" onClick={onTest} disabled={isTesting} className="mt-3 min-h-11 rounded-xl px-4 text-sm font-semibold border border-stone-300 dark:border-stone-700">{isTesting ? 'Checking…' : 'Test connection'}</button>
        <span className="ml-3 text-sm text-stone-600 dark:text-stone-400">{health.status}</span>
      </Step>

      <Step number={provider === 'gemini' ? 3 : 4} title="You're ready">
        <p>If the connection test succeeds, Pessoa can use your chosen AI service.</p>
        {provider === 'gemini' && <p className="mt-1">Keep your API credentials private.</p>}
      </Step>
    </div>
  );
}
