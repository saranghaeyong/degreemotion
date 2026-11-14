import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderCompleteMp4ToPath } from '../src/film/serverRenderer';
import { DEFAULT_DOCUMENT_SOURCES } from '../src/film/types';

async function main() {
  const outPath = path.resolve(process.cwd(), 'public', '24100218-1080x1920-30fps.mp4');
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-mp4-render-'));

  console.log('Rendering complete 1080x1920 30 FPS MP4 to:', outPath);
  const start = Date.now();

  try {
    const res = await renderCompleteMp4ToPath(DEFAULT_DOCUMENT_SOURCES, outPath, workDir, (p) => {
      if (p.phase !== 'frames' || p.currentFrame % 120 === 0 || p.currentFrame === p.totalFrames) {
        console.log(`[${Math.round(p.progress * 100)}%] ${p.message}`);
      }
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`Done in ${elapsed}s · Size: ${(res.sizeBytes / (1024 * 1024)).toFixed(2)} MB`);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
