/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Sparkles, BookOpen, Layers, Check } from 'lucide-react';
import { Paper } from '../types';
import { postWithAiRouting } from '../lib/localAiService';
import HorizontalDisclosureRow from './HorizontalDisclosureRow';

interface LiteratureIntelligenceProps {
  papers: Paper[];
  onUpdatePaper: (updated: Paper) => void;
}

export default function LiteratureIntelligence({ papers, onUpdatePaper }: LiteratureIntelligenceProps) {
  const [activeSubTab, setActiveSubTab] = useState<'single' | 'synthesis'>('single');
  const [selectedPaperId, setSelectedPaperId] = useState<string>(papers[0]?.id || '');
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Synthesis states
  const [selectedPaperIdsForSynthesis, setSelectedPaperIdsForSynthesis] = useState<string[]>(papers.map(p => p.id));
  const [synthesisResult, setSynthesisResult] = useState<any>(null);
  const [loadingSynthesis, setLoadingSynthesis] = useState(false);

  const selectedPaper = papers.find((p) => p.id === selectedPaperId);

  const handleGenerateSummary = async (paperToSummarize?: Paper) => {
    const target = paperToSummarize || selectedPaper;
    if (!target) return;
    setLoadingSummary(true);

    try {
      const res = await postWithAiRouting('/api/gemini/summarize', {
        title: target.title,
        authors: target.authors,
        abstract: target.abstract || '',
        notes: target.notes || '',
      });

      if (res.ok) {
        const data = await res.json();
        const updated: Paper = {
          ...target,
          structuredSummary: data,
        };
        onUpdatePaper(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleToggleSynthesisPaper = (id: string) => {
    setSelectedPaperIdsForSynthesis((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAllSynthesis = () => {
    if (selectedPaperIdsForSynthesis.length === papers.length) {
      setSelectedPaperIdsForSynthesis([]);
    } else {
      setSelectedPaperIdsForSynthesis(papers.map(p => p.id));
    }
  };

  const handleRunSynthesis = async () => {
    if (selectedPaperIdsForSynthesis.length < 2) return;
    setLoadingSynthesis(true);

    try {
      const papersToSynthesize = papers.filter((p) => selectedPaperIdsForSynthesis.includes(p.id));
      const res = await postWithAiRouting('/api/gemini/connect-literature', { papers: papersToSynthesize });

      if (res.ok) {
        const data = await res.json();
        setSynthesisResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSynthesis(false);
    }
  };

  return (
    <div className="space-y-6" id="literature-intelligence-module">
      {/* Sub tabs navigation - Unboxed on cream background */}
      <div className="border-b border-stone-200/80 dark:border-stone-800 flex justify-between items-center pb-px">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveSubTab('single')}
            className={`font-sans text-xs pb-2 border-b-2 font-medium cursor-pointer transition-colors ${
              activeSubTab === 'single'
                ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            Single-Paper Meta Analysis
          </button>
          <button
            onClick={() => setActiveSubTab('synthesis')}
            className={`font-sans text-xs pb-2 border-b-2 font-medium cursor-pointer transition-colors ${
              activeSubTab === 'synthesis'
                ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            Multi-Paper Synthesis Workshop
          </button>
        </div>
      </div>

      {/* SINGLE PAPER ANALYSIS SECTION */}
      {activeSubTab === 'single' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/70 dark:border-stone-800/80 pb-3">
            <div>
              <h3 className="font-sans font-semibold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#912A4A] dark:text-rose-400" />
                <span>Select Document to Inspect ({papers.length} articles)</span>
              </h3>
              <p className="font-sans text-xs text-stone-500 dark:text-stone-400">
                Sorted alphabetically (A–Z) with full horizontal progressive disclosure.
              </p>
            </div>
          </div>

          {/* Horizontal Paper Items List (Alphabetical Order A-Z) */}
          <div className="space-y-1">
            {[...papers]
              .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
              .map((p) => {
                const isSelected = p.id === selectedPaperId;
                const keywordsList = [
                  `${p.authors || 'Unknown'} (${p.year || 'n.d.'})`,
                  p.journal ? p.journal : null,
                  p.structuredSummary ? 'Summary Ready' : 'Unprocessed',
                  ...(p.tags || [])
                ].filter(Boolean) as string[];

                return (
                  <HorizontalDisclosureRow
                    key={p.id}
                    id={`single-paper-row-${p.id}`}
                    isExpanded={isSelected}
                    onToggle={() => setSelectedPaperId(p.id)}
                    prefix={
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-[#1D9E75] bg-[#1D9E75] dark:border-[#28c093] dark:bg-[#28c093] text-white'
                            : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    }
                    title={p.title}
                    keywords={keywordsList}
                    summary={
                      p.abstract ? (
                        <p className="font-sans text-xs text-stone-700 dark:text-stone-300 leading-relaxed italic">
                          "{p.abstract}"
                        </p>
                      ) : (
                        <p className="text-xs text-stone-400 italic">No abstract text available.</p>
                      )
                    }
                    children={
                      <div className="space-y-3 pt-2">
                        {p.structuredSummary ? (
                          <div className="space-y-2">
                            <h5 className="font-sans font-semibold text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                              Structured Analytical Breakdown
                            </h5>

                            <HorizontalDisclosureRow
                              title="1. Research Inquiry & Aim"
                              keywords={['Focus & Purpose']}
                              summary={p.structuredSummary.researchQuestion || 'Not explicitly stated in publication.'}
                              defaultExpanded={true}
                            />

                            <HorizontalDisclosureRow
                              title="2. Methodology & Design"
                              keywords={['Procedure', 'Study Design']}
                              summary={p.structuredSummary.methods || 'Methodology extracted from publication text.'}
                              defaultExpanded={false}
                            />

                            <HorizontalDisclosureRow
                              title="3. Participants & Sample"
                              keywords={['Sample & Context']}
                              summary={p.structuredSummary.participants || 'Participant cohorts and experimental settings.'}
                              defaultExpanded={false}
                            />

                            <HorizontalDisclosureRow
                              title="4. Core Findings & Takeaways"
                              keywords={['Key Takeaway', 'Empirical Result']}
                              summary={p.structuredSummary.findings || 'Primary analytical results.'}
                              defaultExpanded={true}
                            />

                            <HorizontalDisclosureRow
                              title="5. Limitations & Boundaries"
                              keywords={['Boundaries', 'Scope Limits']}
                              summary={p.structuredSummary.limitations || 'Boundary parameters and observational limits.'}
                              defaultExpanded={false}
                            />

                            <HorizontalDisclosureRow
                              title="6. Evidence Justification"
                              keywords={['Rigour', 'Evidence Strength']}
                              summary={p.structuredSummary.evidenceExplanation || 'Assessed through methodology and sample size.'}
                              defaultExpanded={false}
                            />

                            {p.structuredSummary.keyQuotations && p.structuredSummary.keyQuotations.length > 0 && (
                              <HorizontalDisclosureRow
                                title="7. Traceable Key Quotations"
                                keywords={['Excerpts', `${p.structuredSummary.keyQuotations.length} Quotations`]}
                                summary={
                                  <div className="space-y-1.5 pl-2">
                                    {p.structuredSummary.keyQuotations.map((quote: string, i: number) => (
                                      <p key={i} className="text-xs text-stone-600 dark:text-stone-400 italic">
                                        "{quote}"
                                      </p>
                                    ))}
                                  </div>
                                }
                                defaultExpanded={false}
                              />
                            )}

                            {p.structuredSummary.futureResearch && (
                              <HorizontalDisclosureRow
                                title="8. Future Research Gaps"
                                keywords={['Horizon', 'Future Inquiries']}
                                summary={p.structuredSummary.futureResearch}
                                defaultExpanded={false}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="p-3 bg-stone-50 dark:bg-stone-900/40 rounded-lg text-xs text-stone-500">
                            No structured summary generated yet for this paper. Click below to generate an in-depth breakdown.
                          </div>
                        )}
                      </div>
                    }
                    actions={
                      <div className="flex items-center justify-between w-full pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateSummary(p);
                          }}
                          disabled={loadingSummary}
                          className="font-sans text-xs font-semibold bg-[#912A4A] text-white px-3.5 py-1.5 rounded-lg hover:bg-[#78223d] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3 text-rose-200" />
                          <span>{loadingSummary ? 'Analyzing...' : p.structuredSummary ? 'Re-generate Summary' : 'Generate Summary'}</span>
                        </button>
                      </div>
                    }
                  />
                );
              })}
          </div>
        </div>
      )}

      {/* CROSS PAPER SYNTHESIS WORKSHOP */}
      {activeSubTab === 'synthesis' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/70 dark:border-stone-800/80 pb-3">
            <div>
              <h3 className="font-sans font-semibold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#912A4A] dark:text-rose-400" />
                <span>Select Articles to Compare ({selectedPaperIdsForSynthesis.length}/{papers.length})</span>
              </h3>
              <p className="font-sans text-xs text-stone-500 dark:text-stone-400">
                Sorted alphabetically (A–Z). Choose documents to synthesize agreements and divergence.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllSynthesis}
                className="font-sans text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:underline px-2 py-1 cursor-pointer"
              >
                {selectedPaperIdsForSynthesis.length === papers.length ? 'Deselect All' : 'Select All'}
              </button>

              <button
                onClick={handleRunSynthesis}
                disabled={loadingSynthesis || selectedPaperIdsForSynthesis.length < 2}
                className="font-sans text-xs font-semibold bg-[#912A4A] text-white px-4 py-2 rounded-xl hover:bg-[#78223d] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                <span>{loadingSynthesis ? 'Comparing...' : 'Compare Main Ideas & Themes'}</span>
              </button>
            </div>
          </div>

          {/* Horizontal Checkbox List (Alphabetical Order A-Z) */}
          <div className="space-y-1">
            {[...papers]
              .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
              .map((p) => {
                const isChecked = selectedPaperIdsForSynthesis.includes(p.id);
                const keywordsList = [
                  `${p.authors || 'Unknown'} (${p.year || 'n.d.'})`,
                  p.journal ? p.journal : null,
                  isChecked ? 'Included in Synthesis' : 'Excluded'
                ].filter(Boolean) as string[];

                return (
                  <HorizontalDisclosureRow
                    key={p.id}
                    id={`synthesis-paper-row-${p.id}`}
                    prefix={
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSynthesisPaper(p.id)}
                        className="w-4 h-4 rounded text-[#1D9E75] focus:ring-[#1D9E75] accent-[#1D9E75] dark:accent-[#28c093] cursor-pointer"
                      />
                    }
                    title={p.title}
                    keywords={keywordsList}
                    summary={
                      p.abstract ? (
                        <p className="font-sans text-xs text-stone-700 dark:text-stone-300 leading-relaxed italic">
                          "{p.abstract}"
                        </p>
                      ) : (
                        <p className="text-xs text-stone-400 italic">No abstract text available.</p>
                      )
                    }
                    defaultExpanded={false}
                  />
                );
              })}
          </div>

          {/* Results Area */}
          <div className="space-y-4 pt-2">
            {loadingSynthesis ? (
              <div className="py-10 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-6 h-6 border-2 border-[#912A4A] border-t-transparent rounded-full animate-spin"></div>
                <p className="font-sans text-xs text-stone-500 italic">Comparing your articles, finding common topics, and spotting differences...</p>
              </div>
            ) : synthesisResult ? (
              <div className="space-y-3 animate-fadeIn">
                <h4 className="font-sans font-bold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wide">
                  Synthesis Comparison Report
                </h4>

                <HorizontalDisclosureRow
                  title="Where the Articles Agree"
                  keywords={['Consensus', 'Synthesis Agreement']}
                  summary={synthesisResult.agreements}
                  defaultExpanded={true}
                />

                <HorizontalDisclosureRow
                  title="Where the Articles Disagree or Differ"
                  keywords={['Divergence', 'Epistemic Debate']}
                  summary={synthesisResult.disagreements}
                  defaultExpanded={true}
                />

                {synthesisResult.thematicClusters?.map((cluster: any, idx: number) => (
                  <HorizontalDisclosureRow
                    key={idx}
                    title={cluster.themeName}
                    keywords={[`Thematic Cluster ${idx + 1}`]}
                    summary={cluster.description}
                    defaultExpanded={false}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">
                Select at least 2 articles and click "Compare Main Ideas & Themes".
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
