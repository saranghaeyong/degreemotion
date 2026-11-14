import { TOTAL_FRAMES, type DocumentSources, type RenderStatus } from './types';

export async function renderMp4OnServer(
  sources: DocumentSources,
  onProgress: (status: RenderStatus) => void,
  signal?: AbortSignal,
): Promise<{ videoUrl: string; downloadUrl: string; sizeBytes: number }> {
  onProgress({
    phase: 'preparing',
    progress: 0.02,
    currentFrame: 0,
    totalFrames: TOTAL_FRAMES,
    message: 'Starting 1080×1920 · 30 FPS render job',
    videoUrl: null,
    downloadUrl: null,
    fileSizeBytes: null,
  });

  const startRes = await fetch('/api/render-job', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sources }),
    signal,
  });

  if (!startRes.ok) {
    throw new Error('Failed to start MP4 render job');
  }

  const { jobId } = (await startRes.json()) as { jobId: string };

  while (true) {
    if (signal?.aborted) {
      throw new DOMException('Render cancelled', 'AbortError');
    }

    await new Promise((r) => setTimeout(r, 350));

    if (signal?.aborted) {
      throw new DOMException('Render cancelled', 'AbortError');
    }

    const statusRes = await fetch(`/api/render-job/${jobId}/status`, { signal });
    if (!statusRes.ok) {
      throw new Error('Failed to poll render status');
    }

    const status = (await statusRes.json()) as RenderStatus;
    onProgress(status);

    if (status.phase === 'complete' && status.videoUrl && status.downloadUrl) {
      return {
        videoUrl: status.videoUrl,
        downloadUrl: status.downloadUrl,
        sizeBytes: status.fileSizeBytes ?? 0,
      };
    }

    if (status.phase === 'error') {
      throw new Error(status.message || 'Server MP4 rendering failed');
    }
  }
}
