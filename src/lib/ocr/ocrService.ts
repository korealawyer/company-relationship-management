// ── OCR 서비스 모듈 ──────────────────────────────────────
// Phase 1: 브라우저 내장 (Tesseract.js)
// Phase 2: Google Cloud Vision API 연동 (auto/cloud_vision/tesseract)
'use client';

import Tesseract from 'tesseract.js';
import { computeFileHash, getCache, setCache } from './ocrCache';

// ── Types ────────────────────────────────────────────────

export type OcrEngine = 'cloud_vision' | 'tesseract' | 'auto';
export type OcrMode = 'text' | 'document' | 'handwriting';

export interface OcrResult {
  id: string;
  fileName: string;
  extractedText: string;
  confidence: number;
  language: 'ko' | 'en' | 'mixed';
  processedAt: string;
  pageCount: number;
  engine: string;
  handwritingDetected?: boolean;
  structuredData?: {
    parties?: string[];
    dates?: string[];
    amounts?: string[];
    caseNumbers?: string[];
    keyPhrases?: string[];
    tables?: Array<{ headers: string[]; rows: string[][]; rawText: string }>;
  };
}

export interface OcrOptions {
  engine?: OcrEngine;
  mode?: OcrMode;
  language?: 'kor' | 'eng' | 'kor+eng';
  extractStructured?: boolean;
  useCache?: boolean;
  onProgress?: (pct: number) => void;
}

// ── Supported MIME types ─────────────────────────────────

const IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff',
]);

const IMAGE_EXTS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif',
]);

const PDF_TYPES = new Set(['application/pdf']);
const PDF_EXTS = new Set(['.pdf']);

const DOCX_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const DOCX_EXTS = new Set(['.docx']);

const HWP_EXTS = new Set(['.hwp', '.hwpx']);

function getExt(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

/**
 * OCR 처리 가능한 파일 타입인지 확인
 */
export function isOcrSupported(file: File): boolean {
  const ext = getExt(file.name);
  if (IMAGE_TYPES.has(file.type) || IMAGE_EXTS.has(ext)) return true;
  if (PDF_TYPES.has(file.type) || PDF_EXTS.has(ext)) return true;
  if (DOCX_TYPES.has(file.type) || DOCX_EXTS.has(ext)) return true;
  if (HWP_EXTS.has(ext)) return true;
  return false;
}

// ── Tesseract Worker Management (Singleton) ──────────────

let workerPromise: Promise<Tesseract.Worker> | null = null;

async function getWorker(lang: string): Promise<Tesseract.Worker> {
  if (workerPromise) {
    const w = await workerPromise;
    await w.reinitialize(lang);
    return w;
  }

  workerPromise = (async () => {
    const worker = await Tesseract.createWorker(lang, undefined, {
      logger: () => {}, // suppress default logging
    });
    return worker;
  })();

  return workerPromise;
}

// ── Language Detection ───────────────────────────────────

function detectLanguage(text: string): 'ko' | 'en' | 'mixed' {
  const koreanChars = (text.match(/[\uAC00-\uD7AF\u3130-\u318F]/g) || []).length;
  const asciiChars = (text.match(/[a-zA-Z]/g) || []).length;
  const total = koreanChars + asciiChars;
  if (total === 0) return 'ko';
  const ratio = koreanChars / total;
  if (ratio > 0.7) return 'ko';
  if (ratio < 0.2) return 'en';
  return 'mixed';
}

// ── Image OCR (Tesseract Fallback) ───────────────────────

async function ocrImageTesseract(
  imageSource: Blob | string,
  lang: string,
  onProgress?: (pct: number) => void,
): Promise<{ text: string; confidence: number }> {
  const worker = await getWorker(lang);

  let src: string;
  if (typeof imageSource === 'string') {
    src = imageSource;
  } else {
    src = URL.createObjectURL(imageSource);
  }

  try {
    const { data } = await worker.recognize(src, undefined, {
      text: true,
    });
    onProgress?.(100);
    return { text: data.text, confidence: data.confidence };
  } finally {
    if (typeof imageSource !== 'string') {
      URL.revokeObjectURL(src);
    }
  }
}

// ── PDF Text Extraction (Browser local) ──────────────────

async function extractPdfTextLocal(
  file: File,
  lang: string,
  onProgress?: (pct: number) => void,
): Promise<{ text: string; confidence: number; pageCount: number }> {
  const pdfjsLib = await import('pdfjs-dist');

  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageCount = pdf.numPages;
  const texts: string[] = [];
  let hasTextContent = false;

  // 1단계: 텍스트 레이어 추출 시도
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: unknown) => {
        const t = item as { str?: string };
        return t.str ?? '';
      })
      .join(' ')
      .trim();
    if (pageText.length > 10) {
      hasTextContent = true;
      texts.push(pageText);
    }
    onProgress?.(Math.round((i / pageCount) * 50));
  }

  // 텍스트 레이어가 있으면 그대로 반환 (신뢰도 99)
  if (hasTextContent) {
    onProgress?.(100);
    return { text: texts.join('\n\n'), confidence: 99, pageCount };
  }

  // 2단계: Fallback — Canvas 렌더링 후 Tesseract OCR
  const ocrTexts: string[] = [];
  let totalConf = 0;

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/png'),
    );

    const result = await ocrImageTesseract(blob, lang);
    ocrTexts.push(result.text);
    totalConf += result.confidence;
    onProgress?.(50 + Math.round((i / pageCount) * 50));
  }

  return {
    text: ocrTexts.join('\n\n'),
    confidence: Math.round(totalConf / pageCount),
    pageCount,
  };
}

// ── Cloud Vision API 호출 ────────────────────────────────

async function callCloudVisionApi(file: File, mode: OcrMode): Promise<OcrResult | null> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', mode);

  const res = await fetch('/api/ocr', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorDetails = await res.json().catch(() => ({}));
    console.warn('[Cloud Vision API Error]', res.status, errorDetails);
    return null; // 실패 시 폴백하기 위해 null 반환
  }

  const data = await res.json();
  if (!data.success) return null;

  return {
    id: `ocr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fileName: file.name,
    extractedText: data.text,
    confidence: data.confidence,
    language: data.language as 'ko' | 'en' | 'mixed',
    processedAt: new Date().toISOString(),
    pageCount: data.pages?.length || 1,
    engine: data.engine,
    handwritingDetected: data.handwritingDetected,
    structuredData: {
      tables: data.tables,
    },
  };
}

// ── DOCX / HWP Text Extraction ───────────────────────────

async function extractDocxText(file: File): Promise<string> {
  const AdmZip = (await import('adm-zip')).default;
  const { xml2json } = await import('xml-js');
  const buf = Buffer.from(await file.arrayBuffer());
  const zip = new AdmZip(buf);
  const docEntry = zip.getEntry('word/document.xml');
  if (!docEntry) return '';
  const xml = docEntry.getData().toString('utf8');
  const json = JSON.parse(xml2json(xml, { compact: true }));

  const texts: string[] = [];
  function walk(node: unknown) {
    if (!node || typeof node !== 'object') return;
    const n = node as Record<string, unknown>;
    if (n._text) texts.push(String(n._text));
    if (n._cdata) texts.push(String(n._cdata));
    for (const v of Object.values(n)) {
      if (Array.isArray(v)) v.forEach(walk);
      else if (typeof v === 'object') walk(v);
    }
  }
  walk(json);
  return texts.join(' ');
}

async function extractHwpText(file: File): Promise<string> {
  const ext = getExt(file.name);
  if (ext === '.hwpx') {
    try {
      const AdmZip = (await import('adm-zip')).default;
      const buf = Buffer.from(await file.arrayBuffer());
      const zip = new AdmZip(buf);
      const entries = zip.getEntries();
      const texts: string[] = [];
      for (const entry of entries) {
        if (entry.entryName.startsWith('Contents/') && entry.entryName.endsWith('.xml')) {
          const xml = entry.getData().toString('utf8');
          const cleaned = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleaned.length > 5) texts.push(cleaned);
        }
      }
      return texts.join('\n');
    } catch {
      return '[HWPX 파싱 실패]';
    }
  }
  return '[HWP 바이너리 형식은 브라우저에서 직접 추출이 제한적입니다. 이미지로 변환 후 OCR을 이용해 주세요.]';
}

// ── Main Entry Point ─────────────────────────────────────

export async function extractText(
  file: File,
  options?: OcrOptions,
): Promise<OcrResult> {
  const engine = options?.engine ?? 'auto';
  const mode = options?.mode ?? 'document';
  const lang = options?.language ?? 'kor+eng';
  const useCache = options?.useCache ?? true;
  const onProgress = options?.onProgress;
  const ext = getExt(file.name);

  // 1. 캐시 확인
  let fileHash = '';
  if (useCache) {
    fileHash = await computeFileHash(file);
    const cached = await getCache(fileHash);
    if (cached && (engine === 'auto' || cached.engine === engine)) {
      onProgress?.(100);
      return cached.result as OcrResult;
    }
  }

  let finalResult: OcrResult | null = null;
  const isImageOrPdf = IMAGE_TYPES.has(file.type) || IMAGE_EXTS.has(ext) || PDF_TYPES.has(file.type) || PDF_EXTS.has(ext);

  // 2. Cloud Vision 호출 (auto 또는 cloud_vision 지정 시)
  if (isImageOrPdf && (engine === 'auto' || engine === 'cloud_vision')) {
    onProgress?.(40);
    // PDF의 경우 텍스트 레이어가 완벽하다면 굳이 API를 안 부를 수도 있지만,
    // Phase 2 명세에 따라 Cloud Vision을 우선 호출 (PDF asyncBatch) 하도록 설정.
    finalResult = await callCloudVisionApi(file, mode);
  }

  // 3. Tesseract / Local Fallback
  if (!finalResult) {
    let extractedText = '';
    let confidence = 0;
    let pageCount = 1;

    if (IMAGE_TYPES.has(file.type) || IMAGE_EXTS.has(ext)) {
      onProgress?.(30);
      const res = await ocrImageTesseract(file, lang, onProgress);
      extractedText = res.text;
      confidence = res.confidence;
    } else if (PDF_TYPES.has(file.type) || PDF_EXTS.has(ext)) {
      onProgress?.(10);
      const res = await extractPdfTextLocal(file, lang, onProgress);
      extractedText = res.text;
      confidence = res.confidence;
      pageCount = res.pageCount;
    } else if (DOCX_TYPES.has(file.type) || DOCX_EXTS.has(ext)) {
      onProgress?.(50);
      extractedText = await extractDocxText(file);
      confidence = 95;
      onProgress?.(100);
    } else if (HWP_EXTS.has(ext)) {
      onProgress?.(50);
      extractedText = await extractHwpText(file);
      confidence = ext === '.hwpx' ? 90 : 30;
      onProgress?.(100);
    } else {
      throw new Error(`지원하지 않는 파일 형식입니다: ${file.type || ext}`);
    }

    finalResult = {
      id: `ocr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      fileName: file.name,
      extractedText,
      confidence: Math.round(confidence),
      language: detectLanguage(extractedText),
      processedAt: new Date().toISOString(),
      pageCount,
      engine: 'tesseract',
    };
  }

  // 4. 구조화 데이터 추출 (정규식 기반 병합)
  if (options?.extractStructured !== false && finalResult.extractedText.length > 20) {
    const { parseLegalEntities } = await import('./legalParser');
    const parsed = parseLegalEntities(finalResult.extractedText);
    
    // Cloud Vision에서 온 표 데이터가 있다면 보존
    const existingTables = finalResult.structuredData?.tables;
    
    finalResult.structuredData = {
      ...parsed,
      tables: existingTables || parsed?.tables,
    };
  }

  // 5. 캐시 저장
  if (useCache && fileHash) {
    await setCache(fileHash, finalResult, finalResult.engine, mode);
  }

  onProgress?.(100);
  return finalResult;
}
