/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ChevronsUpDown, 
  FileText, 
  Sparkles, 
  Copy, 
  Plus, 
  Quote, 
  BookOpen, 
  Upload, 
  Check, 
  SlidersHorizontal,
  Info,
  Scale,
  HelpCircle,
  BarChart3,
  TrendingUp,
  GitCompare,
  Layers,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Target,
  Compass,
  FileSpreadsheet,
  Search,
  Share2,
  Database
} from 'lucide-react';
import { Paper, EvidenceMap, ResearchQuestionAnalysis, PatternAndDataAnalysis, CriticalPartnerFeedback, LiteratureSynthesisResult } from '../types';
import { postWithAiRouting } from '../lib/localAiService';
import HorizontalDisclosureRow from './HorizontalDisclosureRow';
import { 
  DEFAULT_SYNTHESIS_DATA, 
  DEFAULT_EVIDENCE_MAP, 
  DEFAULT_QUESTION_DEV, 
  DEFAULT_DATA_ANALYSIS, 
  DEFAULT_CRITICAL_FEEDBACK 
} from '../data';

const RELATIONSHIP_TYPES = [
  { id: 'all', label: 'All' },
  { id: 'supports', label: 'Supports' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'extends', label: 'Extends' },
  { id: 'applies', label: 'Applies' },
  { id: 'contrasts', label: 'Contrasts' },
] as const;

const normalizeRelType = (t: string): 'supports' | 'challenges' | 'extends' | 'applies' | 'contrasts' | 'other' => {
  const low = (t || '').toLowerCase().trim();
  if (low.includes('support')) return 'supports';
  if (low.includes('challenge') || low.includes('critic') || low.includes('oppose') || low.includes('contradict')) return 'challenges';
  if (low.includes('extend') || low.includes('build') || low.includes('expand')) return 'extends';
  if (low.includes('appl') || low.includes('adopt') || low.includes('use') || low.includes('employ')) return 'applies';
  if (low.includes('contrast') || low.includes('differ') || low.includes('diverg') || low.includes('vs')) return 'contrasts';
  return 'other';
};

const formatRelTypeSentenceCase = (t: string): string => {
  const norm = normalizeRelType(t);
  switch (norm) {
    case 'supports': return 'Supports';
    case 'challenges': return 'Challenges';
    case 'extends': return 'Extends';
    case 'applies': return 'Applies';
    case 'contrasts': return 'Contrasts';
    default:
      if (!t) return 'Related';
      return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  }
};

interface ResearchIntelligenceLayerProps {
  papers: Paper[];
  onUpdatePaper?: (updated: Paper) => void;
  onAddPaper?: (paper: Paper) => void;
  onInsertIntoDraft?: (text: string) => void;
}

export default function ResearchIntelligenceLayer({
  papers,
  onUpdatePaper,
  onAddPaper,
  onInsertIntoDraft,
}: ResearchIntelligenceLayerProps) {
  const [activeTab, setActiveTab] = useState<'synthesis' | 'evidence_map' | 'question_dev' | 'pattern_data' | 'critical_partner'>('synthesis');

  // 1. Literature Synthesis & Upload Collection state
  const [customUploadedPapers, setCustomUploadedPapers] = useState<Paper[]>([]);
  const allCorpusPapers = [...papers, ...customUploadedPapers];
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>(allCorpusPapers.map(p => p.id));
  const [expandedCorpusIds, setExpandedCorpusIds] = useState<Record<string, boolean>>({});
  const [loadingSynthesis, setLoadingSynthesis] = useState(false);
  const [synthesisOutput, setSynthesisOutput] = useState<LiteratureSynthesisResult | null>(DEFAULT_SYNTHESIS_DATA);
  const [synthesisSubTab, setSynthesisSubTab] = useState<'overview' | 'themes_concepts' | 'theories_methods' | 'relationships' | 'schools_of_thought'>('overview');

  const toggleCorpusExpand = (id: string) => {
    setExpandedCorpusIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAllCorpusExpand = () => {
    const allExpanded = allCorpusPapers.length > 0 && allCorpusPapers.every(p => expandedCorpusIds[p.id]);
    const newState: Record<string, boolean> = {};
    allCorpusPapers.forEach(p => {
      newState[p.id] = !allExpanded;
    });
    setExpandedCorpusIds(newState);
  };

  // Collection Upload Modal/Box state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploadMode, setUploadMode] = useState<'json' | 'bibtex' | 'raw_text'>('json');
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');

  // Relationship Map state
  const [relationshipFilter, setRelationshipFilter] = useState<string>('all');

  // 2. Evidence Map state
  const [evidenceQuestion, setEvidenceQuestion] = useState('How does cognitive load impact research decision-making under time pressure?');
  const [evidenceQueryFilter, setEvidenceQueryFilter] = useState('');
  const [loadingEvidenceMap, setLoadingEvidenceMap] = useState(false);
  const [evidenceMapResult, setEvidenceMapResult] = useState<EvidenceMap | null>(DEFAULT_EVIDENCE_MAP);
  const [evidenceSubTab, setEvidenceSubTab] = useState<'overview' | 'supporting_opposing' | 'consensus_disagreement' | 'gaps_questions'>('overview');

  // 3. Research Question Dev state
  const [topicInput, setTopicInput] = useState('Interdisciplinary research collaboration in academic institutions');
  const [contextInput, setContextInput] = useState('Focusing on early-career researchers and non-traditional publication incentives');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionDevResult, setQuestionDevResult] = useState<ResearchQuestionAnalysis | null>(DEFAULT_QUESTION_DEV);
  const [questionSubTab, setQuestionSubTab] = useState<'refined_questions' | 'feasibility_scope' | 'overlooked_perspectives' | 'alternative_angles'>('refined_questions');

  // 4. Pattern & Data Analysis state
  const [dataInputType, setDataInputType] = useState<'csv' | 'corpus'>('csv');
  const [csvText, setCsvText] = useState(`Year,PublicationCategory,SampleCount,EffectSize,Methodology,Region
2020,Qualitative Study,45,0.42,Semi-structured Interviews,Europe
2021,Quantitative Trial,320,0.68,Randomized Control,North America
2022,Mixed Methods,112,0.55,Survey & Ethnography,Asia-Pacific
2023,Meta-Analysis,1400,0.71,Systematic Review,Global
2024,Qualitative Study,60,0.38,Focus Groups,Latin America`);
  const [datasetName, setDatasetName] = useState('Research Methodology & Effect Size Sample');
  const [loadingDataAnalysis, setLoadingDataAnalysis] = useState(false);
  const [dataAnalysisResult, setDataAnalysisResult] = useState<PatternAndDataAnalysis | null>(DEFAULT_DATA_ANALYSIS);
  const [dataSubTab, setDataSubTab] = useState<'overview' | 'charts_distributions' | 'correlations' | 'anomalies'>('overview');

  // 5. Critical Partner Mode state
  const [hypothesisInput, setHypothesisInput] = useState('Open-access publication policies directly cause higher citation rates regardless of institutional reputation.');
  const [criticalContext, setCriticalContext] = useState('Analysing European funding council mandates from 2018-2024.');
  const [loadingCriticalPartner, setLoadingCriticalPartner] = useState(false);
  const [criticalResult, setCriticalResult] = useState<CriticalPartnerFeedback | null>(DEFAULT_CRITICAL_FEEDBACK);
  const [criticalSubTab, setCriticalSubTab] = useState<'overview' | 'second_thought' | 'assumptions_counter' | 'reframing'>('overview');

  // --- Handlers ---

  const handleTogglePaper = (id: string) => {
    setSelectedPaperIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAllPapers = () => {
    if (selectedPaperIds.length === allCorpusPapers.length) {
      setSelectedPaperIds([]);
    } else {
      setSelectedPaperIds(allCorpusPapers.map(p => p.id));
    }
  };

  const handleRunLiteratureSynthesis = async () => {
    if (selectedPaperIds.length === 0) return;
    setLoadingSynthesis(true);
    try {
      const selectedPapers = allCorpusPapers.filter(p => selectedPaperIds.includes(p.id));
      const res = await postWithAiRouting('/api/gemini/connect-literature', { papers: selectedPapers });
      if (res.ok) {
        const data = await res.json();
        setSynthesisOutput(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSynthesis(false);
    }
  };

  const handleParseAndAddCollection = (content: string) => {
    try {
      let parsedPapers: Paper[] = [];
      if (uploadMode === 'json' || content.trim().startsWith('[') || content.trim().startsWith('{')) {
        const rawObj = JSON.parse(content);
        const itemsArr = Array.isArray(rawObj) ? rawObj : (rawObj.papers || rawObj.collection || [rawObj]);
        parsedPapers = itemsArr.map((item: any, idx: number) => ({
          id: `uploaded-${Date.now()}-${idx}`,
          title: item.title || item.name || `Uploaded Document ${idx + 1}`,
          authors: item.authors || item.author || 'Uploaded Author',
          journal: item.journal || item.publisher || 'Uploaded Collection',
          year: Number(item.year || item.publicationYear || new Date().getFullYear()),
          doi: item.doi || `10.1000/uploaded-${Date.now()}-${idx}`,
          notes: item.notes || item.summary || 'Uploaded document from collection.',
          abstract: item.abstract || item.notes || item.summary || item.content || 'Uploaded corpus document item',
          verificationStatus: 'verified' as const,
          missingFields: [],
          annotations: [],
          tags: item.tags || ['uploaded_collection'],
          structuredSummary: item.structuredSummary || {
            researchQuestion: item.researchQuestion || item.problem || '',
            methods: item.methods || item.methodology || '',
            participants: item.participants || item.sample || '',
            findings: item.findings || item.results || '',
            limitations: item.limitations || item.boundaries || '',
            evidenceExplanation: item.evidenceExplanation || '',
            keyQuotations: item.keyQuotations || [],
            futureResearch: item.futureResearch || '',
          }
        }));
      } else {
        const entries = content.split(/\n\s*\n/).filter(e => e.trim().length > 0);
        parsedPapers = entries.map((entry, idx) => {
          const lines = entry.trim().split('\n');
          const titleLine = lines[0] || `Article ${idx + 1}`;
          const bodyLines = lines.slice(1).join(' ').trim();
          return {
            id: `uploaded-${Date.now()}-${idx}`,
            title: titleLine.replace(/^#*\s*/, ''),
            authors: 'Uploaded Corpus Author',
            journal: 'Document Collection',
            year: new Date().getFullYear(),
            doi: `10.1000/uploaded-${Date.now()}-${idx}`,
            notes: bodyLines || 'Imported plain text record.',
            abstract: bodyLines || titleLine,
            verificationStatus: 'verified' as const,
            missingFields: [],
            annotations: [],
            tags: ['uploaded_collection']
          };
        });
      }

      if (parsedPapers.length > 0) {
        setCustomUploadedPapers(prev => [...prev, ...parsedPapers]);
        setSelectedPaperIds(prev => [...prev, ...parsedPapers.map(p => p.id)]);
        setUploadStatusMsg(`Successfully added ${parsedPapers.length} articles to collection.`);
        setUploadText('');
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadStatusMsg('');
        }, 1200);
      }
    } catch (err: any) {
      setUploadStatusMsg(`Parsing error: ${err.message}`);
    }
  };

  const handleFileUploadCollection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          handleParseAndAddCollection(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleGenerateEvidenceMap = async (customQuestion?: string) => {
    const q = customQuestion || evidenceQuestion;
    if (!q.trim()) return;
    setLoadingEvidenceMap(true);
    try {
      const res = await postWithAiRouting('/api/gemini/research-intelligence/evidence-map', {
        researchQuestion: q,
        papers: allCorpusPapers,
      });
      if (res.ok) {
        const data = await res.json();
        setEvidenceMapResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEvidenceMap(false);
    }
  };

  const handleRunQuestionDevelopment = async () => {
    if (!topicInput.trim()) return;
    setLoadingQuestions(true);
    try {
      const res = await postWithAiRouting('/api/gemini/research-intelligence/question-dev', {
        topic: topicInput,
        context: contextInput,
      });
      if (res.ok) {
        const data = await res.json();
        setQuestionDevResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleRunDataAnalysis = async () => {
    setLoadingDataAnalysis(true);
    try {
      const corpusText = allCorpusPapers
        .map(p => `${p.title} (${p.authors}, ${p.year}): ${p.abstract || p.notes || ''}`)
        .join('\n\n');

      const res = await postWithAiRouting('/api/gemini/research-intelligence/pattern-analysis', {
        datasetName: datasetName,
        csvContent: dataInputType === 'csv' ? csvText : undefined,
        literatureSummary: dataInputType === 'corpus' ? corpusText : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        setDataAnalysisResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDataAnalysis(false);
    }
  };

  const handleRunCriticalPartner = async () => {
    if (!hypothesisInput.trim()) return;
    setLoadingCriticalPartner(true);
    try {
      const res = await postWithAiRouting('/api/gemini/research-intelligence/critical-partner', {
        statementOrClaim: hypothesisInput,
        researchContext: criticalContext,
      });
      if (res.ok) {
        const data = await res.json();
        setCriticalResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCriticalPartner(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setCsvText(text);
          setDatasetName(file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6" id="research-intelligence-layer">
      {/* Main Mode Navigation Tabs - Unboxed on cream background */}
      <div className="flex items-center gap-6 border-b border-stone-200/80 dark:border-stone-800 pb-px text-xs font-medium" role="tablist">
        {[
          { id: 'synthesis', label: 'Find Main Themes', title: 'Summarize major themes and topics across all your saved articles' },
          { id: 'evidence_map', label: 'Map Your Evidence', title: 'Compare supporting facts and opposing viewpoints for any question' },
          { id: 'question_dev', label: 'Build Good Questions', title: 'Turn broad topics into clear, specific research questions' },
          { id: 'pattern_data', label: 'Spot Data Patterns', title: 'Analyze numbers and data tables to find trends' },
          { id: 'critical_partner', label: 'Test Your Ideas', title: 'Check your assumptions and claims against potential weak points' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            title={tab.title}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ----------------- TAB 1: LITERATURE ANALYSIS & SYNTHESIS ----------------- */}
      {activeTab === 'synthesis' && (
        <div className="space-y-0 animate-fadeIn">
          {/* Upload Collection Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-6 max-w-xl w-full shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-900 pb-3">
                  <h3 className="font-sans font-bold text-sm text-stone-900 dark:text-stone-100">
                    Upload Paper Collection
                  </h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-stone-400 hover:text-stone-600 text-xs px-2 py-1 rounded cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>

                <p className="font-sans text-xs text-stone-500 leading-relaxed">
                  Upload or paste a collection of academic papers, book chapters, or references in JSON, BibTeX, CSV, or raw text format.
                </p>

                <div className="flex gap-2 text-xs font-sans">
                  <button
                    onClick={() => setUploadMode('json')}
                    className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                      uploadMode === 'json'
                        ? 'bg-[#912A4A] text-white font-semibold'
                        : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    JSON / Array
                  </button>
                  <button
                    onClick={() => setUploadMode('bibtex')}
                    className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                      uploadMode === 'bibtex'
                        ? 'bg-[#912A4A] text-white font-semibold'
                        : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    BibTeX (.bib)
                  </button>
                  <button
                    onClick={() => setUploadMode('raw_text')}
                    className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                      uploadMode === 'raw_text'
                        ? 'bg-[#912A4A] text-white font-semibold'
                        : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Raw Abstracts / Text
                  </button>
                </div>

                <div className="border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-lg p-4 text-center hover:bg-stone-50/50 dark:hover:bg-stone-900/30 transition-colors">
                  <input
                    type="file"
                    accept=".json,.bib,.csv,.txt"
                    onChange={handleFileUploadCollection}
                    className="hidden"
                    id="paper-collection-file"
                  />
                  <label htmlFor="paper-collection-file" className="cursor-pointer block space-y-1">
                    <span className="font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                      Click to choose collection file
                    </span>
                    <span className="font-sans text-[11px] text-stone-400 block">
                      Supports .json, .bib, .csv, or .txt files
                    </span>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="font-sans text-xs font-medium text-stone-700 dark:text-stone-300">
                    Or paste collection content directly:
                  </label>
                  <textarea
                    value={uploadText}
                    onChange={(e) => setUploadText(e.target.value)}
                    rows={5}
                    placeholder={
                      uploadMode === 'json'
                        ? '[{"title": "Paper Title", "authors": "Smith et al.", "year": 2023, "abstract": "Study on..."}]'
                        : uploadMode === 'bibtex'
                        ? '@article{smith2023, title={Paper Title}, author={Smith, J.}, year={2023}, abstract={...}}'
                        : 'Paste paper titles, abstracts, or notes separated by double linebreaks...'
                    }
                    className="w-full font-mono text-[11px] p-3 border border-stone-200 dark:border-stone-800 rounded bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#912A4A]"
                  />
                </div>

                {uploadStatusMsg && (
                  <p className="font-sans text-xs font-medium text-[#912A4A] dark:text-rose-400">
                    {uploadStatusMsg}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-900">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="font-sans text-xs px-4 py-2 rounded bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleParseAndAddCollection(uploadText)}
                    disabled={!uploadText.trim()}
                    className="font-sans text-xs px-4 py-2 rounded bg-[#912A4A] text-white hover:bg-[#78223d] disabled:opacity-50 cursor-pointer font-semibold"
                  >
                    Parse & Add to Collection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Top Section: Selected Articles & Collection Setup - Unboxed on cream background */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/70 dark:border-stone-800/80 pb-3">
              <div>
                <h3 className="font-sans font-semibold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#912A4A] dark:text-rose-400" />
                  <span>Selected Articles ({selectedPaperIds.length}/{allCorpusPapers.length})</span>
                </h3>
                <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                  Sorted alphabetically (A–Z) with horizontal progressive disclosure.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunLiteratureSynthesis}
                  disabled={loadingSynthesis || selectedPaperIds.length === 0}
                  className="font-sans text-xs font-semibold bg-[#912A4A] text-white px-5 py-2 rounded-xl hover:bg-[#78223d] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                  <span>{loadingSynthesis ? 'Finding Themes...' : 'Find Big Themes'}</span>
                </button>
              </div>
            </div>

            {/* Action Toolbar & Expand/Collapse Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="font-sans text-xs bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-medium"
                >
                  <Upload className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
                  <span>Upload Collection</span>
                </button>

                <button
                  onClick={handleSelectAllPapers}
                  className="font-sans text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:underline px-2.5 py-1.5 cursor-pointer font-medium"
                >
                  {selectedPaperIds.length === allCorpusPapers.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="flex items-center gap-3 text-stone-500">
                <span className="text-xs">{selectedPaperIds.length} of {allCorpusPapers.length} selected</span>
                {allCorpusPapers.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAllCorpusExpand}
                    className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <ChevronsUpDown className="w-3.5 h-3.5" />
                    <span>
                      {allCorpusPapers.every(p => expandedCorpusIds[p.id]) ? 'Collapse all summaries' : 'Expand all summaries'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Papers List in Full Horizontal Layout with Progressive Disclosure (Alphabetical Order A-Z) */}
            <div className="space-y-1">
              {[...allCorpusPapers]
                .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
                .map((p) => {
                  const isCustom = customUploadedPapers.some(cp => cp.id === p.id);
                  const isExpanded = !!expandedCorpusIds[p.id];
                  const isSelected = selectedPaperIds.includes(p.id);

                  const keywordsList = [
                    `${p.authors || 'Unknown Author'} (${p.year || 'n.d.'})`,
                    p.journal ? p.journal : null,
                    isCustom ? 'Uploaded' : null,
                    ...(p.tags || [])
                  ].filter(Boolean) as string[];

                  return (
                    <HorizontalDisclosureRow
                      key={p.id}
                      id={`paper-item-${p.id}`}
                      isExpanded={isExpanded}
                      onToggle={() => toggleCorpusExpand(p.id)}
                      prefix={
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTogglePaper(p.id)}
                          className="w-4 h-4 rounded text-[#1D9E75] focus:ring-[#1D9E75] accent-[#1D9E75] dark:accent-[#28c093] cursor-pointer"
                          id={`select-corpus-paper-${p.id}`}
                        />
                      }
                      title={
                        <span className={isSelected ? 'text-stone-900 dark:text-stone-100 font-semibold' : 'text-stone-700 dark:text-stone-300'}>
                          {p.title}
                        </span>
                      }
                      keywords={keywordsList}
                      summary={
                        p.abstract ? (
                          <div className="space-y-1">
                            <p className="font-sans text-xs text-stone-700 dark:text-stone-300 leading-relaxed italic">
                              "{p.abstract}"
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-stone-400 italic">No abstract text available for this item.</p>
                        )
                      }
                      children={
                        p.structuredSummary && (
                          <div className="space-y-2 pt-1">
                            {p.structuredSummary.researchQuestion && (
                              <div className="pl-3 border-l-2 border-[#1B0A3B]/40 space-y-0.5">
                                <span className="text-[11px] font-semibold text-stone-800 dark:text-stone-200 block">Research aim:</span>
                                <p className="text-xs text-stone-600 dark:text-stone-400">{p.structuredSummary.researchQuestion}</p>
                              </div>
                            )}
                            {p.structuredSummary.findings && (
                              <div className="pl-3 border-l-2 border-emerald-600/60 space-y-0.5">
                                <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 block">Core findings:</span>
                                <p className="text-xs text-stone-600 dark:text-stone-400">{p.structuredSummary.findings}</p>
                              </div>
                            )}
                            {p.structuredSummary.limitations && (
                              <div className="pl-3 border-l-2 border-amber-500/60 space-y-0.5">
                                <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 block">Limitations:</span>
                                <p className="text-xs text-stone-600 dark:text-stone-400">{p.structuredSummary.limitations}</p>
                              </div>
                            )}
                          </div>
                        )
                      }
                      actions={
                        <>
                          {onInsertIntoDraft && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const authorFirst = (p.authors || 'Author').split(',')[0].trim();
                                onInsertIntoDraft(`(${authorFirst} et al., ${p.year})`);
                              }}
                              className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Insert citation in draft</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const citation = `${p.authors || 'Author'} (${p.year || 'n.d.'}). "${p.title}". ${p.journal || ''}`;
                              navigator.clipboard.writeText(citation);
                            }}
                            className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 ml-auto cursor-pointer"
                            title="Copy citation"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy citation</span>
                          </button>
                        </>
                      }
                    />
                  );
                })}
            </div>
          </div>

          {/* Burgundy Divider Line: Exactly 24pts of whitespace above and below */}
          <div
            className="w-full block"
            style={{
              height: '2px',
              backgroundColor: '#912A4A',
              marginTop: '24pt',
              marginBottom: '24pt',
            }}
            id="synthesis-burgundy-divider"
          />

          {/* Bottom Section: Themes Generated & Synthesis Output - Unboxed on cream background */}
          <div>
            {loadingSynthesis ? (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-6 h-6 border-2 border-[#912A4A] border-t-transparent rounded-full animate-spin"></div>
                <p className="font-sans text-xs text-stone-500 italic">
                  Looking for main themes, key ideas, and connections across your articles...
                </p>
              </div>
            ) : synthesisOutput ? (
              <div className="space-y-4">
                {/* Synthesis Sub-tabs navigation */}
                <div className="flex items-center gap-6 border-b border-stone-200/80 dark:border-stone-800 pb-px text-xs font-medium" role="tablist">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'themes_concepts', label: `Themes & Concepts (${synthesisOutput.majorThemes?.length || 0})` },
                    { id: 'theories_methods', label: 'Theories & Methods' },
                    { id: 'relationships', label: `Mapped Relationships (${synthesisOutput.mappedRelationships?.length || 0})` },
                    { id: 'schools_of_thought', label: 'Schools of Thought' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setSynthesisSubTab(st.id as any)}
                      className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                        synthesisSubTab === st.id
                          ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold'
                          : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                      }`}
                    >
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>

                {/* 1. OVERVIEW SUB-TAB */}
                {synthesisSubTab === 'overview' && (
                  <div className="space-y-2">
                    <HorizontalDisclosureRow
                      title="Established Findings & Core Consensus"
                      keywords={['Consensus', 'Cross-Study Synthesis', `${allCorpusPapers.length} Corpus Papers`]}
                      summary={synthesisOutput.agreements || 'Consensus exists regarding core empirical methodology and underlying theoretical framework.'}
                      defaultExpanded={true}
                      children={
                        synthesisOutput.establishedFindings && synthesisOutput.establishedFindings.length > 0 ? (
                          <ul className="space-y-1 pl-2">
                            {synthesisOutput.establishedFindings.map((finding, idx) => (
                              <li key={idx} className="font-sans text-xs text-stone-700 dark:text-stone-300 flex items-start gap-1.5">
                                <span className="text-emerald-700 font-bold">•</span> {finding}
                              </li>
                            ))}
                          </ul>
                        ) : null
                      }
                      actions={
                        onInsertIntoDraft && (
                          <button
                            type="button"
                            onClick={() => onInsertIntoDraft(synthesisOutput.agreements || '')}
                            className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Insert consensus summary into draft</span>
                          </button>
                        )
                      }
                    />

                    <HorizontalDisclosureRow
                      title="Emerging Debates & Epistemic Divergences"
                      keywords={['Debate', 'Contested Hypotheses', 'Boundary Conditions']}
                      summary={synthesisOutput.disagreements || 'Divergences exist regarding measurement metrics, context, and sample populations.'}
                      defaultExpanded={true}
                      children={
                        synthesisOutput.emergingDebates && synthesisOutput.emergingDebates.length > 0 ? (
                          <ul className="space-y-1 pl-2">
                            {synthesisOutput.emergingDebates.map((debate, idx) => (
                              <li key={idx} className="font-sans text-xs text-stone-700 dark:text-stone-300 flex items-start gap-1.5">
                                <span className="text-amber-700 font-bold">•</span> {debate}
                              </li>
                            ))}
                          </ul>
                        ) : null
                      }
                      actions={
                        onInsertIntoDraft && (
                          <button
                            type="button"
                            onClick={() => onInsertIntoDraft(synthesisOutput.disagreements || '')}
                            className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Insert debates summary into draft</span>
                          </button>
                        )
                      }
                    />

                    {synthesisOutput.unresolvedQuestions && synthesisOutput.unresolvedQuestions.length > 0 && (
                      <HorizontalDisclosureRow
                        title="Unresolved Questions"
                        keywords={['Open Questions', 'Research Horizons', 'Future Work']}
                        summary="These questions remain active across the literature corpus and offer opportunities for primary investigation."
                        defaultExpanded={true}
                        children={
                          <ul className="space-y-2.5 pl-2">
                            {synthesisOutput.unresolvedQuestions.map((q, idx) => (
                              <li key={idx} className="font-sans text-xs text-stone-700 dark:text-stone-300 flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="text-[#912A4A] dark:text-rose-400 font-bold shrink-0">•</span>
                                  <span className="font-sans font-normal text-stone-800 dark:text-stone-200 leading-relaxed">
                                    {q}
                                  </span>
                                </div>
                                {onInsertIntoDraft && (
                                  <button
                                    type="button"
                                    onClick={() => onInsertIntoDraft(`Research Question: ${q}`)}
                                    className="text-[11px] text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer shrink-0"
                                    title="Insert question into draft"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Insert</span>
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        }
                        actions={
                          onInsertIntoDraft && (
                            <button
                              type="button"
                              onClick={() =>
                                onInsertIntoDraft(
                                  `Unresolved Research Questions:\n` +
                                    synthesisOutput.unresolvedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')
                                )
                              }
                              className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Insert questions into draft</span>
                            </button>
                          )
                        }
                      />
                    )}
                  </div>
                )}

                {/* 2. MAJOR THEMES & CORE CONCEPTS SUB-TAB */}
                {synthesisSubTab === 'themes_concepts' && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <h4 className="font-sans font-semibold text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                        Identified Major Themes
                      </h4>
                      {synthesisOutput.majorThemes?.map((theme, idx) => (
                        <HorizontalDisclosureRow
                          key={idx}
                          title={theme.name}
                          keywords={[
                            `Theme ${idx + 1}`,
                            theme.linkedPapers ? `${theme.linkedPapers.length} papers linked` : null,
                            ...(theme.keyConcepts?.map(c => `#${c}`) || [])
                          ].filter(Boolean) as string[]}
                          summary={theme.description}
                          defaultExpanded={idx === 0}
                          actions={
                            onInsertIntoDraft && (
                              <button
                                type="button"
                                onClick={() => onInsertIntoDraft(`${theme.name}: ${theme.description}`)}
                                className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Insert theme summary into draft</span>
                              </button>
                            )
                          }
                        />
                      ))}
                    </div>

                    <div className="space-y-2 pt-3 border-t border-stone-200/60 dark:border-stone-800">
                      <h4 className="font-sans font-semibold text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                        Core Concepts & Definitions
                      </h4>
                      {synthesisOutput.coreConcepts?.map((c, idx) => (
                        <HorizontalDisclosureRow
                          key={idx}
                          title={c.concept}
                          keywords={['Core Concept', 'Definition']}
                          summary={c.definition}
                          defaultExpanded={false}
                          children={
                            <p className="font-sans text-xs text-stone-500 leading-snug">
                              <strong>Usage in Literature:</strong> {c.usageInLiterature}
                            </p>
                          }
                          actions={
                            onInsertIntoDraft && (
                              <button
                                type="button"
                                onClick={() => onInsertIntoDraft(`${c.concept} is defined as ${c.definition}`)}
                                className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Insert concept definition into draft</span>
                              </button>
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. THEORIES & METHODOLOGIES SUB-TAB */}
                {synthesisSubTab === 'theories_methods' && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <h4 className="font-sans font-semibold text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                        Theoretical Frameworks
                      </h4>
                      {synthesisOutput.underlyingTheories?.map((t, idx) => (
                        <HorizontalDisclosureRow
                          key={idx}
                          title={t.theoryName}
                          keywords={[
                            'Theoretical Framework',
                            t.keyProponents ? `Proponents: ${t.keyProponents}` : null,
                            t.applicationContext ? `Context: ${t.applicationContext}` : null
                          ].filter(Boolean) as string[]}
                          summary={t.corePremise}
                          defaultExpanded={idx === 0}
                          actions={
                            onInsertIntoDraft && (
                              <button
                                type="button"
                                onClick={() => onInsertIntoDraft(`Under the framework of ${t.theoryName} (${t.keyProponents}), ${t.corePremise}`)}
                                className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Insert framework into draft</span>
                              </button>
                            )
                          }
                        />
                      ))}
                    </div>

                    <div className="space-y-2 pt-3 border-t border-stone-200/60 dark:border-stone-800">
                      <h4 className="font-sans font-semibold text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                        Methodologies Employed
                      </h4>
                      {synthesisOutput.methodologiesUsed?.map((m, idx) => (
                        <HorizontalDisclosureRow
                          key={idx}
                          title={m.methodologyName}
                          keywords={[m.type, 'Methodology']}
                          summary={m.description}
                          defaultExpanded={false}
                          children={
                            <div className="space-y-1 text-xs">
                              <p className="text-emerald-900 dark:text-emerald-300">
                                <strong>Strengths:</strong> {m.strengths}
                              </p>
                              <p className="text-amber-900 dark:text-amber-300">
                                <strong>Limitations:</strong> {m.limitations}
                              </p>
                            </div>
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. MAPPED RELATIONSHIPS SUB-TAB */}
                {synthesisSubTab === 'relationships' && (
                  <div className="space-y-4">
                    {/* Relationship Filters */}
                    <div className="flex flex-wrap gap-1.5 text-xs font-sans pb-1">
                      {RELATIONSHIP_TYPES.map((type) => {
                        const count = type.id === 'all'
                          ? (synthesisOutput.mappedRelationships?.length || 0)
                          : (synthesisOutput.mappedRelationships?.filter(
                              (rel) => normalizeRelType(rel.relationshipType) === type.id
                            ).length || 0);

                        const isActive = relationshipFilter === type.id;

                        return (
                          <button
                            key={type.id}
                            onClick={() => setRelationshipFilter(type.id)}
                            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                              isActive
                                ? 'bg-[#912A4A] text-white font-medium shadow-xs'
                                : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                            }`}
                          >
                            <span>{type.label}</span>
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded opacity-80">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-1">
                      {(() => {
                        const filtered = synthesisOutput.mappedRelationships?.filter((rel) => {
                          if (relationshipFilter === 'all') return true;
                          return normalizeRelType(rel.relationshipType) === relationshipFilter;
                        }) || [];

                        if (filtered.length === 0) {
                          return (
                            <p className="text-xs text-stone-500 italic py-4">
                              No mapped connections found under this filter.
                            </p>
                          );
                        }

                        return filtered.map((rel, idx) => (
                          <HorizontalDisclosureRow
                            key={idx}
                            title={`${rel.source} → ${rel.target}`}
                            keywords={[formatRelTypeSentenceCase(rel.relationshipType), `Source: ${rel.source}`, `Target: ${rel.target}`]}
                            summary={rel.explanation}
                            defaultExpanded={idx < 2}
                            actions={
                              onInsertIntoDraft && (
                                <button
                                  type="button"
                                  onClick={() => onInsertIntoDraft(`${rel.source} ${rel.relationshipType.toLowerCase()} ${rel.target}: ${rel.explanation}`)}
                                  className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Insert relationship into draft</span>
                                </button>
                              )
                            }
                          />
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* 5. SCHOOLS OF THOUGHT SUB-TAB */}
                {synthesisSubTab === 'schools_of_thought' && (
                  <div className="space-y-2">
                    {synthesisOutput.schoolsOfThought?.map((school, idx) => (
                      <HorizontalDisclosureRow
                        key={idx}
                        title={school.schoolName}
                        keywords={[
                          `Perspective ${idx + 1}`,
                          school.keyAuthors ? `Authors: ${school.keyAuthors}` : null
                        ].filter(Boolean) as string[]}
                        summary={school.coreTenet}
                        defaultExpanded={idx === 0}
                        children={
                          <p className="font-sans text-xs text-stone-500 leading-relaxed">
                            <strong>Distinguishing Assumptions:</strong> {school.distinguishingAssumptions}
                          </p>
                        }
                        actions={
                          onInsertIntoDraft && (
                            <button
                              type="button"
                              onClick={() => onInsertIntoDraft(`From the perspective of ${school.schoolName} (${school.keyAuthors}), ${school.coreTenet}`)}
                              className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Insert perspective into draft</span>
                            </button>
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">No themes generated yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: EVIDENCE MAPPING ----------------- */}
      {activeTab === 'evidence_map' && (
        <div className="space-y-0 animate-fadeIn">
          {/* Question & Query Bar - Unboxed on cream background */}
          <div className="space-y-3">
            <h3 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#912A4A]" />
              <span>Main research question to map evidence</span>
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={evidenceQuestion}
                onChange={(e) => setEvidenceQuestion(e.target.value)}
                placeholder="e.g. How does cognitive load impact research decision-making under time pressure?"
                className="flex-1 font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-lg bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#912A4A]"
              />
              <button
                onClick={() => handleGenerateEvidenceMap()}
                disabled={loadingEvidenceMap}
                className="font-sans text-xs bg-[#912A4A] text-white px-4 py-2.5 rounded-lg hover:bg-[#78223d] transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                <span>{loadingEvidenceMap ? 'Mapping Evidence...' : 'Create evidence map'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-stone-400">Quick query prompts:</span>
              <button
                onClick={() => {
                  setEvidenceQueryFilter('What evidence supports this argument?');
                  handleGenerateEvidenceMap('What evidence supports this argument?');
                }}
                className="bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                "What evidence supports this argument?"
              </button>
              <button
                onClick={() => {
                  setEvidenceQueryFilter('What evidence challenges this interpretation?');
                  handleGenerateEvidenceMap('What evidence challenges this interpretation?');
                }}
                className="bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                "What evidence challenges this interpretation?"
              </button>
              <button
                onClick={() => {
                  setEvidenceQueryFilter('Which perspectives are missing?');
                  handleGenerateEvidenceMap('Which perspectives are missing?');
                }}
                className="bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                "Which perspectives are missing?"
              </button>
            </div>
          </div>

          {/* Burgundy Divider Line: Exactly 24pts of whitespace above and below */}
          <div
            className="w-full block"
            style={{
              height: '2px',
              backgroundColor: '#912A4A',
              marginTop: '24pt',
              marginBottom: '24pt',
            }}
            id="evidence-map-burgundy-divider"
          />

          {/* Evidence Map Content */}
          {loadingEvidenceMap ? (
            <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-6 h-6 border-2 border-[#912A4A] border-t-transparent rounded-full animate-spin"></div>
              <p className="font-sans text-xs text-stone-500 italic">Synthesizing local library evidence for supporting vs opposing arguments...</p>
            </div>
          ) : evidenceMapResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-6 border-b border-stone-200/80 dark:border-stone-800 pb-px text-xs font-medium" role="tablist">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'supporting_opposing', label: `Supporting & Opposing (${(evidenceMapResult.supportingLiterature?.length || 0) + (evidenceMapResult.opposingLiterature?.length || 0)})` },
                  { id: 'consensus_disagreement', label: 'Consensus & Disagreements' },
                  { id: 'gaps_questions', label: `Missing Facts & Gaps (${evidenceMapResult.evidenceGaps?.length || 0})` },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setEvidenceSubTab(st.id as any)}
                    className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      evidenceSubTab === st.id
                        ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold'
                        : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>

              {/* 1. Overview */}
              {evidenceSubTab === 'overview' && (
                <div className="space-y-2">
                  <HorizontalDisclosureRow
                    title="Supporting Evidence Synthesis"
                    keywords={['Supporting Evidence', `${evidenceMapResult.supportingLiterature?.length || 0} Studies`]}
                    summary={`${evidenceMapResult.supportingLiterature?.length || 0} documented papers in your library provide empirical backing for this research inquiry.`}
                    defaultExpanded={true}
                    children={
                      <ul className="space-y-1 pl-2 text-xs">
                        {evidenceMapResult.supportingLiterature?.map((item, idx) => (
                          <li key={idx} className="text-stone-700 dark:text-stone-300">
                            • <strong>{item.paperTitle}</strong>: {item.keyPoints}
                          </li>
                        ))}
                      </ul>
                    }
                  />

                  <HorizontalDisclosureRow
                    title="Opposing & Nuanced Evidence Synthesis"
                    keywords={['Opposing Evidence', `${evidenceMapResult.opposingLiterature?.length || 0} Boundary Cases`]}
                    summary={`${evidenceMapResult.opposingLiterature?.length || 0} papers document counter-examples, methodological boundaries, or alternative findings.`}
                    defaultExpanded={true}
                    children={
                      <ul className="space-y-1 pl-2 text-xs">
                        {evidenceMapResult.opposingLiterature?.map((item, idx) => (
                          <li key={idx} className="text-stone-700 dark:text-stone-300">
                            • <strong>{item.paperTitle}</strong>: {item.keyPoints}
                          </li>
                        ))}
                      </ul>
                    }
                  />

                  <HorizontalDisclosureRow
                    title="Consensus & Epistemic Boundaries"
                    keywords={['Consensus & Gaps', 'Methodological Stance']}
                    summary="Authors converge on key methodological baselines while maintaining active debate around long-term effects and contextual variables."
                    defaultExpanded={false}
                  />
                </div>
              )}

              {/* 2. Supporting vs Opposing Literature */}
              {evidenceSubTab === 'supporting_opposing' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h4 className="font-sans font-semibold text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                      Supporting Literature ({evidenceMapResult.supportingLiterature?.length || 0})
                    </h4>
                    {evidenceMapResult.supportingLiterature?.map((item, idx) => (
                      <HorizontalDisclosureRow
                        key={idx}
                        title={item.paperTitle}
                        keywords={['Supporting Evidence', `Strength: ${item.strength}`]}
                        summary={item.keyPoints}
                        defaultExpanded={idx === 0}
                        actions={
                          onInsertIntoDraft && (
                            <button
                              type="button"
                              onClick={() => onInsertIntoDraft(`${item.paperTitle} supports this premise: ${item.keyPoints}`)}
                              className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Insert supporting evidence in draft</span>
                            </button>
                          )
                        }
                      />
                    ))}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-stone-200/60 dark:border-stone-800">
                    <h4 className="font-sans font-semibold text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                      Opposing / Challenging Literature ({evidenceMapResult.opposingLiterature?.length || 0})
                    </h4>
                    {evidenceMapResult.opposingLiterature?.map((item, idx) => (
                      <HorizontalDisclosureRow
                        key={idx}
                        title={item.paperTitle}
                        keywords={['Opposing Evidence', 'Boundary Condition']}
                        summary={item.keyPoints}
                        defaultExpanded={false}
                        children={
                          <p className="font-sans text-xs text-amber-900 dark:text-amber-300 italic">
                            <strong>Boundary Limitation:</strong> {item.limitation}
                          </p>
                        }
                        actions={
                          onInsertIntoDraft && (
                            <button
                              type="button"
                              onClick={() => onInsertIntoDraft(`Conversely, ${item.paperTitle} notes boundary conditions: ${item.keyPoints}`)}
                              className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Insert counter-evidence in draft</span>
                            </button>
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Consensus & Disagreement */}
              {evidenceSubTab === 'consensus_disagreement' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h4 className="font-sans font-semibold text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                      What Authors Agree On
                    </h4>
                    {evidenceMapResult.areasOfConsensus?.map((c, idx) => (
                      <HorizontalDisclosureRow
                        key={idx}
                        title={c}
                        keywords={['Consensus', 'Cross-Study Agreement']}
                        summary="Consensus established across qualitative and quantitative research designs in the library corpus."
                        defaultExpanded={idx === 0}
                      />
                    ))}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-stone-200/60 dark:border-stone-800">
                    <h4 className="font-sans font-semibold text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                      What Authors Disagree On
                    </h4>
                    {evidenceMapResult.areasOfDisagreement?.map((d, idx) => (
                      <HorizontalDisclosureRow
                        key={idx}
                        title={d}
                        keywords={['Contested Point', 'Epistemic Debate']}
                        summary="Authors present divergent interpretations influenced by varying sample scopes and experimental controls."
                        defaultExpanded={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Missing Facts & Gaps */}
              {evidenceSubTab === 'gaps_questions' && (
                <div className="space-y-2">
                  {evidenceMapResult.evidenceGaps?.map((g, idx) => (
                    <HorizontalDisclosureRow
                      key={idx}
                      title={`Research Gap ${idx + 1}: ${g}`}
                      keywords={['Evidence Gap', 'Unstudied Condition']}
                      summary="This area requires targeted primary data collection and systematic observation to bridge existing literature gaps."
                      defaultExpanded={idx === 0}
                      actions={
                        onInsertIntoDraft && (
                          <button
                            type="button"
                            onClick={() => onInsertIntoDraft(`Future inquiry must address this gap: ${g}`)}
                            className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Insert gap into draft</span>
                          </button>
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic">Type a question above and click "Create evidence map".</p>
          )}
        </div>
      )}

      {/* ----------------- TAB 3: RESEARCH QUESTION DEVELOPMENT ----------------- */}
      {activeTab === 'question_dev' && (
        <div className="space-y-0 animate-fadeIn">
          {/* Question Builder Form - Unboxed on cream background */}
          <div className="space-y-3">
            <h3 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#912A4A]" />
              <span>Turn broad topics into refined research questions</span>
            </h3>

            <div className="space-y-2">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="e.g. Interdisciplinary research collaboration in academic institutions"
                className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-lg bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#912A4A]"
              />
              <textarea
                value={contextInput}
                onChange={(e) => setContextInput(e.target.value)}
                rows={2}
                placeholder="Optional context, e.g. Focusing on early-career researchers and publication incentives"
                className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-lg bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#912A4A]"
              />
            </div>

            <div>
              <button
                onClick={handleRunQuestionDevelopment}
                disabled={loadingQuestions || !topicInput.trim()}
                className="font-sans text-xs bg-[#912A4A] text-white px-5 py-2.5 rounded-lg hover:bg-[#78223d] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-semibold shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                <span>{loadingQuestions ? 'Building Questions...' : 'Make research questions'}</span>
              </button>
            </div>
          </div>

          {/* Burgundy Divider Line: Exactly 24pts of whitespace above and below */}
          <div
            className="w-full block"
            style={{
              height: '2px',
              backgroundColor: '#912A4A',
              marginTop: '24pt',
              marginBottom: '24pt',
            }}
            id="question-dev-burgundy-divider"
          />

          {/* Question Development Results */}
          {loadingQuestions ? (
            <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-6 h-6 border-2 border-[#912A4A] border-t-transparent rounded-full animate-spin"></div>
              <p className="font-sans text-xs text-stone-500 italic">Finding clear questions, key factors, and missing information...</p>
            </div>
          ) : questionDevResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-6 border-b border-stone-200/80 dark:border-stone-800 pb-px text-xs font-medium" role="tablist">
                {[
                  { id: 'refined_questions', label: `Refined Questions (${questionDevResult.refinedQuestions?.length || 0})` },
                  { id: 'feasibility_scope', label: 'Why It Matters & Gaps' },
                  { id: 'overlooked_perspectives', label: `Overlooked Variables (${questionDevResult.overlookedContextsOrVariables?.length || 0})` },
                  { id: 'alternative_angles', label: `Alternative Perspectives (${questionDevResult.suggestedAlternativePerspectives?.length || 0})` },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setQuestionSubTab(st.id as any)}
                    className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      questionSubTab === st.id
                        ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold'
                        : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>

              {/* 1. Refined Questions */}
              {questionSubTab === 'refined_questions' && (
                <div className="space-y-2">
                  {questionDevResult.refinedQuestions?.map((q, idx) => (
                    <HorizontalDisclosureRow
                      key={idx}
                      title={q.questionText}
                      keywords={[
                        `Question ${idx + 1}`,
                        q.isAnswerable ? 'Answerable Question' : 'Theoretical Probe'
                      ]}
                      summary={`Why it matters: ${q.whyItMatters}`}
                      defaultExpanded={idx === 0}
                      children={
                        <p className="font-sans text-xs text-emerald-900 dark:text-emerald-300">
                          <strong>Academic Gap Addressed:</strong> {q.gapAddressed}
                        </p>
                      }
                      actions={
                        onInsertIntoDraft && (
                          <button
                            type="button"
                            onClick={() => onInsertIntoDraft(`Research Question: ${q.questionText}\nRationale: ${q.whyItMatters}`)}
                            className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Insert question into draft</span>
                          </button>
                        )
                      }
                    />
                  ))}
                </div>
              )}

              {/* 2. Feasibility & Scope */}
              {questionSubTab === 'feasibility_scope' && (
                <div className="space-y-2">
                  {questionDevResult.refinedQuestions?.map((q, idx) => (
                    <HorizontalDisclosureRow
                      key={idx}
                      title={`Question ${idx + 1} Scope Assessment`}
                      keywords={['Methodological Scope', 'Academic Justification']}
                      summary={q.whyItMatters}
                      defaultExpanded={idx === 0}
                      children={
                        <p className="font-sans text-xs text-stone-600 dark:text-stone-400">
                          <strong>Targeted Gap:</strong> {q.gapAddressed}
                        </p>
                      }
                    />
                  ))}
                </div>
              )}

              {/* 3. Overlooked Contexts & Variables */}
              {questionSubTab === 'overlooked_perspectives' && (
                <div className="space-y-2">
                  {questionDevResult.overlookedContextsOrVariables?.map((item, idx) => (
                    <HorizontalDisclosureRow
                      key={idx}
                      title={item}
                      keywords={['Overlooked Variable', 'Contextual Lens']}
                      summary="Integrating this dimension expands empirical validity and accounts for systemic boundary conditions."
                      defaultExpanded={idx === 0}
                    />
                  ))}
                </div>
              )}

              {/* 4. Alternative Angles */}
              {questionSubTab === 'alternative_angles' && (
                <div className="space-y-2">
                  {questionDevResult.suggestedAlternativePerspectives?.map((item, idx) => (
                    <HorizontalDisclosureRow
                      key={idx}
                      title={item}
                      keywords={['Alternative Perspective', 'Novel Angle']}
                      summary="Probing this viewpoint challenges standard disciplinary paradigms and encourages innovative research designs."
                      defaultExpanded={idx === 0}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic">Enter a topic above to generate refined questions.</p>
          )}
        </div>
      )}

      {/* ----------------- TAB 4: PATTERN & DATA ANALYTICS ----------------- */}
      {activeTab === 'pattern_data' && (
        <div className="space-y-0 animate-fadeIn">
          {/* Data Input Form - Unboxed on cream background */}
          <div className="space-y-3">
            <h3 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#912A4A]" />
              <span>Data patterns, metric distributions & variable relationships</span>
            </h3>

            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setDataInputType('csv')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  dataInputType === 'csv'
                    ? 'bg-[#912A4A] text-white font-semibold'
                    : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400'
                }`}
              >
                CSV / Dataset
              </button>
              <button
                onClick={() => setDataInputType('corpus')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  dataInputType === 'corpus'
                    ? 'bg-[#912A4A] text-white font-semibold'
                    : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400'
                }`}
              >
                Literature corpus ({allCorpusPapers.length})
              </button>
            </div>

            {dataInputType === 'csv' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="Dataset Name"
                  className="w-full font-sans text-xs p-2 border border-stone-200 dark:border-stone-800 rounded-lg bg-transparent text-stone-900 dark:text-stone-100"
                />
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={4}
                  className="w-full font-mono text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-lg bg-transparent text-stone-900 dark:text-stone-100"
                />
              </div>
            )}

            {dataInputType === 'corpus' && (
              <p className="text-xs text-stone-500 font-sans">
                Will analyze all {allCorpusPapers.length} articles in your library for empirical patterns and outliers.
              </p>
            )}

            <div>
              <button
                onClick={handleRunDataAnalysis}
                disabled={loadingDataAnalysis}
                className="font-sans text-xs bg-[#912A4A] text-white px-5 py-2.5 rounded-lg hover:bg-[#78223d] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-semibold shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                <span>{loadingDataAnalysis ? 'Finding Patterns...' : 'Find patterns in data'}</span>
              </button>
            </div>
          </div>

          {/* Burgundy Divider Line: Exactly 24pts of whitespace above and below */}
          <div
            className="w-full block"
            style={{
              height: '2px',
              backgroundColor: '#912A4A',
              marginTop: '24pt',
              marginBottom: '24pt',
            }}
            id="data-pattern-burgundy-divider"
          />

          {/* Pattern Analysis Results */}
          {loadingDataAnalysis ? (
            <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-6 h-6 border-2 border-[#912A4A] border-t-transparent rounded-full animate-spin"></div>
              <p className="font-sans text-xs text-stone-500 italic">Looking for patterns, links between items, and key numbers...</p>
            </div>
          ) : dataAnalysisResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-6 border-b border-stone-200/80 dark:border-stone-800 pb-px text-xs font-medium" role="tablist">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'charts_distributions', label: `Data Charts (${dataAnalysisResult.chartData?.length || 0})` },
                  { id: 'correlations', label: `Correlations & Links (${dataAnalysisResult.variableRelationships?.length || 0})` },
                  { id: 'anomalies', label: 'Recurring & Anomalies' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setDataSubTab(st.id as any)}
                    className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      dataSubTab === st.id
                        ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold'
                        : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>

              {/* 1. Overview */}
              {dataSubTab === 'overview' && (
                <div className="space-y-2">
                  <HorizontalDisclosureRow
                    title="Summary Overview of Findings"
                    keywords={['Data Pattern Summary', datasetName]}
                    summary={dataAnalysisResult.summary}
                    defaultExpanded={true}
                  />

                  <HorizontalDisclosureRow
                    title="Distribution Pattern Analysis"
                    keywords={['Cluster Analysis', `${dataAnalysisResult.chartData?.length || 0} Categories`]}
                    summary={`${dataAnalysisResult.chartData?.length || 0} distinct distribution clusters identified across samples.`}
                    defaultExpanded={false}
                  />

                  <HorizontalDisclosureRow
                    title="Variable Interaction Dynamics"
                    keywords={['Correlations', `${dataAnalysisResult.variableRelationships?.length || 0} Links`]}
                    summary={`${dataAnalysisResult.variableRelationships?.length || 0} mapped interactions between dependent and independent factors.`}
                    defaultExpanded={false}
                  />
                </div>
              )}

              {/* 2. Charts & Counts */}
              {dataSubTab === 'charts_distributions' && (
                <div className="space-y-2">
                  {dataAnalysisResult.chartData?.map((cd, idx) => {
                    const maxVal = Math.max(...dataAnalysisResult.chartData!.map(c => c.value), 1);
                    const pct = Math.round((cd.value / maxVal) * 100);
                    return (
                      <HorizontalDisclosureRow
                        key={idx}
                        title={cd.label}
                        keywords={[`Value: ${cd.value}`, `Share: ${pct}%`]}
                        summary={
                          <div className="space-y-1.5">
                            <div className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#912A4A] rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-stone-500">
                              Recorded count of {cd.value} relative to sample cluster max.
                            </p>
                          </div>
                        }
                        defaultExpanded={true}
                      />
                    );
                  })}
                </div>
              )}

              {/* 3. Factor Relationships */}
              {dataSubTab === 'correlations' && (
                <div className="space-y-2">
                  {dataAnalysisResult.variableRelationships?.map((vr, idx) => (
                    <HorizontalDisclosureRow
                      key={idx}
                      title={`${vr.varA} ↔ ${vr.varB}`}
                      keywords={[vr.relationshipType, 'Variable Correlation']}
                      summary={vr.description}
                      defaultExpanded={idx === 0}
                      actions={
                        onInsertIntoDraft && (
                          <button
                            type="button"
                            onClick={() => onInsertIntoDraft(`Observed relationship between ${vr.varA} and ${vr.varB}: ${vr.description}`)}
                            className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Insert relationship in draft</span>
                          </button>
                        )
                      }
                    />
                  ))}
                </div>
              )}

              {/* 4. Recurring themes & anomalies */}
              {dataSubTab === 'anomalies' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h4 className="font-sans font-semibold text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                      Recurring Patterns & Trends
                    </h4>
                    {dataAnalysisResult.recurringThemes?.map((t, idx) => (
                      <HorizontalDisclosureRow
                        key={idx}
                        title={t}
                        keywords={['Recurring Trend', 'Empirical Pattern']}
                        summary="Consistently replicated across multiple sample partitions."
                        defaultExpanded={idx === 0}
                      />
                    ))}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-stone-200/60 dark:border-stone-800">
                    <h4 className="font-sans font-semibold text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                      Anomalies & Contradictions
                    </h4>
                    {dataAnalysisResult.contradictions?.map((c, idx) => (
                      <HorizontalDisclosureRow
                        key={idx}
                        title={c}
                        keywords={['Anomaly / Outlier', 'Contradiction']}
                        summary="Represents an exception to the dominant distribution trend that requires targeted qualitative investigation."
                        defaultExpanded={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic">Select dataset and click "Find patterns in data".</p>
          )}
        </div>
      )}

      {/* ----------------- TAB 5: CRITICAL RESEARCH PARTNER MODE ----------------- */}
      {activeTab === 'critical_partner' && (
        <div className="space-y-0 animate-fadeIn">
          {/* Statement Input Form - Unboxed on cream background */}
          <div className="space-y-3">
            <h3 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100">
              Check assumptions, claims, and blindspots
            </h3>

            <div className="space-y-2">
              <textarea
                value={hypothesisInput}
                onChange={(e) => setHypothesisInput(e.target.value)}
                rows={3}
                placeholder="What claim or guess do you want to check?"
                className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-lg bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#912A4A]"
              />
              <input
                type="text"
                value={criticalContext}
                onChange={(e) => setCriticalContext(e.target.value)}
                placeholder="Context or research domain, e.g. Analyzing European funding council mandates"
                className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-lg bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#912A4A]"
              />
            </div>

            <div>
              <button
                onClick={handleRunCriticalPartner}
                disabled={loadingCriticalPartner || !hypothesisInput.trim()}
                className="font-sans text-xs bg-[#912A4A] text-white px-5 py-2.5 rounded-lg hover:bg-[#78223d] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-semibold shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                <span>{loadingCriticalPartner ? 'Checking Assumptions...' : 'Check my assumptions'}</span>
              </button>
            </div>
          </div>

          {/* Burgundy Divider Line: Exactly 24pts of whitespace above and below */}
          <div
            className="w-full block"
            style={{
              height: '2px',
              backgroundColor: '#912A4A',
              marginTop: '24pt',
              marginBottom: '24pt',
            }}
            id="critical-partner-burgundy-divider"
          />

          {/* Critical Feedback Results */}
          {loadingCriticalPartner ? (
            <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-6 h-6 border-2 border-[#912A4A] border-t-transparent rounded-full animate-spin"></div>
              <p className="font-sans text-xs text-stone-500 italic">"What assumptions are behind this idea?" Checking hidden premises...</p>
            </div>
          ) : criticalResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-6 border-b border-stone-200/80 dark:border-stone-800 pb-px text-xs font-medium" role="tablist">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'second_thought', label: 'Reflective Steps' },
                  { id: 'assumptions_counter', label: `Assumptions & Counters (${(criticalResult.underpinningAssumptions?.length || 0) + (criticalResult.counterArgumentsToConsider?.length || 0)})` },
                  { id: 'reframing', label: 'Constructive Reframing' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setCriticalSubTab(st.id as any)}
                    className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      criticalSubTab === st.id
                        ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold'
                        : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>

              {/* 1. Overview */}
              {criticalSubTab === 'overview' && (
                <div className="space-y-2">
                  <HorizontalDisclosureRow
                    title="Constructive Reframing Synthesis"
                    keywords={['Reframing Opportunity', 'Thesis Enhancement']}
                    summary={criticalResult.constructiveReframing}
                    defaultExpanded={true}
                    actions={
                      onInsertIntoDraft && (
                        <button
                          type="button"
                          onClick={() => onInsertIntoDraft(`Reframed perspective: ${criticalResult.constructiveReframing}`)}
                          className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Insert reframing into draft</span>
                        </button>
                      )
                    }
                  />

                  <HorizontalDisclosureRow
                    title="Core Underlying Premises Detected"
                    keywords={['Premises', `${criticalResult.underpinningAssumptions?.length || 0} Assumptions`]}
                    summary={`${criticalResult.underpinningAssumptions?.length || 0} fundamental assumptions detected that require boundary validation.`}
                    defaultExpanded={false}
                  />

                  <HorizontalDisclosureRow
                    title="Alternative Explanations & Counter-Arguments"
                    keywords={['Counter-Arguments', `${criticalResult.counterArgumentsToConsider?.length || 0} Points`]}
                    summary={`${criticalResult.counterArgumentsToConsider?.length || 0} counter-points to address in your literature review.`}
                    defaultExpanded={false}
                  />
                </div>
              )}

              {/* 2. Second Thought Framework */}
              {criticalSubTab === 'second_thought' && criticalResult.secondThoughtSteps && (
                <div className="space-y-2">
                  {[
                    { step: '1. Notice', text: criticalResult.secondThoughtSteps.notice, label: 'Notice initial assumptions' },
                    { step: '2. Pause', text: criticalResult.secondThoughtSteps.pause, label: 'Pause habitual reactions' },
                    { step: '3. Question', text: criticalResult.secondThoughtSteps.question, label: 'Question core premise' },
                    { step: '4. Listen', text: criticalResult.secondThoughtSteps.listen, label: 'Listen to counter-evidence' },
                    { step: '5. Reconsider', text: criticalResult.secondThoughtSteps.reconsider, label: 'Reconsider boundaries' },
                    { step: '6. Choose', text: criticalResult.secondThoughtSteps.choose, label: 'Choose strengthened stance' },
                  ].map((s, idx) => (
                    <HorizontalDisclosureRow
                      key={idx}
                      title={s.step}
                      keywords={['Second Thought Step', s.label]}
                      summary={s.text}
                      defaultExpanded={idx === 0}
                    />
                  ))}
                </div>
              )}

              {/* 3. Underpinning Assumptions & Counter-Arguments */}
              {criticalSubTab === 'assumptions_counter' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h4 className="font-sans font-semibold text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                      Underpinning Assumptions ({criticalResult.underpinningAssumptions?.length || 0})
                    </h4>
                    {criticalResult.underpinningAssumptions?.map((item, idx) => (
                      <HorizontalDisclosureRow
                        key={idx}
                        title={item}
                        keywords={['Implicit Assumption', 'Vulnerability Point']}
                        summary="This premise may overlook boundary conditions in non-standard academic contexts."
                        defaultExpanded={idx === 0}
                      />
                    ))}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-stone-200/60 dark:border-stone-800">
                    <h4 className="font-sans font-semibold text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                      Alternative Explanations & Counter-Arguments ({criticalResult.counterArgumentsToConsider?.length || 0})
                    </h4>
                    {criticalResult.counterArgumentsToConsider?.map((item, idx) => (
                      <HorizontalDisclosureRow
                        key={idx}
                        title={item}
                        keywords={['Counter-Argument', 'Steelman Position']}
                        summary="Consider integrating this objection directly into your literature review to strengthen research rigour."
                        defaultExpanded={false}
                        actions={
                          onInsertIntoDraft && (
                            <button
                              type="button"
                              onClick={() => onInsertIntoDraft(`Counter-argument to address: ${item}`)}
                              className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Insert counter-argument in draft</span>
                            </button>
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Constructive Reframing */}
              {criticalSubTab === 'reframing' && (
                <div className="space-y-2">
                  <HorizontalDisclosureRow
                    title="Strategic Reframing Recommendation"
                    keywords={['Reframing Opportunity', 'Thesis Revision']}
                    summary={criticalResult.constructiveReframing}
                    defaultExpanded={true}
                    actions={
                      onInsertIntoDraft && (
                        <button
                          type="button"
                          onClick={() => onInsertIntoDraft(`Reframed argument: ${criticalResult.constructiveReframing}`)}
                          className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Insert reframing into draft</span>
                        </button>
                      )
                    }
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic">Enter a claim above and click "Check my assumptions".</p>
          )}
        </div>
      )}
    </div>
  );
}
