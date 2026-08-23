import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function replaceOnce(filePath, find, replacement, label) {
  const absolute = path.join(root, filePath);
  let source = fs.readFileSync(absolute, 'utf8');
  if (source.includes(replacement)) return false;
  if (!source.includes(find)) {
    throw new Error(`Could not find ${label} in ${filePath}`);
  }
  source = source.replace(find, replacement);
  fs.writeFileSync(absolute, source, 'utf8');
  console.log(`Prepared ${filePath}: ${label}`);
  return true;
}

// Production Cloudflare deployment uses the bundled Express server. Add a
// same-origin model proxy without modifying any existing Gemini/API routes.
const proxyMarker = "// ----------------- BROWSER AI MODEL PROXY -----------------";
const proxyRoute = `${proxyMarker}\napp.use('/api/browser-ai/model', async (req, res) => {\n  try {\n    if (req.method === 'OPTIONS') {\n      res.setHeader('Access-Control-Allow-Origin', '*');\n      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');\n      res.setHeader('Access-Control-Allow-Headers', 'Range, If-Range, If-None-Match, Cache-Control, Content-Type');\n      res.setHeader('Access-Control-Max-Age', '86400');\n      return res.status(204).end();\n    }\n\n    if (req.method !== 'GET' && req.method !== 'HEAD') {\n      return res.status(405).set('Allow', 'GET, HEAD, OPTIONS').end();\n    }\n\n    const modelPath = req.path || '';\n    if (!/^\\/mlc-ai\\/[A-Za-z0-9._-]+(?:\\/.*)?$/.test(modelPath)) {\n      return res.status(400).json({ error: 'Unsupported browser AI model path' });\n    }\n\n    const upstreamUrl = \\`https://huggingface.co\\${modelPath}\\${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}\\`;\n    const requestHeaders = {};\n    for (const name of ['range', 'if-range', 'if-none-match', 'if-modified-since', 'cache-control']) {\n      const value = req.headers[name];\n      if (value) requestHeaders[name] = String(value);\n    }\n\n    const upstream = await fetch(upstreamUrl, {\n      method: req.method,\n      headers: requestHeaders,\n      redirect: 'follow',\n    });\n\n    res.status(upstream.status);\n    res.setHeader('Access-Control-Allow-Origin', '*');\n    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');\n    res.setHeader('Access-Control-Allow-Headers', 'Range, If-Range, If-None-Match, Cache-Control, Content-Type');\n    res.setHeader('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Length, Content-Range, ETag, Last-Modified, Content-Type');\n\n    const passthroughHeaders = [\n      'content-type',\n      'content-length',\n      'content-range',\n      'accept-ranges',\n      'etag',\n      'last-modified',\n      'cache-control',\n    ];\n    for (const header of passthroughHeaders) {\n      const value = upstream.headers.get(header);\n      if (value) res.setHeader(header, value);\n    }\n\n    if (req.method === 'HEAD' || !upstream.body) return res.end();\n\n    const reader = upstream.body.getReader();\n    try {\n      while (true) {\n        const { done, value } = await reader.read();\n        if (done) break;\n        res.write(Buffer.from(value));\n      }\n    } finally {\n      reader.releaseLock();\n    }\n    res.end();\n  } catch (error) {\n    console.error('Browser AI model proxy failed:', error);\n    if (!res.headersSent) {\n      res.status(502).json({\n        error: 'Unable to fetch the browser AI model files.',\n        details: error?.message || 'Upstream model host request failed.',\n      });\n    } else {\n      res.end();\n    }\n  }\n});\n\n`;

replaceOnce(
  'server.ts',
  "app.use(express.json());\n\n",
  "app.use(express.json());\n\n${proxyRoute}",
  'same-origin browser AI model proxy'
);

// Do not show the success step after a failed download. Keep retry available.
const guidedPath = path.join(root, 'src/components/GuidedAISetup.tsx');
let guided = fs.readFileSync(guidedPath, 'utf8');
const oldReady = `              <SetupStep number={4} title="You're ready"><p><strong>Your AI model is ready.</strong> Pessoa can now use it directly in your browser. Processing happens on your device.</p></SetupStep>`;
const newReady = `              {downloadState === 'error' && <div className="space-y-2"><p className="text-sm font-semibold" style={{ color: burgundy }}>The model could not be downloaded.</p><p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">Please check your internet connection and try again.</p><button type="button" onClick={downloadBrowserModel} className="min-h-10 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: teal }}>Try again</button></div>}\n              {downloadState === 'ready' && <SetupStep number={4} title="You're ready"><p><strong>Your AI model is ready.</strong> Pessoa can now use it directly in your browser. Processing happens on your device.</p></SetupStep>}`;
if (!guided.includes(newReady)) {
  if (!guided.includes(oldReady)) throw new Error('Could not find the browser AI success state in GuidedAISetup.tsx');
  guided = guided.replace(oldReady, newReady);
  fs.writeFileSync(guidedPath, guided, 'utf8');
  console.log('Prepared GuidedAISetup.tsx: hide success state after failed download and add retry');
}
