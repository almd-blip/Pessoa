/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AccessibilitySettings } from '../types';

interface BrandLogoProps {
  settings?: AccessibilitySettings;
  className?: string;
}

export default function BrandLogo({ settings, className = 'w-32' }: BrandLogoProps) {
  const isDark = settings?.displayMode === 'dark';
  const logoSrc = isDark ? '/assets/logo_cream.svg' : '/assets/logo_transparent.svg';

  return (
    <img
      src={logoSrc}
      alt="Research Companion"
      className={`h-auto object-contain select-none pointer-events-none ${className}`}
      referrerPolicy="no-referrer"
    />
  );
}
