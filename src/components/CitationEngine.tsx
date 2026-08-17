/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, ChevronsUpDown, Search, Quote, X, BookOpen, Download, Copy, FileText, Check } from 'lucide-react';
import { Paper, CitationStyle, Collection } from '../types';
import { parseAuthors, formatAuthorsShort, ParsedAuthor } from './LiteratureLibrary';

interface CitationEngineProps {
  papers: Paper[];
  collections?: Collection[];
  onVerifyMetadata: (paper: Paper) => Promise<void>;
  onDeletePaper?: (id: string) => void;
}

export default function CitationEngine({ papers, collections = [], onVerifyMetadata, onDeletePaper }: CitationEngineProps) {
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>('APA7');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');

  // Progressive disclosure state for reference entries
  const [expandedPaperIds, setExpandedPaperIds] = useState<Record<string, boolean>>({});

  const togglePaperExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedPaperIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleExpandAll = () => {
    const allAreExpanded = filteredPapers.length > 0 && filteredPapers.every((p) => expandedPaperIds[p.id]);
    if (allAreExpanded) {
      setExpandedPaperIds({});
    } else {
      const nextMap: Record<string, boolean> = {};
      filteredPapers.forEach((p) => {
        nextMap[p.id] = true;
      });
      setExpandedPaperIds(nextMap);
    }
  };

  // BibTeX export modal/preview state
  const [showBibTeXPreview, setShowBibTeXPreview] = useState(false);
  const [copiedBibTeX, setCopiedBibTeX] = useState(false);
  const [activeBibTeXPaper, setActiveBibTeXPaper] = useState<Paper | null>(null);

  // Filtered papers list
  const filteredPapers = papers.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.title.toLowerCase().includes(term) ||
      p.authors.toLowerCase().includes(term) ||
      p.journal.toLowerCase().includes(term) ||
      p.doi.toLowerCase().includes(term) ||
      p.tags.some((t) => t.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === 'all' || p.verificationStatus === statusFilter;

    const matchesCollection =
      collectionFilter === 'all' || p.collectionId === collectionFilter;

    return matchesSearch && matchesStatus && matchesCollection;
  });

  // Citation Formatting Helpers
  const formatCitation = (paper: Paper, style: CitationStyle): string => {
    const parsed = parseAuthors(paper.authors || '');
    const yearStr = paper.year ? `(${paper.year})` : '';
    const journalStr = paper.journal ? `${paper.journal}` : '';
    const doiClean = paper.doi ? paper.doi.replace(/^https?:\/\/doi\.org\//i, '') : '';
    const doiStr = doiClean ? `doi:${doiClean}` : '';

    const formatOne = (a: ParsedAuthor) => (a.initials ? `${a.surname}, ${a.initials}` : a.surname);
    const allAuthors = parsed.map(formatOne).join(', ');

    switch (style) {
      case 'APA7': {
        let apaAuthors = allAuthors;
        if (parsed.length === 2) {
          apaAuthors = `${formatOne(parsed[0])} & ${formatOne(parsed[1])}`;
        } else if (parsed.length > 2) {
          apaAuthors = `${parsed.slice(0, -1).map(formatOne).join(', ')}, & ${formatOne(parsed[parsed.length - 1])}`;
        }
        return `${apaAuthors} ${yearStr}. ${paper.title}.${journalStr ? ` *${journalStr}*.` : ''}${doiClean ? ` https://doi.org/${doiClean}` : ''}`;
      }
      case 'Harvard': {
        const inJournal = journalStr ? ` in *${journalStr}*` : '';
        const availableFrom = doiClean ? `, Available from: ${doiStr}` : '';
        return `${allAuthors} ${paper.year || 'n.d.'}, '${paper.title}'${inJournal}${availableFrom}`;
      }
      case 'Chicago': {
        const inJournal = journalStr ? ` in *${journalStr}*` : '';
        return `${allAuthors}. ${paper.year || 'n.d.'}. "${paper.title}."${inJournal ? `${inJournal}.` : ''}${doiClean ? ` https://doi.org/${doiClean}` : ''}`;
      }
      case 'IEEE': {
        const inJournal = journalStr ? ` in *${journalStr}*,` : '';
        return `[1] ${allAuthors}, "${paper.title},"${inJournal} ${paper.year || 'n.d.'}.${doiClean ? ` ${doiStr}.` : ''}`;
      }
      case 'MLA9': {
        return `${allAuthors}. "${paper.title}."${journalStr ? ` *${journalStr}*,` : ''} ${paper.year || 'n.d.'}.${doiClean ? ` ${doiStr}.` : ''}`;
      }
      case 'Vancouver': {
        const formatVancouver = (a: ParsedAuthor) => {
          const cleanInitials = a.initials.replace(/\./g, '');
          return cleanInitials ? `${a.surname} ${cleanInitials}` : a.surname;
        };
        const vancAuthors = parsed.map(formatVancouver).join(', ');
        const inJournal = journalStr ? ` In: *${journalStr}*.` : '';
        const availableFrom = doiClean ? ` Available from: ${doiStr}` : '';
        return `${vancAuthors}. ${paper.title}.${inJournal} ${paper.year || 'n.d.'};${availableFrom}`;
      }
      default:
        return `${allAuthors} ${yearStr}. ${paper.title}.`;
    }
  };

  // BibTeX Generation Helpers
  const generateBibTeXKey = (paper: Paper): string => {
    let authorKey = 'Ref';
    if (paper.authors) {
      const firstAuthor = paper.authors.split(/,|and/)[0].trim();
      const nameParts = firstAuthor.split(' ').filter(Boolean);
      authorKey = nameParts[nameParts.length - 1] || 'Ref';
      authorKey = authorKey.replace(/[^a-zA-Z0-9]/g, '');
    }
    const yearKey = paper.year || '';
    const words = (paper.title || '').split(/\s+/).filter((w) => w.length > 3);
    const titleWord = words[0] || (paper.title || '').split(/\s+/)[0] || '';
    const cleanTitleWord = titleWord.replace(/[^a-zA-Z0-9]/g, '');
    const key = `${authorKey}${yearKey}${cleanTitleWord}` || paper.id;
    return key.toLowerCase();
  };

  const paperToBibTeX = (paper: Paper): string => {
    const key = generateBibTeXKey(paper);
    const fields: string[] = [];

    if (paper.authors) {
      // Clean author formatting for BibTeX (using 'and' separators)
      const cleanAuthors = paper.authors.includes(' and ')
        ? paper.authors
        : paper.authors.replace(/,\s*/g, ' and ');
      fields.push(`  author    = {${cleanAuthors}}`);
    }
    if (paper.title) {
      fields.push(`  title     = {{${paper.title}}}`);
    }
    if (paper.journal) {
      fields.push(`  journal   = {${paper.journal}}`);
    }
    if (paper.year) {
      fields.push(`  year      = {${paper.year}}`);
    }
    if (paper.doi) {
      fields.push(`  doi       = {${paper.doi}}`);
    }
    if (paper.abstract) {
      const cleanAbstract = paper.abstract.replace(/[\{\}]/g, '');
      fields.push(`  abstract  = {${cleanAbstract}}`);
    }
    if (paper.notes) {
      fields.push(`  note      = {${paper.notes.replace(/[\{\}]/g, '')}}`);
    }

    return `@article{${key},\n${fields.join(',\n')}\n}`;
  };

  const generateFullBibTeX = (papersToExport: Paper[]): string => {
    const dateStr = new Date().toISOString().split('T')[0];
    const header = `% ==========================================================\n% BibTeX Export generated by Pessoa\n% Date: ${dateStr}\n% Total Exported References: ${papersToExport.length}\n% ==========================================================\n\n`;
    const entries = papersToExport.map(paperToBibTeX).join('\n\n');
    return header + entries;
  };

  // Actions
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyBibTeX = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBibTeX(true);
    setTimeout(() => setCopiedBibTeX(false), 2000);
  };

  const handleDownloadBibTeX = (papersToExport: Paper[]) => {
    const bibContent = generateFullBibTeX(papersToExport);
    const blob = new Blob([bibContent], { type: 'text/x-bibtex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `references_export_${new Date().toISOString().slice(0, 10)}.bib`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRepairMetadata = async (paper: Paper) => {
    setVerifyingId(paper.id);
    await onVerifyMetadata(paper);
    setVerifyingId(null);
  };

  const missingMetadataPapers = papers.filter((p) => p.verificationStatus === 'missing_metadata');

  return (
    <div className="w-full space-y-6" id="citation-engine-module">
      
      {/* Bibliographic style options, filter toolbar and references list - Full Horizontal Layout */}
      <div className="w-full space-y-6">
        <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-5 shadow-2xs">
          
          {/* Header & Clean Segmented Style Selector */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-150 dark:border-stone-800/80 pb-4">
            <div>
              <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#912A4A] dark:text-rose-400 shrink-0" />
                Bibliography & Reference Generator
              </h3>
              <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Formatted in accordance with active academic style conventions.
              </p>
            </div>

            {/* Single Unified Segmented Style Picker */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-900 p-1 rounded-xl flex-wrap">
              {(['Harvard', 'APA7', 'MLA9', 'Chicago', 'IEEE', 'Vancouver'] as CitationStyle[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStyle(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedStyle === st
                      ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold shadow-2xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  {st === 'APA7' ? 'APA' : st === 'MLA9' ? 'MLA' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Reference List Filters & BibTeX Export Bar (Unboxed / Flat with Subtle Divider) */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter references by title, author, tag..."
                  className="w-full font-sans text-xs pl-8 pr-7 py-2 bg-stone-50/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-750 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#912A4A] text-stone-800 dark:text-stone-200 placeholder:text-stone-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status & Collection Filters */}
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="font-sans text-xs py-2 px-2.5 bg-stone-50/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-750 rounded-xl text-stone-700 dark:text-stone-300 focus:outline-none"
                >
                  <option value="all">All Verification Statuses</option>
                  <option value="verified">Verified Only</option>
                  <option value="missing_metadata">Missing Metadata</option>
                  <option value="unverified">Unverified</option>
                </select>

                {collections.length > 0 && (
                  <select
                    value={collectionFilter}
                    onChange={(e) => setCollectionFilter(e.target.value)}
                    className="font-sans text-xs py-2 px-2.5 bg-stone-50/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-750 rounded-xl text-stone-700 dark:text-stone-300 focus:outline-none"
                  >
                    <option value="all">All Collections</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Filter Summary, Expand All, and BibTeX Export Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-850 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-sans text-xs text-stone-500 dark:text-stone-400">
                  Showing <strong className="text-stone-800 dark:text-stone-200 font-medium">{filteredPapers.length}</strong> of {papers.length} references
                  {(searchTerm || statusFilter !== 'all' || collectionFilter !== 'all') && (
                    <span className="ml-1 text-[#912A4A] dark:text-rose-400 font-medium">(Filtered)</span>
                  )}
                </span>

                {filteredPapers.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleExpandAll}
                    className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-300 hover:text-[#912A4A] dark:hover:text-rose-300 font-medium cursor-pointer transition-colors"
                    title="Toggle expand or collapse all reference entries"
                  >
                    <ChevronsUpDown className="w-3.5 h-3.5" />
                    <span>
                      {filteredPapers.length > 0 && filteredPapers.every((p) => expandedPaperIds[p.id])
                        ? 'Collapse All'
                        : 'Expand All'}
                    </span>
                  </button>
                )}
              </div>

              {/* BibTeX Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBibTeXPreview(true)}
                  disabled={filteredPapers.length === 0}
                  className="font-sans text-xs px-2.5 py-1 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                  title="Preview raw BibTeX format"
                >
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  <span>Preview BibTeX</span>
                </button>

                <button
                  onClick={() => handleDownloadBibTeX(filteredPapers)}
                  disabled={filteredPapers.length === 0}
                  className="font-sans text-xs px-3 py-1.5 bg-[#912A4A] hover:bg-[#78223d] text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                  title="Export filtered reference list as .bib file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export BibTeX</span>
                </button>
              </div>
            </div>
          </div>

          {/* References List (Unboxed on Background with 2px Burgundy Horizontal Divider) */}
          <div className="divide-y-2 divide-[#912A4A] dark:divide-[#912A4A] max-h-[480px] overflow-y-auto pr-1 mt-4">
            {filteredPapers.map((p, idx) => {
              const cite = formatCitation(p, selectedStyle);
              const isExpanded = !!expandedPaperIds[p.id];

              return (
                <div
                  key={p.id}
                  className={`transition-all font-sans ${idx === 0 ? 'pt-2 pb-6' : ''}`}
                  style={idx !== 0 ? { paddingTop: '24pt', paddingBottom: '24pt' } : { paddingBottom: '24pt' }}
                >
                  {/* 1st Layer: Full-Width Title on top with chevron at top right, author, year, and tags placed cleanly below */}
                  <div className="space-y-1.5">
                    {/* Top Row: Title on Left, Actions & Chevron at Top Right */}
                    <div
                      onClick={(e) => togglePaperExpand(p.id, e)}
                      className="flex items-start justify-between gap-3 cursor-pointer group"
                    >
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex-1 leading-snug group-hover:text-[#912A4A] dark:group-hover:text-rose-300 transition-colors">
                        {p.title}
                      </h4>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isExpanded && (
                          <button
                            type="button"
                            onClick={(e) => togglePaperExpand(p.id, e)}
                            className="text-[10px] text-[#912A4A] dark:text-rose-400 hover:underline cursor-pointer shrink-0 font-medium"
                          >
                            Cite →
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => togglePaperExpand(p.id, e)}
                          className="p-1 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-400 group-hover:text-stone-700 dark:hover:text-stone-200 shrink-0 cursor-pointer transition-colors"
                          title={isExpanded ? 'Collapse reference details' : 'Expand reference citation details'}
                          aria-label={isExpanded ? 'Collapse reference details' : 'Expand reference citation details'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[#912A4A] dark:text-rose-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Metadata line & Tags below title sharing exact same X position */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs pt-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-sans text-[11px] text-stone-500 dark:text-stone-400">
                          {formatAuthorsShort(p.authors, p.year)}
                        </span>
                        {p.tags && p.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 ml-1">
                            {p.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] font-mono px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progressive Disclosure: Expanded Citation View */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-stone-200/60 dark:border-stone-800 space-y-3 animate-fadeIn font-serif text-xs leading-relaxed">
                      <div className="text-stone-700 dark:text-stone-300">
                        {/* Render basic HTML representation for italicizing journals */}
                        {cite.split('*').map((part, idx) =>
                          idx % 2 === 1 ? (
                            <em key={idx} className="font-medium italic">
                              {part}
                            </em>
                          ) : (
                            part
                          )
                        )}

                        {p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 font-sans">
                            {p.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions per reference */}
                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-stone-100 dark:border-stone-900">
                        <button
                          onClick={() => setActiveBibTeXPaper(p)}
                          className="p-1 px-2 text-[10px] font-sans border border-stone-200 dark:border-stone-700 rounded text-stone-500 hover:text-amber-800 dark:hover:text-amber-400 hover:border-amber-700/30 transition-all cursor-pointer flex items-center gap-1"
                          title="View individual BibTeX entry"
                        >
                          <FileText className="w-3 h-3" />
                          BibTeX
                        </button>

                        <button
                          onClick={() => handleCopy(p.id, cite.replace(/\*/g, ''))}
                          className="p-1 px-2 text-[10px] font-sans border border-stone-200 dark:border-stone-700 rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:border-stone-400 transition-all cursor-pointer flex items-center gap-1"
                          title="Copy styled citation to Clipboard"
                        >
                          {copiedId === p.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>

                        {onDeletePaper && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete reference "${p.title}" permanently?`)) {
                                onDeletePaper(p.id);
                              }
                            }}
                            className="p-1.5 rounded text-stone-400 hover:text-red-600 transition-all cursor-pointer"
                            title="Delete Reference"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredPapers.length === 0 && (
              <div className="py-12 text-center text-stone-400 font-sans text-xs space-y-2">
                
                <p>No references found matching your active filter criteria.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setCollectionFilter('all');
                  }}
                  className="text-amber-800 dark:text-amber-400 underline hover:text-amber-900 cursor-pointer"
                >
                  Clear search filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* METADATA AUDIT WORKBENCH (Horizontal Section) */}
      <div className="w-full bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 dark:border-stone-800 pb-3">
          <div>
            <h4 className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100 tracking-wide flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
              Metadata Verification Workbench
            </h4>
            <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              References with incomplete parameters violate citation accuracy standards. Complete missing DOIs or URL links to lock reference integrity.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-sans shrink-0">
            <span className="text-stone-500 dark:text-stone-400">Incomplete:</span>
            <span
              className={`font-semibold px-2.5 py-0.5 rounded-full text-[11px] ${
                missingMetadataPapers.length > 0
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50'
              }`}
            >
              {missingMetadataPapers.length} flagged
            </span>
          </div>
        </div>

        {missingMetadataPapers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {missingMetadataPapers.map((p) => (
              <div key={p.id} className="p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs space-y-2.5 shadow-2xs flex flex-col justify-between">
                <div>
                  <h5 className="font-serif font-bold text-stone-800 dark:text-stone-200 line-clamp-1 leading-tight text-xs">{p.title}</h5>
                  <p className="font-sans text-[10px] text-stone-500 dark:text-stone-400 mt-1">Missing: {p.missingFields.join(', ')}</p>
                </div>

                <button
                  onClick={() => handleRepairMetadata(p)}
                  disabled={verifyingId === p.id}
                  className="w-full font-sans text-[11px] font-semibold bg-[#912A4A] hover:bg-[#78223d] text-white py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {verifyingId === p.id ? (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : null}
                  Auto DOI Lookup & Repair
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-emerald-700 dark:text-emerald-400 font-sans text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>100% of reference metadata verified and complete!</span>
          </div>
        )}
      </div>

      {/* FULL BIBTEX PREVIEW MODAL */}
      {showBibTeXPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                
                <div>
                  <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-sm">
                    BibTeX Export Preview
                  </h3>
                  <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">
                    Formatted BibTeX file content for {filteredPapers.length} selected reference(s)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBibTeXPreview(false)}
                className="px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-lg cursor-pointer flex items-center gap-1 transition-colors shadow-2xs"
                aria-label="Close BibTeX preview"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-stone-950 text-amber-200/90 font-mono text-xs p-4 rounded-md border border-stone-800 whitespace-pre leading-relaxed select-all">
              {generateFullBibTeX(filteredPapers)}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
              <span className="font-sans text-xs text-stone-500">
                Compatible with Overleaf, LaTeX, Zotero, Mendeley & EndNote
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleCopyBibTeX(generateFullBibTeX(filteredPapers))}
                  className="font-sans text-xs px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  {copiedBibTeX ? null : null}
                  {copiedBibTeX ? 'Copied BibTeX!' : 'Copy to Clipboard'}
                </button>
                <button
                  onClick={() => {
                    handleDownloadBibTeX(filteredPapers);
                    setShowBibTeXPreview(false);
                  }}
                  className="font-sans text-xs px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-600 text-white rounded font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                >
                   Download .bib File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE PAPER BIBTEX MODAL */}
      {activeBibTeXPaper && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                
                <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-sm">
                  BibTeX Entry
                </h3>
              </div>
              <button
                onClick={() => setActiveBibTeXPaper(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer p-1"
              >
                
              </button>
            </div>

            <p className="font-sans text-xs font-medium text-stone-800 dark:text-stone-200 line-clamp-2">
              {activeBibTeXPaper.title}
            </p>

            <div className="bg-stone-950 text-amber-200/90 font-mono text-xs p-3.5 rounded border border-stone-800 whitespace-pre select-all">
              {paperToBibTeX(activeBibTeXPaper)}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  handleCopyBibTeX(paperToBibTeX(activeBibTeXPaper));
                  setTimeout(() => setActiveBibTeXPaper(null), 1200);
                }}
                className="font-sans text-xs px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded font-medium flex items-center gap-1.5 cursor-pointer"
              >
                {copiedBibTeX ? null : null}
                {copiedBibTeX ? 'Copied!' : 'Copy BibTeX Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

