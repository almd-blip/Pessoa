import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const serverPath = path.join(root, 'server.ts');
const proxyMarker = '// ----------------- BROWSER AI MODEL PROXY -----------------';

let server = fs.readFileSync(serverPath, 'utf8');

// Production Cloudflare deployment uses the bundled Express server. Add a
// same-origin model proxy without modifying any existing Gemini/API routes.
if (!server.includes(proxyMarker)) {
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

    for (const header of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified', 'cache-control']) {
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

  const insertionPoint = 'app.use(express.json());\n\n';
  if (!server.includes(insertionPoint)) {
    throw new Error('Could not find server JSON middleware insertion point.');
  }
  server = server.replace(insertionPoint, `${insertionPoint}${proxyRoute}`);
  fs.writeFileSync(serverPath, server, 'utf8');
  console.log('Prepared server.ts: same-origin browser AI model proxy');
} else {
  console.log('Prepared server.ts: browser AI model proxy already present');
}

// GuidedAISetup.tsx is source-controlled and must not be rewritten during the build.
// Its browser-AI success/error state is now handled directly by the component.
