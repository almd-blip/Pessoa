/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck, ExternalLink, X } from 'lucide-react';

export interface ResearchIntegrityBannerProps {
  compact?: boolean;
  variant?: 'card' | 'inline';
  onOpenResearchPlan?: () => void;
  onOpenQuestionDev?: () => void;
  defaultExpanded?: boolean;
}

export function ResearchIntegrityModal({
  isOpen,
  onClose,
  onOpenResearchPlan,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenResearchPlan?: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 max-w-2xl w-full shadow-xl space-y-5 my-8">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-stone-150 dark:border-stone-800 pb-3">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              Research Integrity Guidelines
            </h3>
            <p className="font-sans text-xs text-stone-500 mt-0.5">
              The AI acts as an analytical partner — never as an author or ghostwriter.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 p-1.5 rounded-lg text-xs hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer flex items-center gap-1 font-medium transition-colors border border-transparent hover:border-stone-200 dark:hover:border-stone-700"
            aria-label="Close Integrity Guidelines"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        </div>

        {/* Core Premise */}
        <div className="p-3.5 bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 rounded-xl text-xs font-sans text-stone-700 dark:text-stone-300 leading-relaxed">
          <strong className="text-stone-900 dark:text-stone-100 font-semibold block mb-1">
            Boundary Commitment:
          </strong>
          The Research Companion will <strong>never write, generate, or produce complete papers, articles, books, chapters, or reports</strong> on behalf of the user. The AI is designed strictly to support the research and writing process, not replace the creator or researcher.
        </div>

        {/* Grid of Capabilities vs Responsibilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          
          {/* Permissible AI Assistance */}
          <div className="bg-stone-50/70 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 p-4 rounded-xl space-y-2">
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-xs">
              What the AI May Assist With
            </h4>
            <ul className="space-y-1.5 text-[11px] text-stone-600 dark:text-stone-400">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span> Organising research materials & literature
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span> Identifying themes, patterns & theoretical models
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span> Comparing arguments & mapping literature
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span> Identifying supporting & opposing evidence
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span> Highlighting knowledge gaps & unanswered questions
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span> Suggesting possible research directions
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span> Structuring notes, outlines & conceptual frameworks
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span> Checking clarity, consistency & logical cohesion
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span> Assisting with editing of user-written text
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span> Identifying biases, assumptions & limitations
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span> Supporting data exploration & pattern interpretation
              </li>
            </ul>
          </div>

          {/* User Responsibilities */}
          <div className="bg-stone-50/70 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 p-4 rounded-xl space-y-2">
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-xs">
              Researcher Responsibilities
            </h4>
            <ul className="space-y-1.5 text-[11px] text-stone-600 dark:text-stone-400">
              <li className="flex items-start gap-1.5">
                <span className="text-[#912A4A] dark:text-rose-400 font-bold">•</span> Forming original arguments & core hypotheses
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#912A4A] dark:text-rose-400 font-bold">•</span> Interpreting empirical evidence & findings
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#912A4A] dark:text-rose-400 font-bold">•</span> Drawing original conclusions
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#912A4A] dark:text-rose-400 font-bold">•</span> Writing original work
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#912A4A] dark:text-rose-400 font-bold">•</span> Making final authorial judgements
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#912A4A] dark:text-rose-400 font-bold">•</span> Ensuring factual accuracy & correct citations
              </li>
            </ul>

            {/* Alternative Support */}
            <div className="pt-3 border-t border-stone-200/80 dark:border-stone-800 space-y-1">
              <h5 className="font-semibold text-[11px] text-stone-800 dark:text-stone-200">
                Alternative Support Options:
              </h5>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed">
                When requested to generate outputs, the AI instead provides research plans, key research questions, draft peer-reviews, structural feedback, and logical consistency checks.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-150 dark:border-stone-800">
          <span className="text-[10px] text-stone-400 italic">
            A non-generative, author-led creative and research workflow.
          </span>

          <div className="flex gap-2">
            {onOpenResearchPlan && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenResearchPlan();
                }}
                className="font-sans text-xs px-3.5 py-1.5 rounded-xl bg-[#912A4A] text-white hover:bg-[#78223d] transition-colors flex items-center gap-1 font-medium cursor-pointer"
              >
                Research Plan Helper
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="font-sans text-xs px-4 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors font-medium cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function ResearchIntegrityBanner({
  compact = false,
  variant = 'card',
  onOpenResearchPlan,
  onOpenQuestionDev,
}: ResearchIntegrityBannerProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Vertically Stacked Architecture - Left Aligned */}
      <div className={`space-y-2 font-sans text-left ${
        variant === 'card' 
          ? 'bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 rounded-xl p-3.5 shadow-2xs' 
          : 'text-xs'
      }`}>
        
        {/* 1. Research Integrity Boundary Active */}
        <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-xs tracking-tight text-left">
          Research Integrity Boundary Active
        </h4>
        
        {/* 2. Assistant • Not Author */}
        <div className="text-left">
          <span className="inline-block text-[11px] bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-mono px-2.5 py-0.5 rounded-md font-semibold">
            Assistant • Not Author
          </span>
        </div>

        {/* 3. Principles and scope - directly opens integrity guidelines */}
        <div className="text-left pt-0.5">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-xs font-sans font-medium text-[#912A4A] dark:text-rose-400 hover:text-[#78223d] dark:hover:text-rose-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100/90 dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700/60 cursor-pointer transition-all hover:bg-stone-200/60 dark:hover:bg-stone-750 text-left"
            title="View Research Integrity Guidelines"
            id="principles-and-scope-btn"
          >
            <span>Principles and scope</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      <ResearchIntegrityModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onOpenResearchPlan={onOpenResearchPlan}
      />
    </>
  );
}
