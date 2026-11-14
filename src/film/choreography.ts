import gsap from 'gsap';
import {
  FILM_DURATION,
  type DocumentSources,
} from './types';

export const REG_DIGITS = ['2', '4', '1', '0', '0', '2', '1', '8'];
export const DIGIT_CUES = [0.75, 0.94, 1.13, 1.32, 1.51, 1.70, 1.89, 2.08];

export interface FittedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function computeFittedBox(
  aspectRatio: number,
  maxWidth = 980,
  maxHeight = 1400,
  centerX = 540,
  centerY = 960,
): FittedBox {
  const safeRatio = Math.max(0.4, Math.min(2.4, aspectRatio || 0.75));
  let width = maxWidth;
  let height = width / safeRatio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * safeRatio;
  }
  return {
    x: Math.round(centerX - width / 2),
    y: Math.round(centerY - height / 2),
    width: Math.round(width),
    height: Math.round(height),
  };
}

export interface FilmVisualState {
  camX: number;
  camY: number;
  camScale: number;

  // 1. Search Interface & 24100218 Typing (0.00s – 3.50s)
  searchOpacity: number;
  searchY: number;
  searchBtnScale: number;
  searchProgressW: number;
  caretOpacity: number;
  caretX: number;
  digit0Opacity: number;
  digit1Opacity: number;
  digit2Opacity: number;
  digit3Opacity: number;
  digit4Opacity: number;
  digit5Opacity: number;
  digit6Opacity: number;
  digit7Opacity: number;

  // 2. Complete 71-Student List (3.50s – 13.50s)
  rosterOpacity: number;
  rosterScrollY: number;

  // 3. Original PDF Page 10 — Failed Students (13.50s – 19.20s)
  p10Opacity: number;
  p10ClipY: number;
  p10ClipH: number;
  p10HighlightW: number;
  p10HighlightOpacity: number;
  p10DetailOpacity: number;
  p10DetailY: number;

  // 4. Dramatic Failed-Result Motion Graphics (19.20s – 24.00s)
  dramaticOpacity: number;
  dramaticGlowOpacity: number;
  dramaticRuleW: number;
  dramaticRegOpacity: number;
  dramaticRegY: number;
  dramaticNameOpacity: number;
  dramaticNameScale: number;
  dramaticMetaOpacity: number;

  // 5. Reconstructed CUSAT Degree Certificate Motion Graphics (24.00s – 32.00s)
  certOpacity: number;
  certPaperScaleX: number;
  certPaperScaleY: number;
  certPaperY: number;
  certBorderH: number;
  certWatermarkOpacity: number;
  certSheenX: number;
  certUniOpacity: number;
  certUniY: number;
  certRegOpacity: number;
  certRegY: number;
  certNameOpacity: number;
  certNameScale: number;
  certDegreeOpacity: number;
  certDegreeY: number;
  certClassOpacity: number;
  certClassScale: number;
  certDatesOpacity: number;
  certDatesY: number;
}

export function createInitialFilmState(): FilmVisualState {
  return {
    camX: 540,
    camY: 960,
    camScale: 1,

    searchOpacity: 0,
    searchY: 24,
    searchBtnScale: 1,
    searchProgressW: 0,
    caretOpacity: 0,
    caretX: 224,
    digit0Opacity: 0,
    digit1Opacity: 0,
    digit2Opacity: 0,
    digit3Opacity: 0,
    digit4Opacity: 0,
    digit5Opacity: 0,
    digit6Opacity: 0,
    digit7Opacity: 0,

    rosterOpacity: 0,
    rosterScrollY: 0,

    p10Opacity: 0,
    p10ClipY: 960,
    p10ClipH: 0,
    p10HighlightW: 0,
    p10HighlightOpacity: 0,
    p10DetailOpacity: 0,
    p10DetailY: 22,

    dramaticOpacity: 0,
    dramaticGlowOpacity: 0,
    dramaticRuleW: 0,
    dramaticRegOpacity: 0,
    dramaticRegY: 26,
    dramaticNameOpacity: 0,
    dramaticNameScale: 0.94,
    dramaticMetaOpacity: 0,

    certOpacity: 0,
    certPaperScaleX: 0.9,
    certPaperScaleY: 0.05,
    certPaperY: 42,
    certBorderH: 0,
    certWatermarkOpacity: 0,
    certSheenX: -320,
    certUniOpacity: 0,
    certUniY: 16,
    certRegOpacity: 0,
    certRegY: 14,
    certNameOpacity: 0,
    certNameScale: 0.94,
    certDegreeOpacity: 0,
    certDegreeY: 14,
    certClassOpacity: 0,
    certClassScale: 0.94,
    certDatesOpacity: 0,
    certDatesY: 12,
  };
}

export function createFilmStateTimeline(
  state: FilmVisualState,
  sources: DocumentSources,
  onUpdate?: () => void,
  onComplete?: () => void,
): gsap.core.Timeline {
  const p10Box = computeFittedBox(sources.pdfPage10AspectRatio, 992, 740, 540, 588);
  // Focal coordinates on the actual Page 10 image for registration cell 24100218
  const p10RegFocusX = p10Box.x + sources.pdfPage10Focus.x * p10Box.width;
  const p10RegFocusY = p10Box.y + sources.pdfPage10Focus.y * p10Box.height;

  // 71-student scroll distance: row height = 54px, viewport window = 1364px (~25 rows visible)
  const rowCount = sources.students.length;
  const totalRosterHeight = rowCount * 54;
  const maxRosterScroll = Math.max(0, totalRosterHeight - 1310);

  const tl = gsap.timeline({
    paused: true,
    onUpdate,
    onComplete,
  });

  // ---------------------------------------------------------
  // SCENE 1: SEARCH INTERFACE & 24100218 TYPING (0.00s – 3.50s)
  // ---------------------------------------------------------
  tl.to(state, { searchOpacity: 1, searchY: 0, duration: 0.45, ease: 'power3.out' }, 0.08)
    .to(state, { caretOpacity: 1, duration: 0.14 }, 0.52);

  DIGIT_CUES.forEach((cue, i) => {
    const prop = `digit${i}Opacity` as keyof FilmVisualState;
    tl.to(state, { [prop]: 1, duration: 0.08, ease: 'power1.out' }, cue)
      .to(state, { caretX: 224 + (i + 1) * 36, duration: 0.06, ease: 'power1.out' }, cue);
  });

  tl.to(state, { caretOpacity: 0, duration: 0.1 }, 2.38)
    .to(state, { searchBtnScale: 0.92, duration: 0.09, ease: 'power2.in' }, 2.44)
    .to(state, { searchBtnScale: 1, duration: 0.16, ease: 'power2.out' }, 2.53)
    .to(state, { searchProgressW: 840, duration: 0.52, ease: 'power2.inOut' }, 2.48)
    .to(state, { searchOpacity: 0, searchY: -28, duration: 0.34, ease: 'power2.in' }, 3.14);

  // ---------------------------------------------------------
  // SCENE 2: COMPLETE 71-STUDENT LIST (3.50s – 13.50s)
  // ---------------------------------------------------------
  tl.set(state, { camX: 540, camY: 960, camScale: 1 }, 3.48)
    .to(state, { rosterOpacity: 1, duration: 0.45, ease: 'power2.out' }, 3.52)
    .to(
      state,
      { rosterScrollY: maxRosterScroll, duration: 8.5, ease: 'none' },
      4.15,
    )
    .to(state, { rosterOpacity: 0, duration: 0.35, ease: 'power2.in' }, 13.15);

  // ---------------------------------------------------------
  // SCENE 3: ACTUAL PDF PAGE 10 — FAILED STUDENTS (13.50s – 19.20s)
  // ---------------------------------------------------------
  tl.set(state, { camX: 540, camY: 960, camScale: 0.96, p10Opacity: 1 }, 13.50)
    .to(
      state,
      { p10ClipY: 130, p10ClipH: 870, duration: 0.62, ease: 'power2.inOut' },
      13.54,
    )
    .to(
      state,
      { camX: 540, camY: 925, camScale: 1.03, duration: 0.85, ease: 'power2.inOut' },
      14.20,
    )
    .to(state, { p10HighlightOpacity: 1, duration: 0.06 }, 14.55)
    .to(state, { p10HighlightW: p10Box.width * 0.98, duration: 0.58, ease: 'power2.out' }, 14.58)
    .to(
      state,
      { p10DetailOpacity: 1, p10DetailY: 0, duration: 0.55, ease: 'power3.out' },
      15.10,
    );

  // ---------------------------------------------------------
  // SCENE 4: DRAMATIC FAILED-RESULT MOTION GRAPHICS (19.20s – 24.00s)
  // ---------------------------------------------------------
  tl.to(
    state,
    { p10DetailOpacity: 0, duration: 0.42, ease: 'power2.in' },
    19.15,
  )
    .to(
      state,
      {
        camX: p10RegFocusX,
        camY: p10RegFocusY,
        camScale: 2.35,
        duration: 1.2,
        ease: 'power2.inOut',
      },
      19.22,
    )
    .to(state, { p10Opacity: 0, duration: 0.48, ease: 'power2.inOut' }, 19.95)
    .set(state, { camX: 540, camY: 960, camScale: 1.0 }, 20.43)
    .to(
      state,
      {
        dramaticOpacity: 1,
        dramaticGlowOpacity: 1,
        duration: 0.45,
        ease: 'power2.out',
      },
      20.44,
    )
    .to(
      state,
      { dramaticRegOpacity: 1, dramaticRegY: 0, duration: 0.55, ease: 'power3.out' },
      20.52,
    )
    .to(
      state,
      { dramaticRuleW: 760, duration: 0.65, ease: 'power2.out' },
      20.85,
    )
    .to(
      state,
      { dramaticNameOpacity: 1, dramaticNameScale: 1.02, duration: 0.72, ease: 'power3.out' },
      21.15,
    )
    .to(
      state,
      { dramaticMetaOpacity: 1, duration: 0.50, ease: 'power2.out' },
      21.65,
    )
    .to(
      state,
      { camScale: 1.07, duration: 2.0, ease: 'power1.inOut' },
      21.65,
    )
    .to(state, { dramaticOpacity: 0, duration: 0.42, ease: 'power2.inOut' }, 23.58);

  // ---------------------------------------------------------
  // SCENE 5: RECONSTRUCTED CERTIFICATE PRESENTATION (24.00s – 32.00s)
  // ---------------------------------------------------------
  tl.set(state, { camX: 540, camY: 960, camScale: 0.96, certOpacity: 1 }, 24.00)
    .to(
      state,
      {
        certPaperScaleX: 1,
        certPaperScaleY: 1,
        certPaperY: 0,
        duration: 0.72,
        ease: 'power3.out',
      },
      24.02,
    )
    .to(
      state,
      { certBorderH: 1254, duration: 0.78, ease: 'power2.inOut' },
      24.48,
    )
    .to(
      state,
      { certWatermarkOpacity: 1, duration: 0.65, ease: 'power2.out' },
      24.65,
    )
    .to(
      state,
      { certSheenX: 1220, duration: 1.1, ease: 'power2.inOut' },
      24.68,
    )
    .to(
      state,
      { camX: 540, camY: 640, camScale: 1.14, duration: 0.95, ease: 'power2.inOut' },
      24.82,
    )
    .to(
      state,
      { certUniOpacity: 1, certUniY: 0, duration: 0.58, ease: 'power3.out' },
      25.08,
    )
    .to(
      state,
      { certRegOpacity: 1, certRegY: 0, duration: 0.50, ease: 'power3.out' },
      25.60,
    )
    .to(
      state,
      { camX: 540, camY: 845, camScale: 1.18, duration: 0.95, ease: 'power2.inOut' },
      26.05,
    )
    .to(
      state,
      { certNameOpacity: 1, certNameScale: 1, duration: 0.58, ease: 'power3.out' },
      26.28,
    )
    .to(
      state,
      { camX: 540, camY: 1030, camScale: 1.15, duration: 0.92, ease: 'power2.inOut' },
      27.20,
    )
    .to(
      state,
      { certDegreeOpacity: 1, certDegreeY: 0, duration: 0.58, ease: 'power3.out' },
      27.35,
    )
    .to(
      state,
      { camX: 540, camY: 1205, camScale: 1.16, duration: 0.92, ease: 'power2.inOut' },
      28.35,
    )
    .to(
      state,
      { certClassOpacity: 1, certClassScale: 1, duration: 0.54, ease: 'power3.out' },
      28.45,
    )
    .to(
      state,
      { certDatesOpacity: 1, certDatesY: 0, duration: 0.56, ease: 'power3.out' },
      28.92,
    )
    .to(
      state,
      { camX: 540, camY: 960, camScale: 1.02, duration: 1.05, ease: 'power2.inOut' },
      29.75,
    )
    .to({}, { duration: 0.01 }, FILM_DURATION - 0.01);

  return tl;
}
