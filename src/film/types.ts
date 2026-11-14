import { VERIFIED_71_STUDENTS } from './studentsData';

export const FILM_WIDTH = 1080;
export const FILM_HEIGHT = 1920;
export const FILM_FPS = 30;
export const FILM_DURATION = 32;
export const TOTAL_FRAMES = FILM_DURATION * FILM_FPS; // 960 frames @ 30 FPS

export const PALETTE = {
  bgMain: '#FFFFFF',
  bgSecondary: '#F3F4F6',
  textMain: '#171717',
  textSecondary: '#525252',
  border: '#D1D5DB',
  accent: '#2563EB',
  success: '#16834A',
  failed: '#C62828',
} as const;

export interface NormalizedPoint {
  x: number; // 0..1 across document width
  y: number; // 0..1 across document height
}

export interface CertificateFocalPoints {
  university: NormalizedPoint;
  candidateName: NormalizedPoint;
  degreeTitle: NormalizedPoint;
  classification: NormalizedPoint;
}

export interface StudentRecord {
  serial: number;
  name: string;
  regNo: string;
}

export interface DocumentSources {
  pdfFileName: string | null;
  pdfPage10Number: number;
  pdfPage10DataUrl: string | null;
  pdfPage10AspectRatio: number;
  pdfPage10Focus: NormalizedPoint;
  students: StudentRecord[];
  certificateFileName: string | null;
  certificateImageDataUrl: string | null;
  certificateAspectRatio: number;
  certificateFocalPoints: CertificateFocalPoints;
}

export const CUSAT_IDENTITY = {
  university: 'COCHIN UNIVERSITY OF SCIENCE & TECHNOLOGY',
  shortName: 'CUSAT',
  reportTitle: 'Master of Computer Applications · April 2026 Detailed Tabulation Report',
} as const;

export const PAGE10_FAILED_24100218 = {
  regNo: '24100218',
  name: 'SARANG R N',
  heading: 'Failed Students',
  semesters: [
    {
      label: 'Semester 1',
      code: 'Sem--1',
      gpa: '6.58',
      credits: '24.00',
      marks: '411.00',
      raw: '(6.58 -24.00 -411.00 , Sem--1)',
    },
    {
      label: 'Semester 2',
      code: 'Sem--2',
      gpa: '7.00',
      credits: '24.00',
      marks: '452.00',
      raw: '(7.00 -24.00 -452.00 , Sem--2)',
    },
    {
      label: 'Semester 3',
      code: 'Sem--3',
      gpa: '0.00',
      credits: '18.00',
      marks: '380.00',
      raw: '(0.00 -18.00 -380.00 , Sem--3)',
    },
    {
      label: 'Semester 4',
      code: 'Sem--4',
      gpa: '10.00',
      credits: '16.00',
      marks: '360.00',
      raw: '(10.00 -16.00 -360.00 , Sem--4)',
    },
  ],
} as const;

export const CERTIFICATE_FACTS = {
  university: 'Cochin University of Science and Technology',
  regNo: '24100218',
  name: 'SARANG R N',
  faculty: 'Faculty of Technology',
  degree: 'Master of Computer Applications',
  classification: 'First Class',
  examination: 'April 2026',
  awardDate: '29 October, 2026',
} as const;

export const DEFAULT_DOCUMENT_SOURCES: DocumentSources = {
  pdfFileName: 'fail.pdf',
  pdfPage10Number: 10,
  pdfPage10DataUrl: '/assets/page10.png',
  pdfPage10AspectRatio: 4134 / 2923,
  pdfPage10Focus: { x: 0.081, y: 0.688 },
  students: VERIFIED_71_STUDENTS,
  certificateFileName: 'pass.jpg',
  certificateImageDataUrl: '/assets/aistudio/pass_f51424dd.jpg',
  certificateAspectRatio: 3048 / 4064,
  certificateFocalPoints: {
    university: { x: 0.5, y: 0.2 },
    candidateName: { x: 0.5, y: 0.43 },
    degreeTitle: { x: 0.5, y: 0.515 },
    classification: { x: 0.5, y: 0.635 },
  },
};

export interface FilmChapter {
  id: string;
  label: string;
  time: number;
}

export const FILM_CHAPTERS: FilmChapter[] = [
  { id: 'search', label: '01 Search · 24100218', time: 0.0 },
  { id: 'students', label: '02 71 Students', time: 3.5 },
  { id: 'page10', label: '03 Failed · Page 10', time: 13.5 },
  { id: 'dramatic', label: '04 SARANG R N', time: 19.2 },
  { id: 'certificate', label: '05 Certificate', time: 24.0 },
];

export type RenderPhase =
  | 'idle'
  | 'preparing'
  | 'audio'
  | 'frames'
  | 'encoding'
  | 'complete'
  | 'error';

export interface RenderStatus {
  phase: RenderPhase;
  progress: number;
  currentFrame: number;
  totalFrames: number;
  message: string;
  videoUrl: string | null;
  downloadUrl: string | null;
  fileSizeBytes: number | null;
}
