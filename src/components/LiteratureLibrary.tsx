/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronsUpDown,
  Search,
  Quote,
  FilePlus,
  Plus,
  X,
  Folder,
  Check,
  Copy,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Edit3,
  FileText,
  Bookmark,
  Sparkles,
  SlidersHorizontal,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { Paper, Collection, Annotation } from '../types';
import DataIngestionModule from './DataIngestionModule';

export type CommonCitationStyle = 'Harvard' | 'APA' | 'MLA' | 'Chicago' | 'IEEE' | 'Vancouver';

export interface ParsedAuthor {
  surname: string;
  initials: string;
  fullName: string;
}

/**
 * Robust author parser for academic citations.
 * Handles "First Last, First Last", "Last, First, Last, First", and "Last, Initial."
 */
export const parseAuthors = (rawAuthors: string): ParsedAuthor[] => {
  if (!rawAuthors || !rawAuthors.trim()) {
    return [{ surname: 'Unknown Author', initials: '', fullName: 'Unknown Author' }];
  }

  // Normalize 'and' & semicolons into commas
  const normalized = rawAuthors.replace(/\s+and\s+/gi, ', ').replace(/;/g, ', ');
  const rawParts = normalized.split(',').map((p) => p.trim()).filter(Boolean);

  if (rawParts.length === 0) {
    return [{ surname: 'Unknown Author', initials: '', fullName: 'Unknown Author' }];
  }

  // Check if structure is alternating "Surname, First" or "Surname, Initial"
  let isAlternatingLastFirst = false;
  if (rawParts.length >= 2 && rawParts.length % 2 === 0) {
    const secondIsInitialOrShort = rawParts.every((part, idx) => {
      if (idx % 2 === 1) {
        return part.length <= 4 || /^[A-Z](\.|\s|$)/i.test(part);
      }
      return true;
    });
    if (secondIsInitialOrShort) {
      isAlternatingLastFirst = true;
    }
  }

  const authors: ParsedAuthor[] = [];

  if (isAlternatingLastFirst) {
    for (let i = 0; i < rawParts.length; i += 2) {
      const surname = rawParts[i];
      const firstName = rawParts[i + 1] || '';
      const initials = firstName
        .split(/[\s.-]+/)
        .filter(Boolean)
        .map((w) => `${w[0].toUpperCase()}.`)
        .join('');
      authors.push({
        surname,
        initials: initials || (firstName ? `${firstName[0].toUpperCase()}.` : ''),
        fullName: `${surname}, ${initials || firstName}`,
      });
    }
  } else {
    for (const part of rawParts) {
      // If part contains "et al.", strip or handle
      const cleanPart = part.replace(/\s+et\s+al\.?/i, '');
      const tokens = cleanPart.split(/\s+/).filter(Boolean);

      if (tokens.length === 1) {
        authors.push({
          surname: tokens[0],
          initials: '',
          fullName: tokens[0],
        });
      } else {
        // e.g. "Ashish Vaswani" -> Surname: "Vaswani", Initial: "A."
        // "Aidan N. Gomez" -> Surname: "Gomez", Initial: "A."
        const surname = tokens[tokens.length - 1];
        const firstTokens = tokens.slice(0, -1);
        const initials = firstTokens
          .map((t) => {
            const clean = t.replace(/[^a-zA-Z]/g, '');
            return clean ? `${clean[0].toUpperCase()}.` : '';
          })
          .filter(Boolean)
          .join('');

        authors.push({
          surname,
          initials: initials || `${firstTokens[0][0].toUpperCase()}.`,
          fullName: `${surname}, ${initials || `${firstTokens[0][0].toUpperCase()}.`}`,
        });
      }
    }
  }

  return authors.length > 0 ? authors : [{ surname: rawAuthors, initials: '', fullName: rawAuthors }];
};

/**
 * 1st Layer Author Formatter:
 * Authors Surname, Initial. et al. if more than three (year)
 * E.g.,
 * 1 author: Vaswani, A. (2017)
 * 2 authors: Vaswani, A., Shazeer, N. (2017)
 * 3 authors: Vaswani, A., Shazeer, N., Parmar, N. (2017)
 * >3 authors: Vaswani, A. et al. (2017)
 */
export const formatAuthorsShort = (rawAuthors: string, year?: number | string): string => {
  const parsed = parseAuthors(rawAuthors);
  const yearStr = year ? ` (${year})` : '';

  if (parsed.length === 0 || (parsed.length === 1 && parsed[0].surname === 'Unknown Author')) {
    return `Unknown Author${yearStr}`;
  }

  const formatOne = (a: ParsedAuthor) => (a.initials ? `${a.surname}, ${a.initials}` : a.surname);

  if (parsed.length > 3) {
    return `${formatOne(parsed[0])} et al.${yearStr}`;
  }

  const formattedList = parsed.map(formatOne).join(', ');
  return `${formattedList}${yearStr}`;
};

/**
 * 2nd Layer Full Reference Formatter:
 * [referencing style selected]: All author's names formatted as Surname, Initial. year, 'Attention Is All You Need' in Advances in Neural Information Processing Systems, Available from: doi:10.48550/arXiv.1706.03762
 */
export const formatPaperPreview = (paper: Paper, style: CommonCitationStyle = 'Harvard'): string => {
  const parsed = parseAuthors(paper.authors || '');
  const year = paper.year || 'n.d.';
  const title = paper.title || 'Untitled';
  const journal = paper.journal && paper.journal !== 'Unspecified' ? paper.journal : '';
  const doi = paper.doi ? paper.doi.replace(/^https?:\/\/doi\.org\//i, '') : '';
  const doiStr = doi ? `doi:${doi}` : '';

  // All authors formatted as Surname, Initial.
  const formatOne = (a: ParsedAuthor) => (a.initials ? `${a.surname}, ${a.initials}` : a.surname);
  const allAuthorsList = parsed.map(formatOne).join(', ');

  switch (style) {
    case 'Harvard': {
      // Harvard style:
      // Single quotes for articles, conference papers, and book chapters
      // The word 'in' before conference proceedings, edited collections, or journals
      const inJournal = journal ? ` in ${journal}` : '';
      const availableFrom = doi ? `, Available from: ${doiStr}` : '';
      return `${allAuthorsList} ${year}, '${title}'${inJournal}${availableFrom}`.trim();
    }
    case 'APA': {
      // APA 7th style
      let apaAuthors = allAuthorsList;
      if (parsed.length === 2) {
        apaAuthors = `${formatOne(parsed[0])} & ${formatOne(parsed[1])}`;
      } else if (parsed.length > 2) {
        apaAuthors = `${parsed.slice(0, -1).map(formatOne).join(', ')}, & ${formatOne(parsed[parsed.length - 1])}`;
      }
      return `${apaAuthors} (${year}). ${title}.${journal ? ` ${journal}.` : ''}${doi ? ` https://doi.org/${doi}` : ''}`.trim();
    }
    case 'MLA': {
      return `${allAuthorsList}. "${title}."${journal ? ` ${journal},` : ''} ${year}.${doi ? ` ${doiStr}.` : ''}`.trim();
    }
    case 'Chicago': {
      // Chicago style: uses double quotes and 'in' for conference proceedings / book chapters
      const inJournal = journal ? ` in ${journal}` : '';
      return `${allAuthorsList}. ${year}. "${title}."${inJournal ? `${inJournal}.` : ''}${doi ? ` https://doi.org/${doi}` : ''}`.trim();
    }
    case 'IEEE': {
      // IEEE style: uses 'in' before journals and conference proceedings
      const inJournal = journal ? ` in ${journal},` : '';
      return `[1] ${allAuthorsList}, "${title},"${inJournal} ${year}.${doi ? ` ${doiStr}.` : ''}`.trim();
    }
    case 'Vancouver': {
      // Vancouver style: initials without dots, 'In:' for edited collections / proceedings
      const formatVancouver = (a: ParsedAuthor) => {
        const cleanInitials = a.initials.replace(/\./g, '');
        return cleanInitials ? `${a.surname} ${cleanInitials}` : a.surname;
      };
      const vancAuthors = parsed.map(formatVancouver).join(', ');
      const inJournal = journal ? ` In: ${journal}.` : '';
      const availableFrom = doi ? ` Available from: ${doiStr}` : '';
      return `${vancAuthors}. ${title}.${inJournal} ${year};${availableFrom}`.trim();
    }
    default:
      return `${allAuthorsList} ${year}, '${title}'${journal ? ` in ${journal}` : ''}${doi ? `, Available from: ${doiStr}` : ''}`;
  }
};

interface LiteratureLibraryProps {
  papers: Paper[];
  collections: Collection[];
  onUpdatePaper: (updated: Paper) => void;
  onAddPaper: (paper: Paper) => void;
  onDeletePaper: (id: string) => void;
  onInsertCitation?: (citation: string) => void;
}

export default function LiteratureLibrary({
  papers,
  collections,
  onUpdatePaper,
  onAddPaper,
  onDeletePaper,
  onInsertCitation,
}: LiteratureLibraryProps) {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(papers[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // View state: 'list' (shows reference directory) or 'inspector' (shows detailed document inspector)
  const [viewMode, setViewMode] = useState<'list' | 'inspector'>('list');

  // Progressive Disclosure states for Document Inspector panels (All collapsed by default)
  const [inspectorPanels, setInspectorPanels] = useState<{
    citation: boolean;
    metadata: boolean;
    abstract: boolean;
    notes: boolean;
    highlights: boolean;
  }>({
    citation: false, // Collapsed by default
    metadata: false, // Collapsed by default
    abstract: false, // Collapsed by default
    notes: false, // Collapsed by default
    highlights: false, // Collapsed by default
  });

  // State to track expanded summaries in the reference list items (collapsed by default)
  const [expandedSummaryIds, setExpandedSummaryIds] = useState<Record<string, boolean>>({});
  const toggleSummaryExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedSummaryIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // State to track expanded Notes & Inspector progressive disclosure in reference list items (collapsed by default)
  const [expandedInspectorIds, setExpandedInspectorIds] = useState<Record<string, boolean>>({});
  const toggleInspectorExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedInspectorIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleInspectorPanel = (panel: keyof typeof inspectorPanels) => {
    setInspectorPanels((prev) => ({
      ...prev,
      [panel]: !prev[panel],
    }));
  };

  const toggleAllInspectorPanels = (expand: boolean) => {
    setInspectorPanels({
      citation: expand,
      metadata: expand,
      abstract: expand,
      notes: expand,
      highlights: expand,
    });
  };

  // Citation Style state for formatted paper previews
  const [citationStyle, setCitationStyle] = useState<CommonCitationStyle>('Harvard');
  const [copiedCitation, setCopiedCitation] = useState(false);

  // Data Ingestion Module toggle
  const [showIngestionModule, setShowIngestionModule] = useState(false);

  // New paper modal/form states
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthors, setNewAuthors] = useState('');
  const [newJournal, setNewJournal] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newDoi, setNewDoi] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newAbstract, setNewAbstract] = useState('');
  const [newCollectionId, setNewCollectionId] = useState<string>('all');

  // Annotation text states
  const [newAnnotationText, setNewAnnotationText] = useState('');
  const [newAnnotationComment, setNewAnnotationComment] = useState('');

  // Progressive disclosure state for reference entries in list view
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

  // Robust Search & Collection Filter
  const filteredPapers = papers.filter((p) => {
    // Check collection match first
    const matchesCollection =
      selectedCollection === 'all' || p.collectionId === selectedCollection;
    if (!matchesCollection) return false;

    // Check search term
    const cleanSearch = searchTerm.trim().toLowerCase();
    if (!cleanSearch) return true;

    const tokens = cleanSearch.split(/\s+/).filter(Boolean);
    const titleStr = (p.title || '').toLowerCase();
    const authorsStr = (p.authors || '').toLowerCase();
    const journalStr = (p.journal || '').toLowerCase();
    const yearStr = String(p.year || '').toLowerCase();
    const doiStr = (p.doi || '').toLowerCase();
    const notesStr = (p.notes || '').toLowerCase();
    const abstractStr = (p.abstract || '').toLowerCase();
    const tagsArr = Array.isArray(p.tags) ? p.tags.map((t) => (t || '').toLowerCase()) : [];
    const fullSearchable = `${titleStr} ${authorsStr} ${journalStr} ${yearStr} ${doiStr} ${notesStr} ${abstractStr} ${tagsArr.join(' ')}`;

    return tokens.every((token) => fullSearchable.includes(token));
  });

  const handleVerifyMetadata = async (paper: Paper) => {
    setVerifyingId(paper.id);
    try {
      const res = await fetch('/api/gemini/metadata-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paper.title,
          authors: paper.authors,
          doi: paper.doi,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated: Paper = {
          ...paper,
          title: data.correctedTitle || paper.title,
          authors: data.correctedAuthors || paper.authors,
          journal: data.correctedJournal || paper.journal,
          year: data.correctedYear || paper.year,
          doi: data.correctedDoi || paper.doi,
          missingFields: data.missingFields || [],
          verificationStatus: data.verificationStatus || 'verified',
        };
        onUpdatePaper(updated);
        if (selectedPaper?.id === paper.id) {
          setSelectedPaper(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleAddPaperSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const added: Paper = {
      id: 'paper-' + Math.random().toString(36).substr(2, 9),
      title: newTitle,
      authors: newAuthors,
      journal: newJournal,
      year: Number(newYear),
      doi: newDoi,
      collectionId: newCollectionId !== 'all' ? newCollectionId : undefined,
      tags: [],
      notes: newNotes,
      abstract: newAbstract,
      verificationStatus: newDoi ? 'verified' : 'unverified',
      missingFields: newDoi ? [] : ['doi'],
      annotations: [],
    };

    onAddPaper(added);
    setSelectedPaper(added);
    setIsAdding(false);
    setViewMode('inspector');

    // Reset fields
    setNewTitle('');
    setNewAuthors('');
    setNewJournal('');
    setNewYear(new Date().getFullYear());
    setNewDoi('');
    setNewNotes('');
    setNewAbstract('');
    setNewCollectionId('all');
  };

  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaper || !newAnnotationText) return;

    const ann: Annotation = {
      id: 'ann-' + Math.random().toString(36).substr(2, 9),
      text: newAnnotationText,
      comment: newAnnotationComment || undefined,
      color: '#FEF08A',
      createdAt: new Date().toISOString(),
    };

    const updated: Paper = {
      ...selectedPaper,
      annotations: [...(selectedPaper.annotations || []), ann],
    };

    onUpdatePaper(updated);
    setSelectedPaper(updated);
    setNewAnnotationText('');
    setNewAnnotationComment('');
  };

  const handleDeleteAnnotation = (annId: string) => {
    if (!selectedPaper) return;
    const updated: Paper = {
      ...selectedPaper,
      annotations: (selectedPaper.annotations || []).filter((a) => a.id !== annId),
    };
    onUpdatePaper(updated);
    setSelectedPaper(updated);
  };

  // Next / Previous paper navigation within Document Inspector
  const currentPaperIndex = selectedPaper ? filteredPapers.findIndex(p => p.id === selectedPaper.id) : -1;
  const handlePrevPaper = () => {
    if (currentPaperIndex > 0) {
      setSelectedPaper(filteredPapers[currentPaperIndex - 1]);
    }
  };
  const handleNextPaper = () => {
    if (currentPaperIndex >= 0 && currentPaperIndex < filteredPapers.length - 1) {
      setSelectedPaper(filteredPapers[currentPaperIndex + 1]);
    }
  };

  return (
    <div className="w-full font-sans text-stone-900 dark:text-stone-100 space-y-4" id="literature-library-module">
      
      {/* ----------------------------------------------------------------- */}
      {/* VIEW: DOCUMENT INSPECTOR (Focused Single-View with Progressive Disclosure) */}
      {/* ----------------------------------------------------------------- */}
      {viewMode === 'inspector' && selectedPaper ? (
        <div className="w-full space-y-5 animate-fadeIn">
          
          {/* Top Inspector Header: Navigation Breadcrumb & Actions */}
          <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-stone-150 dark:border-stone-800 flex-wrap">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="font-sans text-xs font-semibold text-[#912A4A] dark:text-rose-400 hover:text-[#78223d] dark:hover:text-rose-300 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-100/80 dark:bg-stone-800/80 hover:bg-stone-200/70 dark:hover:bg-stone-700/80 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to References ({filteredPapers.length})</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Previous / Next Paper Switcher */}
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5 border border-stone-200/60 dark:border-stone-700">
                <button
                  type="button"
                  onClick={handlePrevPaper}
                  disabled={currentPaperIndex <= 0}
                  className="p-1 rounded text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 disabled:opacity-30 cursor-pointer"
                  title="Previous reference"
                  aria-label="Previous reference"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[10px] text-stone-500 px-1.5">
                  {currentPaperIndex + 1}/{filteredPapers.length}
                </span>
                <button
                  type="button"
                  onClick={handleNextPaper}
                  disabled={currentPaperIndex < 0 || currentPaperIndex >= filteredPapers.length - 1}
                  className="p-1 rounded text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 disabled:opacity-30 cursor-pointer"
                  title="Next reference"
                  aria-label="Next reference"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Delete Reference */}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete reference "${selectedPaper.title}" permanently?`)) {
                    onDeletePaper(selectedPaper.id);
                    const remaining = papers.filter((p) => p.id !== selectedPaper.id);
                    if (remaining.length > 0) {
                      setSelectedPaper(remaining[0]);
                    } else {
                      setSelectedPaper(null);
                      setViewMode('list');
                    }
                  }
                }}
                className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-sans flex items-center gap-1"
                title="Remove Document"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Delete</span>
              </button>
            </div>
          </div>

          {/* Document Title, Author & Metadata Summary */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] text-[#912A4A] dark:text-rose-400 font-bold uppercase tracking-wider">
                Document Inspector
              </span>
              {selectedPaper.collectionId && (
                <span className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-full border border-stone-200/80 dark:border-stone-700 font-medium">
                  {collections.find(c => c.id === selectedPaper.collectionId)?.name || 'Collection'}
                </span>
              )}
              {selectedPaper.verificationStatus === 'verified' ? (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200/50 font-medium">
                  Verified Reference
                </span>
              ) : (
                <span className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200/50 font-medium">
                  Missing Some Details
                </span>
              )}
            </div>

            <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base sm:text-lg leading-snug">
              {selectedPaper.title}
            </h3>
            <p className="font-sans text-xs text-stone-500 dark:text-stone-400">
              {selectedPaper.authors} ({selectedPaper.year || 'n.d.'})
              {selectedPaper.journal && ` · ${selectedPaper.journal}`}
            </p>
          </div>

          {/* Quick Collapse/Expand All Accordions Toggle */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-150 dark:border-stone-800">
            <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">
              Inspection Panels
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleAllInspectorPanels(true)}
                className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-medium cursor-pointer"
              >
                Expand All
              </button>
              <span className="text-stone-300 dark:text-stone-700">·</span>
              <button
                type="button"
                onClick={() => toggleAllInspectorPanels(false)}
                className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-medium cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* PROGRESSIVE DISCLOSURE ACCORDIONS FOR LONG MENU PANELS           */}
          {/* --------------------------------------------------------------- */}
          <div className="space-y-3">
            
            {/* PANEL 1: FORMATTED CITATION PREVIEW (Accordion) */}
            <div className="border border-stone-200/90 dark:border-stone-800 rounded-xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleInspectorPanel('citation')}
                className="w-full p-3.5 bg-stone-50/80 dark:bg-stone-900/90 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-stone-100/80 dark:hover:bg-stone-850/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Quote className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
                  <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                    Formatted Citation Preview
                  </span>
                  <span className="text-[10px] font-mono bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-md">
                    {citationStyle} Style
                  </span>
                </div>
                {inspectorPanels.citation ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </button>

              {inspectorPanels.citation && (
                <div className="p-4 bg-white dark:bg-stone-900/60 border-t border-stone-200/80 dark:border-stone-800 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label htmlFor="citation-inspector-select" className="text-[11px] font-medium text-stone-500">
                      Citation Format Standard:
                    </label>
                    <select
                      id="citation-inspector-select"
                      value={citationStyle}
                      onChange={(e) => setCitationStyle(e.target.value as CommonCitationStyle)}
                      className="font-sans text-xs font-medium py-1 px-2.5 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer"
                    >
                      <option value="Harvard">Harvard Reference</option>
                      <option value="APA">APA 7th Edition</option>
                      <option value="MLA">MLA 9th Edition</option>
                      <option value="Chicago">Chicago Author-Date</option>
                      <option value="IEEE">IEEE Format</option>
                      <option value="Vancouver">Vancouver</option>
                    </select>
                  </div>

                  {/* Live Formatted Citation Output */}
                  <div className="p-3 bg-stone-50/80 dark:bg-stone-950/70 border border-stone-200/80 dark:border-stone-800 rounded-xl text-xs font-serif text-stone-800 dark:text-stone-200 leading-relaxed italic select-all shadow-2xs">
                    {formatPaperPreview(selectedPaper, citationStyle)}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {onInsertCitation && (
                      <button
                        type="button"
                        onClick={() => {
                          const firstAuthor = (selectedPaper.authors || 'Author').split(',')[0].trim();
                          const citationSnippet = ` (${firstAuthor} et al., ${selectedPaper.year || new Date().getFullYear()})`;
                          onInsertCitation(citationSnippet);
                        }}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-xl font-sans font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Insert citation marker into draft"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
                        <span>Insert in Draft</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const text = formatPaperPreview(selectedPaper, citationStyle);
                        navigator.clipboard.writeText(text);
                        setCopiedCitation(true);
                        setTimeout(() => setCopiedCitation(false), 2000);
                      }}
                      className="px-3.5 py-1.5 bg-[#912A4A] hover:bg-[#78223d] text-white rounded-xl font-sans font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      {copiedCitation ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Citation</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PANEL 2: PAPER DETAILS & CHECKLIST (Accordion) */}
            <div className="border border-stone-200/90 dark:border-stone-800 rounded-xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleInspectorPanel('metadata')}
                className="w-full p-3.5 bg-stone-50/80 dark:bg-stone-900/90 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-stone-100/80 dark:hover:bg-stone-850/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                    Paper Details & Info
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-sans font-semibold ${
                    selectedPaper.verificationStatus === 'verified'
                      ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100/70 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {selectedPaper.verificationStatus === 'verified' ? 'All Info Complete' : 'Missing Some Info'}
                  </span>
                </div>
                {inspectorPanels.metadata ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </button>

              {inspectorPanels.metadata && (
                <div className="p-4 bg-white dark:bg-stone-900/60 border-t border-stone-200/80 dark:border-stone-800 space-y-2.5 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-stone-500">Online Web ID (DOI):</span>
                    <span className="font-mono text-[11px] text-stone-800 dark:text-stone-200 truncate max-w-xs select-all">
                      {selectedPaper.doi || 'None added'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-stone-500">Year Published:</span>
                    <span className="font-sans font-medium text-stone-800 dark:text-stone-200">
                      {selectedPaper.year || 'Unknown year'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-stone-500">Journal or Book:</span>
                    <span className="font-sans font-medium text-stone-800 dark:text-stone-200">
                      {selectedPaper.journal || 'Not specified'}
                    </span>
                  </div>

                  {selectedPaper.missingFields && selectedPaper.missingFields.length > 0 && (
                    <div className="pt-2 border-t border-stone-150 dark:border-stone-800 flex items-center justify-between gap-2">
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Missing info: {selectedPaper.missingFields.join(', ')}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => handleVerifyMetadata(selectedPaper)}
                        disabled={verifyingId === selectedPaper.id}
                        className="text-[11px] px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer font-medium"
                      >
                        {verifyingId === selectedPaper.id ? 'Looking up...' : 'Find Missing Info'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PANEL 3: ABSTRACT & THEORETICAL SUMMARY (Accordion) */}
            <div className="border border-stone-200/90 dark:border-stone-800 rounded-xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleInspectorPanel('abstract')}
                className="w-full p-3.5 bg-stone-50/80 dark:bg-stone-900/90 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-stone-100/80 dark:hover:bg-stone-850/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                    Summary & Main Ideas
                  </span>
                </div>
                {inspectorPanels.abstract ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </button>

              {inspectorPanels.abstract && (
                <div className="p-4 bg-white dark:bg-stone-900/60 border-t border-stone-200/80 dark:border-stone-800 space-y-4 animate-fadeIn">
                  {/* Full Abstract Text - Unboxed on Background */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                        Abstract & paper overview
                      </span>
                      {selectedPaper.abstract && (
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedPaper.abstract) {
                              navigator.clipboard.writeText(selectedPaper.abstract);
                            }
                          }}
                          className="text-xs text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy abstract</span>
                        </button>
                      )}
                    </div>
                    {selectedPaper.abstract ? (
                      <p className="pl-3.5 border-l-2 border-[#912A4A]/40 font-sans text-xs text-stone-700 dark:text-stone-300 leading-relaxed italic select-text">
                        "{selectedPaper.abstract}"
                      </p>
                    ) : (
                      <p className="font-sans text-xs text-stone-400 italic">No abstract recorded for this paper yet.</p>
                    )}
                  </div>

                  {/* Structured Summary Breakdown - Standardized Vertical Layout */}
                  {selectedPaper.structuredSummary && (
                    <div className="space-y-3 pt-3 border-t border-stone-150 dark:border-stone-800">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-xs text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
                          <span>Key analytical breakdown</span>
                        </h5>
                      </div>

                      {/* Vertical stack of analytical fields */}
                      <div className="space-y-2.5 text-xs">
                        {selectedPaper.structuredSummary.researchQuestion && (
                          <div className="pl-3.5 border-l-2 border-[#1B0A3B]/40 dark:border-purple-400/40 space-y-1">
                            <span className="text-[11px] font-semibold text-stone-800 dark:text-stone-200 block">
                              Research aim & question
                            </span>
                            <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                              {selectedPaper.structuredSummary.researchQuestion}
                            </p>
                          </div>
                        )}

                        {selectedPaper.structuredSummary.methods && (
                          <div className="pl-3.5 border-l-2 border-stone-400 dark:border-stone-600 space-y-1">
                            <span className="text-[11px] font-semibold text-stone-800 dark:text-stone-200 block">
                              Methodology & design
                            </span>
                            <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                              {selectedPaper.structuredSummary.methods}
                            </p>
                          </div>
                        )}

                        {selectedPaper.structuredSummary.findings && (
                          <div className="pl-3.5 border-l-2 border-emerald-600/60 space-y-1">
                            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">
                              Core findings & key takeaways
                            </span>
                            <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                              {selectedPaper.structuredSummary.findings}
                            </p>
                          </div>
                        )}

                        {selectedPaper.structuredSummary.limitations && (
                          <div className="pl-3.5 border-l-2 border-amber-500/60 space-y-1">
                            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block">
                              Stated scope & limitations
                            </span>
                            <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                              {selectedPaper.structuredSummary.limitations}
                            </p>
                          </div>
                        )}

                        {selectedPaper.structuredSummary.keyQuotations && selectedPaper.structuredSummary.keyQuotations.length > 0 && (
                          <div className="pl-3.5 border-l-2 border-stone-300 dark:border-stone-700 space-y-1">
                            <span className="text-[11px] font-semibold text-stone-800 dark:text-stone-200 block">
                              Key Quotations
                            </span>
                            <div className="space-y-1">
                              {selectedPaper.structuredSummary.keyQuotations.map((q: string, idx: number) => (
                                <p key={idx} className="text-stone-600 dark:text-stone-400 italic font-sans text-xs">"{q}"</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PANEL 4: MY NOTES & THOUGHTS (Accordion) */}
            <div className="border border-stone-200/90 dark:border-stone-800 rounded-xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleInspectorPanel('notes')}
                className="w-full p-3.5 bg-stone-50/80 dark:bg-stone-900/90 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-stone-100/80 dark:hover:bg-stone-850/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                    My Notes & Thoughts
                  </span>
                </div>
                {inspectorPanels.notes ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </button>

              {inspectorPanels.notes && (
                <div className="p-4 bg-white dark:bg-stone-900/60 border-t border-stone-200/80 dark:border-stone-800 space-y-2 animate-fadeIn">
                  <textarea
                    id="local-notes-textarea"
                    value={selectedPaper.notes || ''}
                    onChange={(e) => {
                      const updated: Paper = { ...selectedPaper, notes: e.target.value };
                      onUpdatePaper(updated);
                      setSelectedPaper(updated);
                    }}
                    className="w-full font-sans text-xs p-3 border border-stone-200/90 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 h-28 focus:outline-none focus:ring-2 focus:ring-[#912A4A]/25 focus:border-[#912A4A] leading-relaxed"
                    placeholder="Write your notes, important takeaways, or questions about this paper..."
                  />
                  <p className="text-[10px] text-stone-400 italic">Saved automatically on your device.</p>
                </div>
              )}
            </div>

            {/* PANEL 5: HIGHLIGHTS & EXCERPTS WORKBENCH (Accordion) */}
            <div className="border border-stone-200/90 dark:border-stone-800 rounded-xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleInspectorPanel('highlights')}
                className="w-full p-3.5 bg-stone-50/80 dark:bg-stone-900/90 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-stone-100/80 dark:hover:bg-stone-850/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Bookmark className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                    Highlights & Excerpts
                  </span>
                  <span className="text-[10px] font-mono bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-md">
                    {(selectedPaper.annotations || []).length} Recorded
                  </span>
                </div>
                {inspectorPanels.highlights ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </button>

              {inspectorPanels.highlights && (
                <div className="p-4 bg-white dark:bg-stone-900/60 border-t border-stone-200/80 dark:border-stone-800 space-y-3 animate-fadeIn">
                  
                  {/* Highlights list */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(selectedPaper.annotations || []).map((ann) => (
                      <div key={ann.id} className="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 border-l-2 border-amber-400 dark:border-amber-600 rounded-lg text-xs space-y-1 font-sans">
                        <div className="flex justify-between items-start text-[10px] text-stone-400">
                          <span className="font-semibold text-stone-600 dark:text-stone-400">Excerpt:</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnnotation(ann.id)}
                            className="text-stone-400 hover:text-rose-600 cursor-pointer rounded px-1"
                            title="Delete highlight"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="italic text-stone-800 dark:text-stone-200">"{ann.text}"</p>
                        {ann.comment && (
                          <div className="pt-1 text-[11px] text-stone-600 dark:text-stone-400 border-t border-amber-200/50 dark:border-amber-900/30">
                            <span className="font-semibold text-[#912A4A] dark:text-rose-400">Note:</span> {ann.comment}
                          </div>
                        )}
                      </div>
                    ))}

                    {(!selectedPaper.annotations || selectedPaper.annotations.length === 0) && (
                      <p className="font-sans text-xs text-stone-400 italic">No quotes or excerpts recorded yet.</p>
                    )}
                  </div>

                  {/* Add Excerpt Form */}
                  <form onSubmit={handleAddAnnotation} className="space-y-2 border-t border-stone-150 dark:border-stone-800 pt-3">
                    <input
                      type="text"
                      placeholder="Paste highlighted excerpt from paper..."
                      value={newAnnotationText}
                      onChange={(e) => setNewAnnotationText(e.target.value)}
                      className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#912A4A]/25 focus:border-[#912A4A]"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Marginal annotation or comment (optional)..."
                      value={newAnnotationComment}
                      onChange={(e) => setNewAnnotationComment(e.target.value)}
                      className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#912A4A]/25 focus:border-[#912A4A]"
                    />
                    <button
                      type="submit"
                      className="w-full font-sans text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 py-2 rounded-xl transition-colors cursor-pointer font-semibold"
                    >
                      Record Highlight
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* ----------------------------------------------------------------- */
        /* VIEW: REFERENCES DIRECTORY (Full-Width Calm List View)            */
        /* ----------------------------------------------------------------- */
        <div className="space-y-0 animate-fadeIn">
          
          {/* Top Controls Toolbar: Clean Responsive Row */}
          <div className="space-y-3">
            
            {/* Search Bar & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Search input */}
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <label htmlFor="library-search" className="sr-only">Search Literature Library</label>
                <input
                  id="library-search"
                  type="text"
                  placeholder="Search references by title, author, journal, year, DOI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full font-sans text-xs pl-9 pr-9 py-2.5 rounded-xl border border-stone-200/90 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#912A4A]/25 focus:border-[#912A4A] transition-all shadow-2xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action Buttons: Batch Import and Add Document */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowIngestionModule(!showIngestionModule);
                    setIsAdding(false);
                  }}
                  className={`font-sans text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs font-semibold whitespace-nowrap ${
                    showIngestionModule
                      ? 'bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100'
                      : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 border-stone-200/90 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850'
                  }`}
                  title="Batch import articles from datasets or files"
                  id="batch-import-dataset-btn"
                >
                  <FilePlus className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span>Batch Import</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(!isAdding);
                    setShowIngestionModule(false);
                  }}
                  className="font-sans text-xs bg-[#912A4A] hover:bg-[#78223d] text-white px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs font-semibold whitespace-nowrap"
                  title="Add new reference document"
                  id="add-reference-doc-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Document</span>
                </button>
              </div>
            </div>

            {/* Row 2: Standardised Dropdowns & Expand All Controls */}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-0.5">
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* Collection Filter */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-xl px-3 py-1.5 shadow-2xs">
                  <Folder className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400 shrink-0" />
                  <label htmlFor="collection-filter" className="sr-only">Filter by Collection</label>
                  <select
                    id="collection-filter"
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    className="font-sans text-xs bg-transparent text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer font-medium pr-1"
                    title="Filter references by collection"
                  >
                    <option value="all" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">
                      All Collections ({papers.length})
                    </option>
                    {collections.map((col) => {
                      const count = papers.filter(p => p.collectionId === col.id).length;
                      return (
                        <option key={col.id} value={col.id} className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">
                          {col.name} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Citation Style Selector */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-xl px-3 py-1.5 shadow-2xs">
                  <Quote className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 shrink-0" />
                  <label htmlFor="citation-style-global-select" className="sr-only">Citation Preview Style</label>
                  <select
                    id="citation-style-global-select"
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value as CommonCitationStyle)}
                    className="font-sans text-xs bg-transparent text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer font-medium pr-1"
                    title="Choose citation style format for reference previews"
                  >
                    <option value="Harvard" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Harvard Style</option>
                    <option value="APA" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">APA 7th Edition</option>
                    <option value="MLA" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">MLA 9th Edition</option>
                    <option value="Chicago" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Chicago Author-Date</option>
                    <option value="IEEE" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">IEEE Format</option>
                    <option value="Vancouver" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">Vancouver</option>
                  </select>
                </div>
              </div>

              {/* List count and Expand/Collapse All */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                  {filteredPapers.length} {filteredPapers.length === 1 ? 'reference' : 'references'}
                  {searchTerm && ` matching "${searchTerm}"`}
                </span>
                {filteredPapers.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleExpandAll}
                    className="flex items-center gap-1 text-[11px] text-[#912A4A] dark:text-rose-400 hover:text-[#78223d] dark:hover:text-rose-300 font-semibold cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
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

            </div>
          </div>

          {/* Data Ingestion Module if active */}
          {showIngestionModule && (
            <div className="animate-fadeIn rounded-2xl overflow-hidden border border-stone-200/90 dark:border-stone-800 shadow-sm">
              <DataIngestionModule
                existingPapers={papers}
                collections={collections}
                onIngestPapers={(newPapers) => {
                  newPapers.forEach((paper) => onAddPaper(paper));
                  setShowIngestionModule(false);
                }}
                onClose={() => setShowIngestionModule(false)}
              />
            </div>
          )}

          {/* Paper Adding Form if active */}
          {isAdding && (
            <form
              onSubmit={handleAddPaperSubmit}
              className="p-5 border border-stone-200/90 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 rounded-2xl space-y-4 shadow-sm animate-fadeIn"
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-150 dark:border-stone-800">
                <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                  Add New Reference Material
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1 block">Paper Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Attention Is All You Need"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-[#912A4A]/25 focus:border-[#912A4A] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1 block">Authors *</label>
                  <input
                    type="text"
                    placeholder="e.g. Vaswani, A., Shazeer, N., Parmar, N."
                    value={newAuthors}
                    onChange={(e) => setNewAuthors(e.target.value)}
                    className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-[#912A4A]/25 focus:border-[#912A4A] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1 block">Journal or Conference</label>
                  <input
                    type="text"
                    placeholder="e.g. Advances in Neural Information Processing Systems"
                    value={newJournal}
                    onChange={(e) => setNewJournal(e.target.value)}
                    className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-[#912A4A]/25 focus:border-[#912A4A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1 block">Year</label>
                    <input
                      type="number"
                      placeholder="Year"
                      value={newYear}
                      onChange={(e) => setNewYear(Number(e.target.value))}
                      className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-[#912A4A]/25 focus:border-[#912A4A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1 block">Collection</label>
                    <select
                      value={newCollectionId}
                      onChange={(e) => setNewCollectionId(e.target.value)}
                      className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-[#912A4A]/25 focus:border-[#912A4A] focus:outline-none cursor-pointer"
                    >
                      <option value="all">Default / General</option>
                      {collections.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1 block">DOI Identifier or Link</label>
                  <input
                    type="text"
                    placeholder="e.g. 10.48550/arXiv.1706.03762"
                    value={newDoi}
                    onChange={(e) => setNewDoi(e.target.value)}
                    className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-[#912A4A]/25 focus:border-[#912A4A] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1 block">Abstract or Core Hypothesis</label>
                <textarea
                  placeholder="Key excerpt, abstract, or methodology summary..."
                  value={newAbstract}
                  onChange={(e) => setNewAbstract(e.target.value)}
                  className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 h-20 focus:ring-2 focus:ring-[#912A4A]/25 focus:border-[#912A4A] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1 block">My Notes & Thoughts</label>
                <textarea
                  placeholder="Personal notes, key takeaways, or questions about this paper..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 h-16 focus:ring-2 focus:ring-[#912A4A]/25 focus:border-[#912A4A] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="font-sans text-xs px-3.5 py-2 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="font-sans text-xs bg-[#912A4A] hover:bg-[#78223d] text-white px-4 py-2 rounded-xl transition-colors font-semibold cursor-pointer shadow-2xs"
                >
                  Save Reference
                </button>
              </div>
            </form>
          )}

          {/* Reference Items Listing (Unboxed on Background with 2px Burgundy Horizontal Divider) */}
          <div className="divide-y-2 divide-[#912A4A] dark:divide-[#912A4A] max-h-[640px] overflow-y-auto pr-1 mt-4">
            {filteredPapers.map((p, idx) => {
              const col = collections.find((c) => c.id === p.collectionId);
              const isExpanded = !!expandedPaperIds[p.id];
              const isSelected = selectedPaper?.id === p.id;

              return (
                <div
                  key={p.id}
                  className={`transition-all duration-150 font-sans ${idx === 0 ? 'pt-2 pb-6' : ''}`}
                  style={idx !== 0 ? { paddingTop: '24pt', paddingBottom: '24pt' } : { paddingBottom: '24pt' }}
                >
                  {/* 1st Layer (Primary View): Full-Width Title on top, with chevron at top right, and tags/metadata sharing exact X position */}
                  <div className="space-y-2">
                    {/* Top Row: Title on Left, Actions & Chevron at Top Right */}
                    <div
                      onClick={(e) => togglePaperExpand(p.id, e)}
                      className="flex items-start justify-between gap-3 cursor-pointer group"
                    >
                      <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base leading-snug flex-1 transition-colors group-hover:text-[#912A4A] dark:group-hover:text-rose-300">
                        {p.title}
                      </h4>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPaper(p);
                            setViewMode('inspector');
                          }}
                          className="text-[11px] font-sans font-semibold text-[#912A4A] dark:text-rose-400 hover:text-white hover:bg-[#912A4A] px-2.5 py-1 rounded-lg border border-[#912A4A]/30 dark:border-rose-400/30 transition-colors cursor-pointer"
                          title="Open Document Inspector"
                        >
                          Inspect
                        </button>

                        <button
                          type="button"
                          onClick={(e) => togglePaperExpand(p.id, e)}
                          className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 cursor-pointer transition-colors"
                          title={isExpanded ? 'Collapse reference snippet' : 'Expand reference snippet'}
                          aria-label={isExpanded ? 'Collapse reference snippet' : 'Expand reference snippet'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[#912A4A] dark:text-rose-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Metadata & Tags Row (Strictly Below Title, Sharing Exact Same X Position) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-sans text-xs text-stone-600 dark:text-stone-300 font-medium">
                          {formatAuthorsShort(p.authors, p.year)}
                        </span>

                        {/* Collection Pill */}
                        {col && (
                          <span className="px-2 py-0.5 rounded-full border text-[10px] bg-stone-100 dark:bg-stone-800 border-stone-200/80 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-medium">
                            {col.name}
                          </span>
                        )}

                        {/* Verification Status */}
                        {p.verificationStatus === 'verified' ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200/50 font-medium">
                            Verified
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200/50 font-medium">
                            Incomplete
                          </span>
                        )}

                        {/* Tags below title */}
                        {p.tags && p.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            {p.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-mono px-2 py-0.5 bg-[#912A4A]/5 dark:bg-rose-950/30 text-[#912A4A] dark:text-rose-300 rounded-md border border-[#912A4A]/15 dark:border-rose-900/30"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progressive Disclosure: In-line Citation & Quick Actions */}
                  {isExpanded && (
                    <div className="mt-3.5 pt-3 border-t border-stone-200/60 dark:border-stone-800 space-y-2.5 animate-fadeIn font-sans">
                      
                      {/* Formatted Citation Preview Snippet (Unboxed with Left Burgundy Accent Aligned to Title X) */}
                      <div className="pl-3.5 border-l-2 border-[#912A4A] text-xs font-serif text-stone-800 dark:text-stone-200 leading-relaxed italic select-all py-1">
                        <span className="font-mono text-[10px] uppercase font-bold not-italic text-[#912A4A] dark:text-rose-400 mr-1.5">
                          [{citationStyle}]:
                        </span>
                        {formatPaperPreview(p, citationStyle)}
                      </div>

                      {/* Actions in Expanded View (Aligned with Title X Position) */}
                      <div className="flex items-center justify-between gap-2 pt-0.5 pb-1 text-xs flex-wrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const text = formatPaperPreview(p, citationStyle);
                              navigator.clipboard.writeText(text);
                            }}
                            className="text-[11px] font-sans px-2.5 py-1 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-stone-200/70 dark:border-stone-700 font-medium"
                            title="Copy formatted citation"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>

                          {onInsertCitation && (
                            <button
                              type="button"
                              onClick={() => {
                                const firstAuthor = (p.authors || 'Author').split(',')[0].trim();
                                const citationSnippet = ` (${firstAuthor} et al., ${p.year || new Date().getFullYear()})`;
                                onInsertCitation(citationSnippet);
                              }}
                              className="text-[11px] font-sans px-2.5 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-stone-200/70 dark:border-stone-700 font-medium"
                              title="Insert citation marker directly into manuscript"
                            >
                              <Plus className="w-3 h-3 text-[#912A4A] dark:text-rose-400" />
                              <span>Insert to Draft</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete reference "${p.title}" permanently?`)) {
                                onDeletePaper(p.id);
                                if (selectedPaper?.id === p.id) {
                                  setSelectedPaper(papers.find((item) => item.id !== p.id) || null);
                                }
                              }
                            }}
                            className="text-[11px] font-sans p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer rounded-lg ml-2"
                            title="Delete reference"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progressive Disclosure: Paper Summary & Key Findings */}
                      {(p.abstract || p.structuredSummary || p.notes) && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={(e) => toggleSummaryExpand(p.id, e)}
                            className="w-full py-1 text-left flex items-center justify-between gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
                              <span>Paper Summary & Key Takeaways</span>
                            </div>
                            <span className="text-[#912A4A] dark:text-rose-400 flex items-center">
                              {expandedSummaryIds[p.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </span>
                          </button>

                          {expandedSummaryIds[p.id] && (
                            <div className="pt-2 text-xs space-y-2.5 animate-fadeIn">
                              {/* Standardized Vertical Layout matching Find main themes */}
                              <div className="space-y-3 pt-1">
                                {p.abstract && (
                                  <div className="space-y-1">
                                    <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 block">
                                      Abstract
                                    </span>
                                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed italic text-xs pl-3.5 border-l-2 border-stone-300 dark:border-stone-700">
                                      "{p.abstract}"
                                    </p>
                                  </div>
                                )}

                                {p.structuredSummary && (
                                  <div className="space-y-2.5 pt-1">
                                    {p.structuredSummary.researchQuestion && (
                                      <div className="pl-3.5 border-l-2 border-[#1B0A3B]/40 dark:border-purple-400/40 space-y-0.5">
                                        <span className="text-[11px] font-semibold text-stone-800 dark:text-stone-200 block">
                                          Research aim & question
                                        </span>
                                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-xs">
                                          {p.structuredSummary.researchQuestion}
                                        </p>
                                      </div>
                                    )}

                                    {p.structuredSummary.methods && (
                                      <div className="pl-3.5 border-l-2 border-stone-400 dark:border-stone-600 space-y-0.5">
                                        <span className="text-[11px] font-semibold text-stone-800 dark:text-stone-200 block">
                                          Methodology & design
                                        </span>
                                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-xs">
                                          {p.structuredSummary.methods}
                                        </p>
                                      </div>
                                    )}

                                    {p.structuredSummary.findings && (
                                      <div className="pl-3.5 border-l-2 border-emerald-600/60 space-y-0.5">
                                        <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">
                                          Core findings & key takeaways
                                        </span>
                                        <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-xs">
                                          {p.structuredSummary.findings}
                                        </p>
                                      </div>
                                    )}

                                    {p.structuredSummary.limitations && (
                                      <div className="pl-3.5 border-l-2 border-amber-500/60 space-y-0.5">
                                        <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block">
                                          Stated scope & limitations
                                        </span>
                                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-xs">
                                          {p.structuredSummary.limitations}
                                        </p>
                                      </div>
                                    )}

                                    {p.structuredSummary.keyQuotations && p.structuredSummary.keyQuotations.length > 0 && (
                                      <div className="pl-3.5 border-l-2 border-stone-300 dark:border-stone-700 space-y-0.5">
                                        <span className="text-[11px] font-semibold text-stone-800 dark:text-stone-200 block">
                                          Key Quotations
                                        </span>
                                        <div className="space-y-1">
                                          {p.structuredSummary.keyQuotations.map((quote: string, i: number) => (
                                            <p key={i} className="text-stone-600 dark:text-stone-400 italic text-xs">"{quote}"</p>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {!p.abstract && !p.structuredSummary && p.notes && (
                                  <div className="pl-3.5 border-l-2 border-stone-300 dark:border-stone-700 space-y-0.5">
                                    <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 block">
                                      Notes
                                    </span>
                                    <p className="text-stone-600 dark:text-stone-400 italic text-xs leading-relaxed">
                                      "{p.notes}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Progressive Disclosure: View Full Notes */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={(e) => toggleInspectorExpand(p.id, e)}
                          className="w-full py-1 text-left flex items-center justify-between gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
                            <span>View full notes</span>
                          </div>
                          <span className="text-[#912A4A] dark:text-rose-400 flex items-center">
                            {expandedInspectorIds[p.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </span>
                        </button>

                        {expandedInspectorIds[p.id] && (
                          <div className="pt-2 text-xs space-y-2.5 animate-fadeIn">
                            {/* Personal Notes */}
                            {p.notes ? (
                              <div className="space-y-1">
                                <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 block">
                                  Personal Notes & Annotations
                                </span>
                                <p className="text-stone-700 dark:text-stone-300 leading-relaxed italic text-xs pl-3.5 border-l-2 border-[#912A4A]">
                                  "{p.notes}"
                                </p>
                              </div>
                            ) : (
                              <div className="text-[11px] text-stone-400 dark:text-stone-500 italic pl-3.5 border-l-2 border-stone-200 dark:border-stone-800">
                                No personal notes added yet.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredPapers.length === 0 && (
              <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
                <p className="font-serif font-bold text-stone-700 dark:text-stone-300 text-sm">
                  No matching literature found
                </p>
                <p className="font-sans text-xs text-stone-500 mt-1">
                  {searchTerm
                    ? `No references matched "${searchTerm}". Try a different keyword or clear your filter.`
                    : 'Your reference library is empty. Add a document or batch import a dataset to begin.'}
                </p>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-800 dark:text-stone-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

