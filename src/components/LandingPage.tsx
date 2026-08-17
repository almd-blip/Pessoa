/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ArrivalScreen from './ArrivalScreen';
import ChoiceScreen from './ChoiceScreen';
import { AccessibilitySettings } from '../types';
import { useThemeClasses } from '../hooks/useThemeClasses';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [stage, setStage] = useState<'welcome' | 'choice'>('welcome');
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>({
    reducedMotion: false,
    contrast: 'normal',
    colorPreference: 'default'
  });

  const themeClasses = useThemeClasses(accessibilitySettings);

  const handleChoiceSelect = (tab: string) => {
    if (tab === 'workspace') {
      onNavigate('dashboard');
    } else if (tab === 'accessibility') {
      onNavigate('settings');
    } else {
      onNavigate(tab);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 transition-colors duration-300 ${themeClasses} select-none font-sans overflow-y-auto`}>
      <div className="w-full min-h-full relative z-10 flex flex-col">
        <AnimatePresence mode="wait">
          {stage === 'welcome' ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: accessibilitySettings.reducedMotion ? 0 : 0.5, ease: 'easeInOut' }}
            >
              <ArrivalScreen
                onContinue={() => setStage('choice')}
                onSkip={() => onNavigate('dashboard')}
                settings={accessibilitySettings}
                onSettingsChange={setAccessibilitySettings}
                appModules={['Research Workspace', 'Literature Intelligence', 'Knowledge Graph', 'Writing Companion', 'Wellbeing']}
              />
            </motion.div>
          ) : (
            <motion.div
              key="choice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: accessibilitySettings.reducedMotion ? 0 : 0.5, ease: 'easeInOut' }}
            >
              <ChoiceScreen
                onSelect={handleChoiceSelect}
                appName="Pessoa"
                reducedMotion={accessibilitySettings.reducedMotion}
                settings={accessibilitySettings}
                onSettingsChange={setAccessibilitySettings}
                appModules={['Research Workspace', 'Literature Intelligence', 'Knowledge Graph', 'Writing Companion', 'Wellbeing']}
                onResetToArrival={() => setStage('welcome')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
