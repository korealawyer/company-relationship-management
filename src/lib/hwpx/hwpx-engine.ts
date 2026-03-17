/**
 * HWPX 주입 엔진 (PoC)
 * 
 * HWPX 파일 = ZIP 아카이브. 내부 Contents/section0.xml을 파싱하여
 * 플레이스홀더를 치환한 뒤 재압축하여 새로운 HWPX 파일을 생성합니다.
 * 
 * 핵심 흐름:
 * 1. 샘플 HWPX(ZIP) 를 메모리에서 해제
 * 2. Contents/section0.xml 읽기
 * 3. {{PLACEHOLDER}} → 실제 콘텐츠 치환
 * 4. 마크다운 → HWPX XML 단락 변환
 * 5. 재압축 → Buffer 반환
 */

import AdmZip from 'adm-zip';
import { markdownToHwpxParagraphs } from './markdown-to-hwpx';
import { PlaceholderMap, PLACEHOLDER_KEYS } from './placeholder-map';

/** HWPX 내부 파일 경로 상수 */
const SECTION_XML_PATH = 'Contents/section0.xml';
const CONTENT_TYPES_PATH = '[Content_Types].xml';
const META_PATH = 'META-INF/manifest.xml';
const HEADER_PATH = 'Contents/header.xml';

/**
 * 최소 HWPX 구조를 메모리에서 생성합니다.
 * 실제 HWPX 파일이 없을 때 기본 템플릿으로 사용합니다.
 */
export function createMinimalHwpxTemplate(placeholderContent = '{{OPINION_CONTENT}}'): Buffer {
  const zip = new AdmZip();

  // [Content_Types].xml
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Override PartName="/Contents/section0.xml" ContentType="application/xml"/>
  <Override PartName="/Contents/header.xml" ContentType="application/xml"/>
  <Override PartName="/META-INF/manifest.xml" ContentType="application/xml"/>
</Types>`;
  zip.addFile(CONTENT_TYPES_PATH, Buffer.from(contentTypes, 'utf-8'));

  // META-INF/manifest.xml
  const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/hwp+zip"/>
  <manifest:file-entry manifest:full-path="Contents/section0.xml" manifest:media-type="application/xml"/>
  <manifest:file-entry manifest:full-path="Contents/header.xml" manifest:media-type="application/xml"/>
</manifest:manifest>`;
  zip.addFile(META_PATH, Buffer.from(manifest, 'utf-8'));

  // Contents/header.xml — 문서 헤더 (페이지 설정)
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<hh:head xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head"
         xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"
         xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core">
  <hh:beginNum page="1" footnote="1" endnote="1"/>
  <hh:refList>
    <hh:fontfaces>
      <hh:fontface lang="hangul">
        <hh:font id="0" face="함초롬바탕" type="ttf"/>
      </hh:fontface>
      <hh:fontface lang="latin">
        <hh:font id="0" face="함초롬바탕" type="ttf"/>
      </hh:fontface>
    </hh:fontfaces>
    <hh:charProperties>
      <hh:charPr id="0" height="1000" bold="false" italic="false"/>
      <hh:charPr id="1" height="2000" bold="true" italic="false"/>
      <hh:charPr id="2" height="1600" bold="true" italic="false"/>
      <hh:charPr id="3" height="1400" bold="true" italic="false"/>
    </hh:charProperties>
  </hh:refList>
</hh:head>`;
  zip.addFile(HEADER_PATH, Buffer.from(header, 'utf-8'));

  // Contents/section0.xml — 문서 본문 (플레이스홀더 포함)
  const section = `<?xml version="1.0" encoding="UTF-8"?>
<hs:sec xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section"
        xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"
        xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core"
        xmlns:ht="http://www.hancom.co.kr/hwpml/2011/text">
  <hp:p>
    <hp:pPr>
      <hp:paraPr />
    </hp:pPr>
    <hp:run>
      <hp:rPr>
        <hp:charPr height="2000" bold="true" />
      </hp:rPr>
      <hp:t>법 률 의 견 서</hp:t>
    </hp:run>
  </hp:p>
  <hp:p>
    <hp:pPr><hp:paraPr /></hp:pPr>
    <hp:run><hp:rPr><hp:charPr height="1000" /></hp:rPr><hp:t> </hp:t></hp:run>
  </hp:p>
  <hp:p>
    <hp:pPr><hp:paraPr /></hp:pPr>
    <hp:run><hp:rPr><hp:charPr height="1000" /></hp:rPr><hp:t>작성일: {{DATE}}</hp:t></hp:run>
  </hp:p>
  <hp:p>
    <hp:pPr><hp:paraPr /></hp:pPr>
    <hp:run><hp:rPr><hp:charPr height="1000" /></hp:rPr><hp:t>사건번호: {{CASE_NUMBER}}</hp:t></hp:run>
  </hp:p>
  <hp:p>
    <hp:pPr><hp:paraPr /></hp:pPr>
    <hp:run><hp:rPr><hp:charPr height="1000" /></hp:rPr><hp:t>의뢰인: {{CLIENT_NAME}}</hp:t></hp:run>
  </hp:p>
  <hp:p>
    <hp:pPr><hp:paraPr /></hp:pPr>
    <hp:run><hp:rPr><hp:charPr height="1000" /></hp:rPr><hp:t>상대방: {{OPPONENT_NAME}}</hp:t></hp:run>
  </hp:p>
  <hp:p>
    <hp:pPr><hp:paraPr /></hp:pPr>
    <hp:run><hp:rPr><hp:charPr height="1000" /></hp:rPr><hp:t>담당변호사: {{LAWYER_NAME}} ({{FIRM_NAME}})</hp:t></hp:run>
  </hp:p>
  <hp:p>
    <hp:pPr><hp:paraPr /></hp:pPr>
    <hp:run><hp:rPr><hp:charPr height="1000" /></hp:rPr><hp:t> </hp:t></hp:run>
  </hp:p>
  <hp:p>
    <hp:pPr><hp:paraPr /></hp:pPr>
    <hp:run><hp:rPr><hp:charPr height="1600" bold="true" /></hp:rPr><hp:t>사건명: {{CASE_TITLE}}</hp:t></hp:run>
  </hp:p>
  <hp:p>
    <hp:pPr><hp:paraPr /></hp:pPr>
    <hp:run><hp:rPr><hp:charPr height="1000" /></hp:rPr><hp:t> </hp:t></hp:run>
  </hp:p>
  ${placeholderContent}
  <hp:p>
    <hp:pPr><hp:paraPr /></hp:pPr>
    <hp:run><hp:rPr><hp:charPr height="1000" /></hp:rPr><hp:t> </hp:t></hp:run>
  </hp:p>
  <hp:p>
    <hp:pPr><hp:paraPr /></hp:pPr>
    <hp:run><hp:rPr><hp:charPr height="1400" bold="true" /></hp:rPr><hp:t>결론</hp:t></hp:run>
  </hp:p>
  <hp:p>
    <hp:pPr><hp:paraPr /></hp:pPr>
    <hp:run><hp:rPr><hp:charPr height="1000" /></hp:rPr><hp:t>{{CONCLUSION}}</hp:t></hp:run>
  </hp:p>
</hs:sec>`;
  zip.addFile(SECTION_XML_PATH, Buffer.from(section, 'utf-8'));

  return zip.toBuffer();
}

/**
 * HWPX 파일의 section0.xml 내 플레이스홀더를 치환합니다.
 * 
 * @param hwpxBuffer HWPX 파일 버퍼 (ZIP)
 * @param placeholders 플레이스홀더 맵 { "{{KEY}}": "value" }
 * @returns 치환된 새 HWPX 파일 버퍼
 */
export function replaceHwpxPlaceholders(
  hwpxBuffer: Buffer,
  placeholders: PlaceholderMap,
): Buffer {
  const zip = new AdmZip(hwpxBuffer);

  // section0.xml 읽기
  const sectionEntry = zip.getEntry(SECTION_XML_PATH);
  if (!sectionEntry) {
    throw new Error(`HWPX 파일 내 ${SECTION_XML_PATH}을 찾을 수 없습니다.`);
  }

  let sectionXml = sectionEntry.getData().toString('utf-8');

  // 플레이스홀더 치환
  for (const [placeholder, value] of Object.entries(placeholders)) {
    if (placeholder === PLACEHOLDER_KEYS.OPINION_CONTENT) {
      // OPINION_CONTENT는 마크다운 → HWPX XML 변환 후 치환
      const hwpxParagraphs = markdownToHwpxParagraphs(value);
      sectionXml = sectionXml.replace(placeholder, hwpxParagraphs);
    } else {
      // 일반 텍스트 치환
      sectionXml = sectionXml.replaceAll(placeholder, escapeXmlContent(value));
    }
  }

  // 수정된 XML을 ZIP에 다시 쓰기
  zip.updateFile(SECTION_XML_PATH, Buffer.from(sectionXml, 'utf-8'));

  return zip.toBuffer();
}

/**
 * 마크다운 콘텐츠로 법률 의견서 HWPX를 생성합니다.
 * 
 * @param markdownContent 법률 의견서 본문 (마크다운)
 * @param metadata 문서 메타데이터 (의뢰인, 사건 정보 등)
 * @param templateBuffer 기존 HWPX 템플릿 (없으면 기본 템플릿 사용)
 * @returns 완성된 HWPX 파일 버퍼
 */
export function generateOpinionHwpx(
  markdownContent: string,
  metadata: Partial<Record<string, string>> = {},
  templateBuffer?: Buffer,
): Buffer {
  // 템플릿 준비
  const template = templateBuffer || createMinimalHwpxTemplate();

  // 플레이스홀더 맵 구성
  const placeholders: PlaceholderMap = {
    [PLACEHOLDER_KEYS.OPINION_CONTENT]: markdownContent,
    [PLACEHOLDER_KEYS.DATE]: metadata.date || new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    [PLACEHOLDER_KEYS.CASE_NUMBER]: metadata.caseNumber || '2026-0001',
    [PLACEHOLDER_KEYS.CLIENT_NAME]: metadata.clientName || '의뢰인',
    [PLACEHOLDER_KEYS.OPPONENT_NAME]: metadata.opponentName || '상대방',
    [PLACEHOLDER_KEYS.LAWYER_NAME]: metadata.lawyerName || '담당변호사',
    [PLACEHOLDER_KEYS.FIRM_NAME]: metadata.firmName || '법무법인',
    [PLACEHOLDER_KEYS.CASE_TITLE]: metadata.caseTitle || '사건명',
    [PLACEHOLDER_KEYS.CONCLUSION]: metadata.conclusion || '',
  };

  return replaceHwpxPlaceholders(template, placeholders);
}

/**
 * HWPX 파일 내부 구조를 분석합니다. (디버깅용)
 */
export function inspectHwpx(hwpxBuffer: Buffer): { entries: string[]; sectionXml: string | null } {
  const zip = new AdmZip(hwpxBuffer);
  const entries = zip.getEntries().map(e => e.entryName);
  const sectionEntry = zip.getEntry(SECTION_XML_PATH);
  const sectionXml = sectionEntry ? sectionEntry.getData().toString('utf-8') : null;
  return { entries, sectionXml };
}

/** XML 콘텐츠 이스케이프 */
function escapeXmlContent(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
