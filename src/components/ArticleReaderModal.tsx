/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { EmbeddedArticle, ArticleHighlight } from '../types/wellbeingInsights';
import { 
  getArticleBookmarks, 
  toggleArticleBookmark, 
  getArticleHighlights, 
  saveArticleHighlight, 
  deleteArticleHighlight 
} from '../lib/userLibraryStorage';

interface ArticleReaderModalProps {
  article: EmbeddedArticle | {
    id: string;
    title: string;
    authors: string;
    year: number;
    journal?: string;
    doi?: string;
    licence?: string;
    source?: string;
    abstract?: string;
    keywords?: string[];
    fullText: string;
    researchType?: string;
  };
  onClose: () => void;
}

export default function ArticleReaderModal({ article, onClose }: ArticleReaderModalProps) {
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [searchTerm, setSearchTerm] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [highlights, setHighlights] = useState<ArticleHighlight[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [highlightNote, setHighlightNote] = useState('');
  const [showHighlightForm, setShowHighlightForm] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);

  useEffect(() => {
    const bookmarks = getArticleBookmarks();
    setIsBookmarked(bookmarks.includes(article.id));
    setHighlights(getArticleHighlights(article.id));

    const handleBookmarkChange = () => {
      setIsBookmarked(getArticleBookmarks().includes(article.id));
    };

    window.addEventListener('article_bookmarks_updated', handleBookmarkChange);
    return () => {
      window.removeEventListener('article_bookmarks_updated', handleBookmarkChange);
    };
  }, [article.id]);

  const handleToggleBookmark = () => {
    const newStatus = toggleArticleBookmark(article.id);
    setIsBookmarked(newStatus);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 3) {
      setSelectedText(selection.toString().trim());
      setShowHighlightForm(true);
    }
  };

  const handleSaveHighlight = () => {
    if (!selectedText) return;
    const newHighlight: ArticleHighlight = {
      id: `highlight-${Date.now()}`,
      articleId: article.id,
      text: selectedText,
      note: highlightNote.trim() || undefined,
      createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      color: '#1d9e75'
    };
    const updated = saveArticleHighlight(newHighlight);
    setHighlights(updated);
    setSelectedText('');
    setHighlightNote('');
    setShowHighlightForm(false);
  };

  const handleDeleteHighlight = (id: string) => {
    const updated = deleteArticleHighlight(id, article.id);
    setHighlights(updated);
  };

  const handleCopyCitation = () => {
    const citation = `${article.authors} (${article.year}). "${article.title}". ${article.journal || 'Academic Library'}. ${article.doi ? 'DOI: ' + article.doi : ''}`;
    navigator.clipboard.writeText(citation);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const fontClassMap = {
    sm: 'text-xs leading-relaxed',
    base: 'text-sm leading-relaxed',
    lg: 'text-base leading-loose',
    xl: 'text-lg leading-loose'
  };

  // Helper to highlight search matching words in text
  const renderHighlightedSearch = (text: string) => {
    if (!searchTerm.trim()) return text;
    const parts = text.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 dark:bg-amber-800 text-stone-900 dark:text-stone-100 font-semibold px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn" id="article-reader-modal">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-stone-900 dark:text-stone-100 font-sans">
        
        {/* Top Header Controls Bar */}
        <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="font-sans text-xs px-3 py-1.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
            id="reader-return-btn"
          >
            <span>Return to Insight</span>
          </button>

          <div className="flex items-center flex-wrap gap-2">
            {/* Search Input in Article */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search article text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-2 py-1 text-xs rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 w-36 sm:w-48 focus:outline-none focus:border-[#1d9e75]"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-1.5 text-stone-400 hover:text-stone-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Font Size Selector */}
            <div className="flex items-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded p-0.5">
              <span className="text-[10px] text-stone-400 mx-1 font-mono">Font:</span>
              <button
                onClick={() => setFontSize('sm')}
                className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${fontSize === 'sm' ? 'bg-[#1d9e75] text-white font-bold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                title="Small font"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('base')}
                className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${fontSize === 'base' ? 'bg-[#1d9e75] text-white font-bold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                title="Normal font"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${fontSize === 'lg' ? 'bg-[#1d9e75] text-white font-bold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                title="Large font"
              >
                A+
              </button>
              <button
                onClick={() => setFontSize('xl')}
                className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${fontSize === 'xl' ? 'bg-[#1d9e75] text-white font-bold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                title="Extra large font"
              >
                A++
              </button>
            </div>

            {/* Bookmark button */}
            <button
              onClick={handleToggleBookmark}
              className={`p-1.5 rounded border transition-colors flex items-center gap-1 text-xs cursor-pointer ${
                isBookmarked 
                  ? 'bg-[#1d9e75]/10 border-[#1d9e75] text-[#1d9e75] dark:text-[#28c093] font-semibold' 
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-300'
              }`}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Article'}
            >
              <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>

            {/* Copy Citation */}
            <button
              onClick={handleCopyCitation}
              className="p-1.5 rounded border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-[#1d9e75] transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="Copy Citation"
            >
              <span>{copyStatus ? 'Copied' : 'Cite'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-stone-850 hover:bg-stone-200 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 rounded-lg cursor-pointer ml-1 flex items-center gap-1 transition-colors shadow-2xs"
              title="Close Reader"
              aria-label="Close Reader"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Main Reader Canvas */}
        <div 
          className="flex-grow p-4 sm:p-8 overflow-y-auto space-y-6"
          onMouseUp={handleTextSelection}
        >
          {/* Metadata Header Box */}
          <div className="bg-stone-50 dark:bg-stone-950/60 p-4 sm:p-6 rounded-lg border border-stone-200 dark:border-stone-800 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1d9e75]/10 text-[#1d9e75] dark:text-[#28c093] border border-[#1d9e75]/30">
                {article.licence || 'Open Access (CC BY)'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                Available Offline
              </span>
              {article.journal && (
                <span className="text-xs text-stone-500 italic">
                  {article.journal} ({article.year})
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {article.title}
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-medium">
              By {article.authors}
            </p>

            {article.doi && (
              <p className="text-xs font-mono text-stone-500 flex items-center gap-1">
                <span>DOI:</span>
                <a 
                  href={article.doi} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[#1d9e75] hover:underline flex items-center gap-1"
                >
                  {article.doi}
                </a>
              </p>
            )}

            {article.abstract && (
              <div className="pt-3 border-t border-stone-200 dark:border-stone-800/80">
                <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Abstract
                </h4>
                <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400 italic">
                  "{article.abstract}"
                </p>
              </div>
            )}

            {article.keywords && article.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {article.keywords.map((kw, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center gap-1">
                    #{kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Text Selection Highlight Popup Banner */}
          {showHighlightForm && selectedText && (
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="space-y-1 flex-grow">
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  Highlight selected text:
                </p>
                <p className="text-xs text-stone-700 dark:text-stone-300 italic line-clamp-2 bg-white/60 dark:bg-stone-900/60 p-1.5 rounded">
                  "{selectedText}"
                </p>
                <input
                  type="text"
                  placeholder="Optional personal note or note tag..."
                  value={highlightNote}
                  onChange={(e) => setHighlightNote(e.target.value)}
                  className="w-full text-xs p-1.5 border border-emerald-300 dark:border-emerald-800 rounded bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 mt-1"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveHighlight}
                  className="px-3 py-1.5 text-xs rounded bg-[#1d9e75] hover:bg-[#16815f] text-white font-medium cursor-pointer"
                >
                  Save Highlight
                </button>
                <button
                  type="button"
                  onClick={() => setShowHighlightForm(false)}
                  className="px-2 py-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* User Highlights Section */}
          {highlights.length > 0 && (
            <div className="bg-amber-50/50 dark:bg-stone-950 p-3 sm:p-4 rounded-lg border border-amber-200/60 dark:border-stone-800 space-y-2">
              <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                Your Offline Highlights ({highlights.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {highlights.map((h) => (
                  <div key={h.id} className="p-2 rounded bg-white dark:bg-stone-900 border border-amber-100 dark:border-stone-800 text-xs flex justify-between items-start gap-2">
                    <div className="space-y-0.5">
                      <p className="text-stone-800 dark:text-stone-200 italic">"{h.text}"</p>
                      {h.note && <p className="text-[11px] text-[#1d9e75] font-medium">Note: {h.note}</p>}
                      <span className="text-[9px] text-stone-400">{h.createdAt}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteHighlight(h.id)}
                      className="text-stone-400 hover:text-red-500 text-[10px] px-1"
                      title="Delete highlight"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Text Content Body with Numbered Paragraphs & Sentence Citation Marking */}
          <div className={`prose dark:prose-invert max-w-none font-sans text-stone-850 dark:text-stone-200 ${fontClassMap[fontSize]} space-y-6`}>
            {article.fullText.split('\n\n').filter(Boolean).map((paragraph, pIdx) => {
              const paraNum = pIdx + 1;
              if (paragraph.startsWith('# ')) {
                return (
                  <h1 key={pIdx} className="text-xl sm:text-2xl font-bold font-serif text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2 mt-6">
                    {renderHighlightedSearch(paragraph.replace('# ', ''))}
                  </h1>
                );
              }
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={pIdx} className="text-base sm:text-lg font-bold font-serif text-stone-800 dark:text-stone-200 mt-5">
                    {renderHighlightedSearch(paragraph.replace('## ', ''))}
                  </h2>
                );
              }
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={pIdx} className="text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-200 mt-4">
                    {renderHighlightedSearch(paragraph.replace('### ', ''))}
                  </h3>
                );
              }

              // Split paragraph into sentences for sentence-level citation marking
              const sentences = paragraph.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [paragraph];

              return (
                <div key={pIdx} className="group relative pl-7 border-l-2 border-transparent hover:border-[#912A4A]/60 transition-colors">
                  {/* Paragraph Number Indicator (when page number is missing) */}
                  <span className="absolute left-0 top-0 font-mono text-[10px] font-semibold text-stone-400 dark:text-stone-500 select-none group-hover:text-[#912A4A] dark:group-hover:text-rose-400">
                    ¶{paraNum}
                  </span>

                  <p className="whitespace-pre-wrap leading-relaxed inline">
                    {sentences.map((sent, sIdx) => {
                      const trimmedSent = sent.trim();
                      const firstAuthor = article.authors.split(',')[0].trim();
                      const paraCitation = `(${firstAuthor} et al., ${article.year}, para. ${paraNum})`;

                      return (
                        <span
                          key={sIdx}
                          onClick={() => {
                            setSelectedText(trimmedSent);
                            setShowHighlightForm(true);
                          }}
                          className="hover:bg-amber-100/50 dark:hover:bg-stone-800/80 cursor-pointer transition-colors rounded-xs px-0.5"
                          title={`Click to cite or highlight: ${paraCitation}`}
                        >
                          {renderHighlightedSearch(sent)}
                        </span>
                      );
                    })}
                  </p>

                  <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        const firstAuthor = article.authors.split(',')[0].trim();
                        const paraCitation = `(${firstAuthor} et al., ${article.year}, para. ${paraNum})`;
                        navigator.clipboard.writeText(paraCitation);
                        setCopyStatus(true);
                        setTimeout(() => setCopyStatus(false), 2000);
                      }}
                      className="text-[#912A4A] dark:text-rose-400 hover:underline font-medium cursor-pointer"
                    >
                      Copy Citation (para. {paraNum})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-[10px] text-stone-500 flex justify-between items-center shrink-0">
          <span>Highlight text with your cursor to save local notes.</span>
          <span>Stored offline in local device memory.</span>
        </div>

      </div>
    </div>
  );
}
