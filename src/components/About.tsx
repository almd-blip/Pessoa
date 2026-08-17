/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, Clock } from 'lucide-react';
import PlatformSpecificationView from './PlatformSpecificationView';
import { PrintModal } from './PrintModal';

interface SectionData {
  id: string;
  title: string;
  summary: string;
  content: string;
}

const ABOUT_SECTIONS: SectionData[] = [
  {
    id: 'philosophy',
    title: 'Our core philosophy',
    summary: 'Self-care, calm and support.',
    content:
      'Research is a deeply human endeavour, often marked by uncertainty, cognitive overload, and intense pressure. We reject productivity-at-all-costs frameworks in favour of a calm, spacious, and supportive environment. The companion is designed to meet you wherever you are emotionally and intellectually, offering grounding tools when anxious, structured guidance when overwhelmed, and deep focus when ready.',
  },
  {
    id: 'purpose',
    title: 'Purpose',
    summary:
      'We aim to support your creativity through a dedicated space to write combined with tools to help focus, and organise information.',
    content:
      'Whatever you are writing - a fiction book, an essay, a PhD dissertation, a journal paper, a funding proposal, or policy reports—we aim to offer a calm space. This companion exists to reduce cognitive load and provide supportive, non-judgmental guidance so you can find flow and focus.',
  },
  {
    id: 'howItWorks',
    title: 'How it works',
    summary: 'The companion adapts to your needs.',
    content:
      'By indicating your project type and your emotional arrival state, the companion adjusts its interface focus, prompts, and micro-guidance. It organises your papers, assists with citation metadata corrections via Gemini, maps concept connections dynamically, and tracks small wins securely on your device.',
  },
  {
    id: 'growth',
    title: 'Design for growth',
    summary: 'Designed for where you want to go, how you need to go.',
    content:
      'We believe that mistakes, errors, and rejections are part of creativity and research, not personal labels. We omit high-pressure gamification features like streaks or urgent daily targets, replacing them with spacious negative space and gentle micro-wins.',
  },
  {
    id: 'offline',
    title: 'Offline-first principles',
    summary: 'This app has been developed to be used offline, including offline AI tools.',
    content:
      'Your draft materials, files, feedback, and notes reside strictly on-device in your local cache. Research is often completed in remote archives, on trains, or in quiet libraries. By operating offline, we safeguard your data ownership and prevent distractions from constant internet dependency.',
  },
  {
    id: 'accessibility',
    title: 'Accessibility & wellbeing',
    summary: 'We design with Accessibility, Inclusion and Wellbeing at the forefront.',
    content:
      'Our layouts prioritise fluid margins, optimal text line-lengths, adjustable font sizes, high-contrast states, and friendly, readable interfaces. Rest, reflective breaks, and screen-free decompressions are integrated as active necessities, rather than passive rewards.',
  },
  {
    id: 'privacy',
    title: 'Absolute data privacy',
    summary: 'Your work remains private.',
    content:
      'We never track or cache your writing drafts. Your feedback forms, projects, and personal parameters remain in your browser. Any AI interaction via Gemini is proxy-routed securely with zero persistent server-side caching or model training on your workspace.',
  },
  {
    id: 'integrity',
    title: 'Research integrity boundary',
    summary: 'This is not a content generation platform. It is here to support, empower and assist you.',
    content:
      'The Research Companion will never write, generate, or produce complete papers, articles, books, reports, or creative projects on your behalf. The purpose of the AI is to support your research and writing process, not replace the creator or researcher. The AI acts as a thinking partner and analytical tool — helping you organise materials, identify themes, map literature, evaluate evidence, structure notes, and check logic — while you remain solely responsible for forming arguments, interpreting evidence, drawing conclusions, and writing original work.',
  },
];

export default function About() {
  const [showSpec, setShowSpec] = useState(false);

  // Track individual section collapse states (all collapsed by default)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    philosophy: false,
    purpose: false,
    howItWorks: false,
    growth: false,
    offline: false,
    accessibility: false,
    privacy: false,
    integrity: false,
  });

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllSections = (open: boolean) => {
    setOpenSections({
      philosophy: open,
      purpose: open,
      howItWorks: open,
      growth: open,
      offline: open,
      accessibility: open,
      privacy: open,
      integrity: open,
    });
  };

  const handlePrintAbout = () => {
    setAllSections(true);
    setIsPrintModalOpen(true);
  };

  // Calculate estimated reading time based on total word count (~200 wpm)
  const totalWords = ABOUT_SECTIONS.reduce((acc, section) => {
    const sectionWords = `${section.title} ${section.summary} ${section.content}`.trim().split(/\s+/).length;
    return acc + sectionWords;
  }, 0);
  const readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));

  const rawAboutText = ABOUT_SECTIONS.map(
    (s) => `${s.title.toUpperCase()}\nSummary: ${s.summary}\n${s.content}`
  ).join('\n\n----------------------------------------\n\n');

  return (
    <div className="w-full space-y-8 font-sans pb-16 animate-fadeIn text-left" id="about-module">
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Pessoa — Principles & Ethos"
        subtitle="Platform Philosophy, Human-Centric Design & Research Boundaries"
        rawTextToCopy={rawAboutText}
      >
        <div className="space-y-6">
          {ABOUT_SECTIONS.map((section) => (
            <div key={section.id} className="space-y-2 border-b border-stone-200 pb-4">
              <h2 className="text-base font-serif font-bold text-stone-900">{section.title}</h2>
              <p className="text-xs font-semibold text-stone-800">{section.summary}</p>
              <p className="text-xs text-stone-600 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      </PrintModal>
      {/* Print-Only Document Header */}
      <div className="hidden print:block mb-8 pb-4 border-b-2 border-stone-900" id="about-print-header">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-serif font-bold text-2xl text-stone-900">Pessoa — Research & Writing Companion</h1>
            <h2 className="font-sans font-semibold text-stone-700 text-sm mt-1">Platform Core Principles, Philosophy & Ethos</h2>
          </div>
          <div className="text-right text-xs font-mono text-stone-500">
            <div>Offline Reading Guide</div>
            <div>Printed: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Header (Matching Wellbeing Centre Layout Language) */}
      <div className="border-b border-stone-200/80 dark:border-stone-800 pb-6 mb-8 text-left print:hidden" id="about-header-container">
        <div className="space-y-1.5" id="about-header-text">
          <h1 className="font-sans font-medium tracking-tight text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 flex items-center gap-3" id="about-page-title">
            About Pessoa
          </h1>
          <p className="font-sans text-stone-500 dark:text-stone-400 text-xs sm:text-sm leading-relaxed" id="about-page-subtitle">
            A gentle, human-centric space designed to support you through the emotional and intellectual journeys of research.
          </p>
          <div className="flex items-center gap-1.5 pt-1.5 text-xs font-sans text-stone-400 dark:text-stone-500" id="about-reading-time">
            <Clock className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0" />
            <span>Estimated reading time: {readingTimeMinutes} min • Platform ethos & core principles</span>
          </div>
        </div>
      </div>

      {/* Main Progressive Disclosure Content */}
      {!showSpec ? (
        <div className="space-y-6" id="about-main-content">
          {/* Control bar for section disclosure */}
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pb-2 border-b border-stone-200/60 dark:border-stone-800" id="about-section-controls">
            <button
              type="button"
              onClick={handlePrintAbout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-sans font-semibold text-stone-800 dark:text-stone-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#912A4A] no-print"
              id="about-print-btn"
              title="Print About page principles and philosophy for offline reading"
            >
              <Printer className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
              <span>Print About Page</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAllSections(true)}
                className="hover:text-[#912A4A] dark:hover:text-rose-400 transition-colors cursor-pointer underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#912A4A]"
                id="about-expand-all-btn"
              >
                Expand All
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setAllSections(false)}
                className="hover:text-[#912A4A] dark:hover:text-rose-400 transition-colors cursor-pointer underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#912A4A]"
                id="about-collapse-all-btn"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Vertically stacked progressive-disclosure list */}
          <div className="space-y-0" id="about-principles-list">
            {ABOUT_SECTIONS.map((section, index) => {
              const isOpen = openSections[section.id];
              return (
                <React.Fragment key={section.id}>
                  {index > 0 && (
                    <div className="h-[2px] w-full bg-[#912A4A] my-6 sm:my-8 opacity-80" />
                  )}
                  <div className="py-2 text-left" id={`about-item-${section.id}`}>
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      aria-expanded={isOpen}
                      aria-controls={`about-content-${section.id}`}
                      className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#912A4A] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950 rounded-sm py-1 cursor-pointer group"
                      id={`about-btn-${section.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-sans font-semibold text-base sm:text-lg tracking-tight text-stone-900 dark:text-stone-100 group-hover:text-[#912A4A] dark:group-hover:text-rose-400 transition-colors">
                          {section.title}
                        </h3>
                        <span
                          className="text-lg font-mono font-medium text-[#912A4A] dark:text-rose-400 shrink-0 leading-none select-none ml-2 pt-0.5"
                          aria-hidden="true"
                        >
                          {isOpen ? '−' : '+'}
                        </span>
                      </div>

                      {/* 1st-layer statement (always visible, 16pt space below title) */}
                      <p className="mt-[16pt] font-sans text-sm sm:text-base text-stone-800 dark:text-stone-200 font-normal leading-relaxed">
                        {section.summary}
                      </p>
                    </button>

                    {/* 2nd-layer full text (revealed on expansion with smooth height transition) */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`about-content-${section.id}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{
                            height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                            opacity: { duration: 0.25, ease: 'easeInOut', delay: 0.05 }
                          }}
                          className="overflow-hidden"
                        >
                          <p className="pt-3 pb-1 font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                            {section.content}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Call-to-action to read technical specification paper */}
          <div className="pt-12 mt-8 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="about-spec-banner">
            <div className="space-y-1 text-left" id="about-spec-info">
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100" id="about-spec-title">Platform Specification & Roadmap</h4>
              <p className="text-stone-500 text-xs" id="about-spec-subtitle">Read our formal design specification, database architectures, and engineering guidelines.</p>
            </div>
            <button
              onClick={() => setShowSpec(true)}
              className="font-sans text-xs bg-stone-900 dark:bg-stone-800 hover:bg-stone-850 dark:hover:bg-stone-700 text-white px-4 py-2.5 rounded transition-all cursor-pointer flex items-center gap-2 shadow-sm text-left shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#912A4A]"
              id="about-open-spec-btn"
            >
              <span>Open Specification Paper</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-2" id="about-spec-container">
          <div className="flex justify-between items-center" id="about-spec-nav">
            <button
              onClick={() => setShowSpec(false)}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-sans cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#912A4A]"
              id="about-back-to-about-btn"
            >
              ← Back to About Companion
            </button>
          </div>
          <PlatformSpecificationView />
        </div>
      )}
    </div>
  );
}

