import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { Resvg } from '@resvg/resvg-js';
import { synthesizeFilmAudioWavBuffer } from './audioNodeWav';
import { createFilmStateTimeline, createInitialFilmState } from './choreography';
import { renderFilmSvgString } from './renderSvgString';
import {
  FILM_FPS,
  FILM_HEIGHT,
  FILM_WIDTH,
  TOTAL_FRAMES,
  type DocumentSources,
} from './types';

export interface ServerRenderProgress {
  phase: 'preparing' | 'audio' | 'frames' | 'encoding' | 'complete' | 'error';
  progress: number;
  currentFrame: number;
  totalFrames: number;
  message: string;
}

function getLocalFontFiles(): string[] {
  const fontDir = path.resolve(process.cwd(), 'assets', 'fonts');
  if (!fs.existsSync(fontDir)) return [];
  return fs
    .readdirSync(fontDir)
    .filter((f) => f.endsWith('.ttf') || f.endsWith('.otf'))
    .map((f) => path.join(fontDir, f));
}

function resolvePublicAssetToDataUrl(urlOrDataUrl: string | null): string | null {
  if (!urlOrDataUrl) return null;
  if (urlOrDataUrl.startsWith('data:')) return urlOrDataUrl;
  if (urlOrDataUrl.startsWith('/')) {
    const absPath = path.resolve(process.cwd(), 'public', urlOrDataUrl.slice(1));
    if (fs.existsSync(absPath)) {
      const ext = path.extname(absPath).toLowerCase();
      const mime =
        ext === '.png'
          ? 'image/png'
          : ext === '.webp'
            ? 'image/webp'
            : 'image/jpeg';
      const buf = fs.readFileSync(absPath);
      return `data:${mime};base64,${buf.toString('base64')}`;
    }
  }
  return urlOrDataUrl;
}

export async function renderCompleteMp4ToPath(
  sources: DocumentSources,
  outputMp4Path: string,
  workDir: string,
  onProgress?: (p: ServerRenderProgress) => void,
): Promise<{ sizeBytes: number; durationSec: number }> {
  fs.mkdirSync(workDir, { recursive: true });
  fs.mkdirSync(path.dirname(outputMp4Path), { recursive: true });

  const resolvedSources: DocumentSources = {
    ...sources,
    pdfPage10DataUrl: resolvePublicAssetToDataUrl(sources.pdfPage10DataUrl),
    certificateImageDataUrl: resolvePublicAssetToDataUrl(sources.certificateImageDataUrl),
  };

  onProgress?.({
    phase: 'preparing',
    progress: 0.02,
    currentFrame: 0,
    totalFrames: TOTAL_FRAMES,
    message: 'Loading Inter, Manrope, and Playfair Display fonts',
  });

  const fontFiles = getLocalFontFiles();

  onProgress?.({
    phase: 'audio',
    progress: 0.05,
    currentFrame: 0,
    totalFrames: TOTAL_FRAMES,
    message: 'Synthesizing 48 kHz stereo AAC audio track',
  });

  const wavPath = path.join(workDir, 'audio.wav');
  const wavBuf = synthesizeFilmAudioWavBuffer();
  await fs.promises.writeFile(wavPath, wavBuf);

  // Spawn FFmpeg streaming raw RGBA 1080x1920 @ 30 FPS directly via stdin
  const ffmpegProc = spawn(
    'ffmpeg',
    [
      '-y',
      '-f',
      'rawvideo',
      '-pixel_format',
      'rgba',
      '-video_size',
      `${FILM_WIDTH}x${FILM_HEIGHT}`,
      '-framerate',
      String(FILM_FPS),
      '-i',
      '-',
      '-i',
      wavPath,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '15',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-ar',
      '48000',
      '-b:a',
      '192k',
      '-movflags',
      '+faststart',
      '-shortest',
      outputMp4Path,
    ],
    { stdio: ['pipe', 'ignore', 'pipe'] },
  );

  let ffmpegStderr = '';
  ffmpegProc.stderr?.on('data', (chunk: Buffer) => {
    ffmpegStderr += chunk.toString();
  });

  const ffmpegDone = new Promise<void>((resolve, reject) => {
    ffmpegProc.on('error', reject);
    ffmpegProc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}: ${ffmpegStderr.slice(-600)}`));
    });
  });

  const state = createInitialFilmState();
  const tl = createFilmStateTimeline(state, resolvedSources);

  let lastSvg = '';
  let lastPixels: Buffer | null = null;

  try {
    for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
      const t = frame / FILM_FPS;
      tl.seek(t, false);

      const svgStr = renderFilmSvgString(state, resolvedSources);
      let pixels: Buffer;

      if (svgStr === lastSvg && lastPixels) {
        pixels = lastPixels;
      } else {
        const resvg = new Resvg(svgStr, {
          fitTo: { mode: 'width', value: FILM_WIDTH },
          font: {
            fontFiles,
            loadSystemFonts: false,
            defaultFontFamily: 'Inter',
          },
          textRendering: 2,
          shapeRendering: 2,
          imageRendering: 0,
        });
        pixels = resvg.render().pixels;
        lastSvg = svgStr;
        lastPixels = pixels;
      }

      if (!ffmpegProc.stdin.write(pixels)) {
        await new Promise<void>((resolve) => ffmpegProc.stdin.once('drain', resolve));
      }

      if (frame % 15 === 0 || frame === TOTAL_FRAMES - 1) {
        onProgress?.({
          phase: 'frames',
          progress: 0.08 + ((frame + 1) / TOTAL_FRAMES) * 0.84,
          currentFrame: frame + 1,
          totalFrames: TOTAL_FRAMES,
          message: `Rendering & encoding frame ${frame + 1} / ${TOTAL_FRAMES} (1080×1920 @ 30 FPS)`,
        });
      }
    }
  } finally {
    tl.kill();
    ffmpegProc.stdin.end();
  }

  onProgress?.({
    phase: 'encoding',
    progress: 0.94,
    currentFrame: TOTAL_FRAMES,
    totalFrames: TOTAL_FRAMES,
    message: 'Finalizing H.264 / AAC MP4 container',
  });

  await ffmpegDone;

  const stat = await fs.promises.stat(outputMp4Path);

  onProgress?.({
    phase: 'complete',
    progress: 1,
    currentFrame: TOTAL_FRAMES,
    totalFrames: TOTAL_FRAMES,
    message: '1080×1920 · 30 FPS H.264/AAC MP4 ready',
  });

  return {
    sizeBytes: stat.size,
    durationSec: TOTAL_FRAMES / FILM_FPS,
  };
}
