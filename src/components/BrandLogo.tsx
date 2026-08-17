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

export default function BrandLogo({ className = "w-28 md:w-32" }: BrandLogoProps) {
  return (
    <img 
      src="/assets/logo_transparent.png" 
      alt="Pessoa Logo" 
      className={`${className} h-auto object-contain`}
      referrerPolicy="no-referrer"
    />
  );
}
