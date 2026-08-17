/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Plus, Minus, Trash2, Upload, FileText, CheckCircle2, AlertCircle, Sparkles, RefreshCw, Check, ArrowRight } from 'lucide-react';
import { ResearchJourney, Paper } from '../types';
import { postWithAiRouting } from '../lib/localAiService';

interface FundingWorkspaceProps {
  journeys: ResearchJourney[];
  papers: Paper[];
  onUpdateJourney: (updated: ResearchJourney) => void;
}

interface QuestionAssessment {
  question: string;
  adherence: 'Full' | 'Partial' | 'Missing';
  strengthRating: 'High' | 'Moderate' | 'Low';
  relevanceRating: 'High' | 'Moderate' | 'Low';
  findings: string;
  missingElements: string[];
  recommendation: string;
}

interface CriteriaCompliance {
  criterion: string;
  status: 'Compliant' | 'Partially Met' | 'Non-Compliant';
  evidence: string;
  recommendations: string;
}

interface ProposalAssessmentResult {
  overallAdherenceScore: number;
  adherenceVerdict: string;
  overallSummary: string;
  questionAssessments: QuestionAssessment[];
  criteriaCompliance: CriteriaCompliance[];
  coreStrengths: string[];
  criticalGapsAndRisks: string[];
  revisionChecklist: string[];
}

export default function FundingWorkspace({ journeys, papers, onUpdateJourney }: FundingWorkspaceProps) {
  const fundingJourneys = journeys.filter((j) => j.type === 'phd' || j.type === 'funding' || j.fundingDetails);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>(fundingJourneys[0]?.id || journeys[0]?.id || '');
  
  const activeJourney = journeys.find((j) => j.id === selectedJourneyId);

  // Active view tab: 'overview' | 'assessment'
  const [activeTab, setActiveTab] = useState<'assessment' | 'overview'>('assessment');

  // Progressive disclosure states (+ / - expand and collapse, collapsed by default)
  const [openFunder, setOpenFunder] = useState(false);
  const [openImpact, setOpenImpact] = useState(false);
  const [openBio, setOpenBio] = useState(false);

  // New reusable snippet states
  const [newSnippet, setNewSnippet] = useState('');

  // New priority criteria states
  const [newPriority, setNewPriority] = useState('');

  // --- Proposal Assessment States ---
  const [criteriaInput, setCriteriaInput] = useState<string>(
    '1. Methodological Rigour and Feasibility\n2. Clear Scholarly Contribution & Innovation\n3. Evidence-Backed Hypotheses & Citations\n4. Public Dissemination & Societal Impact Plan\n5. Risk Mitigation & Timeline Realism'
  );
  const [questionsInput, setQuestionsInput] = useState<string>(
    'Q1: What is the core problem, knowledge gap, and why is this timely?\nQ2: What is your exact research design and methodological execution plan?\nQ3: How will your findings be validated, published, and shared with wider stakeholders?'
  );
  
  const [selectedDraftSource, setSelectedDraftSource] = useState<'journey_chapter' | 'custom_text'>('journey_chapter');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(activeJourney?.chapters[0]?.id || '');
  const [customDraftText, setCustomDraftText] = useState<string>('');
  
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<ProposalAssessmentResult | null>(null);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);

  const criteriaFileInputRef = useRef<HTMLInputElement>(null);
  const questionsFileInputRef = useRef<HTMLInputElement>(null);
  const draftFileInputRef = useRef<HTMLInputElement>(null);

  // Get active text to evaluate
  const getDraftTextToEvaluate = (): string => {
    if (selectedDraftSource === 'journey_chapter' && activeJourney) {
      const ch = activeJourney.chapters.find((c) => c.id === selectedChapterId) || activeJourney.chapters[0];
      return ch?.content || '';
    }
    return customDraftText;
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setter(content);
      }
    };
    reader.readAsText(file);
  };

  const handleRunAssessment = async () => {
    const draftText = getDraftTextToEvaluate();
    if (!draftText.trim()) {
      setAssessmentError('Please select a chapter with content or enter your draft proposal response text.');
      return;
    }
    setIsAssessing(true);
    setAssessmentError(null);

    try {
      const response = await postWithAiRouting('/api/gemini/funding/assess-proposal', {
        criteria: criteriaInput,
        questions: questionsInput,
        documentResponse: draftText,
        funderName: activeJourney?.fundingDetails?.funderName || 'Target Funding Agency',
      });

      if (response.ok) {
        const data = await response.json();
        setAssessmentResult(data);
      } else {
        const errData = await response.json();
        throw new Error(errData.error || 'Assessment evaluation failed.');
      }
    } catch (err: any) {
      console.error(err);
      setAssessmentError(err.message || 'Unable to complete proposal assessment.');
    } finally {
      setIsAssessing(false);
    }
  };

  const handleAddSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJourney || !newSnippet) return;

    const snippets = activeJourney.reusableSnippets || [];
    const updated: ResearchJourney = {
      ...activeJourney,
      reusableSnippets: [...snippets, newSnippet],
    };

    onUpdateJourney(updated);
    setNewSnippet('');
  };

  const handleDeleteSnippet = (index: number) => {
    if (!activeJourney) return;
    const snippets = activeJourney.reusableSnippets || [];
    const updated: ResearchJourney = {
      ...activeJourney,
      reusableSnippets: snippets.filter((_, idx) => idx !== index),
    };
    onUpdateJourney(updated);
  };

  const handleUpdateImpact = (text: string) => {
    if (!activeJourney) return;
    const details = activeJourney.fundingDetails || {
      funderName: 'National Funding Body',
      priorityCriteria: [],
      impactStatement: '',
      collaborators: '',
    };

    onUpdateJourney({
      ...activeJourney,
      fundingDetails: {
        ...details,
        impactStatement: text,
      },
    });
  };

  const handleUpdateFunderName = (name: string) => {
    if (!activeJourney) return;
    const details = activeJourney.fundingDetails || {
      funderName: '',
      priorityCriteria: [],
      impactStatement: '',
      collaborators: '',
    };

    onUpdateJourney({
      ...activeJourney,
      fundingDetails: {
        ...details,
        funderName: name,
      },
    });
  };

  const handleAddPriority = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJourney || !newPriority) return;

    const details = activeJourney.fundingDetails || {
      funderName: 'National Funding Body',
      priorityCriteria: [],
      impactStatement: '',
      collaborators: '',
    };

    onUpdateJourney({
      ...activeJourney,
      fundingDetails: {
        ...details,
        priorityCriteria: [...details.priorityCriteria, newPriority],
      },
    });

    setNewPriority('');
  };

  return (
    <div className="space-y-6 text-left" id="funding-workspace-module">
      
      {/* Top Header & Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="font-sans font-medium text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 tracking-tight">
            Grants & Proposals
          </h1>
          <p className="font-sans text-xs sm:text-sm text-stone-500 mt-1">
            Assess draft responses against funder criteria, application questions, and compliance standards.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-sans text-xs text-stone-500">Journey:</span>
          <select
            value={selectedJourneyId}
            onChange={(e) => setSelectedJourneyId(e.target.value)}
            className="font-sans text-xs p-2 border border-stone-300 dark:border-stone-700 rounded-md text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-900 focus:outline-none focus:border-[#912A4A]"
          >
            {journeys.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Switcher: Assessment vs Setup */}
      <div className="flex items-center gap-6 border-b border-stone-200/80 dark:border-stone-800 pb-px text-xs font-medium" role="tablist">
        <button
          type="button"
          onClick={() => setActiveTab('assessment')}
          className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'assessment'
              ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Proposal Assessment</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-400 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Funder Profile & Bios</span>
        </button>
      </div>

      {/* ----------------- TAB 1: AI PROPOSAL ASSESSMENT ----------------- */}
      {activeTab === 'assessment' && (
        <div className="space-y-6">
          
          {/* Burgundy Dividing Line 24pt above 1, 2, and 3 */}
          <hr className="border-0 border-t border-[#912A4A]/30 dark:border-rose-900/40 my-8" style={{ marginTop: '24pt', marginBottom: '24pt' }} />

          {/* Horizontal 3-Column Configuration Grid for 1, 2, and 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* 1. Funder Criteria & Evaluation Benchmarks */}
            <div className="space-y-3 bg-stone-50 dark:bg-stone-900/50 p-5 rounded-lg border border-stone-200 dark:border-stone-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-medium text-stone-900 dark:text-stone-100 text-sm">
                    1. Funder Criteria & Evaluation Benchmarks
                  </h3>
                  <button
                    type="button"
                    onClick={() => criteriaFileInputRef.current?.click()}
                    className="text-[11px] font-sans text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                  >
                    <Upload className="w-3 h-3" />
                    Upload
                  </button>
                  <input
                    ref={criteriaFileInputRef}
                    type="file"
                    accept=".txt,.md,.json,.csv,.doc"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setCriteriaInput)}
                  />
                </div>
                <p className="text-[11px] text-stone-500 min-h-[32px]">Paste or upload the funder’s call guidelines, scoring rubric, or core priorities.</p>
                <textarea
                  value={criteriaInput}
                  onChange={(e) => setCriteriaInput(e.target.value)}
                  className="w-full font-sans text-xs p-3 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md h-52 focus:outline-none focus:border-[#912A4A] leading-relaxed mt-1"
                  placeholder="e.g. 1. Scientific novelty 2. Methodological feasibility..."
                />
              </div>
            </div>

            {/* 2. Application Form Questions */}
            <div className="space-y-3 bg-stone-50 dark:bg-stone-900/50 p-5 rounded-lg border border-stone-200 dark:border-stone-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-medium text-stone-900 dark:text-stone-100 text-sm">
                    2. Application Form Questions
                  </h3>
                  <button
                    type="button"
                    onClick={() => questionsFileInputRef.current?.click()}
                    className="text-[11px] font-sans text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                  >
                    <Upload className="w-3 h-3" />
                    Upload
                  </button>
                  <input
                    ref={questionsFileInputRef}
                    type="file"
                    accept=".txt,.md,.json,.csv,.doc"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setQuestionsInput)}
                  />
                </div>
                <p className="text-[11px] text-stone-500 min-h-[32px]">Enter the exact prompts or questions from the funder’s application portal.</p>
                <textarea
                  value={questionsInput}
                  onChange={(e) => setQuestionsInput(e.target.value)}
                  className="w-full font-sans text-xs p-3 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md h-52 focus:outline-none focus:border-[#912A4A] leading-relaxed mt-1"
                  placeholder="e.g. Question 1: Describe the primary objectives and target milestones..."
                />
              </div>
            </div>

            {/* 3. Candidate Response Document / Draft */}
            <div className="space-y-3 bg-stone-50 dark:bg-stone-900/50 p-5 rounded-lg border border-stone-200 dark:border-stone-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-medium text-stone-900 dark:text-stone-100 text-sm">
                    3. Candidate Response Draft
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDraftSource('journey_chapter')}
                      className={`text-[10px] px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        selectedDraftSource === 'journey_chapter'
                          ? 'bg-[#1B0A3B] text-white font-medium'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Journey
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDraftSource('custom_text')}
                      className={`text-[10px] px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        selectedDraftSource === 'custom_text'
                          ? 'bg-[#1B0A3B] text-white font-medium'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                <div className="min-h-[32px] flex items-center justify-between text-[11px] text-stone-500">
                  {selectedDraftSource === 'journey_chapter' ? (
                    <span>Select draft chapter from current journey:</span>
                  ) : (
                    <>
                      <span>Paste or upload proposal draft:</span>
                      <button
                        type="button"
                        onClick={() => draftFileInputRef.current?.click()}
                        className="text-[11px] font-sans text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        Upload
                      </button>
                      <input
                        ref={draftFileInputRef}
                        type="file"
                        accept=".txt,.md,.json,.csv,.doc"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setCustomDraftText)}
                      />
                    </>
                  )}
                </div>

                {selectedDraftSource === 'journey_chapter' ? (
                  <div className="space-y-2">
                    <select
                      value={selectedChapterId}
                      onChange={(e) => setSelectedChapterId(e.target.value)}
                      className="w-full font-sans text-xs p-2 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#912A4A]"
                    >
                      {activeJourney?.chapters.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.title} ({ch.content.split(/\s+/).filter(Boolean).length} words)
                        </option>
                      ))}
                    </select>

                    <div className="p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-md h-40 overflow-y-auto font-sans text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                      {getDraftTextToEvaluate() ? (
                        <p className="whitespace-pre-line">{getDraftTextToEvaluate()}</p>
                      ) : (
                        <p className="text-stone-400 italic">This chapter is currently empty. Add content or switch to custom text.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={customDraftText}
                      onChange={(e) => setCustomDraftText(e.target.value)}
                      className="w-full font-sans text-xs p-3 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md h-52 focus:outline-none focus:border-[#912A4A] leading-relaxed"
                      placeholder="Paste full proposal response section here..."
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Burgundy Dividing Line 24pt below 1, 2, and 3 */}
          <hr className="border-0 border-b border-[#912A4A]/30 dark:border-rose-900/40 my-8" style={{ marginTop: '24pt', marginBottom: '24pt' }} />

          {/* Assessment Action Button */}
          <div>
            <button
              type="button"
              onClick={handleRunAssessment}
              disabled={isAssessing}
              className="w-full py-3 px-4 rounded-md bg-[#912A4A] hover:bg-[#78223d] text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
            >
              {isAssessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Adherence, Strength & Relevance...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Assess Proposal Adherence & Evidence</span>
                </>
              )}
            </button>
          </div>

          {/* Assessment Error Banner */}
          {assessmentError && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{assessmentError}</span>
            </div>
          )}

          {/* ----------------- ASSESSMENT RESULTS PRESENTATION ----------------- */}
          {assessmentResult && (
            <div className="space-y-6 pt-2 animate-fadeIn">
              
              {/* Score & Executive Verdict Header */}
              <div className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="font-sans font-semibold text-lg sm:text-xl text-stone-900 dark:text-stone-100">
                      Assessment Verdict: {assessmentResult.adherenceVerdict}
                    </h2>
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
                    {assessmentResult.overallSummary}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-4 rounded-lg shrink-0">
                  <div className="text-center">
                    <span className="text-3xl font-bold font-mono text-[#912A4A] dark:text-rose-400">
                      {assessmentResult.overallAdherenceScore}%
                    </span>
                    <span className="block text-[10px] font-sans uppercase tracking-wider text-stone-500 font-semibold mt-0.5">
                      Adherence Score
                    </span>
                  </div>
                </div>
              </div>

              {/* Question-by-Question Evaluation Breakdown */}
              <div className="space-y-3">
                <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-base">
                  Question-by-Question Appraisal
                </h3>
                <div className="space-y-3">
                  {assessmentResult.questionAssessments?.map((qa, idx) => (
                    <div
                      key={idx}
                      className="p-5 bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3 text-xs font-sans"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-2.5">
                        <span className="font-medium text-stone-900 dark:text-stone-100 text-sm">
                          {qa.question}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            qa.adherence === 'Full'
                              ? 'bg-[#1D9E75] text-white'
                              : qa.adherence === 'Partial'
                              ? 'bg-amber-700 text-white'
                              : 'bg-red-700 text-white'
                          }`}>
                            Adherence: {qa.adherence}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                            Strength: {qa.strengthRating}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                            Relevance: {qa.relevanceRating}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-stone-700 dark:text-stone-300">
                        <p className="leading-relaxed">
                          <strong className="text-stone-900 dark:text-stone-100">Findings:</strong> {qa.findings}
                        </p>

                        {qa.missingElements && qa.missingElements.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[11px] font-semibold text-stone-900 dark:text-stone-100 block mb-1">
                              Missing Funder Elements:
                            </span>
                            <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-stone-400 pl-1">
                              {qa.missingElements.map((m, mIdx) => (
                                <li key={mIdx}>{m}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded text-stone-800 dark:text-stone-200 mt-2">
                          <span className="font-semibold text-[#912A4A] dark:text-rose-400 block mb-1">
                            Actionable Recommendation:
                          </span>
                          <p className="leading-relaxed">{qa.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Criteria Compliance Grid & Roadmap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Core Strengths & Critical Gaps */}
                <div className="space-y-4">
                  <div className="p-5 bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3">
                    <h4 className="font-sans font-semibold text-sm text-[#1D9E75] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Core Proposal Strengths</span>
                    </h4>
                    <ul className="space-y-2 text-xs font-sans text-stone-700 dark:text-stone-300">
                      {assessmentResult.coreStrengths?.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] mt-1.5 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3">
                    <h4 className="font-sans font-semibold text-sm text-[#912A4A] dark:text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span>Critical Gaps & Reviewer Risks</span>
                    </h4>
                    <ul className="space-y-2 text-xs font-sans text-stone-700 dark:text-stone-300">
                      {assessmentResult.criticalGapsAndRisks?.map((g, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#912A4A] mt-1.5 shrink-0" />
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Sequential Actionable Revision Roadmap */}
                <div className="p-5 bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3">
                  <h4 className="font-sans font-semibold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <ArrowRight className="w-4 h-4 text-[#912A4A]" />
                    <span>Actionable Revision Roadmap</span>
                  </h4>
                  <p className="text-xs text-stone-500">Prioritized checklist to elevate submission readiness:</p>
                  <div className="space-y-2.5 pt-1">
                    {assessmentResult.revisionChecklist?.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded flex items-start gap-2.5 text-xs text-stone-800 dark:text-stone-200"
                      >
                        <span className="font-mono text-[10px] bg-[#912A4A] text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ----------------- TAB 2: OVERVIEW & BIOS ----------------- */}
      {activeTab === 'overview' && activeJourney && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Funder profile */}
            <div className="space-y-3 pb-6">
              <button
                type="button"
                onClick={() => setOpenFunder(!openFunder)}
                className="w-full flex items-center justify-between pb-2 text-left cursor-pointer group border-b border-stone-200 dark:border-stone-800"
              >
                <h3 className="font-sans font-semibold text-stone-950 dark:text-stone-100 text-sm">
                  Funder Specifics & Priority Benchmarks
                </h3>
                <span className="p-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono text-xs flex items-center justify-center w-6 h-6 shrink-0">
                  {openFunder ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </span>
              </button>

              {openFunder && (
                <div className="pt-2 space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-sans text-[11px] text-stone-500 font-medium">Funder / Scheme Name</label>
                      <input
                        type="text"
                        value={activeJourney.fundingDetails?.funderName || ''}
                        onChange={(e) => handleUpdateFunderName(e.target.value)}
                        placeholder="e.g., European Research Council, NSF, Wellcome Trust..."
                        className="w-full font-sans text-xs p-2 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#912A4A]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-sans text-[11px] text-stone-500 font-medium">Active Collaborators</label>
                      <input
                        type="text"
                        value={activeJourney.fundingDetails?.collaborators || ''}
                        onChange={(e) => {
                          if (!activeJourney) return;
                          const details = activeJourney.fundingDetails || { funderName: '', priorityCriteria: [], impactStatement: '', collaborators: '' };
                          onUpdateJourney({
                            ...activeJourney,
                            fundingDetails: { ...details, collaborators: e.target.value }
                          });
                        }}
                        placeholder="Institutions or co-investigators..."
                        className="w-full font-sans text-xs p-2 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#912A4A]"
                      />
                    </div>
                  </div>

                  {/* Priority checklist */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-sans font-semibold text-xs text-stone-800 dark:text-stone-200">
                      Saved Compliance Benchmarks
                    </h4>
                    
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {activeJourney.fundingDetails?.priorityCriteria.map((crit, idx) => (
                        <div key={idx} className="p-2.5 bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded flex gap-2.5 items-start text-xs font-sans text-stone-700 dark:text-stone-300 leading-relaxed">
                          <span className="font-mono text-[10px] bg-[#912A4A] text-white w-4 h-4 flex items-center justify-center rounded-full shrink-0 mt-0.5 font-bold">{idx + 1}</span>
                          <span>{crit}</span>
                        </div>
                      ))}

                      {(!activeJourney.fundingDetails || activeJourney.fundingDetails.priorityCriteria.length === 0) && (
                        <p className="font-sans text-xs text-stone-400 italic">No specific compliance priorities logged yet.</p>
                      )}
                    </div>

                    <form onSubmit={handleAddPriority} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Define a crucial funder focus or benchmark..."
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value)}
                        className="w-full font-sans text-xs p-2 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#912A4A]"
                        required
                      />
                      <button
                        type="submit"
                        className="font-sans text-xs bg-[#912A4A] hover:bg-[#78223d] text-white px-3 py-1.5 rounded font-medium cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Impact Statement */}
            <div className="space-y-3 pb-6">
              <button
                type="button"
                onClick={() => setOpenImpact(!openImpact)}
                className="w-full flex items-center justify-between pb-2 text-left cursor-pointer group border-b border-stone-200 dark:border-stone-800"
              >
                <h3 className="font-sans font-semibold text-stone-950 dark:text-stone-100 text-sm">
                  Societal Impact & Outreach Statement
                </h3>
                <span className="p-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono text-xs flex items-center justify-center w-6 h-6 shrink-0">
                  {openImpact ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </span>
              </button>

              {openImpact && (
                <div className="pt-2 space-y-3 animate-fadeIn">
                  <p className="font-sans text-xs text-stone-500">
                    Map out your dissemination pathways beyond academia to policy, industry, and wider communities.
                  </p>

                  <textarea
                    value={activeJourney.fundingDetails?.impactStatement || ''}
                    onChange={(e) => handleUpdateImpact(e.target.value)}
                    className="w-full font-sans text-xs p-3 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100 h-36 focus:outline-none focus:border-[#912A4A] leading-relaxed"
                    placeholder="Draft the pathway to impact..."
                  />
                </div>
              )}
            </div>

          </div>

          {/* Reusable Snippets Sidebar */}
          <div className="lg:col-span-1 space-y-3 pb-6">
            <button
              type="button"
              onClick={() => setOpenBio(!openBio)}
              className="w-full flex items-center justify-between pb-2 text-left cursor-pointer group border-b border-stone-200 dark:border-stone-800"
            >
              <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100">
                Reusable Bios & Capability Profile
              </h4>
              <span className="p-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono text-xs flex items-center justify-center w-6 h-6 shrink-0">
                {openBio ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </span>
            </button>

            {openBio && (
              <div className="pt-2 space-y-4 animate-fadeIn">
                <p className="font-sans text-[11px] text-stone-500">
                  Store reusable descriptions (bios, lab capability statements) to paste into proposal applications.
                </p>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {activeJourney.reusableSnippets?.map((snip, idx) => (
                    <div key={idx} className="p-3 bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded text-xs font-sans space-y-2">
                      <p className="text-stone-700 dark:text-stone-300 leading-relaxed italic">"{snip}"</p>
                      <div className="flex justify-between items-center text-[10px] text-stone-400 pt-1 border-t border-stone-200/50 dark:border-stone-800">
                        <span>Snippet #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSnippet(idx)}
                          className="text-stone-400 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  {(!activeJourney.reusableSnippets || activeJourney.reusableSnippets.length === 0) && (
                    <p className="font-sans text-xs text-stone-400 italic">No reusable capability snippets saved.</p>
                  )}
                </div>

                <form onSubmit={handleAddSnippet} className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                  <textarea
                    placeholder="Write a reusable statement (e.g. lab facilities, bios)..."
                    value={newSnippet}
                    onChange={(e) => setNewSnippet(e.target.value)}
                    className="w-full font-sans text-xs p-2 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded h-20 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#912A4A]"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full font-sans text-xs bg-[#912A4A] hover:bg-[#78223d] text-white py-1.5 rounded transition-colors cursor-pointer font-medium"
                  >
                    Save Snippet
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
