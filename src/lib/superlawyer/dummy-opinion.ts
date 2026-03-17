/**
 * AI 생성 더미 법률 의견서 데이터 (BlockNote 블록 형식)
 * 
 * 실제 AI 생성 전 PoC 단계에서 사용하는 샘플 데이터입니다.
 * BlockNote의 PartialBlock 형식을 따릅니다.
 */

export interface OpinionBlock {
  id?: string;
  type: 'heading' | 'paragraph' | 'bulletListItem' | 'numberedListItem';
  props?: Record<string, unknown>;
  content: Array<{
    type: 'text';
    text: string;
    styles?: Record<string, boolean>;
  }>;
}

export const DUMMY_OPINION_BLOCKS: OpinionBlock[] = [
  {
    type: 'heading',
    props: { level: 1 },
    content: [{ type: 'text', text: '법 률 의 견 서', styles: { bold: true } }],
  },
  {
    type: 'paragraph',
    content: [{ type: 'text', text: '' }],
  },
  {
    type: 'heading',
    props: { level: 2 },
    content: [{ type: 'text', text: 'Ⅰ. 사안의 개요', styles: { bold: true } }],
  },
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: '의뢰인 ' },
      { type: 'text', text: '홍길동', styles: { bold: true } },
      { type: 'text', text: '(이하 "의뢰인")은 2025년 6월 15일 상대방 ' },
      { type: 'text', text: '김철수', styles: { bold: true } },
      { type: 'text', text: '(이하 "상대방")와 서울특별시 강남구 소재 상가 임대차계약을 체결하였습니다. 계약 기간은 2025년 7월 1일부터 2027년 6월 30일까지 2년간이며, 보증금 5,000만 원, 월 차임 300만 원으로 약정하였습니다.' },
    ],
  },
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: '의뢰인은 계약 체결 후 적법하게 인테리어 공사를 진행하고 2025년 7월 1일부터 커피 전문점(상호: "달빛커피")을 영업하여 왔으나, 상대방은 2026년 1월 15일 "건물 재건축"을 이유로 ' },
      { type: 'text', text: '일방적으로 임대차계약 해지를 통보', styles: { bold: true } },
      { type: 'text', text: '하고, 2026년 3월 1일까지 명도를 요구하였습니다.' },
    ],
  },
  {
    type: 'paragraph',
    content: [{ type: 'text', text: '' }],
  },
  {
    type: 'heading',
    props: { level: 2 },
    content: [{ type: 'text', text: 'Ⅱ. 쟁점 분석', styles: { bold: true } }],
  },
  {
    type: 'heading',
    props: { level: 3 },
    content: [{ type: 'text', text: '1. 상가건물 임대차보호법 적용 여부' }],
  },
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: '상가건물 임대차보호법(이하 "상임법")은 보증금액이 일정 금액 이하인 상가건물 임대차에 적용됩니다. 서울특별시의 경우 환산보증금(보증금 + 월 차임 × 100)이 ' },
      { type: 'text', text: '9억 원', styles: { bold: true } },
      { type: 'text', text: ' 이하인 경우에 적용되며(동법 제2조 제1항, 시행령 제2조 제1항), 본 건의 환산보증금은 ' },
      { type: 'text', text: '3억 5,000만 원(= 5,000만 원 + 300만 원 × 100)', styles: { bold: true, italic: true } },
      { type: 'text', text: '으로 상임법의 적용 대상에 해당합니다.' },
    ],
  },
  {
    type: 'heading',
    props: { level: 3 },
    content: [{ type: 'text', text: '2. 계약갱신요구권의 행사 가능성' }],
  },
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: '상임법 제10조 제1항에 따르면 임차인은 최초 임대차기간을 포함하여 전체 ' },
      { type: 'text', text: '10년', styles: { bold: true } },
      { type: 'text', text: '의 기간 동안 계약갱신을 요구할 수 있습니다. 의뢰인은 아직 최초 계약기간(2년)도 완료되지 않은 상태이므로, 계약갱신요구권을 행사할 수 있는 상황입니다.' },
    ],
  },
  {
    type: 'paragraph',
    content: [{ type: 'text', text: '' }],
  },
  {
    type: 'heading',
    props: { level: 3 },
    content: [{ type: 'text', text: '3. 재건축을 이유로 한 갱신거절의 정당성' }],
  },
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: '상임법 제10조 제1항 제7호는 임대인이 ' },
      { type: 'text', text: '"임대목적물인 상가건물의 전부 또는 대부분을 멸실하여 임대차의 목적을 달성하지 못할 경우"', styles: { italic: true } },
      { type: 'text', text: '에 한하여 갱신을 거절할 수 있다고 규정합니다. 그러나 대법원 판례(대법원 2019다270067 판결)에 따르면, 단순히 재건축 ' },
      { type: 'text', text: '계획', styles: { italic: true } },
      { type: 'text', text: '만으로는 갱신거절의 정당한 사유에 해당하지 않으며, ' },
      { type: 'text', text: '구체적인 건축허가 취득 및 철거 일정 확정', styles: { bold: true } },
      { type: 'text', text: '이 요구됩니다.' },
    ],
  },
  {
    type: 'bulletListItem',
    content: [
      { type: 'text', text: '상대방이 건축허가를 이미 취득하였는지 여부 확인 필요' },
    ],
  },
  {
    type: 'bulletListItem',
    content: [
      { type: 'text', text: '재건축 계획이 가장(假裝)에 해당하는지 확인 필요 — 만약 실질적 재건축 의사 없이 임차인을 교체하려는 목적이라면 ' },
      { type: 'text', text: '갱신거절은 부당', styles: { bold: true } },
    ],
  },
  {
    type: 'paragraph',
    content: [{ type: 'text', text: '' }],
  },
  {
    type: 'heading',
    props: { level: 2 },
    content: [{ type: 'text', text: 'Ⅲ. 의뢰인의 권리구제 방안', styles: { bold: true } }],
  },
  {
    type: 'numberedListItem',
    content: [
      { type: 'text', text: '계약갱신요구권 행사 내용증명 발송', styles: { bold: true } },
      { type: 'text', text: ' — 상임법 제10조에 따라 임대인에게 계약갱신을 요구하는 내용증명을 발송하여 권리를 보전합니다.' },
    ],
  },
  {
    type: 'numberedListItem',
    content: [
      { type: 'text', text: '임차권존속확인 가처분 신청', styles: { bold: true } },
      { type: 'text', text: ' — 상대방이 갱신을 거절할 경우, 법원에 임차권이 존속함을 확인하는 가처분을 신청하여 임차인의 지위를 보전합니다.' },
    ],
  },
  {
    type: 'numberedListItem',
    content: [
      { type: 'text', text: '권리금 회수 기회 보호', styles: { bold: true } },
      { type: 'text', text: ' — 상임법 제10조의4에 따라 임차인은 권리금 회수 기회를 보호받을 수 있으며, 이를 방해하는 임대인은 손해배상 의무를 부담합니다(동법 제10조의5).' },
    ],
  },
  {
    type: 'paragraph',
    content: [{ type: 'text', text: '' }],
  },
  {
    type: 'heading',
    props: { level: 2 },
    content: [{ type: 'text', text: 'Ⅳ. 결론', styles: { bold: true } }],
  },
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: '상대방의 일방적 계약해지 통보는 ' },
      { type: 'text', text: '상가건물 임대차보호법에 위반되어 무효', styles: { bold: true } },
      { type: 'text', text: '일 가능성이 높습니다. 의뢰인은 계약갱신요구권을 행사하여 잔여 임대차기간을 보장받을 수 있으며, 상대방이 재건축을 실질적으로 진행하더라도 ' },
      { type: 'text', text: '권리금 회수 기회를 보호받을 권리', styles: { bold: true } },
      { type: 'text', text: '가 있습니다.' },
    ],
  },
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: '이상의 검토 의견을 제출합니다.' },
    ],
  },
];

/** 결론 텍스트 (HWPX 메타데이터 용) */
export const DUMMY_CONCLUSION = '상대방의 일방적 계약해지 통보는 상가건물 임대차보호법에 위반되어 무효일 가능성이 높으며, 의뢰인은 계약갱신요구권 행사 및 권리금 회수 기회 보호를 받을 수 있습니다.';

/** 더미 메타데이터 */
export const DUMMY_METADATA = {
  date: '2026.03.12',
  caseNumber: '2026-0042',
  clientName: '홍길동',
  opponentName: '김철수',
  lawyerName: '이변호사',
  firmName: '법무법인 수퍼로이어',
  caseTitle: '상가임대차 계약갱신요구권 분쟁',
  conclusion: DUMMY_CONCLUSION,
};
