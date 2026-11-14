import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import {
  renderCompleteMp4ToPath,
  type ServerRenderProgress,
} from './src/film/serverRenderer';
import { DEFAULT_DOCUMENT_SOURCES, TOTAL_FRAMES, type DocumentSources } from './src/film/types';

const PORT = 3000;
const RENDER_ROOT = path.join(os.tmpdir(), 'archival-film-renders');
const DEFAULT_MP4_PATH = path.resolve(process.cwd(), 'public', '24100218-1080x1920-30fps.mp4');
fs.mkdirSync(RENDER_ROOT, { recursive: true });

interface RenderJob {
  id: string;
  dir: string;
  mp4Path: string;
  createdAt: number;
  status: ServerRenderProgress;
  sizeBytes: number | null;
}

const jobs = new Map<string, RenderJob>();

let cachedFontsCss: string | null = null;

async function buildEmbeddedFontsCss(): Promise<string> {
  if (cachedFontsCss) return cachedFontsCss;

  const fontUrl =
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap';

  const cssRes = await fetch(fontUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    },
  });

  if (!cssRes.ok) {
    throw new Error(`Failed to fetch Google Fonts CSS: ${cssRes.status}`);
  }

  let cssText = await cssRes.text();
  const urlMatches = Array.from(cssText.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g));
  const uniqueUrls = Array.from(new Set(urlMatches.map((m) => m[1])));

  const dataUriMap = new Map<string, string>();
  await Promise.all(
    uniqueUrls.map(async (u) => {
      const res = await fetch(u);
      if (!res.ok) return;
      const buf = Buffer.from(await res.arrayBuffer());
      dataUriMap.set(u, `data:font/woff2;base64,${buf.toString('base64')}`);
    }),
  );

  for (const [remoteUrl, dataUri] of dataUriMap.entries()) {
    cssText = cssText.split(remoteUrl).join(dataUri);
  }

  cachedFontsCss = cssText;
  return cssText;
}

function streamMp4File(filePath: string, req: express.Request, res: express.Response) {
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Rendered MP4 not found' });
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });
    fs.createReadStream(filePath).pipe(res);
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > 30 * 60 * 1000) {
      fs.rm(job.dir, { recursive: true, force: true }, () => {});
      jobs.delete(id);
    }
  }
}, 5 * 60 * 1000).unref();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/fonts-css', async (_req, res) => {
    try {
      const css = await buildEmbeddedFontsCss();
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
      res.send(css);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Font fetch failed';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/default-mp4/info', (_req, res) => {
    if (!fs.existsSync(DEFAULT_MP4_PATH)) {
      res.json({ available: false });
      return;
    }
    const stat = fs.statSync(DEFAULT_MP4_PATH);
    res.json({
      available: true,
      sizeBytes: stat.size,
      videoUrl: '/api/default-mp4/video',
      downloadUrl: '/api/default-mp4/download',
    });
  });

  app.get('/api/default-mp4/video', (req, res) => {
    streamMp4File(DEFAULT_MP4_PATH, req, res);
  });

  app.get('/api/default-mp4/download', (_req, res) => {
    if (!fs.existsSync(DEFAULT_MP4_PATH)) {
      res.status(404).json({ error: 'Default MP4 not rendered yet' });
      return;
    }
    res.download(DEFAULT_MP4_PATH, '24100218-1080x1920-30fps.mp4');
  });

  app.post('/api/render-job', (req, res) => {
    const id = crypto.randomUUID();
    const dir = path.join(RENDER_ROOT, id);
    const workDir = path.join(dir, 'frames');
    const mp4Path = path.join(dir, '24100218-1080x1920-30fps.mp4');
    fs.mkdirSync(workDir, { recursive: true });

    const sources: DocumentSources = {
      ...DEFAULT_DOCUMENT_SOURCES,
      ...(req.body?.sources || {}),
    };

    const job: RenderJob = {
      id,
      dir,
      mp4Path,
      createdAt: Date.now(),
      sizeBytes: null,
      status: {
        phase: 'preparing',
        progress: 0.01,
        currentFrame: 0,
        totalFrames: TOTAL_FRAMES,
        message: 'Starting 1080×1920 render job',
      },
    };
    jobs.set(id, job);

    void renderCompleteMp4ToPath(sources, mp4Path, workDir, (progress) => {
      job.status = progress;
    })
      .then((result) => {
        job.sizeBytes = result.sizeBytes;
        job.status = {
          phase: 'complete',
          progress: 1,
          currentFrame: TOTAL_FRAMES,
          totalFrames: TOTAL_FRAMES,
          message: '1080×1920 · 30 FPS H.264/AAC MP4 ready',
        };
        // Remove intermediate PNGs after encoding completes
        fs.rm(workDir, { recursive: true, force: true }, () => {});
      })
      .catch((err) => {
        job.status = {
          phase: 'error',
          progress: 0,
          currentFrame: 0,
          totalFrames: TOTAL_FRAMES,
          message: err instanceof Error ? err.message : 'MP4 render failed',
        };
      });

    res.json({ jobId: id });
  });

  app.get('/api/render-job/:jobId/status', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) {
      res.status(404).json({ error: 'Render job not found' });
      return;
    }
    res.json({
      ...job.status,
      videoUrl: job.status.phase === 'complete' ? `/api/render-job/${job.id}/video` : null,
      downloadUrl: job.status.phase === 'complete' ? `/api/render-job/${job.id}/download` : null,
      fileSizeBytes: job.sizeBytes,
    });
  });

  app.get('/api/render-job/:jobId/video', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) {
      res.status(404).json({ error: 'Render job not found' });
      return;
    }
    streamMp4File(job.mp4Path, req, res);
  });

  app.get('/api/render-job/:jobId/download', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job || !fs.existsSync(job.mp4Path)) {
      res.status(404).json({ error: 'Rendered MP4 not found' });
      return;
    }
    res.download(job.mp4Path, '24100218-1080x1920-30fps.mp4');
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
