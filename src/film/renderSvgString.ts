import {
  REG_DIGITS,
  computeFittedBox,
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
  const p10Box = computeFittedBox(sources.pdfPage10AspectRatio, 992, 740, 540, 588);
  const certBox = computeFittedBox(sources.certificateAspectRatio, 1020, 1760, 540, 960);

  const camTransform = `translate(540 960) scale(${state.camScale.toFixed(5)}) translate(${(-state.camX).toFixed(2)} ${(-state.camY).toFixed(2)})`;

  // Exact Page 10 highlight boxes mapped directly onto the actual Page 10 PDF image
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

  // SCENE 2: Complete 71-Student List (other 70 in #16834A green; SARANG R N neutral, NOT green/PASSED)
  let rosterBlock = '';
  if (state.rosterOpacity > 0.002) {
    const rowsHtml =
      sources.students.length > 0
        ? sources.students
            .map((student, idx) => {
              const rowY = 364 + idx * 54;
              const isTarget = student.regNo === '24100218';
              const nameFill = isTarget ? '#171717' : '#16834A';
              const statusText = isTarget ? '—' : 'PASSED';
              const statusFill = isTarget ? '#525252' : '#16834A';

              return `
                ${isTarget ? `<rect x="88" y="${rowY - 34}" width="904" height="52" fill="#F3F4F6" />` : ''}
                <text x="114" y="${rowY}" fill="#525252" font-family="Inter, sans-serif" font-size="16" font-weight="${isTarget ? '700' : '600'}">${student.serial}</text>
                <text x="190" y="${rowY}" fill="${nameFill}" font-family="Manrope, Inter, sans-serif" font-size="18" font-weight="700">${escapeXml(student.name)}</text>
                <text x="820" y="${rowY}" text-anchor="end" fill="#171717" font-family="Manrope, Inter, sans-serif" font-size="17" font-weight="700">${escapeXml(student.regNo)}</text>
                <text x="968" y="${rowY}" text-anchor="end" fill="${statusFill}" font-family="Inter, sans-serif" font-size="13" font-weight="800" letter-spacing="0.6">${statusText}</text>
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

  // SCENE 3: Actual Page 10 — Failed Students
  let p10Block = '';
  if (state.p10Opacity > 0.002 && state.p10ClipH > 0.5) {
    const p10PageImage = sources.pdfPage10DataUrl
      ? `
        <g clip-path="url(#p10DocClip)">
          <image href="${escapeXml(sources.pdfPage10DataUrl)}" x="${p10Box.x}" y="${p10Box.y}" width="${p10Box.width}" height="${p10Box.height}" preserveAspectRatio="xMidYMid meet" />
          ${
            state.p10HighlightOpacity > 0.002
              ? `
            <rect x="${p10HeadingX.toFixed(1)}" y="${p10HeadingY.toFixed(1)}" width="${p10HeadingW.toFixed(1)}" height="${p10HeadingH.toFixed(1)}" fill="#C62828" fill-opacity="0.14" stroke="#C62828" stroke-width="1.5" opacity="${state.p10HighlightOpacity.toFixed(3)}" />
            <rect x="${p10RowX.toFixed(1)}" y="${p10RowY.toFixed(1)}" width="${Math.min(state.p10HighlightW, p10RowW).toFixed(1)}" height="${p10RowH.toFixed(1)}" fill="#C62828" fill-opacity="0.18" opacity="${state.p10HighlightOpacity.toFixed(3)}" />
            <rect x="${p10RowX.toFixed(1)}" y="${p10RowY.toFixed(1)}" width="5" height="${p10RowH.toFixed(1)}" fill="#C62828" opacity="${state.p10HighlightOpacity.toFixed(3)}" />
            <rect x="${p10RowX.toFixed(1)}" y="${p10RowY.toFixed(1)}" width="${p10RowW.toFixed(1)}" height="${p10RowH.toFixed(1)}" fill="none" stroke="#C62828" stroke-width="2" opacity="${state.p10HighlightOpacity.toFixed(3)}" />
            <rect x="${p10RegX.toFixed(1)}" y="${p10RowY.toFixed(1)}" width="${p10RegW.toFixed(1)}" height="${p10RowH.toFixed(1)}" fill="#C62828" fill-opacity="0.22" stroke="#C62828" stroke-width="3" opacity="${state.p10HighlightOpacity.toFixed(3)}" />`
              : ''
          }
        </g>`
      : '';

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
          <text x="44" y="206" fill="#171717" font-family="Manrope, Inter, sans-serif" font-size="26" font-weight="800">Original Report · Page 10 · Failed Students</text>
          ${vectorElevationShadow(p10Box.x, p10Box.y, p10Box.width, p10Box.height, 6)}
          <rect x="${p10Box.x}" y="${p10Box.y}" width="${p10Box.width}" height="${p10Box.height}" rx="6" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="1.5" />
          ${p10PageImage}
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

  // SCENE 5: Actual pass.jpg Certificate Reveal
  let certBlock = '';
  if (state.certOpacity > 0.002 && state.certClipH > 0.5) {
    const certificateBody = sources.certificateImageDataUrl
      ? `
        <image href="${escapeXml(sources.certificateImageDataUrl)}" x="${certBox.x}" y="${certBox.y}" width="${certBox.width}" height="${certBox.height}" preserveAspectRatio="xMidYMid meet" />
        <rect x="${certBox.x}" y="${certBox.y}" width="${certBox.width}" height="${certBox.height}" fill="none" stroke="#D1D5DB" stroke-width="1.5" />`
      : `
        <rect x="${certBox.x}" y="${certBox.y}" width="${certBox.width}" height="${certBox.height}" rx="6" fill="#F3F4F6" stroke="#D1D5DB" stroke-width="1.5" />
        <text x="540" y="960" text-anchor="middle" fill="#171717" font-family="Manrope, Inter, sans-serif" font-size="24" font-weight="700">${escapeXml(CERTIFICATE_FACTS.university)}</text>`;

    certBlock = `
      <g opacity="${state.certOpacity.toFixed(3)}" clip-path="url(#certMask)">
        ${vectorElevationShadow(certBox.x, certBox.y, certBox.width, certBox.height, 4)}
        <rect x="${certBox.x}" y="${certBox.y}" width="${certBox.width}" height="${certBox.height}" rx="4" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="1.25" />
        ${certificateBody}
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
    <clipPath id="rosterClip">
      <rect x="88" y="322" width="904" height="1364" />
    </clipPath>
    <clipPath id="p10DocClip">
      <rect x="${p10Box.x}" y="${p10Box.y}" width="${p10Box.width}" height="${p10Box.height}" rx="6" />
    </clipPath>
    <clipPath id="p10Mask">
      <rect x="20" y="${state.p10ClipY.toFixed(1)}" width="1040" height="${state.p10ClipH.toFixed(1)}" />
    </clipPath>
    <clipPath id="certMask">
      <rect x="10" y="${state.certClipY.toFixed(1)}" width="1060" height="${state.certClipH.toFixed(1)}" />
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
