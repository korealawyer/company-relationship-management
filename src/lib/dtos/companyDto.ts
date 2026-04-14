import type { Company } from '../types';

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
}

/**
 * DB Row(PostgREST JSON/Record)를 클라이언트의 Company 인터페이스로 변환합니다.
 * Unknown 기반 Graceful Fallback 처리를 포함합니다. (태스크 1.1)
 */
export function mapCompanyFromDB(row: Record<string, unknown>): Company {
  const anyRow = row as Record<string, any>;
  
  const baseObj: Record<string, any> = {};
  for (const [k, v] of Object.entries(anyRow)) {
    baseObj[snakeToCamel(k)] = v;
  }

  return {
    id: String(baseObj.id || ''),
    biz: String(baseObj.bizNo || ''), 
    bizType: String(baseObj.bizCategory || ''), 
    franchiseType: String(baseObj.franchiseType || ''),
    name: String(baseObj.name || ''),
    url: String(baseObj.domain || ''), 
    domain: String(baseObj.domain || ''),
    email: String(baseObj.contactEmail || ''), 
    phone: String(baseObj.contactPhone || ''), 
    ceo: String(baseObj.ceoName || ''),
    storeCount: Number(baseObj.storeCount || 0),
    status: baseObj.status as any,
    assignedLawyer: String(baseObj.assignedLawyerId || ''), 
    plan: baseObj.plan || 'none',
    createdAt: String(baseObj.createdAt || ''),
    updatedAt: String(baseObj.updatedAt || ''),
    
    // 영업 프로세스
    salesConfirmed: Boolean(baseObj.salesConfirmed),
    salesConfirmedAt: String(baseObj.salesConfirmedAt || ''),
    salesConfirmedBy: String(baseObj.salesConfirmedBy || ''),
    
    // 이메일 / 클라이언트
    emailSentAt: String(baseObj.emailSentAt || ''),
    emailSubject: String(baseObj.emailSubject || ''),
    clientReplied: Boolean(baseObj.clientReplied),
    clientRepliedAt: String(baseObj.clientRepliedAt || ''),
    clientReplyNote: String(baseObj.clientReplyNote || ''),
    
    // 통화 / 로그인
    loginCount: Number(baseObj.loginCount || 0),
    callNote: String(baseObj.callNote || ''),
    
    // AI 자동화 메타
    autoMode: Boolean(baseObj.autoMode ?? true),
    aiDraftReady: Boolean(baseObj.aiDraftReady),
    source: String(baseObj.source || 'manual') as any,
    customScript: baseObj.customScript,
    lawyerNote: String(baseObj.lawyerNote || ''),
    
    // 리드 통합 필드
    riskScore: Number(baseObj.riskScore || 0),
    riskLevel: String(baseObj.riskLevel || '') as any,
    issueCount: Number(baseObj.issueCount || 0),
    privacyUrl: String(baseObj.privacyUrl || ''),
    contactName: String(baseObj.contactName || ''),
    contactEmail: String(baseObj.contactEmail || ''),
    contactPhone: String(baseObj.contactPhone || ''),
    
    // 계약
    contractSentAt: baseObj.contractSentAt,
    contractSignedAt: baseObj.contractSignedAt,
    contractMethod: baseObj.contractMethod,
    contractNote: baseObj.contractNote,
    
    // 자동화 추적
    callbackScheduledAt: baseObj.callbackScheduledAt,
    followUpStep: baseObj.followUpStep,
    aiMemoSummary: baseObj.aiMemoSummary,
    aiNextAction: baseObj.aiNextAction,
    aiNextActionType: baseObj.aiNextActionType,
    lastCallResult: baseObj.lastCallResult,
    lastCallAt: baseObj.lastCallAt,
    callAttempts: Number(baseObj.callAttempts || 0),
    
    lawyerConfirmed: Boolean(baseObj.lawyerConfirmed),
    lawyerConfirmedAt: String(baseObj.lawyerConfirmedAt || ''),
    
    // 서브 릴레이션 데이터 (안전한 빈 배열 폴백)
    issues: baseObj.issues || [],
    contacts: baseObj.companyContacts || [],
    memos: baseObj.companyMemos || [],
    timeline: baseObj.companyTimeline || [],
  };
}

/**
 * 프론트엔드의 Company 또는 Partial 업데이트 페이로드를 받아 DB에 삽입/수정할 객체로 변환.
 * 데이터 입출력 방파제 결합 (Write-Hole 봉쇄, 태스크 1.2)
 */
export function mapCompanyToDB(data: Partial<Company>): Record<string, unknown> {
  const dbRow: Record<string, unknown> = {};

  if ('biz' in data) dbRow.biz_no = data.biz;
  if ('bizType' in data) dbRow.biz_category = data.bizType;
  if ('url' in data) dbRow.domain = data.url;
  if ('domain' in data) dbRow.domain = data.domain;
  
  if ('email' in data) dbRow.contact_email = data.email;
  if ('phone' in data) dbRow.contact_phone = data.phone;
  if ('contactEmail' in data) dbRow.contact_email = data.contactEmail;
  if ('contactPhone' in data) dbRow.contact_phone = data.contactPhone;
  if ('contactName' in data) dbRow.contact_name = data.contactName;

  if ('assignedLawyer' in data) dbRow.assigned_lawyer_id = data.assignedLawyer;

  // 하위 릴레이션 등을 통째로 덮어씌워서 DB 에러가 나는 것(Write-Hole) 방지
  const EXCLUDED_FIELDS = [
    'issues', 'contacts', 'memos', 'timeline', 'lawyerProfile', 
    'biz', 'bizType', 'url', 'email', 'phone', 'assignedLawyer', 'id'
  ];

  for (const [k, v] of Object.entries(data)) {
    if (EXCLUDED_FIELDS.includes(k)) continue;
    dbRow[camelToSnake(k)] = v;
  }

  return dbRow;
}
