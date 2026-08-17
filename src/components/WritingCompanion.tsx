/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, RefreshCw, BookOpen, Quote, Layers, ArrowRight, Lightbulb, Check } from 'lucide-react';
import { Paper } from '../types';
import ResearchIntegrityBanner from './ResearchIntegrityBanner';
import { postWithAiRouting } from '../lib/localAiService';

interface WritingCompanionProps {
  papers: Paper[];
  draftContent?: string;
  onUpdateDraftContent?: (newText: string) => void;
  activeChapterTitle?: string;
  journeyTitle?: string;
  onInsertCitation?: (citation: string) => void;
  headerActions?: React.ReactNode;
}

export default function WritingCompanion({
  papers,
  draftContent = '',
  onUpdateDraftContent,
  activeChapterTitle = 'Active Draft',
  journeyTitle,
  onInsertCitation,
  headerActions,
}: WritingCompanionProps) {
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'unsupported' | 'supported' | 'contradictions' | 'suggestions' | 'repetition'>('unsupported');
  const [appliedItemIdx, setAppliedItemIdx] = useState<number | null>(null);

  // Compute local repetition & word stats
  const wordsArray = draftContent.trim() ? draftContent.trim().toLowerCase().match(/\b[a-z]{4,}\b/g) || [] : [];
  const wordFrequency: Record<string, number> = {};
  wordsArray.forEach((w) => {
    // filter common stop words
    if (!['that', 'this', 'with', 'from', 'have', 'were', 'which', 'their', 'there', 'they', 'will', 'would', 'could', 'about', 'more', 'when', 'what', 'into', 'some', 'than', 'them', 'been'].includes(w)) {
      wordFrequency[w] = (wordFrequency[w] || 0) + 1;
    }
  });

  const repeatedWords = Object.entries(wordFrequency)
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const wordCount = draftContent.trim() ? draftContent.trim().split(/\s+/).length : 0;
  const charCount = draftContent.length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  const handleAnalyzeDraft = async () => {
    if (!draftContent || !draftContent.trim()) return;
    setLoadingAnalysis(true);

    try {
      // Package library papers details for context
      const libraryContext = papers.map((p) => ({
        id: p.id,
        title: p.title,
        authors: p.authors,
        structuredSummary: p.structuredSummary,
      }));

      const res = await postWithAiRouting('/api/gemini/analyze-draft', {
        draftText: draftContent,
        papersInLibrary: libraryContext,
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleInsertPaperCitation = (paperTitle: string, idx: number) => {
    const matched = papers.find(p => p.title.toLowerCase().includes(paperTitle.toLowerCase()) || paperTitle.toLowerCase().includes(p.title.toLowerCase()));
    let citation = `(${paperTitle})`;
    if (matched) {
      const firstAuthor = matched.authors.split(',')[0].trim();
      citation = ` (${firstAuthor} et al., ${matched.year})`;
    }
    
    if (onInsertCitation) {
      onInsertCitation(citation);
    } else if (onUpdateDraftContent) {
      onUpdateDraftContent(`${draftContent.trimEnd()}${citation} `);
    }
    setAppliedItemIdx(idx);
    setTimeout(() => setAppliedItemIdx(null), 2000);
  };

  return (
    <div className="w-full font-sans text-stone-850 dark:text-stone-100 space-y-6 animate-fadeIn" id="writing-assistant-module">
      {/* Calm Flat Top Header & Actions Bar */}
      <div className="border-b border-stone-200/80 dark:border-stone-800/80 pb-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 truncate leading-none">
              Writing Assistant
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-300 font-semibold rounded-md border border-[#912A4A]/20 dark:border-rose-900/30 shrink-0 whitespace-nowrap">
              Linked to Draft
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAnalyzeDraft}
              disabled={loadingAnalysis || wordCount === 0}
              className="px-3 py-1.5 bg-[#912A4A] hover:bg-[#78223d] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 shadow-2xs shrink-0"
              id="analyze-active-draft-btn"
            >
              <Sparkles className={`w-3.5 h-3.5 ${loadingAnalysis ? 'animate-spin' : ''}`} />
              <span>{loadingAnalysis ? 'Analyzing Draft...' : 'Check Draft'}</span>
            </button>
            {headerActions}
          </div>
        </div>

        {/* Full-width metadata info row */}
        <p className="text-xs text-stone-500 dark:text-stone-400 w-full">
          Analyzing <strong className="text-stone-700 dark:text-stone-300 font-medium">{activeChapterTitle}</strong> ({wordCount} words · ~{readTimeMin}m read)
        </p>

        {/* Research Integrity Boundary Active - Calm Inline Row */}
        <div>
          <ResearchIntegrityBanner variant="inline" />
        </div>
      </div>

      {/* Analysis Tabs & Content - Horizontal Flat Tabs with lowered scrollbar */}
      <div className="space-y-5">
        <div className="overflow-x-auto pb-3.5 pt-1" role="tablist">
          <div className="flex items-center gap-6 text-xs font-medium border-b border-stone-200/80 dark:border-stone-800 pb-0 min-w-max">
            <button
              type="button"
              onClick={() => setActiveAnalysisTab('unsupported')}
              className={`pb-2.5 -mb-px border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeAnalysisTab === 'unsupported'
                  ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Unsupported Claims {analysisResult?.unsupportedClaims?.length ? `(${analysisResult.unsupportedClaims.length})` : ''}
            </button>
            
            <button
              type="button"
              onClick={() => setActiveAnalysisTab('supported')}
              className={`pb-2.5 -mb-px border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeAnalysisTab === 'supported'
                  ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Supported by Library {analysisResult?.supportedByLibrary?.length ? `(${analysisResult.supportedByLibrary.length})` : ''}
            </button>

            <button
              type="button"
              onClick={() => setActiveAnalysisTab('contradictions')}
              className={`pb-2.5 -mb-px border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeAnalysisTab === 'contradictions'
                  ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Debates & Nuance {analysisResult?.contradictoryEvidence?.length ? `(${analysisResult.contradictoryEvidence.length})` : ''}
            </button>

            <button
              type="button"
              onClick={() => setActiveAnalysisTab('suggestions')}
              className={`pb-2.5 -mb-px border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeAnalysisTab === 'suggestions'
                  ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Structure & Flow
            </button>

            <button
              type="button"
              onClick={() => setActiveAnalysisTab('repetition')}
              className={`pb-2.5 -mb-px border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeAnalysisTab === 'repetition'
                  ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Repetition & Vocabulary
          </button>
        </div>
      </div>

        {/* Tab Contents */}
        <div className="space-y-3 min-h-[160px]">
          {loadingAnalysis ? (
            <div className="py-12 text-center space-y-2 text-stone-500 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#912A4A]" />
              <p>Checking your draft against your {papers.length} saved reference articles...</p>
            </div>
          ) : wordCount === 0 ? (
            <div className="py-12 text-center space-y-1.5 text-stone-400 dark:text-stone-600 text-xs">
              <BookOpen className="w-6 h-6 mx-auto opacity-60 text-stone-400" />
              <p className="font-medium text-stone-600 dark:text-stone-400">The writing canvas is currently empty.</p>
              <p>Type thoughts or paragraphs into the writing area on the left, then click "Check Draft".</p>
            </div>
          ) : (
            <>
              {activeAnalysisTab === 'unsupported' && (
                <div className="space-y-3">
                  {analysisResult?.unsupportedClaims?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-stone-50/70 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800 rounded-xl space-y-3 text-xs"
                    >
                      {/* Alert Header */}
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#912A4A]/10 text-[#912A4A] dark:bg-rose-950/40 dark:text-rose-300 uppercase tracking-wide">
                          <AlertCircle className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
                          Claim Needs Citation
                        </span>
                        <span className="text-[11px] text-stone-500 font-mono">
                          Requires literature grounding
                        </span>
                      </div>

                      {/* Claim Statement */}
                      <div className="py-1">
                        <p className="font-serif italic text-sm sm:text-base text-stone-900 dark:text-stone-100 leading-relaxed">
                          "{item.claimText}"
                        </p>
                      </div>

                      {/* Issue & Suggestion */}
                      <div className="space-y-2 pt-1 border-t border-stone-200/50 dark:border-stone-800">
                        <div className="text-xs text-stone-700 dark:text-stone-300">
                          <span className="font-semibold text-stone-900 dark:text-stone-100">Issue: </span>
                          {item.issue}
                        </div>
                        <div className="text-xs text-stone-700 dark:text-stone-300">
                          <span className="font-semibold text-[#912A4A] dark:text-rose-300">Recommendation: </span>
                          {item.recommendation}
                        </div>
                      </div>
                    </div>
                  ))}

                  {analysisResult && (!analysisResult.unsupportedClaims || analysisResult.unsupportedClaims.length === 0) && (
                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>All key claims in this draft appear supported by your references!</span>
                    </div>
                  )}

                  {!analysisResult && (
                    <div className="py-8 text-center text-xs text-stone-400 dark:text-stone-500 space-y-1">
                      <p>Click <strong className="text-stone-600 dark:text-stone-300">"Check Draft"</strong> to identify statements in your manuscript that may require empirical grounding or literature citations.</p>
                    </div>
                  )}
                </div>
              )}

              {activeAnalysisTab === 'supported' && (
                <div className="space-y-3">
                  {analysisResult?.supportedByLibrary?.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 bg-stone-50/70 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800 rounded-xl space-y-3 text-xs">
                      <div className="flex justify-between items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 uppercase tracking-wide">
                          Evidence Found in Library
                        </span>
                        <button
                          type="button"
                          onClick={() => handleInsertPaperCitation(item.paperTitle, idx)}
                          className="px-2.5 py-1 bg-[#912A4A] hover:bg-[#78223d] text-white rounded-lg text-xs font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {appliedItemIdx === idx ? <Check className="w-3 h-3" /> : <Quote className="w-3 h-3" />}
                          <span>{appliedItemIdx === idx ? 'Inserted' : 'Insert Citation'}</span>
                        </button>
                      </div>
                      <div className="py-1">
                        <p className="font-serif italic text-sm text-stone-900 dark:text-stone-100 leading-relaxed">
                          "{item.claimText}"
                        </p>
                      </div>
                      <div className="text-xs text-stone-700 dark:text-stone-300 space-y-1 pt-1 border-t border-stone-200/50 dark:border-stone-800">
                        <p><strong className="text-stone-900 dark:text-stone-100">Source:</strong> {item.paperTitle}</p>
                        <p className="text-stone-600 dark:text-stone-400">{item.howItSupports}</p>
                      </div>
                    </div>
                  ))}

                  {analysisResult && (!analysisResult.supportedByLibrary || analysisResult.supportedByLibrary.length === 0) && (
                    <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 text-xs text-stone-500">
                      No direct library citations mapped yet for current sentences.
                    </div>
                  )}

                  {!analysisResult && (
                    <div className="py-8 text-center text-xs text-stone-400 space-y-1">
                      <p>Click "Check Draft" above to map your draft's arguments directly against your stored library.</p>
                    </div>
                  )}
                </div>
              )}

              {activeAnalysisTab === 'contradictions' && (
                <div className="space-y-3">
                  {analysisResult?.contradictoryEvidence?.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 bg-stone-50/70 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800 rounded-xl space-y-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100/70 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 uppercase tracking-wide">
                        Opposing Literature / Debate
                      </span>
                      <div className="py-1">
                        <p className="font-serif italic text-sm text-stone-900 dark:text-stone-100 leading-relaxed">
                          "{item.draftClaim}"
                        </p>
                      </div>
                      <div className="text-xs text-stone-700 dark:text-stone-300 space-y-1 pt-1 border-t border-stone-200/50 dark:border-stone-800">
                        <p><strong className="text-stone-900 dark:text-stone-100">Contrasting Source:</strong> {item.paperTitle}</p>
                        <p className="text-stone-600 dark:text-stone-400">{item.conflictDetails}</p>
                      </div>
                    </div>
                  ))}

                  {analysisResult && (!analysisResult.contradictoryEvidence || analysisResult.contradictoryEvidence.length === 0) && (
                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                      No contradictory evidence flagged in your reference library.
                    </div>
                  )}

                  {!analysisResult && (
                    <div className="py-8 text-center text-xs text-stone-400 space-y-1">
                      <p>Inspect potential scholarly counter-arguments and nuance across your reference library.</p>
                    </div>
                  )}
                </div>
              )}

              {activeAnalysisTab === 'suggestions' && (
                <div className="space-y-2">
                  {analysisResult?.outlineSuggestions?.map((item: string, idx: number) => (
                    <div key={idx} className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200/60 dark:border-stone-800 rounded-lg flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300">
                      <span className="font-mono text-[10px] bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-300 px-1.5 py-0.5 rounded font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}

                  {!analysisResult && (
                    <div className="py-8 text-center text-xs text-stone-400 space-y-1">
                      <p>Run analysis to get structural suggestions and transitions for this chapter.</p>
                    </div>
                  )}
                </div>
              )}

              {activeAnalysisTab === 'repetition' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
                      Word Frequency & Repetition
                    </h4>
                    <p className="text-[11px] text-stone-500 mb-3">
                      Words used frequently in this section. Consider synonyms or varied sentence openings.
                    </p>

                    {repeatedWords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {repeatedWords.map(([word, count]) => (
                          <span
                            key={word}
                            className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 rounded-md border border-stone-200/60 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs flex items-center gap-1.5"
                          >
                            <span className="font-medium">{word}</span>
                            <span className="font-mono text-[10px] text-[#912A4A] dark:text-rose-400 font-bold bg-[#912A4A]/10 px-1 rounded">
                              ×{count}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-stone-400 italic">No significant word repetition detected in current text.</p>
                    )}
                  </div>

                  <div className="p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200/60 dark:border-stone-800 rounded-lg space-y-1 text-[11px] text-stone-600 dark:text-stone-400">
                    <p className="font-semibold text-stone-800 dark:text-stone-200">Writing Cadence</p>
                    <p>Total Words: <strong className="text-stone-800 dark:text-stone-200">{wordCount}</strong> · Total Characters: <strong className="text-stone-800 dark:text-stone-200">{charCount}</strong></p>
                    <p>Estimated Reading Duration: <strong className="text-stone-800 dark:text-stone-200">~{readTimeMin} minutes</strong></p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
