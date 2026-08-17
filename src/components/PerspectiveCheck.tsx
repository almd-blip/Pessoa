/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Paper, ResearchJourney } from '../types';
import {
  Users,
  BookOpen,
  Compass,
  HelpCircle,
  Lightbulb,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface PerspectiveCheckProps {
  papers: Paper[];
  activeJourney?: ResearchJourney;
  onInsertIntoDraft?: (text: string) => void;
  headerActions?: React.ReactNode;
}

export interface PerspectiveCheckData {
  includedNotes: string;
  includedCategories: string[];
  missingNotes: string;
  missingCategories: string[];
  creatorsNotes: string;
  creatorTypes: string[];
  livedExperienceIncluded: boolean | null;
  livedExperienceNotRelevant: boolean;
  livedExperienceNotes: string;
  differentViewsIncluded: string; // 'yes' | 'some' | 'unclear'
  differentViewsNotes: string;
  changeFindingsNotes: string;
  fitAssessment: 'fits_well' | 'narrow_focus' | 'needs_more_perspectives' | 'unclear';
}

const DEFAULT_DATA: PerspectiveCheckData = {
  includedNotes: '',
  includedCategories: [],
  missingNotes: '',
  missingCategories: [],
  creatorsNotes: '',
  creatorTypes: [],
  livedExperienceIncluded: null,
  livedExperienceNotRelevant: false,
  livedExperienceNotes: '',
  differentViewsIncluded: 'unclear',
  differentViewsNotes: '',
  changeFindingsNotes: '',
  fitAssessment: 'fits_well',
};

const SECOND_THOUGHT_STEPS = [
  {
    number: 1,
    phase: 'Notice',
    actionTitle: 'Who and what is here?',
    questionTitle: 'Who is included in your data?',
    supportingText: 'Who took part? Whose experiences, ideas or information are you using?',
    icon: <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
  },
  {
    number: 2,
    phase: 'Pause',
    actionTitle: 'What might I be overlooking?',
    questionTitle: 'Who might be missing?',
    supportingText: 'Are there people, experiences or ideas that you would expect to hear from but cannot find in your data?',
    icon: <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
  },
  {
    number: 3,
    phase: 'Question',
    actionTitle: 'Who or what might be missing?',
    questionTitle: 'Who created the knowledge you are using?',
    supportingText: 'Who did the research? Who collected the information? Who decided what it meant?',
    icon: <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
  },
  {
    number: 4,
    phase: 'Listen',
    actionTitle: 'What other experiences or ideas could I learn from?',
    questionTitle: 'Do you hear from people who have lived through what you are studying?',
    supportingText: 'If lived experience matters to your question, is it included in the evidence?',
    icon: <Compass className="w-4 h-4 text-[#1D9E75] dark:text-emerald-400" />,
  },
  {
    number: 5,
    phase: 'Reconsider',
    actionTitle: 'Could this change what I think the evidence means?',
    questionTitle: 'Are you hearing more than one point of view?',
    supportingText: 'Are there different experiences, cultures, communities, subjects or ways of understanding the issue that could help you see it more clearly?',
    icon: <HelpCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
  },
  {
    number: 6,
    phase: 'Choose',
    actionTitle: 'What should I check or explore next?',
    questionTitle: 'Could what is missing change your findings?',
    supportingText: 'Could missing people, experiences or ideas affect what you notice, what you think the evidence means, or what you decide?',
    icon: <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-300" />,
  },
];

export default function PerspectiveCheck({ papers, activeJourney, onInsertIntoDraft, headerActions }: PerspectiveCheckProps) {
  const journeyId = activeJourney?.id || 'default_journey';
  const [copiedToDraft, setCopiedToDraft] = useState(false);

  // State per journey stored in localStorage
  const [data, setData] = useState<PerspectiveCheckData>(() => {
    try {
      const saved = localStorage.getItem(`scholar_perspective_check_${journeyId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_DATA;
  });

  // Track expanded step (1..6) or 'summary' (0 for all collapsed by default)
  const [activeStep, setActiveStep] = useState<number | 'summary'>(0);
  
  // Track which steps have been completed / reviewed
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`scholar_perspective_check_${journeyId}`, JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  }, [data, journeyId]);

  // Detected paper sources and creator authors
  const paperAuthors = Array.from(
    new Set(
      papers
        .map((p) => p.authors)
        .filter(Boolean)
        .flatMap((a) => a.split(/, | and |;/))
    )
  ).slice(0, 8);

  const paperParticipantsDetected = papers
    .map((p) => p.structuredSummary?.participants)
    .filter((p): p is string => Boolean(p && p.trim().length > 0));

  const paperLimitationsDetected = papers
    .map((p) => p.structuredSummary?.limitations)
    .filter((l): l is string => Boolean(l && l.trim().length > 0));

  const handleUpdateData = (patch: Partial<PerspectiveCheckData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  };

  const handleToggleCategory = (field: 'includedCategories' | 'missingCategories' | 'creatorTypes', value: string) => {
    const list = data[field];
    const updated = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
    handleUpdateData({ [field]: updated });
  };

  const handleReset = () => {
    if (window.confirm('Reset your Perspective Check responses for this project?')) {
      setData(DEFAULT_DATA);
      setActiveStep(1);
      setCompletedSteps({ 1: false, 2: false, 3: false, 4: false, 5: false, 6: false });
    }
  };

  const handleNextStep = (currentNum: number) => {
    setCompletedSteps((prev) => ({ ...prev, [currentNum]: true }));
    if (currentNum < 6) {
      setActiveStep(currentNum + 1);
    } else {
      setActiveStep('summary');
    }
  };

  const handleExportReflection = () => {
    const summaryText = `PERSPECTIVE CHECK REFLECTION REPORT
Project: ${activeJourney?.title || 'Research Project'}
Date: ${new Date().toLocaleDateString()}

==================================================
1. MAIN RESEARCH QUESTION & FIT
==================================================
Question: ${activeJourney?.questions?.[0] || 'General Research Scope'}
Assessment: Does evidence fit the question? ${
      data.fitAssessment === 'fits_well'
        ? 'Yes, evidence fits the active question well.'
        : data.fitAssessment === 'narrow_focus'
        ? 'Appropriate for a narrow, specific focus.'
        : data.fitAssessment === 'needs_more_perspectives'
        ? 'You may want to look more closely at missing perspectives.'
        : 'Unclear based on currently available information.'
    }

==================================================
2. WHO IS INCLUDED IN YOUR DATA?
==================================================
Key Categories Included: ${data.includedCategories.join(', ') || 'None specified'}
Notes on Included People & Sources:
${data.includedNotes || '(No extra notes written)'}

==================================================
3. WHO MIGHT BE MISSING?
==================================================
Key Categories Missing/Unclear: ${data.missingCategories.join(', ') || 'None specified'}
Notes on Missing Perspectives:
${data.missingNotes || '(No extra notes written)'}

==================================================
4. WHO CREATED THE KNOWLEDGE?
==================================================
Knowledge Producer Types: ${data.creatorTypes.join(', ') || 'None specified'}
Notes on Authors/Creators:
${data.creatorsNotes || '(No extra notes written)'}

==================================================
5. LIVED EXPERIENCE & DIFFERENT VIEWS
==================================================
Lived Experience Status: ${
      data.livedExperienceNotRelevant
        ? 'Not relevant to this research'
        : data.livedExperienceIncluded === true
        ? 'Included in evidence'
        : data.livedExperienceIncluded === false
        ? 'Not currently represented'
        : 'Unclear from current sources'
    }
Notes on Lived Experience:
${data.livedExperienceNotes || '(None)'}

Multiple Points of View Status: ${data.differentViewsIncluded}
Notes on Different Perspectives:
${data.differentViewsNotes || '(None)'}

==================================================
6. KEY REFLECTIVE QUESTION: COULD THIS CHANGE YOUR FINDINGS?
==================================================
Impact on Findings & Decisions:
${data.changeFindingsNotes || '(No reflective notes entered)'}

==================================================
7. RECOMMENDED NEXT STEPS
==================================================
- Check whether missing perspectives matter for your specific research question.
- Compare findings across different sources where possible.
- Clearly state the scope and limits of your evidence in your final writing.
`;

    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perspective_check_reflection_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper to render unboxed 1-line summary when a step is collapsed
  const renderStepSummary = (stepNum: number) => {
    switch (stepNum) {
      case 1:
        if (data.includedCategories.length > 0 || data.includedNotes) {
          return `${data.includedCategories.length > 0 ? data.includedCategories.join(', ') : 'Notes entered'}`;
        }
        return 'Not answered yet';
      case 2:
        if (data.missingCategories.length > 0 || data.missingNotes) {
          return `${data.missingCategories.length > 0 ? data.missingCategories.join(', ') : 'Notes entered'}`;
        }
        return 'Not answered yet';
      case 3:
        if (data.creatorTypes.length > 0 || data.creatorsNotes) {
          return `${data.creatorTypes.length > 0 ? data.creatorTypes.join(', ') : 'Notes entered'}`;
        }
        return 'Not answered yet';
      case 4:
        if (data.livedExperienceNotRelevant) return 'Not relevant to this research';
        if (data.livedExperienceIncluded === true) return 'Included in evidence';
        if (data.livedExperienceIncluded === false) return 'Not currently represented';
        if (data.livedExperienceNotes) return 'Notes entered';
        return 'Not answered yet';
      case 5:
        if (data.differentViewsIncluded === 'yes') return 'Multiple viewpoints present';
        if (data.differentViewsIncluded === 'some') return 'Mostly single perspective';
        if (data.differentViewsIncluded === 'unclear') return 'Unclear from sources';
        if (data.differentViewsNotes) return 'Notes entered';
        return 'Not answered yet';
      case 6:
        if (data.fitAssessment === 'fits_well') return 'Fits research scope well';
        if (data.fitAssessment === 'narrow_focus') return 'Narrow focus appropriate';
        if (data.fitAssessment === 'needs_more_perspectives') return 'May need more perspectives';
        return 'Not answered yet';
      default:
        return 'Not answered yet';
    }
  };

  return (
    <div className="w-full font-sans text-stone-900 dark:text-stone-100 pb-16 space-y-8 animate-fadeIn">
      {/* FLAT TOP GUIDANCE & ACTIONS BAR - CLEAN LEFT ALIGNMENT WITH FULL WIDTH */}
      <div className="border-b border-stone-200/80 dark:border-stone-800/80 pb-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 leading-none">
              Perspective Check
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportReflection}
              className="text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/70 dark:border-stone-700 flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-2xs"
              title="Download reflection report"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Export (.txt)</span>
            </button>

            <button
              onClick={handleReset}
              className="text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/50 dark:border-stone-750 flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-2xs"
              title="Reset answers"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
              <span>Reset</span>
            </button>

            {headerActions}
          </div>
        </div>

        <div className="space-y-2 text-left">
          {/* Question Sub-heading - Smaller size */}
          <h4 className="font-sans text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 text-left">
            Does your evidence fit the question you are asking?
          </h4>

          {/* Core Principle placed below the question */}
          <div className="flex items-start gap-2 pt-0.5 flex-col sm:flex-row sm:items-baseline">
            <span className="font-mono text-[10px] uppercase font-bold text-[#912A4A] dark:text-rose-400 bg-[#912A4A]/10 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-[#912A4A]/20 dark:border-rose-900/30 whitespace-nowrap">
              Core Principle
            </span>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans text-left max-w-2xl">
              Think about whose experiences, ideas and knowledge are included, who might be missing, and whether this could change what you find.
            </p>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* FLAT PROGRESSIVE DISCLOSURE STEPS (1 TO 6) - ALL ALIGNED TO X=0   */}
      {/* ----------------------------------------------------------------- */}
      <div className="space-y-6">
        {SECOND_THOUGHT_STEPS.map((step) => {
          const isOpen = activeStep === step.number;
          const isCompleted = completedSteps[step.number];

          return (
            <div
              key={step.number}
              className="border-b border-stone-200/80 dark:border-stone-800/80 pb-6 transition-all"
            >
              {/* FLAT STEP HEADER BUTTON - FLUSH WITH LEFT MARGIN */}
              <button
                type="button"
                onClick={() => setActiveStep(isOpen ? 0 : step.number)}
                className="w-full flex items-start justify-between text-left group cursor-pointer py-1"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#912A4A] dark:text-rose-400">
                      0{step.number}
                    </span>
                    <span className="text-stone-300 dark:text-stone-700">·</span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold">
                      {step.phase}
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-medium">
                        ✓ Reviewed
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 group-hover:text-[#912A4A] dark:group-hover:text-rose-300 transition-colors">
                    {step.questionTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-500 shrink-0 pt-1">
                  {!isOpen && (
                    <span className="text-stone-400 dark:text-stone-500 text-xs hidden sm:inline truncate max-w-sm">
                      {renderStepSummary(step.number)}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-stone-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200" />
                  )}
                </div>
              </button>

              {/* FLAT EXPANDED STEP CONTENT - STRICTLY ALIGNED TO X=0 */}
              {isOpen && (
                <div className="mt-4 space-y-6 animate-fadeIn">
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed max-w-3xl">
                    {step.supportingText}
                  </p>

                  {/* STEP 1: Who is included in your data? */}
                  {step.number === 1 && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-stone-800 dark:text-stone-200 block">
                          Who took part or is represented in your sources? Select categories that apply:
                        </label>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {[
                            'Academic researchers',
                            'Survey participants',
                            'Interviewees',
                            'Community members',
                            'Professionals / Practitioners',
                            'Organisations / Institutions',
                            'Historical authors',
                            'General public',
                          ].map((cat) => {
                            const selected = data.includedCategories.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => handleToggleCategory('includedCategories', cat)}
                                className={`text-xs px-2.5 py-1 transition-all cursor-pointer flex items-center gap-1.5 rounded-sm ${
                                  selected
                                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-medium'
                                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-850'
                                }`}
                              >
                                {selected ? <Check className="w-3 h-3 text-[#1D9E75] dark:text-[#28c093]" /> : <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600" />}
                                {cat}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {paperParticipantsDetected.length > 0 && (
                        <div className="text-xs space-y-1 text-stone-600 dark:text-stone-400">
                          <span className="font-semibold text-stone-700 dark:text-stone-300 font-mono text-[11px] block">
                            Detected from references:
                          </span>
                          <div className="space-y-1 text-stone-600 dark:text-stone-400">
                            {paperParticipantsDetected.map((p, idx) => (
                              <div key={idx} className="flex items-start gap-1.5">
                                <span className="text-stone-400">•</span>
                                <span>{p}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5 max-w-3xl">
                        <label className="text-xs font-medium text-stone-800 dark:text-stone-200 block">
                          Notes on included people, sources, or groups:
                        </label>
                        <textarea
                          value={data.includedNotes}
                          onChange={(e) => handleUpdateData({ includedNotes: e.target.value })}
                          placeholder="Write a few words about who took part or whose information you are using..."
                          rows={3}
                          className="w-full text-xs p-3 border-b border-stone-300 dark:border-stone-700 bg-transparent text-stone-900 dark:text-stone-100 focus:border-[#912A4A] dark:focus:border-rose-400 outline-none resize-y placeholder:text-stone-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Who might be missing? */}
                  {step.number === 2 && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-stone-800 dark:text-stone-200 block">
                          Who or what might be missing or under-represented?
                        </label>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {[
                            'Specific geographic regions',
                            'Local / Indigenous communities',
                            'Frontline practitioners',
                            'Non-academic perspectives',
                            'Minority / Underrepresented groups',
                            'Recent historical perspectives',
                            'Alternative methodologies',
                          ].map((cat) => {
                            const selected = data.missingCategories.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => handleToggleCategory('missingCategories', cat)}
                                className={`text-xs px-2.5 py-1 transition-all cursor-pointer flex items-center gap-1.5 rounded-sm ${
                                  selected
                                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-medium'
                                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-850'
                                }`}
                              >
                                {selected ? <Check className="w-3 h-3 text-[#1D9E75] dark:text-[#28c093]" /> : <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600" />}
                                {cat}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {paperLimitationsDetected.length > 0 && (
                        <div className="text-xs space-y-1 text-stone-600 dark:text-stone-400">
                          <span className="font-semibold text-stone-700 dark:text-stone-300 font-mono text-[11px] block">
                            Limitations noted in reference collection:
                          </span>
                          <div className="space-y-1 text-stone-600 dark:text-stone-400">
                            {paperLimitationsDetected.map((lim, idx) => (
                              <div key={idx} className="flex items-start gap-1.5">
                                <span className="text-stone-400">•</span>
                                <span>{lim}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5 max-w-3xl">
                        <label className="text-xs font-medium text-stone-800 dark:text-stone-200 block">
                          Notes on missing perspectives:
                        </label>
                        <textarea
                          value={data.missingNotes}
                          onChange={(e) => handleUpdateData({ missingNotes: e.target.value })}
                          placeholder="Are there people, experiences or ideas you expected to find but could not find?"
                          rows={3}
                          className="w-full text-xs p-3 border-b border-stone-300 dark:border-stone-700 bg-transparent text-stone-900 dark:text-stone-100 focus:border-[#912A4A] dark:focus:border-rose-400 outline-none resize-y placeholder:text-stone-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Who created the knowledge you are using? */}
                  {step.number === 3 && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-stone-800 dark:text-stone-200 block">
                          Who produced the research or created the knowledge?
                        </label>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {[
                            'Academic researchers',
                            'Community members',
                            'Professionals / Field experts',
                            'Government / Policy bodies',
                            'Non-profit organisations',
                            'People with lived experience',
                          ].map((cat) => {
                            const selected = data.creatorTypes.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => handleToggleCategory('creatorTypes', cat)}
                                className={`text-xs px-2.5 py-1 transition-all cursor-pointer flex items-center gap-1.5 rounded-sm ${
                                  selected
                                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-medium'
                                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-850'
                                }`}
                              >
                                {selected ? <Check className="w-3 h-3 text-[#1D9E75] dark:text-[#28c093]" /> : <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600" />}
                                {cat}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {paperAuthors.length > 0 && (
                        <div className="text-xs space-y-1 text-stone-600 dark:text-stone-400">
                          <span className="font-semibold text-stone-700 dark:text-stone-300 font-mono text-[11px] block">
                            Key authors detected in your library:
                          </span>
                          <p className="text-stone-600 dark:text-stone-400">
                            {paperAuthors.join(', ')}
                          </p>
                        </div>
                      )}

                      <div className="space-y-1.5 max-w-3xl">
                        <label className="text-xs font-medium text-stone-800 dark:text-stone-200 block">
                          Notes on knowledge producers or researchers:
                        </label>
                        <textarea
                          value={data.creatorsNotes}
                          onChange={(e) => handleUpdateData({ creatorsNotes: e.target.value })}
                          placeholder="Who collected the data? Who decided what it meant?"
                          rows={3}
                          className="w-full text-xs p-3 border-b border-stone-300 dark:border-stone-700 bg-transparent text-stone-900 dark:text-stone-100 focus:border-[#912A4A] dark:focus:border-rose-400 outline-none resize-y placeholder:text-stone-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Do you hear from people with lived experience? */}
                  {step.number === 4 && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-stone-800 dark:text-stone-200 block">
                          Is lived experience included in your evidence?
                        </label>
                        <div className="flex flex-wrap gap-4 pt-1 text-xs">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateData({
                                livedExperienceIncluded: true,
                                livedExperienceNotRelevant: false,
                              })
                            }
                            className={`cursor-pointer transition-colors flex items-center gap-1.5 ${
                              data.livedExperienceIncluded === true && !data.livedExperienceNotRelevant
                                ? 'font-bold text-[#912A4A] dark:text-rose-300'
                                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              data.livedExperienceIncluded === true && !data.livedExperienceNotRelevant
                                ? 'border-[#912A4A] dark:border-rose-300'
                                : 'border-stone-400'
                            }`}>
                              {data.livedExperienceIncluded === true && !data.livedExperienceNotRelevant && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#912A4A] dark:bg-rose-300" />
                              )}
                            </span>
                            Yes, lived experience is included
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateData({
                                livedExperienceIncluded: false,
                                livedExperienceNotRelevant: false,
                              })
                            }
                            className={`cursor-pointer transition-colors flex items-center gap-1.5 ${
                              data.livedExperienceIncluded === false && !data.livedExperienceNotRelevant
                                ? 'font-bold text-[#912A4A] dark:text-rose-300'
                                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              data.livedExperienceIncluded === false && !data.livedExperienceNotRelevant
                                ? 'border-[#912A4A] dark:border-rose-300'
                                : 'border-stone-400'
                            }`}>
                              {data.livedExperienceIncluded === false && !data.livedExperienceNotRelevant && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#912A4A] dark:bg-rose-300" />
                              )}
                            </span>
                            Not currently represented
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateData({
                                livedExperienceNotRelevant: !data.livedExperienceNotRelevant,
                                livedExperienceIncluded: null,
                              })
                            }
                            className={`cursor-pointer transition-colors flex items-center gap-1.5 ${
                              data.livedExperienceNotRelevant
                                ? 'font-bold text-[#912A4A] dark:text-rose-300'
                                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              data.livedExperienceNotRelevant
                                ? 'border-[#912A4A] dark:border-rose-300'
                                : 'border-stone-400'
                            }`}>
                              {data.livedExperienceNotRelevant && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#912A4A] dark:bg-rose-300" />
                              )}
                            </span>
                            Not relevant to my research
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 max-w-3xl">
                        <label className="text-xs font-medium text-stone-800 dark:text-stone-200 block">
                          Notes on lived experience:
                        </label>
                        <textarea
                          value={data.livedExperienceNotes}
                          onChange={(e) => handleUpdateData({ livedExperienceNotes: e.target.value })}
                          placeholder={
                            data.livedExperienceNotRelevant
                              ? 'Explain briefly why lived experience is not relevant to this specific research topic...'
                              : 'Write about whose lived experience is included or missing...'
                          }
                          rows={3}
                          className="w-full text-xs p-3 border-b border-stone-300 dark:border-stone-700 bg-transparent text-stone-900 dark:text-stone-100 focus:border-[#912A4A] dark:focus:border-rose-400 outline-none resize-y placeholder:text-stone-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 5: Are you hearing more than one point of view? */}
                  {step.number === 5 && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-stone-800 dark:text-stone-200 block">
                          Are you hearing different views in your evidence?
                        </label>
                        <div className="flex flex-wrap gap-5 pt-1 text-xs">
                          {[
                            { value: 'yes', label: 'Yes, multiple viewpoints present' },
                            { value: 'some', label: 'Some, but mostly single perspective' },
                            { value: 'unclear', label: 'We don\'t have enough information to tell' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleUpdateData({ differentViewsIncluded: option.value })}
                              className={`cursor-pointer transition-colors flex items-center gap-1.5 ${
                                data.differentViewsIncluded === option.value
                                  ? 'font-bold text-[#912A4A] dark:text-rose-300'
                                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                              }`}
                            >
                              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                data.differentViewsIncluded === option.value
                                  ? 'border-[#912A4A] dark:border-rose-300'
                                  : 'border-stone-400'
                              }`}>
                                {data.differentViewsIncluded === option.value && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#912A4A] dark:bg-rose-300" />
                                )}
                              </span>
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 max-w-3xl">
                        <label className="text-xs font-medium text-stone-800 dark:text-stone-200 block">
                          Notes on different points of view or cultures/methods:
                        </label>
                        <textarea
                          value={data.differentViewsNotes}
                          onChange={(e) => handleUpdateData({ differentViewsNotes: e.target.value })}
                          placeholder="Are there alternative ways of understanding the issue that could help you see it clearly?"
                          rows={3}
                          className="w-full text-xs p-3 border-b border-stone-300 dark:border-stone-700 bg-transparent text-stone-900 dark:text-stone-100 focus:border-[#912A4A] dark:focus:border-rose-400 outline-none resize-y placeholder:text-stone-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 6: Could what is missing change your findings? */}
                  {step.number === 6 && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-stone-800 dark:text-stone-200 block">
                          How well does your evidence fit your specific research question?
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          {[
                            {
                              id: 'fits_well',
                              title: 'Fits research scope well',
                              desc: 'The current sources are well matched to the question being asked.',
                            },
                            {
                              id: 'narrow_focus',
                              title: 'Appropriate for a narrow focus',
                              desc: 'Specific group fits the intentionally narrow research boundaries.',
                            },
                            {
                              id: 'needs_more_perspectives',
                              title: 'You may want to look closer',
                              desc: 'A missing perspective might affect conclusions or story balance.',
                            },
                            {
                              id: 'unclear',
                              title: 'We don\'t have enough information to tell',
                              desc: 'Need to review method sections or look for extra sources first.',
                            },
                          ].map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleUpdateData({ fitAssessment: item.id as any })}
                              className="cursor-pointer space-y-1 group"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  data.fitAssessment === item.id
                                    ? 'border-[#912A4A] dark:border-rose-300'
                                    : 'border-stone-400 group-hover:border-stone-600'
                                }`}>
                                  {data.fitAssessment === item.id && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#912A4A] dark:bg-rose-300" />
                                  )}
                                </span>
                                <span className={`text-xs font-semibold ${
                                  data.fitAssessment === item.id
                                    ? 'text-[#912A4A] dark:text-rose-300 font-bold'
                                    : 'text-stone-900 dark:text-stone-100 group-hover:text-stone-700'
                                }`}>
                                  {item.title}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-500 leading-relaxed">
                                {item.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 max-w-3xl">
                        <label className="text-xs font-medium text-stone-800 dark:text-stone-200 block">
                          Reflective notes on findings & potential impact:
                        </label>
                        <textarea
                          value={data.changeFindingsNotes}
                          onChange={(e) => handleUpdateData({ changeFindingsNotes: e.target.value })}
                          placeholder="Write your reflection on how missing perspectives might change what you find, or why the current scope is appropriate..."
                          rows={3}
                          className="w-full text-xs p-3 border-b border-stone-300 dark:border-stone-700 bg-transparent text-stone-900 dark:text-stone-100 focus:border-[#912A4A] dark:focus:border-rose-400 outline-none resize-y placeholder:text-stone-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* ACTION ROW TO ADVANCE PROGRESSIVELY */}
                  <div className="pt-2 flex items-center justify-start">
                    <button
                      type="button"
                      onClick={() => handleNextStep(step.number)}
                      className="text-xs font-semibold px-4 py-2 rounded-md bg-[#912A4A] hover:bg-[#78223d] text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {step.number < 6 ? `Continue to Step 0${step.number + 1}` : 'Complete & View Summary'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* FLAT REFLECTION SUMMARY SECTION - ALL ALIGNED TO X=0               */}
      {/* ----------------------------------------------------------------- */}
      {(activeStep === 'summary' || Object.values(completedSteps).filter(Boolean).length >= 3) && (
        <div className="space-y-6 pt-4 border-t-2 border-stone-200/80 dark:border-stone-800/80 animate-fadeIn">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#912A4A] dark:text-rose-300" />
              Reflection Summary
            </h3>
            <div className="flex items-center gap-3">
              {onInsertIntoDraft && (
                <button
                  type="button"
                  onClick={() => {
                    const reflectionNote = `\n\n[PERSPECTIVE CHECK REFLECTION]:\n- Included perspectives: ${data.includedCategories.join(', ') || 'Standard library sources'}\n- Identified gaps: ${data.missingCategories.join(', ') || 'None flagged'}\n- Fit: ${data.fitAssessment.replace('_', ' ')}\n- Reflection note: ${data.changeFindingsNotes || data.missingNotes || 'Maintained reflective vigilance on unrepresented experiences.'}\n`;
                    onInsertIntoDraft(reflectionNote);
                    setCopiedToDraft(true);
                    setTimeout(() => setCopiedToDraft(false), 2000);
                  }}
                  className="px-2.5 py-1 bg-[#912A4A] hover:bg-[#78223d] text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{copiedToDraft ? 'Inserted in Draft' : 'Insert Reflection in Draft'}</span>
                </button>
              )}
              <button
                onClick={handleExportReflection}
                className="text-xs font-medium text-[#912A4A] dark:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download Reflection (.txt)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 1. WHAT IS INCLUDED */}
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1D9E75] dark:text-[#28c093]" />
                1. What is included?
              </h4>
              {data.includedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {data.includedCategories.map((c) => (
                    <span key={c} className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                      • {c}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {data.includedNotes || 'No specific notes entered yet for included groups.'}
              </p>
            </div>

            {/* 2. WHAT MIGHT BE MISSING */}
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                2. What might be missing?
              </h4>
              {data.missingCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {data.missingCategories.map((c) => (
                    <span key={c} className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                      • {c}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {data.missingNotes || 'No specific notes entered yet for missing perspectives.'}
              </p>
            </div>

            {/* 3. KNOWLEDGE CREATORS */}
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                3. Knowledge creators
              </h4>
              {data.creatorTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {data.creatorTypes.map((c) => (
                    <span key={c} className="text-[11px] text-sky-800 dark:text-sky-300 font-medium">
                      • {c}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {data.creatorsNotes || (paperAuthors.length > 0 ? `Key authors: ${paperAuthors.slice(0, 4).join(', ')}` : 'We don\'t have enough author information to tell.')}
              </p>
            </div>

            {/* 4. RESEARCH FIT & IMPACT */}
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
                4. Research question fit
              </h4>
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                {data.fitAssessment === 'fits_well'
                  ? 'Your evidence fits your active question well.'
                  : data.fitAssessment === 'narrow_focus'
                  ? 'This may be appropriate if your research has a narrow focus.'
                  : data.fitAssessment === 'needs_more_perspectives'
                  ? 'You may want to look more closely at missing perspectives.'
                  : 'We don\'t have enough information to tell if current sources fit completely.'}
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {data.changeFindingsNotes || 'Reflect on whether missing people or ideas could change what you notice.'}
              </p>
            </div>
          </div>

          {/* RECOMMENDED NEXT STEPS (FLAT - ALIGNED TO X=0) */}
          <div className="space-y-2 pt-4">
            <h4 className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              What could you do next?
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-stone-600 dark:text-stone-300">
              <div className="flex items-start gap-1.5">
                <span className="text-stone-400">•</span>
                <span>Find another source or point of view before drawing a conclusion</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-stone-400">•</span>
                <span>Check who took part in original research methodologies</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-stone-400">•</span>
                <span>Include lived experience, if relevant to your question</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-stone-400">•</span>
                <span>Compare findings from different sources and authors</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-stone-400">•</span>
                <span>Clearly explain the limits of your evidence in writing</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-stone-400">•</span>
                <span>Decide that current evidence is appropriate for your narrow scope</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
