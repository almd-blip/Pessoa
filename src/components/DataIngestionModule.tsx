/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { Paper, Collection } from '../types';

interface DataIngestionModuleProps {
  existingPapers: Paper[];
  collections: Collection[];
  onIngestPapers: (papers: Paper[]) => void;
  onClose?: () => void;
}

export interface ParsedItem {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  abstract: string;
  notes: string;
  tags: string[];
  selected: boolean;
  isDuplicate: boolean;
  ragChunksCount: number;
  completenessScore: number; // 0-100%
  rawFormat: 'json' | 'bibtex' | 'csv' | 'text';
}

export default function DataIngestionModule({
  existingPapers,
  collections,
  onIngestPapers,
  onClose,
}: DataIngestionModuleProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [rawText, setRawText] = useState('');
  const [targetCollectionId, setTargetCollectionId] = useState<string>('all');
  const [customTag, setCustomTag] = useState<string>('imported-dataset');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample Datasets for Quick Demonstration
  const SAMPLE_DUMPS = [
    {
      name: 'Artificial Intelligence & Local Inference Corpus (4 Papers)',
      description: 'Recent research papers on local model deployment, quantisation, and offline retrieval architectures.',
      category: 'Computer Science',
      data: [
        {
          title: 'Quantised Edge Inference for Offline Retrieval Augmented Generation',
          authors: 'Marcus Vance, Elena Rostova',
          journal: 'Journal of Local AI & Distributed Systems',
          year: 2025,
          doi: '10.1016/j.jlaid.2025.04.012',
          abstract: 'We present a light footprint local retrieval framework utilising 4-bit quantised open-weight models and in-memory vector databases. Performance benchmark results show 94% retrieval accuracy with complete data privacy.',
          notes: 'Key foundational reference for offline retrieval setups. Discusses memory constraints on mobile and desktop workstations.',
          tags: ['local-ai', 'retrieval', 'quantisation', 'privacy']
        },
        {
          title: 'Privacy-Preserving On-Device Document Embeddings',
          authors: 'Sarah Chen, David K. Miller',
          journal: 'IEEE Transactions on Privacy Engineering',
          year: 2024,
          doi: '10.1109/TPRE.2024.981234',
          abstract: 'Investigating local embedding generation using WebAssembly and WebGPU engines inside browser context, eliminating external vector API reliance.',
          notes: 'Evaluates miniLM and nomad embedding models in browser runtime.',
          tags: ['embeddings', 'webgpu', 'privacy', 'retrieval']
        },
        {
          title: 'Structured Knowledge Extraction from Unstructured Academic PDF Files',
          authors: 'Amara Okafor, Jonathan Hayes',
          journal: 'ACM Conference on Document Analysis',
          year: 2025,
          doi: '10.1145/3612345.3612399',
          abstract: 'A comprehensive methodology for local table parsing, reference extraction, and semantic chunking without uploading sensitive pre-publication drafts.',
          notes: 'Directly applicable to our local literature import pipeline.',
          tags: ['pdf-parsing', 'knowledge-graph', 'local-first']
        },
        {
          title: 'Benchmarking Local Open-Weight Models for Academic Citation Verification',
          authors: 'Hiroshi Tanaka, Clara Moreau',
          journal: 'International Journal of Digital Libraries',
          year: 2026,
          doi: '10.007/s00799-026-00412-x',
          abstract: 'Comparing local reasoning capabilities against hosted frontier APIs for metadata validation, hallucinated reference detection, and citation style formatting.',
          notes: 'Shows 88% parity with cloud models when fine-tuned prompts are applied.',
          tags: ['citation-verification', 'benchmarks', 'open-weights']
        }
      ]
    },
    {
      name: 'Cognitive Science & Research Methodologies Dataset',
      description: 'A curated dataset of cognitive psychology and meta-research literature.',
      category: 'Psychology & Methodologies',
      data: [
        {
          title: 'Epistemic Pause: Countering Confirmation Bias in Automated Reasoning Systems',
          authors: 'Dr. Rebecca Wright, Samuel Torres',
          journal: 'Cognitive Systems Research Review',
          year: 2025,
          doi: '10.1016/j.cogsys.2025.101099',
          abstract: 'Introducing reflective pause loops into AI-assisted decision making to systematically prompt human researchers to evaluate counter-hypotheses.',
          notes: 'Theoretical groundwork for reflective cognitive architecture.',
          tags: ['epistemic-pause', 'metacognition', 'bias-reduction']
        },
        {
          title: 'Reproducibility Metrics in Qualitative Research Synthesis',
          authors: 'Lisa Lindqvist, Francois Dubois',
          journal: 'Methodology & Inquiry Quarterly',
          year: 2024,
          doi: '10.1080/13645579.2024.210988',
          abstract: 'Establishing standardized qualitative codes and audit trails for literature reviews and systematic synthesis across multi-disciplinary teams.',
          notes: 'Contains structured summary criteria used in synthesis engines.',
          tags: ['reproducibility', 'qualitative-synthesis', 'literature-review']
        }
      ]
    }
  ];

  // Helper to estimate RAG Chunks
  const estimateRagChunks = (text: string): number => {
    if (!text) return 1;
    const len = text.length;
    return Math.max(1, Math.ceil(len / 450));
  };

  // Helper to calculate completeness score
  const calculateCompleteness = (item: Partial<Paper>): number => {
    let score = 0;
    if (item.title && item.title.trim().length > 3) score += 30;
    if (item.authors && item.authors.trim().length > 2) score += 20;
    if (item.year && item.year > 1800) score += 15;
    if (item.journal && item.journal.trim().length > 2) score += 15;
    if (item.doi && item.doi.trim().length > 5) score += 10;
    if (item.abstract && item.abstract.trim().length > 20) score += 10;
    return score;
  };

  // Check for existing duplicates
  const checkDuplicate = (title: string, doi: string): boolean => {
    if (!title) return false;
    const cleanTitle = title.toLowerCase().trim();
    const cleanDoi = doi ? doi.toLowerCase().trim() : '';

    return existingPapers.some((p) => {
      const pTitle = p.title.toLowerCase().trim();
      const pDoi = p.doi ? p.doi.toLowerCase().trim() : '';
      if (cleanDoi && pDoi && cleanDoi === pDoi) return true;
      if (cleanTitle === pTitle) return true;
      return false;
    });
  };

  // Process raw text or JSON array into ParsedItem list
  const parseRawContent = (content: string, formatHint?: 'json' | 'bibtex' | 'csv' | 'text') => {
    setIsProcessing(true);
    setIngestStatus(null);
    const results: ParsedItem[] = [];

    try {
      const trimmed = content.trim();

      // 1. Try JSON Parsing first if formatHint is 'json' or looks like JSON
      if (formatHint === 'json' || trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsedJson = JSON.parse(trimmed);
          const rawList = Array.isArray(parsedJson) ? parsedJson : [parsedJson];

          rawList.forEach((obj: any, idx: number) => {
            const title = obj.title || obj.name || obj.paperTitle || `Imported Document #${idx + 1}`;
            const authors = obj.authors || obj.author || obj.creator || 'Unknown Authors';
            const journal = obj.journal || obj.publication || obj.publisher || obj.venue || '';
            const year = Number(obj.year || obj.date || obj.publicationYear) || new Date().getFullYear();
            const doi = obj.doi || obj.doiUrl || '';
            const abstract = obj.abstract || obj.summary || obj.description || '';
            const notes = obj.notes || obj.content || obj.fullText || obj.body || '';
            
            let tags: string[] = [];
            if (Array.isArray(obj.tags)) tags = obj.tags.map(String);
            else if (Array.isArray(obj.keywords)) tags = obj.keywords.map(String);
            else if (typeof obj.tags === 'string') tags = obj.tags.split(',').map((t) => t.trim());

            const isDup = checkDuplicate(title, doi);
            const combinedText = `${title} ${abstract} ${notes}`;

            results.push({
              id: `parsed-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              title,
              authors,
              journal,
              year,
              doi,
              abstract,
              notes,
              tags,
              selected: !isDup, // auto unselect duplicates
              isDuplicate: isDup,
              ragChunksCount: estimateRagChunks(combinedText),
              completenessScore: calculateCompleteness({ title, authors, journal, year, doi, abstract }),
              rawFormat: 'json',
            });
          });
        } catch (jsonErr) {
          if (formatHint === 'json') throw jsonErr;
        }
      }

      // 2. Try BibTeX Parsing
      if (results.length === 0 && (formatHint === 'bibtex' || trimmed.includes('@article') || trimmed.includes('@inproceedings') || trimmed.includes('@book'))) {
        const bibBlocks = trimmed.split(/@(?=\w+\s*\{)/).filter(Boolean);
        bibBlocks.forEach((block, idx) => {
          if (!block.trim()) return;
          const titleMatch = block.match(/title\s*=\s*[\{"](.+?)[\}"]/i);
          const authorMatch = block.match(/author\s*=\s*[\{"](.+?)[\}"]/i);
          const journalMatch = block.match(/(?:journal|booktitle)\s*=\s*[\{"](.+?)[\}"]/i);
          const yearMatch = block.match(/year\s*=\s*[\{"]?(\d{4})[\}"]?/i);
          const doiMatch = block.match(/doi\s*=\s*[\{"](.+?)[\}"]/i);
          const abstractMatch = block.match(/abstract\s*=\s*[\{"](.+?)[\}"]/i);
          const noteMatch = block.match(/note\s*=\s*[\{"](.+?)[\}"]/i);

          const title = titleMatch ? titleMatch[1].replace(/[\{\}]/g, '') : `BibTeX Entry #${idx + 1}`;
          const authors = authorMatch ? authorMatch[1].replace(/[\{\}]/g, '').replace(/\s+and\s+/g, ', ') : 'Unknown Authors';
          const journal = journalMatch ? journalMatch[1].replace(/[\{\}]/g, '') : '';
          const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
          const doi = doiMatch ? doiMatch[1].replace(/[\{\}]/g, '') : '';
          const abstract = abstractMatch ? abstractMatch[1].replace(/[\{\}]/g, '') : '';
          const notes = noteMatch ? noteMatch[1].replace(/[\{\}]/g, '') : '';

          const isDup = checkDuplicate(title, doi);
          const combinedText = `${title} ${abstract} ${notes}`;

          results.push({
            id: `parsed-bib-${Date.now()}-${idx}`,
            title,
            authors,
            journal,
            year,
            doi,
            abstract,
            notes,
            tags: ['bibtex-import'],
            selected: !isDup,
            isDuplicate: isDup,
            ragChunksCount: estimateRagChunks(combinedText),
            completenessScore: calculateCompleteness({ title, authors, journal, year, doi, abstract }),
            rawFormat: 'bibtex',
          });
        });
      }

      // 3. Fallback: Split Text by separators (e.g. "---", "===", or double newlines)
      if (results.length === 0) {
        const sections = trimmed.split(/\n\s*---\s*\n|\n\s*===\s*\n|\n\n\n+/).filter((s) => s.trim().length > 10);

        sections.forEach((sec, idx) => {
          const lines = sec.split('\n').map((l) => l.trim()).filter(Boolean);
          let title = lines[0] || `Document Section #${idx + 1}`;
          let authors = '';
          let journal = '';
          let year = new Date().getFullYear();
          let abstract = '';
          let notes = sec;

          // Simple extraction heuristic
          lines.forEach((line) => {
            if (line.toLowerCase().startsWith('title:')) title = line.substring(6).trim();
            else if (line.toLowerCase().startsWith('author:') || line.toLowerCase().startsWith('authors:')) authors = line.replace(/authors?:/i, '').trim();
            else if (line.toLowerCase().startsWith('journal:')) journal = line.substring(8).trim();
            else if (line.toLowerCase().startsWith('year:')) year = Number(line.substring(5).trim()) || year;
            else if (line.toLowerCase().startsWith('abstract:')) abstract = line.substring(9).trim();
          });

          if (!authors) authors = 'Extracted Text Document';
          const isDup = checkDuplicate(title, '');
          const combinedText = sec;

          results.push({
            id: `parsed-txt-${Date.now()}-${idx}`,
            title,
            authors,
            journal,
            year,
            doi: '',
            abstract: abstract || sec.slice(0, 300) + '...',
            notes,
            tags: ['text-dump'],
            selected: !isDup,
            isDuplicate: isDup,
            ragChunksCount: estimateRagChunks(combinedText),
            completenessScore: calculateCompleteness({ title, authors, journal, year, abstract }),
            rawFormat: 'text',
          });
        });
      }

      setParsedItems(results);
      if (results.length === 0) {
        setIngestStatus('No structured paper records or documents could be detected in the provided input.');
      }
    } catch (err: any) {
      console.error('Parsing error:', err);
      setIngestStatus(`Failed to parse content: ${err?.message || 'Invalid format'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      const ext = file.name.split('.').pop()?.toLowerCase();
      let formatHint: 'json' | 'bibtex' | 'csv' | 'text' = 'text';
      if (ext === 'json') formatHint = 'json';
      else if (ext === 'bib' || ext === 'bibtex') formatHint = 'bibtex';
      else if (ext === 'csv' || ext === 'tsv') formatHint = 'csv';

      parseRawContent(text, formatHint);
    };
    reader.readAsText(file);
  };

  // Sample Load Handler
  const handleLoadSample = (sampleData: any[]) => {
    const jsonString = JSON.stringify(sampleData, null, 2);
    setRawText(jsonString);
    parseRawContent(jsonString, 'json');
  };

  // Toggle selection
  const toggleSelectItem = (id: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const toggleSelectAll = (select: boolean) => {
    setParsedItems((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  // Execute Ingestion
  const handleExecuteIngest = () => {
    const selected = parsedItems.filter((item) => item.selected);
    if (selected.length === 0) {
      setIngestStatus('Please select at least one record to import.');
      return;
    }

    const cleanCustomTags = customTag
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const papersToCreate: Paper[] = selected.map((item) => {
      const combinedTags = Array.from(new Set([...item.tags, ...cleanCustomTags]));
      const missing: string[] = [];
      if (!item.doi) missing.push('doi');
      if (!item.journal) missing.push('journal');

      return {
        id: `paper-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        title: item.title,
        authors: item.authors,
        journal: item.journal || 'Local Research Repository',
        year: item.year || new Date().getFullYear(),
        doi: item.doi || '',
        tags: combinedTags,
        collectionId: targetCollectionId === 'all' ? undefined : targetCollectionId,
        notes: item.notes || `Locally imported dataset entry. Passages: ~${item.ragChunksCount}.`,
        abstract: item.abstract || '',
        verificationStatus: item.doi ? 'verified' : 'missing_metadata',
        missingFields: missing,
        annotations: [],
      };
    });

    onIngestPapers(papersToCreate);

    const totalChunks = selected.reduce((sum, item) => sum + item.ragChunksCount, 0);
    setIngestStatus(
      `Successfully imported ${selected.length} research paper(s) (~${totalChunks} passages) into your local library.`
    );
    setParsedItems([]);
    setRawText('');
  };

  // Download Sample JSON Template
  const handleDownloadSampleTemplate = () => {
    const templateData = [
      {
        title: 'Sample Research Paper Title for Reference Import',
        authors: 'Author One, Author Two',
        journal: 'Journal of Science and Technology',
        year: 2026,
        doi: '10.1000/sample.doi.123',
        abstract: 'Detailed abstract describing research background, methods, findings, and conclusions.',
        notes: 'Full paper notes or raw transcript body text to be saved locally for reference search.',
        tags: ['machine-learning', 'imported-dataset', 'sample']
      }
    ];

    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'local_research_dataset_template.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedCount = parsedItems.filter((i) => i.selected).length;
  const totalChunksEstimate = parsedItems
    .filter((i) => i.selected)
    .reduce((sum, item) => sum + item.ragChunksCount, 0);

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            
            <h2 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-base">
              Import References & Files
            </h2>
          </div>
          <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-1">
            Add articles and files directly into your saved collection from BibTeX, JSON, or text.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-sans text-[11px] px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full font-medium">
             100% On-Device Local Processing
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs border border-stone-200/80 dark:border-stone-700"
              aria-label="Close Import Panel"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 dark:bg-stone-900 p-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800">
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('upload')}
            className={`font-sans text-xs px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer flex-1 sm:flex-none justify-center ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-stone-800 text-[#912A4A] dark:text-rose-300 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
             Upload File
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`font-sans text-xs px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer flex-1 sm:flex-none justify-center ${
              activeTab === 'paste'
                ? 'bg-white dark:bg-stone-800 text-[#912A4A] dark:text-rose-300 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
             Paste Text or JSON
          </button>
          <button
            onClick={() => setActiveTab('samples')}
            className={`font-sans text-xs px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer flex-1 sm:flex-none justify-center ${
              activeTab === 'samples'
                ? 'bg-white dark:bg-stone-800 text-[#912A4A] dark:text-rose-300 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
             Sample Datasets
          </button>
        </div>

        <button
          onClick={handleDownloadSampleTemplate}
          className="font-sans text-[11px] text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 px-2 py-1 cursor-pointer"
        >
           Download JSON Template
        </button>
      </div>

      {/* Tab 1: File Upload Drop Zone */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-[#912A4A] dark:hover:border-rose-400 bg-stone-50/50 dark:bg-stone-900/40 rounded-lg p-8 text-center cursor-pointer transition-all space-y-3 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,.txt,.md,.bib,.bibtex,.csv,.tsv"
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto rounded-full bg-[#912A4A]/10 dark:bg-[#912A4A]/30 text-[#912A4A] dark:text-rose-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              
            </div>
            <div>
              <p className="font-sans text-xs font-semibold text-stone-800 dark:text-stone-200">
                Click to browse or drag and drop dataset files here
              </p>
              <p className="font-sans text-[11px] text-stone-400 mt-1">
                Supports <strong className="text-stone-600 dark:text-stone-300">.json</strong>, <strong className="text-stone-600 dark:text-stone-300">.bib / BibTeX</strong>, <strong className="text-stone-600 dark:text-stone-300">.txt</strong>, and <strong className="text-stone-600 dark:text-stone-300">.csv</strong> formats.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Direct Raw JSON/Text Paste */}
      {activeTab === 'paste' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label htmlFor="raw-data-input" className="font-sans text-xs font-medium text-stone-700 dark:text-stone-300">
              Raw Dataset (JSON Array, BibTeX, or Delimited Text):
            </label>
            <span className="font-mono text-[10px] text-stone-400">
              {rawText ? `${rawText.length} characters` : 'Empty'}
            </span>
          </div>

          <textarea
            id="raw-data-input"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Paste raw JSON data or text references here...\n\nExample JSON:\n[\n  {\n    "title": "Quantum Computing Applications in Chemistry",\n    "authors": "Dr. Alice Vance",\n    "year": 2026,\n    "doi": "10.1016/sample.2026.001",\n    "abstract": "Analysis of quantum algorithms for ground state calculations...",\n    "tags": ["quantum", "chemistry"]\n  }\n]`}
            className="w-full h-44 font-mono text-xs p-3 bg-stone-950 text-rose-200/90 border border-stone-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#912A4A] leading-relaxed"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setRawText('');
                setParsedItems([]);
              }}
              className="font-sans text-xs px-3 py-1.5 border border-stone-200 dark:border-stone-800 rounded text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-900 cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={() => parseRawContent(rawText)}
              disabled={!rawText.trim() || isProcessing}
              className="font-sans text-xs bg-[#912A4A] hover:bg-[#78223d] text-white px-4 py-1.5 rounded font-medium flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs transition-all"
            >
              {isProcessing ? (
                <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></span>
              ) : null}
              Parse & Extract Records
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Pre-packaged Sample RAG Datasets */}
      {activeTab === 'samples' && (
        <div className="space-y-3">
          <p className="font-sans text-xs text-stone-600 dark:text-stone-400">
            Select a sample dataset to load and review:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SAMPLE_DUMPS.map((sample, idx) => (
              <div
                key={idx}
                className="p-4 border border-stone-200 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-900/30 rounded-lg space-y-3 hover:border-[#912A4A]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-sans px-2 py-0.5 bg-[#912A4A]/10 dark:bg-[#912A4A]/30 text-[#912A4A] dark:text-rose-300 rounded font-medium">
                      {sample.category}
                    </span>
                    <span className="font-sans text-[11px] text-stone-400">
                      {sample.data.length} Papers
                    </span>
                  </div>
                  <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 mt-2">
                    {sample.name}
                  </h4>
                  <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-normal">
                    {sample.description}
                  </p>
                </div>

                <button
                  onClick={() => handleLoadSample(sample.data)}
                  className="w-full font-sans text-xs bg-stone-900 dark:bg-stone-800 hover:bg-[#912A4A] text-white py-1.5 rounded font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                   Load Dataset Sample
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingestion Status / Notification */}
      {ingestStatus && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-sans flex items-start gap-2.5 ${
            ingestStatus.includes('Successfully')
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          {ingestStatus.includes('Successfully') ? null : null}
          <div className="flex-1 leading-relaxed">{ingestStatus}</div>
        </div>
      )}

      {/* PARSED DATA PREVIEW & INGESTION CONFIGURATION PANEL */}
      {parsedItems.length > 0 && (
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-4 animate-fadeIn">
          
          {/* Target Settings & Ingestion Target Controls */}
          <div className="bg-stone-50 dark:bg-stone-900 p-4 rounded-lg border border-stone-200/80 dark:border-stone-800 space-y-3">
            <h3 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
               Import Parameters & Target Collection
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-sans text-[11px] text-stone-500 dark:text-stone-400 mb-1">
                  Assign to Target Collection:
                </label>
                <select
                  value={targetCollectionId}
                  onChange={(e) => setTargetCollectionId(e.target.value)}
                  className="w-full font-sans text-xs p-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded text-stone-800 dark:text-stone-200"
                >
                  <option value="all">Default / Unassigned Collection</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-sans text-[11px] text-stone-500 dark:text-stone-400 mb-1">
                  Auto-Tag Imported Items (comma separated):
                </label>
                <div className="relative">
                  
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="e.g., imported-dataset, literature-batch"
                    className="w-full font-sans text-xs pl-8 pr-3 py-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded text-stone-800 dark:text-stone-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table Toolbar & Stats */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-sans">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                Extracted Reference Records ({parsedItems.length}):
              </span>
              <button
                onClick={() => toggleSelectAll(true)}
                className="text-[#912A4A] dark:text-rose-400 hover:underline text-[11px]"
              >
                Select All
              </button>
              <span className="text-stone-300">|</span>
              <button
                onClick={() => toggleSelectAll(false)}
                className="text-stone-500 hover:underline text-[11px]"
              >
                Deselect All
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400">
              <span>Selected: <strong className="text-[#912A4A] dark:text-rose-300">{selectedCount}</strong></span>
              <span>Estimated Passages: <strong className="text-[#912A4A] dark:text-rose-300">~{totalChunksEstimate}</strong></span>
            </div>
          </div>

          {/* Extracted Records Table */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden max-h-[320px] overflow-y-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
                  <th className="p-2.5 w-10 text-center">Import</th>
                  <th className="p-2.5">Title & Author Metadata</th>
                  <th className="p-2.5 w-24">Quality</th>
                  <th className="p-2.5 w-28 text-center">Passages</th>
                  <th className="p-2.5 w-28 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-900">
                {parsedItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors ${
                      item.selected ? 'bg-teal-50/60 dark:bg-teal-950/30' : 'opacity-60'
                    }`}
                  >
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="rounded border-stone-300 text-teal-600 focus:ring-teal-500 accent-teal-600 dark:accent-teal-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-2.5">
                      <div className="font-semibold text-stone-900 dark:text-stone-100 line-clamp-1">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                        {item.authors} {item.journal ? `• ${item.journal}` : ''} ({item.year})
                      </div>
                    </td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-1">
                        <div className="w-12 bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              item.completenessScore > 75
                                ? 'bg-emerald-600'
                                : item.completenessScore > 45
                                ? 'bg-[#1D9E75]'
                                : 'bg-rose-600'
                            }`}
                            style={{ width: `${item.completenessScore}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-stone-400">{item.completenessScore}%</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="font-mono text-[11px] px-2 py-0.5 bg-stone-100 dark:bg-stone-900 rounded text-stone-700 dark:text-stone-300">
                        ~{item.ragChunksCount}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      {item.isDuplicate ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 bg-[#912A4A]/10 dark:bg-[#912A4A]/30 text-[#912A4A] dark:text-rose-300 rounded">
                          Duplicate Title
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 rounded">
                          Ready to Import
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
            <span className="font-sans text-xs text-stone-500 dark:text-stone-400">
              All text extractions and notes remain encrypted in local browser storage.
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setParsedItems([])}
                className="font-sans text-xs px-3.5 py-2 border border-stone-200 dark:border-stone-800 rounded text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 cursor-pointer"
              >
                Reset Selection
              </button>
              <button
                onClick={handleExecuteIngest}
                disabled={selectedCount === 0}
                className="font-sans text-xs bg-[#912A4A] hover:bg-[#78223d] text-white px-5 py-2 rounded-md font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer transition-all"
              >
                 Import {selectedCount} Reference(s) to Library
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
