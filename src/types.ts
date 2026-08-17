/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ActiveTab = string;

export interface AccessibilitySettings {
  reducedMotion: boolean;
  contrast?: 'normal' | 'standard' | 'high' | 'warm';
  colorPreference?: 'default' | 'grayscale' | 'amber' | 'cream' | 'slate';
  fontSize?: 'normal' | 'standard' | 'large' | 'extra-large' | 'xlarge';
  displayMode?: 'light' | 'dark' | 'high-contrast' | 'low-vision';
  dyslexiaFont?: boolean;
  letterSpacing?: 'standard' | 'wide' | 'extra-wide';
  lineHeight?: 'standard' | 'double' | 'spacious';
  readingWidth?: 'narrow' | 'standard' | 'wide' | 'full';
  enhancedFocus?: boolean;
  soundEnabled?: boolean;
  interfaceDensity?: 'spacious' | 'compact';
  activeModules?: string[];
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  reducedMotion: false,
  contrast: 'standard',
  colorPreference: 'default',
  fontSize: 'standard',
  displayMode: 'light',
  dyslexiaFont: false,
  letterSpacing: 'standard',
  lineHeight: 'standard',
  readingWidth: 'standard',
  enhancedFocus: false,
  soundEnabled: true,
  interfaceDensity: 'spacious',
  activeModules: [],
};

export interface Paper {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  tags: string[];
  collectionId?: string;
  notes: string;
  abstract?: string;
  verificationStatus: 'verified' | 'missing_metadata' | 'unverified';
  missingFields: string[];
  annotations: Annotation[];
  structuredSummary?: StructuredSummary;
  traceabilityNotes?: string;
}

export interface Annotation {
  id: string;
  text: string;
  comment?: string;
  color: string;
  createdAt: string;
  page?: number;
}

export interface StructuredSummary {
  researchQuestion: string;
  methods: string;
  participants: string;
  findings: string;
  limitations: string;
  evidenceStrength: number; // 1 to 5
  evidenceExplanation: string;
  futureResearch: string;
  keyQuotations: string[];
  majorConcepts: string[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface ResearchJourney {
  id: string;
  title: string;
  type: 'undergrad' | 'masters' | 'phd' | 'postdoc' | 'journal' | 'book' | 'funding' | 'public_engagement' | 'policy';
  description: string;
  questions: string[];
  chapters: Chapter[];
  tasks: Task[];
  timeline: TimelineEvent[];
  linkedPaperIds: string[];
  targetDeadline?: string;
  reusableSnippets?: string[];
  fundingDetails?: FundingDetails;
}

export interface Chapter {
  id: string;
  title: string;
  status: 'not_started' | 'drafting' | 'review' | 'completed';
  content: string;
  linkedPaperIds?: string[];
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'milestone' | 'meeting' | 'submission' | 'draft';
}

export interface FundingDetails {
  funderName: string;
  priorityCriteria: string[];
  impactStatement: string;
  collaborators: string;
  budgetSummary?: string;
}

export interface MoodCheckIn {
  id: string;
  timestamp: string;
  state: 'focused' | 'curious' | 'overwhelmed' | 'stuck' | 'doubting' | 'tired' | 'avoiding_writing' | 'anxious';
  note?: string;
}

export interface DailyGoal {
  text: string;
  completed: boolean;
}

export interface SoundScape {
  id: string;
  name: string;
  type: 'nature' | 'museum' | 'library' | 'white_noise';
  src: string;
}

export type CitationStyle = 'APA7' | 'Harvard' | 'Chicago' | 'IEEE' | 'MLA9' | 'Vancouver';

export interface GraphNode {
  id: string;
  label: string;
  type: 'journey' | 'paper' | 'concept' | 'theme' | 'quote';
  color?: string;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  relation: string;
}

export interface EvidenceMap {
  researchQuestion: string;
  supportingLiterature: { paperTitle: string; paperId?: string; keyPoints: string; strength: string }[];
  opposingLiterature: { paperTitle: string; paperId?: string; keyPoints: string; limitation: string }[];
  methodologicalStrengths: string[];
  methodologicalLimitations: string[];
  areasOfConsensus: string[];
  areasOfDisagreement: string[];
  evidenceGaps: string[];
}

export interface ResearchQuestionAnalysis {
  originalTopic: string;
  refinedQuestions: {
    questionText: string;
    whyItMatters: string;
    gapAddressed: string;
    isAnswerable: boolean;
  }[];
  overlookedContextsOrVariables: string[];
  suggestedAlternativePerspectives: string[];
}

export interface PatternAndDataAnalysis {
  summary: string;
  recurringThemes: string[];
  unexpectedConnections: string[];
  contradictions: string[];
  trendsOverTime: string[];
  variableRelationships: { varA: string; varB: string; relationshipType: string; description: string }[];
  underexploredAreas: string[];
  chartData?: { label: string; value: number; category?: string }[];
}

export interface CriticalPartnerFeedback {
  interpretationChecked: string;
  underpinningAssumptions: string[];
  unstatedPremises: string[];
  sampleOrContextLimitations: string[];
  counterArgumentsToConsider: string[];
  constructiveReframing: string;
  secondThoughtSteps: {
    notice: string;
    pause: string;
    question: string;
    listen: string;
    reconsider: string;
    choose: string;
  };
}

export interface LiteratureSynthesisResult {
  agreements: string;
  disagreements: string;
  majorThemes: {
    name: string;
    description: string;
    linkedPapers: string[];
    keyConcepts: string[];
  }[];
  coreConcepts: {
    concept: string;
    definition: string;
    usageInLiterature: string;
    linkedThemes: string[];
  }[];
  underlyingTheories: {
    theoryName: string;
    corePremise: string;
    keyProponents: string;
    applicationContext: string;
  }[];
  methodologiesUsed: {
    methodologyName: string;
    type: 'Qualitative' | 'Quantitative' | 'Mixed' | 'Theoretical';
    description: string;
    strengths: string;
    limitations: string;
  }[];
  mappedRelationships: {
    source: string;
    target: string;
    relationshipType: 'supports' | 'challenges' | 'extends' | 'applies' | 'contrasts';
    explanation: string;
  }[];
  schoolsOfThought: {
    schoolName: string;
    coreTenet: string;
    keyAuthors: string;
    distinguishingAssumptions: string;
  }[];
  establishedFindings: string[];
  emergingDebates: string[];
  unresolvedQuestions: string[];
}
