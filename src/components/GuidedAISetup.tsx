import React, { useMemo, useState } from 'react';
import { checkWebGPUSupport, getOrInitWebLLMEngine, WEBL_MODELS } from '../lib/webLlmService';

type Expertise = 'beginner' | 'intermediate' | 'advanced';
type Device = 'android' | 'ios' | 'windows' | 'mac' | 'other';
type AndroidVersion = 'older' | '12plus' | 'unknown';

const burgundy = '#912A4A';
const indigo = '#1B0A3B';
const teal = '#1D9E75';

export default function GuidedAISetup() {
  const [expertise, setExpertise] = useState<Expertise | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [androidVersion, setAndroidVersion] = useState<AndroidVersion | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [browserCheck, setBrowserCheck] = useState<'idle' | 'checking' | 'supported' | 'unsupported'>('idle');
  const [browserReason, setBrowserReason] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'ready' | 'error'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadMessage, setDownloadMessage] = useState('');
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const ready = !!expertise && !!device && (device !== 'android' || !!androidVersion);

  const reset = () => {
    setExpertise(null);
    setDevice(null);
    setAndroidVersion(null);
    setShowResult(false);
    setBrowserCheck('idle');
    setBrowserReason(null);
    setDownloadState('idle');
    setDownloadProgress(0);
    setDownloadMessage('');
    setDownloadError(null);
  };

  const route = useMemo(() => {
    if (device === 'android') {
      if (androidVersion === 'older') return 'app';
      if (androidVersion === '12plus' || androidVersion === 'unknown') return 'browser';
      return 'unknown';
    }
    // Windows, Mac, iPhone/iPad and other devices first try the simple browser route.
    // If WebGPU is unavailable, the result screen gives the appropriate local-app alternative.
    return 'browser';
  }, [device, androidVersion]);

  const showSetup = async () => {
    setShowResult(true);
    setBrowserCheck('idle');
    setBrowserReason(null);
    setDownloadState('idle');
    setDownloadProgress(0);
    setDownloadMessage('');
    setDownloadError(null);

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
    const model = WEBL_MODELS.find((item) => item.isDefault) || WEBL_MODELS[0];
    setDownloadState('downloading');
    setDownloadProgress(0);
    setDownloadMessage('Starting download…');
    setDownloadError(null);
    try {
      await getOrInitWebLLMEngine(model.id, (report) => {
        setDownloadProgress(Math.max(0, Math.min(100, Math.round((report.progress || 0) * 100))));
        setDownloadMessage(report.text || 'Downloading model…');
      });
      setDownloadProgress(100);
      setDownloadMessage('Model ready on this device.');
      setDownloadState('ready');
    } catch (error: any) {
      setDownloadState('error');
      setDownloadError(error?.message || 'The model could not be downloaded. Check your internet connection, available storage, and browser permissions, then try again.');
    }
  };

  return (
    <div className="w-full space-y-8 text-left font-sans">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold" style={{ color: indigo }}>Let's set up AI for your device</h2>
        <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">Tell Pessoa a little about your device and experience. We'll show you the simplest setup for you.</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold" style={{ color: indigo }}>1. How comfortable are you with technology?</h3>
        <div className="space-y-2">
          {[
            ['beginner', 'Beginner', 'I want step-by-step instructions.'],
            ['intermediate', 'Intermediate', 'I know my way around apps and settings.'],
            ['advanced', 'Advanced', "I'm comfortable installing and configuring AI tools."],
          ].map(([id, label, description]) => (
            <label key={id} className="flex items-start gap-3 cursor-pointer py-2">
              <input type="radio" name="expertise" value={id} checked={expertise === id} onChange={() => setExpertise(id as Expertise)} className="mt-1 h-4 w-4" style={{ accentColor: teal }} />
              <span><span className="block text-sm font-semibold" style={{ color: indigo }}>{label}</span><span className="block mt-0.5 text-sm text-stone-600 dark:text-stone-400">{description}</span></span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold" style={{ color: indigo }}>2. What device are you using?</h3>
        <div className="space-y-2">
          {[
            ['android', 'Android phone or tablet'],
            ['ios', 'iPhone or iPad'],
            ['windows', 'Windows computer'],
            ['mac', 'Mac'],
            ['other', 'Other'],
          ].map(([id, label]) => (
            <label key={id} className="flex items-center gap-3 cursor-pointer py-1.5">
              <input type="radio" name="device" value={id} checked={device === id} onChange={() => { setDevice(id as Device); setAndroidVersion(null); setShowResult(false); setBrowserCheck('idle'); setBrowserReason(null); setDownloadState('idle'); setDownloadError(null); }} className="h-4 w-4" style={{ accentColor: teal }} />
              <span className="text-sm" style={{ color: indigo }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {device === 'android' && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold" style={{ color: indigo }}>3. Which Android version?</h3>
          <div className="space-y-2">
            {[
              ['older', 'Android 11 or earlier'],
              ['12plus', 'Android 12 or later'],
              ['unknown', "I don't know"],
            ].map(([id, label]) => (
              <label key={id} className="flex items-center gap-3 cursor-pointer py-1.5">
                <input type="radio" name="android-version" value={id} checked={androidVersion === id} onChange={() => { setAndroidVersion(id as AndroidVersion); setShowResult(false); setBrowserCheck('idle'); setBrowserReason(null); setDownloadState('idle'); setDownloadError(null); }} className="h-4 w-4" style={{ accentColor: teal }} />
                <span className="text-sm" style={{ color: indigo }}>{label}</span>
              </label>
            ))}
          </div>
          {androidVersion === 'unknown' && <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">Open Settings → About phone or tablet → Android version.</p>}
        </div>
      )}

      {ready && !showResult && (
        <button type="button" onClick={showSetup} className="min-h-11 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors" style={{ backgroundColor: burgundy }}>Show my setup</button>
      )}

      {showResult && ready && (
        <div className="space-y-6 border-t border-stone-200 dark:border-stone-800 pt-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold" style={{ color: indigo }}>Your recommended setup</h3>
            <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">We've kept this as simple as possible for your device and experience.</p>
          </div>

          {route === 'app' ? (
            <>
              <SetupStep number={1} title="Install an AI app"><p>Use <strong>PocketPal AI</strong> or <strong>Maid</strong>.</p><p className="mt-1">These are options for older Android devices that cannot use browser AI.</p></SetupStep>
              <SetupStep number={2} title="Choose a small model"><p><strong>Qwen 2.5 0.5B-Instruct</strong> — about 380 MB</p><p className="mt-1"><strong>SmolLM2 360M</strong> — a very small model for low-memory devices.</p></SetupStep>
              <SetupStep number={3} title="Download the model"><p>You'll need internet for the first download. The model stays on your device afterwards.</p></SetupStep>
              <SetupStep number={4} title="Connect Pessoa"><p>Once your AI app and model are ready, use its local connection details to connect Pessoa.</p></SetupStep>
            </>
          ) : browserCheck === 'checking' ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold" style={{ color: indigo }}>Checking your device…</p>
              <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">Pessoa is checking whether your browser can run AI on this device.</p>
            </div>
          ) : browserCheck === 'unsupported' ? (
            <>
              <div className="space-y-2">
                <p className="text-sm font-semibold" style={{ color: burgundy }}>Browser AI isn't available on this device.</p>
                <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">That's OK. You can still use AI with Pessoa.</p>
                {browserReason && <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-500">{browserReason}</p>}
              </div>
              {device === 'android' ? (
                <>
                  <SetupStep number={1} title="Use an AI app on your phone"><p>Try <strong>PocketPal AI</strong> or <strong>Maid</strong>. These can run AI models directly on your Android device.</p></SetupStep>
                  <SetupStep number={2} title="Choose a small model"><p>Start with a small model that fits your phone's available memory.</p></SetupStep>
                  <SetupStep number={3} title="Connect Pessoa"><p>Once the app and model are ready, use the connection details provided by the app to connect Pessoa.</p></SetupStep>
                </>
              ) : (
                <>
                  <SetupStep number={1} title="Use a local AI app"><p>Try <strong>Ollama</strong> or <strong>LM Studio</strong> on your computer.</p></SetupStep>
                  <SetupStep number={2} title="Choose a small model"><p>Start with a model that fits your computer's available memory and storage.</p></SetupStep>
                  <SetupStep number={3} title="Connect Pessoa"><p>Once the app and model are ready, use the connection details provided by the app to connect Pessoa.</p></SetupStep>
                </>
              )}
            </>
          ) : (
            <>
              <SetupStep number={1} title="Check your browser"><p>Browser AI is available on this device.</p></SetupStep>
              <SetupStep number={2} title="Choose a model"><p><strong>Recommended: Qwen 2.5 3B</strong> — about 1.9 GB</p><p className="mt-1">This is the starting model for browser AI.</p></SetupStep>
              <SetupStep number={3} title="Download the model">
                <p>Select <strong>Download</strong>. You need internet the first time. The model is saved on your device.</p>
                <div className="mt-3 space-y-2">
                  <button type="button" onClick={downloadBrowserModel} disabled={downloadState === 'downloading' || downloadState === 'ready'} className="min-h-10 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" style={{ backgroundColor: teal }}>
                    {downloadState === 'downloading' ? `Downloading… ${downloadProgress}%` : downloadState === 'ready' ? 'Model ready' : 'Download model'}
                  </button>
                  {downloadState === 'downloading' && <p className="text-xs text-stone-500">{downloadMessage}</p>}
                  {downloadState === 'ready' && <p className="text-sm text-stone-600 dark:text-stone-400">The model is saved on this device. You can now use browser AI in Pessoa.</p>}
                  {downloadState === 'error' && <p className="text-sm text-stone-600 dark:text-stone-400">{downloadError}</p>}
                </div>
              </SetupStep>
              <SetupStep number={4} title="You're ready"><p>Pessoa can now use the model in your browser. Processing happens on your device.</p></SetupStep>
            </>
          )}

          {expertise !== 'beginner' && <div className="pt-2 text-sm text-stone-600 dark:text-stone-400">You can explore more AI connection options below if you want more control.</div>}
          <button type="button" onClick={reset} className="text-sm font-semibold hover:underline" style={{ color: indigo }}>Change my answers</button>
        </div>
      )}
    </div>
  );
}

function SetupStep({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return <div className="space-y-2"><p className="text-sm font-semibold" style={{ color: indigo }}>{number}. {title}</p><div className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">{children}</div></div>;
}