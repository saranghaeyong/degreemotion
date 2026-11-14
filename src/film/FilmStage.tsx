import React, { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import {
  buildHorizontalLatticePath,
  buildSideGuillochePaths,
  buildWatermarkRosettePetals,
} from './certificateGeometry';
import {
  REG_DIGITS,
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

  // Scene 2: Complete 71-Student List & Sarang FAILED Highlight
  const rosterGroupRef = useRef<SVGGElement>(null);
  const rosterScrollRef = useRef<SVGGElement>(null);
  const rosterFailFillRef = useRef<SVGRectElement>(null);
  const rosterFailBarRef = useRef<SVGRectElement>(null);
  const rosterFailBadgeRef = useRef<SVGRectElement>(null);
  const rosterFailBorderRef = useRef<SVGRectElement>(null);

  // Scene 3: Digitally Recreated Page 10 — Failed Students
  const p10GroupRef = useRef<SVGGElement>(null);
  const p10ClipRectRef = useRef<SVGRectElement>(null);
  const p10HeadingRectRef = useRef<SVGRectElement>(null);
  const p10RowFillRef = useRef<SVGRectElement>(null);
  const p10RowBarRef = useRef<SVGRectElement>(null);
  const p10RegCellFillRef = useRef<SVGRectElement>(null);
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

  // Scene 5: Reconstructed Certificate
  const certGroupRef = useRef<SVGGElement>(null);
  const certBorderRectRef = useRef<SVGRectElement>(null);
  const certWatermarkRef = useRef<SVGGElement>(null);
  const certSheenRef = useRef<SVGRectElement>(null);
  const certUniRef = useRef<SVGGElement>(null);
  const certRegRef = useRef<SVGGElement>(null);
  const certNameOpacityRef = useRef<SVGGElement>(null);
  const certNameScaleRef = useRef<SVGGElement>(null);
  const certDegreeRef = useRef<SVGGElement>(null);
  const certClassRef = useRef<SVGGElement>(null);
  const certDatesRef = useRef<SVGGElement>(null);

  const callbacksRef = useRef({ onTimeUpdate, onComplete });
  callbacksRef.current = { onTimeUpdate, onComplete };

  const certArtwork = useMemo(
    () => ({
      leftGuilloche: buildSideGuillochePaths(114, 354, 1566),
      rightGuilloche: buildSideGuillochePaths(966, 354, 1566),
      bottomLattice: [0, 1, 2, 3].map((i) =>
        buildHorizontalLatticePath(172, 908, 1456 + i * 24, 5, 48, i * 0.9),
      ),
      rosettePaths: buildWatermarkRosettePetals(540, 960, 172, 18),
    }),
    [],
  );

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
      const rosterHlOp = state.rosterFailHighlightOpacity.toFixed(3);
      const rosterHlW = Math.min(state.rosterFailHighlightW, 904).toFixed(1);
      if (rosterFailFillRef.current) {
        rosterFailFillRef.current.setAttribute('width', rosterHlW);
        rosterFailFillRef.current.setAttribute('opacity', rosterHlOp);
      }
      if (rosterFailBarRef.current) {
        rosterFailBarRef.current.setAttribute('opacity', rosterHlOp);
      }
      if (rosterFailBadgeRef.current) {
        rosterFailBadgeRef.current.setAttribute('opacity', rosterHlOp);
      }
      if (rosterFailBorderRef.current) {
        rosterFailBorderRef.current.setAttribute('opacity', rosterHlOp);
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
          Math.min(state.p10HighlightW, 912).toFixed(1),
        );
        p10RowFillRef.current.setAttribute('opacity', state.p10HighlightOpacity.toFixed(3));
      }
      if (p10RowBarRef.current) {
        p10RowBarRef.current.setAttribute('opacity', state.p10HighlightOpacity.toFixed(3));
      }
      if (p10RegCellFillRef.current) {
        p10RegCellFillRef.current.setAttribute('opacity', state.p10HighlightOpacity.toFixed(3));
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
        certGroupRef.current.setAttribute(
          'transform',
          `translate(540 ${(960 + state.certPaperY).toFixed(2)}) scale(${state.certPaperScaleX.toFixed(4)} ${state.certPaperScaleY.toFixed(4)}) translate(-540 -960)`,
        );
      }
      if (certBorderRectRef.current) {
        certBorderRectRef.current.setAttribute('height', state.certBorderH.toFixed(1));
      }
      if (certWatermarkRef.current) {
        certWatermarkRef.current.setAttribute(
          'opacity',
          (state.certWatermarkOpacity * 0.08).toFixed(3),
        );
      }
      if (certSheenRef.current) {
        certSheenRef.current.setAttribute('x', state.certSheenX.toFixed(1));
      }
      if (certUniRef.current) {
        certUniRef.current.setAttribute('opacity', state.certUniOpacity.toFixed(3));
        certUniRef.current.setAttribute('transform', `translate(0 ${state.certUniY.toFixed(2)})`);
      }
      if (certRegRef.current) {
        certRegRef.current.setAttribute('opacity', state.certRegOpacity.toFixed(3));
        certRegRef.current.setAttribute('transform', `translate(0 ${state.certRegY.toFixed(2)})`);
      }
      if (certNameOpacityRef.current) {
        certNameOpacityRef.current.setAttribute('opacity', state.certNameOpacity.toFixed(3));
      }
      if (certNameScaleRef.current) {
        certNameScaleRef.current.setAttribute(
          'transform',
          `translate(540 886) scale(${state.certNameScale.toFixed(4)}) translate(-540 -886)`,
        );
      }
      if (certDegreeRef.current) {
        certDegreeRef.current.setAttribute('opacity', state.certDegreeOpacity.toFixed(3));
        certDegreeRef.current.setAttribute('transform', `translate(0 ${state.certDegreeY.toFixed(2)})`);
      }
      if (certClassRef.current) {
        certClassRef.current.setAttribute('opacity', state.certClassOpacity.toFixed(3));
        certClassRef.current.setAttribute(
          'transform',
          `translate(540 1148) scale(${state.certClassScale.toFixed(4)}) translate(-540 -1148)`,
        );
      }
      if (certDatesRef.current) {
        certDatesRef.current.setAttribute('opacity', state.certDatesOpacity.toFixed(3));
        certDatesRef.current.setAttribute('transform', `translate(0 ${state.certDatesY.toFixed(2)})`);
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
  }, [sources, timelineRef]);

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
        <linearGradient id="certPaperBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCFBF7" />
          <stop offset="55%" stopColor="#F8F6EE" />
          <stop offset="100%" stopColor="#F2EFE4" />
        </linearGradient>
        <linearGradient id="certSecurityTint" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7BAE87" />
          <stop offset="50%" stopColor="#E5E7EB" />
          <stop offset="100%" stopColor="#9B8BA8" />
        </linearGradient>
        <linearGradient id="certSheenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <path id="certUniArc" d="M 150 546 Q 540 434 930 546" />
        <clipPath id="rosterClip">
          <rect x="88" y="322" width="904" height="1364" />
        </clipPath>
        <clipPath id="p10Mask">
          <rect ref={p10ClipRectRef} x="20" y="960" width="1040" height="0" />
        </clipPath>
        <clipPath id="certPaperClip">
          <rect x="70" y="334" width="940" height="1253" rx="5" />
        </clipPath>
        <clipPath id="certBorderMask">
          <rect ref={certBorderRectRef} x="70" y="334" width="940" height="0" />
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
                const statusText = isTarget ? 'FAILED' : 'PASSED';
                const statusFill = isTarget ? '#C62828' : '#16834A';

                return (
                  <g key={`${student.serial}-${student.regNo}`}>
                    {isTarget && (
                      <>
                        <rect x="88" y={rowY - 34} width="904" height="52" fill="#FEF2F2" />
                        <rect
                          ref={rosterFailFillRef}
                          x="88"
                          y={rowY - 34}
                          width="0"
                          height="52"
                          fill="#C62828"
                          fillOpacity="0.11"
                          opacity="0"
                        />
                        <rect
                          ref={rosterFailBarRef}
                          x="88"
                          y={rowY - 34}
                          width="5"
                          height="52"
                          fill="#C62828"
                          opacity="0"
                        />
                        <rect
                          ref={rosterFailBadgeRef}
                          x="898"
                          y={rowY - 22}
                          width="82"
                          height="32"
                          rx="4"
                          fill="#C62828"
                          fillOpacity="0.14"
                          stroke="#C62828"
                          strokeWidth="2"
                          opacity="0"
                        />
                        <rect
                          ref={rosterFailBorderRef}
                          x="88"
                          y={rowY - 34}
                          width="904"
                          height="52"
                          rx="4"
                          fill="none"
                          stroke="#C62828"
                          strokeWidth="2"
                          opacity="0"
                        />
                      </>
                    )}
                    <text
                      x="114"
                      y={rowY}
                      fill={isTarget ? '#171717' : '#525252'}
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
                      fontWeight={isTarget ? '800' : '700'}
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
                      fontWeight={isTarget ? '800' : '700'}
                    >
                      {student.regNo}
                    </text>
                    <text
                      x="968"
                      y={rowY}
                      textAnchor="end"
                      fill={statusFill}
                      fontFamily="Inter, sans-serif"
                      fontSize={isTarget ? '14' : '13'}
                      fontWeight="800"
                      letterSpacing={isTarget ? '0.8' : '0.6'}
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

        {/* SCENE 3: DIGITALLY RECREATED PAGE 10 — FAILED STUDENTS */}
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
              Report · Page 10 · Failed Students
            </text>
            <rect
              x="44"
              y="232"
              width="992"
              height="726"
              rx="8"
              fill="#FFFFFF"
              stroke="#D1D5DB"
              strokeWidth="1.5"
              filter="url(#docShadow)"
            />

            <text x="1004" y="268" textAnchor="end" fill="#525252" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="600">
              Page 10 of 10
            </text>
            <text x="540" y="302" textAnchor="middle" fill="#171717" fontFamily="Manrope, Inter, sans-serif" fontSize="22" fontWeight="800">
              Cochin University of Science &amp; Technology
            </text>
            <text x="540" y="330" textAnchor="middle" fill="#525252" fontFamily="Inter, sans-serif" fontSize="13.5" fontWeight="600">
              Master of Computer Applications-(April-2026)-IV-REGULAR - Master of Computer Application-- - 75
            </text>
            <text x="540" y="356" textAnchor="middle" fill="#171717" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700">
              Detailed Tabulation Report
            </text>
            <line x1="84" y1="378" x2="996" y2="378" stroke="#E5E7EB" strokeWidth="1.2" />

            <rect
              ref={p10HeadingRectRef}
              x="424"
              y="388"
              width="232"
              height="40"
              rx="4"
              fill="#C62828"
              fillOpacity="0.09"
              stroke="#C62828"
              strokeWidth="1.5"
              opacity="0"
            />
            <text x="540" y="415" textAnchor="middle" fill="#C62828" fontFamily="Manrope, Inter, sans-serif" fontSize="21" fontWeight="800">
              {PAGE10_FAILED_24100218.heading}
            </text>

            {/* Page 10 Failed Students Table */}
            <rect x="84" y="442" width="912" height="66" fill="#F3F4F6" />
            <rect
              ref={p10RowFillRef}
              x="84"
              y="508"
              width="0"
              height="98"
              fill="#C62828"
              fillOpacity="0.11"
              opacity="0"
            />
            <rect
              ref={p10RowBarRef}
              x="84"
              y="508"
              width="5"
              height="98"
              fill="#C62828"
              opacity="0"
            />
            <rect
              ref={p10RegCellFillRef}
              x="134"
              y="508"
              width="122"
              height="98"
              fill="#C62828"
              fillOpacity="0.14"
              opacity="0"
            />
            <rect x="84" y="442" width="912" height="164" fill="none" stroke="#525252" strokeWidth="1.4" />
            <line x1="84" y1="508" x2="996" y2="508" stroke="#525252" strokeWidth="1.3" />
            <line x1="134" y1="442" x2="134" y2="606" stroke="#9CA3AF" strokeWidth="1.1" />
            <line x1="256" y1="442" x2="256" y2="606" stroke="#9CA3AF" strokeWidth="1.1" />
            <line x1="441" y1="442" x2="441" y2="606" stroke="#9CA3AF" strokeWidth="1.1" />
            <line x1="626" y1="442" x2="626" y2="606" stroke="#9CA3AF" strokeWidth="1.1" />
            <line x1="811" y1="442" x2="811" y2="606" stroke="#9CA3AF" strokeWidth="1.1" />

            {/* Table Headers */}
            <text x="109" y="481" textAnchor="middle" fill="#171717" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">Sl no</text>
            <text x="195" y="470" textAnchor="middle" fill="#171717" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">Enrolment</text>
            <text x="195" y="490" textAnchor="middle" fill="#171717" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">Number</text>
            <text x="348.5" y="470" textAnchor="middle" fill="#171717" fontFamily="Inter, sans-serif" fontSize="12.5" fontWeight="700">(gpa-credits-totalmarks,</text>
            <text x="348.5" y="490" textAnchor="middle" fill="#171717" fontFamily="Inter, sans-serif" fontSize="12.5" fontWeight="700">Sem--1)</text>
            <text x="533.5" y="470" textAnchor="middle" fill="#171717" fontFamily="Inter, sans-serif" fontSize="12.5" fontWeight="700">(gpa-credits-totalmarks,</text>
            <text x="533.5" y="490" textAnchor="middle" fill="#171717" fontFamily="Inter, sans-serif" fontSize="12.5" font-weight="700">Sem--2)</text>
            <text x="718.5" y="470" textAnchor="middle" fill="#171717" fontFamily="Inter, sans-serif" fontSize="12.5" fontWeight="700">(gpa-credits-totalmarks,</text>
            <text x="718.5" y="490" textAnchor="middle" fill="#171717" fontFamily="Inter, sans-serif" fontSize="12.5" fontWeight="700">Sem--3)</text>
            <text x="903.5" y="470" textAnchor="middle" fill="#171717" fontFamily="Inter, sans-serif" fontSize="12.5" fontWeight="700">(gpa-credits-totalmarks,</text>
            <text x="903.5" y="490" textAnchor="middle" fill="#171717" fontFamily="Inter, sans-serif" fontSize="12.5" fontWeight="700">Sem--4)</text>

            {/* Sole Failed Entry Row: 1 | 24100218 */}
            <text x="109" y="563" textAnchor="middle" fill="#171717" fontFamily="Inter, sans-serif" fontSize="16" fontWeight="700">1</text>
            <text x="195" y="564" textAnchor="middle" fill="#C62828" fontFamily="Manrope, Inter, sans-serif" fontSize="19" fontWeight="800">
              {PAGE10_FAILED_24100218.regNo}
            </text>

            <text x="348.5" y="549" textAnchor="middle" fill="#171717" fontFamily="Inter, sans-serif" fontSize="13.5" fontWeight="600">(6.58 -24.00 -411.00 ,</text>
            <text x="348.5" y="574" textAnchor="middle" fill="#525252" fontFamily="Inter, sans-serif" fontSize="13.5" fontWeight="600">Sem--1)</text>

            <text x="533.5" y="549" textAnchor="middle" fill="#171717" fontFamily="Inter, sans-serif" fontSize="13.5" fontWeight="600">(7.00 -24.00 -452.00 ,</text>
            <text x="533.5" y="574" textAnchor="middle" fill="#525252" fontFamily="Inter, sans-serif" fontSize="13.5" fontWeight="600">Sem--2)</text>

            <text x="718.5" y="549" textAnchor="middle" fill="#C62828" fontFamily="Inter, sans-serif" fontSize="13.5" fontWeight="800">(0.00 -18.00 -380.00 ,</text>
            <text x="718.5" y="574" textAnchor="middle" fill="#C62828" fontFamily="Inter, sans-serif" fontSize="13.5" fontWeight="800">Sem--3)</text>

            <text x="903.5" y="549" textAnchor="middle" fill="#171717" fontFamily="Inter, sans-serif" fontSize="13.5" fontWeight="600">(10.00 -16.00 -360.00 ,</text>
            <text x="903.5" y="574" textAnchor="middle" fill="#525252" fontFamily="Inter, sans-serif" fontSize="13.5" fontWeight="600">Sem--4)</text>

            <rect
              ref={p10RowBorderRef}
              x="84"
              y="508"
              width="912"
              height="98"
              fill="none"
              stroke="#C62828"
              strokeWidth="2"
              opacity="0"
            />
            <rect
              ref={p10RegBoxRef}
              x="134"
              y="508"
              width="122"
              height="98"
              fill="none"
              stroke="#C62828"
              strokeWidth="3"
              opacity="0"
            />

            {/* Page 10 Exact Notes & Date */}
            <text x="84" y="658" fill="#171717" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700">Note :</text>
            <text x="102" y="690" fill="#525252" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="500">{'•  * - Re - Examination Marks'}</text>
            <text x="102" y="718" fill="#525252" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="500">{'•  **** - Not Applied for subject A - Absent'}</text>
            <text x="102" y="746" fill="#525252" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="500">{'•  WH - WithHeld'}</text>
            <text x="84" y="792" fill="#171717" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="600">Note: Marks = C.A + E.S + Moderation</text>
            <text x="84" y="824" fill="#171717" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700">Dated : Apr 29, 2026</text>
            <text x="996" y="886" textAnchor="end" fill="#171717" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700">Signature</text>
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

        {/* SCENE 5: RECONSTRUCTED CUSAT DEGREE CERTIFICATE MOTION GRAPHICS */}
        <g ref={certGroupRef} opacity="0">
          <rect x="82" y="346" width="940" height="1253" rx="6" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" />
          <rect x="76" y="340" width="940" height="1253" rx="6" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="1" />
          <rect
            x="70"
            y="334"
            width="940"
            height="1253"
            rx="5"
            fill="url(#certPaperBg)"
            stroke="#CFC8B8"
            strokeWidth="1.5"
            filter="url(#docShadow)"
          />

          <g clipPath="url(#certPaperClip)">
            <rect x="70" y="334" width="940" height="270" fill="url(#certSecurityTint)" opacity="0.24" />
            <rect x="70" y="1428" width="940" height="159" fill="url(#certSecurityTint)" opacity="0.24" />
            {certArtwork.bottomLattice.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="#8C968F" strokeWidth="0.9" strokeOpacity="0.28" />
            ))}

            <rect
              ref={certSheenRef}
              x="-320"
              y="334"
              width="260"
              height="1253"
              fill="url(#certSheenGrad)"
              transform="skewX(-14)"
            />

            <g clipPath="url(#certBorderMask)">
              <rect x="84" y="348" width="912" height="1225" rx="3" fill="none" stroke="#BDB6A5" strokeWidth="1" />
              <rect x="156" y="608" width="768" height="808" rx="2" fill="none" stroke="#D6D0C0" strokeWidth="1.1" />
              {certArtwork.leftGuilloche.map((d, i) => (
                <path key={`lg-${i}`} d={d} fill="none" stroke="#5E926B" strokeWidth="1.2" strokeOpacity="0.58" />
              ))}
              {certArtwork.rightGuilloche.map((d, i) => (
                <path key={`rg-${i}`} d={d} fill="none" stroke="#7F6E8E" strokeWidth="1.2" strokeOpacity="0.58" />
              ))}
              <path
                d="M 164 590 Q 340 426 540 426 Q 740 426 916 590"
                fill="none"
                stroke="#9C9585"
                strokeWidth="1.4"
                strokeOpacity="0.65"
              />
              <path
                d="M 184 598 Q 350 444 540 444 Q 730 444 896 598"
                fill="none"
                stroke="#9C9585"
                strokeWidth="0.9"
                strokeOpacity="0.55"
              />
              <path
                d="M 225 604 Q 370 534 540 534 Q 710 534 855 604"
                fill="none"
                stroke="#9C9585"
                strokeWidth="1"
                strokeOpacity="0.55"
              />
            </g>

            <g ref={certWatermarkRef} opacity="0" stroke="#6B7280" fill="none">
              <circle cx="540" cy="960" r="196" strokeWidth="1.4" />
              <circle cx="540" cy="960" r="168" strokeWidth="1" strokeDasharray="5 4" />
              <circle cx="540" cy="960" r="76" strokeWidth="1.2" />
              <path d={certArtwork.rosettePaths} strokeWidth="1.1" />
            </g>

            <g ref={certUniRef} opacity="0">
              <g transform="translate(540 398)" stroke="#6B7280" fill="none" strokeWidth="1.3">
                <circle cx="0" cy="0" r="24" />
                <circle cx="0" cy="0" r="16" />
                <path d="M -12 4 L 0 -10 L 12 4 Z" />
                <line x1="-18" y1="28" x2="18" y2="28" />
              </g>
              <text
                fill="#1F2937"
                fontFamily="Playfair Display, serif"
                fontSize="33"
                fontWeight="700"
                letterSpacing="0.4"
              >
                <textPath href="#certUniArc" startOffset="50%" textAnchor="middle">
                  {CERTIFICATE_FACTS.university}
                </textPath>
              </text>
              <line x1="176" y1="608" x2="904" y2="608" stroke="#D1CBC0" strokeWidth="1" />
            </g>

            <g ref={certRegRef} opacity="0">
              <text
                x="176"
                y="654"
                fill="#374151"
                fontFamily="Playfair Display, serif"
                fontSize="19"
                fontWeight="700"
              >
                Register Number : {CERTIFICATE_FACTS.regNo}
              </text>
              <text
                x="540"
                y="736"
                textAnchor="middle"
                fill="#1F2937"
                fontFamily="Playfair Display, serif"
                fontSize="27"
                fontWeight="700"
                letterSpacing="1.8"
              >
                FACULTY OF TECHNOLOGY
              </text>
            </g>

            <g ref={certNameOpacityRef} opacity="0">
              <text
                x="540"
                y="794"
                textAnchor="middle"
                fill="#374151"
                fontFamily="Playfair Display, serif"
                fontSize="18.5"
                fontStyle="italic"
              >
                The Academic Council of the {CERTIFICATE_FACTS.university}
              </text>
              <text
                x="540"
                y="826"
                textAnchor="middle"
                fill="#374151"
                fontFamily="Playfair Display, serif"
                fontSize="18.5"
                fontStyle="italic"
              >
                hereby makes known that
              </text>
              <g ref={certNameScaleRef}>
                <text
                  x="540"
                  y="896"
                  textAnchor="middle"
                  fill="#171717"
                  fontFamily="Manrope, Inter, sans-serif"
                  fontSize="36"
                  fontWeight="800"
                  letterSpacing="2.4"
                >
                  {CERTIFICATE_FACTS.name}
                </text>
              </g>
            </g>

            <g ref={certDegreeRef} opacity="0">
              <text
                x="540"
                y="948"
                textAnchor="middle"
                fill="#374151"
                fontFamily="Playfair Display, serif"
                fontSize="18.5"
                fontStyle="italic"
              >
                has been awarded the Degree of
              </text>
              <text
                x="540"
                y="1006"
                textAnchor="middle"
                fill="#171717"
                fontFamily="Manrope, Inter, sans-serif"
                fontSize="25"
                fontWeight="800"
                letterSpacing="1.1"
              >
                MASTER OF COMPUTER APPLICATIONS
              </text>
              <text
                x="540"
                y="1062"
                textAnchor="middle"
                fill="#374151"
                fontFamily="Playfair Display, serif"
                fontSize="16.8"
                fontStyle="italic"
              >
                He/She having undergone the prescribed course of study and having been certified by duly
              </text>
              <text
                x="540"
                y="1092"
                textAnchor="middle"
                fill="#374151"
                fontFamily="Playfair Display, serif"
                fontSize="16.8"
                fontStyle="italic"
              >
                appointed examiners to be qualified to receive the same and placed by them in the
              </text>
            </g>

            <g ref={certClassRef} opacity="0">
              <text
                x="540"
                y="1156"
                textAnchor="middle"
                fill="#171717"
                fontFamily="Playfair Display, serif"
                fontSize="30"
                fontWeight="700"
              >
                {CERTIFICATE_FACTS.classification}
              </text>
            </g>

            <g ref={certDatesRef} opacity="0">
              <text
                x="540"
                y="1204"
                textAnchor="middle"
                fill="#374151"
                fontFamily="Playfair Display, serif"
                fontSize="18.5"
                fontStyle="italic"
              >
                at the examination held in
              </text>
              <text
                x="540"
                y="1256"
                textAnchor="middle"
                fill="#171717"
                fontFamily="Manrope, Inter, sans-serif"
                fontSize="25"
                fontWeight="800"
              >
                {CERTIFICATE_FACTS.examination}
              </text>
              <text
                x="540"
                y="1312"
                textAnchor="middle"
                fill="#374151"
                fontFamily="Playfair Display, serif"
                fontSize="18.5"
                fontStyle="italic"
              >
                Given under the seal of the University this day, {CERTIFICATE_FACTS.awardDate}.
              </text>
              <text x="176" y="1484" fill="#525252" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="600">
                Kochi - 682 022
              </text>
              <text x="176" y="1510" fill="#525252" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="600">
                Kerala, India.
              </text>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
};
