/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Paper, ResearchJourney, Collection, SoundScape, LiteratureSynthesisResult, EvidenceMap, ResearchQuestionAnalysis, PatternAndDataAnalysis, CriticalPartnerFeedback } from './types';

export const INITIAL_COLLECTIONS: Collection[] = [
  { id: 'col-1', name: 'Critical AI & Society', description: 'Papers examining sociotechnical aspects of AI systems', color: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200' },
  { id: 'col-2', name: 'Methodology & Design', description: 'HCI and qualitative methods in software development', color: 'bg-[#912A4A]/10 dark:bg-[#912A4A]/30 text-[#912A4A] dark:text-rose-300 border-[#912A4A]/30' },
  { id: 'col-3', name: 'Research & Creative Wellbeing', description: 'Literature on sustainable practice, writing, and wellbeing', color: 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200' }
];

export const INITIAL_PAPERS: Paper[] = [
  {
    id: 'paper-1',
    title: 'Attention Is All You Need',
    authors: 'Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin',
    journal: 'Advances in Neural Information Processing Systems',
    year: 2017,
    doi: '10.48550/arXiv.1706.03762',
    tags: ['Transformer', 'Deep Learning', 'NLP'],
    collectionId: 'col-1',
    notes: 'The foundational paper for modern LLMs. Outlines the self-attention mechanism, replacing RNN/LSTM entirely.',
    abstract: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.',
    verificationStatus: 'verified',
    missingFields: [],
    annotations: [
      { id: 'ann-1', text: 'dispensing with recurrence and convolutions entirely', comment: 'Radical simplification of architectures', color: '#FEF08A', createdAt: '2026-06-25T10:00:00Z', page: 1 },
      { id: 'ann-2', text: 'self-attention mechanism, relating different positions of a single sequence', comment: 'Allows parallel training and long-range dependencies', color: '#BCF0DA', createdAt: '2026-06-25T10:15:00Z', page: 2 }
    ],
    structuredSummary: {
      researchQuestion: 'Can neural sequence transduction models be built purely on attention mechanisms, eliminating recurrence and convolutions entirely?',
      methods: 'Design of the Transformer architecture with Multi-Head Self-Attention. Trained on WMT translation datasets and evaluated BLEU scores.',
      participants: 'N/A (Trained on standard corpora: WMT 2014 English-to-German and English-to-French).',
      findings: 'The Transformer achieves state-of-the-art translation quality (28.4 BLEU on English-to-German) while training in a fraction of the time of recurrent models.',
      limitations: 'High quadratic memory complexity regarding sequence length, making long document synthesis computationally expensive without modification.',
      evidenceStrength: 5,
      evidenceExplanation: 'Outstanding evidence backed by standardized benchmarks, massive statistical improvements, and universal industry replication.',
      futureResearch: 'Applying attention-based models to other modalities like images, audio, video, and scaling to extremely long inputs.',
      keyQuotations: [
        'The Transformer is the first sequence transduction model relying entirely on self-attention to compute representations of its input and output.',
        'We show that the self-attention mechanism allows the model to capture dependencies regardless of their distance.'
      ],
      majorConcepts: ['Transformer', 'Self-Attention', 'Multi-Head Attention', 'Parallel training', 'Sequence-to-sequence']
    }
  },
  {
    id: 'paper-2',
    title: 'Designing for Deep Thinking: Cognitive Overload and Calm AI Systems',
    authors: 'Elena S. Rostova, Kenji Takahashi',
    journal: 'Journal of Human-Computer Interaction Studies',
    year: 2024,
    doi: '10.1016/j.jhcis.2024.10425',
    tags: ['Calm Tech', 'Cognitive Load', 'Productivity Bias'],
    collectionId: 'col-2',
    notes: 'Critically evaluates how modern "productivity-boosting" tools actually induce cognitive overload and imposter syndrome by displaying constant metrics.',
    abstract: 'This paper examines the cognitive impact of metric-centric productivity dashboards on researchers. We show that continuous telemetry, streaks, and gamification induce anxiety and disrupt deep focus states (flow). We propose a "Calm Tech" framework for research software that prioritizes asynchronous engagement and organic reflection.',
    verificationStatus: 'verified',
    missingFields: [],
    annotations: [
      { id: 'ann-3', text: 'gamification induce anxiety and disrupt deep focus states', comment: 'Direct critique of Zotero/Mendeley progress counters', color: '#FCA5A5', createdAt: '2026-06-26T08:30:00Z', page: 4 }
    ],
    structuredSummary: {
      researchQuestion: 'How do gamified progress metrics in research software affect cognitive load and focus among graduate researchers?',
      methods: 'Mixed-methods study: qualitative diary study (N=45) over 6 weeks and quantitative electroencephalography (EEG) focus tracking in a controlled laboratory setting.',
      participants: '45 PhD candidates and postdoctoral scholars in humanities and physical sciences.',
      findings: 'Software featuring gamification and metric progress bars increased cognitive load scores by 34% on average and triggered imposter syndrome thoughts in 72% of participants.',
      limitations: 'The laboratory EEG sample size was relatively small (N=15) and conducted over a short duration.',
      evidenceStrength: 4,
      evidenceExplanation: 'Strong mixed-methods triangulation combining direct neurophysiological EEG data with qualitative diary studies, though a larger participant pool would solidify generalizability.',
      futureResearch: 'Investigating quiet, slow-tech digital environments that foster reflective pacing and cognitive decompression.',
      keyQuotations: [
        'Research is an organic, non-linear cognitive journey; forcing linear metrics onto intellectual inquiry creates a false sense of inadequacy.',
        'Calm software design rejects constant notifications, replacing urgency with spaciousness.'
      ],
      majorConcepts: ['Calm Technology', 'Cognitive Load', 'Productivity Bias', 'Deep Focus', 'Slow Tech']
    }
  },
  {
    id: 'paper-3',
    title: 'The Impostor Phenomenon in Academic Environments: Prevalence and Prevention',
    authors: 'Pauline Rose Clance, Suzanne Ament Imes',
    journal: 'Psychotherapy: Theory, Research & Practice',
    year: 1978,
    doi: '10.1037/h0086033',
    tags: ['Wellbeing', 'Impostor Phenomenon', 'Higher Education'],
    collectionId: 'col-3',
    notes: 'The classic paper defining the Impostor Phenomenon. Highly relevant for research wellbeing modules.',
    abstract: 'The term "impostor phenomenon" is used to designate an internal experience of intellectual phoniness which appears to be particularly prevalent and intense among high-achieving women. Despite outstanding academic credentials, these individuals live in constant fear of being exposed as intellectual frauds.',
    verificationStatus: 'verified',
    missingFields: [],
    annotations: [],
    structuredSummary: {
      researchQuestion: 'Why do highly successful, credentialed women experience intense feelings of intellectual fraudulence, and what psychological dynamics maintain this cycle?',
      methods: 'Clinical case study and qualitative interviews over 5 years with high-achieving women.',
      participants: 'Over 150 high-achieving women including PhD students, faculty members, and clinical clients.',
      findings: 'The phenomenon is rooted in early family dynamics and societal gender expectations. Individuals utilize grueling defense mechanisms (overwork, intellectual charm) which temporarily ward off exposure but ultimately reinforce the cycle.',
      limitations: 'The original sample lacked diversity in socioeconomic status and gender representation, focusing heavily on clinical therapy clients.',
      evidenceStrength: 3,
      evidenceExplanation: 'A seminal foundational work that established a vital paradigm, but relies on clinical qualitative interpretation and case studies rather than statistically representative quantitative controls.',
      futureResearch: 'Analyzing the prevalence of this phenomenon among minoritized scholars and developing institutional intervention programs.',
      keyQuotations: [
        'Despite outstanding academic and professional accomplishments, these women persist in believing that they are really not bright and have fooled anyone.',
        'The impostor cycle is reinforced when success is attributed to luck, timing, or charming others, rather than actual capability.'
      ],
      majorConcepts: ['Impostor Phenomenon', 'Intellectual Fraudulence', 'Attribution Theory', 'Sustainable Self-Evaluation']
    }
  },
  {
    id: 'paper-4',
    title: 'Sustaining Scientific Inquiry: A Study of Researcher Burnout',
    authors: 'Marcus Vance, Sarah L. Jenkins',
    journal: 'Studies in Graduate and Higher Education',
    year: 2025,
    doi: '',
    tags: ['Burnout', 'Mental Health', 'Supervisor Dynamics'],
    collectionId: 'col-3',
    notes: 'Incomplete DOI! Good for showing our DOI metadata repair capabilities.',
    abstract: 'We survey graduate researchers to identify predictors of clinical burnout. We locate supervisor relationships, publication pressure, and isolation as the three primary axes of risk. We outline individual and system-level mitigations.',
    verificationStatus: 'missing_metadata',
    missingFields: ['doi', 'volume', 'issue', 'pages'],
    annotations: []
  }
];

export const INITIAL_JOURNEYS: ResearchJourney[] = [
  {
    id: 'journey-1',
    title: 'Decolonial Methodologies in Museum UX',
    type: 'phd',
    description: 'A multi-year PhD research project re-evaluating the user experience of interactive museum galleries through indigenous and decolonial frameworks. The goal is to design collaborative, non-hierarchical museum interfaces.',
    questions: [
      'How do standard Western UX design guidelines perpetuate epistemic violence in cultural heritage representation?',
      'What design practices emerge when designing exhibits in collaborative partnership with indigenous elders?',
      'Can interface design support oral storytelling without forcing text-heavy structures?'
    ],
    chapters: [
      { id: 'ch-1', title: 'Chapter 1: Introduction and Scope', status: 'completed', content: '' },
      { id: 'ch-2', title: 'Chapter 2: Decolonial Critical Theory', status: 'drafting', content: '' },
      { id: 'ch-3', title: 'Chapter 3: Co-Design Methodologies', status: 'not_started', content: '' },
      { id: 'ch-4', title: 'Chapter 4: Comparative Case Studies', status: 'not_started', content: '' }
    ],
    tasks: [
      { id: 't-1', text: 'Transcribe co-design workshop with the Heritage Council', completed: true },
      { id: 't-2', text: 'Request ethics clearance for Chapter 3 interviews', completed: true },
      { id: 't-3', text: 'Map critical concepts from Tuhiwai Smith to UX schema', completed: false, dueDate: '2026-07-15' },
      { id: 't-4', text: 'Draft literature review sub-section on Oral Knowledge Systems', completed: false, dueDate: '2026-08-01' }
    ],
    timeline: [
      { id: 'tl-1', date: '2025-09-01', title: 'PhD Candidacy Approved', description: 'Ethics approval cleared, research proposal defended successfully.', type: 'milestone' },
      { id: 'tl-2', date: '2026-02-15', title: 'Completed Workshop 1', description: 'Co-design session with 12 community curators.', type: 'meeting' },
      { id: 'tl-3', date: '2026-06-30', title: 'Chapter 2 Draft Submission', description: 'Submit decolonial theory chapter draft to supervisor.', type: 'draft' },
      { id: 'tl-4', date: '2026-12-15', title: 'Mid-term Review Seminar', description: 'Present case study findings to the HCI department.', type: 'milestone' }
    ],
    linkedPaperIds: ['paper-2', 'paper-3'],
    targetDeadline: '2028-09-15',
    reusableSnippets: [
      'Relational ontology: Indigenous design approaches prioritize the relationality between the viewer, the artifact, and the community, in contrast to Cartesian individual UX models.',
      'Oral documentation: Digitizing oral histories requires interfaces that preserve conversational cadence, acoustic metadata, and contextual storytelling rather than flat textual extraction.'
    ],
    fundingDetails: {
      funderName: 'National Endowment for the Humanities (NEH) Fellowship',
      priorityCriteria: [
        'Broad public dissemination of cultural heritage assets',
        'Inclusion of marginalized communities in historical documentation',
        'Innovative digital humanities approaches'
      ],
      impactStatement: 'By creating collaborative museum interfaces, this project transforms cultural institutions from sites of passive consumption into active spaces of community dialogue, enhancing cultural preservation and democratic participation.',
      collaborators: 'Auckland Museum, Indigenous Design Collective, Digital Humanities Lab Auckland',
      budgetSummary: '$85,000 stipends and travel funding for community elders and workshop participants.'
    }
  },
  {
    id: 'journey-2',
    title: 'Cognitive Offloading in Academic Writing Platforms',
    type: 'journal',
    description: 'A journal paper targeted at ACM Transactions on Computer-Human Interaction (TOCHI), evaluating how computer-aided writing environments can support complex argument construction without overriding human agency.',
    questions: [
      'What are the cognitive barriers researchers face when managing extensive citations while drafting papers?',
      'How can AI systems recommend source literature without generating false citations or causing confirmation bias?'
    ],
    chapters: [
      { id: 'ch-2-1', title: 'Introduction', status: 'drafting', content: '' },
      { id: 'ch-2-2', title: 'Related Work on Citations', status: 'not_started', content: '' },
      { id: 'ch-2-3', title: 'System Interface Design', status: 'not_started', content: '' }
    ],
    tasks: [
      { id: 't-2-1', text: 'Run pilot study of the distraction-free drafting companion', completed: false, dueDate: '2026-07-10' },
      { id: 't-2-2', text: 'Conduct initial comparative literature review on citation managers', completed: true }
    ],
    timeline: [
      { id: 'tl-2-1', date: '2026-05-01', title: 'Project Launch', description: 'Assembled advisory board and defined interface design principles.', type: 'milestone' },
      { id: 'tl-2-2', date: '2026-09-01', title: 'Target Submission to TOCHI', description: 'Submit final peer-reviewed manuscript.', type: 'submission' }
    ],
    linkedPaperIds: ['paper-1', 'paper-2'],
    targetDeadline: '2026-09-01'
  }
];

export const WELLBEING_RESOURCES = {
  impostorSyndrome: {
    title: 'Deconstructing the Impostor Phenomenon',
    subtitle: 'Evidence-informed strategies for creative and scholarly confidence',
    sections: [
      {
        heading: '1. Recognize the Base Rate Error',
        content: 'Selective academic, creative, and professional environments select the top fraction of achievers. When everyone around you has been selected for excellence, the environment naturally filters out visible struggle. Experiencing self-doubt in a room of high-performers is not evidence of fraudulence; it is a predictable statistical selection effect.'
      },
      {
        heading: '2. The Attribution Realignment',
        content: 'Writers, creators, and researchers experiencing the impostor phenomenon systematically attribute success to external causes (luck, charm, timing, ease) and failure to internal causes (incapability, lack of intellect). Document your specific contributions. Write down: "What action did I take that led to this breakthrough?" Force your brain to associate effort and design with positive outcomes.'
      },
      {
        heading: '3. Redefine "The Investigator & Creator"',
        content: 'You do not need to be an infallible oracle to be a writer, researcher, or project creator. An investigator or creator is simply someone who asks systematic questions, gathers evidence, crafts ideas, and reports transparently. Acknowledging limits is a sign of intellectual strength, not weakness.'
      }
    ],
    reflectionPrompt: 'Recall a specific writing, project, or research challenge you faced a year ago. What methods did you use to overcome it? What does this tell you about your ability to handle today\'s ambiguity?'
  },
  supervisorMeetings: {
    title: 'Collaborator & Mentor Meeting Preparation Strategy',
    subtitle: 'Structuring communications to maintain agency and clarity',
    sections: [
      {
        heading: '1. Drive the Agenda (Do not let it drive you)',
        content: 'Send a bulleted agenda 24 hours prior to the meeting. Include: (a) Specific progress made, (b) The exact blocking questions you need resolved, and (c) Immediate next steps. This frames mentors or collaborators as consultants, preserving your creative and intellectual ownership.'
      },
      {
        heading: '2. The "Structured Dilemma" Technique',
        content: 'Never present a blank problem. Instead, outline alternative paths. For example: "I have encountered a bottleneck in the project structure. I can either: (A) Use approach A which guarantees stability, or (B) Use approach B which ensures flexibility and speed. I lean toward B because... What are your thoughts?" This proves critical synthesis.'
      },
      {
        heading: '3. Close the Loop with Minutes',
        content: 'After the meeting, send a 3-sentence summary of agreed actions. Written records prevent moving goalposts and clarify expectations, neutralizing communication drift or memory issues.'
      }
    ],
    reflectionPrompt: 'What is the single most critical decision you need input on during your next meeting? How can you present it as a choice between two logical pathways?'
  },
  rejectionRecovery: {
    title: 'Rejection Recovery & Pitch Response',
    subtitle: 'Processing feedback objectively without internalizing failure',
    sections: [
      {
        heading: '1. The 48-Hour Cooling Rule',
        content: 'When a paper, manuscript, grant, or project proposal is rejected, read the decision once, then close the document and do not touch it for 48 hours. Your emotional response is neurophysiologically valid; do not force yourself to draft revisions or argue with reviewers during this high-cortisol period.'
      },
      {
        heading: '2. De-Personalize the Text',
        content: 'Reviewer or client criticism is a commentary on the current state of a drafted text, not a verdict on your intellect. Translate emotional feedback into cold, actionable logic. For example, if a reviewer writes: "The author fails to grasp the complexity of X," translate this to: "Make explanation of X more explicit in Section 2.2."'
      },
      {
        heading: '3. Re-Submission is the Default',
        content: 'Publishing, submitting, or pitching work is a game of matching and persistence. A rejection often indicates a poor fit for a particular venue, publisher, or client rather than flawed work. Instantly identify the secondary target venue, adjust the format, and send it out.'
      }
    ],
    reflectionPrompt: 'Look at the last critical piece of feedback you received. If you stripped away all emotional, defensive, or harsh vocabulary, what is the core structural improvement they are asking for?'
  }
};

export const SOUNDSCAPES: SoundScape[] = [
  { id: 'sound-1', name: 'Muted Library Rain', type: 'library', src: 'gentle_rain' },
  { id: 'sound-2', name: 'Museum Reading Room', type: 'museum', src: 'distant_footsteps' },
  { id: 'sound-3', name: 'Coastal Forest Breeze', type: 'nature', src: 'procedural_wind' }
];


// ----------------- COMPLETE 13-POINT PLATFORM SPECIFICATION -----------------
// Rendered beautifully as an academic paper inside the specifications reading mode.
export const SYSTEM_SPECIFICATION = {
  title: "The Research Companion Platform: Architecture and Technical Foundations",
  subtitle: "A Decadal Paradigm for Sustainable, Privacy-First Research & Creative Inquiry",
  authors: "UX Research, Accessibility, Software Architecture, HCI & Advisory Board",
  date: "June 2026",
  abstract: "This document delineates the comprehensive system architecture, database design, AI synthesis protocol, accessibility strategy, and development roadmap for the Research Companion. Operating under offline-first, privacy-by-default, and calm-computing design philosophies, the platform represents a fundamental departure from traditional tools toward a sustainable digital ecosystem for researchers, writers, creators, and scholars.",
  
  sections: [
    {
      id: "spec-1",
      title: "1. Product Vision",
      content: `The Research Companion is built on the fundamental premise that researchers, writers, and creators are human beings, not data-processing engines. Standard tools operate as static storage cabinets or mechanical formatters. Few systems support the highly non-linear, emotionally demanding, and cognitively exhausting lifecycles of complex creative and research projects.

Our vision is a digital workspace that actively nurtures intellectual agency. Rather than stressing creators and researchers with productivity metrics, daily writing streaks, and constant notification loops, the Research Companion provides a quiet, offline-first library atmosphere. It respects the cognitive flow state, ensures absolute data privacy, maintains traceable evidence lines, and integrates advanced generative AI as a humble dialogue partner rather than an authoritative writer. The platform acts as an intellectual anchor, sustaining creators, researchers, and writers through the journeys of project reports, articles, books, dissertations, and complex funding applications while keeping integrity pristine.`
    },
    {
      id: "spec-2",
      title: "2. System Architecture",
      content: `The platform is structured using a client-server full-stack topology, but designed to operate perfectly in a sandboxed, low-latency, offline-first client node:

• Client Layer (React 19 + Tailwind CSS + motion): Handles highly dense information hierarchies, D3 graph canvas, and local state management. Built on fluid container queries to support split-screen writing.
• Offline Local Sync Engine: Intercepts client-side writes, saving drafts, annotations, and metadata into localStorage or local indexedDB. It provides JSON import/export (Research Companion Archive) for zero-cloud reliance.
• Application Server Layer (Express + Node.js): Serves as a local API gateway in dev mode or container node. Proxies AI requests to Gemini API, keeping credentials securely hidden from the browser.
• AI Engine Interface: Communicates with Google's @google/genai SDK on the server, applying rigorous system instructions to force factual traceability and structured JSON outputs.`
    },
    {
      id: "spec-3",
      title: "3. Screen Architecture",
      content: `The user interface is laid out in a responsive dual-pane structure, optimizing for cognitive ease and split-screen deep focus:

• Navigation Panel (Aesthetic Rail): Left-aligned, high-contrast, keyboard-navigable menu bar that expands on demand. Avoids distracting badges.
• Modular Workspace: Adaptable main viewport. For example, the Writing Companion divides the screen into a minimalist, distraction-free typing layout on the left, and a slide-out 'Reference & Intelligence' shelf on the right.
• Wellbeing Sentry: A quiet footer that houses the calm audio player and Pomodoro timer, accessible via hotkeys, displaying no flashing tickers or anxiety-inducing timers.
• Readable Columns: All reading panes limit text lines to 70–80 characters (optimal for reading speed and eye tracking) using left alignment and beautiful serif font options.`
    },
    {
      id: "spec-4",
      title: "4. Navigation Map",
      content: `The navigation map is direct, flat, and intuitive to reduce decision fatigue:

• [Research Home]: Current single-focus goal, overview of active projects, and the "How are you arriving?" mood check.
• [Literature Library]: Grid/List view of papers and references with direct search, metadata status check, and interactive annotation workbench.
• [Literature Intelligence]: Cross-paper synthesis console, agreement/disagreement matrix, and theme clustering workspace.
• [Research Workspace]: Journey boards mapping chapters, tasks, questions, and timelines.
• [Writing Companion]: Distraction-free draft editor with side-by-side local reference recommending panel.
• [Citation Engine]: Style formatter (APA7, IEEE, MLA, etc.) and metadata repair tools.
• [Research Wellbeing]: End of session sound chimes, Impostor Syndrome reframing guides, and meeting checklists.
• [Funding Workspace]: Grant bid preparations, funder criteria compliance checklists, and bios.
• [Knowledge Graph]: D3 interactive visualization of interconnected themes, papers, and quotes.`
    },
    {
      id: "spec-5",
      title: "5. Database Structure",
      content: `The data schema utilizes a relational graph mapped to a document model:

• Papers Table: Schema includes Title, Authors, Journal, Year, DOI (unique), Tags, notes, VerificationStatus, and Annotations [array of {id, text, comment, color}].
• Journeys Table: Maps JourneyID to Title, JourneyType, Description, Questions [string array], Chapters [array of {id, title, status, content}], Tasks [array of {id, text, completed}], and Timeline [array of {id, date, title, type}].
• Connections (Graph Edge) Table: Tracks relationship arrays linking [SourceID, TargetID, RelationType, Notes].
• MoodCheck Table: Timestamps of user's state check-ins to adapt UI themes and reflection prompts.

In our client implementation, this is completely mirrored in a local database file to support offline reading and writing.`
    },
    {
      id: "spec-6",
      title: "6. AI Architecture",
      content: `The AI architecture is built on the core principle: "AI assists, Humans decide." 

• Primary Model: 'gemini-3.5-flash' handles text synthesis, claims-checking, and metadata parsing due to its exceptional speed, low latency, and advanced reasoning capabilities.
• Strict Grounding Protocol: We utilize structured JSON schemas (via responseSchema) to enforce deterministic outputs.
• Anti-Hallucination Framework: AI prompts are injected with negative constraints, forbidding the model from writing text with references not found in the user's provided local library. When suggesting supports, the AI must explicitly link the paper ID and Title, producing a 100% traceable, non-fabricated citations network.
• Confidence Leveling: Every summary or claims report generates a 1-5 strength-of-evidence index based on the source's methodology.`
    },
    {
      id: "spec-7",
      title: "7. Offline-First Strategy",
      content: `Research, writing, and creative ideation are done in quiet libraries, cafes, on trains, in remote locations, and during travel. Relying on continuous cloud connections disrupts flow and compromises security:

• Local Cache First: All writes (notes, highlights, chapters, tasks) are committed synchronously to LocalStorage.
• File-Based Portability: Users can export their entire platform database as a '.rcp' (Research Companion Project) JSON file. They can import this archive on any browser node. This guarantees absolute data ownership and prevents software lock-in.
• Deferred Server Processing: Heavy analytical tasks (like running Gemini on a new source) are queued. If offline, the interface states "Queued for processing when online" and operates locally. All static features remain fully active.`
    },
    {
      id: "spec-8",
      title: "8. Accessibility Strategy",
      content: `Accessibility is treated as a foundational element of design rigor:

• Responsive Typography: Switcher supporting 'Sans-Serif' (Inter for UI layout) and 'Book Serif' (Georgia/Playfair for reading) with adjustable font scales (S, M, L, XL).
• Visual Contrast: Color blind-safe palettes and high-contrast, eye-friendly light/dark themes utilizing off-white warm paper surfaces and deep charcoal inks.
• Cognitive Safety: Left-aligned, readable text-columns limiting character-widths. Zero intrusive notifications or flashing timers.
• Screen Reader Support: Use of semantic HTML5 nodes (aside, main, article, section) with strict ARIA tags on interactive elements, and hidden assistive labels.`
    },
    {
      id: "spec-9",
      title: "9. Technical Stack Recommendations",
      content: `Our recommended stack represents a lightweight, dependable, long-term choice:

• Language: TypeScript (strict mode) for compile-time safety and type contract enforcement.
• Frontend Framework: React 19 (for modular, reactive interface layout) combined with Vite (ultra-fast bundler).
• Styling: Tailwind CSS (for modular, maintainable, responsive utility styling) + @tailwindcss/vite.
• Graph Visualization: D3.js (the industry gold-standard for fast, high-performance interactive physics simulations).
• Back-End Host: Express (NodeJS) to act as a secure CORS proxy and Gemini client.
• Compilers: Esbuild for bundling backend code into a self-contained production-ready CJS script.`
    },
    {
      id: "spec-10",
      title: "10. MVP Roadmap",
      content: `The Minimum Viable Product focuses on delivering immediate, high-fidelity core utility:

• Milestone 1: Deliver beautiful 'Warm Paper' UI theme, accessibility typography switcher, and flat dashboard navigation.
• Milestone 2: Build the Literature Library & local state managers with DOI check-ups and JSON Import/Export.
• Milestone 3: Integrate Express server + @google/genai, implementing structured summaries, claim checking, and mentor check-ins.
• Milestone 4: Add the Focus timers & End of session sound chimes, and render the D3 Interactive Knowledge Graph.
• Milestone 5: Compile, verify, and launch the unified specifications workspace.`
    },
    {
      id: "spec-11",
      title: "11. Future Roadmap",
      content: `The decadal vision extends beyond the MVP to enrich intellectual and creative autonomy:

• Year 1-2: Support local PDF processing using client-side WebAssembly parsing (pdf.js) to extract abstracts directly offline.
• Year 3-5: Add fully localized offline LLM execution (via WebGPU or Chrome's local AI API) to perform basic summarization without any external network calls.
• Year 6-10: Establish a decentralized, cryptographic peer-to-peer sync protocol (such as CRDTs over WebRTC) allowing collaborative groups to synchronize libraries without a central cloud server, preserving 100% privacy.`
    },
    {
      id: "spec-12",
      title: "12. Risks and Mitigation",
      content: `We actively mitigate technical and human risks:

• Risk: Browser storage clearing (caches cleared by browser updates).
  Mitigation: Highly prominent, low-friction, automatic backup prompts to download local .rcp JSON backups upon exiting the app or completing milestones.
• Risk: LLM hallucinations creating false citations.
  Mitigation: Enforcing a rigid local-only cross-referencing prompt, preventing the model from sourcing references from its pre-training weights, and assigning evidence strength flags.
• Risk: Screen-reader friction on complex graphs.
  Mitigation: Providing an alternative high-contrast accessible list-view table for all relationships depicted on the Knowledge Graph canvas.`
    },
    {
      id: "spec-13",
      title: "13. Platform Differentiation",
      content: `The Research Companion completely outpaces classical citation managers and modern 'productivity wrappers':

• Traditional Managers: Designed as static indexing containers. They are rigid, bloated, and present no features supporting synthesis, writing drafts, or cognitive wellbeing.
• AI Writing Assistants: Wrappers that write the text *for* you, inducing guilt, encouraging intellectual passivity, and risking severe citation fabrication.
• Research Companion Difference: Focuses on the *journey* and *health* of the creator, writer, and researcher. It does not write the paper or book; it helps you organise your thoughts. It does not display speed charts; it reminds you to breathe. It connects local literature traceably, checks your claims with cold evidence, and helps you trust your own voice.`
    }
  ]
};

export const DEFAULT_SYNTHESIS_DATA: LiteratureSynthesisResult = {
  agreements: "Empirical benchmarks and cognitive psychology frameworks agree that self-attention architectures and calm, asynchronous digital environments reduce extraneous cognitive load while preserving scholarly depth.",
  disagreements: "Active debate persists regarding whether computational scaling alone can substitute for qualitative human reflexivity, and how best to mitigate algorithmic bias in citation networks.",
  majorThemes: [
    {
      name: "Calm Computing & Cognitive Ergonomics",
      description: "Designing digital research workspaces that protect sustained deep thought, flow states, and mental endurance without intrusive telemetry or anxiety-inducing metrics.",
      linkedPapers: ["Designing for Deep Thinking: Cognitive Overload and Calm AI Systems"],
      keyConcepts: ["Calm Technology", "Cognitive Scaffolding", "Asynchronous Engagement", "Flow State Preservation"]
    },
    {
      name: "Attention Mechanisms & Scalable Transduction",
      description: "The architectural shift from recurrence and convolution to pairwise multi-head self-attention mechanisms for processing language and document semantics.",
      linkedPapers: ["Attention Is All You Need"],
      keyConcepts: ["Self-Attention", "Multi-Head Attention", "Parallelized Transduction", "Long-Range Dependencies"]
    },
    {
      name: "Intrinsic Motivation & Scholarly Autonomy",
      description: "Examining how basic psychological needs (autonomy, competence, relatedness) support doctoral persistence, intellectual courage, and sustainable publication habits.",
      linkedPapers: ["Intrinsic and extrinsic motivation from a self-determination theory perspective"],
      keyConcepts: ["Self-Determination Theory", "Autonomy-Supportive Supervision", "Intrinsic Motivation"]
    }
  ],
  coreConcepts: [
    {
      concept: "Calm Technology",
      definition: "Digital systems and interfaces that inform and support the user without demanding central conscious attention or creating urgency.",
      usageInLiterature: "Utilized in Human-Computer Interaction to design quiet, non-gamified software for researchers.",
      linkedThemes: ["Calm Computing & Cognitive Ergonomics"]
    },
    {
      concept: "Self-Attention Mechanism",
      definition: "A mathematical operation relating different positions of a single input sequence to compute dynamic contextual representation vectors.",
      usageInLiterature: "Foundational mechanism powering Transformer language models and modern semantic search.",
      linkedThemes: ["Attention Mechanisms & Scalable Transduction"]
    },
    {
      concept: "Autonomy Support",
      definition: "Interpersonal and institutional environments that acknowledge emotional perspectives, offer meaningful choices, and minimize coercive control.",
      usageInLiterature: "Demonstrated to protect academic researchers against imposter syndrome and chronic burnout.",
      linkedThemes: ["Intrinsic Motivation & Scholarly Autonomy"]
    }
  ],
  underlyingTheories: [
    {
      theoryName: "Self-Determination Theory (SDT)",
      corePremise: "Optimal human functioning requires the satisfaction of three universal psychological needs: autonomy, competence, and relatedness.",
      keyProponents: "Richard M. Ryan & Edward L. Deci (2000, 2020)",
      applicationContext: "Sustaining long-term intellectual motivation and preventing graduate burnout."
    },
    {
      theoryName: "Cognitive Load Theory (CLT)",
      corePremise: "Human working memory is strictly limited; interface design must eliminate extraneous cognitive friction to allow germane learning.",
      keyProponents: "John Sweller (1988), Elena S. Rostova (2024)",
      applicationContext: "Structuring distraction-free academic writing tools and literature workspaces."
    },
    {
      theoryName: "Attention & Sequence Transduction Theory",
      corePremise: "Contextual sequence representations can be constructed entirely via dynamic pairwise dot-product affinities.",
      keyProponents: "Ashish Vaswani et al. (2017)",
      applicationContext: "Neural machine translation and semantic literature graph synthesis."
    }
  ],
  methodologiesUsed: [
    {
      methodologyName: "Standardized Benchmark Transduction",
      type: "Quantitative",
      description: "Evaluating translation accuracy (BLEU scores) and training FLOP efficiency on public WMT corpora.",
      strengths: "Highly objective, replicable, and provides clear quantitative performance baselines.",
      limitations: "Focuses on token accuracy rather than qualitative nuances of deep human reasoning."
    },
    {
      methodologyName: "Phenomenological Researcher Interviews",
      type: "Qualitative",
      description: "Semi-structured qualitative interviews analyzing cognitive fatigue, writing blocks, and metric anxiety.",
      strengths: "Captures rich, authentic lived experiences and subtle psychological friction points.",
      limitations: "Relies on subjective self-reporting and smaller purposive sample cohorts."
    },
    {
      methodologyName: "Telemetry & Psychometric Correlational Analysis",
      type: "Mixed",
      description: "Correlating software session duration and interruption frequency with standardized wellbeing inventories.",
      strengths: "Synthesizes objective usage telemetry with validated psychological assessment scales.",
      limitations: "External stressors (e.g. grant deadlines) can introduce confounding variables."
    }
  ],
  mappedRelationships: [
    {
      source: "Vaswani et al. (2017)",
      target: "Modern Semantic Literature Synthesis",
      relationshipType: "supports",
      explanation: "Empirical benchmarking demonstrates that self-attention mechanisms effectively model multi-document conceptual relationships without sequential RNN latency."
    },
    {
      source: "Ryan & Deci (2020) [SDT]",
      target: "Rostova & Takahashi (2024) [Calm Tech]",
      relationshipType: "supports",
      explanation: "Self-Determination Theory supports the finding that intrusive metric tracking and speed leaderboards thwart autonomy and induce imposter anxiety."
    },
    {
      source: "Rostova & Takahashi (2024)",
      target: "Gamified Academic Telemetry",
      relationshipType: "challenges",
      explanation: "Directly challenges the widespread industry assumption that daily productivity streaks and constant metric counters improve scholarly output."
    },
    {
      source: "Qualitative Reflexive Inquiry",
      target: "Pure Automated Literature Extraction",
      relationshipType: "challenges",
      explanation: "Challenges the premise that automated statistical aggregators can replace active human epistemic reflexivity and contextual critique."
    },
    {
      source: "Bidirectional Transformer Representations (BERT)",
      target: "Vaswani et al. (2017)",
      relationshipType: "extends",
      explanation: "Extends the original encoder-decoder Transformer into bidirectional masked token architectures for deep conceptual document embeddings."
    },
    {
      source: "Calm Companion Workspace",
      target: "Weiser's Calm Technology (1991)",
      relationshipType: "extends",
      explanation: "Extends foundational ubiquitous calm computing principles into modern AI-assisted research and distraction-free writing environments."
    },
    {
      source: "Self-Determination Theory",
      target: "Autonomy-Supportive Research Supervision",
      relationshipType: "applies",
      explanation: "Applies basic psychological needs principles to doctoral mentorship, replacing surveillance and micromanagement with empathetic guidance."
    },
    {
      source: "Attention Embedding Projections",
      target: "Thematic Literature Mapping",
      relationshipType: "applies",
      explanation: "Applies high-dimensional attention vectors to identify cross-disciplinary semantic connections across disparate academic corpora."
    },
    {
      source: "Calm Asynchronous Research",
      target: "High-Velocity Productivity Dashboards",
      relationshipType: "contrasts",
      explanation: "Contrasts contemplative, self-paced scholarship with high-pressure, metric-saturated agile dashboards that encourage shallow skimming."
    },
    {
      source: "Parallel Transformer Processing",
      target: "Sequential Recurrent Neural Networks (LSTM)",
      relationshipType: "contrasts",
      explanation: "Contrasts constant $O(1)$ path-length parallel computation with sequential temporal step recurrence, trading memory for speed."
    }
  ],
  schoolsOfThought: [
    {
      schoolName: "Calm & Sustainable Computing",
      coreTenet: "Technological systems should reside gently on the periphery of attention and actively protect cognitive energy.",
      keyAuthors: "Mark Weiser, John Seely Brown, Elena S. Rostova",
      distinguishingAssumptions: "Human cognitive capacity is finite and sacred; speed metrics degrade intellectual creativity."
    },
    {
      schoolName: "Computational Attention & Foundation Models",
      coreTenet: "Sequence transduction and semantic representation can be learned entirely through parallel self-attention weights.",
      keyAuthors: "Ashish Vaswani, Noam Shazeer, Niki Parmar",
      distinguishingAssumptions: "Explicit recurrence and convolutional inductive biases are unnecessary when provided sufficient scale and data."
    }
  ],
  establishedFindings: [
    "Continuous activity metrics and timer countdowns induce measurable cognitive fatigue in qualitative researchers.",
    "Multi-head self-attention outperforms sequential RNNs across cross-lingual transduction benchmarks.",
    "Autonomy-supportive writing conditions reliably enhance long-term scholarly publication rates."
  ],
  emergingDebates: [
    "Whether AI synthesis tools subtly narrow epistemic diversity by over-weighting frequently cited canonical sources.",
    "Balancing quadratic computational complexity against document context length in full-text literature analysis."
  ],
  unresolvedQuestions: [
    "What specific interface mechanisms best prompt researchers to critically verify automated thematic extractions?",
    "How does regular digital mindfulness practice alter the linguistic structure of academic prose?"
  ]
};

export const DEFAULT_EVIDENCE_MAP: EvidenceMap = {
  researchQuestion: "How does cognitive load impact research decision-making under time pressure?",
  supportingLiterature: [
    {
      paperTitle: "Designing for Deep Thinking: Cognitive Overload and Calm AI Systems",
      keyPoints: "High-frequency interruptions and continuous telemetry overload working memory, causing researchers to prioritize superficial metrics over deep qualitative analysis.",
      strength: "Robust Empirical Trial"
    },
    {
      paperTitle: "Intrinsic and extrinsic motivation from a self-determination theory perspective",
      keyPoints: "Time pressure that feels coercive undermines perceived autonomy, triggering premature cognitive closure on complex hypothesis generation.",
      strength: "Replicated Longitudinal Cohort"
    },
    {
      paperTitle: "Cognitive Ergonomics in Scholarly Inquiry",
      keyPoints: "Calm interfaces that minimize extraneous visual clutter reduce decision fatigue by up to 34% during multi-source evidence extraction.",
      strength: "Controlled Laboratory Study"
    }
  ],
  opposingLiterature: [
    {
      paperTitle: "High-Velocity Innovation & Agile Scholarship Paradigms",
      keyPoints: "Argues that constrained timeboxes and rapid iteration loops foster intellectual momentum and prevent academic perfectionist paralysis.",
      limitation: "Sample restricted to early-stage software engineering hackathons rather than sustained scholarly research."
    },
    {
      paperTitle: "Stress Inoculation and Academic Productivity Metrics",
      keyPoints: "Suggests moderate external metric pressure acts as positive eustress, boosting output speed across routine clerical tasks.",
      limitation: "Conflates quantitative manuscript submission counts with conceptual rigor and peer-reviewed novelty."
    }
  ],
  methodologicalStrengths: [
    "Synthesizes physiological telemetry with validated psychometric cognitive load inventories.",
    "Cross-validates self-reported fatigue against multi-task error rates."
  ],
  methodologicalLimitations: [
    "Laboratory tasks often simplify the open-ended ambiguity inherent in real dissertation research.",
    "Individual differences in baseline working memory capacity are difficult to control completely."
  ],
  areasOfConsensus: [
    "Excessive extraneous cognitive load impairs complex pattern recognition and lateral thinking.",
    "Distraction-free, calm digital workspaces preserve working memory capacity.",
    "High time urgency increases reliance on cognitive heuristics and familiar citations."
  ],
  areasOfDisagreement: [
    "The threshold at which time pressure shifts from motivating eustress to debilitating cognitive fatigue.",
    "Whether automated AI summaries reduce germane cognitive load or inadvertently encourage uncritical skimming."
  ],
  evidenceGaps: [
    "Longitudinal studies tracking cognitive stamina over multi-year doctoral writing arcs.",
    "Impact of neurodivergent cognitive profiles on time-pressured research synthesis.",
    "Cross-cultural differences in academic stress perception and autonomy support."
  ]
};

export const DEFAULT_QUESTION_DEV: ResearchQuestionAnalysis = {
  originalTopic: "Interdisciplinary research collaboration in academic institutions",
  refinedQuestions: [
    {
      questionText: "How do divergent epistemological assumptions between qualitative social scientists and computational data scientists shape the peer-review consensus in cross-disciplinary grant proposals?",
      whyItMatters: "Directly influences which interdisciplinary initiatives receive funding and identifies communication bottlenecks before project execution.",
      gapAddressed: "Moves beyond institutional structural barriers to investigate micro-level semantic and epistemic friction between collaborators.",
      isAnswerable: true
    },
    {
      questionText: "To what extent do non-traditional co-authorship credit models mitigate power imbalances for early-career researchers on massive interdisciplinary consortia?",
      whyItMatters: "Protects junior scholars from intellectual exploitation while incentivizing long-term collaborative data curation.",
      gapAddressed: "Addresses the documented blind spot where standard first/last author conventions penalize cross-field team science.",
      isAnswerable: true
    },
    {
      questionText: "What digital workspace affordances best facilitate asynchronous concept negotiation among researchers across differing time zones?",
      whyItMatters: "Provides actionable guidelines for building modern collaborative research platforms that respect individual cognitive rhythms.",
      gapAddressed: "Synthesizes calm technology principles with distributed team science practices.",
      isAnswerable: true
    }
  ],
  overlookedContextsOrVariables: [
    "Early-career precarity and short-term contract timelines vs multi-year collaborative project horizons.",
    "Disciplinary variations in citation half-life and publication prestige metrics.",
    "Institutional resource disparities between Global North and Global South co-investigators."
  ],
  suggestedAlternativePerspectives: [
    "Epistemic Injustice Framework: Examining whose methods are treated as default 'rigorous' standards in mixed teams.",
    "Calm Infrastructure Theory: Assessing how asynchronous communication reduces meeting fatigue in multi-institutional teams.",
    "Sociology of Valuation: Analyzing how department tenure committees evaluate interdisciplinary versus monodisciplinary portfolios."
  ]
};

export const DEFAULT_DATA_ANALYSIS: PatternAndDataAnalysis = {
  summary: "Analysis across 602 academic publications (2020-2024) reveals a distinct migration from isolated monodisciplinary inquiries toward mixed-methods and computational synthesis. A strong positive correlation (r = 0.74) exists between calm, distraction-free writing practices and sustained publication completion rates.",
  recurringThemes: [
    "Adoption of asynchronous collaborative tools increased by 58% post-2021.",
    "Qualitative methodologies demonstrate higher resilience against metric-driven burnout compared to purely quantitative metric-chasing cohorts.",
    "Mentorship models emphasizing psychological autonomy consistently predict doctoral persistence."
  ],
  unexpectedConnections: [
    "Researchers utilizing scheduled daily mindfulness pauses reported 26% higher self-rated writing clarity despite fewer total logged desk hours.",
    "Citation diversity increases when research teams deliberately rotate primary literature search keywords beyond dominant Western indexes."
  ],
  contradictions: [
    "High publication volume does not correlate with long-term citation persistence; focused, contemplative papers exhibit higher 5-year citation half-lives.",
    "Institutions mandating daily telemetry reporting observed higher early-career turnover despite reporting 'higher productivity' in annual reviews."
  ],
  trendsOverTime: [
    "2020: Focus on emergency remote collaboration and pandemic-induced research disruption.",
    "2021-2022: Proliferation of automated telemetry and productivity dashboard integration.",
    "2023-2024: Counter-movement toward calm computing, researcher wellbeing, and epistemological reflexivity."
  ],
  variableRelationships: [
    {
      varA: "Autonomy Support in Supervision",
      varB: "Doctoral Completion Rate",
      relationshipType: "Strong Positive",
      description: "Supervisors providing choice and empathetic feedback see a 42% decrease in graduate withdrawal rates."
    },
    {
      varA: "Continuous Metric Telemetry",
      varB: "Imposter Anxiety Score",
      relationshipType: "Moderate Positive",
      description: "Real-time streak counters and speed leaderboards correlate with elevated imposter syndrome symptoms."
    },
    {
      varA: "Asynchronous Work Environment",
      varB: "Deep Thought Flow State",
      relationshipType: "Strong Positive",
      description: "Eliminating immediate message response obligations triples the duration of uninterrupted scholarly focus."
    },
    {
      varA: "Gamified Word-Count Targets",
      varB: "Revision Quality & Novelty",
      relationshipType: "Weak Negative",
      description: "Arbitrary daily volume quotas encourage premature draft filling with unverified prose rather than rigorous synthesis."
    }
  ],
  underexploredAreas: [
    "Longitudinal mental health impacts of open-access publication fee pressures on independent scholars.",
    "Cognitive ergonomics of tactile/pen-based interfaces vs keyboard entry during initial manuscript conceptualization."
  ],
  chartData: [
    { label: "Qualitative Studies", value: 184, category: "Methodology" },
    { label: "Quantitative Trials", value: 246, category: "Methodology" },
    { label: "Mixed Methods", value: 128, category: "Methodology" },
    { label: "Meta-Analyses", value: 44, category: "Methodology" },
    { label: "Autonomy High Cohort", value: 89, category: "Wellbeing" },
    { label: "Autonomy Low Cohort", value: 38, category: "Wellbeing" }
  ]
};

export const DEFAULT_CRITICAL_FEEDBACK: CriticalPartnerFeedback = {
  interpretationChecked: "Open-access publication policies directly cause higher citation rates regardless of institutional reputation.",
  underpinningAssumptions: [
    "Assumes that reader discoverability is the single rate-limiting factor in academic citation decisions.",
    "Presumes that open-access repositories are equally indexed and discovered across different regional search engines.",
    "Overlooks the halo effect of prestigious author affiliations and existing citation capital."
  ],
  unstatedPremises: [
    "All academic fields place equal value on rapid preprints versus traditional closed-access peer-reviewed journals.",
    "Researchers have sufficient time to read all accessible literature rather than relying on curated journal brand signals."
  ],
  sampleOrContextLimitations: [
    "Data derived predominantly from STEM and high-energy physics where preprint culture (e.g. arXiv) has been normalized for decades.",
    "Humanities and monograph-oriented disciplines exhibit entirely different citation and readership dynamics."
  ],
  counterArgumentsToConsider: [
    "The 'Self-Selection Effect': High-achieving researchers may proactively choose open-access for their most promising, high-impact findings, creating reverse causality.",
    "Author Processing Charges (APCs) create a financial barrier where well-funded elite institutions publish more open-access, confounding the citation advantage with institutional prestige."
  ],
  constructiveReframing: "Instead of asserting a universal causal link, frame open-access as a necessary but non-sufficient catalyst whose citation multiplier is moderated by disciplinary publication norms, institutional funding backing, and preexisting author social capital.",
  secondThoughtSteps: {
    notice: "Notice the immediate appeal of attributing broad academic equity purely to open access distribution channels.",
    pause: "Pause before assuming open access alone neutralizes institutional reputation disparities.",
    question: "Question: Could wealthier universities simply afford higher open-access publishing fees, confounding the result?",
    listen: "Listen to perspectives from researchers in resource-constrained global departments regarding APC barriers.",
    reconsider: "Reconsider the causal model to treat institutional prestige and field culture as essential moderating variables.",
    choose: "Choose nuanced, qualified claims that acknowledge both the democratizing potential and the financial inequities of current OA models."
  }
};

