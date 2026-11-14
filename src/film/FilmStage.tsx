import React, { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import {
  REG_DIGITS,
  computeFittedBox,
  createFilmStateTimeline,
  createInitialFilmState,
} from './choreography';
import {
  CERTIFICATE_FACTS,
  CUSAT_IDENTITY,
  FILM_HEIGHT,
  FILM_WIDTH,
  PAGE10_FAILED_24100218,
  type DocumentSources,
} from './types';

interface FilmStageProps {
  sources: DocumentSources;
  svgRef: React.RefObject<SVGSVGElement | null>;
  timelineRef: React.MutableRefObject<gsap.core.Timeline | null>;
  onTimeUpdate?: (time: number) => void;
  onComplete?: () => void;
}

export const FilmStage: React.FC<FilmStageProps> = ({
  sources,
  svgRef,
  timelineRef,
  onTimeUpdate,
  onComplete,
}) => {
  const cameraRef = useRef<SVGGElement>(null);

  // Scene 1: Search
  const searchGroupRef = useRef<SVGGElement>(null);
  const searchBtnRef = useRef<SVGGElement>(null);
  const searchProgressRef = useRef<SVGRectElement>(null);
  const caretRef = useRef<SVGRectElement>(null);
  const digitRefs = useRef<(SVGTextElement | null)[]>([]);

  // Scene 2: Complete 71-Student List
  const rosterGroupRef = useRef<SVGGElement>(null);
  const rosterScrollRef = useRef<SVGGElement>(null);

  // Scene 3: Page 10 — Failed Students
  const p10GroupRef = useRef<SVGGElement>(null);
  const p10ClipRectRef = useRef<SVGRectElement>(null);
  const p10HeadingRectRef = useRef<SVGRectElement>(null);
  const p10RowFillRef = useRef<SVGRectElement>(null);
  const p10RowBarRef = useRef<SVGRectElement>(null);
  const p10RowBorderRef = useRef<SVGRectElement>(null);
  const p10RegBoxRef = useRef<SVGRectElement>(null);
  const p10DetailGroupRef = useRef<SVGGElement>(null);

  // Scene 4: Dramatic Failed-Result Motion Graphics
  const dramaticGroupRef = useRef<SVGGElement>(null);
  const dramaticGlowRef = useRef<SVGCircleElement>(null);
  const dramaticRuleRef = useRef<SVGLineElement>(null);
  const dramaticRegGroupRef = useRef<SVGGElement>(null);
  const dramaticNameGroupRef = useRef<SVGGElement>(null);
  const dramaticMetaGroupRef = useRef<SVGGElement>(null);

  // Scene 5: Certificate
  const certGroupRef = useRef<SVGGElement>(null);
  const certClipRectRef = useRef<SVGRectElement>(null);

  const callbacksRef = useRef({ onTimeUpdate, onComplete });
  callbacksRef.current = { onTimeUpdate, onComplete };

  const p10Box = useMemo(
    () => computeFittedBox(sources.pdfPage10AspectRatio, 992, 740, 540, 588),
    [sources.pdfPage10AspectRatio],
  );

  const certBox = useMemo(
    () => computeFittedBox(sources.certificateAspectRatio, 1020, 1760, 540, 960),
    [sources.certificateAspectRatio],
  );

  const p10RowX = p10Box.x + p10Box.width * 0.01;
  const p10RowY = p10Box.y + p10Box.height * 0.663;
  const p10RowW = p10Box.width * 0.98;
  const p10RowH = p10Box.height * 0.048;

  const p10HeadingX = p10Box.x + p10Box.width * 0.445;
  const p10HeadingY = p10Box.y + p10Box.height * 0.604;
  const p10HeadingW = p10Box.width * 0.11;
  const p10HeadingH = p10Box.height * 0.025;

  const p10RegX = p10Box.x + p10Box.width * 0.036;
  const p10RegW = p10Box.width * 0.09;

  useEffect(() => {
    const state = createInitialFilmState();

    const applyState = () => {
      if (cameraRef.current) {
        cameraRef.current.setAttribute(
          'transform',
          `translate(540 960) scale(${state.camScale.toFixed(5)}) translate(${(-state.camX).toFixed(2)} ${(-state.camY).toFixed(2)})`,
        );
      }

      // Scene 1
      if (searchGroupRef.current) {
        searchGroupRef.current.setAttribute('opacity', state.searchOpacity.toFixed(3));
        searchGroupRef.current.setAttribute('transform', `translate(0 ${state.searchY.toFixed(2)})`);
      }
      if (searchBtnRef.current) {
        searchBtnRef.current.setAttribute(
          'transform',
          `translate(916 954) scale(${state.searchBtnScale.toFixed(4)}) translate(-916 -954)`,
        );
      }
      if (searchProgressRef.current) {
        searchProgressRef.current.setAttribute('width', state.searchProgressW.toFixed(1));
      }
      if (caretRef.current) {
        caretRef.current.setAttribute('opacity', state.caretOpacity.toFixed(3));
        caretRef.current.setAttribute('x', state.caretX.toFixed(1));
      }

      const dOps = [
        state.digit0Opacity,
        state.digit1Opacity,
        state.digit2Opacity,
        state.digit3Opacity,
        state.digit4Opacity,
        state.digit5Opacity,
        state.digit6Opacity,
        state.digit7Opacity,
      ];
      dOps.forEach((op, idx) => {
        const el = digitRefs.current[idx];
        if (el) el.setAttribute('opacity', op.toFixed(3));
      });

      // Scene 2
      if (rosterGroupRef.current) {
        rosterGroupRef.current.setAttribute('opacity', state.rosterOpacity.toFixed(3));
      }
      if (rosterScrollRef.current) {
        rosterScrollRef.current.setAttribute(
          'transform',
          `translate(0 ${(-state.rosterScrollY).toFixed(2)})`,
        );
      }

      // Scene 3
      if (p10GroupRef.current) {
        p10GroupRef.current.setAttribute('opacity', state.p10Opacity.toFixed(3));
      }
      if (p10ClipRectRef.current) {
        p10ClipRectRef.current.setAttribute('y', state.p10ClipY.toFixed(1));
        p10ClipRectRef.current.setAttribute('height', state.p10ClipH.toFixed(1));
      }
      if (p10HeadingRectRef.current) {
        p10HeadingRectRef.current.setAttribute('opacity', state.p10HighlightOpacity.toFixed(3));
      }
      if (p10RowFillRef.current) {
        p10RowFillRef.current.setAttribute(
          'width',
          Math.min(state.p10HighlightW, p10RowW).toFixed(1),
        );
        p10RowFillRef.current.setAttribute('opacity', state.p10HighlightOpacity.toFixed(3));
      }
      if (p10RowBarRef.current) {
        p10RowBarRef.current.setAttribute('opacity', state.p10HighlightOpacity.toFixed(3));
      }
      if (p10RowBorderRef.current) {
        p10RowBorderRef.current.setAttribute('opacity', state.p10HighlightOpacity.toFixed(3));
      }
      if (p10RegBoxRef.current) {
        p10RegBoxRef.current.setAttribute('opacity', state.p10HighlightOpacity.toFixed(3));
      }
      if (p10DetailGroupRef.current) {
        p10DetailGroupRef.current.setAttribute('opacity', state.p10DetailOpacity.toFixed(3));
        p10DetailGroupRef.current.setAttribute(
          'transform',
          `translate(0 ${state.p10DetailY.toFixed(2)})`,
        );
      }

      // Scene 4
      if (dramaticGroupRef.current) {
        dramaticGroupRef.current.setAttribute('opacity', state.dramaticOpacity.toFixed(3));
      }
      if (dramaticGlowRef.current) {
        dramaticGlowRef.current.setAttribute('opacity', state.dramaticGlowOpacity.toFixed(3));
      }
      if (dramaticRuleRef.current) {
        dramaticRuleRef.current.setAttribute('x1', (540 - state.dramaticRuleW / 2).toFixed(1));
        dramaticRuleRef.current.setAttribute('x2', (540 + state.dramaticRuleW / 2).toFixed(1));
      }
      if (dramaticRegGroupRef.current) {
        dramaticRegGroupRef.current.setAttribute('opacity', state.dramaticRegOpacity.toFixed(3));
        dramaticRegGroupRef.current.setAttribute(
          'transform',
          `translate(0 ${state.dramaticRegY.toFixed(2)})`,
        );
      }
      if (dramaticNameGroupRef.current) {
        dramaticNameGroupRef.current.setAttribute('opacity', state.dramaticNameOpacity.toFixed(3));
        dramaticNameGroupRef.current.setAttribute(
          'transform',
          `translate(540 1030) scale(${state.dramaticNameScale.toFixed(4)}) translate(-540 -1030)`,
        );
      }
      if (dramaticMetaGroupRef.current) {
        dramaticMetaGroupRef.current.setAttribute('opacity', state.dramaticMetaOpacity.toFixed(3));
      }

      // Scene 5
      if (certGroupRef.current) {
        certGroupRef.current.setAttribute('opacity', state.certOpacity.toFixed(3));
      }
      if (certClipRectRef.current) {
        certClipRectRef.current.setAttribute('y', state.certClipY.toFixed(1));
        certClipRectRef.current.setAttribute('height', state.certClipH.toFixed(1));
      }
    };

    const tl = createFilmStateTimeline(
      state,
      sources,
      () => {
        applyState();
        callbacksRef.current.onTimeUpdate?.(tl.time());
      },
      () => {
        callbacksRef.current.onComplete?.();
      },
    );

    applyState();
    timelineRef.current = tl;

    return () => {
      tl.kill();
    };
  }, [p10RowW, sources, timelineRef]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${FILM_WIDTH} ${FILM_HEIGHT}`}
      width={FILM_WIDTH}
      height={FILM_HEIGHT}
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full select-none bg-[#FFFFFF]"
    >
      <defs>
        <filter id="docShadow" x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#171717" floodOpacity="0.10" />
        </filter>
        <radialGradient id="redRadialGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C62828" stopOpacity="0.16" />
          <stop offset="65%" stopColor="#C62828" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#C62828" stopOpacity="0" />
        </radialGradient>
        <clipPath id="rosterClip">
          <rect x="88" y="322" width="904" height="1364" />
        </clipPath>
        <clipPath id="p10DocClip">
          <rect x={p10Box.x} y={p10Box.y} width={p10Box.width} height={p10Box.height} rx="6" />
        </clipPath>
        <clipPath id="p10Mask">
          <rect ref={p10ClipRectRef} x="20" y="960" width="1040" height="0" />
        </clipPath>
        <clipPath id="certMask">
          <rect ref={certClipRectRef} x="10" y="1680" width="1060" height="0" />
        </clipPath>
      </defs>

      <rect width={FILM_WIDTH} height={FILM_HEIGHT} fill="#FFFFFF" />

      <g ref={cameraRef}>
        {/* SCENE 1: REGISTRATION NUMBER SEARCH */}
        <g ref={searchGroupRef}>
          <text
            x="120"
            y="794"
            fill="#2563EB"
            fontFamily="Inter, sans-serif"
            fontSize="14"
            fontWeight="700"
            letterSpacing="1.4"
          >
            {CUSAT_IDENTITY.university}
          </text>
          <text
            x="120"
            y="832"
            fill="#525252"
            fontFamily="Inter, sans-serif"
            fontSize="19"
            fontWeight="600"
          >
            {CUSAT_IDENTITY.reportTitle}
          </text>
          <text
            x="120"
            y="876"
            fill="#171717"
            fontFamily="Inter, sans-serif"
            fontSize="16"
            fontWeight="700"
          >
            Registration Number
          </text>
          <rect
            x="120"
            y="896"
            width="840"
            height="116"
            rx="12"
            fill="#FFFFFF"
            stroke="#D1D5DB"
            strokeWidth="1.5"
            filter="url(#docShadow)"
          />
          <g stroke="#525252" strokeWidth="2.4" fill="none" strokeLinecap="round">
            <circle cx="174" cy="951" r="14" />
            <line x1="184" y1="961" x2="195" y2="972" />
          </g>
          <g>
            {REG_DIGITS.map((d, i) => (
              <text
                key={i}
                ref={(el) => {
                  digitRefs.current[i] = el;
                }}
                x={228 + i * 36}
                y="970"
                opacity="0"
                fill="#171717"
                fontFamily="Manrope, Inter, sans-serif"
                fontSize="52"
                fontWeight="800"
              >
                {d}
              </text>
            ))}
          </g>
          <rect ref={caretRef} x="224" y="928" width="3" height="50" rx="1.5" fill="#2563EB" opacity="0" />
          <g ref={searchBtnRef}>
            <rect x="882" y="920" width="68" height="68" rx="8" fill="#2563EB" />
            <path
              d="M 904 954 L 928 954 M 920 946 L 928 954 L 920 962"
              stroke="#FFFFFF"
              strokeWidth="2.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <rect ref={searchProgressRef} x="120" y="1008" width="0" height="4" rx="2" fill="#2563EB" />
        </g>

        {/* SCENE 2: COMPLETE 71-STUDENT LIST */}
        <g ref={rosterGroupRef} opacity="0">
          <rect x="0" y="0" width={FILM_WIDTH} height={FILM_HEIGHT} fill="#F3F4F6" />
          <rect
            x="56"
            y="130"
            width="968"
            height="1660"
            rx="10"
            fill="#FFFFFF"
            stroke="#D1D5DB"
            strokeWidth="1.5"
            filter="url(#docShadow)"
          />
          <text
            x="96"
            y="188"
            fill="#2563EB"
            fontFamily="Inter, sans-serif"
            fontSize="13"
            fontWeight="700"
            letterSpacing="1.2"
          >
            {CUSAT_IDENTITY.university}
          </text>
          <text x="96" y="228" fill="#171717" fontFamily="Manrope, Inter, sans-serif" fontSize="25" fontWeight="800">
            Detailed Tabulation Report · Complete Student List
          </text>
          <text x="984" y="228" textAnchor="end" fill="#525252" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="600">
            {sources.students.length} Students · Pages 1–8
          </text>
          <line x1="88" y1="252" x2="992" y2="252" stroke="#D1D5DB" strokeWidth="1.2" />
          <rect x="88" y="266" width="904" height="46" fill="#F3F4F6" rx="4" />
          <text x="114" y="295" fill="#525252" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700">Sl.</text>
          <text x="190" y="295" fill="#525252" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700">Student Name</text>
          <text x="820" y="295" textAnchor="end" fill="#525252" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700">Registration No.</text>
          <text x="968" y="295" textAnchor="end" fill="#525252" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700">Record</text>
          <g clipPath="url(#rosterClip)">
            <g ref={rosterScrollRef}>
              {sources.students.map((student, idx) => {
                const rowY = 364 + idx * 54;
                const isTarget = student.regNo === '24100218';
                const nameFill = isTarget ? '#171717' : '#16834A';
                const statusText = isTarget ? '—' : 'PASSED';
                const statusFill = isTarget ? '#525252' : '#16834A';

                return (
                  <g key={`${student.serial}-${student.regNo}`}>
                    {isTarget && <rect x="88" y={rowY - 34} width="904" height="52" fill="#F3F4F6" />}
                    <text
                      x="114"
                      y={rowY}
                      fill="#525252"
                      fontFamily="Inter, sans-serif"
                      fontSize="16"
                      fontWeight={isTarget ? '700' : '600'}
                    >
                      {student.serial}
                    </text>
                    <text
                      x="190"
                      y={rowY}
                      fill={nameFill}
                      fontFamily="Manrope, Inter, sans-serif"
                      fontSize="18"
                      fontWeight="700"
                    >
                      {student.name}
                    </text>
                    <text
                      x="820"
                      y={rowY}
                      textAnchor="end"
                      fill="#171717"
                      fontFamily="Manrope, Inter, sans-serif"
                      fontSize="17"
                      fontWeight="700"
                    >
                      {student.regNo}
                    </text>
                    <text
                      x="968"
                      y={rowY}
                      textAnchor="end"
                      fill={statusFill}
                      fontFamily="Inter, sans-serif"
                      fontSize="13"
                      fontWeight="800"
                      letterSpacing="0.6"
                    >
                      {statusText}
                    </text>
                    <line x1="88" y1={rowY + 17} x2="992" y2={rowY + 17} stroke="#E5E7EB" strokeWidth="1" />
                  </g>
                );
              })}
            </g>
          </g>
          <line x1="88" y1="1700" x2="992" y2="1700" stroke="#D1D5DB" strokeWidth="1" />
          <text x="540" y="1744" textAnchor="middle" fill="#525252" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="500">
            Original Tabulation List · Pages 1–8 · Passed Entries Highlighted in Green
          </text>
        </g>

        {/* SCENE 3: FAILED STUDENTS — ORIGINAL PDF PAGE 10 */}
        <g ref={p10GroupRef} opacity="0">
          <g clipPath="url(#p10Mask)">
            <text
              x="44"
              y="168"
              fill="#2563EB"
              fontFamily="Inter, sans-serif"
              fontSize="14"
              fontWeight="700"
              letterSpacing="1.2"
            >
              {CUSAT_IDENTITY.university}
            </text>
            <text x="44" y="206" fill="#171717" fontFamily="Manrope, Inter, sans-serif" fontSize="26" fontWeight="800">
              Original Report · Page 10 · Failed Students
            </text>
            <rect
              x={p10Box.x}
              y={p10Box.y}
              width={p10Box.width}
              height={p10Box.height}
              rx="6"
              fill="#FFFFFF"
              stroke="#D1D5DB"
              strokeWidth="1.5"
              filter="url(#docShadow)"
            />
            {sources.pdfPage10DataUrl && (
              <g clipPath="url(#p10DocClip)">
                <image
                  href={sources.pdfPage10DataUrl}
                  x={p10Box.x}
                  y={p10Box.y}
                  width={p10Box.width}
                  height={p10Box.height}
                  preserveAspectRatio="xMidYMid meet"
                />
                <rect
                  ref={p10HeadingRectRef}
                  x={p10HeadingX}
                  y={p10HeadingY}
                  width={p10HeadingW}
                  height={p10HeadingH}
                  fill="#C62828"
                  fillOpacity="0.14"
                  stroke="#C62828"
                  strokeWidth="1.5"
                  opacity="0"
                />
                <rect
                  ref={p10RowFillRef}
                  x={p10RowX}
                  y={p10RowY}
                  width="0"
                  height={p10RowH}
                  fill="#C62828"
                  fillOpacity="0.18"
                  opacity="0"
                />
                <rect
                  ref={p10RowBarRef}
                  x={p10RowX}
                  y={p10RowY}
                  width="5"
                  height={p10RowH}
                  fill="#C62828"
                  opacity="0"
                />
                <rect
                  ref={p10RowBorderRef}
                  x={p10RowX}
                  y={p10RowY}
                  width={p10RowW}
                  height={p10RowH}
                  fill="none"
                  stroke="#C62828"
                  strokeWidth="2"
                  opacity="0"
                />
                <rect
                  ref={p10RegBoxRef}
                  x={p10RegX}
                  y={p10RowY}
                  width={p10RegW}
                  height={p10RowH}
                  fill="#C62828"
                  fillOpacity="0.22"
                  stroke="#C62828"
                  strokeWidth="3"
                  opacity="0"
                />
              </g>
            )}
          </g>

          <g ref={p10DetailGroupRef} opacity="0">
            <rect
              x="44"
              y="1004"
              width="992"
              height="650"
              rx="10"
              fill="#FFFFFF"
              stroke="#C62828"
              strokeWidth="2"
              filter="url(#docShadow)"
            />
            <rect x="44" y="1004" width="992" height="64" rx="10" fill="#C62828" fillOpacity="0.09" />
            <line x1="44" y1="1068" x2="1036" y2="1068" stroke="#C62828" strokeOpacity="0.35" strokeWidth="1.2" />
            <text x="76" y="1044" fill="#C62828" fontFamily="Manrope, Inter, sans-serif" fontSize="20" fontWeight="800" letterSpacing="0.8">
              FAILED STUDENTS · PAGE 10
            </text>
            <text x="1004" y="1044" textAnchor="end" fill="#C62828" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700">
              ONLY ENTRY LISTED
            </text>

            <text x="76" y="1126" fill="#525252" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700" letterSpacing="1.1">
              REGISTRATION NUMBER
            </text>
            <text x="76" y="1182" fill="#C62828" fontFamily="Manrope, Inter, sans-serif" fontSize="50" fontWeight="800">
              {PAGE10_FAILED_24100218.regNo}
            </text>

            <text x="1004" y="1126" textAnchor="end" fill="#525252" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700" letterSpacing="1.1">
              STUDENT NAME
            </text>
            <text x="1004" y="1182" textAnchor="end" fill="#C62828" fontFamily="Manrope, Inter, sans-serif" fontSize="44" fontWeight="800">
              {PAGE10_FAILED_24100218.name}
            </text>

            <line x1="76" y1="1214" x2="1004" y2="1214" stroke="#D1D5DB" strokeWidth="1.2" />
            <text x="76" y="1252" fill="#525252" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">SEMESTER</text>
            <text x="275" y="1252" fill="#525252" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">PRINTED RECORD (PAGE 10)</text>
            <text x="1004" y="1252" textAnchor="end" fill="#525252" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">GPA · CREDITS · MARKS</text>
            <line x1="76" y1="1268" x2="1004" y2="1268" stroke="#E5E7EB" strokeWidth="1" />

            {PAGE10_FAILED_24100218.semesters.map((sem, idx) => {
              const rowY = 1326 + idx * 80;
              const isSem3 = sem.code === 'Sem--3';
              return (
                <g key={sem.code}>
                  {isSem3 && (
                    <rect
                      x="64"
                      y={rowY - 40}
                      width="952"
                      height="62"
                      rx="6"
                      fill="#C62828"
                      fillOpacity="0.08"
                      stroke="#C62828"
                      strokeWidth="1.5"
                    />
                  )}
                  <text
                    x="76"
                    y={rowY}
                    fill={isSem3 ? '#C62828' : '#171717'}
                    fontFamily="Manrope, Inter, sans-serif"
                    fontSize="20"
                    fontWeight="800"
                  >
                    {sem.label}
                  </text>
                  <text
                    x="275"
                    y={rowY}
                    fill={isSem3 ? '#C62828' : '#525252'}
                    fontFamily="Inter, sans-serif"
                    fontSize="17"
                    fontWeight={isSem3 ? '700' : '600'}
                  >
                    {sem.raw}
                  </text>
                  <text
                    x="1004"
                    y={rowY}
                    textAnchor="end"
                    fill={isSem3 ? '#C62828' : '#171717'}
                    fontFamily="Manrope, Inter, sans-serif"
                    fontSize="19"
                    fontWeight="800"
                  >
                    {sem.gpa} · {sem.credits} cr · {sem.marks}
                  </text>
                  <line x1="76" y1={rowY + 28} x2="1004" y2={rowY + 28} stroke="#E5E7EB" strokeWidth="1" />
                </g>
              );
            })}
          </g>
        </g>

        {/* SCENE 4: DRAMATIC FAILED-RESULT MOTION GRAPHICS */}
        <g ref={dramaticGroupRef} opacity="0">
          <rect x="0" y="0" width={FILM_WIDTH} height={FILM_HEIGHT} fill="#FFFFFF" />
          <circle ref={dramaticGlowRef} cx="540" cy="960" r="560" fill="url(#redRadialGlow)" opacity="0" />

          <g stroke="#C62828" strokeWidth="3" fill="none" opacity="0.85">
            <path d="M 110 680 L 110 620 L 170 620" />
            <path d="M 970 680 L 970 620 L 910 620" />
            <path d="M 110 1240 L 110 1300 L 170 1300" />
            <path d="M 970 1240 L 970 1300 L 910 1300" />
          </g>

          <text
            x="540"
            y="704"
            textAnchor="middle"
            fill="#C62828"
            fontFamily="Inter, sans-serif"
            fontSize="18"
            fontWeight="800"
            letterSpacing="3.2"
          >
            FAILED STUDENTS · PAGE 10
          </text>

          <g ref={dramaticRegGroupRef} opacity="0">
            <text
              x="540"
              y="838"
              textAnchor="middle"
              fill="#C62828"
              fontFamily="Manrope, Inter, sans-serif"
              fontSize="112"
              fontWeight="800"
              letterSpacing="4"
            >
              {PAGE10_FAILED_24100218.regNo}
            </text>
          </g>

          <line ref={dramaticRuleRef} x1="540" y1="900" x2="540" y2="900" stroke="#C62828" strokeWidth="3" />

          <g ref={dramaticNameGroupRef} opacity="0">
            <text
              x="540"
              y="1044"
              textAnchor="middle"
              fill="#171717"
              fontFamily="Manrope, Inter, sans-serif"
              fontSize="94"
              fontWeight="800"
              letterSpacing="2.2"
            >
              {PAGE10_FAILED_24100218.name}
            </text>
          </g>

          <g ref={dramaticMetaGroupRef} opacity="0">
            <rect
              x="270"
              y="1116"
              width="540"
              height="58"
              rx="6"
              fill="#C62828"
              fillOpacity="0.09"
              stroke="#C62828"
              strokeWidth="1.75"
            />
            <text
              x="540"
              y="1153"
              textAnchor="middle"
              fill="#C62828"
              fontFamily="Manrope, Inter, sans-serif"
              fontSize="22"
              fontWeight="800"
              letterSpacing="0.8"
            >
              SEM--3 · GPA 0.00 · 18 CREDITS · 380 MARKS
            </text>
          </g>
        </g>

        {/* SCENE 5: ACTUAL pass.jpg CERTIFICATE REVEAL */}
        <g ref={certGroupRef} opacity="0" clipPath="url(#certMask)">
          <rect
            x={certBox.x}
            y={certBox.y}
            width={certBox.width}
            height={certBox.height}
            rx="4"
            fill="#FFFFFF"
            stroke="#D1D5DB"
            strokeWidth="1.25"
            filter="url(#docShadow)"
          />
          {sources.certificateImageDataUrl ? (
            <g>
              <image
                href={sources.certificateImageDataUrl}
                x={certBox.x}
                y={certBox.y}
                width={certBox.width}
                height={certBox.height}
                preserveAspectRatio="xMidYMid meet"
              />
              <rect
                x={certBox.x}
                y={certBox.y}
                width={certBox.width}
                height={certBox.height}
                fill="none"
                stroke="#D1D5DB"
                strokeWidth="1.5"
              />
            </g>
          ) : (
            <g>
              <rect
                x={certBox.x}
                y={certBox.y}
                width={certBox.width}
                height={certBox.height}
                rx="6"
                fill="#F3F4F6"
                stroke="#D1D5DB"
                strokeWidth="1.5"
              />
              <text x="540" y="960" textAnchor="middle" fill="#171717" fontFamily="Manrope, Inter, sans-serif" fontSize="24" fontWeight="700">
                {CERTIFICATE_FACTS.university}
              </text>
            </g>
          )}
        </g>
      </g>
    </svg>
  );
};
