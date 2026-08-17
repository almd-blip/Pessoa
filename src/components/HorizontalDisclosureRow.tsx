/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface HorizontalDisclosureRowProps {
  key?: React.Key;
  id?: string;
  title: React.ReactNode;
  keywords?: React.ReactNode[];
  summary?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  defaultExpanded?: boolean;
  prefix?: React.ReactNode;
  className?: string;
}

export const HorizontalDisclosureRow: React.FC<HorizontalDisclosureRowProps> = ({
  id,
  title,
  keywords,
  summary,
  children,
  actions,
  isExpanded: controlledExpanded,
  onToggle: controlledToggle,
  defaultExpanded = false,
  prefix,
  className = '',
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const toggle = controlledToggle || (() => setInternalExpanded(prev => !prev));

  return (
    <div
      id={id}
      className={`w-full py-2.5 border-b border-[#912A4A]/20 dark:border-rose-900/30 transition-colors ${className}`}
    >
      {/* Top Line: Full horizontal line with Title + Prefix + Chevron, nothing blocking to the right */}
      <div
        onClick={toggle}
        className="w-full flex items-center justify-between gap-3 cursor-pointer group select-none text-left py-0.5"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {prefix && (
            <div onClick={(e) => e.stopPropagation()} className="shrink-0 flex items-center">
              {prefix}
            </div>
          )}
          <h4 className="font-sans font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#912A4A] dark:group-hover:text-rose-400 transition-colors leading-snug">
            {title}
          </h4>
        </div>
        <div className="shrink-0 p-1 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#912A4A] dark:text-rose-400" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Expanded State: Hierarchy: Title (above), Keywords below, Summary below, and everything else below */}
      {isExpanded && (
        <div className="w-full space-y-2.5 pt-2 pl-1 sm:pl-2 animate-fadeIn text-left">
          {/* Level 2: Keywords below */}
          {keywords && keywords.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {keywords.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center text-[11px] font-sans font-medium px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Level 3: Summary below */}
          {summary && (
            <div className="font-sans text-xs text-stone-700 dark:text-stone-300 leading-relaxed max-w-none">
              {typeof summary === 'string' ? (
                <p className="leading-relaxed">{summary}</p>
              ) : (
                summary
              )}
            </div>
          )}

          {/* Everything else: Children (e.g. detailed sub-sections, quotations, charts) */}
          {children && <div className="space-y-2 pt-1">{children}</div>}

          {/* Actions: e.g. Copy citation, Insert in draft */}
          {actions && (
            <div className="flex items-center justify-between gap-3 pt-2 text-xs border-t border-stone-100 dark:border-stone-850">
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HorizontalDisclosureRow;
