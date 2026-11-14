import {
  buildHorizontalLatticePath,
  buildSideGuillochePaths,
  buildWatermarkRosettePetals,
} from './certificateGeometry';
import {
  REG_DIGITS,
  type FilmVisualState,
} from './choreography';
import {
  CERTIFICATE_FACTS,
  CUSAT_IDENTITY,
  FILM_HEIGHT,
  FILM_WIDTH,
  PAGE10_FAILED_24100218,
  type DocumentSources,
} from './types';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function vectorElevationShadow(x: number, y: number, w: number, h: number, rx: number): string {
  return `
    <rect x="${x}" y="${y + 12}" width="${w}" height="${h}" rx="${rx}" fill="#171717" fill-opacity="0.04" />
    <rect x="${x}" y="${y + 6}" width="${w}" height="${h}" rx="${rx}" fill="#171717" fill-opacity="0.05" />
    <rect x="${x}" y="${y + 2}" width="${w}" height="${h}" rx="${rx}" fill="#171717" fill-opacity="0.04" />`;
}

export function renderFilmSvgString(
  state: FilmVisualState,
  sources: DocumentSources,
  embeddedFontCss = '',
): string {
  const camTransform = `translate(540 960) scale(${state.camScale.toFixed(5)}) translate(${(-state.camX).toFixed(2)} ${(-state.camY).toFixed(2)})`;

  // SCENE 1: Search Interface & 24100218 Typing
  let searchBlock = '';
  if (state.searchOpacity > 0.002) {
    const digitsOpacity = [
      state.digit0Opacity,
      state.digit1Opacity,
      state.digit2Opacity,
      state.digit3Opacity,
      state.digit4Opacity,
      state.digit5Opacity,
      state.digit6Opacity,
      state.digit7Opacity,
    ];
    const digitsSvg = REG_DIGITS.map((d, i) =>
      digitsOpacity[i] > 0.002
        ? `<text x="${228 + i * 36}" y="970" opacity="${digitsOpacity[i].toFixed(3)}" fill="#171717" font-family="Manrope, Inter, sans-serif" font-size="52" font-weight="800">${d}</text>`
        : '',
    ).join('');

    searchBlock = `
      <g opacity="${state.searchOpacity.toFixed(3)}" transform="translate(0 ${state.searchY.toFixed(2)})">
        <text x="120" y="794" fill="#2563EB" font-family="Inter, sans-serif" font-size="14" font-weight="700" letter-spacing="1.4">${escapeXml(CUSAT_IDENTITY.university)}</text>
        <text x="120" y="832" fill="#525252" font-family="Inter, sans-serif" font-size="19" font-weight="600">${escapeXml(CUSAT_IDENTITY.reportTitle)}</text>
        <text x="120" y="876" fill="#171717" font-family="Inter, sans-serif" font-size="16" font-weight="700">Registration Number</text>
        ${vectorElevationShadow(120, 896, 840, 116, 12)}
        <rect x="120" y="896" width="840" height="116" rx="12" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="1.5" />
        <g stroke="#525252" stroke-width="2.4" fill="none" stroke-linecap="round">
          <circle cx="174" cy="951" r="14" />
          <line x1="184" y1="961" x2="195" y2="972" />
        </g>
        ${digitsSvg}
        ${state.caretOpacity > 0.002 ? `<rect x="${state.caretX.toFixed(1)}" y="928" width="3" height="50" rx="1.5" fill="#2563EB" opacity="${state.caretOpacity.toFixed(3)}" />` : ''}
        <g transform="translate(916 954) scale(${state.searchBtnScale.toFixed(4)}) translate(-916 -954)">
          <rect x="882" y="920" width="68" height="68" rx="8" fill="#2563EB" />
          <path d="M 904 954 L 928 954 M 920 946 L 928 954 L 920 962" stroke="#FFFFFF" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        </g>
        ${state.searchProgressW > 0.5 ? `<rect x="120" y="1008" width="${state.searchProgressW.toFixed(1)}" height="4" rx="2" fill="#2563EB" />` : ''}
      </g>`;
  }

  // SCENE 2: Complete 71-Student List (other 70 in #16834A green; SARANG R N marked FAILED in #C62828 with animated highlight)
  let rosterBlock = '';
  if (state.rosterOpacity > 0.002) {
    const rowsHtml =
      sources.students.length > 0
        ? sources.students
            .map((student, idx) => {
              const rowY = 364 + idx * 54;
              const isTarget = student.regNo === '24100218';
              const nameFill = isTarget ? '#171717' : '#16834A';
              const statusText = isTarget ? 'FAILED' : 'PASSED';
              const statusFill = isTarget ? '#C62828' : '#16834A';
              const hlOpacity = state.rosterFailHighlightOpacity;
              const hlW = Math.min(state.rosterFailHighlightW, 904);

              const targetHighlightSvg = isTarget
                ? `
                  <rect x="88" y="${rowY - 34}" width="904" height="52" fill="#FEF2F2" />
                  ${
                    hlOpacity > 0.002
                      ? `
                    <rect x="88" y="${rowY - 34}" width="${hlW.toFixed(1)}" height="52" fill="#C62828" fill-opacity="0.11" opacity="${hlOpacity.toFixed(3)}" />
                    <rect x="88" y="${rowY - 34}" width="5" height="52" fill="#C62828" opacity="${hlOpacity.toFixed(3)}" />
                    <rect x="898" y="${rowY - 22}" width="82" height="32" rx="4" fill="#C62828" fill-opacity="0.14" stroke="#C62828" stroke-width="2" opacity="${hlOpacity.toFixed(3)}" />
                    <rect x="88" y="${rowY - 34}" width="904" height="52" rx="4" fill="none" stroke="#C62828" stroke-width="2" opacity="${hlOpacity.toFixed(3)}" />`
                      : ''
                  }`
                : '';

              return `
                ${targetHighlightSvg}
                <text x="114" y="${rowY}" fill="${isTarget ? '#171717' : '#525252'}" font-family="Inter, sans-serif" font-size="16" font-weight="${isTarget ? '700' : '600'}">${student.serial}</text>
                <text x="190" y="${rowY}" fill="${nameFill}" font-family="Manrope, Inter, sans-serif" font-size="18" font-weight="${isTarget ? '800' : '700'}">${escapeXml(student.name)}</text>
                <text x="820" y="${rowY}" text-anchor="end" fill="#171717" font-family="Manrope, Inter, sans-serif" font-size="17" font-weight="${isTarget ? '800' : '700'}">${escapeXml(student.regNo)}</text>
                <text x="968" y="${rowY}" text-anchor="end" fill="${statusFill}" font-family="Inter, sans-serif" font-size="${isTarget ? '14' : '13'}" font-weight="800" letter-spacing="${isTarget ? '0.8' : '0.6'}">${statusText}</text>
                <line x1="88" y1="${rowY + 17}" x2="992" y2="${rowY + 17}" stroke="#E5E7EB" stroke-width="1" />`;
            })
            .join('')
        : `
          <rect x="140" y="760" width="800" height="220" rx="8" fill="#F3F4F6" stroke="#D1D5DB" stroke-width="1.2" />
          <text x="540" y="860" text-anchor="middle" fill="#171717" font-family="Manrope, Inter, sans-serif" font-size="22" font-weight="700">Student Registry Pending</text>`;

    rosterBlock = `
      <g opacity="${state.rosterOpacity.toFixed(3)}">
        <rect x="0" y="0" width="${FILM_WIDTH}" height="${FILM_HEIGHT}" fill="#F3F4F6" />
        ${vectorElevationShadow(56, 130, 968, 1660, 10)}
        <rect x="56" y="130" width="968" height="1660" rx="10" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="1.5" />
        <text x="96" y="188" fill="#2563EB" font-family="Inter, sans-serif" font-size="13" font-weight="700" letter-spacing="1.2">${escapeXml(CUSAT_IDENTITY.university)}</text>
        <text x="96" y="228" fill="#171717" font-family="Manrope, Inter, sans-serif" font-size="25" font-weight="800">Detailed Tabulation Report · Complete Student List</text>
        <text x="984" y="228" text-anchor="end" fill="#525252" font-family="Inter, sans-serif" font-size="15" font-weight="600">${sources.students.length} Students · Pages 1–8</text>
        <line x1="88" y1="252" x2="992" y2="252" stroke="#D1D5DB" stroke-width="1.2" />
        <rect x="88" y="266" width="904" height="46" fill="#F3F4F6" rx="4" />
        <text x="114" y="295" fill="#525252" font-family="Inter, sans-serif" font-size="14" font-weight="700">Sl.</text>
        <text x="190" y="295" fill="#525252" font-family="Inter, sans-serif" font-size="14" font-weight="700">Student Name</text>
        <text x="820" y="295" text-anchor="end" fill="#525252" font-family="Inter, sans-serif" font-size="14" font-weight="700">Registration No.</text>
        <text x="968" y="295" text-anchor="end" fill="#525252" font-family="Inter, sans-serif" font-size="14" font-weight="700">Record</text>
        <g clip-path="url(#rosterClip)">
          <g transform="translate(0 ${(-state.rosterScrollY).toFixed(2)})">
            ${rowsHtml}
          </g>
        </g>
        <line x1="88" y1="1700" x2="992" y2="1700" stroke="#D1D5DB" stroke-width="1" />
        <text x="540" y="1744" text-anchor="middle" fill="#525252" font-family="Inter, sans-serif" font-size="14" font-weight="500">Original Tabulation List · Pages 1–8 · Passed Entries Highlighted in Green</text>
      </g>`;
  }

  // SCENE 3: Digitally Recreated Page 10 — Failed Students (No raster screenshot)
  let p10Block = '';
  if (state.p10Opacity > 0.002 && state.p10ClipH > 0.5) {
    const p10HlOp = state.p10HighlightOpacity;
    const p10HlW = Math.min(state.p10HighlightW, 912);
    const p10DigitalSheet = `
      <g>
        <text x="1004" y="268" text-anchor="end" fill="#525252" font-family="Inter, sans-serif" font-size="13" font-weight="600">Page 10 of 10</text>
        <text x="540" y="302" text-anchor="middle" fill="#171717" font-family="Manrope, Inter, sans-serif" font-size="22" font-weight="800">Cochin University of Science &amp; Technology</text>
        <text x="540" y="330" text-anchor="middle" fill="#525252" font-family="Inter, sans-serif" font-size="13.5" font-weight="600">Master of Computer Applications-(April-2026)-IV-REGULAR - Master of Computer Application-- - 75</text>
        <text x="540" y="356" text-anchor="middle" fill="#171717" font-family="Inter, sans-serif" font-size="15" font-weight="700">Detailed Tabulation Report</text>
        <line x1="84" y1="378" x2="996" y2="378" stroke="#E5E7EB" stroke-width="1.2" />

        ${
          p10HlOp > 0.002
            ? `<rect x="424" y="388" width="232" height="40" rx="4" fill="#C62828" fill-opacity="0.09" stroke="#C62828" stroke-width="1.5" opacity="${p10HlOp.toFixed(3)}" />`
            : ''
        }
        <text x="540" y="415" text-anchor="middle" fill="#C62828" font-family="Manrope, Inter, sans-serif" font-size="21" font-weight="800">${PAGE10_FAILED_24100218.heading}</text>

        <!-- Page 10 Failed Students Table -->
        <rect x="84" y="442" width="912" height="66" fill="#F3F4F6" />
        ${
          p10HlOp > 0.002
            ? `
          <rect x="84" y="508" width="${p10HlW.toFixed(1)}" height="98" fill="#C62828" fill-opacity="0.11" opacity="${p10HlOp.toFixed(3)}" />
          <rect x="84" y="508" width="5" height="98" fill="#C62828" opacity="${p10HlOp.toFixed(3)}" />
          <rect x="134" y="508" width="122" height="98" fill="#C62828" fill-opacity="0.14" opacity="${p10HlOp.toFixed(3)}" />`
            : ''
        }
        <rect x="84" y="442" width="912" height="164" fill="none" stroke="#525252" stroke-width="1.4" />
        <line x1="84" y1="508" x2="996" y2="508" stroke="#525252" stroke-width="1.3" />
        <line x1="134" y1="442" x2="134" y2="606" stroke="#9CA3AF" stroke-width="1.1" />
        <line x1="256" y1="442" x2="256" y2="606" stroke="#9CA3AF" stroke-width="1.1" />
        <line x1="441" y1="442" x2="441" y2="606" stroke="#9CA3AF" stroke-width="1.1" />
        <line x1="626" y1="442" x2="626" y2="606" stroke="#9CA3AF" stroke-width="1.1" />
        <line x1="811" y1="442" x2="811" y2="606" stroke="#9CA3AF" stroke-width="1.1" />

        <!-- Table Headers -->
        <text x="109" y="481" text-anchor="middle" fill="#171717" font-family="Inter, sans-serif" font-size="13" font-weight="700">Sl no</text>
        <text x="195" y="470" text-anchor="middle" fill="#171717" font-family="Inter, sans-serif" font-size="13" font-weight="700">Enrolment</text>
        <text x="195" y="490" text-anchor="middle" fill="#171717" font-family="Inter, sans-serif" font-size="13" font-weight="700">Number</text>
        <text x="348.5" y="470" text-anchor="middle" fill="#171717" font-family="Inter, sans-serif" font-size="12.5" font-weight="700">(gpa-credits-totalmarks,</text>
        <text x="348.5" y="490" text-anchor="middle" fill="#171717" font-family="Inter, sans-serif" font-size="12.5" font-weight="700">Sem--1)</text>
        <text x="533.5" y="470" text-anchor="middle" fill="#171717" font-family="Inter, sans-serif" font-size="12.5" font-weight="700">(gpa-credits-totalmarks,</text>
        <text x="533.5" y="490" text-anchor="middle" fill="#171717" font-family="Inter, sans-serif" font-size="12.5" font-weight="700">Sem--2)</text>
        <text x="718.5" y="470" text-anchor="middle" fill="#171717" font-family="Inter, sans-serif" font-size="12.5" font-weight="700">(gpa-credits-totalmarks,</text>
        <text x="718.5" y="490" text-anchor="middle" fill="#171717" font-family="Inter, sans-serif" font-size="12.5" font-weight="700">Sem--3)</text>
        <text x="903.5" y="470" text-anchor="middle" fill="#171717" font-family="Inter, sans-serif" font-size="12.5" font-weight="700">(gpa-credits-totalmarks,</text>
        <text x="903.5" y="490" text-anchor="middle" fill="#171717" font-family="Inter, sans-serif" font-size="12.5" font-weight="700">Sem--4)</text>

        <!-- Sole Failed Entry Row: 1 | 24100218 -->
        <text x="109" y="563" text-anchor="middle" fill="#171717" font-family="Inter, sans-serif" font-size="16" font-weight="700">1</text>
        <text x="195" y="564" text-anchor="middle" fill="#C62828" font-family="Manrope, Inter, sans-serif" font-size="19" font-weight="800">${PAGE10_FAILED_24100218.regNo}</text>

        <text x="348.5" y="549" text-anchor="middle" fill="#171717" font-family="Inter, sans-serif" font-size="13.5" font-weight="600">(6.58 -24.00 -411.00 ,</text>
        <text x="348.5" y="574" text-anchor="middle" fill="#525252" font-family="Inter, sans-serif" font-size="13.5" font-weight="600">Sem--1)</text>

        <text x="533.5" y="549" text-anchor="middle" fill="#171717" font-family="Inter, sans-serif" font-size="13.5" font-weight="600">(7.00 -24.00 -452.00 ,</text>
        <text x="533.5" y="574" text-anchor="middle" fill="#525252" font-family="Inter, sans-serif" font-size="13.5" font-weight="600">Sem--2)</text>

        <text x="718.5" y="549" text-anchor="middle" fill="#C62828" font-family="Inter, sans-serif" font-size="13.5" font-weight="800">(0.00 -18.00 -380.00 ,</text>
        <text x="718.5" y="574" text-anchor="middle" fill="#C62828" font-family="Inter, sans-serif" font-size="13.5" font-weight="800">Sem--3)</text>

        <text x="903.5" y="549" text-anchor="middle" fill="#171717" font-family="Inter, sans-serif" font-size="13.5" font-weight="600">(10.00 -16.00 -360.00 ,</text>
        <text x="903.5" y="574" text-anchor="middle" fill="#525252" font-family="Inter, sans-serif" font-size="13.5" font-weight="600">Sem--4)</text>

        ${
          p10HlOp > 0.002
            ? `
          <rect x="84" y="508" width="912" height="98" fill="none" stroke="#C62828" stroke-width="2" opacity="${p10HlOp.toFixed(3)}" />
          <rect x="134" y="508" width="122" height="98" fill="none" stroke="#C62828" stroke-width="3" opacity="${p10HlOp.toFixed(3)}" />`
            : ''
        }

        <!-- Page 10 Exact Notes & Date -->
        <text x="84" y="658" fill="#171717" font-family="Inter, sans-serif" font-size="14" font-weight="700">Note :</text>
        <text x="102" y="690" fill="#525252" font-family="Inter, sans-serif" font-size="14" font-weight="500">&#x2022;  * - Re - Examination Marks</text>
        <text x="102" y="718" fill="#525252" font-family="Inter, sans-serif" font-size="14" font-weight="500">&#x2022;  **** - Not Applied for subject A - Absent</text>
        <text x="102" y="746" fill="#525252" font-family="Inter, sans-serif" font-size="14" font-weight="500">&#x2022;  WH - WithHeld</text>
        <text x="84" y="792" fill="#171717" font-family="Inter, sans-serif" font-size="14" font-weight="600">Note: Marks = C.A + E.S + Moderation</text>
        <text x="84" y="824" fill="#171717" font-family="Inter, sans-serif" font-size="14" font-weight="700">Dated : Apr 29, 2026</text>
        <text x="996" y="886" text-anchor="end" fill="#171717" font-family="Inter, sans-serif" font-size="14" font-weight="700">Signature</text>
      </g>`;

    const detailCard =
      state.p10DetailOpacity > 0.002
        ? `
        <g opacity="${state.p10DetailOpacity.toFixed(3)}" transform="translate(0 ${state.p10DetailY.toFixed(2)})">
          ${vectorElevationShadow(44, 1004, 992, 650, 10)}
          <rect x="44" y="1004" width="992" height="650" rx="10" fill="#FFFFFF" stroke="#C62828" stroke-width="2" />
          <rect x="44" y="1004" width="992" height="64" rx="10" fill="#C62828" fill-opacity="0.09" />
          <line x1="44" y1="1068" x2="1036" y2="1068" stroke="#C62828" stroke-opacity="0.35" stroke-width="1.2" />
          <text x="76" y="1044" fill="#C62828" font-family="Manrope, Inter, sans-serif" font-size="20" font-weight="800" letter-spacing="0.8">FAILED STUDENTS · PAGE 10</text>
          <text x="1004" y="1044" text-anchor="end" fill="#C62828" font-family="Inter, sans-serif" font-size="14" font-weight="700">ONLY ENTRY LISTED</text>

          <text x="76" y="1126" fill="#525252" font-family="Inter, sans-serif" font-size="13" font-weight="700" letter-spacing="1.1">REGISTRATION NUMBER</text>
          <text x="76" y="1182" fill="#C62828" font-family="Manrope, Inter, sans-serif" font-size="50" font-weight="800">${PAGE10_FAILED_24100218.regNo}</text>

          <text x="1004" y="1126" text-anchor="end" fill="#525252" font-family="Inter, sans-serif" font-size="13" font-weight="700" letter-spacing="1.1">STUDENT NAME</text>
          <text x="1004" y="1182" text-anchor="end" fill="#C62828" font-family="Manrope, Inter, sans-serif" font-size="44" font-weight="800">${PAGE10_FAILED_24100218.name}</text>

          <line x1="76" y1="1214" x2="1004" y2="1214" stroke="#D1D5DB" stroke-width="1.2" />
          <text x="76" y="1252" fill="#525252" font-family="Inter, sans-serif" font-size="13" font-weight="700">SEMESTER</text>
          <text x="275" y="1252" fill="#525252" font-family="Inter, sans-serif" font-size="13" font-weight="700">PRINTED RECORD (PAGE 10)</text>
          <text x="1004" y="1252" text-anchor="end" fill="#525252" font-family="Inter, sans-serif" font-size="13" font-weight="700">GPA · CREDITS · MARKS</text>
          <line x1="76" y1="1268" x2="1004" y2="1268" stroke="#E5E7EB" stroke-width="1" />

          ${PAGE10_FAILED_24100218.semesters
            .map((sem, idx) => {
              const rowY = 1326 + idx * 80;
              const isSem3 = sem.code === 'Sem--3';
              return `
                ${isSem3 ? `<rect x="64" y="${rowY - 40}" width="952" height="62" rx="6" fill="#C62828" fill-opacity="0.08" stroke="#C62828" stroke-width="1.5" />` : ''}
                <text x="76" y="${rowY}" fill="${isSem3 ? '#C62828' : '#171717'}" font-family="Manrope, Inter, sans-serif" font-size="20" font-weight="800">${sem.label}</text>
                <text x="275" y="${rowY}" fill="${isSem3 ? '#C62828' : '#525252'}" font-family="Inter, sans-serif" font-size="17" font-weight="${isSem3 ? '700' : '600'}">${escapeXml(sem.raw)}</text>
                <text x="1004" y="${rowY}" text-anchor="end" fill="${isSem3 ? '#C62828' : '#171717'}" font-family="Manrope, Inter, sans-serif" font-size="19" font-weight="800">${sem.gpa} · ${sem.credits} cr · ${sem.marks}</text>
                <line x1="76" y1="${rowY + 28}" x2="1004" y2="${rowY + 28}" stroke="#E5E7EB" stroke-width="1" />`;
            })
            .join('')}
        </g>`
        : '';

    p10Block = `
      <g opacity="${state.p10Opacity.toFixed(3)}">
        <g clip-path="url(#p10Mask)">
          <text x="44" y="168" fill="#2563EB" font-family="Inter, sans-serif" font-size="14" font-weight="700" letter-spacing="1.2">${escapeXml(CUSAT_IDENTITY.university)}</text>
          <text x="44" y="206" fill="#171717" font-family="Manrope, Inter, sans-serif" font-size="26" font-weight="800">Report · Page 10 · Failed Students</text>
          ${vectorElevationShadow(44, 232, 992, 726, 8)}
          <rect x="44" y="232" width="992" height="726" rx="8" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="1.5" />
          ${p10DigitalSheet}
        </g>
        ${detailCard}
      </g>`;
  }

  // SCENE 4: Dramatic Failed-Result Motion Graphics (24100218 -> SARANG R N)
  let dramaticBlock = '';
  if (state.dramaticOpacity > 0.002) {
    dramaticBlock = `
      <g opacity="${state.dramaticOpacity.toFixed(3)}">
        <rect x="0" y="0" width="${FILM_WIDTH}" height="${FILM_HEIGHT}" fill="#FFFFFF" />
        <circle cx="540" cy="960" r="560" fill="url(#redRadialGlow)" opacity="${state.dramaticGlowOpacity.toFixed(3)}" />

        <!-- Crisp architectural red framing accents -->
        <g stroke="#C62828" stroke-width="3" fill="none" opacity="0.85">
          <path d="M 110 680 L 110 620 L 170 620" />
          <path d="M 970 680 L 970 620 L 910 620" />
          <path d="M 110 1240 L 110 1300 L 170 1300" />
          <path d="M 970 1240 L 970 1300 L 910 1300" />
        </g>

        <text x="540" y="704" text-anchor="middle" fill="#C62828" font-family="Inter, sans-serif" font-size="18" font-weight="800" letter-spacing="3.2">FAILED STUDENTS · PAGE 10</text>

        <g opacity="${state.dramaticRegOpacity.toFixed(3)}" transform="translate(0 ${state.dramaticRegY.toFixed(2)})">
          <text x="540" y="838" text-anchor="middle" fill="#C62828" font-family="Manrope, Inter, sans-serif" font-size="112" font-weight="800" letter-spacing="4">${PAGE10_FAILED_24100218.regNo}</text>
        </g>

        <line x1="${(540 - state.dramaticRuleW / 2).toFixed(1)}" y1="900" x2="${(540 + state.dramaticRuleW / 2).toFixed(1)}" y2="900" stroke="#C62828" stroke-width="3" />

        <g opacity="${state.dramaticNameOpacity.toFixed(3)}" transform="translate(540 1030) scale(${state.dramaticNameScale.toFixed(4)}) translate(-540 -1030)">
          <text x="540" y="1044" text-anchor="middle" fill="#171717" font-family="Manrope, Inter, sans-serif" font-size="94" font-weight="800" letter-spacing="2.2">${PAGE10_FAILED_24100218.name}</text>
        </g>

        <g opacity="${state.dramaticMetaOpacity.toFixed(3)}">
          <rect x="270" y="1116" width="540" height="58" rx="6" fill="#C62828" fill-opacity="0.09" stroke="#C62828" stroke-width="1.75" />
          <text x="540" y="1153" text-anchor="middle" fill="#C62828" font-family="Manrope, Inter, sans-serif" font-size="22" font-weight="800" letter-spacing="0.8">SEM--3 · GPA 0.00 · 18 CREDITS · 380 MARKS</text>
        </g>
      </g>`;
  }

  // SCENE 5: Reconstructed CUSAT Degree Certificate Motion Graphics
  let certBlock = '';
  if (state.certOpacity > 0.002) {
    const leftGuilloche = buildSideGuillochePaths(114, 354, 1566)
      .map(
        (d) =>
          `<path d="${d}" fill="none" stroke="#5E926B" stroke-width="1.2" stroke-opacity="0.58" />`,
      )
      .join('');
    const rightGuilloche = buildSideGuillochePaths(966, 354, 1566)
      .map(
        (d) =>
          `<path d="${d}" fill="none" stroke="#7F6E8E" stroke-width="1.2" stroke-opacity="0.58" />`,
      )
      .join('');
    const bottomLattice = [0, 1, 2, 3]
      .map((i) =>
        buildHorizontalLatticePath(172, 908, 1456 + i * 24, 5, 48, i * 0.9),
      )
      .map(
        (d) =>
          `<path d="${d}" fill="none" stroke="#8C968F" stroke-width="0.9" stroke-opacity="0.28" />`,
      )
      .join('');
    const rosettePaths = buildWatermarkRosettePetals(540, 960, 172, 18);

    const paperTransform = `translate(540 ${(960 + state.certPaperY).toFixed(2)}) scale(${state.certPaperScaleX.toFixed(4)} ${state.certPaperScaleY.toFixed(4)}) translate(-540 -960)`;

    certBlock = `
      <g opacity="${state.certOpacity.toFixed(3)}" transform="${paperTransform}">
        <!-- Layered archival paper depth -->
        ${vectorElevationShadow(70, 334, 940, 1253, 6)}
        <rect x="82" y="346" width="940" height="1253" rx="6" fill="#E5E7EB" stroke="#D1D5DB" stroke-width="1" />
        <rect x="76" y="340" width="940" height="1253" rx="6" fill="#F3F4F6" stroke="#D1D5DB" stroke-width="1" />

        <!-- Certificate base sheet (exact 3:4 proportion of pass.jpg) -->
        <rect x="70" y="334" width="940" height="1253" rx="5" fill="url(#certPaperBg)" stroke="#CFC8B8" stroke-width="1.5" />

        <g clip-path="url(#certPaperClip)">
          <!-- Security tint header & footer bands -->
          <rect x="70" y="334" width="940" height="270" fill="url(#certSecurityTint)" opacity="0.24" />
          <rect x="70" y="1428" width="940" height="159" fill="url(#certSecurityTint)" opacity="0.24" />
          ${bottomLattice}

          <!-- Subtle sheen light sweep -->
          <rect x="${state.certSheenX.toFixed(1)}" y="334" width="260" height="1253" fill="url(#certSheenGrad)" transform="skewX(-14)" />

          <!-- Borders, guilloche ribbons & ornamental frieze -->
          <g clip-path="url(#certBorderMask)">
            <rect x="84" y="348" width="912" height="1225" rx="3" fill="none" stroke="#BDB6A5" stroke-width="1" />
            <rect x="156" y="608" width="768" height="808" rx="2" fill="none" stroke="#D6D0C0" stroke-width="1.1" />
            ${leftGuilloche}
            ${rightGuilloche}

            <!-- Ornamental top arch flourishes framing the university crest zone -->
            <path d="M 164 590 Q 340 426 540 426 Q 740 426 916 590" fill="none" stroke="#9C9585" stroke-width="1.4" stroke-opacity="0.65" />
            <path d="M 184 598 Q 350 444 540 444 Q 730 444 896 598" fill="none" stroke="#9C9585" stroke-width="0.9" stroke-opacity="0.55" />
            <path d="M 225 604 Q 370 534 540 534 Q 710 534 855 604" fill="none" stroke="#9C9585" stroke-width="1" stroke-opacity="0.55" />
          </g>

          <!-- Faint central geometric watermark -->
          <g opacity="${(state.certWatermarkOpacity * 0.08).toFixed(3)}" stroke="#6B7280" fill="none">
            <circle cx="540" cy="960" r="196" stroke-width="1.4" />
            <circle cx="540" cy="960" r="168" stroke-width="1" stroke-dasharray="5 4" />
            <circle cx="540" cy="960" r="76" stroke-width="1.2" />
            <path d="${rosettePaths}" stroke-width="1.1" />
          </g>

          <!-- 1. Arched University Heading & Top Geometric Crest Frame -->
          <g opacity="${state.certUniOpacity.toFixed(3)}" transform="translate(0 ${state.certUniY.toFixed(2)})">
            <g transform="translate(540 398)" stroke="#6B7280" fill="none" stroke-width="1.3">
              <circle cx="0" cy="0" r="24" />
              <circle cx="0" cy="0" r="16" />
              <path d="M -12 4 L 0 -10 L 12 4 Z" />
              <line x1="-18" y1="28" x2="18" y2="28" />
            </g>
            <text fill="#1F2937" font-family="Playfair Display, serif" font-size="33" font-weight="700" letter-spacing="0.4">
              <textPath href="#certUniArc" startOffset="50%" text-anchor="middle">${escapeXml(CERTIFICATE_FACTS.university)}</textPath>
            </text>
            <line x1="176" y1="608" x2="904" y2="608" stroke="#D1CBC0" stroke-width="1" />
          </g>

          <!-- 2. Register Number & Faculty of Technology -->
          <g opacity="${state.certRegOpacity.toFixed(3)}" transform="translate(0 ${state.certRegY.toFixed(2)})">
            <text x="176" y="654" fill="#374151" font-family="Playfair Display, serif" font-size="19" font-weight="700">Register Number : ${CERTIFICATE_FACTS.regNo}</text>
            <text x="540" y="736" text-anchor="middle" fill="#1F2937" font-family="Playfair Display, serif" font-size="27" font-weight="700" letter-spacing="1.8">FACULTY OF TECHNOLOGY</text>
          </g>

          <!-- 3. Academic Council Citation & SARANG R N -->
          <g opacity="${state.certNameOpacity.toFixed(3)}">
            <text x="540" y="794" text-anchor="middle" fill="#374151" font-family="Playfair Display, serif" font-size="18.5" font-style="italic">The Academic Council of the ${escapeXml(CERTIFICATE_FACTS.university)}</text>
            <text x="540" y="826" text-anchor="middle" fill="#374151" font-family="Playfair Display, serif" font-size="18.5" font-style="italic">hereby makes known that</text>
            <g transform="translate(540 886) scale(${state.certNameScale.toFixed(4)}) translate(-540 -886)">
              <text x="540" y="896" text-anchor="middle" fill="#171717" font-family="Manrope, Inter, sans-serif" font-size="36" font-weight="800" letter-spacing="2.4">${CERTIFICATE_FACTS.name}</text>
            </g>
          </g>

          <!-- 4. Master of Computer Applications Degree Wording -->
          <g opacity="${state.certDegreeOpacity.toFixed(3)}" transform="translate(0 ${state.certDegreeY.toFixed(2)})">
            <text x="540" y="948" text-anchor="middle" fill="#374151" font-family="Playfair Display, serif" font-size="18.5" font-style="italic">has been awarded the Degree of</text>
            <text x="540" y="1006" text-anchor="middle" fill="#171717" font-family="Manrope, Inter, sans-serif" font-size="25" font-weight="800" letter-spacing="1.1">MASTER OF COMPUTER APPLICATIONS</text>
            <text x="540" y="1062" text-anchor="middle" fill="#374151" font-family="Playfair Display, serif" font-size="16.8" font-style="italic">He/She having undergone the prescribed course of study and having been certified by duly</text>
            <text x="540" y="1092" text-anchor="middle" fill="#374151" font-family="Playfair Display, serif" font-size="16.8" font-style="italic">appointed examiners to be qualified to receive the same and placed by them in the</text>
          </g>

          <!-- 5. First Class Classification -->
          <g opacity="${state.certClassOpacity.toFixed(3)}" transform="translate(540 1148) scale(${state.certClassScale.toFixed(4)}) translate(-540 -1148)">
            <text x="540" y="1156" text-anchor="middle" fill="#171717" font-family="Playfair Display, serif" font-size="30" font-weight="700">${CERTIFICATE_FACTS.classification}</text>
          </g>

          <!-- 6. April 2026 Examination, 29 October 2026 Award Date & Kochi Location -->
          <g opacity="${state.certDatesOpacity.toFixed(3)}" transform="translate(0 ${state.certDatesY.toFixed(2)})">
            <text x="540" y="1204" text-anchor="middle" fill="#374151" font-family="Playfair Display, serif" font-size="18.5" font-style="italic">at the examination held in</text>
            <text x="540" y="1256" text-anchor="middle" fill="#171717" font-family="Manrope, Inter, sans-serif" font-size="25" font-weight="800">${CERTIFICATE_FACTS.examination}</text>
            <text x="540" y="1312" text-anchor="middle" fill="#374151" font-family="Playfair Display, serif" font-size="18.5" font-style="italic">Given under the seal of the University this day, ${CERTIFICATE_FACTS.awardDate}.</text>
            <text x="176" y="1484" fill="#525252" font-family="Inter, sans-serif" font-size="15" font-weight="600">Kochi - 682 022</text>
            <text x="176" y="1510" fill="#525252" font-family="Inter, sans-serif" font-size="15" font-weight="600">Kerala, India.</text>
          </g>
        </g>
      </g>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${FILM_WIDTH} ${FILM_HEIGHT}" width="${FILM_WIDTH}" height="${FILM_HEIGHT}">
  <defs>
    ${embeddedFontCss ? `<style type="text/css"><![CDATA[${embeddedFontCss}]]></style>` : ''}
    <radialGradient id="redRadialGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#C62828" stop-opacity="0.16" />
      <stop offset="65%" stop-color="#C62828" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#C62828" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="certPaperBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCFBF7" />
      <stop offset="55%" stop-color="#F8F6EE" />
      <stop offset="100%" stop-color="#F2EFE4" />
    </linearGradient>
    <linearGradient id="certSecurityTint" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7BAE87" />
      <stop offset="50%" stop-color="#E5E7EB" />
      <stop offset="100%" stop-color="#9B8BA8" />
    </linearGradient>
    <linearGradient id="certSheenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0" />
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.34" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>
    <path id="certUniArc" d="M 150 546 Q 540 434 930 546" />
    <clipPath id="rosterClip">
      <rect x="88" y="322" width="904" height="1364" />
    </clipPath>
    <clipPath id="p10Mask">
      <rect x="20" y="${state.p10ClipY.toFixed(1)}" width="1040" height="${state.p10ClipH.toFixed(1)}" />
    </clipPath>
    <clipPath id="certPaperClip">
      <rect x="70" y="334" width="940" height="1253" rx="5" />
    </clipPath>
    <clipPath id="certBorderMask">
      <rect x="70" y="334" width="940" height="${state.certBorderH.toFixed(1)}" />
    </clipPath>
  </defs>
  <rect width="${FILM_WIDTH}" height="${FILM_HEIGHT}" fill="#FFFFFF" />
  <g transform="${camTransform}">
    ${searchBlock}
    ${rosterBlock}
    ${p10Block}
    ${dramaticBlock}
    ${certBlock}
  </g>
</svg>`;
}
