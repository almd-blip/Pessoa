/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;

const RESEARCH_INTEGRITY_INSTRUCTION = `
STRICT RESEARCH INTEGRITY BOUNDARY:
- The AI MUST NEVER write, generate, or produce complete academic papers, articles, books, chapters, or formal research reports on behalf of the user. The AI is a research assistant, critical thinking partner, and analytical tool — NOT an author.
- The AI MAY assist with: organizing research materials, identifying themes and patterns, comparing arguments and perspectives, mapping literature, identifying supporting and opposing evidence, highlighting gaps and unanswered questions, suggesting possible research directions, helping structure notes and ideas, checking clarity, consistency, and logic, assisting with editing of user-written text, identifying possible biases, assumptions, or limitations, and supporting data exploration and interpretation.
- The user remains strictly responsible for forming arguments, interpreting evidence, drawing conclusions, writing original work, making scholarly judgements, and ensuring accuracy and appropriate citations.
- If asked to write a paper, article, chapter, or report, REFUSE to write the complete text. INSTEAD offer to: (a) help create a research plan, (b) identify relevant research questions, (c) review and critique the user's draft, (d) suggest areas for further investigation, or (e) provide feedback on structure and reasoning.
`;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'MOCK_API_KEY', // Fallback for safety
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// ----------------- LOCAL AI RUNTIME INFRASTRUCTURE -----------------

interface LocalAiConfig {
  enabled: boolean;
  provider: 'gemini' | 'ollama' | 'lmstudio' | 'gpt4all' | 'anythingllm' | 'custom';
  baseUrl: string;
  model: string;
  apiKey?: string;
  strictOffline?: boolean;
  autoFallback?: boolean;
}

function cleanJsonText(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  return cleaned;
}

async function callLocalAiRuntime(
  config: LocalAiConfig,
  prompt: string,
  systemInstruction: string
): Promise<string> {
  const cleanUrl = (config.baseUrl || 'http://localhost:11434').replace(/\/$/, '');

  if (config.provider === 'ollama') {
    try {
      const resp = await fetch(`${cleanUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model || 'llama3.2:latest',
          prompt: `${systemInstruction}\n\n${prompt}\n\nCRITICAL FORMAT REQUIREMENT: Respond with valid JSON only.`,
          system: systemInstruction,
          stream: false,
          format: 'json',
        }),
      });
      if (resp.ok) {
        const json = await resp.json();
        return json.response || json.content || '';
      }
    } catch (e) {
      console.warn('Ollama native /api/generate call failed, trying OpenAI endpoint fallback:', e);
    }
  }

  // OpenAI-compatible endpoint fallback (/v1/chat/completions)
  let endpoint = `${cleanUrl}/v1/chat/completions`;
  if (cleanUrl.endsWith('/v1')) {
    endpoint = `${cleanUrl}/chat/completions`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const messages = [
    {
      role: 'system',
      content: `${systemInstruction}\n\nCRITICAL OUTPUT REQUIREMENT: Output strictly valid JSON. No conversational chatter, no markdown fence formatting.`,
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model || 'default',
      messages,
      temperature: 0.2,
    }),
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Local AI server (${config.provider}) error ${resp.status}: ${errorText}`);
  }

  const jsonResult = await resp.json();
  const textOutput =
    jsonResult.choices?.[0]?.message?.content ||
    jsonResult.response ||
    jsonResult.content ||
    '';
  return textOutput;
}

/**
 * Unified AI Executor supporting Replaceable Local AI Runtimes (Ollama/LM Studio/GPT4All/AnythingLLM)
 * and Cloud Gemini.
 */
async function generateUnifiedContent(
  reqBody: any,
  prompt: string,
  systemInstruction: string,
  geminiSchemaConfig?: any
): Promise<string> {
  const localConfig: LocalAiConfig | undefined = reqBody.localAiConfig;

  if (localConfig && localConfig.enabled && localConfig.provider !== 'gemini') {
    try {
      console.log(`Routing request to Local AI Runtime [${localConfig.provider}] model=${localConfig.model} at ${localConfig.baseUrl}`);
      const rawLocalOutput = await callLocalAiRuntime(localConfig, prompt, systemInstruction);
      return cleanJsonText(rawLocalOutput);
    } catch (err: any) {
      console.error(`Local AI call to ${localConfig.provider} failed:`, err.message);

      if (localConfig.strictOffline) {
        throw new Error(`Strict Offline Mode Active: Failed to reach local AI runtime (${localConfig.provider}). Error: ${err.message}`);
      }

      if (localConfig.autoFallback !== false) {
        console.warn('Auto-fallback triggered: Falling back to Gemini Cloud API.');
      } else {
        throw err;
      }
    }
  }

  // Fallback / Standard Gemini Call
  const ai = getGeminiClient();
  const geminiConfig: any = {
    systemInstruction,
  };

  if (geminiSchemaConfig) {
    geminiConfig.responseMimeType = 'application/json';
    geminiConfig.responseSchema = geminiSchemaConfig;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: geminiConfig,
  });

  return response.text || '';
}

// ----------------- LOCAL AI HEALTH CHECK -----------------

app.post('/api/local-ai/health', async (req, res) => {
  try {
    const { provider, baseUrl, apiKey } = req.body;
    if (!baseUrl) {
      return res.status(400).json({ ok: false, error: 'Base URL is required' });
    }

    const cleanUrl = baseUrl.replace(/\/$/, '');
    let models: string[] = [];
    let details = '';

    if (provider === 'ollama') {
      try {
        const resp = await fetch(`${cleanUrl}/api/tags`);
        if (resp.ok) {
          const data = await resp.json();
          models = (data.models || []).map((m: any) => m.name || m.model);
          details = `Ollama daemon active. Detected ${models.length} model(s) installed locally.`;
        } else {
          throw new Error(`Ollama status code ${resp.status}`);
        }
      } catch (err: any) {
        const resp2 = await fetch(`${cleanUrl}/v1/models`);
        if (resp2.ok) {
          const data2 = await resp2.json();
          models = (data2.data || []).map((m: any) => m.id);
          details = `Ollama OpenAI endpoint active with ${models.length} model(s).`;
        } else {
          throw err;
        }
      }
    } else {
      let modelsUrl = `${cleanUrl}/v1/models`;
      if (cleanUrl.endsWith('/v1')) {
        modelsUrl = `${cleanUrl}/models`;
      }

      const headers: Record<string, string> = {};
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const resp = await fetch(modelsUrl, { headers });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.data)) {
          models = data.data.map((m: any) => m.id || m.name);
        } else if (Array.isArray(data.models)) {
          models = data.models.map((m: any) => m.name || m.id);
        }
        details = `${(provider || 'Local').toUpperCase()} endpoint connected at ${cleanUrl}.`;
      } else {
        throw new Error(`${provider || 'Local'} server returned HTTP ${resp.status}`);
      }
    }

    res.json({ ok: true, models, details, provider });
  } catch (err: any) {
    res.status(200).json({
      ok: false,
      error: `Could not connect to local endpoint at ${req.body.baseUrl}`,
      details: err.message || 'Ensure your local model runner (Ollama/LM Studio/GPT4All/AnythingLLM) is running.',
    });
  }
});

// ----------------- API ROUTES -----------------

// 1. Literature Intelligence API - Generate structured summary
app.post('/api/gemini/summarize', async (req, res) => {
  try {
    const { title, authors, abstract, notes } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Paper title is required' });
    }

    const ai = getGeminiClient();
    const prompt = `Perform a rigorous, objective academic analysis of the following paper:
Title: ${title}
Authors: ${authors || 'Unknown'}
Abstract/Text: ${abstract || 'No abstract provided.'}
Researcher Notes: ${notes || 'None'}

Please extract:
1. The primary research question or objective.
2. The methodologies used (empirical, quantitative, qualitative, theoretical, etc.).
3. The participants, dataset size, or subject of study.
4. The key findings and outcomes.
5. Limitations acknowledged by authors or apparent in the methodology.
6. A rating of the strength of evidence (integer from 1 to 5) with a rigorous academic justification of why this rating was given.
7. Crucial directions for future research.
8. Two key quotations from the text or abstract (or closely formulated if abstract is short).
9. Major concepts or keywords.

Strict academic integrity rule: DO NOT FABRICATE citations, references, or claims. If details are not in the text, write "Not explicitly detailed in text" instead of inventing them.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a highly rigorous, calm academic meta-researcher and librarian. Your goal is to analyze papers accurately, check evidence strength objectively, and prevent hallucination.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['researchQuestion', 'methods', 'participants', 'findings', 'limitations', 'evidenceStrength', 'evidenceExplanation', 'futureResearch', 'keyQuotations', 'majorConcepts'],
          properties: {
            researchQuestion: { type: Type.STRING },
            methods: { type: Type.STRING },
            participants: { type: Type.STRING },
            findings: { type: Type.STRING },
            limitations: { type: Type.STRING },
            evidenceStrength: { type: Type.INTEGER, description: 'Rating 1 to 5 representing strength of evidence' },
            evidenceExplanation: { type: Type.STRING },
            futureResearch: { type: Type.STRING },
            keyQuotations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            majorConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const summaryData = JSON.parse(response.text || '{}');
    res.json(summaryData);
  } catch (error: any) {
    console.error('Error in /api/gemini/summarize:', error);
    res.status(500).json({ error: error.message || 'Failed to generate structured summary' });
  }
});

// 2. Writing Companion API - Claim Checker & Supporter
app.post('/api/gemini/analyze-draft', async (req, res) => {
  try {
    const { draftText, papersInLibrary } = req.body;
    if (!draftText) {
      return res.status(400).json({ error: 'Draft text is required' });
    }

    const libraryContext = papersInLibrary && papersInLibrary.length > 0
      ? papersInLibrary.map((p: any) => `Paper ID: ${p.id}\nTitle: ${p.title}\nAuthors: ${p.authors}\nFindings: ${p.structuredSummary?.findings || 'Not analyzed yet.'}`).join('\n\n')
      : 'None available in the local library.';

    const ai = getGeminiClient();
    const prompt = `Analyze the following academic writing draft. 
Cross-reference it with the researcher's local Library Papers listed below.

Draft Text:
"""
${draftText}
"""

Local Library Papers Context:
${libraryContext}

Perform these precise, highly supportive tasks:
1. Highlight any claims in the draft that are unsupported by references or evidence.
2. Identify which papers in the researcher's local library support the claims made, referencing them by Title.
3. Identify if any papers in the researcher's local library contain contradictory or conflicting evidence compared to claims in the draft.
4. Suggest constructive outline or argumentative enhancements to make the research more cohesive.

IMPORTANT: Keep your analysis objective, deeply respectful, supportive, and trace everything back to the actual papers provided. Under no circumstances should you invent references that do not exist.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a warm, encouraging, but academically rigorous Writing Coach and supervisor. You help researchers organize their arguments, identify gaps in evidence, and cite from their existing library without pressuring them.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['unsupportedClaims', 'supportedByLibrary', 'contradictoryEvidence', 'outlineSuggestions'],
          properties: {
            unsupportedClaims: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['claimText', 'issue', 'recommendation'],
                properties: {
                  claimText: { type: Type.STRING, description: 'The exact or paraphrased claim text' },
                  issue: { type: Type.STRING, description: 'Why this claim is unsupported' },
                  recommendation: { type: Type.STRING, description: 'How the user can find or cite evidence' }
                }
              }
            },
            supportedByLibrary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['claimText', 'paperTitle', 'howItSupports'],
                properties: {
                  claimText: { type: Type.STRING },
                  paperTitle: { type: Type.STRING },
                  howItSupports: { type: Type.STRING }
                }
              }
            },
            contradictoryEvidence: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['draftClaim', 'paperTitle', 'conflictDetails'],
                properties: {
                  draftClaim: { type: Type.STRING },
                  paperTitle: { type: Type.STRING },
                  conflictDetails: { type: Type.STRING, description: 'Description of the contradictory evidence in this paper' }
                }
              }
            },
            outlineSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const analysisData = JSON.parse(response.text || '{}');
    res.json(analysisData);
  } catch (error: any) {
    console.error('Error in /api/gemini/analyze-draft:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze draft' });
  }
});

// 3. Research Advisor - Adapt to Mood & Journey State
app.post('/api/gemini/advisor', async (req, res) => {
  try {
    const { moodState, question, projectDetails } = req.body;
    if (!moodState) {
      return res.status(400).json({ error: 'Mood state is required' });
    }

    const ai = getGeminiClient();
    const prompt = `The researcher has checked in today feeling: "${moodState.toUpperCase()}".
Context of current project: ${projectDetails || 'General Academic Research'}.
Researcher's prompt/question: "${question || 'How should I tackle my work today?'}"

Provide an academic-advising style mentoring response that is:
1. Deeply supportive, reassuring, calm, and practical.
2. Adaptable to their mood (e.g., if "overwhelmed", break steps into micro-tasks; if "stuck", suggest alternative starting methods; if "doubting myself", provide gentle impostor syndrome reframing).
3. Highly scientific and evidence-informed (never therapeutic, never patronizing, always professional and humble).
4. Includes 3 specific, low-friction next actions.
5. Includes a comforting, academic reflection prompt.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an exceptional, warm, wise, and encouraging PhD Supervisor and research wellbeing companion. You help researchers handle uncertainty, reduce overwhelm, and find intellectual joy in their journeys.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['mentoringResponse', 'actionSteps', 'reflectionPrompt'],
          properties: {
            mentoringResponse: { type: Type.STRING, description: 'The paragraph of wise academic advice' },
            actionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 small, low-pressure steps'
            },
            reflectionPrompt: { type: Type.STRING, description: 'A gentle prompt for reflection' }
          }
        }
      }
    });

    const advisorData = JSON.parse(response.text || '{}');
    res.json(advisorData);
  } catch (error: any) {
    console.error('Error in /api/gemini/advisor:', error);
    res.status(500).json({ error: error.message || 'Failed to consult advisor' });
  }
});

// 4. Metadata Verifier - Automatic DOI / Citation check
app.post('/api/gemini/metadata-verify', async (req, res) => {
  try {
    const { title, authors, doi } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required for metadata verification' });
    }

    const ai = getGeminiClient();
    const prompt = `Verify, correct, and complete the metadata for the following academic work:
Title: ${title}
Provided Authors: ${authors || 'Unknown'}
Provided DOI: ${doi || 'None'}

Please provide corrected and standardized metadata based on actual academic databases. 
If the DOI is missing, identify a probable DOI or provide standard formatting. 
Flag any missing fields that are required for citation styles (such as Volume, Issue, Pages, Publisher).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an incredibly accurate academic librarian database resolver. You complete missing details like DOI, standard journal names, authors, and flag missing metadata fields.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['correctedTitle', 'correctedAuthors', 'correctedJournal', 'correctedYear', 'correctedDoi', 'missingFields', 'verificationStatus'],
          properties: {
            correctedTitle: { type: Type.STRING },
            correctedAuthors: { type: Type.STRING },
            correctedJournal: { type: Type.STRING },
            correctedYear: { type: Type.INTEGER },
            correctedDoi: { type: Type.STRING },
            missingFields: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            verificationStatus: { type: Type.STRING, description: 'Must be "verified" if complete, or "missing_metadata" otherwise' }
          }
        }
      }
    });

    const verifiedData = JSON.parse(response.text || '{}');
    res.json(verifiedData);
  } catch (error: any) {
    console.error('Error in /api/gemini/metadata-verify:', error);
    res.status(500).json({ error: error.message || 'Failed to verify metadata' });
  }
});

// 5. Connect & Synthesize Literature - Comprehensive Research Intelligence
app.post('/api/gemini/connect-literature', async (req, res) => {
  try {
    const { papers } = req.body;
    if (!papers || papers.length === 0) {
      return res.status(400).json({ error: 'At least one paper or document is required for literature analysis' });
    }

    const papersDescription = papers.map((p: any, index: number) => `Source ${index + 1}:
Title: ${p.title}
Authors: ${p.authors || 'Unknown Author'} (${p.year || 'N/A'})
Abstract / Notes: ${p.abstract || p.notes || 'None provided'}
Findings: ${p.structuredSummary?.findings || 'N/A'}
Methods: ${p.structuredSummary?.methods || 'N/A'}
Limitations: ${p.structuredSummary?.limitations || 'N/A'}`).join('\n\n');

    const ai = getGeminiClient();
    const prompt = `Perform a comprehensive Literature Analysis and Synthesis on the following collection of academic papers and reports:

${papersDescription}

Analyze this collection locally and identify:
1. Major Themes: Key thematic pillars connecting or categorizing the papers.
2. Core Concepts: Essential terms, frameworks, or constructs defined or utilized across sources.
3. Underlying Theories: Foundational theoretical frameworks or models applied.
4. Methodologies Used: Qualitative, quantitative, mixed, or theoretical methods employed (including strengths and limitations).
5. Mapped Relationships: Directed connections between entities (authors, theories, concepts, evidence, or papers). For each relationship, set relationshipType strictly to one of: 'supports', 'challenges', 'extends', 'applies', 'contrasts'. Generate multiple relationships for each relevant type across the corpus.
6. Schools of Thought: Distinct academic paradigms or perspectives identified across authors.
7. Agreements & Disagreements: Synthesis of consensus vs friction points.
8. Distinguish between Established Findings, Emerging Debates, and Unresolved Questions.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite academic synthesizer. You extract major themes, concepts, theories, methodologies, and directed relationships between authors, ideas, and evidence.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'agreements',
            'disagreements',
            'majorThemes',
            'coreConcepts',
            'underlyingTheories',
            'methodologiesUsed',
            'mappedRelationships',
            'schoolsOfThought',
            'establishedFindings',
            'emergingDebates',
            'unresolvedQuestions'
          ],
          properties: {
            agreements: { type: Type.STRING },
            disagreements: { type: Type.STRING },
            majorThemes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['name', 'description', 'linkedPapers', 'keyConcepts'],
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  linkedPapers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            coreConcepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['concept', 'definition', 'usageInLiterature', 'linkedThemes'],
                properties: {
                  concept: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  usageInLiterature: { type: Type.STRING },
                  linkedThemes: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            underlyingTheories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['theoryName', 'corePremise', 'keyProponents', 'applicationContext'],
                properties: {
                  theoryName: { type: Type.STRING },
                  corePremise: { type: Type.STRING },
                  keyProponents: { type: Type.STRING },
                  applicationContext: { type: Type.STRING }
                }
              }
            },
            methodologiesUsed: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['methodologyName', 'type', 'description', 'strengths', 'limitations'],
                properties: {
                  methodologyName: { type: Type.STRING },
                  type: { type: Type.STRING },
                  description: { type: Type.STRING },
                  strengths: { type: Type.STRING },
                  limitations: { type: Type.STRING }
                }
              }
            },
            mappedRelationships: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['source', 'target', 'relationshipType', 'explanation'],
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  relationshipType: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                }
              }
            },
            schoolsOfThought: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['schoolName', 'coreTenet', 'keyAuthors', 'distinguishingAssumptions'],
                properties: {
                  schoolName: { type: Type.STRING },
                  coreTenet: { type: Type.STRING },
                  keyAuthors: { type: Type.STRING },
                  distinguishingAssumptions: { type: Type.STRING }
                }
              }
            },
            establishedFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
            emergingDebates: { type: Type.ARRAY, items: { type: Type.STRING } },
            unresolvedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const connectionsData = JSON.parse(response.text || '{}');
    res.json(connectionsData);
  } catch (error: any) {
    console.error('Error in /api/gemini/connect-literature:', error);
    res.status(500).json({ error: error.message || 'Failed to synthesize literature' });
  }
});

// 6. AI Assistant General Chat Route
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, history, customGuidance } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGeminiClient();
    
    // Construct contents matching GoogleGenAI format
    const formattedHistory = (history || []).map((h: any) => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text || '' }]
    }));
    
    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: message }] }
    ];

    const systemInstruction = `You are an exceptional, wise, encouraging, and academically rigorous PhD supervisor and scholarly research companion. 
Your goal is to guide the researcher on their academic journey with clarity, compassion, and structured thinking.
Maintain strict academic integrity. Always remain supportive, practical, calming, and non-shaming. 

${RESEARCH_INTEGRITY_INSTRUCTION}
${customGuidance ? `\nAdditional researcher directives:\n${customGuidance}` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    res.status(500).json({ error: error.message || 'Failed to chat with AI companion' });
  }
});

// 7. Research Intelligence Layer - Evidence Mapping
app.post('/api/gemini/research-intelligence/evidence-map', async (req, res) => {
  try {
    const { researchQuestion, papers, query } = req.body;
    if (!researchQuestion) {
      return res.status(400).json({ error: 'Research question is required' });
    }

    const papersCtx = (papers || []).map((p: any) => 
      `Title: ${p.title} | Authors: ${p.authors} | Year: ${p.year} | Findings: ${p.structuredSummary?.findings || p.abstract || p.notes || 'N/A'} | Methods: ${p.structuredSummary?.methods || 'N/A'} | Limitations: ${p.structuredSummary?.limitations || 'N/A'}`
    ).join('\n');

    const ai = getGeminiClient();
    const prompt = `Perform an Evidence Mapping Analysis for the Research Question: "${researchQuestion}".
${query ? `Specific user query focus: "${query}"` : ''}

Available local library sources:
${papersCtx || 'No library sources provided.'}

Extract and organize:
1. Supporting literature (papers, citations, key points, strength).
2. Opposing or challenging literature (papers, key counter-points, limitations).
3. Methodological strengths across the corpus.
4. Methodological limitations across the corpus.
5. Major areas of consensus.
6. Major areas of disagreement.
7. Critical evidence gaps remaining in this literature.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an evidence synthesis expert. You objectively evaluate literature evidence strength, map support vs challenge, and highlight evidence gaps.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['researchQuestion', 'supportingLiterature', 'opposingLiterature', 'methodologicalStrengths', 'methodologicalLimitations', 'areasOfConsensus', 'areasOfDisagreement', 'evidenceGaps'],
          properties: {
            researchQuestion: { type: Type.STRING },
            supportingLiterature: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['paperTitle', 'keyPoints', 'strength'],
                properties: {
                  paperTitle: { type: Type.STRING },
                  keyPoints: { type: Type.STRING },
                  strength: { type: Type.STRING }
                }
              }
            },
            opposingLiterature: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['paperTitle', 'keyPoints', 'limitation'],
                properties: {
                  paperTitle: { type: Type.STRING },
                  keyPoints: { type: Type.STRING },
                  limitation: { type: Type.STRING }
                }
              }
            },
            methodologicalStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            methodologicalLimitations: { type: Type.ARRAY, items: { type: Type.STRING } },
            areasOfConsensus: { type: Type.ARRAY, items: { type: Type.STRING } },
            areasOfDisagreement: { type: Type.ARRAY, items: { type: Type.STRING } },
            evidenceGaps: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/gemini/research-intelligence/evidence-map:', error);
    res.status(500).json({ error: error.message || 'Failed to generate evidence map' });
  }
});

// 8. Research Intelligence Layer - Research Question Development
app.post('/api/gemini/research-intelligence/question-development', async (req, res) => {
  try {
    const { topic, contextNote } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const ai = getGeminiClient();
    const prompt = `Help refine the broad research topic into precise, answerable research questions.
Topic: "${topic}"
Additional Context / Domain Notes: "${contextNote || 'None provided'}"

For this topic:
1. Refine broad topic into 3-4 specific researchable questions.
2. For each question, explain WHY it matters, WHAT specific gap in knowledge it addresses, and whether it is realistically answerable versus purely theoretical.
3. Identify overlooked communities, geographical contexts, socio-cultural angles, or unexamined variables.
4. Suggest alternative interdisciplinary perspectives (e.g., historical, structural, behavioral, economic).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a senior academic advisor specializing in research design and problem formulation. You explain why questions matter and what knowledge gap they address.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['originalTopic', 'refinedQuestions', 'overlookedContextsOrVariables', 'suggestedAlternativePerspectives'],
          properties: {
            originalTopic: { type: Type.STRING },
            refinedQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['questionText', 'whyItMatters', 'gapAddressed', 'isAnswerable'],
                properties: {
                  questionText: { type: Type.STRING },
                  whyItMatters: { type: Type.STRING },
                  gapAddressed: { type: Type.STRING },
                  isAnswerable: { type: Type.BOOLEAN }
                }
              }
            },
            overlookedContextsOrVariables: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedAlternativePerspectives: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/gemini/research-intelligence/question-development:', error);
    res.status(500).json({ error: error.message || 'Failed to refine research questions' });
  }
});

// 9. Research Intelligence Layer - Pattern & Data Analysis
app.post('/api/gemini/research-intelligence/data-pattern-analysis', async (req, res) => {
  try {
    const { rawData, datasetName, literatureSummary } = req.body;
    if (!rawData && !literatureSummary) {
      return res.status(400).json({ error: 'Data or literature text is required' });
    }

    const ai = getGeminiClient();
    const prompt = `Perform descriptive pattern and dataset analysis.
Dataset / Text Title: "${datasetName || 'Structured Research Input'}"

Input Content:
"""
${rawData || literatureSummary || ''}
"""

Analyze for:
1. Executive summary of dataset or corpus findings in clear, accessible language.
2. Recurring themes or data patterns.
3. Unexpected connections or counter-intuitive correlations.
4. Contradictions or anomalies in data.
5. Trends over time or progression across subsets.
6. Relationships between variables (Variable A, Variable B, relationship type, description).
7. Underexplored areas or missing data dimensions.
8. Generate 4-6 chart data points (label, numeric value, category) to visualize main distributions or themes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a quantitative and qualitative data intelligence specialist. You identify patterns, anomalies, and variable relationships, explaining them clearly.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['summary', 'recurringThemes', 'unexpectedConnections', 'contradictions', 'trendsOverTime', 'variableRelationships', 'underexploredAreas', 'chartData'],
          properties: {
            summary: { type: Type.STRING },
            recurringThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            unexpectedConnections: { type: Type.ARRAY, items: { type: Type.STRING } },
            contradictions: { type: Type.ARRAY, items: { type: Type.STRING } },
            trendsOverTime: { type: Type.ARRAY, items: { type: Type.STRING } },
            variableRelationships: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['varA', 'varB', 'relationshipType', 'description'],
                properties: {
                  varA: { type: Type.STRING },
                  varB: { type: Type.STRING },
                  relationshipType: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            },
            underexploredAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            chartData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['label', 'value'],
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  category: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/gemini/research-intelligence/data-pattern-analysis:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze data patterns' });
  }
});

// 10. Research Intelligence Layer - Critical Research Partner Mode
app.post('/api/gemini/research-intelligence/critical-partner', async (req, res) => {
  try {
    const { statementOrClaim, researchContext } = req.body;
    if (!statementOrClaim) {
      return res.status(400).json({ error: 'Statement or claim is required' });
    }

    const ai = getGeminiClient();
    const prompt = `Act as a constructive critical colleague and scholarly peer reviewer.
Evaluate this hypothesis, conclusion, or research statement:
"${statementOrClaim}"

Context / Background: ${researchContext || 'General academic inquiry'}

Before accepting this conclusion:
1. Identify the specific unstated assumptions underpinning this interpretation.
2. Highlight unstated premises or implicit biases.
3. Point out sample size, geographic, or context limitations that affect generalizability.
4. Formulate strong counter-arguments or alternative explanations to consider.
5. Offer a constructive reframing that strengthens the intellectual rigor of the claim.
6. Walk through the 'Second Thought Framework':
   - Notice: what premise was taken for granted?
   - Pause: why slow down before accepting this?
   - Question: what critical question needs testing?
   - Listen: what alternative viewpoint is speaking?
   - Reconsider: how does the hypothesis evolve?
   - Choose: what is the most defensible choice?`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a constructive, highly respectful, but sharp academic critical colleague. You challenge assumptions, test sample boundaries, and help researchers strengthen their work through constructive questioning.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['interpretationChecked', 'underpinningAssumptions', 'unstatedPremises', 'sampleOrContextLimitations', 'counterArgumentsToConsider', 'constructiveReframing', 'secondThoughtSteps'],
          properties: {
            interpretationChecked: { type: Type.STRING },
            underpinningAssumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
            unstatedPremises: { type: Type.ARRAY, items: { type: Type.STRING } },
            sampleOrContextLimitations: { type: Type.ARRAY, items: { type: Type.STRING } },
            counterArgumentsToConsider: { type: Type.ARRAY, items: { type: Type.STRING } },
            constructiveReframing: { type: Type.STRING },
            secondThoughtSteps: {
              type: Type.OBJECT,
              required: ['notice', 'pause', 'question', 'listen', 'reconsider', 'choose'],
              properties: {
                notice: { type: Type.STRING },
                pause: { type: Type.STRING },
                question: { type: Type.STRING },
                listen: { type: Type.STRING },
                reconsider: { type: Type.STRING },
                choose: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/gemini/research-intelligence/critical-partner:', error);
    res.status(500).json({ error: error.message || 'Failed critical partner evaluation' });
  }
});


// 11. Creative & Publishing Workspace - Reflective AI Review
app.post('/api/gemini/publishing/reflective-review', async (req, res) => {
  try {
    const { draftText, targetAudience, papersInLibrary } = req.body;
    if (!draftText) {
      return res.status(400).json({ error: 'Draft text is required for reflective review' });
    }

    const libraryContext = Array.isArray(papersInLibrary)
      ? papersInLibrary.map((p: any) => `- "${p.title}" by ${p.authors} (${p.year})`).join('\n')
      : 'No reference library papers provided';

    const prompt = `Perform a constructive, reflective review of the following author-written text.

CRITICAL MANDATE:
Do NOT rewrite the author's work or generate replacement text. Your goal is to support human authorship by providing reflective critique, asking probing questions, identifying gaps, and offering suggestions.

Draft Text:
"""
${draftText}
"""

Target Audience: ${targetAudience || 'Academic Journal'}
Available Literature Library Context:
${libraryContext}

Evaluate for:
1. Human Authorship Confirmation: Brief statement celebrating the human author's voice and explaining how this feedback supports their agency.
2. Readability & Tone: Feedback on prose flow, sentence complexity, and suitability for the target audience.
3. Reflective Questions: 3-5 thought-provoking, constructive questions that prompt the author to clarify assumptions, specify mechanisms, or deepen arguments.
4. Terminology Inconsistencies: Highlight conflicting or ambiguous terms used in the draft.
5. Reasoning Gaps: Point out logical leaps, unstated assumptions, or claims that require stronger evidentiary backing.
6. Accessibility & Plain Language: Advice on making complex concepts clearer without losing precision.
7. Literature & Citation Alignment: Assessment of how well claims align with or could be strengthened by the user's reference library.`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an empathetic, intellectually rigorous scholarly editor and writing mentor. You NEVER overwrite or generate full author prose. You guide human authors with reflective questions, logic checks, and editorial critique.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'humanAuthorshipConfirmation',
            'readabilityFeedback',
            'reflectiveQuestions',
            'terminologyInconsistencies',
            'reasoningGaps',
            'accessibilitySuggestions',
            'literatureAlignment'
          ],
          properties: {
            humanAuthorshipConfirmation: { type: Type.STRING },
            readabilityFeedback: { type: Type.STRING },
            reflectiveQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            terminologyInconsistencies: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            reasoningGaps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            accessibilitySuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            literatureAlignment: { type: Type.STRING }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/gemini/publishing/reflective-review:', error);
    res.status(500).json({ error: error.message || 'Failed to conduct reflective review' });
  }
});

// 12. Creative & Publishing Workspace - Publisher & Format Guidance
app.post('/api/gemini/publishing/format-guidance', async (req, res) => {
  try {
    const { targetVenue, publicationType } = req.body;

    const prompt = `Provide publishing preparation guidance and compliance recommendations for manuscript submission.

Target Publisher / Journal / Venue: "${targetVenue || 'Open Access Monograph'}"
Publication Type: "${publicationType || 'Journal Article'}"

Provide:
1. Recommended manuscript structure (Front Matter, Main Body, Back Matter).
2. Key formatting guidelines (font styles, line spacing, headings hierarchy, citation style, abstract limits).
3. Publisher compliance checklist (ORCID, Open Access licensing, ethics statement, data availability statement, figure requirements).
4. Accessibility preparation checklist (Alt-text for images, heading hierarchy, PDF/UA compliance, readable font choices).
5. Open-source tool advice (LibreOffice Writer, ONLYOFFICE, Pandoc/Markdown tips).`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an open-access scholarly publisher and editorial consultant. You provide clear, practical submission and formatting guidelines tailored for open-source workflows.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['recommendedStructure', 'formattingGuidelines', 'complianceChecklist', 'accessibilityChecklist', 'openSourceToolAdvice'],
          properties: {
            recommendedStructure: { type: Type.ARRAY, items: { type: Type.STRING } },
            formattingGuidelines: { type: Type.ARRAY, items: { type: Type.STRING } },
            complianceChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
            accessibilityChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
            openSourceToolAdvice: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/gemini/publishing/format-guidance:', error);
    res.status(500).json({ error: error.message || 'Failed to generate publisher guidance' });
  }
});


// 13. Creative & Publishing Workspace - Paragraph-Level Logic Gap Detector
app.post('/api/gemini/publishing/paragraph-logic-gap', async (req, res) => {
  try {
    const { selectedParagraph, fullDraftContext, papersInLibrary } = req.body;
    if (!selectedParagraph || typeof selectedParagraph !== 'string' || !selectedParagraph.trim()) {
      return res.status(400).json({ error: 'A valid selected paragraph is required for logic gap analysis.' });
    }

    const libraryContext = Array.isArray(papersInLibrary) && papersInLibrary.length > 0
      ? papersInLibrary.map((p: any) => `- "${p.title}" by ${p.authors} (${p.year}): ${p.summary || p.abstract || 'Reference'}`).join('\n')
      : 'No reference library papers provided';

    const prompt = `Analyze the following SPECIFIC PARAGRAPH from an author's manuscript draft to detect logic gaps, coherence issues, and evidential support needs.

CRITICAL DIRECTIVE:
You are a critical thinking partner and scholarly writing mentor. You MUST NOT rewrite the paragraph or supply replacement prose. Your sole purpose is to ask reflective, probing questions that help the author recognize missing links, unbacked assertions, or logical leaps.

SELECTED PARAGRAPH TO EVALUATE:
"""
${selectedParagraph}
"""

FULL DRAFT CONTEXT (for surrounding coherence):
"""
${fullDraftContext || 'Not provided'}
"""

AVAILABLE REFERENCE LIBRARY:
${libraryContext}

Evaluate this paragraph for:
1. Core Assertion: A concise 1-sentence summary of what this paragraph asserts.
2. Coherence Rating: "High Coherence", "Moderate - Minor Leaps", or "Requires Logical Tightening".
3. Identified Logic Gaps: Specific logical leaps, unstated premises, or abrupt transitions within or into this paragraph.
4. Evidential Support Needs: Claims made in this paragraph that require empirical citations, data, or logical justification.
5. Reflective Questions for the Author: 3-4 specific, thought-provoking questions that guide the author to reflect on, clarify, or deepen their reasoning.
6. Library References to Consider: Relevant titles or authors from the available reference library that could support or connect with this paragraph's assertions.`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a scholarly peer-reviewer and critical logic coach. You evaluate user paragraphs for logical coherence, evidential backing, and implicit assumptions. You ask deep, reflective questions that honor human authorship.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'coreAssertion',
            'coherenceRating',
            'identifiedLogicGaps',
            'evidentialSupportNeeds',
            'reflectiveQuestions',
            'libraryReferencesToConsider'
          ],
          properties: {
            coreAssertion: { type: Type.STRING },
            coherenceRating: { type: Type.STRING },
            identifiedLogicGaps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            evidentialSupportNeeds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            reflectiveQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            libraryReferencesToConsider: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/gemini/publishing/paragraph-logic-gap:', error);
    res.status(500).json({ error: error.message || 'Failed to perform paragraph logic gap analysis' });
  }
});


// 14. Creative & Publishing Workspace - Comprehensive Editorial Support & Writing Quality API
app.post('/api/gemini/publishing/repetition-and-fragments', async (req, res) => {
  try {
    const { draftText } = req.body;
    if (!draftText || typeof draftText !== 'string' || !draftText.trim()) {
      return res.status(400).json({ error: 'Draft text is required for editorial awareness scan.' });
    }

    const prompt = `Perform a comprehensive editorial awareness scan of the following manuscript draft to empower the human author to refine their own writing.

CRITICAL MANDATE:
Do NOT rewrite the author's prose or supply replacement paragraphs. Your sole role is an insightful editorial mentor: point out issues, explain why they affect clarity/flow, and ask reflective prompts that invite the author to make their own decisions.

ANALYZE THE DRAFT FOR:
1. REPETITION SPOTTER:
   - Repeated key words and phrases occurring too close together.
   - Repeated ideas, arguments, or concepts across sections that appear multiple times without further development.
2. UNFINISHED SENTENCE SPOTTER:
   - Incomplete sentences, dangling clauses, missing terminal punctuation, interrupted thoughts, or unfinished paragraphs.
3. ADDITIONAL WRITING AWARENESS:
   - Unclear or overly complex sentences (convoluted syntax, excessive clauses).
   - Abrupt transitions between paragraphs or ideas.
   - Inconsistent terminology and potential accessibility/readability issues for a broad scholarly or general audience.

MANUSCRIPT DRAFT TO SCAN:
"""
${draftText}
"""`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a master scholarly editor and writing quality coach. You identify repetitions, incomplete thoughts, and clarity issues without ever overwriting the human author’s voice.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'editorialSummaryNote',
            'repeatedWordsAndPhrases',
            'repeatedIdeasAndConcepts',
            'unfinishedSentencesAndFragments',
            'unclearOrComplexSentences',
            'abruptTransitions',
            'accessibilityAndTermConsistency'
          ],
          properties: {
            editorialSummaryNote: { type: Type.STRING },
            repeatedWordsAndPhrases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['wordOrPhrase', 'locations', 'clarityImpact', 'suggestionForUser'],
                properties: {
                  wordOrPhrase: { type: Type.STRING },
                  locations: { type: Type.STRING },
                  clarityImpact: { type: Type.STRING },
                  suggestionForUser: { type: Type.STRING }
                }
              }
            },
            repeatedIdeasAndConcepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['concept', 'locations', 'whyItAffectsClarity', 'reflectiveQuestion'],
                properties: {
                  concept: { type: Type.STRING },
                  locations: { type: Type.STRING },
                  whyItAffectsClarity: { type: Type.STRING },
                  reflectiveQuestion: { type: Type.STRING }
                }
              }
            },
            unfinishedSentencesAndFragments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['fragmentText', 'location', 'problemInterpretation', 'userCompletionPrompt'],
                properties: {
                  fragmentText: { type: Type.STRING },
                  location: { type: Type.STRING },
                  problemInterpretation: { type: Type.STRING },
                  userCompletionPrompt: { type: Type.STRING }
                }
              }
            },
            unclearOrComplexSentences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['sentenceText', 'location', 'complexityIssue', 'reflectionPrompt'],
                properties: {
                  sentenceText: { type: Type.STRING },
                  location: { type: Type.STRING },
                  complexityIssue: { type: Type.STRING },
                  reflectionPrompt: { type: Type.STRING }
                }
              }
            },
            abruptTransitions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['transitionLocation', 'issueDescription', 'smoothingQuestion'],
                properties: {
                  transitionLocation: { type: Type.STRING },
                  issueDescription: { type: Type.STRING },
                  smoothingQuestion: { type: Type.STRING }
                }
              }
            },
            accessibilityAndTermConsistency: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['termOrPhrase', 'issueType', 'accessibilityNote', 'suggestion'],
                properties: {
                  termOrPhrase: { type: Type.STRING },
                  issueType: { type: Type.STRING },
                  accessibilityNote: { type: Type.STRING },
                  suggestion: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/gemini/publishing/repetition-and-fragments:', error);
    res.status(500).json({ error: error.message || 'Failed to spot repetitions and unfinished sentences' });
  }
});

// 15. Creative & Publishing Workspace - Document Import & Extraction Endpoint
app.post('/api/gemini/publishing/extract-document-text', async (req, res) => {
  try {
    const { rawContent, fileName, mimeType } = req.body;
    if (!rawContent || typeof rawContent !== 'string') {
      return res.status(400).json({ error: 'Document content or file data is required.' });
    }

    // If it's already clean plain text or markdown, return immediately
    const isCleanText = !rawContent.includes('\u0000') && !/PK\u0003\u0004/.test(rawContent);
    if (isCleanText && rawContent.length < 15000) {
      return res.json({
        extractedText: rawContent,
        title: fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Imported Document',
        summary: `Successfully imported plain document text (${rawContent.split(/\s+/).length} words).`
      });
    }

    // For raw binary / docx / pdf dumps, use Gemini to clean and structure into clean Markdown prose
    const prompt = `You are a document conversion assistant. Clean up and extract the full readable body text from this document stream ("${fileName || 'Document'}"). Remove control characters, binary artifacts, or formatting corruption while preserving headings, paragraphs, bullet points, and human prose intact.

DOCUMENT INPUT / STREAM:
"""
${rawContent.substring(0, 30000)}
"""

Provide your output in JSON format:
1. extractedText: Clean, readable text/markdown of the full document content.
2. title: Appropriate document title inferred from content or filename.
3. summary: A brief 1-2 sentence description of what this document contains.`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert document text parser. You extract clean, uncorrupted plain text and Markdown from raw uploaded documents.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['extractedText', 'title', 'summary'],
          properties: {
            extractedText: { type: Type.STRING },
            title: { type: Type.STRING },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/gemini/publishing/extract-document-text:', error);
    res.status(500).json({ error: error.message || 'Failed to extract document text' });
  }
});

// 16. Funding & Grants - AI Criteria & Proposal Assessment Endpoint
app.post('/api/gemini/funding/assess-proposal', async (req, res) => {
  try {
    const { criteria, questions, documentResponse, funderName } = req.body;
    if (!documentResponse || typeof documentResponse !== 'string' || !documentResponse.trim()) {
      return res.status(400).json({ error: 'Document response text is required for proposal assessment.' });
    }

    const criteriaText = Array.isArray(criteria) ? criteria.join('\n- ') : (criteria || 'Standard Funder Rigour, Innovation, Feasibility, and Impact criteria');
    const questionsText = Array.isArray(questions) ? questions.join('\n- ') : (questions || 'Standard Proposal Objectives, Methodology, Outreach & Impact, and Budget Justification');

    const prompt = `Perform an in-depth academic grant proposal assessment evaluating the provided draft document against the funder's criteria and application questions.

FUNDER / SCHEME: "${funderName || 'General Research Funding Body'}"

FUNDER CRITERIA & BENCHMARKS:
"""
${criteriaText}
"""

APPLICATION FORM QUESTIONS:
"""
${questionsText}
"""

CANDIDATE DRAFT / DOCUMENT RESPONSE TO ASSESS:
"""
${documentResponse}
"""

Evaluate systematically for:
1. OVERALL ADHERENCE (0-100 score, holistic appraisal, and executive verdict).
2. QUESTION-BY-QUESTION ADHERENCE, STRENGTH & RELEVANCE:
   - Did the draft answer the funder's exact question?
   - How robust and strong is the scholarly argument?
   - How relevant is the provided content to what the funder requested?
   - What specific elements or evidence are missing?
   - What is the concrete recommendation to strengthen this response?
3. CRITERIA COMPLIANCE (Compliant, Partially Met, Non-Compliant with direct citations from the draft).
4. CORE STRENGTHS: Highlights where the draft excels.
5. CRITICAL GAPS & RISKS: Specific blindspots, unbacked assertions, or missing compliance items that could lead to rejection.
6. ACTIONABLE REVISION ROADMAP: Sequential checklist of concrete editorial and evidential enhancements for the researcher.`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a veteran grant review panel chair and expert evaluator. You assess research proposals with rigorous objectivity, highlighting exact adherence to funder requirements, evidential strength, and thematic relevance without overwriting the author voice.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'overallAdherenceScore',
            'adherenceVerdict',
            'overallSummary',
            'questionAssessments',
            'criteriaCompliance',
            'coreStrengths',
            'criticalGapsAndRisks',
            'revisionChecklist'
          ],
          properties: {
            overallAdherenceScore: { type: Type.NUMBER },
            adherenceVerdict: { type: Type.STRING },
            overallSummary: { type: Type.STRING },
            questionAssessments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['question', 'adherence', 'strengthRating', 'relevanceRating', 'findings', 'missingElements', 'recommendation'],
                properties: {
                  question: { type: Type.STRING },
                  adherence: { type: Type.STRING, description: 'Must be "Full", "Partial", or "Missing"' },
                  strengthRating: { type: Type.STRING, description: 'Must be "High", "Moderate", or "Low"' },
                  relevanceRating: { type: Type.STRING, description: 'Must be "High", "Moderate", or "Low"' },
                  findings: { type: Type.STRING },
                  missingElements: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recommendation: { type: Type.STRING }
                }
              }
            },
            criteriaCompliance: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['criterion', 'status', 'evidence', 'recommendations'],
                properties: {
                  criterion: { type: Type.STRING },
                  status: { type: Type.STRING, description: 'Must be "Compliant", "Partially Met", or "Non-Compliant"' },
                  evidence: { type: Type.STRING },
                  recommendations: { type: Type.STRING }
                }
              }
            },
            coreStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            criticalGapsAndRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
            revisionChecklist: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/gemini/funding/assess-proposal:', error);
    res.status(500).json({ error: error.message || 'Failed to assess grant proposal' });
  }
});

// ----------------- VITE MIDDLEWARE SETUP -----------------

async function startServer() {
  // Map .png calls to high fidelity vector SVG logos with proper Content-Type
  app.get('/assets/logo_transparent.png', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(path.join(process.cwd(), 'assets/logo_transparent.svg'));
  });

  app.get('/assets/logo_cream.png', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(path.join(process.cwd(), 'assets/logo_cream.svg'));
  });

  // Serve assets folder statically
  app.use('/assets', express.static(path.join(process.cwd(), 'assets')));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
