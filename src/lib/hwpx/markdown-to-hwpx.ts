/**
 * 마크다운 → HWPX XML 변환 유틸리티
 * 
 * 마크다운 텍스트를 HWPX 문서의 XML 단락 요소로 변환합니다.
 * 지원: h1~h3, 본문, 볼드(**), 이탤릭(*), 불릿 리스트(- ), 번호 리스트(1. )
 */

/** HWPX XML 네임스페이스 */
const HP_NS = 'http://www.hancom.co.kr/hwpml/2011/paragraph';
const HT_NS = 'http://www.hancom.co.kr/hwpml/2011/text';
const HC_NS = 'http://www.hancom.co.kr/hwpml/2011/core';

/**
 * 텍스트를 HWPX <hp:run> 요소 XML로 감싸기
 * @param text 텍스트 내용
 * @param bold 볼드 여부
 * @param italic 이탤릭 여부
 * @param fontSize 폰트 크기 (pt * 100, HWPX 기본 단위)
 */
function createRun(text: string, bold = false, italic = false, fontSize = 1000): string {
  const charPrAttrs = [
    `height="${fontSize}"`,
    bold ? 'bold="true"' : '',
    italic ? 'italic="true"' : '',
  ].filter(Boolean).join(' ');

  return `<hp:run>
  <hp:rPr>
    <hp:charPr ${charPrAttrs} />
  </hp:rPr>
  <hp:t>${escapeXml(text)}</hp:t>
</hp:run>`;
}

/**
 * 마크다운 인라인 서식(볼드/이탤릭)을 파싱하여 Run 배열 생성
 */
function parseInlineFormatting(text: string, baseFontSize = 1000): string {
  const runs: string[] = [];
  // 볼드+이탤릭: ***text***
  // 볼드: **text**
  // 이탤릭: *text*
  const regex = /(\*{3}(.+?)\*{3}|\*{2}(.+?)\*{2}|\*(.+?)\*|([^*]+))/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      // ***bold italic***
      runs.push(createRun(match[2], true, true, baseFontSize));
    } else if (match[3]) {
      // **bold**
      runs.push(createRun(match[3], true, false, baseFontSize));
    } else if (match[4]) {
      // *italic*
      runs.push(createRun(match[4], false, true, baseFontSize));
    } else if (match[5]) {
      // plain text
      runs.push(createRun(match[5], false, false, baseFontSize));
    }
  }

  return runs.join('\n');
}

/**
 * 단일 마크다운 라인을 HWPX <hp:p> 단락으로 변환
 */
function lineToHwpxParagraph(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) {
    // 빈 줄 → 빈 단락
    return `<hp:p>
  <hp:pPr>
    <hp:paraPr />
  </hp:pPr>
  ${createRun(' ')}
</hp:p>`;
  }

  // Heading
  const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const text = headingMatch[2];
    // h1: 2000 (20pt), h2: 1600 (16pt), h3: 1400 (14pt)
    const fontSizes: Record<number, number> = { 1: 2000, 2: 1600, 3: 1400 };
    const fontSize = fontSizes[level] || 1000;
    return `<hp:p>
  <hp:pPr>
    <hp:paraPr />
  </hp:pPr>
  ${parseInlineFormatting(text, fontSize)}
</hp:p>`;
  }

  // 불릿 리스트
  const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
  if (bulletMatch) {
    return `<hp:p>
  <hp:pPr>
    <hp:paraPr />
  </hp:pPr>
  ${createRun('• ')}${parseInlineFormatting(bulletMatch[1])}
</hp:p>`;
  }

  // 번호 리스트
  const numberMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
  if (numberMatch) {
    return `<hp:p>
  <hp:pPr>
    <hp:paraPr />
  </hp:pPr>
  ${createRun(`${numberMatch[1]}. `)}${parseInlineFormatting(numberMatch[2])}
</hp:p>`;
  }

  // 일반 본문
  return `<hp:p>
  <hp:pPr>
    <hp:paraPr />
  </hp:pPr>
  ${parseInlineFormatting(trimmed)}
</hp:p>`;
}

/**
 * XML 특수문자 이스케이프
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 마크다운 텍스트 전체를 HWPX <hp:p> 요소 배열 XML로 변환
 * @param markdown 마크다운 전문
 * @returns HWPX XML 단락 문자열
 */
export function markdownToHwpxParagraphs(markdown: string): string {
  const lines = markdown.split('\n');
  const paragraphs = lines.map(lineToHwpxParagraph);
  return paragraphs.join('\n');
}

/**
 * BlockNote 에디터 블록 JSON을 마크다운으로 변환 (간이 변환기)
 */
export function blocksToMarkdown(blocks: BlockData[]): string {
  return blocks.map(block => {
    const text = block.content?.map((c: InlineContent) => {
      let t = c.text || '';
      if (c.styles?.bold) t = `**${t}**`;
      if (c.styles?.italic) t = `*${t}*`;
      return t;
    }).join('') || '';

    switch (block.type) {
      case 'heading':
        const hashes = '#'.repeat((block.props?.level as number) || 1);
        return `${hashes} ${text}`;
      case 'bulletListItem':
        return `- ${text}`;
      case 'numberedListItem':
        return `1. ${text}`;
      default:
        return text;
    }
  }).join('\n');
}

/** BlockNote 블록 데이터 타입 (간이 정의) */
export interface BlockData {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  content?: InlineContent[];
  children?: BlockData[];
}

/** 인라인 콘텐츠 타입 */
export interface InlineContent {
  type: string;
  text?: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
  };
}
