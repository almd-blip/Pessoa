/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Search, 
  FileText, 
  Tag, 
  Trash2, 
  Edit2, 
  Link as LinkIcon, 
  Check, 
  BookOpen, 
  Plus, 
  X,
  FileCode,
  FileCheck,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { UserUploadedDoc, ResearchWellbeingInsight } from '../types/wellbeingInsights';
import { 
  getUserLibrary, 
  saveUserDoc, 
  deleteUserDoc, 
  updateDocMetadata, 
  attachDocToInsight 
} from '../lib/userLibraryStorage';
import ArticleReaderModal from './ArticleReaderModal';

interface MyResearchLibraryProps {
  insights: ResearchWellbeingInsight[];
  onOpenArticleReader?: (doc: any) => void;
  attachToInsightId?: string;
  onCloseAttachModal?: () => void;
}

export default function MyResearchLibrary({ 
  insights, 
  onOpenArticleReader,
  attachToInsightId,
  onCloseAttachModal 
}: MyResearchLibraryProps) {
  const [docs, setDocs] = useState<UserUploadedDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'attached'>('all');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const toggleNoteExpand = (id: string) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(!!attachToInsightId);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAuthors, setUploadAuthors] = useState('');
  const [uploadYear, setUploadYear] = useState<number>(new Date().getFullYear());
  const [uploadTags, setUploadTags] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedContent, setPastedContent] = useState('');
  const [selectedInsightToAttach, setSelectedInsightToAttach] = useState<string>(attachToInsightId || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal state
  const [editingDoc, setEditingDoc] = useState<UserUploadedDoc | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthors, setEditAuthors] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Reader state
  const [readerDoc, setReaderDoc] = useState<UserUploadedDoc | null>(null);

  useEffect(() => {
    setDocs(getUserLibrary());

    const handleSync = () => {
      setDocs(getUserLibrary());
    };
    window.addEventListener('user_library_updated', handleSync);
    return () => {
      window.removeEventListener('user_library_updated', handleSync);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!uploadTitle) {
        // Strip extension
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        setUploadTitle(cleanName);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    let fileType: 'pdf' | 'epub' | 'txt' | 'html' = 'pdf';
    let textContent = pastedContent.trim();
    let fileName = selectedFile ? selectedFile.name : 'uploaded_research_doc.txt';
    let fileSize = selectedFile ? selectedFile.size : 1024 * 50;

    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'epub') fileType = 'epub';
      else if (ext === 'txt') fileType = 'txt';
      else if (ext === 'html' || ext === 'htm') fileType = 'html';
      else fileType = 'pdf';

      // Read text if txt/html or attempt file read
      try {
        if (ext === 'txt' || ext === 'html' || ext === 'htm') {
          textContent = await selectedFile.text();
        } else {
          // For PDF/EPUB, create readable header & excerpt
          textContent = `# ${uploadTitle}\n\n**Authors:** ${uploadAuthors || 'Unknown Author'} (${uploadYear})\n**Filename:** ${fileName}\n\n## Abstract & Summary Notes\n${uploadNotes || 'User-uploaded research document.'}\n\n---
          \n*File stored securely in local device storage. Private copy.*`;
        }
      } catch (err) {
        console.warn('Could not read raw file text:', err);
      }
    }

    if (!textContent) {
      textContent = `# ${uploadTitle}\n\n**Authors:** ${uploadAuthors || 'Unknown'} (${uploadYear})\n\n${uploadNotes || 'Personal archival research copy.'}`;
    }

    const tagsArray = uploadTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const attachedIds = selectedInsightToAttach ? [selectedInsightToAttach] : [];

    const newDoc: UserUploadedDoc = {
      id: `user-doc-${Date.now()}`,
      title: uploadTitle.trim(),
      authors: uploadAuthors.trim() || 'User Upload',
      year: uploadYear || new Date().getFullYear(),
      filename: fileName,
      fileType,
      fileSize,
      uploadedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      tags: tagsArray.length > 0 ? tagsArray : ['my research'],
      attachedInsightIds: attachedIds,
      textContent,
      notes: uploadNotes.trim()
    };

    const updated = saveUserDoc(newDoc);
    setDocs(updated);

    // Reset modal
    setShowUploadModal(false);
    setSelectedFile(null);
    setUploadTitle('');
    setUploadAuthors('');
    setUploadTags('');
    setUploadNotes('');
    setPastedContent('');
    setSelectedInsightToAttach('');
    if (onCloseAttachModal) onCloseAttachModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this document from your local research library?')) {
      const updated = deleteUserDoc(id);
      setDocs(updated);
    }
  };

  const handleStartEdit = (doc: UserUploadedDoc) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditAuthors(doc.authors);
    setEditTags(doc.tags.join(', '));
    setEditNotes(doc.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    const tagsArray = editTags.split(',').map(t => t.trim()).filter(Boolean);
    const updated = updateDocMetadata(editingDoc.id, {
      title: editTitle.trim(),
      authors: editAuthors.trim(),
      tags: tagsArray,
      notes: editNotes.trim()
    });
    setDocs(updated);
    setEditingDoc(null);
  };

  const handleToggleInsightAttachment = (docId: string, insightId: string) => {
    const doc = docs.find(d => d.id === docId);
    if (!doc) return;
    const current = doc.attachedInsightIds || [];
    let updatedAttached: string[];
    if (current.includes(insightId)) {
      updatedAttached = current.filter(id => id !== insightId);
    } else {
      updatedAttached = [...current, insightId];
    }
    const updated = updateDocMetadata(docId, { attachedInsightIds: updatedAttached });
    setDocs(updated);
  };

  // Extract all unique tags
  const allTags = Array.from(new Set(docs.flatMap(d => d.tags || [])));

  // Filter docs
  const filteredDocs = docs.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag === 'all' || doc.tags.includes(selectedTag);
    const matchesTab = activeTab === 'all' || (doc.attachedInsightIds && doc.attachedInsightIds.length > 0);

    return matchesSearch && matchesTag && matchesTab;
  });

  return (
    <div className="space-y-6 font-sans text-stone-900 dark:text-stone-100" id="my-research-library-component">
      
      {/* Header Banner */}
      <div className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#1d9e75]" />
            <h2 className="font-sans font-bold text-lg text-stone-900 dark:text-stone-100">
              My Research Library
            </h2>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#1d9e75]/10 text-[#1d9e75] border border-[#1d9e75]/30">
              Private Local Storage
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xl leading-relaxed">
            Upload personal research PDFs, EPUBs, or notes. Your files remain strictly on your local device, private, searchable, and attachable to relevant Wellbeing Research Insights.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="font-sans text-xs px-4 py-2.5 rounded-lg bg-[#1d9e75] hover:bg-[#16815f] text-white font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
          id="upload-new-research-doc-btn"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Article / PDF</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-px">
        
        {/* Tabs */}
        <div className="flex items-center gap-6 text-xs font-medium" role="tablist">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all' 
                ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold' 
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <span>All Papers ({docs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attached')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'attached' 
                ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold' 
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <span>Attached to Insights ({docs.filter(d => d.attachedInsightIds?.length > 0).length})</span>
          </button>
        </div>

        {/* Search & Tag filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search uploaded library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-md bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 w-48 sm:w-60 focus:outline-none focus:border-[#1d9e75]"
            />
          </div>

          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="py-1.5 px-2 text-xs rounded-md bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:border-[#1d9e75]"
            >
              <option value="all">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Document Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => {
          const attachedInsights = insights.filter(ins => doc.attachedInsightIds?.includes(ins.id));

          return (
            <div 
              key={doc.id}
              className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800/90 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#1d9e75]/50 transition-all text-left"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-[#1d9e75] border border-emerald-100 dark:border-emerald-900">
                      <FileText className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                      {doc.fileType} • {(doc.fileSize / 1024).toFixed(0)} KB
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(doc)}
                      className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded cursor-pointer"
                      title="Edit Metadata"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1 text-stone-400 hover:text-red-500 rounded cursor-pointer"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 leading-snug">
                  {doc.title}
                </h3>

                <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                  {doc.authors} ({doc.year})
                </p>

                <p className="text-[11px] font-mono text-stone-400 truncate">
                  File: {doc.filename}
                </p>

                {doc.notes && (
                  <div className="space-y-1">
                    <p className={`text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-900 p-2.5 rounded-lg text-left italic border border-stone-150 dark:border-stone-800 ${
                      !expandedNotes[doc.id] && doc.notes.length > 90 ? 'line-clamp-2' : ''
                    }`}>
                      "{doc.notes}"
                    </p>
                    {doc.notes.length > 90 && (
                      <button
                        type="button"
                        onClick={() => toggleNoteExpand(doc.id)}
                        className="text-[10px] text-[#1d9e75] hover:underline font-medium cursor-pointer"
                      >
                        {expandedNotes[doc.id] ? 'Show less' : 'Read full note'}
                      </button>
                    )}
                  </div>
                )}

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {doc.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-[#1d9e75]" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Attachments and Action Footer */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-850 space-y-2">
                {/* Linked Insights */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-mono text-stone-400">Attached to:</span>
                  {attachedInsights.length > 0 ? (
                    attachedInsights.map(ins => (
                      <span key={ins.id} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1d9e75]/10 text-[#1d9e75] border border-[#1d9e75]/20">
                        {ins.title}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-stone-400 italic">No Insights linked</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {/* Attach dropdown selector */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleToggleInsightAttachment(doc.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="py-1 px-2 text-[11px] rounded bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 focus:outline-none"
                  >
                    <option value="">+ Link to Insight...</option>
                    {insights.map(ins => (
                      <option key={ins.id} value={ins.id}>
                        {doc.attachedInsightIds?.includes(ins.id) ? '✓ ' : ''}{ins.title}
                      </option>
                    ))}
                  </select>

                  {/* Read Offline Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenArticleReader) {
                        onOpenArticleReader(doc);
                      } else {
                        setReaderDoc(doc);
                      }
                    }}
                    className="px-3 py-1.5 rounded-md bg-[#1d9e75] hover:bg-[#16815f] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read Offline</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}

        {filteredDocs.length === 0 && (
          <div className="col-span-full py-12 px-4 text-center bg-stone-50/50 dark:bg-stone-900/30 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl space-y-3">
            <ShieldCheck className="w-8 h-8 text-[#1d9e75] mx-auto opacity-70" />
            <h4 className="font-sans font-semibold text-sm text-stone-800 dark:text-stone-200">
              No local research papers match your search
            </h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Upload your own legally acquired research copies (PDF, EPUB, TXT) to keep them private, searchable, and attached to your Wellbeing Research Insights.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 text-xs rounded-lg bg-[#1d9e75] text-white font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Your First Copy
            </button>
          </div>
        )}
      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-2xl max-w-lg w-full space-y-4 text-left font-sans">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#1d9e75]" />
                <h3 className="font-sans font-bold text-base text-stone-900 dark:text-stone-100">
                  Upload Research Paper / Notes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  if (onCloseAttachModal) onCloseAttachModal();
                }}
                className="px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-lg cursor-pointer flex items-center gap-1 transition-colors shadow-2xs"
                aria-label="Close Upload Modal"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              {/* File Picker */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Select Local File (PDF, EPUB, TXT, HTML)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.epub,.txt,.html,.htm"
                  className="w-full text-xs p-2 border border-stone-200 dark:border-stone-800 rounded bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Workplace Impostor Thoughts & Countermeasures"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#1d9e75]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Authors
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Smith, J. & Taylor, A."
                    value={uploadAuthors}
                    onChange={(e) => setUploadAuthors(e.target.value)}
                    className="w-full text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#1d9e75]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={uploadYear}
                    onChange={(e) => setUploadYear(parseInt(e.target.value) || 2025)}
                    className="w-full text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#1d9e75]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. imposter syndrome, qualitative, writing notes"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#1d9e75]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Attach to Wellbeing Research Insight
                </label>
                <select
                  value={selectedInsightToAttach}
                  onChange={(e) => setSelectedInsightToAttach(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#1d9e75]"
                >
                  <option value="">Do not attach yet</option>
                  {insights.map(ins => (
                    <option key={ins.id} value={ins.id}>{ins.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Abstract / Notes / Full Text Excerpt
                </label>
                <textarea
                  rows={3}
                  placeholder="Paste article abstract, key quotes, or full text notes..."
                  value={pastedContent || uploadNotes}
                  onChange={(e) => {
                    setUploadNotes(e.target.value);
                    setPastedContent(e.target.value);
                  }}
                  className="w-full text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#1d9e75]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    if (onCloseAttachModal) onCloseAttachModal();
                  }}
                  className="px-4 py-2 text-xs rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded bg-[#1d9e75] hover:bg-[#16815f] text-white font-semibold cursor-pointer"
                >
                  Save to Local Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT METADATA MODAL */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-2xl max-w-md w-full space-y-4 text-left font-sans">
            <h3 className="font-sans font-bold text-base text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
              Edit Document Metadata
            </h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Authors</label>
                <input
                  type="text"
                  value={editAuthors}
                  onChange={(e) => setEditAuthors(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-3 py-1.5 text-xs rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs rounded bg-[#1d9e75] text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Local Article Reader Modal */}
      {readerDoc && (
        <ArticleReaderModal
          article={{
            id: readerDoc.id,
            title: readerDoc.title,
            authors: readerDoc.authors,
            year: readerDoc.year,
            journal: readerDoc.filename,
            licence: 'User Uploaded Copy',
            source: 'Local Device Memory',
            abstract: readerDoc.notes || 'User uploaded document',
            keywords: readerDoc.tags,
            fullText: readerDoc.textContent,
            researchType: 'user paper'
          }}
          onClose={() => setReaderDoc(null)}
        />
      )}

    </div>
  );
}
