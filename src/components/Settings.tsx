/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import LocalAIRuntimeManager from './LocalAIRuntimeManager';
import AccessibilityPanel from './AccessibilityPanel';
import { AccessibilitySettings, DEFAULT_ACCESSIBILITY_SETTINGS } from '../types';

interface SettingsProps {
  onResetAllData: () => void;
  onRestoreDemoData?: () => void;
  defaultTab?: 'profile' | 'appearance' | 'backup' | 'ai' | 'notifications';
  accessibilitySettings?: AccessibilitySettings;
  onAccessibilitySettingsChange?: (settings: AccessibilitySettings) => void;
}

export default function Settings({ 
  onResetAllData, 
  onRestoreDemoData,
  defaultTab,
  accessibilitySettings,
  onAccessibilitySettingsChange
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'backup' | 'ai' | 'notifications'>(
    defaultTab || 'profile'
  );

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Scholar profile state
  const [scholarName, setScholarName] = useState(() => localStorage.getItem('wellbeing_advisor_name') || 'Scholar');
  const [affiliation, setAffiliation] = useState(() => localStorage.getItem('scholar_affiliation') || 'Imperial College London');
  const [fieldOfStudy, setFieldOfStudy] = useState(() => localStorage.getItem('scholar_field') || 'HCI & Neurosymbolic AI');

  // Accessibility & Appearance
  const [localAccSettings, setLocalAccSettings] = useState<AccessibilitySettings>(() => {
    const cached = localStorage.getItem('scholar_accessibility_settings');
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }
    return DEFAULT_ACCESSIBILITY_SETTINGS;
  });

  const effectiveAccSettings = accessibilitySettings || localAccSettings;

  const handleAccChange = (newSettings: AccessibilitySettings) => {
    if (onAccessibilitySettingsChange) {
      onAccessibilitySettingsChange(newSettings);
    } else {
      setLocalAccSettings(newSettings);
      localStorage.setItem('scholar_accessibility_settings', JSON.stringify(newSettings));
      window.dispatchEvent(new Event('accessibility_settings_updated'));
    }
    triggerToast('Accessibility settings updated.');
  };

  // AI Options
  const [groundingLevel, setGroundingLevel] = useState('strict');
  const [customPromptGuidance, setCustomPromptGuidance] = useState(() => localStorage.getItem('scholar_custom_guidance') || '');

  // Notifications
  const [breakReminders, setBreakReminders] = useState(true);
  const [dailyEncouragements, setDailyEncouragements] = useState(true);

  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('wellbeing_advisor_name', scholarName);
    localStorage.setItem('scholar_affiliation', affiliation);
    localStorage.setItem('scholar_field', fieldOfStudy);
    triggerToast('Profile updated.');
  };

  const handleSaveAIOptions = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('scholar_custom_guidance', customPromptGuidance);
    triggerToast('AI settings saved.');
  };

  const handleExportData = () => {
    const data = {
      scholarProfile: { scholarName, affiliation, fieldOfStudy },
      dailyFocus: localStorage.getItem('daily_focus') || '',
      smallWins: localStorage.getItem('wellbeing_small_wins') || '',
      draftText: localStorage.getItem('draft_companion_text') || '',
      scholarProjectType: localStorage.getItem('scholar_project_type') || '',
      accessibility: effectiveAccSettings,
      feedbackLogs: localStorage.getItem('scholar_feedback_logs') || '[]'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `research_companion_backup_${Date.now()}.rcp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Backup downloaded successfully.');
  };

  return (
    <div className="w-full space-y-6 font-sans text-left pb-16" id="settings-module">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-xs z-50 animate-fadeIn border border-stone-250">
          <span>{toast}</span>
        </div>
      )}

      {/* Sub tabs header */}
      <div className="flex items-center gap-6 border-b border-stone-200/80 dark:border-stone-800 pb-px text-sm font-medium" role="tablist" aria-label="Settings categories">
        {[
          { id: 'profile', label: 'Profile' },
          { id: 'appearance', label: 'Appearance & accessibility' },
          { id: 'ai', label: 'AI settings' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'backup', label: 'Backup & data' },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-[#1B0A3B] text-[#1B0A3B] dark:text-indigo-300 font-semibold'
                : 'border-transparent text-[#1B0A3B] hover:text-[#1B0A3B] dark:text-indigo-200 dark:hover:text-indigo-100'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: PROFILE IDENTITY */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 space-y-4 shadow-xs animate-fadeIn">
          <h3 className="font-sans font-semibold text-stone-950 dark:text-stone-100 text-xs flex items-center gap-2 border-b border-stone-100 dark:border-stone-850 pb-2">
            Profile settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="scholar-name" className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block">Your name</label>
              <input
                id="scholar-name"
                type="text"
                value={scholarName}
                onChange={(e) => setScholarName(e.target.value)}
                className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="scholar-affiliation" className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block">Organization or university</label>
              <input
                id="scholar-affiliation"
                type="text"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="scholar-field" className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block">Field of study</label>
            <input
              id="scholar-field"
              type="text"
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="font-sans text-xs bg-amber-950 dark:bg-amber-900 hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 text-white px-4 py-2 rounded transition-colors cursor-pointer shadow-xs text-center justify-center w-full sm:w-auto"
          >
            Save profile
          </button>
        </form>
      )}

      {/* TAB 2: APPEARANCE & ACCESSIBILITY */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-xs animate-fadeIn text-left">
          <AccessibilityPanel
            settings={effectiveAccSettings}
            onChange={handleAccChange}
            appModules={['Research Workspace', 'Literature Intelligence', 'Knowledge Graph', 'Writing Companion', 'Wellbeing']}
          />
        </div>
      )}

      {/* TAB 3: AI OPTIONS & LOCAL RUNTIME LAYER */}
      {activeTab === 'ai' && (
        <div className="animate-fadeIn">
          {/* Local AI Offline Runtime Manager */}
          <LocalAIRuntimeManager
            onConfigSaved={() => triggerToast('AI settings saved.')}
          />
        </div>
      )}