/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type BreathPatternId = 'box' | 'calm' | 'gentle';

interface BreathPattern {
  id: BreathPatternId;
  name: string;
  description: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
}

const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: 'box',
    name: 'Box breathing (4-4-4-4)',
    description: 'Equal intervals for steady focus and grounding.',
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
  },
  {
    id: 'calm',
    name: 'Calm presence (4-7-8)',
    description: 'Extended exhale to soothe the nervous system.',
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
  },
  {
    id: 'gentle',
    name: 'Gentle pacing (4-6)',
    description: 'Simple rhythmic flow without breath holds.',
    inhale: 4,
    holdIn: 0,
    exhale: 6,
    holdOut: 0,
  },
];

export default function BreatheExercise() {
  const [selectedPatternId, setSelectedPatternId] = useState<BreathPatternId>('box');
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'holdIn' | 'exhale' | 'holdOut'>('inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Audio ambient synthesizer
  const [audioActive, setAudioActive] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Presence Exercises state
  const [activePresenceTab, setActivePresenceTab] = useState<'sensory' | 'somatic' | 'vision' | 'defusion'>('sensory');
  const [sensoryChecked, setSensoryChecked] = useState<boolean[]>([false, false, false, false, false]);
  const [somaticChecked, setSomaticChecked] = useState<boolean[]>([false, false, false, false]);
  const [visionTimeLeft, setVisionTimeLeft] = useState(30);
  const [visionTimerActive, setVisionTimerActive] = useState(false);
  const [defusionText, setDefusionText] = useState('');
  const [releasedThought, setReleasedThought] = useState<string | null>(null);

  // Vision timer effect
  useEffect(() => {
    let t: any = null;
    if (visionTimerActive && visionTimeLeft > 0) {
      t = setInterval(() => setVisionTimeLeft((v) => v - 1), 1000);
    } else if (visionTimeLeft === 0) {
      setVisionTimerActive(false);
    }
    return () => clearInterval(t);
  }, [visionTimerActive, visionTimeLeft]);

  const activePattern = BREATH_PATTERNS.find((p) => p.id === selectedPatternId) || BREATH_PATTERNS[0];

  // Reset timer on pattern change
  useEffect(() => {
    setIsActive(false);
    setPhase('inhale');
    setPhaseSecondsLeft(activePattern.inhale);
    setCompletedCycles(0);
  }, [selectedPatternId]);

  // Breathing loop timer
  useEffect(() => {
    let timer: any = null;
    if (isActive) {
      timer = setInterval(() => {
        setPhaseSecondsLeft((prev) => {
          if (prev > 1) {
            return prev - 1;
          }

          // Advance phase
          if (phase === 'inhale') {
            if (activePattern.holdIn > 0) {
              setPhase('holdIn');
              return activePattern.holdIn;
            } else {
              setPhase('exhale');
              return activePattern.exhale;
            }
          } else if (phase === 'holdIn') {
            setPhase('exhale');
            return activePattern.exhale;
          } else if (phase === 'exhale') {
            if (activePattern.holdOut > 0) {
              setPhase('holdOut');
              return activePattern.holdOut;
            } else {
              setCompletedCycles((c) => c + 1);
              setPhase('inhale');
              return activePattern.inhale;
            }
          } else {
            setCompletedCycles((c) => c + 1);
            setPhase('inhale');
            return activePattern.inhale;
          }
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, phase, activePattern]);

  // Audio synthesizer cleanup
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const toggleAudio = () => {
    if (audioActive) {
      stopAudio();
      setAudioActive(false);
    } else {
      startAudio();
      setAudioActive(true);
    }
  };

  const startAudio = () => {
    try {
      stopAudio();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noiseSourceRef.current = noise;
      gainNodeRef.current = gain;
    } catch (e) {
      console.warn('Audio synthesis unavailable', e);
    }
  };

  const stopAudio = () => {
    try {
      if (noiseSourceRef.current) {
        noiseSourceRef.current.stop();
        noiseSourceRef.current.disconnect();
        noiseSourceRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('inhale');
    setPhaseSecondsLeft(activePattern.inhale);
    setCompletedCycles(0);
  };

  const getPhasePrompt = () => {
    switch (phase) {
      case 'inhale':
        return 'Inhale slowly and fill your lungs with space';
      case 'holdIn':
        return 'Rest quietly in the stillness';
      case 'exhale':
        return 'Exhale softly and release all tension';
      case 'holdOut':
        return 'Pause gently before your next breath';
    }
  };

  const getPhaseScale = () => {
    if (!isActive) return 1;
    switch (phase) {
      case 'inhale':
        return 1.35;
      case 'holdIn':
        return 1.35;
      case 'exhale':
        return 0.85;
      case 'holdOut':
        return 0.85;
    }
  };

  return (
    <div className="space-y-6 text-left py-2" id="breathe-exercise-module">
      {/* Overview & Intro */}
      <div className="space-y-1.5">
        <h3 className="font-sans font-semibold text-base sm:text-lg text-stone-900 dark:text-stone-100">
          Breathe for calm and presence exercises
        </h3>
        <p className="font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
          An experiential practice area designed for immediate grounding. Use these rhythmic breathing exercises whenever you feel cognitive saturation, writing fatigue, or restless tension.
        </p>
      </div>

      {/* Pattern Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {BREATH_PATTERNS.map((pattern) => {
          const isSelected = pattern.id === selectedPatternId;
          return (
            <button
              key={pattern.id}
              type="button"
              onClick={() => setSelectedPatternId(pattern.id)}
              className={`p-3.5 rounded-md border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75] ${
                isSelected
                  ? 'bg-[#1d9e75]/10 border-[#1d9e75] dark:bg-[#28c093]/15 dark:border-[#28c093] text-stone-900 dark:text-stone-100'
                  : 'bg-stone-50 dark:bg-stone-900/40 border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <div className="font-sans font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                {pattern.name}
              </div>
              <div className="font-sans text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-snug">
                {pattern.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Breathing Arena */}
      <div className="p-6 sm:p-8 bg-stone-50 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 rounded-lg flex flex-col items-start justify-start space-y-8 text-left relative overflow-hidden pl-0 sm:pl-0">
        {/* Animated Expanding / Contracting Circle */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center my-4">
          <motion.div
            className="absolute inset-0 rounded-full bg-[#1d9e75]/15 dark:bg-[#28c093]/20 border-2 border-[#1d9e75]/40 dark:border-[#28c093]/50"
            animate={{
              scale: getPhaseScale(),
            }}
            transition={{
              duration: isActive ? phaseSecondsLeft : 0.8,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#1d9e75]/25 dark:bg-[#28c093]/30 border border-[#1d9e75]/60 dark:border-[#28c093]/70"
            animate={{
              scale: getPhaseScale(),
            }}
            transition={{
              duration: isActive ? phaseSecondsLeft : 0.8,
              ease: 'easeInOut',
            }}
          />

          {/* Central Counter & Phase Label */}
          <div className="relative z-10 space-y-1 text-center">
            <span className="text-3xl sm:text-4xl font-mono font-light text-stone-900 dark:text-stone-100 block">
              {isActive ? phaseSecondsLeft : activePattern.inhale}
            </span>
            <span className="text-xs font-mono font-semibold tracking-wider text-[#1d9e75] dark:text-[#28c093] block">
              {isActive ? (phase === 'holdIn' || phase === 'holdOut' ? 'Hold' : phase) : 'Ready'}
            </span>
          </div>
        </div>

        {/* Phase Prompt / Guidance */}
        <p className="font-sans text-xs sm:text-sm text-stone-700 dark:text-stone-300 italic max-w-md h-6 text-left">
          {isActive ? getPhasePrompt() : 'Click start breathing exercise to begin your practice'}
        </p>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-start gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className="px-5 py-2.5 rounded-md bg-[#1d9e75] hover:bg-[#168260] dark:bg-[#28c093] dark:hover:bg-[#1e9a75] text-white dark:text-stone-950 font-sans text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75]"
          >
            {isActive ? (
              <span>Pause exercise</span>
            ) : (
              <span>Start breathing exercise</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-sans text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75]"
          >
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={toggleAudio}
            className={`px-3.5 py-2.5 rounded-md border text-xs font-sans font-semibold flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75] ${
              audioActive
                ? 'bg-[#1d9e75]/10 border-[#1d9e75] text-[#1d9e75] dark:text-[#28c093]'
                : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
            title="Toggle background ambient tone"
          >
            <span>{audioActive ? 'Ambient tone on' : 'Ambient tone'}</span>
          </button>
        </div>

        {/* Cycles Counter */}
        {completedCycles > 0 && (
          <div className="pt-2 text-[11px] font-mono text-stone-400 dark:text-stone-500">
            Completed cycles: {completedCycles}
          </div>
        )}
      </div>

      {/* SECTION DIVIDER & PRESENCE EXERCISES HEADER */}
      <div className="pt-8 border-t border-stone-200 dark:border-stone-800 space-y-4" id="presence-exercises-section">
        <div className="space-y-1">
          <h3 className="font-sans font-semibold text-base sm:text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>Presence Exercises</span>
          </h3>
          <p className="font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            Grounding practices to pull your focus out of cognitive saturation and reconnect with the immediate present moment.
          </p>
        </div>

        {/* Presence Exercise Selector Tabs */}
        <div className="flex flex-wrap gap-2 pt-1 border-b border-stone-200 dark:border-stone-800 pb-3" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activePresenceTab === 'sensory'}
            onClick={() => setActivePresenceTab('sensory')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activePresenceTab === 'sensory'
                ? 'bg-[#1d9e75] text-white font-semibold shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            5-4-3-2-1 Sensory Grounding
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activePresenceTab === 'somatic'}
            onClick={() => setActivePresenceTab('somatic')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activePresenceTab === 'somatic'
                ? 'bg-[#1d9e75] text-white font-semibold shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            Somatic Anchor Check-In
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activePresenceTab === 'vision'}
            onClick={() => setActivePresenceTab('vision')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activePresenceTab === 'vision'
                ? 'bg-[#1d9e75] text-white font-semibold shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            30s Panoramic Vision
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activePresenceTab === 'defusion'}
            onClick={() => setActivePresenceTab('defusion')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activePresenceTab === 'defusion'
                ? 'bg-[#1d9e75] text-white font-semibold shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            Thought Observer
          </button>
        </div>

        {/* PRESENCE TAB 1: 5-4-3-2-1 SENSORY GROUNDING */}
        {activePresenceTab === 'sensory' && (
          <div className="py-2 space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                5-4-3-2-1 Sensory Grounding Technique
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                A cognitive grounding method to interrupt mental spiraling by anchoring your attention into physical sensory inputs.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {[
                { count: '5', label: 'Things You Can See', detail: 'A detail on your desk, light hitting a surface, a shadow, a color, or a texture nearby.' },
                { count: '4', label: 'Things You Can Feel', detail: 'The soles of your feet on the floor, your back against the seat, your clothes on shoulders, air on skin.' },
                { count: '3', label: 'Things You Can Hear', detail: 'The hum of your laptop fan, distant ambient movement, or your own breathing.' },
                { count: '2', label: 'Things You Can Smell/Taste', detail: 'The scent of coffee/tea, fresh room air, or clean paper.' },
                { count: '1', label: 'Grounding Truth', detail: 'Acknowledge: "I am present right now. I am safe to take this one step at a time."' },
              ].map((item, idx) => {
                const isDone = sensoryChecked[idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const next = [...sensoryChecked];
                      next[idx] = !next[idx];
                      setSensoryChecked(next);
                    }}
                    className={`w-full text-left p-3 rounded-md border transition-all cursor-pointer flex items-start gap-3 ${
                      isDone
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 text-stone-800 dark:text-stone-200'
                        : 'bg-stone-50/50 dark:bg-stone-900/30 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                      isDone ? 'bg-emerald-600 text-white' : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}>
                      {isDone ? '✓' : item.count}
                    </span>
                    <div className="space-y-0.5">
                      <span className={`text-xs font-semibold block ${isDone ? 'text-emerald-800 dark:text-emerald-300 line-through' : 'text-stone-900 dark:text-stone-100'}`}>
                        Notice {item.count} {item.label}
                      </span>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                        {item.detail}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {sensoryChecked.every(Boolean) && (
              <div className="p-3 bg-emerald-100/70 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 rounded-md text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-fadeIn">
                <span>🌿 Sensory grounding reset complete. Your awareness is anchored in the present.</span>
                <button
                  type="button"
                  onClick={() => setSensoryChecked([false, false, false, false, false])}
                  className="text-[11px] underline cursor-pointer hover:text-emerald-950 dark:hover:text-emerald-100"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        )}

        {/* PRESENCE TAB 2: SOMATIC ANCHOR CHECK-IN */}
        {activePresenceTab === 'somatic' && (
          <div className="py-2 space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Somatic Anchor & Tension Check-In
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Long writing or research blocks store hidden physical tension. Tap each step as you release it.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {[
                { title: 'Drop Shoulders & Neck', instruction: 'Lower your shoulders 1 inch away from your ears and let go of held effort in your traps.' },
                { title: 'Unclench Jaw & Tongue', instruction: 'Soft-open your teeth, release your jaw, and let your tongue rest flat on the floor of your mouth.' },
                { title: 'Hand on Collarbone', instruction: 'Place one palm firmly over your upper chest/collarbone and feel 3 steady, comforting heartbeats.' },
                { title: 'Press Soles into Floor', instruction: 'Firmly press both feet flat onto the floor, noticing the solid earth beneath you.' },
              ].map((step, idx) => {
                const isChecked = somaticChecked[idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const next = [...somaticChecked];
                      next[idx] = !next[idx];
                      setSomaticChecked(next);
                    }}
                    className={`p-3.5 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isChecked
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80'
                        : 'bg-stone-50/50 dark:bg-stone-900/30 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isChecked ? 'text-emerald-800 dark:text-emerald-300 line-through' : 'text-stone-900 dark:text-stone-100'}`}>
                        {step.title}
                      </span>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        isChecked ? 'bg-emerald-600 text-white' : 'border border-stone-300 dark:border-stone-700 text-transparent'
                      }`}>
                        ✓
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                      {step.instruction}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PRESENCE TAB 3: 30S PANORAMIC VISION */}
        {activePresenceTab === 'vision' && (
          <div className="py-2 space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                30-Second Soft-Focus & Peripheral De-Gaze
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Staring at screens forces narrow foveal vision, which signals alertness to the brain. Expanding your vision softly into peripheral awareness lowers sympathetic nervous system arousal.
              </p>
            </div>

            <div className="py-2 space-y-3">
              <div className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed space-y-1">
                <p>1. Look away from your monitor toward a distant wall or window.</p>
                <p>2. Without moving your eyes, gently notice what is in your far left and right peripheral vision.</p>
                <p>3. Relax your eyelids and soften your focus for 30 seconds.</p>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setVisionTimeLeft(30);
                    setVisionTimerActive(true);
                  }}
                  className="px-4 py-2 rounded-md bg-[#1d9e75] text-white text-xs font-semibold hover:bg-[#168260] transition-colors cursor-pointer"
                >
                  {visionTimerActive ? 'Restart 30s Practice' : 'Start 30s De-Gaze'}
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xl font-mono font-bold text-stone-900 dark:text-stone-100">
                    {visionTimeLeft}s
                  </span>
                  {visionTimerActive && (
                    <span className="text-xs font-mono text-[#1d9e75] dark:text-[#28c093] animate-pulse">
                      Softening vision...
                    </span>
                  )}
                  {visionTimeLeft === 0 && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      ✓ Complete! Gently return to work.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRESENCE TAB 4: THOUGHT OBSERVER */}
        {activePresenceTab === 'defusion' && (
          <div className="py-2 space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                The Mindful Thought Observer
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Observe writing worries or intrusive mental chatter as passing events rather than absolute realities.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block">
                  What thought or worry is pulling you out of the present?
                </label>
                <input
                  type="text"
                  value={defusionText}
                  onChange={(e) => setDefusionText(e.target.value)}
                  placeholder="e.g., I'm worried my idea isn't clear or I'm running out of time..."
                  className="w-full px-3 py-2 text-xs rounded-md bg-[#FAF9F6] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-[#1d9e75] text-stone-900 dark:text-stone-100"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (defusionText.trim()) {
                    setReleasedThought(defusionText.trim());
                    setDefusionText('');
                  }
                }}
                disabled={!defusionText.trim()}
                className="px-4 py-2 rounded-md bg-[#1d9e75] disabled:opacity-40 text-white text-xs font-semibold hover:bg-[#168260] transition-colors cursor-pointer"
              >
                Observe & Defuse Thought
              </button>

              {releasedThought && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-md space-y-2"
                >
                  <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                    🌿 Thought Observer Perspective:
                  </p>
                  <blockquote className="text-xs text-stone-700 dark:text-stone-300 italic border-l-2 border-emerald-500 pl-3 py-1 bg-white/60 dark:bg-stone-900/60 rounded-r">
                    "I notice I am having the thought that: <span className="font-medium text-stone-900 dark:text-stone-100">{releasedThought}</span>."
                  </blockquote>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400">
                    This is a passing cognitive event in your awareness, not an obligation or a fact. Acknowledge it gently, and return your focus to your current breath.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
