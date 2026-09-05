/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Edit3,
  Search,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Layers,
  ListOrdered,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Maximize2,
  Minimize2,
  Eye,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { Paper } from '../types';
import { postWithAiRouting } from '../lib/localAiService';
import { PublishingDraftPayload } from '../types/workProduct';
import { PublishingNoteInput } from '../lib/workProductStore';

const JOURNAL_PRESETS = [
  { id: 'short_comm', name: 'Short Communication / Letter', targetWords: 2500, label: '2,500w Cap' },
  { id: 'std_article', name: 'Standard Research Article', targetWords: 5000, label: '5,000w Goal' },
  { id: 'extended_review', name: 'Extended Review / Monograph', targetWords: 8000, label: '8,000w Limit' },
  { id: 'thesis_chap', name: 'Thesis Chapter / Book Monograph', targetWords: 12000, label: '12,000w Ceiling' },
  { id: 'custom', name: 'Custom Requirement Goal', targetWords: 3500, label: 'Custom' },
];

export type DocumentFormat = 'odt' | 'md' | 'epub' | 'docx' | 'pdf';
export type AudienceType = 'Academic Journal' | 'General Reader' | 'Policy Maker' | 'Peer Reviewer';

export interface OutlineItem {
  id: string;
  title: string;
  level: number;
  completed: boolean;
  notes?: string;
}

export interface NoteCard {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
}

export interface PublisherChecklistItem {
  id: string;
  label: string;
  description: string;
  category: 'formatting' | 'citations' | 'integrity' | 'licensing';
  completed: boolean;
}

export interface ImportedDocument {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  wordCount: number;
  importedAt: string;
  lastEditedAt?: string;
  content: string;
  notes?: string;
}

// Stage 3: exported so workProductMigration.ts's one-time legacy-import
// path can seed the canonical publishing_draft WorkProduct with this
// existing sample content when no pub_* legacy data ever existed at all
// (docs/WORK-LOG.md -- "preserve existing Publishing Workspace sample/
// default content" decision). Content unchanged from before Stage 3.
export const SAMPLE_DRAFT_CONTENT = `# Epistemic Autonomy and Open Publishing Systems

## Abstract
This paper examines the role of open-source document formats—such as OpenDocument (.odt), CommonMark, and EPUB—in preserving human authorship and protecting research integrity.

## Introduction
Academic writing requires an environment where the author retains total sovereignty over their intellectual output. When research relies on proprietary formats or closed engines, authorial agency is compromised.

## Evidence and Discussion
Recent empirical surveys indicate that researchers using open-source tools like LibreOffice report higher confidence in data preservation.

Furthermore, integrating reflective AI review—which poses probing questions rather than silently overwriting draft prose—helps scholars refine their arguments while keeping the human voice central.

## Conclusion
Open publishing preparation empowers scholars, open-access journals, and public monograph projects to disseminate knowledge affordably and accessibly.`;

export const DEFAULT_OUTLINE: OutlineItem[] = [
  { id: 'o1', title: '1. Title, Abstract & Key Concepts', level: 1, completed: true, notes: 'Defined scope and key terms.' },
  { id: 'o2', title: '2. Introduction & Background Context', level: 1, completed: true, notes: 'Set context and research questions.' },
  { id: 'o3', title: '3. Evidence, Synthesis & Critical Discussion', level: 1, completed: false, notes: 'Compare literature sources.' },
  { id: 'o4', title: '4. Findings & Perspectives Analysis', level: 1, completed: false, notes: 'Discuss representative views.' },
  { id: 'o5', title: '5. Conclusion & Recommendations', level: 1, completed: false, notes: 'Summarize implications.' },
];

export const INITIAL_NOTES: NoteCard[] = [
  {
    id: 'n1',
    title: 'Open Source Formats Note',
    content: 'Ensure all generated files conform to ODF XML standards so LibreOffice can open them natively.',
    tags: ['open-format', 'odt'],
    updatedAt: '2026-08-09',
  },
  {
    id: 'n2',
    title: 'Citation Audit Note',
    content: 'Check that all in-text (Author, Year) references match existing library entries.',
    tags: ['citations', 'integrity'],
    updatedAt: '2026-08-09',
  },
];

export const DEFAULT_CHECKLIST: PublisherChecklistItem[] = [
  { id: 'c1', label: 'Abstract & Title Alignment', description: 'Title and abstract clearly reflect the core research question.', category: 'formatting', completed: true },
  { id: 'c2', label: 'Structured Headings Hierarchy', description: 'Heading levels follow a logical hierarchy without missing steps.', category: 'formatting', completed: true },
  { id: 'c3', label: 'Inline Citation Verification', description: 'All inline citations correspond to verified library references.', category: 'citations', completed: false },
  { id: 'c4', label: 'Open Format Export Prepared', description: 'Manuscript exports cleanly in ODT, Markdown, or Word format.', category: 'licensing', completed: false },
  { id: 'c5', label: 'Perspective & Data Diversity Check', description: 'Reviewed whose voice is included and who may be missing.', category: 'integrity', completed: true },
];

export const DEFAULT_IMPORTED_DOCS: ImportedDocument[] = [
  {
    id: 'doc_sample_1',
    title: 'Sample Scholarly Draft',
    fileName: 'sample_draft.md',
    fileType: 'md',
    sizeBytes: 2048,
    wordCount: 320,
    importedAt: '2026-08-09',
    lastEditedAt: '2026-08-09',
    content: `# Scholarly Research Draft\n\nAcademic writing requires an environment where the author retains total sovereignty over their intellectual output...`,
    notes: 'Initial sample document.',
  },
];

interface CreativePublishingWorkspaceProps {
  papers: Paper[];
  onAddPaper?: (paper: Paper) => void;
  onUpdatePaper?: (paper: Paper) => void;
  publishingDraft: PublishingDraftPayload;
  onUpdatePublishingFields: (fields: Partial<PublishingDraftPayload>) => void;
  onAddPublishingNote: (note: PublishingNoteInput) => void;
}

export default function CreativePublishingWorkspace({
  papers,
  onAddPaper,
  onUpdatePaper,
  publishingDraft,
  onUpdatePublishingFields,
  onAddPublishingNote,
}: CreativePublishingWorkspaceProps) {
  // Main Draft State
  //
  // Stage 3 -- docTitle/draftContent/outline/checklist/importedDocs are
  // initialised from the publishingDraft prop (canonical WorkProduct state,
  // owned by App.tsx), not read from localStorage directly any more. Local
  // useState is kept for responsive editing, with ONE consolidated effect
  // below pushing changes back up via onUpdatePublishingFields -- see
  // docs/WORK-LOG.md for why this replaced the previous six independent
  // localStorage-backed effects.
  //
  // notes is NOT given local state at all: it is read directly from
  // publishingDraft.notes and mutated only via onAddPublishingNote, because
  // this field has a second, independent writer (ResearchWellbeing.tsx's
  // "save session intent as a note" feature) discovered during the Stage 3
  // mutation-path inventory -- a local mirror here would risk silently
  // clobbering a note added from that other component. See
  // docs/WORK-LOG.md for the full rationale.
  const [documentTitle, setDocumentTitle] = useState(() => publishingDraft.docTitle);
  const [draftContent, setDraftContent] = useState(() => publishingDraft.draftContent);

  const [activeTab, setActiveTab] = useState<'write' | 'documents' | 'outline' | 'export'>('write');

  // Focus Mode
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isAnalyticsMenuOpen, setIsAnalyticsMenuOpen] = useState<boolean>(false);

  // Imported Documents
  const [importedDocs, setImportedDocs] = useState<ImportedDocument[]>(() => publishingDraft.importedDocs);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(() => (importedDocs.length > 0 ? importedDocs[0].id : null));
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Outline & Notes State
  const [outline, setOutline] = useState<OutlineItem[]>(() => publishingDraft.outline);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Checklist
  const [checklist, setChecklist] = useState<PublisherChecklistItem[]>(() => publishingDraft.checklist);

  // Target Goal State
  //
  // Deliberately NOT wired into publishingDraft / onUpdatePublishingFields.
  // These two fields were already only ever read from localStorage once at
  // mount, with no persistence effect of their own (selectedJournalTargetId
  // is live-mutable via the dropdown below but was never actually
  // persisted; customTargetWords's setter was never even called anywhere) --
  // a pre-existing gap, not something this change fixes or worsens. See
  // docs/WORK-LOG.md.
  const [selectedJournalTargetId, setSelectedJournalTargetId] = useState<string>(() => localStorage.getItem('pub_journal_target_id') || 'std_article');
  const [customTargetWords, setCustomTargetWords] = useState<number>(() => {
    const cached = localStorage.getItem('pub_custom_target_words');
    return cached ? parseInt(cached, 10) : 3500;
  });

  // AI Review
  const [isReflecting, setIsReflecting] = useState(false);
  const [reflectionResult, setReflectionResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence -- Stage 3: one consolidated push to canonical WorkProduct
  // state (docs/WORK-LOG.md), replacing the previous six independent
  // localStorage-backed effects. notes is deliberately not included here --
  // see the constructor-area comment above for why it is mutated only via
  // onAddPublishingNote, never through this effect.
  useEffect(() => {
    onUpdatePublishingFields({
      docTitle: documentTitle,
      draftContent,
      outline,
      checklist,
      importedDocs,
    });
  }, [documentTitle, draftContent, outline, checklist, importedDocs, onUpdatePublishingFields]);

  // Readability Statistics
  const computeStats = () => {
    const text = draftContent.trim();
    if (!text) return { words: 0, sentences: 0, paragraphs: 0, fleschEase: 100, fkGrade: 0 };

    const words = text.split(/\s+/).filter(Boolean).length;
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || 1;

    // Syllable estimation
    const countSyllables = (w: string) => {
      w = w.toLowerCase().replace(/(?:[^laeiouy]|ed|es|e)$/i, '');
      const m = w.match(/[aeiouy]{1,2}/g);
      return m ? m.length : 1;
    };
    const totalSyllables = text.split(/\s+/).reduce((acc, word) => acc + countSyllables(word), 0);

    const fleschEase = Math.round(206.835 - 1.015 * (words / sentences) - 84.6 * (totalSyllables / Math.max(1, words)));
    const fkGrade = Math.max(0, Math.round(0.39 * (words / sentences) + 11.8 * (totalSyllables / Math.max(1, words)) - 15.59));

    return { words, sentences, paragraphs, fleschEase: Math.min(100, Math.max(0, fleschEase)), fkGrade };
  };

  const stats = computeStats();
  const selectedPreset = JOURNAL_PRESETS.find((p) => p.id === selectedJournalTargetId);
  const activeTargetWords = selectedJournalTargetId === 'custom' ? customTargetWords : (selectedPreset?.targetWords || 5000);
  const wordDiff = activeTargetWords - stats.words;

  // Export File Generator
  const handleExport = (format: DocumentFormat) => {
    let fileContent = draftContent;
    let mimeType = 'text/plain';
    let extension = 'txt';

    if (format === 'odt') {
      mimeType = 'application/vnd.oasis.opendocument.text';
      extension = 'odt';
      fileContent = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">
  <office:body>
    <office:text>
      <text:h text:outline-level="1">${documentTitle}</text:h>
      ${draftContent.split('\n\n').map((p) => `<text:p>${p.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text:p>`).join('\n      ')}
    </office:text>
  </office:body>
</office:document-content>`;
    } else if (format === 'md') {
      mimeType = 'text/markdown';
      extension = 'md';
      fileContent = `# ${documentTitle}\n\n${draftContent}`;
    } else if (format === 'epub') {
      mimeType = 'application/epub+zip';
      extension = 'epub';
      fileContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${documentTitle}</dc:title>
  </metadata>
  <spine><itemref idref="ch1"/></spine>
</package>`;
    } else if (format === 'docx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      extension = 'docx';
      fileContent = `<html><body><h1>${documentTitle}</h1><div>${draftContent.replace(/\n\n/g, '<p></p>')}</div></body></html>`;
    } else if (format === 'pdf') {
      window.print();
      return;
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentTitle.toLowerCase().replace(/\s+/g, '_')}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import Processing
  const processImportFiles = async (fileList: FileList) => {
    setIsImporting(true);
    const newDocs: ImportedDocument[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const extension = file.name.split('.').pop()?.toLowerCase() || 'txt';
      const sizeBytes = file.size;

      try {
        let rawText = await file.text();
        let finalContent = rawText;
        let inferredTitle = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

        const words = finalContent.trim().split(/\s+/).filter(Boolean).length;
        const newDoc: ImportedDocument = {
          id: 'doc_' + Date.now() + '_' + i,
          title: inferredTitle,
          fileName: file.name,
          fileType: extension,
          sizeBytes,
          wordCount: words,
          importedAt: new Date().toLocaleDateString(),
          content: finalContent,
          notes: `Imported file: ${file.name}`
        };
        newDocs.push(newDoc);
      } catch (err) {
        console.error('Import error:', err);
      }
    }

    if (newDocs.length > 0) {
      setImportedDocs((prev) => [...newDocs, ...prev]);
      setSelectedDocId(newDocs[0].id);
      setActiveTab('documents');
    }
    setIsImporting(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processImportFiles(e.target.files);
  };

  const handleRunReflectiveReview = async () => {
    setIsReflecting(true);
    setReflectionResult(null);

    try {
      const res = await postWithAiRouting('/api/gemini/publishing/reflective-review', {
        draftText: draftContent,
        targetAudience: 'Academic Journal',
        papersInLibrary: papers,
      });

      if (res.ok) {
        const data = await res.json();
        setReflectionResult(data);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsReflecting(false);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    const added: NoteCard = {
      id: 'n_' + Date.now(),
      title: newNoteTitle,
      content: newNoteContent,
      tags: ['note'],
      updatedAt: new Date().toLocaleDateString(),
    };
    onAddPublishingNote(added);
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)));
  };

  const selectedDoc = importedDocs.find((d) => d.id === selectedDocId) || importedDocs[0] || null;

  return (
    <div className="space-y-6 font-sans text-stone-900 dark:text-stone-100 text-left pt-2 pb-16 animate-fadeIn">
      {/* ----------------------------------------------------------------- */}
      {/* UNBOXED SUB-GUIDANCE & ACTIONS BAR (Aligned Left)                 */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800/80 pb-4">
        <div className="space-y-1 max-w-2xl">
          <h1 className="font-sans font-medium text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 tracking-tight">
            Publishing & Export
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            Prepare your research manuscript, check submission readiness, and export open format documents (.odt, .docx, .md, .pdf, .epub).
          </p>
          <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-stone-500">
            <span>Word Count: <strong className="text-stone-800 dark:text-stone-200">{stats.words.toLocaleString()}</strong> / {activeTargetWords.toLocaleString()} w</span>
            <span>•</span>
            <span>Flesch Score: <strong className="text-stone-800 dark:text-stone-200">{stats.fleschEase}</strong>/100</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              isFocusMode ? 'bg-[#912A4A] text-white' : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
            }`}
          >
            {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {isFocusMode ? 'Exit Focus Mode' : 'Focus Mode'}
          </button>

          <input type="file" ref={fileInputRef} onChange={handleImportFile} multiple className="hidden" accept=".odt,.md,.txt,.docx,.pdf" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1.5 cursor-pointer transition-colors px-2.5 py-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800/60"
          >
            <Upload className="w-3.5 h-3.5" />
            {isImporting ? 'Importing...' : 'Import File'}
          </button>

          <button
            onClick={() => handleExport('odt')}
            className="bg-[#912A4A] hover:bg-[#78223d] text-white font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export (.odt)
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* MAIN NAVIGATION TABS (UNBOXED 4 TABS)                             */}
      {/* ----------------------------------------------------------------- */}
      {!isFocusMode && (
        <div className="flex items-center gap-6 border-b border-stone-200/80 dark:border-stone-800 pb-px text-xs font-medium" role="tablist">
          <button
            onClick={() => setActiveTab('write')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'write'
                ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-300 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Manuscript Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-300 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Document Library ({importedDocs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('outline')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'outline'
                ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-300 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Outline & Notes ({outline.length + publishingDraft.notes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-300 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Submission & Export
          </button>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 1: MANUSCRIPT EDITOR                                         */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'write' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Document Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Manuscript Title..."
              className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#912A4A] outline-none w-full sm:w-2/3 py-1"
            />

            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-500 font-mono text-[11px]">Journal Goal:</span>
              <select
                value={selectedJournalTargetId}
                onChange={(e) => setSelectedJournalTargetId(e.target.value)}
                className="text-xs p-1.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded-md text-stone-800 dark:text-stone-200 outline-none"
              >
                {JOURNAL_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.label})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsAnalyticsMenuOpen(!isAnalyticsMenuOpen)}
                className="text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1 cursor-pointer pl-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#912A4A]" />
                {isAnalyticsMenuOpen ? 'Hide Tool Analytics' : 'Show Tool Analytics'}
              </button>
            </div>
          </div>

          {/* Editor Canvas + Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className={`${isAnalyticsMenuOpen ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-3`}>
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="Write or paste your research manuscript prose here..."
                rows={22}
                className="w-full text-xs font-serif leading-relaxed p-4 rounded-lg border border-stone-200/80 dark:border-stone-800 bg-transparent text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-[#912A4A] outline-none resize-y"
              />

              <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                <span>{stats.words.toLocaleString()} words | {stats.sentences} sentences | {stats.paragraphs} paragraphs</span>
                <span className={wordDiff < 0 ? 'text-amber-600 font-bold' : 'text-stone-500'}>
                  {wordDiff < 0 ? `${Math.abs(wordDiff).toLocaleString()} words over goal` : `${wordDiff.toLocaleString()} words remaining`}
                </span>
              </div>
            </div>

            {/* Analytics Sidebar Drawer */}
            {isAnalyticsMenuOpen && (
              <div className="lg:col-span-4 space-y-4 border-l border-stone-200/80 dark:border-stone-800/80 pl-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-xs uppercase text-stone-900 dark:text-stone-100 font-mono tracking-wider">
                    Manuscript Analytics
                  </h4>
                  <button
                    onClick={() => setIsAnalyticsMenuOpen(false)}
                    className="text-xs text-stone-400 hover:text-stone-700"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <span className="font-medium text-stone-700 dark:text-stone-300">Readability Score</span>
                    <p className="text-stone-500 text-[11px]">Flesch Ease: {stats.fleschEase}/100 (Grade {stats.fkGrade})</p>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-stone-200/60 dark:border-stone-800/60">
                    <span className="font-medium text-stone-700 dark:text-stone-300">Quick AI Review</span>
                    <p className="text-stone-500 text-[11px] leading-snug">Run a reflective review to test argument logic and structure.</p>
                    <button
                      onClick={handleRunReflectiveReview}
                      disabled={isReflecting}
                      className="mt-1 text-xs px-3 py-1.5 bg-[#912A4A] hover:bg-[#78223d] text-white font-medium rounded-md cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isReflecting ? 'Reviewing...' : 'Run Reflective Review'}
                    </button>
                  </div>

                  {reflectionResult && (
                    <div className="space-y-2 pt-2 border-t border-stone-200/60 dark:border-stone-800/60 text-[11px]">
                      <span className="font-bold text-[#912A4A]">AI Feedback Highlights:</span>
                      <p className="text-stone-600 dark:text-stone-300 leading-snug">
                        {reflectionResult.summary || 'Review complete. Check findings in Submission & Export tab.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 2: DOCUMENT LIBRARY                                          */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'documents' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Drag and Drop Importer Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files) processImportFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
              isDragOver ? 'border-[#912A4A] bg-[#912A4A]/5' : 'border-stone-200 dark:border-stone-800 hover:border-stone-400'
            }`}
          >
            <Upload className="w-6 h-6 text-stone-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-stone-800 dark:text-stone-200">
              Drag and drop files here or click to browse
            </p>
            <p className="text-[11px] text-stone-500 mt-1">
              Supports .odt, .md, .docx, .txt, .pdf documents
            </p>
          </div>

          {/* Document List */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-xs uppercase text-stone-900 dark:text-stone-100 font-mono tracking-wider">
              Imported Research Documents ({importedDocs.length})
            </h4>

            {importedDocs.length === 0 ? (
              <p className="text-xs text-stone-500 italic">No imported documents yet.</p>
            ) : (
              <div className="space-y-2">
                {importedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-2.5 border-b border-stone-200/80 dark:border-stone-800/80 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-stone-900 dark:text-stone-100">{doc.title}</span>
                      <p className="text-[11px] text-stone-500 font-mono">
                        {doc.fileName} • {doc.wordCount} words • Imported {doc.importedAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setDraftContent(doc.content);
                          setDocumentTitle(doc.title);
                          setActiveTab('write');
                        }}
                        className="text-xs text-[#912A4A] hover:underline font-medium cursor-pointer"
                      >
                        Load into Editor
                      </button>
                      <button
                        onClick={() => {
                          setImportedDocs((prev) => prev.filter((d) => d.id !== doc.id));
                        }}
                        className="text-xs text-stone-400 hover:text-stone-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 3: OUTLINE & NOTES                                           */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'outline' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Structure Outline */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-xs uppercase text-stone-900 dark:text-stone-100 font-mono tracking-wider">
              Manuscript Outline & Sections ({outline.length})
            </h4>

            <div className="space-y-2">
              {outline.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-stone-200/80 dark:border-stone-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOutline((prev) => prev.map((o) => (o.id === item.id ? { ...o, completed: !o.completed } : o)))}
                      className={`w-4 h-4 rounded flex items-center justify-center border cursor-pointer transition-colors ${
                        item.completed ? 'bg-[#1D9E75] border-[#1D9E75] dark:bg-[#28c093] dark:border-[#28c093] text-white' : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900'
                      }`}
                    >
                      {item.completed && <Check className="w-3 h-3 stroke-[2.5]" />}
                    </button>
                    <span className={item.completed ? 'line-through text-stone-400 font-medium' : 'text-stone-900 dark:text-stone-100 font-medium'}>
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 italic">{item.notes || ''}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Research Notes */}
          <div className="space-y-4 pt-4 border-t border-stone-200/80 dark:border-stone-800/80">
            <h4 className="font-serif font-bold text-xs uppercase text-stone-900 dark:text-stone-100 font-mono tracking-wider">
              Research & Idea Notes ({publishingDraft.notes.length})
            </h4>

            <form onSubmit={handleAddNote} className="space-y-2 max-w-lg">
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full text-xs p-2 rounded border border-stone-200 dark:border-stone-800 bg-transparent text-stone-900 dark:text-stone-100 outline-none"
              />
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Note details..."
                rows={2}
                className="w-full text-xs p-2 rounded border border-stone-200 dark:border-stone-800 bg-transparent text-stone-900 dark:text-stone-100 outline-none resize-y"
              />
              <button
                type="submit"
                className="text-xs font-semibold px-3 py-1.5 bg-[#912A4A] text-white rounded cursor-pointer hover:bg-[#78223d]"
              >
                Add Note
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {publishingDraft.notes.map((note: any) => (
                <div key={note.id} className="py-2.5 border-b border-stone-200/80 dark:border-stone-800/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-stone-900 dark:text-stone-100 font-semibold">{note.title}</strong>
                    <span className="text-[10px] text-stone-400 font-mono">{note.updatedAt}</span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 4: SUBMISSION & EXPORT                                       */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'export' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Export Formats */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-xs uppercase text-stone-900 dark:text-stone-100 font-mono tracking-wider">
              Export Open Formats
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-300">
              Download your complete manuscript in standard open source formats compatible with LibreOffice, Word, or Markdown readers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {[
                { fmt: 'odt', name: 'LibreOffice Text (.odt)', desc: 'OpenDocument Text standard format.' },
                { fmt: 'docx', name: 'Word Document (.docx)', desc: 'Standard XML formatted document.' },
                { fmt: 'md', name: 'Markdown (.md)', desc: 'Plain text with CommonMark headers.' },
                { fmt: 'pdf', name: 'Print / PDF (.pdf)', desc: 'Browser print-to-PDF format.' },
                { fmt: 'epub', name: 'Open Monograph (.epub)', desc: 'E-book reader publication format.' },
              ].map((item) => (
                <button
                  key={item.fmt}
                  onClick={() => handleExport(item.fmt as DocumentFormat)}
                  className="p-3 border border-stone-200/80 dark:border-stone-800 rounded-lg text-left hover:border-[#912A4A] transition-all cursor-pointer group space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100 group-hover:text-[#912A4A]">
                      {item.name}
                    </span>
                    <Download className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#912A4A]" />
                  </div>
                  <p className="text-[11px] text-stone-500 leading-snug">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Submission Checklist */}
          <div className="space-y-3 pt-4 border-t border-stone-200/80 dark:border-stone-800/80">
            <h4 className="font-serif font-bold text-xs uppercase text-stone-900 dark:text-stone-100 font-mono tracking-wider">
              Publisher Submission Readiness Checklist
            </h4>

            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 py-2 border-b border-stone-200/80 dark:border-stone-800/80 text-xs">
                  <button
                    onClick={() => handleToggleChecklist(item.id)}
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border cursor-pointer ${
                      item.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300'
                    }`}
                  >
                    {item.completed && <Check className="w-3 h-3" />}
                  </button>
                  <div className="space-y-0.5">
                    <span className={item.completed ? 'line-through text-stone-400 font-semibold' : 'text-stone-900 dark:text-stone-100 font-semibold'}>
                      {item.label}
                    </span>
                    <p className="text-[11px] text-stone-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
