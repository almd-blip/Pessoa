import React, { useMemo, useState } from 'react';
import { checkWebGPUSupport, getOrInitWebLLMEngine, WEBL_MODELS } from '../lib/webLlmService';

type Expertise = 'beginner' | 'intermediate' | 'advanced';
type Device = 'android' | 'ios' | 'windows' | 'mac' | 'other';
type AndroidVersion = 'older' | '12plus' | 'unknown';

const burgundy = '#912A4A';
const indigo = '#1B0A3B';
const teal = '#1D9E75';

function model(id: string) { return WEBL_MODELS.find((item) => item.id === id); }

function getBrowserModels(expertise: Expertise, device: Device): typeof WEBL_MODELS {
  const ids = expertise === 'beginner'
    ? (device === 'windows' || device === 'mac' || device === 'other'
      ? ['SmolLM2-360M-Instruct-q4f16_1-MLC', 'Llama-3.2-1B-Instruct-q4f16_1-MLC', 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC']
      : ['SmolLM2-360M-Instruct-q4f16_1-MLC', 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', 'Llama-3.2-1B-Instruct-q4f16_1-MLC'])
    : expertise === 'intermediate'
      ? ['Qwen2.5-1.5B-Instruct-q4f16_1-MLC', 'SmolLM2-1.7B-Instruct-q4f16_1-MLC', 'Qwen2.5-3B-Instruct-q4f16_1-MLC']
      : (device === 'windows' || device === 'mac' || device === 'other'
        ? ['Qwen2.5-3B-Instruct-q4f16_1-MLC', 'Llama-3.2-3B-Instruct-q4f16_1-MLC', 'Qwen2.5-7B-Instruct-q4f16_1-MLC']
        : ['Qwen2.5-1.5B-Instruct-q4f16_1-MLC', 'Qwen2.5-3B-Instruct-q4f16_1-MLC', 'Llama-3.2-3B-Instruct-q4f16_1-MLC']);
  return ids.map(model).filter(Boolean) as typeof WEBL_MODELS;
}

function getLocalServerOptions(expertise: Expertise, device: Device, androidVersion: AndroidVersion | null) {
  if (device === 'android' && androidVersion === 'older') {
    return expertise === 'beginner'
      ? [{ name: 'Termux + llama-server', url: 'http://127.0.0.1:8080/v1', model: 'Qwen 2.5 0.5B Instruct', detail: 'A lightweight local AI server for older Android devices.' }]
      : [
          { name: 'Termux + llama-server', url: 'http://127.0.0.1:8080/v1', model: 'Qwen 2.5 0.5B Instruct', detail: 'Lightweight and suitable for lower-memory Android devices.' },
          { name: 'Termux + Ollama', url: 'http://127.0.0.1:11434/v1', model: 'A small compatible model', detail: 'Run an Ollama server locally through Termux.' },
          { name: 'KoboldCpp', url: 'http://127.0.0.1:5001/v1', model: 'A small GGUF model', detail: 'Another local server option with an HTTP API.' },
        ];
  }
  if (device === 'windows' || device === 'mac' || device === 'other') {
    return expertise === 'beginner'
      ? [{ name: 'Ollama', url: 'http://localhost:11434/v1', model: 'A small model', detail: 'A simple local AI server for your computer.' }]
      : [
          { name: 'Ollama', url: 'http://localhost:11434/v1', model: 'A small model', detail: 'Simple local AI server.' },
          { name: 'LM Studio', url: 'http://localhost:1234/v1', model: 'A small model', detail: 'Desktop app with a Local Server option.' },
          { name: 'Jan', url: 'http://localhost:1337/v1', model: 'A small model', detail: 'Desktop AI app with a local server.' },
          { name: 'KoboldCpp', url: 'http://localhost:5001/v1', model: 'A small GGUF model', detail: 'Local GGUF model server.' },
        ];
  }
  return [{ name: 'Compatible local AI server', url: 'Your server address', model: 'A compatible model', detail: 'Use an OpenAI-compatible local server that you already have running.' }];
}

export default function GuidedAISetup() {
  const [expertise, setExpertise] = useState<Expertise | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [androidVersion, setAndroidVersion] = useState<AndroidVersion | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [browserCheck, setBrowserCheck] = useState<'idle' | 'checking' | 'supported' | 'unsupported'>('idle');
  const [browserReason, setBrowserReason] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'ready' | 'error'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadMessage, setDownloadMessage] = useState('');
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const ready = !!expertise && !!device && (device !== 'android' || !!androidVersion);
  const browserModels = useMemo(() => expertise && device ? getBrowserModels(expertise, device) : [], [expertise, device]);
  const selectedModel = browserModels.find((item) => item.id === selectedModelId) || browserModels[0] || null;

  const resetDownload = () => { setDownloadState('idle'); setDownloadProgress(0); setDownloadMessage(''); setDownloadError(null); };
  const reset = () => { setExpertise(null); setDevice(null); setAndroidVersion(null); setShowResult(false); setBrowserCheck('idle'); setBrowserReason(null); setSelectedModelId(null); resetDownload(); };

  const route = useMemo(() => {
    if (device === 'android' && androidVersion === 'older') return 'local';
    return 'browser';
  }, [device, androidVersion]);

  const showSetup = async () => {
    setShowResult(true); setBrowserCheck('idle'); setBrowserReason(null); setSelectedModelId(null); resetDownload();
    if (route === 'browser') {
      setBrowserCheck('checking');
      try {
        const capability = await checkWebGPUSupport();
        setBrowserCheck(capability.supported ? 'supported' : 'unsupported');
        setBrowserReason(capability.reason || null);
      } catch (error: any) {
        setBrowserCheck('unsupported');
        setBrowserReason(error?.message || 'Pessoa could not confirm browser AI support on this device.');
      }
    }
  };

  const downloadBrowserModel = async () => {
    if (!selectedModel) return;
    setDownloadState('downloading'); setDownloadProgress(0); setDownloadMessage('Starting download…'); setDownloadError(null);
    try {
      await getOrInitWebLLMEngine(selectedModel.id, (report) => {
        const progress = Math.max(0, Math.min(100, Math.round((report.progress || 0) * 100)));
        setDownloadProgress(progress); setDownloadMessage(report.text || 'Downloading model…');
      });
      setDownloadProgress(100); setDownloadMessage('Model ready on this device.'); setDownloadState('ready');
    } catch (error: any) {
      console.error('Pessoa browser AI model download failed:', error);
      setDownloadState('error');
      setDownloadError(error?.message || 'The model could not be downloaded. Check your internet connection, browser storage and permissions, then try again.');
    }
  };

  return (
    <div className="w-full space-y-8 text-left font-sans">
      <div className="space-y-2"><h2 className="text-xl font-semibold" style={{ color: indigo }}>Let's set up AI for your device</h2><p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">Tell Pessoa a little about your device and experience. We'll show you the simplest setup for you.</p></div>
      <div className="space-y-3"><h3 className="text-base font-semibold" style={{ color: indigo }}>1. How comfortable are you with technology?</h3><div className="space-y-2">
        {[
          ['beginner', 'Beginner', 'I want step-by-step instructions.'],
          ['intermediate', 'Intermediate', 'I know my way around apps and settings.'],
          ['advanced', 'Advanced', "I'm comfortable installing and configuring AI tools."],
        ].map(([id, label, description]) => <label key={id} className="flex items-start gap-3 cursor-pointer py-2"><input type="radio" name="expertise" value={id} checked={expertise === id} onChange={() => { setExpertise(id as Expertise); setShowResult(false); resetDownload(); }} className="mt-1 h-4 w-4" style={{ accentColor: teal }} /><span><span className="block text-sm font-semibold" style={{ color: indigo }}>{label}</span><span className="block mt-0.5 text-sm text-stone-600 dark:text-stone-400">{description}</span></span></label>)}
      </div></div>
      <div className="space-y-3"><h3 className="text-base font-semibold" style={{ color: indigo }}>2. What device are you using?</h3><div className="space-y-2">
        {[
          ['android', 'Android phone or tablet'], ['ios', 'iPhone or iPad'], ['windows', 'Windows computer'], ['mac', 'Mac'], ['other', 'Other'],
        ].map(([id, label]) => <label key={id} className="flex items-center gap-3 cursor-pointer py-1.5"><input type="radio" name="device" value={id} checked={device === id} onChange={() => { setDevice(id as Device); setAndroidVersion(null); setShowResult(false); setBrowserCheck('idle'); setBrowserReason(null); resetDownload(); }} className="h-4 w-4" style={{ accentColor: teal }} /><span className="text-sm" style={{ color: indigo }}>{label}</span></label>)}
      </div></div>
      {device === 'android' && <div className="space-y-3"><h3 className="text-base font-semibold" style={{ color: indigo }}>3. Which Android version?</h3><div className="space-y-2">
        {[
          ['older', 'Android 11 or earlier'], ['12plus', 'Android 12 or later'], ['unknown', "I don't know"],
        ].map(([id, label]) => <label key={id} className="flex items-center gap-3 cursor-pointer py-1.5"><input type="radio" name="android-version" value={id} checked={androidVersion === id} onChange={() => { setAndroidVersion(id as AndroidVersion); setShowResult(false); setBrowserCheck('idle'); setBrowserReason(null); resetDownload(); }} className="h-4 w-4" style={{ accentColor: teal }} /><span className="text-sm" style={{ color: indigo }}>{label}</span></label>)}
      </div>{androidVersion === 'unknown' && <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">Open Settings → About phone or tablet → Android version.</p>}</div>}
      {ready && !showResult && <button type="button" onClick={showSetup} className="min-h-11 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors" style={{ backgroundColor: burgundy }}>Show my setup</button>}
      {showResult && ready && <div className="space-y-6 border-t border-stone-200 dark:border-stone-800 pt-6"><div className="space-y-2"><h3 className="text-lg font-semibold" style={{ color: indigo }}>Your recommended setup</h3><p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">We've kept this as simple as possible for your device and experience.</p></div>
        {route === 'local' ? <LocalServerGuide expertise={expertise!} device={device!} androidVersion={androidVersion} /> : browserCheck === 'checking' ? <div className="space-y-2"><p className="text-sm font-semibold" style={{ color: indigo }}>Checking your device…</p><p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">Pessoa is checking whether your browser can run AI on this device.</p></div> : browserCheck === 'unsupported' ? <LocalServerGuide expertise={expertise!} device={device!} androidVersion={androidVersion} browserReason={browserReason} /> : <>
          <SetupStep number={1} title="Your device can use browser AI"><p><strong>Browser AI is available on this device.</strong></p><p className="mt-1">Pessoa can run AI directly in your browser. You do not need to install a separate AI app or runtime.</p></SetupStep>
          <SetupStep number={2} title="Choose your AI model"><p>Pessoa has selected models based on your experience level and device. Smaller models need less space and memory; larger models can be more capable.</p><div className="mt-4 space-y-4">{browserModels.map((m, index) => <label key={m.id} className="flex items-start gap-3 cursor-pointer py-2"><input type="radio" name="browser-model" checked={(selectedModel?.id || '') === m.id} onChange={() => { setSelectedModelId(m.id); resetDownload(); }} className="mt-1 h-4 w-4" style={{ accentColor: teal }} /><span><span className="block text-sm font-semibold" style={{ color: indigo }}>{index === 0 ? 'Recommended: ' : ''}{m.name}</span><span className="block mt-1 text-xs text-stone-500">{m.size} · {m.recommendedFor}</span></span></label>)}</div></SetupStep>
          <SetupStep number={3} title="Download your AI model"><p>You need internet the first time. The model is saved on your device, so you will not need to download it again.</p><div className="mt-3 space-y-2"><button type="button" onClick={downloadBrowserModel} disabled={!selectedModel || downloadState === 'downloading' || downloadState === 'ready'} className="min-h-10 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" style={{ backgroundColor: teal }}>{downloadState === 'downloading' ? `Downloading… ${downloadProgress}%` : downloadState === 'ready' ? 'Model ready' : `Download ${selectedModel?.name || 'model'}`}</button>{downloadState === 'downloading' && <><div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"><div className="h-full bg-[#1D9E75] transition-all" style={{ width: `${downloadProgress}%` }} /></div><p className="text-xs text-stone-500">{downloadMessage}</p></>}{downloadState === 'error' && <p className="text-sm text-stone-600 dark:text-stone-400">{downloadError}</p>}{downloadState === 'ready' && <p className="text-sm font-semibold text-[#1D9E75]">✓ Download complete. The model is saved on this device.</p>}</div></SetupStep>
          {downloadState === 'ready' && <SetupStep number={4} title="You're ready"><p><strong>Your AI model is ready.</strong> Pessoa can now use it directly in your browser. Processing happens on this device.</p></SetupStep>}
        </>}
        <button type="button" onClick={reset} className="text-sm font-semibold hover:underline" style={{ color: indigo }}>Change my answers</button>
      </div>}
    </div>
  );
}

function LocalServerGuide({ expertise, device, androidVersion, browserReason }: { expertise: Expertise; device: Device; androidVersion: AndroidVersion | null; browserReason?: string | null }) {
  const options = getLocalServerOptions(expertise, device, androidVersion);
  const beginner = expertise === 'beginner';
  const first = options[0];
  return <div className="space-y-5">
    <div className="space-y-2"><p className="text-sm font-semibold" style={{ color: burgundy }}>{device === 'android' && androidVersion === 'older' ? "Browser AI isn't available on Android 11 or earlier." : "Browser AI isn't available on this device."}</p><p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">That's OK. You can use a local AI server instead. The model runs on your own device and Pessoa connects to the server.</p>{browserReason && <p className="text-xs leading-relaxed text-stone-500">{browserReason}</p>}</div>
    <SetupStep number={1} title={beginner ? `Use ${first.name}` : 'Choose a local AI server'}>{beginner ? <p>{first.detail} {device === 'android' ? 'Termux is a free Android terminal available from F-Droid.' : 'It runs on your computer and provides a local connection for Pessoa.'}</p> : <div className="space-y-3">{options.map((option) => <div key={option.name} className="rounded-lg border border-stone-200 dark:border-stone-700 p-3"><p className="font-semibold" style={{ color: indigo }}>{option.name}</p><p className="mt-1 text-sm">{option.detail}</p><p className="mt-1 text-xs font-mono text-stone-500">{option.url}</p></div>)}</div>}</SetupStep>
    <SetupStep number={2} title="Choose a model"><p>{first.model} is a good starting point for a lower-powered device. You can choose another compatible model once the server is working.</p>{device === 'android' && androidVersion === 'older' && <p className="mt-2">For a device with limited memory, start small. A model around 0.5B parameters is much easier to run than a multi-billion-parameter model.</p>}</SetupStep>
    <SetupStep number={3} title="Start the local server">{device === 'android' && androidVersion === 'older' ? <><p>In Termux, install llama.cpp, download your GGUF model, then start the server.</p><p className="mt-2 font-mono text-xs">llama-server -m qwen2.5-0.5b.gguf --host 127.0.0.1 --port 8080</p></> : <p>Open your chosen app, load the model, and turn on its Local Server or API server option.</p>}</SetupStep>
    <SetupStep number={4} title="Connect Pessoa"><p>In Pessoa's AI settings, choose the custom/local server option and enter the server address shown above. Then test the connection.</p><p className="mt-2 text-xs text-stone-500">If Pessoa is on a different device from the AI server, use the server device's local network address instead of localhost/127.0.0.1, and the server must allow local-network connections.</p></SetupStep>
  </div>;
}

function SetupStep({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return <div className="space-y-2"><p className="text-sm font-semibold" style={{ color: indigo }}>{number}. {title}</p><div className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">{children}</div></div>;
}
