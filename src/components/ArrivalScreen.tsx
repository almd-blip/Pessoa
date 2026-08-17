/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AccessibilitySettings } from '../types';
import AccessibilityPanel from './AccessibilityPanel';
import { useCmsText } from '../cms/CmsContentProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';
import BrandLogo from './BrandLogo';

interface ArrivalScreenProps {
  onContinue: () => void;
  onSkip?: () => void;
  settings: AccessibilitySettings;
  onSettingsChange: (settings: AccessibilitySettings) => void;
  appModules: string[];
}

export default function ArrivalScreen({
  onContinue,
  onSkip,
  settings,
  onSettingsChange,
  appModules
}: ArrivalScreenProps) {
  const [showSettings, setShowSettings] = useState(false);
  const cmsText = useCmsText();
  const { reducedMotion } = settings;

  // Slower, elegant, deep transition curve for peaceful entry
  const transition = { duration: reducedMotion ? 0 : 2.5, ease: [0.22, 1, 0.36, 1] };

  // Shared theme classes (same logic as App and HomeScreen).
  const themeClasses = useThemeClasses(settings);

  // Subtle breathing dot shown while the greeting is still fading in, so the
  // first load never feels like nothing is happening. Hidden immediately when
  // reduced motion is active (no animation, no wait).
  const [indicatorVisible, setIndicatorVisible] = useState(!reducedMotion);
  useEffect(() => {
    if (reducedMotion) {
      setIndicatorVisible(false);
      return;
    }
    // Continue button starts fading in at 2.0s – remove breathing dot at same moment
    // so it does not remain visible after Continue has fully appeared (previously 4.5s)
    const timer = setTimeout(() => setIndicatorVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  return (
    <div
      className={`min-h-screen flex flex-col px-6 pb-10 pt-24 md:p-20 transition-colors duration-300 ${themeClasses} select-none relative`}
      id="arrival-screen"
    >
      {/* Brand wordmark — small, calm, top-left, fades in gently after the greeting */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 1.5, ease: 'easeInOut', delay: reducedMotion ? 0 : 4.5 }}
        className="absolute top-6 left-6 md:top-8 md:left-20 text-left shrink-0 z-10"
        id="arrival-logo"
      >
        <BrandLogo settings={settings} className="w-28 md:w-32" />
      </motion.div>

      <div className="flex-1 flex flex-col justify-start md:justify-center items-center py-4 md:py-0">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center" id="arrival-grid">
        
        {/* Left Column: Greeting & Action Buttons */}
        <div className={`space-y-16 text-left ${showSettings ? 'lg:col-span-6' : 'lg:col-span-12'} transition-all duration-300`} id="arrival-content">
          <div className="space-y-4" id="arrival-text-group">
            {reducedMotion && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transition}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border border-current/20 bg-current/[0.06] text-current select-none w-max mb-2"
                id="arrival-reduced-motion-indicator"
                title="Reduced motion is active. Screen transitions are disabled for your accessibility preference."
              >
                <span>Reduced Motion</span>
              </motion.div>
            )}
            
            {/* Both sentences fade in slowly at the exact same time (delay: 0.5) */}
            <div className="space-y-12" id="arrival-sentences">
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reducedMotion ? 0 : 3.5, ease: 'easeInOut', delay: 0.5 }}
                className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-tight"
                id="arrival-line-1"
              >
                {cmsText('arrival.line1', 'Unfold.')}
              </motion.h1>
              
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reducedMotion ? 0 : 3.5, ease: 'easeInOut', delay: 0.5 }}
                className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-tight opacity-70"
                id="arrival-line-2"
              >
                {cmsText('arrival.line2', 'You belong here.')}
              </motion.h2>
            </div>

            {/* Subtle initial indicator while the greeting fades in */}
            <AnimatePresence>
              {indicatorVisible && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.6 }}
                  className="flex items-center gap-2.5 text-left"
                  id="arrival-indicator"
                  aria-hidden="true"
                >
                  <motion.span
                    animate={{ scale: [1, 1.5, 1], opacity: [0.35, 1, 0.35] }}
                    transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-2 h-2 rounded-full bg-current"
                  />
                  <span className="text-xs opacity-70">
                    {cmsText('arrival.preparing', 'Preparing your space')}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 2.5, ease: 'easeInOut', delay: 2.0 }}
            id="arrival-action"
            className="flex flex-wrap gap-6 md:gap-10 items-center pt-2"
          >
            <button
              id="arrival-continue-btn"
              onClick={onContinue}
              className="p-0 pl-0 m-0 bg-transparent border-0 py-2 text-base md:text-lg font-normal text-[#912A4A] opacity-80 hover:opacity-100 transition-all cursor-pointer flex items-center gap-2 group"
            >
              <span>{cmsText('arrival.continue', 'Continue')}</span>
            </button>

            {onSkip && (
              <button
                id="arrival-skip-btn"
                onClick={onSkip}
                className="py-2 text-base md:text-lg font-normal text-[#912A4A] opacity-80 hover:opacity-100 transition-all cursor-pointer flex items-center gap-2 group"
              >
                <span>{cmsText('arrival.skip', 'Skip to Projects')}</span>
              </button>
            )}

            <button
              id="arrival-accessibility-btn"
              onClick={() => setShowSettings(!showSettings)}
              className={`py-2 text-base md:text-lg font-normal text-[#912A4A] transition-all cursor-pointer flex items-center gap-2 ${
                showSettings 
                  ? 'opacity-100 font-medium underline underline-offset-8 decoration-[#912A4A]' 
                  : 'opacity-80 hover:opacity-100'
              }`}
            >
              <span>{cmsText('arrival.accessibility', 'Accessibility Settings')}</span>
            </button>
          </motion.div>
        </div>

        {/* Right Column: Dynamic Accessibility Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
              transition={{ duration: reducedMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 w-full max-h-[80vh] overflow-y-auto p-6 border rounded-2xl bg-current/[0.01] border-current/10 shadow-sm"
              id="arrival-settings-panel-container"
            >
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-current/10">
                <span className="font-semibold text-xs opacity-60">{cmsText('arrival.settingsTitle', 'Customise Experience')}</span>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-xs border border-current/20 hover:border-current/50 px-2.5 py-1 rounded-full cursor-pointer"
                >
                  {cmsText('arrival.close', 'Close')}
                </button>
              </div>
              <AccessibilityPanel 
                settings={settings} 
                onChange={onSettingsChange} 
                appModules={appModules} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
