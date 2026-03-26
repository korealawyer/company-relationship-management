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
 * SMS 발송
 * 실제 서버 연동 API(/api/sms/send)를 호출합니다.
 */
export async function sendSMS(params: SendSmsParams): Promise<SmsResult> {
  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  
  try {
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    const data = await res.json();
    
    // 로컬 로그 저장 (Mock UI 호환용)
    const logs: SmsLog[] = recipients.map(to => ({
      id: `sms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      to,
      message: params.message,
      type: params.type,
      sentAt: new Date().toISOString(),
      status: (res.ok && data.success) ? 'sent' : 'failed',
      caseId: params.caseId,
      templateId: params.templateId,
      senderName: params.senderName,
    }));

    if (typeof window !== 'undefined') {
      const SMS_LOG_KEY = 'ibs_sms_logs_v1';
      try {
        const existing: SmsLog[] = JSON.parse(localStorage.getItem(SMS_LOG_KEY) || '[]');
        const updated = [...logs, ...existing].slice(0, 500); 
        localStorage.setItem(SMS_LOG_KEY, JSON.stringify(updated));
      } catch { /* ignore */ }
    }

    return {
      success: res.ok && data.success,
      sentCount: res.ok ? data.sentCount : 0,
      failedCount: res.ok ? data.failedCount : recipients.length,
      logs,
    };
  } catch (error) {
    console.error('SMS Request Error:', error);
    return {
      success: false,
      sentCount: 0,
      failedCount: recipients.length,
      logs: [],
    };
  }
}
