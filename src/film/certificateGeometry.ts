// Procedural vector artwork matching the border ribbons, arched frieze,
// and subtle watermark geometry of pass.jpg (without invented seals or signatures).

export function buildGuillocheWavePath(
  baseX: number,
  startY: number,
  endY: number,
  amplitude: number,
  wavelength: number,
  phase: number,
  step = 6,
): string {
  const parts: string[] = [];
  for (let y = startY; y <= endY; y += step) {
    const t = ((y - startY) / wavelength) * Math.PI * 2 + phase;
    const x = baseX + Math.sin(t) * amplitude;
    parts.push(`${y === startY ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return parts.join(' ');
}

export function buildSideGuillochePaths(
  centerX: number,
  startY: number,
  endY: number,
): string[] {
  const phases = [0, 1.05, 2.1, 3.15, 4.2];
  return phases.map((phase, idx) =>
    buildGuillocheWavePath(
      centerX + (idx - 2) * 3.2,
      startY,
      endY,
      14 - Math.abs(idx - 2) * 1.4,
      64,
      phase,
    ),
  );
}

export function buildHorizontalLatticePath(
  startX: number,
  endX: number,
  baseY: number,
  amplitude: number,
  wavelength: number,
  phase: number,
  step = 8,
): string {
  const parts: string[] = [];
  for (let x = startX; x <= endX; x += step) {
    const t = ((x - startX) / wavelength) * Math.PI * 2 + phase;
    const y = baseY + Math.sin(t) * amplitude;
    parts.push(`${x === startX ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return parts.join(' ');
}

export function buildWatermarkRosettePetals(cx: number, cy: number, radius: number, count = 16): string {
  const paths: string[] = [];
  for (let i = 0; i < count; i++) {
    const a1 = (i / count) * Math.PI * 2;
    const a2 = ((i + 0.5) / count) * Math.PI * 2;
    const a3 = ((i + 1) / count) * Math.PI * 2;
    const x0 = cx + Math.cos(a1) * (radius * 0.42);
    const y0 = cy + Math.sin(a1) * (radius * 0.42);
    const xm = cx + Math.cos(a2) * radius;
    const ym = cy + Math.sin(a2) * radius;
    const x1 = cx + Math.cos(a3) * (radius * 0.42);
    const y1 = cy + Math.sin(a3) * (radius * 0.42);
    paths.push(`M ${x0.toFixed(1)} ${y0.toFixed(1)} Q ${xm.toFixed(1)} ${ym.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`);
  }
  return paths.join(' ');
}
