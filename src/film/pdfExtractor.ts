import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { NormalizedPoint, StudentRecord } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface ExtractedPdfPage {
  pageNumber: number;
  dataUrl: string;
  aspectRatio: number;
  focusPoint: NormalizedPoint;
  foundMatch: boolean;
}

export interface ExtractedResultPdf {
  totalPages: number;
  page10: ExtractedPdfPage;
  students: StudentRecord[];
}

interface PositionedToken {
  str: string;
  x: number;
  y: number;
}

function extractStudentsFromPageTokens(tokens: PositionedToken[]): StudentRecord[] {
  const cgpaHeader = tokens.find((t) => t.str.includes('Student CGPA Records'));
  const cutoffY = cgpaHeader ? cgpaHeader.y : Infinity;

  const usable = tokens.filter((t) => t.y < cutoffY && t.str.trim().length > 0);
  const serials = usable.filter((t) => t.x < 45 && /^\d{1,2}$/.test(t.str.trim()));

  const found: StudentRecord[] = [];
  for (const s of serials) {
    const serial = parseInt(s.str.trim(), 10);
    if (serial < 1 || serial > 71) continue;

    const reg = usable.find(
      (t) => t.x >= 50 && t.x <= 95 && /^\d{8}$/.test(t.str.trim()) && Math.abs(t.y - s.y) <= 16,
    );
    if (!reg) continue;

    const nameTokens = usable
      .filter((t) => t.x >= 115 && t.x <= 265 && Math.abs(t.y - s.y) <= 16)
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map((t) => t.str.trim());

    const name = nameTokens.join(' ').replace(/\s+/g, ' ').trim();
    if (name) {
      found.push({ serial, regNo: reg.str.trim(), name });
    }
  }

  return found;
}

async function renderPageToDataUrl(
  pdf: pdfjsLib.PDFDocumentProxy,
  requestedPage: number,
  searchTerm: string,
  fallbackFocus: NormalizedPoint,
): Promise<ExtractedPdfPage> {
  const safePage = Math.max(1, Math.min(pdf.numPages, requestedPage));
  const page = await pdf.getPage(safePage);

  const baseViewport = page.getViewport({ scale: 1 });
  const targetWidth = 2200;
  const scale = targetWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D canvas for PDF rendering');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  }).promise;

  let focusPoint = { ...fallbackFocus };
  let foundMatch = false;

  try {
    const textContent = await page.getTextContent();
    for (const item of textContent.items) {
      if ('str' in item && item.str.includes(searchTerm)) {
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const xNorm = Math.max(0.05, Math.min(0.95, tx[4] / canvas.width));
        const yNorm = Math.max(0.05, Math.min(0.95, tx[5] / canvas.height));
        focusPoint = { x: xNorm, y: yNorm };
        foundMatch = true;
        break;
      }
    }
  } catch {
    // Keep fallback focus if scanned PDF
  }

  return {
    pageNumber: safePage,
    dataUrl: canvas.toDataURL('image/png'),
    aspectRatio: canvas.width / canvas.height,
    focusPoint,
    foundMatch,
  };
}

export async function extractResultPdfPages(
  file: File,
  page10Number = 10,
): Promise<ExtractedResultPdf> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const page10 = await renderPageToDataUrl(pdf, page10Number, '24100218', { x: 0.081, y: 0.688 });

  const bySerial = new Map<number, StudentRecord>();
  const rosterEndPage = Math.min(8, pdf.numPages);
  for (let p = 1; p <= rosterEndPage; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const tokens: PositionedToken[] = [];
    for (const item of textContent.items) {
      if ('str' in item) {
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        tokens.push({ str: item.str, x: tx[4], y: tx[5] });
      }
    }
    for (const entry of extractStudentsFromPageTokens(tokens)) {
      if (!bySerial.has(entry.serial)) {
        bySerial.set(entry.serial, entry);
      }
    }
  }

  const students = Array.from(bySerial.values()).sort((a, b) => a.serial - b.serial);

  return {
    totalPages: pdf.numPages,
    page10,
    students,
  };
}
