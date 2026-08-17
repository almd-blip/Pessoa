/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Compass, Sparkles } from 'lucide-react';
import { ActiveTab, AccessibilitySettings, DEFAULT_ACCESSIBILITY_SETTINGS } from '../types';
import { useCmsText } from '../cms/CmsContentProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';
import BrandLogo from './BrandLogo';
import AccessibilityPanel from './AccessibilityPanel';

interface ChoiceScreenProps {
  onSelect: (tab: ActiveTab) => void;
  appName?: string;
  reducedMotion: boolean;
  settings?: AccessibilitySettings;
  onSettingsChange?: (settings: AccessibilitySettings) => void;
  appModules?: string[];
  onResetToArrival?: () => void;
}

function Divider({ orientation = 'horizontal', spacing = 'md', className = '' }: { orientation?: 'horizontal' | 'vertical'; spacing?: string; className?: string }) {
  const marginClass = spacing === 'lg' ? 'my-4' : 'my-2';
  return (
    <div className={`${orientation === 'vertical' ? 'w-px h-full' : 'h-px w-full'} bg-[#912A4A] ${marginClass} ${className}`} />
  );
}

function getCardTextBounds(cardEl: HTMLElement | null) {
  if (!cardEl) return null;
  const titleEl = cardEl.querySelector('[id^="choice-card-title-"]') as HTMLElement | null;
  const descEl = cardEl.querySelector('[id^="choice-card-desc-"]') as HTMLElement | null;

  let left = Infinity;
  let right = -Infinity;

  const measureElement = (el: HTMLElement | null) => {
    if (!el) return;
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = range.getClientRects();
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (r.width > 0) {
          if (r.left < left) left = r.left;
          if (r.right > right) right = r.right;
        }
      }
    } catch {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        if (rect.left < left) left = rect.left;
        if (rect.right > right) right = rect.right;
      }
    }
  };

  measureElement(titleEl);
  measureElement(descEl);

  if (left === Infinity || right === -Infinity) {
    const rect = cardEl.getBoundingClientRect();
    return { left: rect.left, right: rect.right };
  }

  return { left, right };
}

export default function ChoiceScreen({ 
  onSelect, 
  appName, 
  reducedMotion, 
  settings, 
  onSettingsChange,
  appModules,
  onResetToArrival 
}: ChoiceScreenProps) {
  const cmsText = useCmsText();
  const themeClasses = useThemeClasses(settings || { reducedMotion });
  const [showSettings, setShowSettings] = useState(false);
  const effectiveModules = appModules || ['Research Workspace', 'Literature Intelligence', 'Knowledge Graph', 'Writing Companion', 'Wellbeing'];
  const cardsGridRef = React.useRef<HTMLDivElement>(null);
  const [line01Left, setLine01Left] = React.useState<number | null>(null);
  const [line12Left, setLine12Left] = React.useState<number | null>(null);
  const [line01Top, setLine01Top] = React.useState<number | null>(null);
  const [line01Bottom, setLine01Bottom] = React.useState<number | null>(null);
  const [line12Top, setLine12Top] = React.useState<number | null>(null);
  const [line12Bottom, setLine12Bottom] = React.useState<number | null>(null);
  const [titleOffset, setTitleOffset] = React.useState<number>(0);
  const [enterOffsets, setEnterOffsets] = React.useState<Record<string, number>>({});
  const [iconYOffsets, setIconYOffsets] = React.useState<Record<string, number>>({});
  const iconYOffsetsRef = React.useRef(iconYOffsets);
  iconYOffsetsRef.current = iconYOffsets;

  React.useLayoutEffect(() => {
    const updateLayoutPositions = () => {
      if (cardsGridRef.current) {
        const gridRect = cardsGridRef.current.getBoundingClientRect();
        if (gridRect.width > 0) {
          const card0 = document.getElementById('choice-card-wellbeing');
          const card1 = document.getElementById('choice-card-about');
          const card2 = document.getElementById('choice-card-workspace');

          const choiceIds = ['wellbeing', 'about', 'workspace'];
          const newEnterOffsets: Record<string, number> = {};

          choiceIds.forEach((id) => {
            const descEl = document.getElementById(`choice-card-desc-${id}`);
            const botRowEl = document.getElementById(`choice-card-bot-${id}`);

            if (descEl && botRowEl) {
              let lastWordRight: number | null = null;
              try {
                const range = document.createRange();
                range.selectNodeContents(descEl);
                const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0);
                if (rects.length > 0) {
                  lastWordRight = rects[rects.length - 1].right;
                }
              } catch {
                // fallback
              }

              if (!lastWordRight) {
                lastWordRight = descEl.getBoundingClientRect().right;
              }

              const botRight = botRowEl.getBoundingClientRect().right;
              const margin = Math.max(0, botRight - lastWordRight);
              newEnterOffsets[id] = margin;
            }
          });

          setEnterOffsets((prev) => {
            let changed = false;
            for (const key of Object.keys(newEnterOffsets)) {
              if (Math.abs((prev[key] || 0) - newEnterOffsets[key]) > 0.5) {
                changed = true;
                break;
              }
            }
            return changed ? { ...prev, ...newEnterOffsets } : prev;
          });

          const b0 = getCardTextBounds(card0);
          const b1 = getCardTextBounds(card1);
          const b2 = getCardTextBounds(card2);

          const getVerticalBounds = (cardEl: HTMLElement | null) => {
            if (!cardEl) return null;
            const titleEl = cardEl.querySelector('[id^="choice-card-title-"]') as HTMLElement | null;
            const iconEl = cardEl.querySelector('[id^="choice-card-icon-"]') as HTMLElement | null;
            if (!titleEl || !iconEl) return null;

            let titleBottom = titleEl.getBoundingClientRect().bottom;
            try {
              const range = document.createRange();
              range.selectNodeContents(titleEl);
              const rects = range.getClientRects();
              let maxB = -Infinity;
              for (let i = 0; i < rects.length; i++) {
                if (rects[i].width > 0 && rects[i].bottom > maxB) {
                  maxB = rects[i].bottom;
                }
              }
              if (maxB !== -Infinity) titleBottom = maxB;
            } catch {
              // fallback
            }

            const iconTop = iconEl.getBoundingClientRect().top;
            return { titleBottom, iconTop };
          };

          const v0 = getVerticalBounds(card0);
          const v1 = getVerticalBounds(card1);
          const v2 = getVerticalBounds(card2);

          const exploreIconTop = v1 ? v1.iconTop : (v0 ? v0.iconTop : (v2 ? v2.iconTop : null));

          if (v1 && v1.iconTop !== null && window.innerWidth >= 768) {
            const exploreTop = v1.iconTop;
            const newIconOffsets: Record<string, number> = { about: 0 };

            if (v0 && v0.iconTop !== null) {
              const raw0Top = v0.iconTop - (iconYOffsetsRef.current['wellbeing'] || 0);
              newIconOffsets['wellbeing'] = exploreTop - raw0Top;
            }
            if (v2 && v2.iconTop !== null) {
              const raw2Top = v2.iconTop - (iconYOffsetsRef.current['workspace'] || 0);
              newIconOffsets['workspace'] = exploreTop - raw2Top;
            }

            setIconYOffsets((prev) => {
              let changed = false;
              for (const key of Object.keys(newIconOffsets)) {
                if (Math.abs((prev[key] || 0) - newIconOffsets[key]) > 0.5) {
                  changed = true;
                  break;
                }
              }
              return changed ? { ...prev, ...newIconOffsets } : prev;
            });
          } else if (window.innerWidth < 768) {
            setIconYOffsets((prev) => (Object.keys(prev).length > 0 ? {} : prev));
          }

          if (b0 && b1) {
            const mid01 = (b0.right + b1.left) / 2;
            setLine01Left(mid01 - gridRect.left);
          }

          if (v0 && v1 && exploreIconTop !== null) {
            const t = Math.max(v0.titleBottom, v1.titleBottom) - gridRect.top;
            const b = gridRect.bottom - exploreIconTop;
            setLine01Top(t);
            setLine01Bottom(b);
          }

          if (b1 && b2) {
            const mid12 = (b1.right + b2.left) / 2;
            setLine12Left(mid12 - gridRect.left);
          }

          if (v1 && v2 && exploreIconTop !== null) {
            const t = Math.max(v1.titleBottom, v2.titleBottom) - gridRect.top;
            const b = gridRect.bottom - exploreIconTop;
            setLine12Top(t);
            setLine12Bottom(b);
          }
        }
      }

      const titleEl = document.getElementById('choice-title');
      const cardTitleEl = document.getElementById('choice-card-title-wellbeing');

      if (titleEl && cardTitleEl) {
        const prevTransform = titleEl.style.transform;
        titleEl.style.transform = 'none';

        const getExactTextLeft = (el: HTMLElement) => {
          try {
            const range = document.createRange();
            range.selectNodeContents(el);
            const rects = range.getClientRects();
            for (let i = 0; i < rects.length; i++) {
              if (rects[i].width > 0) return rects[i].left;
            }
          } catch {
            // fallback
          }
          return el.getBoundingClientRect().left;
        };

        const titleLeft = getExactTextLeft(titleEl);
        const cardTitleLeft = getExactTextLeft(cardTitleEl);
        const diff = cardTitleLeft - titleLeft;

        titleEl.style.transform = prevTransform;

        if (Math.abs(diff) > 0.05) {
          setTitleOffset(prev => (Math.abs(prev - diff) > 0.05 ? diff : prev));
        }
      }
    };

    updateLayoutPositions();

    if (document.fonts) {
      document.fonts.ready.then(updateLayoutPositions);
    }

    const t1 = setTimeout(updateLayoutPositions, 100);
    const t2 = setTimeout(updateLayoutPositions, 500);
    const t3 = setTimeout(updateLayoutPositions, 2200);

    window.addEventListener('resize', updateLayoutPositions);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && cardsGridRef.current) {
      resizeObserver = new ResizeObserver(updateLayoutPositions);
      resizeObserver.observe(cardsGridRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateLayoutPositions);
      if (resizeObserver) resizeObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [reducedMotion]);

  // Slower, elegant transition matching Page 1 settings
  const transitionHeader = { duration: reducedMotion ? 0 : 3.5, ease: 'easeInOut', delay: 0.5 };
  const transitionCards = (index: number) => ({
    duration: reducedMotion ? 0 : 2.5,
    ease: 'easeInOut',
    delay: reducedMotion ? 0 : 2.0 + index * 0.2
  });

  const choices = [
    {
      id: 'wellbeing' as ActiveTab,
      title: 'Pause & Breathe',
      description: 'Grounding and wellbeing tools to help keep focus.',
      icon: Wind,
    },
    {
      id: 'about' as ActiveTab,
      title: 'Explore',
      description: 'Find out how it works and what you can do in this space.',
      icon: Compass,
    },
    {
      id: 'workspace' as ActiveTab,
      title: 'I’m ready',
      description: 'Access your workspace and tools to get started.',
      icon: Sparkles,
    }
  ];

  return (
    <div
      className={`min-h-screen flex flex-col px-6 pb-10 pt-24 md:p-20 transition-colors duration-300 ${themeClasses} select-none relative`}
      id="choice-screen"
    >
      {/* Brand wordmark — small, calm, top-left */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 1.5, ease: 'easeInOut', delay: reducedMotion ? 0 : 0.5 }}
        className="absolute top-6 left-6 md:top-8 md:left-20 text-left shrink-0 z-10"
        id="choice-logo"
      >
        <BrandLogo settings={settings} className="w-28 md:w-32" />
      </motion.div>

      <div className="flex-1 flex flex-col justify-start md:justify-center items-center py-4 md:py-0">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center" id="choice-grid">
          <div className={`space-y-16 text-left transition-all duration-300 ${showSettings ? 'lg:col-span-6' : 'lg:col-span-12'}`} id="choice-content">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={transitionHeader}
              className="space-y-4"
              id="choice-header"
            >
              {reducedMotion && (
                <div className="pb-1" id="choice-subtitle-row">
                  <span
                    id="choice-reduced-motion-indicator"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border border-current/20 bg-current/[0.06] text-current select-none shrink-0"
                    title="Reduced motion is active. Screen transitions are disabled for your accessibility preference."
                  >
                    <span>Reduced Motion</span>
                  </span>
                </div>
              )}
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-tight"
                id="choice-title"
                style={{ transform: titleOffset ? `translateX(${titleOffset}px)` : undefined }}
              >
                {cmsText('choice.title', 'Where would you like to begin?')}
              </h1>
            </motion.div>

            <div ref={cardsGridRef} className="relative flex flex-col md:flex-row md:items-stretch md:gap-8 lg:gap-10" id="choice-cards-grid">
              {/* Dynamic vertical lines equidistant between actual text bounds */}
              {line01Left !== null && (
                <div
                  className="hidden md:block absolute w-[2px] bg-[#912A4A] pointer-events-none transition-all duration-150"
                  style={{
                    left: `${line01Left}px`,
                    top: line01Top !== null ? `${line01Top}px` : '20%',
                    bottom: line01Bottom !== null ? `${line01Bottom}px` : '20%'
                  }}
                  id="choice-divider-01"
                />
              )}
              {line12Left !== null && (
                <div
                  className="hidden md:block absolute w-[2px] bg-[#912A4A] pointer-events-none transition-all duration-150"
                  style={{
                    left: `${line12Left}px`,
                    top: line12Top !== null ? `${line12Top}px` : '20%',
                    bottom: line12Bottom !== null ? `${line12Bottom}px` : '20%'
                  }}
                  id="choice-divider-12"
                />
              )}
              {choices.map((choice, index) => {
                return (
                  <React.Fragment key={choice.id}>
                    {index > 0 && (
                      <Divider orientation="horizontal" spacing="lg" className="md:hidden w-full" />
                    )}
                    <motion.button
                      id={`choice-card-${choice.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={transitionCards(index)}
                      onClick={() => onSelect(choice.id)}
                      className={`group flex-1 min-w-0 ${index === 0 ? 'pl-0 pr-4 md:pl-0 md:pr-6' : index === choices.length - 1 ? 'pl-4 pr-0 md:pl-6 md:pr-0' : 'px-4 md:px-6'} py-4 text-left transition-all flex flex-col justify-between h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#912A4A]/50 bg-transparent border-0`}
                    >
                      <div className="shrink-0" id={`choice-card-top-${choice.id}`}>
                        <h2 className="text-sm sm:text-base md:text-lg font-medium tracking-tight group-hover:underline min-h-[1.75rem] flex items-center" id={`choice-card-title-${choice.id}`}>
                          {choice.title}
                        </h2>
                      </div>
                      <div className="relative shrink-0 flex-1" id={`choice-card-mid-${choice.id}`}>
                        <p className="text-[10px] sm:text-xs leading-relaxed opacity-70 mt-1 flex items-start" id={`choice-card-desc-${choice.id}`}>
                          {choice.description.split('\n').map((line, i, arr) => (
                            <React.Fragment key={i}>
                              {line}
                              {i < arr.length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </p>
                      </div>

                      <div
                        className="flex items-center justify-start pt-8 mt-auto w-full shrink-0 gap-2"
                        id={`choice-card-bot-${choice.id}`}
                        style={{
                          transform: iconYOffsets[choice.id] ? `translateY(${iconYOffsets[choice.id]}px)` : undefined
                        }}
                      >
                        {choice.icon && (
                          <choice.icon
                            id={`choice-card-icon-${choice.id}`}
                            className="w-5 h-5 text-[#912A4A] dark:text-rose-400 opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                        )}
                        <span
                          className="text-xs font-semibold text-[#912A4A] opacity-0 group-hover:opacity-100 transition-all transform -translate-x-1 group-hover:translate-x-0"
                          id={`choice-card-go-${choice.id}`}
                        >
                          {cmsText('choice.enter', 'Enter')}
                        </span>
                      </div>
                    </motion.button>
                  </React.Fragment>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reducedMotion ? 0 : 2.5, ease: 'easeInOut', delay: 2.0 }}
              className="flex flex-wrap items-center justify-start gap-8 md:gap-12 pt-2"
              id="choice-accessibility-container"
            >
              {onResetToArrival && (
                <button
                  id="choice-back-arrival-btn"
                  onClick={onResetToArrival}
                  className="pl-0 py-2 text-base md:text-lg font-normal text-[#912A4A] opacity-80 hover:opacity-100 transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <span>{cmsText('choice.backToArrival', 'Back to Arrival')}</span>
                </button>
              )}

              <div className="flex justify-start" id="choice-accessibility-col">
                <button
                  id="choice-accessibility-btn"
                  onClick={() => setShowSettings(!showSettings)}
                  className={`py-2 text-base md:text-lg font-normal text-[#912A4A] transition-all cursor-pointer flex items-center gap-2 ${
                    showSettings 
                      ? 'opacity-100 font-medium underline underline-offset-8 decoration-[#912A4A]' 
                      : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <span>{cmsText('choice.accessibility', 'Accessibility Settings')}</span>
                </button>
              </div>
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
                id="choice-settings-panel-container"
              >
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-current/10">
                  <span className="font-semibold text-xs opacity-60">{cmsText('choice.settingsTitle', 'Customise Experience')}</span>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="text-xs border border-current/20 hover:border-current/50 px-2.5 py-1 rounded-full cursor-pointer"
                  >
                    {cmsText('choice.close', 'Close')}
                  </button>
                </div>
                <AccessibilityPanel 
                  settings={settings || DEFAULT_ACCESSIBILITY_SETTINGS} 
                  onChange={onSettingsChange || (() => {})} 
                  appModules={effectiveModules} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

