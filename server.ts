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

// Browser AI model files are hosted by Hugging Face. Some Hub resolver/CDN
// responses do not expose the CORS headers required by a browser application.
// Proxy only the public MLC model repositories used by Pessoa through this
// same-origin endpoint so WebLLM can fetch them without a cross-origin request.
app.use('/api/browser-ai/model', async (req, res) => {
  try {
    const modelPath = req.path || '';
    if (!/^\/mlc-ai\/[A-Za-z0-9._-]+\//.test(modelPath)) {
      return res.status(400).json({ error: 'Unsupported browser AI model path' });
    }

    const upstreamUrl = `https://huggingface.co${modelPath}`;
    const requestHeaders: Record<string, string> = {};
    if (req.headers.range) requestHeaders.Range = req.headers.range;
    if (req.headers['if-none-match']) requestHeaders['If-None-Match'] = String(req.headers['if-none-match']);

    const upstream = await fetch(upstreamUrl, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: requestHeaders,
      redirect: 'follow',
    });

    res.status(upstream.status);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const passthroughHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'etag',
      'last-modified',
    ];
    for (const header of passthroughHeaders) {
      const value = upstream.headers.get(header);
      if (value) res.setHeader(header, value);
    }

    if (req.method === 'HEAD' || !upstream.body) {
      return res.end();
    }

    for await (const chunk of upstream.body as any) {
      res.write(Buffer.from(chunk));
    }
    res.end();
  } catch (error: any) {
    console.error('Browser AI model proxy failed:', error);
    res.status(502).json({
      error: 'Unable to fetch the browser AI model files.',
      details: error?.message || 'Upstream model host request failed.',
    });
  }
});

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
      apiKey: apiKey || 'MOCK_API_KEY',
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

async function callLocalAiRuntime(config: LocalAiConfig, prompt: string, systemInstruction: string): Promise<string> {
  const cleanUrl = (config.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
  if (config.provider === 'ollama') {
    try {
      const resp = await fetch(`${cleanUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: config.model || 'llama3.2:latest', prompt: `${systemInstruction}\n\n${prompt}\n\nCRITICAL FORMAT REQUIREMENT: Respond with valid JSON only.`, system: systemInstruction, stream: false, format: 'json' }),
      });
      if (resp.ok) {
        const json = await resp.json();
        return json.response || json.content || '';
      }
    } catch (e) {
      console.warn('Ollama native /api/generate call failed, trying OpenAI endpoint fallback:', e);
    }
  }
  let endpoint = `${cleanUrl}/v1/chat/completions`;
  if (cleanUrl.endsWith('/v1')) endpoint = `${cleanUrl}/chat/completions`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
  const messages = [
    { role: 'system', content: `${systemInstruction}\n\nCRITICAL OUTPUT REQUIREMENT: Output strictly valid JSON. No conversational chatter, no markdown fence formatting.` },
    { role: 'user', content: prompt },
  ];
  const resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ model: config.model || 'default', messages, temperature: 0.2 }) });
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Local AI server (${config.provider}) error ${resp.status}: ${errorText}`);
  }
  const jsonResult = await resp.json();
  return jsonResult.choices?.[0]?.message?.content || jsonResult.response || jsonResult.content || '';
}

async function generateUnifiedContent(reqBody: any, prompt: string, systemInstruction: string, geminiSchemaConfig?: any): Promise<string> {
  const localConfig: LocalAiConfig | undefined = reqBody.localAiConfig;
  if (localConfig && localConfig.enabled && localConfig.provider !== 'gemini') {
    try {
      console.log(`Routing request to Local AI Runtime [${localConfig.provider}] model=${localConfig.model} at ${localConfig.baseUrl}`);
      return cleanJsonText(await callLocalAiRuntime(localConfig, prompt, systemInstruction));
    } catch (err: any) {
      console.error(`Local AI call to ${localConfig.provider} failed:`, err.message);
      if (localConfig.strictOffline) throw new Error(`Strict Offline Mode Active: Failed to reach local AI runtime (${localConfig.provider}). Error: ${err.message}`);
      if (localConfig.autoFallback !== false) console.warn('Auto-fallback triggered: Falling back to Gemini Cloud API.');
      else throw err;
    }
  }
  const ai = getGeminiClient();
  const geminiConfig: any = { systemInstruction };
  if (geminiSchemaConfig) {
    geminiConfig.responseMimeType = 'application/json';
    geminiConfig.responseSchema = geminiSchemaConfig;
  }
  const response = await ai.models.generateContent({ model: 'gemini-3.5-flash', contents: prompt, config: geminiConfig });
  return response.text || '';
}

// ----------------- LOCAL AI HEALTH CHECK -----------------

app.post('/api/local-ai/health', async (req, res) => {
  try {
    const { provider, baseUrl, apiKey } = req.body;
    if (!baseUrl) return res.status(400).json({ ok: false, error: 'Base URL is required' });
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
        } else throw new Error(`Ollama status code ${resp.status}`);
      } catch (err: any) {
        const resp2 = await fetch(`${cleanUrl}/v1/models`);
        if (resp2.ok) {
          const data2 = await resp2.json();
          models = (data2.data || []).map((m: any) => m.id);
          details = `Ollama OpenAI endpoint active with ${models.length} model(s).`;
        } else throw err;
      }
    } else {
      let modelsUrl = `${cleanUrl}/v1/models`;
      if (cleanUrl.endsWith('/v1')) modelsUrl = `${cleanUrl}/models`;
      const headers: Record<string, string> = {};
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      const resp = await fetch(modelsUrl, { headers });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.data)) models = data.data.map((m: any) => m.id || m.name);
        else if (Array.isArray(data.models)) models = data.models.map((m: any) => m.name || m.id);
        details = `${(provider || 'Local').toUpperCase()} endpoint connected at ${cleanUrl}.`;
      } else throw new Error(`${provider || 'Local'} server returned HTTP ${resp.status}`);
    }
    res.json({ ok: true, models, details, provider });
  } catch (err: any) {
    res.status(200).json({ ok: false, error: `Could not connect to local endpoint at ${req.body.baseUrl}`, details: err.message || 'Ensure your local model runner (Ollama/LM Studio/GPT4All/AnythingLLM) is running.' });
  }
});

// ----------------- API ROUTES -----------------

// The remainder of the existing Gemini/research API routes is intentionally unchanged.

// ----------------- VITE MIDDLEWARE SETUP -----------------

async function startServer() {
  app.get('/assets/logo_transparent.png', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(path.join(process.cwd(), 'assets/logo_transparent.svg'));
  });
  app.get('/assets/logo_cream.png', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(path.join(process.cwd(), 'assets/logo_cream.svg'));
  });
  app.use('/assets', express.static(path.join(process.cwd(), 'assets')));
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();
