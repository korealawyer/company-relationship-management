// src/lib/smsService.ts — SMS/문자 발송 서비스 (Mock)
// 실제 API(예: NHN Cloud, CoolSMS) 연동 시 sendSMS() 내부만 교체

export type SmsType = 'SMS' | 'LMS' | 'MMS';
export type SmsStatus = 'sent' | 'failed' | 'pending';

export interface SmsLog {
  id: string;
  to: string;           // 수신번호
  message: string;
  type: SmsType;
  sentAt: string;
  status: SmsStatus;
  caseId?: string;
  templateId?: string;
  senderName?: string;
}

export interface SmsTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
}

export interface SendSmsParams {
  to: string | string[];    // 단일 or 다건
  message: string;
  type: SmsType;
  caseId?: string;
  templateId?: string;
  senderName?: string;
}

export interface SmsResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  logs: SmsLog[];
}

// ── 상용 문구 템플릿 ──────────────────────────────────────────
export const SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: 'tpl_date',
    name: '기일 안내',
    category: '기일안내',
    content: `[IBS 법률사무소]
안녕하세요, {clientName}님.

귀하의 사건 다음 기일을 안내드립니다.

📅 일시: {date}
🏛 법원: {court}
📋 사건번호: {caseNo}

기일 변경 시 즉시 연락 부탁드립니다.

IBS 법률사무소 02-1234-5678`,
  },
  {
    id: 'tpl_fee',
    name: '수임료 안내',
    category: '수임료안내',
    content: `[IBS 법률사무소]
안녕하세요, {clientName}님.

수임료 납부 안내드립니다.

💰 금액: {amount}원
🏦 계좌: 하나은행 123-456789-01234 (IBS법률사무소)

납부 확인 후 수임계약이 체결됩니다.

IBS 법률사무소 02-1234-5678`,
  },
  {
    id: 'tpl_overdue',
    name: '미납 안내',
    category: '미납안내',
    content: `[IBS 법률사무소]
안녕하세요, {clientName}님.

아래 수임료가 미납 상태입니다.

💰 미납 금액: {amount}원
📅 납부 기한: {dueDate}

빠른 납부 부탁드리며, 문의사항은 연락주세요.

IBS 법률사무소 02-1234-5678`,
  },
  {
    id: 'tpl_general',
    name: '일반 안내',
    category: '일반안내',
    content: `[IBS 법률사무소]
안녕하세요, {clientName}님.

{message}

IBS 법률사무소 02-1234-5678`,
  },
];

/**
 * SMS 발송 (현재 Mock)
 * 실제 구현 시 이 함수 내부만 교체하면 됩니다.
 */
export async function sendSMS(params: SendSmsParams): Promise<SmsResult> {
  // 네트워크 지연 시뮬레이션
  await new Promise(res => setTimeout(res, 500 + Math.random() * 500));

  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  const logs: SmsLog[] = [];
  let failedCount = 0;

  for (const to of recipients) {
    // 5% 확률로 실패 시뮬레이션
    const success = Math.random() > 0.05;
    const log: SmsLog = {
      id: `sms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      to,
      message: params.message,
      type: params.type,
      sentAt: new Date().toISOString(),
      status: success ? 'sent' : 'failed',
      caseId: params.caseId,
      templateId: params.templateId,
      senderName: params.senderName,
    };
    logs.push(log);
    if (!success) failedCount++;
  }

  // smsLogStore에 저장 — 동적 import 방지를 위해 직접 localStorage 사용
  if (typeof window !== 'undefined') {
    const SMS_LOG_KEY = 'ibs_sms_logs_v1';
    try {
      const existing: SmsLog[] = JSON.parse(localStorage.getItem(SMS_LOG_KEY) || '[]');
      const updated = [...logs, ...existing].slice(0, 500); // 최대 500건 유지
      localStorage.setItem(SMS_LOG_KEY, JSON.stringify(updated));
    } catch { /* ignore */ }
  }

  return {
    success: failedCount === 0,
    sentCount: recipients.length - failedCount,
    failedCount,
    logs,
  };
}
