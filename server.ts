import express, { Request, Response } from 'express';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Helper to follow redirects and stream audio
function fetchStream(
  targetUrl: string,
  res: Response,
  redirectCount = 0
): http.ClientRequest | null {
  if (redirectCount > 5) {
    if (!res.headersSent) {
      res.status(502).json({ error: 'Too many redirects' });
    }
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    if (!res.headersSent) {
      res.status(400).json({ error: 'Invalid URL' });
    }
    return null;
  }

  const client = parsedUrl.protocol === 'https:' ? https : http;
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Icy-MetaData': '0',
    'Connection': 'keep-alive',
  };

  const req = client.get(
    targetUrl,
    {
      headers,
      timeout: 10000,
    },
    (upstreamRes) => {
      // Handle redirects
      if (
        upstreamRes.statusCode &&
        [301, 302, 303, 307, 308].includes(upstreamRes.statusCode) &&
        upstreamRes.headers.location
      ) {
        const nextUrl = new URL(upstreamRes.headers.location, targetUrl).toString();
        upstreamRes.resume(); // Discard unused response
        return fetchStream(nextUrl, res, redirectCount + 1);
      }

      if (upstreamRes.statusCode && upstreamRes.statusCode >= 400) {
        if (!res.headersSent) {
          res.status(upstreamRes.statusCode).json({
            error: `Upstream radio returned status ${upstreamRes.statusCode}`,
          });
        }
        return;
      }

      const contentType = upstreamRes.headers['content-type'] || 'audio/mpeg';

      // Check if it's a playlist text file (m3u, pls) instead of raw audio stream
      if (
        contentType.includes('text/plain') ||
        contentType.includes('text/html') ||
        contentType.includes('audio/x-scpls')
      ) {
        let body = '';
        upstreamRes.setEncoding('utf8');
        upstreamRes.on('data', (chunk) => {
          body += chunk;
          // Limit body size for playlist inspection to 64KB
          if (body.length > 65536) {
            upstreamRes.destroy();
          }
        });
        upstreamRes.on('end', () => {
          // Check if body contains stream URL
          const lines = body.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (
              (trimmed.startsWith('http://') || trimmed.startsWith('https://')) &&
              !trimmed.startsWith('#')
            ) {
              return fetchStream(trimmed, res, redirectCount + 1);
            }
            if (trimmed.startsWith('File1=')) {
              const plsUrl = trimmed.substring(6).trim();
              if (plsUrl.startsWith('http://') || plsUrl.startsWith('https://')) {
                return fetchStream(plsUrl, res, redirectCount + 1);
              }
            }
          }
          if (!res.headersSent) {
            res.status(502).json({ error: 'Playlist did not contain valid audio stream' });
          }
        });
        return;
      }

      // Stream raw audio to client
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      if (res.req.method === 'HEAD') {
        upstreamRes.destroy();
        res.end();
        return;
      }

      upstreamRes.pipe(res);

      res.on('close', () => {
        upstreamRes.destroy();
      });
    }
  );

  req.on('timeout', () => {
    req.destroy();
    if (!res.headersSent) {
      res.status(504).json({ error: 'Upstream server connection timed out' });
    }
  });

  req.on('error', (err) => {
    if (!res.headersSent) {
      res.status(502).json({ error: `Connection failed: ${err.message}` });
    }
  });

  return req;
}

// 1. Audio stream proxy route
app.get('/api/stream-proxy', (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
    res.status(400).json({ error: 'Missing or invalid "url" query parameter' });
    return;
  }

  fetchStream(targetUrl, res);
});

// 2. Stream probe / diagnosis route
app.get('/api/stream-probe', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).json({ error: 'Missing url parameter' });
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const probeRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        'Range': 'bytes=0-100',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    const contentType = probeRes.headers.get('content-type') || '';
    const isHls =
      contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('application/x-mpegurl') ||
      probeRes.url.includes('.m3u8');

    res.json({
      ok: probeRes.ok,
      status: probeRes.status,
      contentType,
      isHls,
      finalUrl: probeRes.url,
    });
  } catch (err: any) {
    res.json({
      ok: false,
      error: err.name === 'AbortError' ? 'Connection timeout' : err.message,
    });
  }
});

async function startServer() {
  if (!isProd) {
    // Development mode: Mount Vite dev middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve dist folder
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RADIO HUB Server running on http://0.0.0.0:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer();
