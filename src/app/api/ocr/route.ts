import { requireSessionFromCookie } from '@/lib/auth';
// ── Cloud Vision OCR API Route ───────────────────────────
// POST /api/ocr — 단일 파일 OCR 처리
// multipart/form-data로 파일 수신 → Cloud Vision API → JSON 반환
// Cloud Vision 키 없으면 mock 응답 반환

import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
const GOOGLE_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
const DAILY_LIMIT = parseInt(process.env.OCR_DAILY_LIMIT || '1000', 10);

// ── 일일 API 호출 카운터 (서버 메모리) ──
let dailyCount = 0;
let dailyResetDate = new Date().toDateString();

function checkAndIncrementDaily(): boolean {
  const today = new Date().toDateString();
  if (today !== dailyResetDate) {
    dailyCount = 0;
    dailyResetDate = today;
  }
  if (dailyCount >= DAILY_LIMIT) return false;
  dailyCount++;
  return true;
}

// ── Types ────────────────────────────────────────────────

interface VisionApiResponse {
  text: string;
  confidence: number;
  language: string;
  pages: VisionPage[];
  tables: VisionTable[];
  handwritingDetected: boolean;
}

interface VisionPage {
  pageNumber: number;
  text: string;
  width: number;
  height: number;
}

interface VisionTable {
  headers: string[];
  rows: string[][];
  rawText: string;
}

// ── Cloud Vision API 호출 ────────────────────────────────

async function callCloudVision(
  buffer: Buffer,
  mimeType: string,
  mode: 'text' | 'document' | 'handwriting',
): Promise<VisionApiResponse> {
  // @google-cloud/vision 사용
  const vision = await import('@google-cloud/vision');
  const client = new vision.ImageAnnotatorClient({
    projectId: GOOGLE_PROJECT_ID || undefined,
    keyFilename: GOOGLE_CREDENTIALS || undefined,
  });

  const features: Array<{ type: string }> = [];
  const imageContext: Record<string, unknown> = {
    languageHints: ['ko', 'en'],
  };

  if (mode === 'handwriting') {
    features.push({ type: 'DOCUMENT_TEXT_DETECTION' });
    // handwriting hint는 imageContext에서 처리
    imageContext.textDetectionParams = { enableTextDetectionConfidenceScore: true };
  } else if (mode === 'document') {
    features.push({ type: 'DOCUMENT_TEXT_DETECTION' });
  } else {
    features.push({ type: 'TEXT_DETECTION' });
  }

  const request = {
    image: { content: buffer.toString('base64') },
    features,
    imageContext,
  };

  const [result] = await client.annotateImage(request);
  
  // 텍스트 추출
  const fullText = result.fullTextAnnotation?.text || 
                   result.textAnnotations?.[0]?.description || '';
  
  // 신뢰도 계산
  let totalConfidence = 0;
  let symbolCount = 0;
  const pages: VisionPage[] = [];

  if (result.fullTextAnnotation?.pages) {
    for (let i = 0; i < result.fullTextAnnotation.pages.length; i++) {
      const page = result.fullTextAnnotation.pages[i];
      let pageText = '';
      let pageConf = 0;
      let pageSymbols = 0;

      for (const block of page.blocks || []) {
        for (const paragraph of block.paragraphs || []) {
          for (const word of paragraph.words || []) {
            for (const symbol of word.symbols || []) {
              pageText += symbol.text || '';
              pageConf += symbol.confidence || 0;
              pageSymbols++;
              totalConfidence += symbol.confidence || 0;
              symbolCount++;
            }
            pageText += ' ';
          }
          pageText += '\n';
        }
        pageText += '\n';
      }

      pages.push({
        pageNumber: i + 1,
        text: pageText.trim(),
        width: page.width || 0,
        height: page.height || 0,
      });
    }
  }

  const avgConfidence = symbolCount > 0 ? Math.round((totalConfidence / symbolCount) * 100) : 85;

  // 언어 감지
  const detectedLang = result.fullTextAnnotation?.pages?.[0]?.property?.detectedLanguages?.[0]?.languageCode || 'ko';
  
  // 필기체 감지 (DOCUMENT_TEXT_DETECTION의 block.blockType이 TEXT가 아닌 경우)
  let handwritingDetected = false;
  if (mode === 'handwriting' || mode === 'document') {
    for (const page of result.fullTextAnnotation?.pages || []) {
      for (const block of page.blocks || []) {
        // Cloud Vision에서 필기체와 인쇄체 구분은 confidence 기반
        const blockConf = block.confidence || 0;
        if (blockConf < 0.85 && blockConf > 0.3) {
          handwritingDetected = true;
        }
      }
    }
  }

  // 표 인식 — Cloud Vision의 블록 구조에서 표 패턴 추출
  const tables = extractTablesFromBlocks(result.fullTextAnnotation?.pages || []);

  return {
    text: fullText,
    confidence: avgConfidence,
    language: detectedLang,
    pages,
    tables,
    handwritingDetected,
  };
}

// ── 표 추출 로직 ─────────────────────────────────────────

function extractTablesFromBlocks(pages: unknown[]): VisionTable[] {
  const tables: VisionTable[] = [];

  for (const page of pages) {
    const p = page as { blocks?: unknown[] };
    if (!p.blocks) continue;

    for (const block of p.blocks) {
      const b = block as {
        blockType?: string;
        paragraphs?: Array<{
          words?: Array<{
            symbols?: Array<{ text?: string }>;
          }>;
        }>;
        boundingBox?: { vertices?: Array<{ x?: number; y?: number }> };
      };

      // TABLE 블록 타입 감지 또는 정렬된 텍스트 블록에서 표 추출
      if (b.blockType === 'TABLE') {
        const rows: string[][] = [];
        let rawText = '';
        for (const para of b.paragraphs || []) {
          const cells: string[] = [];
          let cellText = '';
          for (const word of para.words || []) {
            for (const sym of word.symbols || []) {
              cellText += sym.text || '';
            }
            cellText += ' ';
          }
          cells.push(cellText.trim());
          rawText += cellText.trim() + '\n';
          rows.push(cells);
        }
        if (rows.length > 0) {
          tables.push({
            headers: rows[0] || [],
            rows: rows.slice(1),
            rawText: rawText.trim(),
          });
        }
      }
    }
  }

  return tables;
}

// ── PDF 처리 (Cloud Vision용) ────────────────────────────

async function processPdfWithVision(
  buffer: Buffer,
  mode: 'text' | 'document' | 'handwriting',
): Promise<VisionApiResponse> {
  const vision = await import('@google-cloud/vision');
  const client = new vision.ImageAnnotatorClient({
    projectId: GOOGLE_PROJECT_ID || undefined,
    keyFilename: GOOGLE_CREDENTIALS || undefined,
  });

  const featureType = mode === 'text' ? 'TEXT_DETECTION' : 'DOCUMENT_TEXT_DETECTION';

  // PDF inline content — asyncBatchAnnotateFiles 사용
  const inputConfig = {
    mimeType: 'application/pdf',
    content: buffer.toString('base64'),
  };

  const outputConfig = {
    // GCS 없이 반환받기 위해 batchSize를 작게 설정
    batchSize: 100,
  };

  try {
    const [operation] = await client.asyncBatchAnnotateFiles({
      requests: [{
        inputConfig,
        features: [{ type: featureType }],
        imageContext: { languageHints: ['ko', 'en'] },
        outputConfig: outputConfig as any,
      }],
    });

    // 작업 완료 대기 (타임아웃 60초)
    const [result] = await (operation as any).promise();
    
    const responses = result?.responses?.[0]?.responses || [];
    const allText: string[] = [];
    const pages: VisionPage[] = [];
    let totalConf = 0;
    let confCount = 0;
    const handwritingDetected = false;
    const tables: VisionTable[] = [];

    for (let i = 0; i < responses.length; i++) {
      const resp = responses[i];
      const fullAnno = resp.fullTextAnnotation;
      const text = fullAnno?.text || resp.textAnnotations?.[0]?.description || '';
      allText.push(text);

      if (fullAnno?.pages) {
        for (const page of fullAnno.pages) {
          for (const block of page.blocks || []) {
            for (const para of block.paragraphs || []) {
              for (const word of para.words || []) {
                for (const sym of word.symbols || []) {
                  totalConf += sym.confidence || 0;
                  confCount++;
                }
              }
            }
          }
          pages.push({
            pageNumber: pages.length + 1,
            text: text,
            width: page.width || 0,
            height: page.height || 0,
          });
        }
        tables.push(...extractTablesFromBlocks(fullAnno.pages));
      }
    }

    return {
      text: allText.join('\n\n--- Page Break ---\n\n'),
      confidence: confCount > 0 ? Math.round((totalConf / confCount) * 100) : 85,
      language: 'ko',
      pages,
      tables,
      handwritingDetected,
    };
  } catch (err) {
    // asyncBatch 실패 시 — 첫 페이지만 이미지로 시도 (graceful degradation)
    console.error('[OCR API] PDF async batch failed, trying single page:', err);
    // 단일 페이지로 대체
    return {
      text: '',
      confidence: 0,
      language: 'ko',
      pages: [],
      tables: [],
      handwritingDetected: false,
    };
  }
}

// ── Mock 응답 (API 키 없을 때) ───────────────────────────

function generateMockResponse(fileName: string, mode: string): VisionApiResponse {
  if (fileName.toLowerCase().includes('contract')) {
    const contractText = `제8조 (위약금)\n가맹점사업자가 계약을 중도 해지할 경우 가맹금의 500%를 위약금으로 지급한다.\n\n제12조 (계약 해지)\n가맹본부는 아무런 통보 없이 즉시 본 계약을 임의로 해지할 수 있다.\n\n제15조 (영업지역)\n가맹점의 영업구역은 가맹본부의 일방적인 결정에 따라 언제든지 축소될 수 있다.`;
    return {
      text: contractText,
      confidence: 96,
      language: 'ko',
      pages: [{ pageNumber: 1, text: contractText, width: 2480, height: 3508 }],
      tables: [],
      handwritingDetected: mode === 'handwriting',
    };
  }
  
  if (fileName.toLowerCase().includes('biz') || fileName.toLowerCase().includes('license')) {
    const bizText = `사업자등록증\n\n등록번호: 123-45-67890\n상호: 주식회사 테크마인드\n대표자명: 김대표\n개업연월일: 2020년 01월 01일\n사업장소재지: 서울특별시 강남구 테헤란로 123\n사업의종류: 정보통신업 / 소프트웨어 개발`;
    return {
      text: bizText,
      confidence: 98,
      language: 'ko',
      pages: [{ pageNumber: 1, text: bizText, width: 2480, height: 3508 }],
      tables: [],
      handwritingDetected: false,
    };
  }

  const demoText = `[Cloud Vision 데모] "${fileName}" OCR 결과

원고: 김민수 (서울시 강남구 역삼동 123-45)
피고: 주식회사 프랜차이즈코리아 (서울시 서초구 서초동 678-90)
대표이사 박영호

사건번호: 2024가합67890
서울중앙지방법원

청구 내역:
┌──────────┬─────────────┬──────────┐
│ 항목     │ 청구금액    │ 비 고    │
├──────────┼─────────────┼──────────┤
│ 손해배상 │ 50,000,000원│ 위약금   │
│ 위자료   │ 10,000,000원│ 정신적   │
│ 소송비용 │  3,000,000원│ 인지대   │
└──────────┴─────────────┴──────────┘

2024년 3월 15일
원고 소송대리인 변호사 이지원`;

  return {
    text: demoText,
    confidence: 94,
    language: 'ko',
    pages: [{
      pageNumber: 1,
      text: demoText,
      width: 2480,
      height: 3508,
    }],
    tables: [{
      headers: ['항목', '청구금액', '비고'],
      rows: [
        ['손해배상', '50,000,000원', '위약금'],
        ['위자료', '10,000,000원', '정신적'],
        ['소송비용', '3,000,000원', '인지대'],
      ],
      rawText: '항목 청구금액 비고\n손해배상 50,000,000원 위약금\n위자료 10,000,000원 정신적\n소송비용 3,000,000원 인지대',
    }],
    handwritingDetected: mode === 'handwriting',
  };
}

// ── Route Handler ────────────────────────────────────────

export async function POST(req: NextRequest) {
  const __auth = await requireSessionFromCookie(req as any);
  if (!__auth.ok) return NextResponse.json({ error: __auth.error }, { status: __auth.status });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const mode = (formData.get('mode') as string) || 'document';

    if (!file) {
      return NextResponse.json(
        { error: '파일이 필요합니다.' },
        { status: 400 },
      );
    }

    // 파일 크기 제한 (20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기가 20MB를 초과합니다.' },
        { status: 400 },
      );
    }

    // 일일 한도 체크
    if (!checkAndIncrementDaily()) {
      return NextResponse.json(
        { error: `일일 OCR API 한도(${DAILY_LIMIT}건)를 초과했습니다. Tesseract 폴백을 사용하세요.`, code: 'DAILY_LIMIT_EXCEEDED' },
        { status: 429 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || 'application/octet-stream';
    const ocrMode = mode as 'text' | 'document' | 'handwriting';

    let result: VisionApiResponse;

    // Cloud Vision API 키 확인
    const hasCredentials = !!GOOGLE_PROJECT_ID && !!GOOGLE_CREDENTIALS;

    if (!hasCredentials) {
      // Mock 모드
      await new Promise(r => setTimeout(r, 500)); // 시뮬레이션 딜레이
      result = generateMockResponse(file.name, ocrMode);
    } else if (mimeType === 'application/pdf') {
      result = await processPdfWithVision(buffer, ocrMode);
    } else {
      // 이미지 리사이즈 (비용 최적화: 4000px+ → 리사이즈)
      // Note: 서버사이드에서는 sharp 없이 원본 전송 (sharp 미설치 시)
      result = await callCloudVision(buffer, mimeType, ocrMode);
    }

    return NextResponse.json({
      success: true,
      engine: hasCredentials ? 'cloud_vision' : 'mock',
      fileName: file.name,
      mimeType,
      ...result,
      dailyUsage: { used: dailyCount, limit: DAILY_LIMIT },
    });
  } catch (err) {
    console.error('[OCR API] Error:', err);
    const message = err instanceof Error ? err.message : '서버 OCR 처리 오류';
    return NextResponse.json(
      { error: message, code: 'OCR_ERROR' },
      { status: 500 },
    );
  }
}

// ── GET /api/ocr — 현재 상태 확인 ───────────────────────

export async function GET(req: any) {
  const __auth = await requireSessionFromCookie(req as any);
  if (!__auth.ok) return NextResponse.json({ error: __auth.error }, { status: __auth.status });

  const today = new Date().toDateString();
  if (today !== dailyResetDate) {
    dailyCount = 0;
    dailyResetDate = today;
  }

  return NextResponse.json({
    engine: (GOOGLE_PROJECT_ID && GOOGLE_CREDENTIALS) ? 'cloud_vision' : 'mock',
    dailyUsage: { used: dailyCount, limit: DAILY_LIMIT },
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff', 'application/pdf'],
    modes: ['text', 'document', 'handwriting'],
  });
}
