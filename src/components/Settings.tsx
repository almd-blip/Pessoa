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
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  const [scholarName, setScholarName] = useState(() => localStorage.getItem('wellbeing_advisor_name') || '');
  const [affiliation, setAffiliation] = useState(() => localStorage.getItem('scholar_affiliation') || '');
  const [areasOfInterest, setAreasOfInterest] = useState(() => localStorage.getItem('areas_of_interest') || localStorage.getItem('scholar_field') || '');

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

  const [customPromptGuidance, setCustomPromptGuidance] = useState(() => localStorage.getItem('scholar_custom_guidance') || '');
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
    localStorage.setItem('areas_of_interest', areasOfInterest);
    localStorage.setItem('scholar_field', areasOfInterest);
    triggerToast('Profile updated.');
  };

  const handleExportData = () => {
    const data = {
      profile: { name: scholarName, affiliation, areasOfInterest },
      dailyFocus: localStorage.getItem('daily_focus') || '',
      smallWins: localStorage.getItem('wellbeing_small_wins') || '',
      draftText: localStorage.getItem('draft_companion_text') || '',
      projectType: localStorage.getItem('scholar_project_type') || '',
      accessibility: effectiveAccSettings,
      feedbackLogs: localStorage.getItem('scholar_feedback_logs') || '[]'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pessoa_backup_${Date.now()}.rcp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast('Backup downloaded successfully.');
  };

  return (
    <div className="w-full space-y-6 font-sans text-left pb-16" id="settings-module">
      {toast && (
        <div className="fixed bottom-5 right-5 bg-[#1B0A3B] text-white px-4 py-3 rounded-lg shadow-lg text-sm z-50 animate-fadeIn">
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-7 gap-y-2 border-b border-stone-200/80 dark:border-stone-800 pb-1 text-base font-medium" role="tablist" aria-label="Settings categories">
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
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#1B0A3B] text-[#1B0A3B] dark:text-indigo-300 font-semibold'
                : 'border-transparent text-[#1B0A3B] hover:text-[#1D9E75] dark:text-indigo-200 dark:hover:text-indigo-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-5 animate-fadeIn text-left">
          <div>
            <h2 className="text-xl font-semibold text-[#1B0A3B] dark:text-stone-100">Profile</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">A few details to help Pessoa make your experience more useful. You can change these at any time.</p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="space-y-1.5">
              <label htmlFor="scholar-name" className="text-sm font-semibold text-[#1B0A3B] dark:text-stone-100 block">Your name</label>
              <input id="scholar-name" type="text" value={scholarName} onChange={(e) => setScholarName(e.target.value)} className="w-full min-h-11 font-sans text-sm px-3.5 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75]" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="scholar-affiliation" className="text-sm font-semibold text-[#1B0A3B] dark:text-stone-100 block">Organization or university</label>
              <input id="scholar-affiliation" type="text" value={affiliation} onChange={(e) => setAffiliation(e.target.value)} className="w-full min-h-11 font-sans text-sm px-3.5 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75]" />
              <p className="text-xs text-stone-500 dark:text-stone-400">Optional — where you work, study, create, volunteer, or belong.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="areas-of-interest" className="text-sm font-semibold text-[#1B0A3B] dark:text-stone-100 block">Areas of interest</label>
              <input id="areas-of-interest" type="text" value={areasOfInterest} onChange={(e) => setAreasOfInterest(e.target.value)} placeholder="Subjects, activities, or things you care about" className="w-full min-h-11 font-sans text-sm px-3.5 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75]" />
            </div>
          </div>

          <button type="submit" className="min-h-11 font-sans text-sm bg-[#912A4A] hover:bg-[#78223d] text-white font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer">Save profile</button>
        </form>
      )}

      {activeTab === 'appearance' && (
        <div className="animate-fadeIn text-left">
          <AccessibilityPanel settings={effectiveAccSettings} onChange={handleAccChange} appModules={['Research Workspace', 'Literature Intelligence', 'Knowledge Graph', 'Writing Companion', 'Wellbeing']} />
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="animate-fadeIn text-left">
          <LocalAIRuntimeManager onConfigSaved={() => triggerToast('AI settings saved.')} />
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-5 animate-fadeIn text-left">
          <div>
            <h2 className="text-xl font-semibold text-[#1B0A3B] dark:text-stone-100">Notifications</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">Choose which reminders Pessoa shows you.</p>
          </div>
          <div className="space-y-4 max-w-2xl">
            <div className="flex justify-between items-center gap-4 py-3 border-b border-stone-200 dark:border-stone-800">
              <label htmlFor="break-reminders-toggle" className="cursor-pointer select-none flex-grow text-left">
                <span className="text-sm font-semibold text-stone-800 dark:text-stone-200 block">Break reminders</span>
                <span className="text-xs text-stone-500 dark:text-stone-400 block mt-1">Show a friendly message when your focus timer ends.</span>
              </label>
              <input id="break-reminders-toggle" type="checkbox" checked={breakReminders} onChange={(e) => setBreakReminders(e.target.checked)} className="w-5 h-5 accent-[#1D9E75] cursor-pointer" />
            </div>
            <div className="flex justify-between items-center gap-4 py-3 border-b border-stone-200 dark:border-stone-800">
              <label htmlFor="encouragements-toggle" className="cursor-pointer select-none flex-grow text-left">
                <span className="text-sm font-semibold text-stone-800 dark:text-stone-200 block">Daily encouragements</span>
                <span className="text-xs text-stone-500 dark:text-stone-400 block mt-1">Show daily check-ins based on how you are feeling.</span>
              </label>
              <input id="encouragements-toggle" type="checkbox" checked={dailyEncouragements} onChange={(e) => setDailyEncouragements(e.target.checked)} className="w-5 h-5 accent-[#1D9E75] cursor-pointer" />
            </div>
          </div>
          <button type="button" onClick={() => triggerToast('Notification settings saved.')} className="min-h-11 font-sans text-sm bg-[#912A4A] hover:bg-[#78223d] text-white font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer">Save notification settings</button>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="space-y-5 animate-fadeIn text-left">
          <div>
            <h2 className="text-xl font-semibold text-[#1B0A3B] dark:text-stone-100">Backup & data</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">Keep a copy of your work or manage the data stored on this device.</p>
          </div>
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap justify-between items-center gap-4 py-3 border-b border-stone-200 dark:border-stone-800">
              <div>
                <p className="font-semibold text-sm text-stone-850 dark:text-stone-200">Storage used on this device</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Your notes, journal entries, feedback, and saved items stay on your device.</p>
              </div>
              <span className="font-mono text-xs text-stone-600 dark:text-stone-400">{Math.round(JSON.stringify(localStorage).length / 1024)} KB used</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleExportData} className="min-h-11 border border-stone-300 dark:border-stone-700 bg-transparent py-2.5 px-4 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors cursor-pointer text-sm font-medium text-stone-700 dark:text-stone-300">Download backup file (.rcp)</button>
              {onRestoreDemoData && <button type="button" onClick={() => { onRestoreDemoData(); triggerToast('Original demo projects, library, and milestones restored.'); }} className="min-h-11 border border-[#1D9E75]/50 text-[#1D9E75] py-2.5 px-4 rounded-lg hover:bg-[#1D9E75]/5 transition-colors cursor-pointer text-sm font-medium">Restore original demos</button>}
              <button type="button" onClick={() => { if (confirm('Are you sure you want to delete all saved data on this device? This cannot be undone.')) onResetAllData(); }} className="min-h-11 border border-red-200 text-red-700 py-2.5 px-4 rounded-lg hover:bg-red-50/50 transition-colors cursor-pointer text-sm font-medium">Delete all local data</button>
            </div>
          </div>
          <div className="max-w-2xl pt-3 border-t border-stone-200 dark:border-stone-800 text-sm text-stone-600 dark:text-stone-400 space-y-1">
            <p className="font-semibold text-[#1B0A3B] dark:text-stone-200">Privacy & offline storage</p>
            <p className="leading-relaxed">Pessoa keeps your data private on your own device. We do not store your data on external servers or track your activity.</p>
          </div>
        </div>
      )}
    </div>
  );
}