// ── 한국 법률 문서 구조화 데이터 파서 ────────────────────
// 정규식 기반으로 당사자, 날짜, 금액, 사건번호, 핵심문구를 추출

import type { OcrResult } from './ocrService';

/**
 * 추출된 텍스트에서 법률 관련 구조화 데이터를 파싱한다.
 * (당사자, 날짜, 금액, 사건번호 등)
 */
export function parseLegalEntities(text: string): OcrResult['structuredData'] {
  return {
    parties: extractParties(text),
    dates: extractDates(text),
    amounts: extractAmounts(text),
    caseNumbers: extractCaseNumbers(text),
    keyPhrases: extractKeyPhrases(text),
    tables: undefined,
  };
}

// ── 당사자 추출 ──────────────────────────────────────────

function extractParties(text: string): string[] {
  const parties = new Set<string>();

  // 패턴: "원고 홍길동", "피고 주식회사 OOO", "신청인: 김철수" 등
  const rolePatterns = [
    /(?:원\s*고|피\s*고|신청인|피신청인|채권자|채무자|고소인|피고소인|항소인|피항소인|상고인|피상고인)\s*[:：]?\s*([\uAC00-\uD7AF\s()\uff08\uff09]{2,20})/g,
  ];

  for (const pattern of rolePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim().replace(/\s+/g, ' ');
      if (name.length >= 2 && name.length <= 30) {
        parties.add(name);
      }
    }
  }

  // 패턴: "(주)OOO", "주식회사 OOO"
  const companyPatterns = [
    /(?:\(주\)|주식회사|㈜|유한회사)\s*([\uAC00-\uD7AFa-zA-Z\s]{2,20})/g,
    /([\uAC00-\uD7AFa-zA-Z]{2,10})\s*(?:주식회사|유한회사)/g,
  ];

  for (const pattern of companyPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[0].trim();
      if (name.length >= 3) parties.add(name);
    }
  }

  return [...parties].slice(0, 20);
}

// ── 날짜 추출 ────────────────────────────────────────────

function extractDates(text: string): string[] {
  const dates = new Set<string>();

  // 2024년 3월 15일
  const koreanDate = /(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/g;
  let match;
  while ((match = koreanDate.exec(text)) !== null) {
    dates.add(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`);
  }

  // 2024.03.15 / 2024-03-15 / 2024/03/15
  const isoDate = /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/g;
  while ((match = isoDate.exec(text)) !== null) {
    const y = parseInt(match[1]);
    const m = parseInt(match[2]);
    const d = parseInt(match[3]);
    if (y >= 1900 && y <= 2099 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      dates.add(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
  }

  return [...dates].sort().slice(0, 30);
}

// ── 금액 추출 ────────────────────────────────────────────

function extractAmounts(text: string): string[] {
  const amounts = new Set<string>();

  // 숫자 + 원: "1,000,000원", "5000원", "금 1,234,567원"
  const numericWon = /(?:금\s*)?([\d,]+)\s*원/g;
  let match;
  while ((match = numericWon.exec(text)) !== null) {
    const raw = match[1].replace(/,/g, '');
    const num = parseInt(raw);
    if (num >= 100) {
      amounts.add(`${num.toLocaleString('ko-KR')}원`);
    }
  }

  // 한글 금액: "금 오백만원", "일억이천만원" 등
  const koreanAmount = /금?\s*([\uAC00-\uD7AF]{2,15}원)/g;
  while ((match = koreanAmount.exec(text)) !== null) {
    const korNum = match[1];
    // 한글 숫자 키워드가 포함된 경우만
    if (/[만백천억조]/.test(korNum)) {
      amounts.add(korNum);
    }
  }

  return [...amounts].slice(0, 20);
}

// ── 사건번호 추출 ────────────────────────────────────────

function extractCaseNumbers(text: string): string[] {
  const caseNos = new Set<string>();

  // 한국 법원 사건번호: "2024가합12345", "2024나54321", "2024고합123" 등
  // 형식: YYYY + 접두사(가합/나/다/라/마/카/타/파/하/고합/고단 등) + 숫자
  const casePattern = /(\d{4})\s*(가합|가단|나|다|라|마|바|사|아|자|카|타|파|하|고합|고단|고정|초기|재가|재나|노|행|형제|헌가|헌나|헌마|헌바|헌사|과|관|송|공|비|스|느|머|구합|구단)\s*(\d{1,10})/g;
  let match;
  while ((match = casePattern.exec(text)) !== null) {
    caseNos.add(`${match[1]}${match[2]}${match[3]}`);
  }

  // 기타 패턴: "사건번호: 2024-12345" 등
  const genericCase = /사건\s*(?:번호)?\s*[:：]?\s*(\d{4}[\-\s]*\d{2,10})/g;
  while ((match = genericCase.exec(text)) !== null) {
    caseNos.add(match[1].replace(/\s/g, ''));
  }

  return [...caseNos].slice(0, 20);
}

// ── 핵심 법률 문구 추출 ──────────────────────────────────

const LEGAL_KEYWORDS = [
  // 소송 관련
  '손해배상', '위자료', '불법행위', '채무불이행', '이행청구', '가압류', '가처분',
  '강제집행', '확정판결', '화해', '조정', '합의', '항소', '상고', '기각', '인용',
  '각하', '취하', '변론기일', '판결선고',
  // 계약 관련
  '계약해지', '계약해제', '위약금', '손해배상청구', '채권양도', '담보제공',
  '보증금', '임대차계약', '매매계약', '근저당',
  // 가맹사업
  '가맹계약', '가맹사업', '정보공개서', '영업지역', '가맹금',
  // 개인정보
  '개인정보보호법', '개인정보처리방침', '정보주체', '개인정보처리자',
  // 형사
  '공소장', '구속영장', '보석', '형사합의', '고소장', '고발장',
  // 노동
  '근로기준법', '부당해고', '퇴직금', '최저임금', '산업재해',
  // 가사
  '이혼', '양육권', '친권', '재산분할', '위자료청구', '상속',
];

function extractKeyPhrases(text: string): string[] {
  const found = new Set<string>();

  for (const keyword of LEGAL_KEYWORDS) {
    if (text.includes(keyword)) {
      found.add(keyword);
    }
  }

  // 법령 참조 추출: "제XX조", "제XX조의X"
  const lawRef = /제\s*(\d+)\s*조(?:의\s*\d+)?(?:\s*제\s*\d+\s*항)?/g;
  let match;
  while ((match = lawRef.exec(text)) !== null) {
    found.add(match[0].replace(/\s+/g, ''));
  }

  return [...found].slice(0, 30);
}
