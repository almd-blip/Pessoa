/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AccessibilitySettings } from '../types';

export function useThemeClasses(settings: AccessibilitySettings) {
  const isHigh = settings.contrast === 'high';
  const isWarm = settings.contrast === 'warm';

  if (settings.colorPreference === 'grayscale') {
    if (isHigh) return 'bg-[#1B0A3B] text-white border-white';
    if (isWarm) return 'bg-stone-100 text-[#1B0A3B] border-stone-300';
    return 'bg-stone-50 text-[#1B0A3B] border-stone-200';
  }

  if (settings.colorPreference === 'amber') {
    if (isHigh) return 'bg-[#1c0a00] text-[#fff7ed] border-[#ea580c]';
    if (isWarm) return 'bg-[#fef3c7] text-[#451a03] border-[#f59e0b]';
    return 'bg-[#faf6f0] text-[#7c2d12] border-[#ffedd5]';
  }

  if (settings.colorPreference === 'cream') {
    if (isHigh) return 'bg-[#1B0A3B] text-[#fafaf9] border-[#d6d3d1]';
    if (isWarm) return 'bg-[#f4ebd0] text-[#1B0A3B] border-[#d6c59d]';
    return 'bg-[#faf8f5] text-[#1B0A3B] border-[#e7e5e4]';
  }

  // Default
  if (isHigh) return 'bg-slate-950 text-slate-50 border-slate-100';
  if (isWarm) return 'bg-[#faf9f6] text-[#1B0A3B] border-slate-300';
  return 'bg-[#faf8f5] text-[#1B0A3B] border-[#e7e5e4]';
}
