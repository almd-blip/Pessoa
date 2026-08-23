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
const proxyMarker = '// ----------------- BROWSER AI MODEL PROXY -----------------';
const proxyRoute = `${proxyMarker}
app.use('/api/browser-ai/model', async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, If-Range, If-None-Match, Cache-Control, Content-Type');
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(204).end();
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res.status(405).set('Allow', 'GET, HEAD, OPTIONS').end();
    }

    const modelPath = req.path || '';
    if (!/^\\/mlc-ai\\/[A-Za-z0-9._-]+(?:\\/.*)?$/.test(modelPath)) {
      return res.status(400).json({ error: 'Unsupported browser AI model path' });
    }

    const upstreamUrl = 'https://huggingface.co' + modelPath;
    const requestHeaders = {};
    for (const name of ['range', 'if-range', 'if-none-match', 'if-modified-since', 'cache-control']) {
      const value = req.headers[name];
      if (value) requestHeaders[name] = String(value);
    }

    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers: requestHeaders,
      redirect: 'follow',
    });

    res.status(upstream.status);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, If-Range, If-None-Match, Cache-Control, Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Length, Content-Range, ETag, Last-Modified, Content-Type');

    const passthroughHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'etag',
      'last-modified',
      'cache-control',
    ];
    for (const header of passthroughHeaders) {
      const value = upstream.headers.get(header);
      if (value) res.setHeader(header, value);
    }

    if (req.method === 'HEAD' || !upstream.body) return res.end();

    const reader = upstream.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    } finally {
      reader.releaseLock();
    }
    res.end();
  } catch (error) {
    console.error('Browser AI model proxy failed:', error);
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Unable to fetch the browser AI model files.',
        details: error?.message || 'Upstream model host request failed.',
      });
    } else {
      res.end();
    }
  }
});

`;

replaceOnce(
  'server.ts',
  'app.use(express.json());\n\n',
  `app.use(express.json());\n\n${proxyRoute}`,
  'same-origin browser AI model proxy'
);

// Do not show the success step after a failed download. Keep retry available.
const guidedPath = path.join(root, 'src/components/GuidedAISetup.tsx');
let guided = fs.readFileSync(guidedPath, 'utf8');
const oldReady = `              <SetupStep number={4} title="You're ready"><p><strong>Your AI model is ready.</strong> Pessoa can now use it directly in your browser. Processing happens on your device.</p></SetupStep>`;
const newReady = `              {downloadState === 'error' && <div className="space-y-2"><p className="text-sm font-semibold" style={{ color: burgundy }}>The model could not be downloaded.</p><p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">Please check your internet connection and try again.</p><button type="button" onClick={downloadBrowserModel} className="min-h-10 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: teal }}>Try again</button></div>}
              {downloadState === 'ready' && <SetupStep number={4} title="You're ready"><p><strong>Your AI model is ready.</strong> Pessoa can now use it directly in your browser. Processing happens on your device.</p></SetupStep>}`;
const malformedReady = `              {downloadState === 'error' && <div className="space-y-2"><p className="text-sm font-semibold" style={{ color: burgundy }}>The model could not be downloaded.</p><p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">Please check your internet connection and try again.</p><button type="button" onClick={downloadBrowserModel} className="min-h-10 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: teal }}>Try again</button></div>}
              {downloadState === 'ready' && <SetupStep number={4} title="You're ready"><p><strong>Your AI model is ready.</strong> Pessoa can now use it directly in your browser. Processing happens on this device.</p></SetupStep>`;

if (guided.includes(malformedReady)) {
  guided = guided.replace(malformedReady, newReady);
  fs.writeFileSync(guidedPath, guided, 'utf8');
  console.log('Prepared GuidedAISetup.tsx: repaired browser AI success-state JSX');
} else if (!guided.includes(newReady)) {
  if (!guided.includes(oldReady)) throw new Error('Could not find the browser AI success state in GuidedAISetup.tsx');
  guided = guided.replace(oldReady, newReady);
  fs.writeFileSync(guidedPath, guided, 'utf8');
  console.log('Prepared GuidedAISetup.tsx: hide success state after failed download and add retry');
}
