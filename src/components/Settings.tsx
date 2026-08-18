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

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 space-y-6 shadow-xs animate-fadeIn text-left">
          <h3 className="font-sans font-semibold text-stone-950 dark:text-stone-100 text-xs flex items-center gap-2 border-b border-stone-100 dark:border-stone-850 pb-2 text-left">
            Notifications & sounds
          </h3>

          <div className="space-y-4">
            {/* Break Reminders */}
            <div className="flex justify-between items-center p-3.5 bg-stone-50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800 rounded-lg text-left">
              <label htmlFor="break-reminders-toggle" className="cursor-pointer select-none flex-grow text-left">
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block text-left">Break reminders</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block text-left">Show a friendly message when your focus timer ends.</span>
              </label>
              <input
                id="break-reminders-toggle"
                type="checkbox"
                checked={breakReminders}
                onChange={(e) => setBreakReminders(e.target.checked)}
                className="w-4 h-4 accent-[#1D9E75] dark:accent-[#28c093] rounded focus:outline-none focus:ring-2 focus:ring-[#1D9E75] cursor-pointer"
              />
            </div>

            {/* Encouragements */}
            <div className="flex justify-between items-center p-3.5 bg-stone-50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800 rounded-lg text-left">
              <label htmlFor="encouragements-toggle" className="cursor-pointer select-none flex-grow text-left">
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block text-left">Daily encouragements</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block text-left">Show daily check-ins based on how you are feeling.</span>
              </label>
              <input
                id="encouragements-toggle"
                type="checkbox"
                checked={dailyEncouragements}
                onChange={(e) => setDailyEncouragements(e.target.checked)}
                className="w-4 h-4 accent-[#1D9E75] dark:accent-[#28c093] rounded focus:outline-none focus:ring-2 focus:ring-[#1D9E75] cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={() => triggerToast('Notification settings saved.')}
            className="font-sans text-xs bg-amber-950 dark:bg-amber-900 hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 text-white px-4 py-2 rounded transition-colors cursor-pointer text-center justify-center w-full sm:w-auto"
          >
            Save notification settings
          </button>
        </div>
      )}

      {/* TAB 5: BACKUP & DIAGNOSTICS */}
      {activeTab === 'backup' && (
        <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 space-y-6 shadow-xs animate-fadeIn text-left">
          <h3 className="font-sans font-semibold text-stone-950 dark:text-stone-100 text-xs flex items-center gap-2 border-b border-stone-100 dark:border-stone-850 pb-2 text-left">
            Data storage
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-sans text-left">
              <div className="text-left">
                <p className="font-semibold text-stone-850 dark:text-stone-200 text-left">Storage used on this device</p>
                <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5 text-left">Your notes, journal entries, feedback, and saved items stay on your device.</p>
              </div>
              <span className="font-mono text-xs bg-stone-100 dark:bg-stone-900 px-2.5 py-1 border border-stone-200 dark:border-stone-800 rounded text-stone-600 dark:text-stone-400">
                {Math.round(JSON.stringify(localStorage).length / 1024)} KB used
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <button
                type="button"
                onClick={handleExportData}
                className="font-sans text-xs border border-stone-250 dark:border-stone-800 bg-white dark:bg-stone-950 py-2.5 px-4 rounded flex justify-center items-center gap-1.5 hover:bg-stone-50 dark:hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 transition-colors cursor-pointer text-center font-medium text-stone-700 dark:text-stone-300"
              >
                Download backup file (.rcp)
              </button>

              {onRestoreDemoData && (
                <button
                  type="button"
                  onClick={() => {
                    onRestoreDemoData();
                    triggerToast('Original demo projects, library, and milestones restored.');
                  }}
                  className="font-sans text-xs border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 py-2.5 px-4 rounded flex justify-center items-center gap-1.5 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 transition-colors cursor-pointer text-center font-medium"
                >
                  Restore original demos
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete all saved data on this device? This cannot be undone.')) {
                    onResetAllData();
                  }
                }}
                className="font-sans text-xs border border-red-200 text-red-700 py-2.5 px-4 rounded flex justify-center items-center gap-1.5 hover:bg-red-50/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 transition-colors cursor-pointer text-center font-medium"
              >
                Delete all local data
              </button>
            </div>
          </div>

          <div className="bg-stone-50 dark:bg-stone-900/30 p-5 rounded-lg border border-stone-200 dark:border-stone-800 text-xs font-sans text-stone-600 dark:text-stone-400 space-y-2 flex items-start gap-3 text-left">
            <div className="text-left">
              <p className="font-semibold text-stone-800 dark:text-stone-200 text-left">Privacy & offline storage</p>
              <p className="leading-relaxed mt-0.5 text-left">
                Research Companion keeps your data private on your own device. We do not store your data on external servers or track your activity.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
