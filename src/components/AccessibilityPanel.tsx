/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AccessibilitySettings, DEFAULT_ACCESSIBILITY_SETTINGS } from '../types';
import { ICON_SEMANTIC, BRAND } from '../theme/tokens';

interface AccessibilityPanelProps {
  settings: AccessibilitySettings;
  onChange: (settings: AccessibilitySettings) => void;
  appModules?: string[];
  onClose?: () => void;
}

export default function AccessibilityPanel({ 
  settings, 
  onChange, 
  appModules = [],
  onClose
}: AccessibilityPanelProps) {
  const [announceMsg, setAnnounceMsg] = useState<string>('');

  const announce = (msg: string) => {
    setAnnounceMsg(msg);
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K], msg?: string) => {
    // Keep contrast/colorPreference in sync for backward compatibility
    let extraSync: Partial<AccessibilitySettings> = {};
    if (key === 'displayMode') {
      const mode = value as AccessibilitySettings['displayMode'];
      if (mode === 'light') {
        extraSync = { contrast: 'standard', colorPreference: 'slate' };
      } else if (mode === 'dark') {
        extraSync = { contrast: 'standard', colorPreference: 'grayscale' };
      } else if (mode === 'high-contrast') {
        extraSync = { contrast: 'high', colorPreference: 'grayscale' };
      } else if (mode === 'low-vision') {
        extraSync = { contrast: 'high', colorPreference: 'amber' };
      }
    }

    const updated = {
      ...settings,
      ...extraSync,
      [key]: value
    };
    onChange(updated);
    if (msg) announce(msg);
  };

  const handleReset = () => {
    onChange({
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      activeModules: settings.activeModules || []
    });
    announce('All accessibility settings have been restored to default.');
  };

  const toggleModule = (moduleName: string) => {
    const currentModules = settings.activeModules || [];
    const active = currentModules.includes(moduleName)
      ? currentModules.filter(m => m !== moduleName)
      : [...currentModules, moduleName];
    updateSetting('activeModules', active, `Toggled component ${moduleName}`);
  };

  return (
    <div className="space-y-8 text-left" id="accessibility-control-panel" role="region" aria-label="Accessibility and Comfort Control Panel">
      
      {/* Screen Reader Live Announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true" id="acc-sr-announcer">
        {announceMsg}
      </div>

      {/* Header & Calm Intro */}
      <div className="border-b pb-4 border-current/10 flex items-start justify-between gap-4" id="acc-header-block">
        <div className="space-y-1" id="acc-header-titles">
          <div className="flex items-center gap-2">
            
            <h3 className="text-lg font-semibold tracking-tight" id="acc-title-main">
              Accessibility & Comfort Panel
            </h3>
          </div>
          <p className="text-xs opacity-80 leading-normal max-w-xl" id="acc-desc-main">
            Adjust text sizes, display colors, reading spacing, and motion options to create a view that is clear and comfortable for you.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-current/20 hover:border-current/60 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1.5 transition-colors"
            aria-label="Close Accessibility Panel"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        )}
      </div>

      {/* SECTION 1: Text and Reading */}
      <section className="space-y-3" id="acc-sec-text-reading" aria-labelledby="acc-sec-text-title">
        <div className="flex items-center gap-2 text-xs font-semibold opacity-70" id="acc-sec-text-title">
          
          <span>1. Text and Reading</span>
        </div>

        <div className="space-y-2" id="acc-font-size-group">
          <label className="text-xs font-medium opacity-90 block" id="acc-font-size-lbl">Text Size</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" id="acc-font-size-grid" role="radiogroup" aria-labelledby="acc-font-size-lbl">
            {[
              { id: 'standard', label: 'Default text size', desc: 'Standard 14px text' },
              { id: 'large', label: 'Large text', desc: 'Larger 16px text' },
              { id: 'extra-large', label: 'Extra large text', desc: 'Largest 18px text' }
            ].map((opt) => {
              const isSelected = settings.fontSize === opt.id;
              return (
                <button
                  key={opt.id}
                  id={`acc-font-btn-${opt.id}`}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => updateSetting('fontSize', opt.id as any, `Text size set to ${opt.label}`)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[64px] ${
                    isSelected
                      ? 'bg-current text-background border-current font-semibold shadow-xs'
                      : 'border-current/20 hover:border-current/50 bg-current/[0.02]'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-medium">{opt.label}</span>
                    {isSelected }
                  </div>
                  <span className="text-xs opacity-75">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 2: Display Mode */}
      <section className="space-y-3 pt-4 border-t border-current/10" id="acc-sec-display" aria-labelledby="acc-sec-display-title">
        <div className="flex items-center gap-2 text-xs font-semibold opacity-70" id="acc-sec-display-title">
          
          <span>2. Display Mode</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" id="acc-display-grid" role="radiogroup" aria-label="Display theme mode">
          {[
            { id: 'light', label: 'Light mode', desc: 'Light background' },
            { id: 'dark', label: 'Dark mode', desc: 'Dark background' },
            { id: 'high-contrast', label: 'High contrast', desc: 'High contrast black and white' },
            { id: 'low-vision', label: 'Low vision', desc: 'Yellow text on dark background' }
          ].map((opt) => {
            const isSelected = settings.displayMode === opt.id;
            return (
              <button
                key={opt.id}
                id={`acc-display-btn-${opt.id}`}
                role="radio"
                aria-checked={isSelected}
                onClick={() => updateSetting('displayMode', opt.id as any, `Display mode changed to ${opt.label}`)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[80px] ${
                  isSelected
                    ? 'bg-current text-background border-current font-semibold shadow-xs'
                    : 'border-current/20 hover:border-current/50 bg-current/[0.02]'
                }`}
              >
                <div className="mt-2 space-y-0.5">
                  <span className="text-xs font-medium block">{opt.label}</span>
                  <span className="text-xs opacity-75 block leading-tight">{opt.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: Reading Support */}
      <section className="space-y-4 pt-4 border-t border-current/10" id="acc-sec-reading-support" aria-labelledby="acc-sec-reading-title">
        <div className="flex items-center gap-2 text-xs font-semibold opacity-70" id="acc-sec-reading-title">
          
          <span>3. Reading Support</span>
        </div>

        {/* Dyslexia-friendly font toggle */}
        <div className="p-3.5 rounded-xl border border-current/20 bg-current/[0.02] flex items-center justify-between gap-4" id="acc-dyslexia-box">
          <div className="space-y-0.5" id="acc-dyslexia-txt">
            <span className="text-xs font-medium block" id="acc-dyslexia-lbl">Dyslexia-friendly font (Atkinson Hyperlegible)</span>
            <span className="text-xs opacity-75 block" id="acc-dyslexia-desc">
              Switches text font to Atkinson Hyperlegible with clean, distinguishable letter shapes.
            </span>
          </div>

          <button
            id="acc-toggle-dyslexia"
            role="switch"
            aria-checked={settings.dyslexiaFont}
            aria-labelledby="acc-dyslexia-lbl"
            onClick={() => updateSetting('dyslexiaFont', !settings.dyslexiaFont, settings.dyslexiaFont ? 'Dyslexia font disabled' : 'Dyslexia font enabled')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border cursor-pointer transition-all shrink-0 flex items-center gap-2 ${
              settings.dyslexiaFont
                ? 'bg-current text-background border-current shadow-xs'
                : 'border-current/30 hover:border-current/60 opacity-80'
            }`}
          >
            <span>{settings.dyslexiaFont ? 'Enabled' : 'Disabled'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="acc-reading-controls-grid">
          {/* Letter Spacing */}
          <div className="space-y-1.5" id="acc-letter-spacing-group">
            <label className="text-xs font-medium opacity-90 block">Letter spacing</label>
            <div className="flex flex-col gap-1" role="radiogroup" aria-label="Letter spacing options">
              {[
                { id: 'standard', label: 'Standard spacing' },
                { id: 'wide', label: 'Slightly wider' },
                { id: 'extra-wide', label: 'Extra wide' }
              ].map((sp) => (
                <button
                  key={sp.id}
                  id={`acc-ls-${sp.id}`}
                  role="radio"
                  aria-checked={settings.letterSpacing === sp.id}
                  onClick={() => updateSetting('letterSpacing', sp.id as any, `Letter spacing set to ${sp.label}`)}
                  className={`px-3 py-2 min-h-[44px] rounded-lg border text-xs text-left transition-all cursor-pointer flex justify-between items-center ${
                    settings.letterSpacing === sp.id
                      ? 'bg-current text-background border-current font-semibold'
                      : 'border-current/20 hover:border-current/40'
                  }`}
                >
                  <span>{sp.label}</span>
                  {settings.letterSpacing === sp.id }
                </button>
              ))}
            </div>
          </div>

          {/* Line Spacing */}
          <div className="space-y-1.5" id="acc-line-spacing-group">
            <label className="text-xs font-medium opacity-90 block">Line spacing</label>
            <div className="flex flex-col gap-1" role="radiogroup" aria-label="Line height options">
              {[
                { id: 'standard', label: 'Standard line height' },
                { id: 'double', label: 'Double line height' },
                { id: 'spacious', label: 'Spacious line height' }
              ].map((lh) => (
                <button
                  key={lh.id}
                  id={`acc-lh-${lh.id}`}
                  role="radio"
                  aria-checked={settings.lineHeight === lh.id}
                  onClick={() => updateSetting('lineHeight', lh.id as any, `Line height set to ${lh.label}`)}
                  className={`px-3 py-2 min-h-[44px] rounded-lg border text-xs text-left transition-all cursor-pointer flex justify-between items-center ${
                    settings.lineHeight === lh.id
                      ? 'bg-current text-background border-current font-semibold'
                      : 'border-current/20 hover:border-current/40'
                  }`}
                >
                  <span>{lh.label}</span>
                  {settings.lineHeight === lh.id }
                </button>
              ))}
            </div>
          </div>

          {/* Reading Width */}
          <div className="space-y-1.5" id="acc-reading-width-group">
            <label className="text-xs font-medium opacity-90 block">Reading width</label>
            <div className="flex flex-col gap-1" role="radiogroup" aria-label="Reading container width options">
              {[
                { id: 'narrow', label: 'Narrow text area' },
                { id: 'standard', label: 'Standard text area' },
                { id: 'wide', label: 'Wide text area' },
                { id: 'full', label: 'Full width text area' }
              ].map((rw) => (
                <button
                  key={rw.id}
                  id={`acc-rw-${rw.id}`}
                  role="radio"
                  aria-checked={settings.readingWidth === rw.id}
                  onClick={() => updateSetting('readingWidth', rw.id as any, `Reading width set to ${rw.label}`)}
                  className={`px-3 py-2 min-h-[44px] rounded-lg border text-xs text-left transition-all cursor-pointer flex justify-between items-center ${
                    settings.readingWidth === rw.id
                      ? 'bg-current text-background border-current font-semibold'
                      : 'border-current/20 hover:border-current/40'
                  }`}
                >
                  <span>{rw.label}</span>
                  {settings.readingWidth === rw.id }
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Interaction */}
      <section className="space-y-3 pt-4 border-t border-current/10" id="acc-sec-interaction" aria-labelledby="acc-sec-interaction-title">
        <div className="flex items-center gap-2 text-xs font-semibold opacity-70" id="acc-sec-interaction-title">
          
          <span>4. Interaction & Motion</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="acc-interaction-grid">
          {/* Reduced Motion Toggle */}
          <div className="p-3.5 rounded-xl border border-current/20 bg-current/[0.02] flex items-center justify-between gap-3" id="acc-motion-box">
            <div className="space-y-0.5">
              <span className="text-xs font-medium block" id="acc-motion-lbl">Reduced motion</span>
              <span className="text-xs opacity-75 block">Turns off screen animations and slide transitions.</span>
            </div>
            <button
              id="acc-toggle-motion"
              role="switch"
              aria-checked={settings.reducedMotion}
              aria-labelledby="acc-motion-lbl"
              onClick={() => updateSetting('reducedMotion', !settings.reducedMotion, settings.reducedMotion ? 'Reduced motion disabled' : 'Reduced motion enabled')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                settings.reducedMotion
                  ? 'bg-current text-background border-current shadow-xs'
                  : 'border-current/30 hover:border-current/60 opacity-80'
              }`}
            >
              <span>{settings.reducedMotion ? 'On' : 'Off'}</span>
              
            </button>
          </div>

          {/* Enhanced Focus Indicators */}
          <div className="p-3.5 rounded-xl border border-current/20 bg-current/[0.02] flex items-center justify-between gap-3" id="acc-focus-box">
            <div className="space-y-0.5">
              <span className="text-xs font-medium block" id="acc-focus-lbl">Enhanced focus indicators</span>
              <span className="text-xs opacity-75 block">Shows thick, clear borders around focused buttons.</span>
            </div>
            <button
              id="acc-toggle-focus"
              role="switch"
              aria-checked={settings.enhancedFocus}
              aria-labelledby="acc-focus-lbl"
              onClick={() => updateSetting('enhancedFocus', !settings.enhancedFocus, settings.enhancedFocus ? 'Enhanced focus ring disabled' : 'Enhanced focus ring enabled')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                settings.enhancedFocus
                  ? 'bg-current text-background border-current shadow-xs'
                  : 'border-current/30 hover:border-current/60 opacity-80'
              }`}
            >
              <span>{settings.enhancedFocus ? 'On' : 'Off'}</span>
              
            </button>
          </div>
        </div>

        {/* Audio & Time Format Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2" id="acc-extra-interaction-row">
          <div className="p-3 rounded-xl border border-current/15 flex items-center justify-between gap-2">
            <span className="text-xs font-medium flex items-center gap-2">
              {settings.soundEnabled ? null : null}
              Sound feedback
            </span>
            <button
              id="acc-toggle-sound"
              onClick={() => updateSetting('soundEnabled', !settings.soundEnabled, settings.soundEnabled ? 'Audio feedback muted' : 'Audio feedback enabled')}
              className={`px-3 py-1 text-xs rounded-md border font-medium cursor-pointer ${
                settings.soundEnabled ? 'bg-current text-background border-current' : 'border-current/25 opacity-70'
              }`}
            >
              {settings.soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          <div className="p-3 rounded-xl border border-current/15 flex items-center justify-between gap-2">
            <span className="text-xs font-medium">Layout spacing</span>
            <div className="flex gap-1">
              {(['spacious', 'compact'] as const).map(density => (
                <button
                  key={density}
                  id={`acc-density-${density}`}
                  onClick={() => updateSetting('interfaceDensity', density, `Density set to ${density}`)}
                  className={`px-3 py-2 min-h-[36px] text-xs rounded-md border font-medium cursor-pointer capitalize ${
                    settings.interfaceDensity === density ? 'bg-current text-background border-current' : 'border-current/20 opacity-70'
                  }`}
                >
                  {density === 'spacious' ? 'Spacious' : 'Compact'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Reset */}
      <section className="pt-4 border-t border-current/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" id="acc-sec-reset">
        <div className="space-y-0.5">
          <h4 className="text-xs font-semibold opacity-80" id="acc-reset-title">
            5. Reset Settings
          </h4>
          <p className="text-xs opacity-75 leading-normal max-w-md">
            Reset all text sizes, colors, spacing, and accessibility settings back to their original defaults.
          </p>
        </div>

        <button
          id="acc-restore-defaults-btn"
          onClick={handleReset}
          className="px-4 py-2.5 min-h-[44px] rounded-xl border border-current/30 text-current hover:bg-current/[0.04] text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#912A4A]"
          aria-label="Restore default accessibility settings"
        >
          
          <span>Reset to default settings</span>
        </button>
      </section>

      {/* Optional Workspace Modules Filter */}
      {appModules.length > 0 && (
        <section className="pt-4 border-t border-current/10 space-y-2" id="acc-sec-modules">
          <h4 className="text-xs font-semibold opacity-70 flex items-center gap-1.5">
            
            Workspace modules
          </h4>
          <p className="text-xs opacity-75">
            Show or hide modules to keep your view simple.
          </p>
          <div className="flex flex-wrap gap-2 pt-1" id="acc-modules-list">
            {appModules.map(moduleName => {
              const currentModules = settings.activeModules || [];
              const isChecked = currentModules.includes(moduleName);
              return (
                <button
                  key={moduleName}
                  id={`acc-mod-chip-${moduleName.toLowerCase()}`}
                  onClick={() => toggleModule(moduleName)}
                  className={`px-4 py-2 min-h-[44px] text-xs rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isChecked
                      ? 'bg-current text-background border-current font-semibold'
                      : 'border-current/25 opacity-60 hover:opacity-100'
                  }`}
                >
                  {isChecked }
                  <span>{moduleName}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
