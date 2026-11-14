import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  Download,
  FileText,
  Film,
  Image as ImageIcon,
  Pause,
  Play,
  RotateCcw,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { FilmStage } from './film/FilmStage';
import { LiveFilmAudioPlayer } from './film/audioEngine';
import { renderMp4OnServer } from './film/mp4Renderer';
import { extractResultPdfPages } from './film/pdfExtractor';
import {
  CERTIFICATE_FACTS,
  CUSAT_IDENTITY,
  DEFAULT_DOCUMENT_SOURCES,
  FILM_CHAPTERS,
  FILM_DURATION,
  FILM_FPS,
  PAGE10_FAILED_24100218,
  TOTAL_FRAMES,
  type CertificateFocalPoints,
  type DocumentSources,
  type RenderStatus,
} from './film/types';

function formatTimecode(seconds: number): string {
  const clamped = Math.max(0, Math.min(FILM_DURATION, seconds));
  const secs = Math.floor(clamped);
  const frames = Math.floor((clamped - secs) * FILM_FPS);
  return `00:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export default function App() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const audioRef = useRef<LiveFilmAudioPlayer | null>(null);
  const renderAbortRef = useRef<AbortController | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const certInputRef = useRef<HTMLInputElement | null>(null);

  const [sources, setSources] = useState<DocumentSources>(DEFAULT_DOCUMENT_SOURCES);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [stageMode, setStageMode] = useState<'live' | 'mp4'>('live');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<string | null>(
    'Loaded authentic CUSAT fail.pdf · 71 students & Page 10',
  );
  const [studentQuery, setStudentQuery] = useState('');
  const [activeFocalEdit, setActiveFocalEdit] =
    useState<keyof CertificateFocalPoints>('university');

  const [renderStatus, setRenderStatus] = useState<RenderStatus>({
    phase: 'idle',
    progress: 0,
    currentFrame: 0,
    totalFrames: TOTAL_FRAMES,
    message: '',
    videoUrl: null,
    downloadUrl: null,
    fileSizeBytes: null,
  });

  useEffect(() => {
    let active = true;
    fetch('/api/default-mp4/info')
      .then((res) => res.json())
      .then((info: { available?: boolean; sizeBytes?: number; videoUrl?: string; downloadUrl?: string }) => {
        if (!active || !info.available || !info.videoUrl || !info.downloadUrl) return;
        setRenderStatus({
          phase: 'complete',
          progress: 1,
          currentFrame: TOTAL_FRAMES,
          totalFrames: TOTAL_FRAMES,
          message: '1080×1920 · 30 FPS H.264/AAC MP4 ready',
          videoUrl: info.videoUrl,
          downloadUrl: info.downloadUrl,
          fileSizeBytes: info.sizeBytes ?? null,
        });
      })
      .catch(() => {
        // Ignore if not yet rendered
      });
    return () => {
      active = false;
    };
  }, []);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new LiveFilmAudioPlayer();
    }
    return audioRef.current;
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.stopAll();
      renderAbortRef.current?.abort();
    };
  }, []);

  const handlePlayPause = useCallback(() => {
    const tl = timelineRef.current;
    if (!tl) return;

    setStageMode('live');
    const audio = getAudio();

    if (isPlaying) {
      tl.pause();
      audio.stopAll();
      setIsPlaying(false);
    } else {
      if (tl.time() >= FILM_DURATION - 0.05) {
        tl.seek(0, false);
        setCurrentTime(0);
      }
      const startAt = tl.time();
      audio.setMuted(isMuted);
      audio.playFromFilmTime(startAt);
      tl.play();
      setIsPlaying(true);
    }
  }, [getAudio, isMuted, isPlaying]);

  const handleRestart = useCallback(() => {
    const tl = timelineRef.current;
    if (!tl) return;
    setStageMode('live');
    const audio = getAudio();
    tl.seek(0, false);
    setCurrentTime(0);
    audio.setMuted(isMuted);
    audio.playFromFilmTime(0);
    tl.play();
    setIsPlaying(true);
  }, [getAudio, isMuted]);

  const handleSeek = useCallback(
    (time: number) => {
      const tl = timelineRef.current;
      if (!tl) return;
      setStageMode('live');
      const clamped = Math.max(0, Math.min(FILM_DURATION, time));
      tl.seek(clamped, false);
      setCurrentTime(clamped);
      if (isPlaying) {
        getAudio().playFromFilmTime(clamped);
      }
    },
    [getAudio, isPlaying],
  );

  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    getAudio().setMuted(nextMuted);
  }, [getAudio, isMuted]);

  const handleTimelineComplete = useCallback(() => {
    setIsPlaying(false);
    audioRef.current?.stopAll();
  }, []);

  const handleStartMp4Render = useCallback(async () => {
    const tl = timelineRef.current;
    if (tl && isPlaying) {
      tl.pause();
      audioRef.current?.stopAll();
      setIsPlaying(false);
    }

    const controller = new AbortController();
    renderAbortRef.current = controller;

    try {
      const result = await renderMp4OnServer(
        sources,
        (status) => setRenderStatus(status),
        controller.signal,
      );
      setStageMode('mp4');
      setRenderStatus((prev) => ({
        ...prev,
        phase: 'complete',
        videoUrl: result.videoUrl,
        downloadUrl: result.downloadUrl,
        fileSizeBytes: result.sizeBytes,
      }));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setRenderStatus({
          phase: 'idle',
          progress: 0,
          currentFrame: 0,
          totalFrames: TOTAL_FRAMES,
          message: '',
          videoUrl: null,
          downloadUrl: null,
          fileSizeBytes: null,
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'MP4 rendering failed';
      setRenderStatus((prev) => ({
        ...prev,
        phase: 'error',
        message,
      }));
    }
  }, [isPlaying, sources]);

  const handleCancelRender = useCallback(() => {
    renderAbortRef.current?.abort();
  }, []);

  const handlePdfUpload = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setPdfLoading(true);
      setPdfNotice(null);
      try {
        const extracted = await extractResultPdfPages(file, sources.pdfPage10Number);
        setSources((prev) => ({
          ...prev,
          pdfFileName: file.name,
          pdfPage10DataUrl: extracted.page10.dataUrl,
          pdfPage10AspectRatio: extracted.page10.aspectRatio,
          pdfPage10Focus: extracted.page10.focusPoint,
          students: extracted.students.length > 0 ? extracted.students : prev.students,
        }));
        setPdfNotice(
          `Loaded ${extracted.totalPages} pages · Extracted ${extracted.students.length} students · Page ${extracted.page10.pageNumber}`,
        );
        setRenderStatus((prev) => ({ ...prev, phase: 'idle', videoUrl: null, downloadUrl: null }));
        setStageMode('live');
      } catch (err) {
        setPdfNotice(err instanceof Error ? err.message : 'Unable to parse PDF');
      } finally {
        setPdfLoading(false);
      }
    },
    [sources.pdfPage10Number],
  );

  const handleCertificateUpload = useCallback((file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        const img = new Image();
        img.onload = () => {
          const aspectRatio =
            img.naturalWidth && img.naturalHeight
              ? img.naturalWidth / img.naturalHeight
              : 3048 / 4064;
          setSources((prev) => ({
            ...prev,
            certificateFileName: file.name,
            certificateImageDataUrl: dataUrl,
            certificateAspectRatio: aspectRatio,
          }));
          setRenderStatus((prev) => ({ ...prev, phase: 'idle', videoUrl: null, downloadUrl: null }));
          setStageMode('live');
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const isRendering =
    renderStatus.phase === 'preparing' ||
    renderStatus.phase === 'audio' ||
    renderStatus.phase === 'frames' ||
    renderStatus.phase === 'encoding';

  const currentFrame = Math.min(TOTAL_FRAMES, Math.round(currentTime * FILM_FPS));

  const activeChapterId =
    [...FILM_CHAPTERS].reverse().find((c) => currentTime >= c.time - 0.1)?.id ??
    FILM_CHAPTERS[0].id;

  const filteredStudents = sources.students.filter((s) => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.regNo.toLowerCase().includes(q) ||
      String(s.serial) === q
    );
  });

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#171717] flex flex-col">
      {/* 3-ZONE HIGH-CONTRAST TOP BAR */}
      <header className="border-b border-[#D1D5DB] bg-[#FFFFFF]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
          <div className="flex flex-col">
            <span className="font-manrope text-base font-bold tracking-tight text-[#171717] whitespace-nowrap">
              CUSAT · MCA April 2026 · 24100218
            </span>
            <span className="text-[11px] font-medium text-[#2563EB] whitespace-nowrap">
              {CUSAT_IDENTITY.university}
            </span>
          </div>

          <nav className="hidden xl:flex items-center gap-5">
            {FILM_CHAPTERS.map((chapter) => {
              const active = activeChapterId === chapter.id && stageMode === 'live';
              return (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => handleSeek(chapter.time)}
                  className={`cursor-pointer text-xs font-semibold transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
                    active
                      ? 'text-[#171717] border-[#2563EB]'
                      : 'text-[#525252] border-transparent hover:text-[#171717]'
                  }`}
                >
                  {chapter.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            {renderStatus.phase === 'complete' && renderStatus.downloadUrl ? (
              <a
                href={renderStatus.downloadUrl}
                download="24100218-1080x1920-30fps.mp4"
                className="inline-flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 text-xs font-semibold text-[#FFFFFF] hover:bg-[#1D4ED8] transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                Download MP4
              </a>
            ) : (
              <button
                type="button"
                onClick={isRendering ? handleCancelRender : handleStartMp4Render}
                className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 text-xs font-semibold text-[#FFFFFF] hover:bg-[#1D4ED8] transition-colors whitespace-nowrap shrink-0"
              >
                <Film className="h-3.5 w-3.5" />
                {isRendering ? 'Cancel Render' : 'Render 1080×1920 MP4'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-10 px-6 py-6 bg-[#FFFFFF]">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* LEFT COLUMN: 9:16 VERTICAL MONITOR */}
          <section className="flex flex-1 flex-col items-center justify-start">
            {renderStatus.phase === 'complete' && renderStatus.videoUrl && (
              <div className="mb-4 flex items-center gap-1 rounded-lg border border-[#D1D5DB] bg-[#F3F4F6] p-1">
                <button
                  type="button"
                  onClick={() => setStageMode('live')}
                  className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    stageMode === 'live'
                      ? 'bg-[#FFFFFF] text-[#171717] shadow-xs'
                      : 'text-[#525252] hover:text-[#171717]'
                  }`}
                >
                  Live GSAP Stage
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isPlaying) handlePlayPause();
                    setStageMode('mp4');
                  }}
                  className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    stageMode === 'mp4'
                      ? 'bg-[#FFFFFF] text-[#171717] shadow-xs'
                      : 'text-[#525252] hover:text-[#171717]'
                  }`}
                >
                  Rendered MP4
                </button>
              </div>
            )}

            <div className="relative aspect-[9/16] w-full max-w-[405px] overflow-hidden rounded-lg border border-[#D1D5DB] bg-[#FFFFFF] shadow-md">
              <div
                onClick={handlePlayPause}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handlePlayPause();
                  }
                }}
                aria-label={isPlaying ? 'Pause sequence' : 'Play sequence'}
                className={`h-full w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2563EB] ${
                  stageMode === 'mp4' ? 'hidden' : 'block'
                }`}
              >
                <FilmStage
                  sources={sources}
                  svgRef={svgRef}
                  timelineRef={timelineRef}
                  onTimeUpdate={setCurrentTime}
                  onComplete={handleTimelineComplete}
                />
              </div>

              {stageMode === 'mp4' && renderStatus.videoUrl && (
                <video
                  src={renderStatus.videoUrl}
                  controls
                  playsInline
                  className="h-full w-full bg-[#FFFFFF] object-contain"
                />
              )}
            </div>

            <div className="mt-5 w-full max-w-[560px] border-t border-[#D1D5DB] pt-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    className="cursor-pointer inline-flex h-10 items-center gap-2 rounded-md border border-[#D1D5DB] bg-[#FFFFFF] px-4 text-xs font-semibold text-[#171717] hover:bg-[#F3F4F6] transition-colors whitespace-nowrap shrink-0"
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRestart}
                    aria-label="Restart sequence"
                    className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#D1D5DB] bg-[#FFFFFF] text-[#525252] hover:text-[#171717] hover:bg-[#F3F4F6] transition-colors shrink-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                    className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#D1D5DB] bg-[#FFFFFF] text-[#525252] hover:text-[#171717] hover:bg-[#F3F4F6] transition-colors shrink-0"
                  >
                    {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#525252] tabular-nums">
                  <span className="font-semibold text-[#171717]">{formatTimecode(currentTime)}</span>
                  <span aria-hidden="true">/</span>
                  <span>00:{String(FILM_DURATION).padStart(2, '0')}:00</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Frame {String(currentFrame).padStart(4, '0')} / {TOTAL_FRAMES}
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <input
                  type="range"
                  min={0}
                  max={FILM_DURATION}
                  step={1 / FILM_FPS}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  aria-label="Timeline scrubber"
                  className="h-1.5 w-full cursor-pointer appearance-none rounded bg-[#D1D5DB] accent-[#2563EB]"
                />
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-medium text-[#525252] tabular-nums overflow-x-auto">
                  {FILM_CHAPTERS.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => handleSeek(ch.time)}
                      className="cursor-pointer hover:text-[#171717] transition-colors whitespace-nowrap"
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: SOURCE FILES, PAGE 10 RECORD & MASTER MP4 */}
          <aside className="w-full lg:w-[440px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#D1D5DB] pt-6 lg:pt-0 lg:pl-8 flex flex-col gap-7">
            {/* 01. Source Files */}
            <div>
              <h2 className="font-manrope text-base font-bold text-[#171717]">
                01. Original Source Files
              </h2>
              <p className="mt-1 text-xs text-[#525252]">
                Original <strong className="text-[#171717]">fail.pdf</strong> (Pages 1–8 roster &amp; Page 10) and{' '}
                <strong className="text-[#171717]">pass.jpg</strong> degree certificate are pre-loaded.
              </p>

              {/* fail.pdf */}
              <div className="mt-4 rounded-md border border-[#D1D5DB] bg-[#FFFFFF] p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#171717] inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-[#2563EB]" />
                    fail.pdf (Pages 1–10)
                  </span>
                  {sources.pdfFileName && (
                    <button
                      type="button"
                      onClick={() => {
                        setSources(DEFAULT_DOCUMENT_SOURCES);
                        setPdfNotice('Restored authentic CUSAT fail.pdf · 71 students & Page 10');
                      }}
                      className="cursor-pointer text-[#525252] hover:text-[#171717] inline-flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Restore Default
                    </button>
                  )}
                </div>
                <div className="mt-1 text-xs text-[#525252]">
                  {sources.pdfFileName} · {pdfNotice ?? ''}
                </div>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => void handlePdfUpload(e.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={pdfLoading}
                  onClick={() => pdfInputRef.current?.click()}
                  className="cursor-pointer mt-2.5 inline-flex items-center gap-2 rounded-md border border-[#D1D5DB] bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#171717] hover:bg-[#F3F4F6] transition-colors whitespace-nowrap"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {pdfLoading ? 'Extracting PDF...' : 'Replace fail.pdf'}
                </button>
              </div>

              {/* pass.jpg */}
              <div className="mt-3 rounded-md border border-[#D1D5DB] bg-[#FFFFFF] p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#171717] inline-flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-[#16834A]" />
                    pass.jpg (Degree Certificate)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSources((prev) => ({
                        ...prev,
                        certificateFileName: DEFAULT_DOCUMENT_SOURCES.certificateFileName,
                        certificateImageDataUrl: DEFAULT_DOCUMENT_SOURCES.certificateImageDataUrl,
                        certificateAspectRatio: DEFAULT_DOCUMENT_SOURCES.certificateAspectRatio,
                        certificateFocalPoints: DEFAULT_DOCUMENT_SOURCES.certificateFocalPoints,
                      }))
                    }
                    className="cursor-pointer text-[#525252] hover:text-[#171717] inline-flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Restore Default
                  </button>
                </div>
                <div className="mt-1 text-xs text-[#525252]">{sources.certificateFileName}</div>
                <input
                  ref={certInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleCertificateUpload(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => certInputRef.current?.click()}
                  className="cursor-pointer mt-2.5 inline-flex items-center gap-2 rounded-md border border-[#D1D5DB] bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#171717] hover:bg-[#F3F4F6] transition-colors whitespace-nowrap"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Replace pass.jpg
                </button>

                {sources.certificateImageDataUrl && (
                  <div className="mt-3 border-t border-[#E5E7EB] pt-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(
                        [
                          ['university', 'University'],
                          ['candidateName', 'SARANG R N'],
                          ['degreeTitle', 'Degree'],
                          ['classification', 'First Class'],
                        ] as const
                      ).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setActiveFocalEdit(key)}
                          className={`cursor-pointer rounded px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                            activeFocalEdit === key
                              ? 'bg-[#2563EB] text-[#FFFFFF]'
                              : 'bg-[#F3F4F6] text-[#525252] hover:text-[#171717]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2.5 grid grid-cols-2 gap-3 text-[11px] text-[#525252] tabular-nums">
                      <label className="flex flex-col gap-1">
                        <span>
                          X ({Math.round(sources.certificateFocalPoints[activeFocalEdit].x * 100)}%)
                        </span>
                        <input
                          type="range"
                          min={0.15}
                          max={0.85}
                          step={0.01}
                          value={sources.certificateFocalPoints[activeFocalEdit].x}
                          onChange={(e) => {
                            const x = parseFloat(e.target.value);
                            setSources((prev) => ({
                              ...prev,
                              certificateFocalPoints: {
                                ...prev.certificateFocalPoints,
                                [activeFocalEdit]: {
                                  ...prev.certificateFocalPoints[activeFocalEdit],
                                  x,
                                },
                              },
                            }));
                          }}
                          className="accent-[#2563EB]"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span>
                          Y ({Math.round(sources.certificateFocalPoints[activeFocalEdit].y * 100)}%)
                        </span>
                        <input
                          type="range"
                          min={0.1}
                          max={0.9}
                          step={0.01}
                          value={sources.certificateFocalPoints[activeFocalEdit].y}
                          onChange={(e) => {
                            const y = parseFloat(e.target.value);
                            setSources((prev) => ({
                              ...prev,
                              certificateFocalPoints: {
                                ...prev.certificateFocalPoints,
                                [activeFocalEdit]: {
                                  ...prev.certificateFocalPoints[activeFocalEdit],
                                  y,
                                },
                              },
                            }));
                          }}
                          className="accent-[#2563EB]"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 02. Master MP4 Render */}
            <div className="border-t border-[#D1D5DB] pt-6">
              <h2 className="font-manrope text-base font-bold text-[#171717]">
                02. Master MP4 Render
              </h2>
              <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs border-b border-[#D1D5DB] pb-3.5 tabular-nums">
                <dt className="text-[#525252]">Dimensions</dt>
                <dd className="text-right font-semibold text-[#171717]">1080 × 1920 (9:16)</dd>
                <dt className="text-[#525252]">Frame Rate</dt>
                <dd className="text-right font-semibold text-[#171717]">30 FPS · {TOTAL_FRAMES} frames</dd>
                <dt className="text-[#525252]">Video / Audio</dt>
                <dd className="text-right font-semibold text-[#171717]">H.264 / AAC 48 kHz</dd>
              </dl>

              <div className="mt-3.5 flex flex-col gap-3">
                {isRendering && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#525252] tabular-nums mb-1.5">
                      <span>{renderStatus.message}</span>
                      <span className="font-semibold text-[#171717]">
                        {Math.round(renderStatus.progress * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded bg-[#F3F4F6]">
                      <div
                        className="h-full bg-[#2563EB] transition-all duration-150"
                        style={{ width: `${Math.round(renderStatus.progress * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {renderStatus.phase === 'error' && (
                  <p className="text-xs font-medium text-[#C62828]">{renderStatus.message}</p>
                )}

                {renderStatus.phase === 'complete' && renderStatus.downloadUrl && (
                  <div className="flex items-center justify-between border border-[#16834A] bg-[#F3F4F6] px-3.5 py-2.5 rounded-md">
                    <div className="text-xs">
                      <div className="font-semibold text-[#171717]">24100218-1080x1920-30fps.mp4</div>
                      <div className="text-[#525252] tabular-nums">
                        1080×1920 · 30 FPS · {formatBytes(renderStatus.fileSizeBytes)}
                      </div>
                    </div>
                    <a
                      href={renderStatus.downloadUrl}
                      download="24100218-1080x1920-30fps.mp4"
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#16834A] px-3 py-1.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#15803D] transition-colors whitespace-nowrap shrink-0"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Save
                    </a>
                  </div>
                )}

                <button
                  type="button"
                  onClick={isRendering ? handleCancelRender : handleStartMp4Render}
                  className="cursor-pointer w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#171717] px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#333333] transition-colors whitespace-nowrap"
                >
                  <Film className="h-3.5 w-3.5" />
                  {isRendering
                    ? 'Cancel Render'
                    : renderStatus.phase === 'complete'
                      ? 'Re-Render 1080×1920 MP4'
                      : 'Render Complete MP4'}
                </button>
              </div>
            </div>

            {/* 03. Failed Students Record & Certificate Facts */}
            <div className="border-t border-[#D1D5DB] pt-6">
              <h2 className="font-manrope text-base font-bold text-[#171717]">
                03. Source Records · 24100218
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-3 text-xs">
                <div className="rounded-md border border-[#C62828] bg-[#FFFFFF] p-3">
                  <div className="font-bold text-[#C62828]">
                    Page 10 · Failed Students (Only Entry: 24100218 · SARANG R N)
                  </div>
                  <ul className="mt-1.5 space-y-1 text-[#525252] tabular-nums">
                    {PAGE10_FAILED_24100218.semesters.map((sem) => (
                      <li key={sem.code} className="flex justify-between gap-2">
                        <span className={sem.code === 'Sem--3' ? 'font-bold text-[#C62828]' : 'font-medium text-[#171717]'}>
                          {sem.label}
                        </span>
                        <span className={sem.code === 'Sem--3' ? 'font-semibold text-[#C62828]' : ''}>
                          {sem.raw}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-md border border-[#D1D5DB] bg-[#F3F4F6] p-3 text-[#525252]">
                  <div className="font-semibold text-[#171717]">
                    Degree Certificate · {CERTIFICATE_FACTS.university}
                  </div>
                  <div className="mt-1">
                    {CERTIFICATE_FACTS.name} ({CERTIFICATE_FACTS.regNo}) · {CERTIFICATE_FACTS.degree} ·{' '}
                    {CERTIFICATE_FACTS.classification} · {CERTIFICATE_FACTS.examination} · Award:{' '}
                    {CERTIFICATE_FACTS.awardDate}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* COMPLETE 71-STUDENT REGISTRY TABLE */}
        <section className="border-t border-[#D1D5DB] pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-manrope text-base font-bold text-[#171717]">
                04. Complete Student Registry (Pages 1–8 · {sources.students.length} Students)
              </h2>
              <p className="mt-0.5 text-xs text-[#525252]">
                Verbatim extraction from fail.pdf Pages 1–8. Other 70 students shown in green (#16834A); 24100218 SARANG R N kept unhighlighted.
              </p>
            </div>
            <input
              type="search"
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              placeholder="Filter by serial, name, or reg. no."
              className="w-full sm:w-72 rounded-md border border-[#D1D5DB] bg-[#FFFFFF] px-3 py-2 text-xs text-[#171717] placeholder:text-[#525252] focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div className="mt-4 max-h-[460px] overflow-y-auto rounded-md border border-[#D1D5DB] bg-[#FFFFFF]">
            <table className="w-full border-collapse text-left text-xs tabular-nums">
              <thead className="sticky top-0 border-b border-[#D1D5DB] bg-[#F3F4F6] text-[#525252]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold w-20">Sl. No.</th>
                  <th className="px-4 py-2.5 font-semibold">Student Name</th>
                  <th className="px-4 py-2.5 font-semibold text-right w-48">Registration Number</th>
                  <th className="px-4 py-2.5 font-semibold text-right w-28">Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredStudents.map((s) => {
                  const isTarget = s.regNo === '24100218';
                  return (
                    <tr
                      key={`${s.serial}-${s.regNo}`}
                      className={isTarget ? 'bg-[#F3F4F6]' : 'hover:bg-[#F3F4F6]/60'}
                    >
                      <td className="px-4 py-2.5 text-[#525252]">{s.serial}</td>
                      <td
                        className={`px-4 py-2.5 font-semibold ${
                          isTarget ? 'text-[#171717]' : 'text-[#16834A]'
                        }`}
                      >
                        {s.name}
                      </td>
                      <td className="px-4 py-2.5 text-right font-manrope font-bold text-[#171717]">
                        {s.regNo}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-bold ${
                          isTarget ? 'text-[#525252]' : 'text-[#16834A]'
                        }`}
                      >
                        {isTarget ? '—' : 'PASSED'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
