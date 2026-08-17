/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResearchWellbeingInsight, 
  UserUploadedDoc 
} from '../types/wellbeingInsights';
import { INITIAL_WELLBEING_INSIGHTS } from '../data/wellbeingInsightsData';
import { getUserLibrary } from '../lib/userLibraryStorage';
import ArticleReaderModal from './ArticleReaderModal';
import MyResearchLibrary from './MyResearchLibrary';

export default function ResearchWellbeingInsights() {
  const [insights, setInsights] = useState<ResearchWellbeingInsight[]>(() => {
    const raw = localStorage.getItem('second_thought_insights');
    return raw ? JSON.parse(raw) : INITIAL_WELLBEING_INSIGHTS;
  });

  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'insights' | 'my_library'>('insights');
  const [evidenceTab, setEvidenceTab] = useState<'academic' | 'creative' | 'additional'>('academic');

  // Progressive disclosure states (collapsed by default)
  const [openInsights, setOpenInsights] = useState<Record<string, boolean>>({});

  const toggleInsight = (id: string) => {
    setOpenInsights((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const setAllInsightsOpen = (open: boolean) => {
    const nextState: Record<string, boolean> = {};
    insights.forEach((i) => {
      nextState[i.id] = open;
    });
    setOpenInsights(nextState);
  };

  // Reader Modal State
  const [readerArticle, setReaderArticle] = useState<any | null>(null);

  // Editable summary state
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  // User library sync
  const [userDocs, setUserDocs] = useState<UserUploadedDoc[]>([]);

  useEffect(() => {
    setUserDocs(getUserLibrary());
    const handleSync = () => {
      setUserDocs(getUserLibrary());
    };
    window.addEventListener('user_library_updated', handleSync);
    return () => {
      window.removeEventListener('user_library_updated', handleSync);
    };
  }, []);

  const handleSaveInsights = (updated: ResearchWellbeingInsight[]) => {
    setInsights(updated);
    localStorage.setItem('second_thought_insights', JSON.stringify(updated));
  };

  const selectedInsight = insights.find(i => i.id === selectedInsightId) || null;

  const handleStartEditSummary = (insight: ResearchWellbeingInsight) => {
    setSummaryText(insight.summary);
    setEditingSummary(true);
  };

  const handleSaveSummary = () => {
    if (!selectedInsight) return;
    const updated = insights.map(i => i.id === selectedInsight.id ? { ...i, summary: summaryText } : i);
    handleSaveInsights(updated);
    setEditingSummary(false);
  };

  const filteredInsights = insights.filter(ins => {
    const query = searchQuery.toLowerCase();
    return (
      ins.title.toLowerCase().includes(query) ||
      ins.researchQuestion.toLowerCase().includes(query) ||
      ins.category.toLowerCase().includes(query) ||
      ins.summary.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans px-4 sm:px-6 py-6 animate-fadeIn text-left" id="research-wellbeing-insights-root">
      
      {/* Header (Matching Wellbeing Centre Layout Language) */}
      <div className="border-b border-[#912A4A] pb-6 mb-8 text-left" id="wellbeing-insights-header-container">
        <div className="space-y-1.5" id="wellbeing-insights-header-text">
          <h1 className="font-sans font-medium tracking-tight text-2xl sm:text-3xl text-[#1B0A3B] flex items-center gap-3" id="wellbeing-insights-title">
            <span>Wellbeing Research Insights</span>
          </h1>
          <p className="font-sans text-[#1B0A3B] text-xs sm:text-sm leading-relaxed" id="wellbeing-insights-subtitle">
            Curated evidence library exploring the human experience of writing, research, creative practice, cognition, identity, and personal wellbeing.
          </p>
          <div className="flex items-center gap-1.5 pt-1.5 text-xs font-sans text-[#1B0A3B]" id="wellbeing-insights-meta">
            <span>Open Access papers, evidence syntheses & extended references</span>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-end text-xs text-[#1B0A3B] pb-2 border-b border-[#912A4A] gap-y-2" id="wellbeing-insights-controls">
        {!selectedInsight && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAllInsightsOpen(true)}
              className="hover:underline transition-colors cursor-pointer text-[#1B0A3B]"
              id="wellbeing-insights-expand-all-btn"
            >
              Expand All
            </button>
            <span className="text-[#1B0A3B]">•</span>
            <button
              type="button"
              onClick={() => setAllInsightsOpen(false)}
              className="hover:underline transition-colors cursor-pointer text-[#1B0A3B]"
              id="wellbeing-insights-collapse-all-btn"
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* VIEW: INSIGHTS DIRECTORY (Unboxed Progressive Disclosure List) */}
      {!selectedInsight && (
        <div className="space-y-6" id="wellbeing-insights-directory">
          
          {/* Unboxed Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2">
            <div className="relative flex-grow max-w-md">
              <input
                type="text"
                placeholder="Search topics, authors, or article ideas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-md bg-[#1B0A3B]/5 border border-[#1B0A3B]/20 focus:outline-none focus:ring-2 focus:ring-[#1B0A3B] text-[#1B0A3B] placeholder:text-[#1B0A3B]/60"
              />
            </div>

            <div className="text-xs text-[#1B0A3B] font-sans flex items-center gap-1.5">
              <span>Offline Open-Access & Extended Evidence</span>
            </div>
          </div>

          {/* Unboxed Progressive Disclosure List */}
          <div className="space-y-0" id="wellbeing-insights-principles-list">
            {filteredInsights.map((insight, idx) => {
              const isOpen = openInsights[insight.id];
              const openAccessCount = insight.embeddedArticles.length;
              const extendedCount = insight.additionalSources.length;
              const userAttachedCount = userDocs.filter(d => d.attachedInsightIds?.includes(insight.id)).length;

              return (
                <React.Fragment key={insight.id}>
                  {idx > 0 && (
                    <div className="h-[2px] w-full bg-[#912A4A] my-6 sm:my-8 opacity-80" />
                  )}
                  <div className="py-2 text-left" id={`wellbeing-insight-item-${insight.id}`}>
                    <button
                      type="button"
                      onClick={() => toggleInsight(insight.id)}
                      aria-expanded={isOpen}
                      aria-controls={`wellbeing-insight-content-${insight.id}`}
                      className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B0A3B] rounded-sm py-1 cursor-pointer group"
                      id={`wellbeing-insight-btn-${insight.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-sans font-semibold text-base sm:text-lg tracking-tight text-[#1B0A3B] transition-colors">
                            {insight.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold tracking-wider text-[#1B0A3B]">
                              {insight.category}
                            </span>
                            <span className="text-[#1B0A3B]">•</span>
                            <span className="text-xs text-[#1B0A3B] font-sans">
                              {insight.readingTime}
                            </span>
                          </div>
                        </div>
                        <span
                          className="text-xs font-semibold text-[#912A4A] dark:text-rose-400 shrink-0 leading-none select-none ml-2 pt-1 hover:underline"
                          aria-hidden="true"
                        >
                          {isOpen ? 'See less ↑' : 'Find out more →'}
                        </span>
                      </div>

                      {/* 1st-layer statement */}
                      <p className="mt-[16pt] font-sans text-sm sm:text-base text-[#1B0A3B] font-normal leading-relaxed">
                        "{insight.researchQuestion}"
                      </p>
                    </button>

                    {/* 2nd-layer full text */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`wellbeing-insight-content-${insight.id}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{
                            height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                            opacity: { duration: 0.25, ease: 'easeInOut', delay: 0.05 }
                          }}
                          className="overflow-hidden space-y-4 pt-3 pb-2"
                        >
                          <p className="font-sans text-xs sm:text-sm text-[#1B0A3B] leading-relaxed italic">
                            {insight.summary}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                            <div className="flex items-center gap-3 font-mono text-[#1B0A3B]">
                              {openAccessCount > 0 && (
                                <span className="text-[#1B0A3B] font-semibold flex items-center gap-1">
                                  {openAccessCount} CC Papers
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-[#1B0A3B]">
                                {extendedCount} Extended
                              </span>
                              {userAttachedCount > 0 && (
                                <span className="text-[#1B0A3B] font-semibold flex items-center gap-1">
                                  {userAttachedCount} Uploaded
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInsightId(insight.id);
                                setEvidenceTab('academic');
                              }}
                              className="font-sans font-semibold text-xs text-[#1B0A3B] hover:underline flex items-center gap-1 cursor-pointer focus-visible:outline-none"
                            >
                              <span>Explore Evidence & Read Papers →</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </React.Fragment>
              );
            })}

            {filteredInsights.length === 0 && (
              <div className="py-12 text-center text-[#1B0A3B] text-xs sm:text-sm italic border border-dashed border-[#1B0A3B]/20 rounded-md">
                No wellbeing research insights match your search query. Try searching for terms like "impostor", "writing", "wellbeing", or "burnout".
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: SINGLE INSIGHT FULL DETAIL */}
      {selectedInsight && (
        <div className="space-y-6 text-left py-2" id="wellbeing-single-insight-view">
          
          {/* Back button */}
          <div className="flex items-center justify-between pb-2">
            <button
              type="button"
              onClick={() => setSelectedInsightId(null)}
              className="text-xs font-sans font-semibold text-[#1B0A3B] hover:underline transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none"
            >
              <span>← Back to Insights</span>
            </button>

            <span className="text-xs font-mono text-[#1B0A3B]">
              Insight: {selectedInsight.id}
            </span>
          </div>

          {/* Unboxed Header */}
          <div className="space-y-3">
            <h1 className="font-sans font-medium tracking-tight text-2xl sm:text-3xl text-[#1B0A3B]" id="single-insight-title">
              {selectedInsight.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-[#1B0A3B]">
                {selectedInsight.category}
              </span>
              <span className="text-xs text-[#1B0A3B] font-sans flex items-center gap-1">
                {selectedInsight.readingTime}
              </span>
            </div>

            {/* Core Research Question */}
            <div className="p-4 bg-[#1B0A3B]/5 border border-[#1B0A3B]/15 rounded-md space-y-1">
              <span className="text-[11px] font-mono font-semibold tracking-wider text-[#1B0A3B]">
                Core research question
              </span>
              <p className="text-sm font-medium text-[#1B0A3B] flex items-start gap-2">
                <span>"{selectedInsight.researchQuestion}"</span>
              </p>
            </div>

            {/* Reflective Plain-English Summary */}
            <div className="p-4 sm:p-5 bg-[#1B0A3B]/5 border border-[#1B0A3B]/15 rounded-md space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-sans font-semibold text-sm text-[#1B0A3B] flex items-center gap-2">
                  <span>Reflective Plain-English Summary</span>
                </h3>
                
                {!editingSummary ? (
                  <button
                    type="button"
                    onClick={() => handleStartEditSummary(selectedInsight)}
                    className="text-xs text-[#1B0A3B] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <span>Edit Summary</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveSummary}
                      className="px-2.5 py-1 text-xs rounded bg-[#1B0A3B] text-white font-semibold flex items-center gap-1"
                    >
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSummary(false)}
                      className="text-xs text-[#1B0A3B] hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {!editingSummary ? (
                <div className="text-xs sm:text-sm leading-relaxed text-[#1B0A3B] space-y-2 whitespace-pre-wrap font-sans">
                  {selectedInsight.summary || 'Plain-English summary coming soon.'}
                </div>
              ) : (
                <textarea
                  rows={6}
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 border border-[#1B0A3B]/30 rounded-md bg-white dark:bg-stone-950 text-[#1B0A3B] focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* RESEARCH EVIDENCE SECTION */}
          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
              <h3 className="font-sans font-semibold text-base text-[#1B0A3B] flex items-center gap-2">
                <span>Research Evidence & Papers</span>
              </h3>

              {/* Evidence Category Controls */}
              <div className="flex items-center gap-3 text-xs text-[#1B0A3B] font-medium">
                <button
                  type="button"
                  onClick={() => setEvidenceTab('academic')}
                  className={`hover:underline transition-colors cursor-pointer ${
                    evidenceTab === 'academic' ? 'font-semibold underline underline-offset-4' : ''
                  }`}
                >
                  Research Literature
                </button>
                <span className="text-[#1B0A3B]">•</span>
                <button
                  type="button"
                  onClick={() => setEvidenceTab('creative')}
                  className={`hover:underline transition-colors cursor-pointer ${
                    evidenceTab === 'creative' ? 'font-semibold underline underline-offset-4' : ''
                  }`}
                >
                  Creative Practice
                </button>
                <span className="text-[#1B0A3B]">•</span>
                <button
                  type="button"
                  onClick={() => setEvidenceTab('additional')}
                  className={`hover:underline transition-colors cursor-pointer ${
                    evidenceTab === 'additional' ? 'font-semibold underline underline-offset-4' : ''
                  }`}
                >
                  Extended Sources & Uploads
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: ACADEMIC RESEARCH */}
            {evidenceTab === 'academic' && (
              <div className="space-y-4">
                {/* Embedded Open Access Articles */}
                {selectedInsight.embeddedArticles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-[#1B0A3B] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <span>Layer 1: Embedded Open-Access Articles (Full Text Included)</span>
                    </h4>

                    {selectedInsight.embeddedArticles.map((art) => (
                      <div 
                        key={art.id}
                        className="p-4 bg-[#1B0A3B]/5 border border-[#1B0A3B]/15 rounded-md space-y-3 text-left"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#1B0A3B] text-white">
                            Available Offline ({art.licence})
                          </span>
                          <span className="text-xs font-mono text-[#1B0A3B]">
                            Type: {art.researchType}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-sans font-semibold text-base text-[#1B0A3B]">
                            {art.title}
                          </h4>
                          <p className="text-xs text-[#1B0A3B] mt-0.5 font-medium">
                            {art.authors} ({art.year}) • <span className="italic">{art.journal}</span>
                          </p>
                        </div>

                        <p className="text-xs sm:text-sm text-[#1B0A3B] leading-relaxed italic border-l-2 border-[#1B0A3B] pl-3 py-1">
                          "{art.abstract}"
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                          <span className="text-[11px] font-mono text-[#1B0A3B]">DOI: {art.doi}</span>
                          <button
                            type="button"
                            onClick={() => setReaderArticle(art)}
                            className="px-3.5 py-1.5 rounded-md bg-[#1B0A3B] hover:bg-[#2A1254] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <span>Read Full Text Offline</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Research Sources */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold text-[#1B0A3B] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <span>Literature Citations & Publishers</span>
                  </h4>

                  {selectedInsight.additionalSources.filter(s => s.category === 'academic').map((src) => (
                    <div 
                      key={src.id}
                      className="p-4 bg-[#1B0A3B]/5 border border-[#1B0A3B]/15 rounded-md space-y-2 text-left"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1B0A3B]/10 text-[#1B0A3B]">
                          {src.licenceStatus}
                        </span>
                        <span className="text-[10px] font-mono text-[#1B0A3B]">
                          Type: {src.researchType}
                        </span>
                      </div>

                      <h4 className="font-sans font-semibold text-sm sm:text-base text-[#1B0A3B]">
                        {src.title}
                      </h4>
                      <p className="text-xs text-[#1B0A3B] font-medium">
                        {src.authors} ({src.year}) • <span className="italic">{src.publication}</span>
                      </p>

                      <p className="text-xs sm:text-sm text-[#1B0A3B] leading-relaxed">
                        <strong className="text-[#1B0A3B]">Relevance:</strong> {src.researchRelevance}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        {src.doi && (
                          <a
                            href={src.doi}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#1B0A3B] hover:underline font-mono flex items-center gap-1"
                          >
                            DOI Link ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: CREATIVE PRACTICE RESEARCH */}
            {evidenceTab === 'creative' && (
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-[#1B0A3B] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <span>Creative Practice & Labor Research</span>
                </h4>

                {selectedInsight.additionalSources.filter(s => s.category === 'creative').map((src) => (
                  <div 
                    key={src.id}
                    className="p-4 bg-[#1B0A3B]/5 border border-[#1B0A3B]/15 rounded-md space-y-2 text-left"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1B0A3B]/10 text-[#1B0A3B]">
                        {src.licenceStatus}
                      </span>
                      <span className="text-[10px] font-mono text-[#1B0A3B]">
                        Type: {src.researchType}
                      </span>
                    </div>

                    <h4 className="font-sans font-semibold text-sm sm:text-base text-[#1B0A3B]">
                      {src.title}
                    </h4>
                    <p className="text-xs text-[#1B0A3B] font-medium">
                      {src.authors} ({src.year}) • <span className="italic">{src.publication}</span>
                    </p>

                    <p className="text-xs sm:text-sm text-[#1B0A3B] leading-relaxed">
                      <strong className="text-[#1B0A3B]">Relevance:</strong> {src.researchRelevance}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      {src.doi && (
                        <a
                          href={src.doi}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#1B0A3B] hover:underline font-mono flex items-center gap-1"
                        >
                          DOI Link ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {selectedInsight.additionalSources.filter(s => s.category === 'creative').length === 0 && (
                  <div className="p-6 text-center text-xs text-[#1B0A3B] italic bg-[#1B0A3B]/5 rounded-md border border-[#1B0A3B]/15">
                    Creative practice sources are integrated across the main research literature and extended evidence tabs for this insight.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: ADDITIONAL SOURCES & MY UPLOADS */}
            {evidenceTab === 'additional' && (
              <div className="space-y-6">
                
                {/* Additional sources */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-[#1B0A3B] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <span>Layer 2: Extended Research Sources (Non-Open Access / Books)</span>
                  </h4>

                  {selectedInsight.additionalSources.map((src) => (
                    <div 
                      key={src.id}
                      className="p-4 bg-[#1B0A3B]/5 border border-[#1B0A3B]/15 rounded-md space-y-2 text-left"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1B0A3B]/10 text-[#1B0A3B]">
                          {src.licenceStatus}
                        </span>
                        <span className="text-[10px] font-mono text-[#1B0A3B]">
                          Type: {src.researchType}
                        </span>
                      </div>

                      <h4 className="font-sans font-semibold text-sm sm:text-base text-[#1B0A3B]">
                        {src.title}
                      </h4>
                      <p className="text-xs text-[#1B0A3B] font-medium">
                        {src.authors} ({src.year}) • <span className="italic">{src.publication}</span>
                      </p>

                      <p className="text-xs sm:text-sm text-[#1B0A3B] leading-relaxed">
                        <strong className="text-[#1B0A3B]">Relevance:</strong> {src.researchRelevance}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        {src.doi ? (
                          <a
                            href={src.doi}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#1B0A3B] hover:underline font-mono flex items-center gap-1"
                          >
                            DOI Link ↗
                          </a>
                        ) : src.publisherUrl ? (
                          <a
                            href={src.publisherUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#1B0A3B] hover:underline font-mono flex items-center gap-1"
                          >
                            Publisher Link ↗
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {/* User uploaded papers attached to this insight */}
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-[#1B0A3B] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <span>Your Uploaded Papers Attached to This Insight</span>
                    </h4>
                  </div>

                  {userDocs.filter(d => d.attachedInsightIds?.includes(selectedInsight.id)).length > 0 ? (
                    userDocs.filter(d => d.attachedInsightIds?.includes(selectedInsight.id)).map(doc => (
                      <div key={doc.id} className="p-3.5 rounded-md bg-[#1B0A3B]/5 border border-[#1B0A3B]/15 flex items-center justify-between text-xs sm:text-sm">
                        <div className="space-y-0.5 text-left">
                          <p className="font-semibold text-[#1B0A3B]">{doc.title}</p>
                          <p className="text-xs text-[#1B0A3B]">{doc.authors} ({doc.year}) • {doc.filename}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReaderArticle({
                            id: doc.id,
                            title: doc.title,
                            authors: doc.authors,
                            year: doc.year,
                            journal: doc.filename,
                            licence: 'User Uploaded Copy',
                            source: 'Local Storage',
                            abstract: doc.notes || 'User uploaded document',
                            keywords: doc.tags,
                            fullText: doc.textContent,
                            researchType: 'user paper'
                          })}
                          className="px-3 py-1.5 rounded-md bg-[#1B0A3B] text-white font-semibold text-xs shrink-0 cursor-pointer hover:bg-[#2A1254]"
                        >
                          Read Offline
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs sm:text-sm text-[#1B0A3B] italic text-left">
                      No personal research papers linked to this insight yet.
                    </p>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* READ ARTICLE MODAL */}
      {readerArticle && (
        <ArticleReaderModal
          article={readerArticle}
          onClose={() => setReaderArticle(null)}
        />
      )}

    </div>
  );
}

