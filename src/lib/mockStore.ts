// src/lib/mockStore.ts  v6 — Supabase Write-Through Cache
// 기존 sync 인터페이스 유지 + 백그라운드 Supabase 동기화
// IS_SUPABASE_CONFIGURED=true → 모든 save()가 Supabase에도 기록

import { getSupabase, IS_SUPABASE_CONFIGURED } from './supabase';

// ── 분리된 파일에서 타입/상수/레지스트리 re-export ────────────────
export type {
    RoleType, ModuleStatus, ModuleDefinition,
    CaseStatus, Issue, CompanyContact, CompanyMemo,
    TimelineEventType, CompanyTimelineEvent, Company,
    LitigationStatus, LitigationDeadline, LitigationCase,
    AutoSettings, AutoLog,
    DocumentCategory, DocumentStatus,
} from './types';
export {
    STATUS_LABEL, STATUS_COLOR, STATUS_TEXT, PIPELINE,
    LIT_STATUS_LABEL, LIT_STATUS_COLOR,
    LAWYERS, SALES_REPS, LITIGATION_TYPES, COURTS,
} from './constants';
export {
    MODULE_REGISTRY,
    getCurrentRole, setCurrentRole, getAccessibleModules,
} from './moduleRegistry';

// ── 내부 사용을 위한 타입 import ──────────────────────────────────
import type {
    CaseStatus, Issue, Company, LitigationCase,
    CompanyTimelineEvent, LitigationDeadline,
    AutoSettings, AutoLog,
    DocumentCategory, DocumentStatus,
} from './types';
import { LAWYERS } from './constants';

// ── Supabase 동기화 유틸 ──────────────────────────────────────
function snakeToCamel(s: string): string {
    return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
function camelToSnake(s: string): string {
    return s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
}
function rowToObj<T>(row: Record<string, unknown>): T {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) obj[snakeToCamel(k)] = v;
    return obj as T;
}
function objToRow(obj: Record<string, unknown>, exclude: string[] = []): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (exclude.includes(k)) continue;
        if (Array.isArray(v) || (v && typeof v === 'object' && !(v instanceof Date))) continue;
        row[camelToSnake(k)] = v;
    }
    return row;
}

// 백그라운드 Supabase upsert — fire & forget (에러 무시)
async function sbUpsert(table: string, data: Record<string, unknown>[]) {
    const sb = getSupabase();
    if (!sb || data.length === 0) return;
    try { await sb.from(table).upsert(data, { onConflict: 'id' }); }
    catch (e) { console.warn(`[SB sync] ${table} upsert failed:`, e); }
}
async function sbFetchAll<T>(table: string, orderBy = 'created_at'): Promise<T[] | null> {
    const sb = getSupabase();
    if (!sb) return null;
    try {
        const { data, error } = await sb.from(table).select('*').order(orderBy, { ascending: false });
        if (error) { console.warn(`[SB sync] ${table} fetch failed:`, error); return null; }
        return (data || []).map(r => rowToObj<T>(r as Record<string, unknown>));
    } catch { return null; }
}

// Supabase에서 주기적 동기화 (10초 TTL 캐시)
const _sbLastFetch: Record<string, number> = {};
const SB_TTL_MS = 10_000; // 10초마다 최신 데이터 fetch

function sbSyncLatest<T>(key: string, table: string, localKey: string, defaults: T[]): void {
    if (!IS_SUPABASE_CONFIGURED || typeof window === 'undefined') return;
    const now = Date.now();
    if (_sbLastFetch[key] && now - _sbLastFetch[key] < SB_TTL_MS) return; // TTL 내 → skip
    _sbLastFetch[key] = now;

    // 비동기로 Supabase에서 최신 데이터 가져와 localStorage 갱신
    sbFetchAll<T>(table).then(remote => {
        if (remote && remote.length > 0) {
            const currentLocal = localStorage.getItem(localKey);
            const remoteJson = JSON.stringify(remote);
            if (currentLocal !== remoteJson) {
                localStorage.setItem(localKey, remoteJson);
                // 커스텀 이벤트 → React 컴포넌트가 re-render
                window.dispatchEvent(new CustomEvent('supabase-sync', { detail: { key } }));
                console.log(`[SB sync] ${table}: ${remote.length}건 동기화 완료`);
            }
        } else if (remote && remote.length === 0) {
            // Supabase 비어있으면 로컬 → Supabase 시드
            const local: T[] = (() => {
                try { return JSON.parse(localStorage.getItem(localKey) || 'null') || defaults; } catch { return defaults; }
            })();
            if (local.length > 0) {
                const rows = local.map(item => objToRow(item as Record<string, unknown>));
                sbUpsert(table, rows);
            }
        }
    });
}

// useSupabaseAutoRefresh React hook — 컴포넌트에서 실시간 갱신
// 사용법: const [refreshKey] = useSupabaseAutoRefresh();
// useEffect의 dependency에 refreshKey 넣으면 Supabase 데이터 변경 시 자동 re-render
export function useSupabaseAutoRefresh(): [number] {
    // 서버사이드에서는 기본값 반환
    if (typeof window === 'undefined') return [0];

    // 이 함수는 React의 useState/useEffect를 사용할 수 없으므로
    // 각 페이지에서 직접 이벤트 리스너를 셋업해야 합니다.
    // 대안: 간단한 polling 패턴
    return [0];
}

// 페이지에서 사용할 수 있는 동기화 트리거 함수
export function triggerSync() {
    if (typeof window === 'undefined') return;
    // 모든 store의 TTL 캐시를 리셋하여 즉시 Supabase에서 다시 fetch
    Object.keys(_sbLastFetch).forEach(k => { _sbLastFetch[k] = 0; });
}

// ── 역할/모듈레지스트리는 src/lib/moduleRegistry.ts로 분리됨 ──────
// (위의 re-export 선언으로 외부 호환성 유지)



// ── 타입들은 src/lib/types.ts로 분리됨 ───────────────────────────
// (위의 re-export 선언으로 외부 호환성 유지)

// ── AI 초안 생성 (GPT-4o Mock) ───────────────────────────────
const AI_DRAFTS: Record<string, string> = {
    i1: `제1조 (수집하는 개인정보 항목)
회사는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.
• 필수항목: 성명, 연락처(휴대폰번호), 사업자등록번호, 이메일 주소
• 선택항목: 직함, 팀명
• 자동수집: 접속 IP, 쿠키, 서비스 이용기록

[AI 생성 초안 — 변호사 검토 필요]`,
    i2: `제5조 (개인정보의 제3자 제공)
회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
다만, 아래의 경우에는 예외로 합니다.
1. 이용자가 사전에 동의한 경우
2. 법령의 규정에 의거하거나 수사기관의 요청이 있는 경우

파트너사 마케팅 목적의 정보 제공은 별도 동의 절차를 거칩니다.

[AI 생성 초안 — 변호사 검토 필요]`,
    i3: `제6조 (개인정보의 보유 및 이용기간)
회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를
지체 없이 파기합니다.

• 계약 또는 청약철회 등에 관한 기록: 5년
• 소비자 불만 또는 분쟁처리에 관한 기록: 3년
• 서비스 이용기록, 접속로그: 1년

[AI 생성 초안 — 변호사 검토 필요]`,
    i4: `제9조 (정보주체의 권리·의무 및 그 행사방법)
이용자는 회사에 대해 언제든지 다음 각 호의 권리를 행사할 수 있습니다.
1. 개인정보 열람 요구
2. 오류 등이 있을 경우 정정 요구
3. 삭제 요구
4. 처리정지 요구

문의: 개인정보보호 담당자 privacy@ibslaw.co.kr

[AI 생성 초안 — 변호사 검토 필요]`,
};

const BASE_ISSUES: Issue[] = [
    {
        id: 'i1', level: 'HIGH', law: '개인정보 보호법 제30조 제1항 제1호',
        title: '수집 항목 법정 기재 누락',
        originalText: '(현재 처리방침에 수집 항목 명시 없음)\n이름·연락처·사업자번호 등 수집하나 처리방침에 기재 없음.',
        riskDesc: '수집하는 개인정보 항목 미기재. 과태료 최대 3,000만원.',
        customDraft: AI_DRAFTS.i1, lawyerNote: '', reviewChecked: false, aiDraftGenerated: true,
    },
    {
        id: 'i2', level: 'HIGH', law: '개인정보 보호법 제17조 제2항',
        title: '제3자 제공 동의 절차 부재',
        originalText: '파트너사 마케팅 목적으로 정보를 공유할 수 있습니다.',
        riskDesc: '별도 동의 없이 제3자 제공. 과태료 최대 5,000만원.',
        customDraft: AI_DRAFTS.i2, lawyerNote: '', reviewChecked: false, aiDraftGenerated: true,
    },
    {
        id: 'i3', level: 'MEDIUM', law: '개인정보 보호법 제30조 제1항 제3호',
        title: '보유·이용기간 불명확',
        originalText: '서비스 종료 시까지 보유합니다.',
        riskDesc: '"서비스 종료 시까지"는 불명확. 구체적 기간 필요.',
        customDraft: AI_DRAFTS.i3, lawyerNote: '', reviewChecked: false, aiDraftGenerated: true,
    },
    {
        id: 'i4', level: 'LOW', law: '개인정보 보호법 제35조·36조',
        title: '정보주체 권리 행사 방법 미기재',
        originalText: '(열람·정정·삭제 요청 방법 없음)',
        riskDesc: '열람·정정·삭제 요청 방법 미기재. 시정 권고.',
        customDraft: AI_DRAFTS.i4, lawyerNote: '', reviewChecked: false, aiDraftGenerated: true,
    },
];

function emp(p: Partial<Company>): Company {
    return {
        id: '', name: '', biz: '', url: '', email: '', phone: '',
        storeCount: 0, status: 'pending', assignedLawyer: '', issues: [],
        salesConfirmed: false, salesConfirmedAt: '', salesConfirmedBy: 'AI 자동',
        lawyerConfirmed: false, lawyerConfirmedAt: '',
        emailSentAt: '', emailSubject: '',
        clientReplied: false, clientRepliedAt: '', clientReplyNote: '',
        loginCount: 0, callNote: '', plan: 'none',
        autoMode: true, aiDraftReady: false, source: 'crawler',
        createdAt: '', updatedAt: '',
        // 리드 통합 필드 기본값
        riskScore: 0, riskLevel: '', issueCount: 0, bizType: '',
        domain: '', privacyUrl: '',
        contactName: '', contactEmail: '', contactPhone: '',
        contacts: [], memos: [], timeline: [],
        ...p,
    };
}

const CASE_KEY = 'ibs_store_v4';
const LIT_KEY = 'ibs_lit_v1';
const AUTO_KEY = 'ibs_auto_settings';

// ── 기본 데이터 ──────────────────────────────────────────────
const DEFAULT_COMPANIES: Company[] = [
    emp({
        id: 'c1', name: '(주)놀부NBG', biz: '123-45-67890',
        url: 'https://nolboo.co.kr', email: 'legal@nolboo.co.kr', phone: '02-1234-5678',
        storeCount: 420, status: 'lawyer_confirmed', assignedLawyer: '김수현 변호사',
        issues: BASE_ISSUES.map(i => ({ ...i })),
        salesConfirmed: true, salesConfirmedAt: '2026-02-27 09:30', salesConfirmedBy: 'AI 자동',
        callNote: '대표이사 직접 통화. 이슈 공감. 이메일 요청.',
        aiDraftReady: true, createdAt: '2026-02-25', updatedAt: '2026-02-27',
        contactName: '김태호', contactEmail: 'thkim@nolboo.co.kr', contactPhone: '010-9876-5432',
        riskScore: 75, riskLevel: 'HIGH', issueCount: 4, bizType: '외식/프랜차이즈',
    }),
    emp({
        id: 'c2', name: '(주)교촌에프앤비', biz: '234-56-78901',
        url: 'https://kyochon.com', email: 'cs@kyochon.com', phone: '02-2345-6789',
        storeCount: 1200, status: 'analyzed',
        issues: BASE_ISSUES.slice(0, 2).map(i => ({ ...i })),
        aiDraftReady: true, createdAt: '2026-02-26', updatedAt: '2026-02-26',
        contactName: '이수진', contactEmail: 'sjlee@kyochon.com', contactPhone: '010-3456-7890',
        riskScore: 45, riskLevel: 'MEDIUM', issueCount: 2, bizType: '외식/프랜차이즈',
    }),
    emp({
        id: 'c3', name: '(주)파리바게뜨', biz: '345-67-89012',
        url: 'https://paris.co.kr', email: 'info@paris.co.kr', phone: '02-3456-7890',
        storeCount: 3500, status: 'reviewing', assignedLawyer: '이지원 변호사',
        issues: BASE_ISSUES.map(i => ({ ...i })),
        salesConfirmed: true, salesConfirmedAt: '2026-02-26 14:00', salesConfirmedBy: 'AI 자동',
        callNote: '법무팀 담당자 연결됨.',
        aiDraftReady: true, createdAt: '2026-02-24', updatedAt: '2026-02-27',
    }),
    emp({
        id: 'c4', name: '(주)bhc치킨', biz: '456-78-90123',
        url: 'https://bhc.co.kr', email: 'legal@bhc.co.kr', phone: '02-4567-8901',
        storeCount: 1800, status: 'lawyer_confirmed', assignedLawyer: '김수현 변호사',
        issues: BASE_ISSUES.map(i => ({ ...i, reviewChecked: true })),
        salesConfirmed: true, salesConfirmedAt: '2026-02-20 10:00', salesConfirmedBy: 'AI 자동',
        lawyerConfirmed: true, lawyerConfirmedAt: '2026-02-27 16:30',
        callNote: '구독 긍정적.',
        aiDraftReady: true, createdAt: '2026-02-19', updatedAt: '2026-02-27',
        contactName: '박정호', contactEmail: 'jhpark@bhc.co.kr', contactPhone: '010-5678-1234',
        riskScore: 80, riskLevel: 'HIGH', issueCount: 4, bizType: '외식/프랜차이즈',
    }),
    emp({
        id: 'c5', name: '(주)본죽', biz: '567-89-01234',
        url: 'https://bonjuk.co.kr', email: 'info@bonjuk.co.kr', phone: '02-5678-9012',
        storeCount: 1100, status: 'client_replied', assignedLawyer: '박민준 변호사',
        issues: BASE_ISSUES.map(i => ({ ...i, reviewChecked: true })),
        salesConfirmed: true, salesConfirmedAt: '2026-02-21', salesConfirmedBy: 'AI 자동',
        lawyerConfirmed: true, lawyerConfirmedAt: '2026-02-23 11:00',
        emailSentAt: '2026-02-24 09:00 (자동발송)',
        clientReplied: true, clientRepliedAt: '2026-02-25 14:22',
        clientReplyNote: '검토 감사합니다. 구독 상담을 원합니다.',
        aiDraftReady: true, createdAt: '2026-02-20', updatedAt: '2026-02-25',
        contactName: '최영미', contactEmail: 'ymchoi@bonjuk.co.kr', contactPhone: '010-7890-4567',
        riskScore: 65, riskLevel: 'HIGH', issueCount: 4, bizType: '외식/프랜차이즈',
    }),
    emp({
        id: 'c6', name: '(주)BBQ', biz: '678-90-12345',
        url: 'https://bbq.co.kr', email: 'cs@bbq.co.kr', phone: '02-6789-0123',
        storeCount: 2100, status: 'crawling', source: 'crawler',
        createdAt: '2026-02-28', updatedAt: '2026-02-28',
    }),
    emp({
        id: 'c7', name: '(주)맘스터치', biz: '789-01-23456',
        url: 'https://momstouch.co.kr', email: 'cs@momstouch.co.kr', phone: '02-7890-1234',
        storeCount: 1500, status: 'subscribed', plan: 'standard', assignedLawyer: '김수현 변호사',
        salesConfirmed: true, salesConfirmedAt: '2026-02-15', salesConfirmedBy: 'AI 자동',
        lawyerConfirmed: true, lawyerConfirmedAt: '2026-02-17 14:00',
        emailSentAt: '2026-02-18 09:00 (자동발송)',
        clientReplied: true, clientRepliedAt: '2026-02-19 11:30',
        clientReplyNote: '계약서 검토 후 구독 진행.',
        aiDraftReady: true, createdAt: '2026-02-14', updatedAt: '2026-02-22',
    }),
    // ── 계약완료 샘플 (전화영업 후속 관리용) ──────────────────
    emp({
        id: 'c8', name: '(주)이디야커피', biz: '890-12-34567',
        url: 'https://ediya.com', email: 'legal@ediya.com', phone: '02-8901-2345',
        storeCount: 3200, status: 'contract_signed', assignedLawyer: '이지원 변호사',
        issues: BASE_ISSUES.map(i => ({ ...i, reviewChecked: true })),
        salesConfirmed: true, salesConfirmedAt: '2026-03-01 10:00', salesConfirmedBy: 'AI 자동',
        lawyerConfirmed: true, lawyerConfirmedAt: '2026-03-03 14:30',
        emailSentAt: '2026-03-04 09:00 (자동발송)',
        clientReplied: true, clientRepliedAt: '2026-03-05 11:00',
        clientReplyNote: '계약 진행 의사 확인. 담당 법무팀 이메일 수신.',
        contractSentAt: '2026-03-06 10:00',
        contractSignedAt: '2026-03-10 15:22',
        contractMethod: 'email',
        contractNote: '전자서명 완료. 온보딩 이메일 발송됨.',
        callNote: '대표이사 직접 확인. 법무팀 담당자 배동현 부장. 계약 체결 완료 — 온보딩 일정 조율 필요.',
        aiMemoSummary: '계약 서명 완료. 구독 전환 및 법률팀 온보딩 세션 예약 요청.',
        aiNextAction: '온보딩 일정 확정 후 Welcome 콜 진행',
        aiNextActionType: 'call',
        aiDraftReady: true, createdAt: '2026-02-28', updatedAt: '2026-03-10',
        contactName: '배동현', contactEmail: 'dhbae@ediya.com', contactPhone: '010-2345-6789',
        riskScore: 82, riskLevel: 'HIGH', issueCount: 4, bizType: '외식/프랜차이즈',
        lastCallResult: 'connected', lastCallAt: '2026-03-09T10:00:00.000Z', callAttempts: 3,
    }),
    emp({
        id: 'c9', name: '(주)메가MGC커피', biz: '901-23-45678',
        url: 'https://megacoffee.com', email: 'cs@megacoffee.com', phone: '02-9012-3456',
        storeCount: 2800, status: 'contract_signed', assignedLawyer: '박민준 변호사',
        issues: BASE_ISSUES.slice(0, 3).map(i => ({ ...i, reviewChecked: true })),
        salesConfirmed: true, salesConfirmedAt: '2026-03-05 09:30', salesConfirmedBy: 'AI 자동',
        lawyerConfirmed: true, lawyerConfirmedAt: '2026-03-07 11:00',
        emailSentAt: '2026-03-08 09:00 (자동발송)',
        clientReplied: true, clientRepliedAt: '2026-03-10 14:00',
        clientReplyNote: '법무팀 검토 완료. 계약서 서명 원함.',
        contractSentAt: '2026-03-11 10:00',
        contractSignedAt: '2026-03-14 16:47',
        contractMethod: 'system',
        contractNote: 'DocuSign 전자서명 완료. 스탠다드 플랜 선택.',
        callNote: '법무담당 임수현 과장. 가맹점 개인정보처리방침 일괄 점검 희망. 서명 완료 후 팀장 결재 통과.',
        aiMemoSummary: '계약 완료. 전 가맹점(2,800개) 동시 점검 요청 — 가맹본부 통합 처리 방식 협의 필요.',
        aiNextAction: '가맹점 통합 점검 미팅 일정 조율',
        aiNextActionType: 'meeting',
        aiDraftReady: true, createdAt: '2026-03-04', updatedAt: '2026-03-14',
        contactName: '임수현', contactEmail: 'shim@megacoffee.com', contactPhone: '010-3456-7891',
        riskScore: 71, riskLevel: 'HIGH', issueCount: 3, bizType: '외식/프랜차이즈',
        lastCallResult: 'connected', lastCallAt: '2026-03-13T14:00:00.000Z', callAttempts: 2,
    }),
    emp({
        id: 'c10', name: '(주)써브웨이코리아', biz: '012-34-56789',
        url: 'https://subway.co.kr', email: 'legal@subway.co.kr', phone: '02-0123-4567',
        storeCount: 650, status: 'contract_sent', assignedLawyer: '김수현 변호사',
        issues: BASE_ISSUES.map(i => ({ ...i, reviewChecked: true })),
        salesConfirmed: true, salesConfirmedAt: '2026-03-10 09:00', salesConfirmedBy: 'AI 자동',
        lawyerConfirmed: true, lawyerConfirmedAt: '2026-03-12 16:00',
        emailSentAt: '2026-03-13 09:00 (자동발송)',
        clientReplied: true, clientRepliedAt: '2026-03-15 10:30',
        clientReplyNote: '계약서 검토 중. 법무팀 내부 결재 진행.',
        contractSentAt: '2026-03-16 11:00',
        contractMethod: 'email',
        contractNote: '이메일로 계약서 발송 완료. 서명 대기 중.',
        callNote: '법무팀장 강민서. 내부 결재 라인 3단계 필요. 이번 주 내 서명 예정이라고 함.',
        aiMemoSummary: '계약서 발송 후 내부 결재 대기 중. D+5일 리마인드 전화 필요.',
        aiNextAction: '3/21까지 서명 여부 리마인드 콜',
        aiNextActionType: 'call',
        aiDraftReady: true, createdAt: '2026-03-09', updatedAt: '2026-03-16',
        contactName: '강민서', contactEmail: 'mskang@subway.co.kr', contactPhone: '010-4567-8902',
        riskScore: 68, riskLevel: 'HIGH', issueCount: 4, bizType: '외식/프랜차이즈',
        lastCallResult: 'connected', lastCallAt: '2026-03-16T09:30:00.000Z', callAttempts: 4,
    }),
];

const DEFAULT_LIT: LitigationCase[] = [
    {
        id: 'l1', companyId: 'c3', companyName: '(주)파리바게뜨',
        caseNo: '2026가합12345', court: '서울중앙지방법원',
        type: '개인정보 손해배상', opponent: '前 가맹점주 김○○',
        claimAmount: 50000000, status: 'hearing',
        assignedLawyer: '이지원 변호사',
        deadlines: [
            { id: 'd1', label: '소장 접수', dueDate: '2026-02-01', completed: true, completedAt: '2026-02-01' },
            { id: 'd2', label: '1차 준비서면 제출', dueDate: '2026-03-15', completed: false, completedAt: '' },
            { id: 'd3', label: '1차 변론기일', dueDate: '2026-04-08', completed: false, completedAt: '' },
        ],
        notes: '가맹점주가 개인정보 유출 주장. 내부 감사 결과 유출 없음 확인.',
        result: '', resultNote: '',
        notificationSettings: { notifyEmail: true, notifyKakao: false, frequency: 'immediate' },
        createdAt: '2026-02-01', updatedAt: '2026-02-28',
    },
    {
        id: 'l2', companyId: 'c7', companyName: '(주)맘스터치',
        caseNo: '2025가합99001', court: '수원지방법원',
        type: '가맹계약 분쟁', opponent: '맘스터치 가맹점 연합회',
        claimAmount: 200000000, status: 'settlement',
        assignedLawyer: '김수현 변호사',
        deadlines: [
            { id: 'd4', label: '소장 접수', dueDate: '2025-12-10', completed: true, completedAt: '2025-12-10' },
            { id: 'd5', label: '조정 기일', dueDate: '2026-03-05', completed: false, completedAt: '' },
        ],
        notes: '가맹계약서 내 개인정보 조항 미비로 인한 분쟁. 합의 진행 중.',
        result: '', resultNote: '',
        notificationSettings: { notifyEmail: true, notifyKakao: true, frequency: 'weekly' },
        createdAt: '2025-12-10', updatedAt: '2026-02-28',
    },
];

// ── AutoSettings/AutoLog는 src/lib/types.ts로 분리됨 ────────────
// (위의 re-export 선언으로 외부 호환성 유지)

const DEFAULT_AUTO: AutoSettings = {
    autoSalesConfirm: true,
    autoAssignLawyer: true,
    autoGenerateDraft: true,
    autoSendEmail: true,
    autoDeadlineAlert: true,
    autoMonthlyBilling: true,
    autoOverdueReminder: true,
    autoSatisfactionSurvey: true,
    autoAiMemoSummary: true,
    lawyerRoundRobin: 0,
    updatedAt: '',
    updatedBy: '시스템',
};

function loadAuto(): AutoSettings {
    if (typeof window === 'undefined') return DEFAULT_AUTO;
    try { return { ...DEFAULT_AUTO, ...JSON.parse(localStorage.getItem(AUTO_KEY) || 'null') }; } catch { return DEFAULT_AUTO; }
}
function saveAuto(s: AutoSettings) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(AUTO_KEY, JSON.stringify(s));
        if (IS_SUPABASE_CONFIGURED) {
            const row = objToRow(s as unknown as Record<string, unknown>);
            sbUpsert('auto_settings', [{ ...row, id: 'default' }]);
        }
    }
}

const LOG_KEY = 'ibs_auto_logs';
const MAX_LOGS = 50;

function loadLogs(): AutoLog[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; }
}
export function addLog(log: Omit<AutoLog, 'id' | 'at'>) {
    if (typeof window === 'undefined') return;
    const logs = loadLogs();
    logs.unshift({
        ...log,
        id: `log${Date.now()}`,
        at: new Date().toLocaleString('ko-KR', { hour12: false }),
    });
    if (logs.length > MAX_LOGS) logs.pop();
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
}

function load(): Company[] {
    if (typeof window === 'undefined') return DEFAULT_COMPANIES;
    // Supabase에서 최신 데이터 동기화 (10초 TTL)
    sbSyncLatest<Company>('companies', 'companies', CASE_KEY, DEFAULT_COMPANIES);
    try {
        const raw = localStorage.getItem(CASE_KEY);
        if (!raw) { localStorage.setItem(CASE_KEY, JSON.stringify(DEFAULT_COMPANIES)); return DEFAULT_COMPANIES; }
        return JSON.parse(raw);
    } catch { return DEFAULT_COMPANIES; }
}
function save(cs: Company[]) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(CASE_KEY, JSON.stringify(cs));
        // 백그라운드 Supabase 동기화
        if (IS_SUPABASE_CONFIGURED) {
            const exclude = ['issues', 'contacts', 'memos', 'timeline', 'customScript'];
            const rows = cs.map(c => objToRow(c as unknown as Record<string, unknown>, exclude));
            sbUpsert('companies', rows);
        }
    }
}

function loadLit(): LitigationCase[] {
    if (typeof window === 'undefined') return DEFAULT_LIT;
    sbSyncLatest<LitigationCase>('litigation', 'litigation_cases', LIT_KEY, DEFAULT_LIT);
    try {
        const raw = localStorage.getItem(LIT_KEY);
        if (!raw) { localStorage.setItem(LIT_KEY, JSON.stringify(DEFAULT_LIT)); return DEFAULT_LIT; }
        return JSON.parse(raw);
    } catch { return DEFAULT_LIT; }
}
function saveLit(cs: LitigationCase[]) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(LIT_KEY, JSON.stringify(cs));
        if (IS_SUPABASE_CONFIGURED) {
            const exclude = ['deadlines'];
            const rows = cs.map(c => objToRow(c as unknown as Record<string, unknown>, exclude));
            sbUpsert('litigation_cases', rows);
        }
    }
}

// ── 자동화 파이프라인 ─────────────────────────────────────────
// 재귀 setTimeout → async Promise 체이닝 (메모리 누수 제거, 명시적 종료 조건)
async function runAutoPipeline(companyId: string): Promise<void> {
    const delay = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

    // Step 1: 변호사 자동 배정 (분석완료 → 항상 라운드로빈)
    await delay(500);
    {
        const s = loadAuto();
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c && c.status === 'analyzed' && !c.assignedLawyer) {
            const lawyer = LAWYERS[s.lawyerRoundRobin % LAWYERS.length];
            s.lawyerRoundRobin = (s.lawyerRoundRobin + 1) % LAWYERS.length;
            saveAuto(s);
            c.assignedLawyer = lawyer;
            c.status = 'assigned';
            c.salesConfirmed = true;
            c.salesConfirmedAt = new Date().toLocaleString('ko-KR', { hour12: false });
            c.salesConfirmedBy = 'AI 자동';
            c.updatedAt = new Date().toISOString();
            save(all);
            addLog({ type: 'auto_assign', label: '변호사 자동 배정', companyName: c.name, detail: `분석완료 → 라운드로빈 → ${lawyer} 자동 배정 완료` });
        }
    }

    // Step 3: 변호사 컨펌 후 자동 이메일 발송
    await delay(800);
    {
        const settings = loadAuto();
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c && c.status === 'lawyer_confirmed' && settings.autoSendEmail && !c.emailSentAt) {
            const now = new Date().toLocaleString('ko-KR', { hour12: false });
            c.status = 'emailed';
            c.emailSentAt = `${now} (자동발송)`;
            c.emailSubject = `[IBS 법률사무소] ${c.name} 개인정보처리방침 법률 검토 결과`;
            c.updatedAt = new Date().toISOString();
            save(all);
            addLog({ type: 'auto_email', label: '이메일 자동 발송', companyName: c.name, detail: `변호사 컨펌 → ${c.email}로 자동 발송 완료` });
        }
    }
}

export const store = {
    getAll(): Company[] { return load(); },
    getById(id: string): Company | undefined { return load().find(c => c.id === id); },
    getAutoSettings(): AutoSettings { return loadAuto(); },
    getLogs(): AutoLog[] { return loadLogs(); },
    clearLogs(): void { if (typeof window !== 'undefined') localStorage.removeItem(LOG_KEY); },

    updateAutoSettings(patch: Partial<AutoSettings>, changedBy = '영업팀'): AutoSettings {
        const prev = loadAuto();
        const s = { ...prev, ...patch, updatedAt: new Date().toLocaleString('ko-KR', { hour12: false }), updatedBy: changedBy };
        saveAuto(s);
        // 변경된 항목들 로그 기록
        const LABELS: Record<string, string> = {
            autoSalesConfirm: '영업 자동 컨펌',
            autoAssignLawyer: '변호사 자동 배정',
            autoGenerateDraft: 'AI 초안 자동생성',
            autoSendEmail: '이메일 자동 발송',
        };
        (Object.keys(patch) as (keyof AutoSettings)[]).forEach(key => {
            if (key in LABELS && patch[key] !== prev[key]) {
                addLog({
                    type: 'setting_change',
                    label: `설정 변경: ${LABELS[key]}`,
                    detail: `${changedBy}가 설정 변경`,
                    prevValue: prev[key] ? '🟢 ON' : '🔴 OFF',
                    newValue: patch[key] ? '🟢 ON' : '🔴 OFF',
                });
            }
        });
        return s;
    },

    update(id: string, patch: Partial<Company>): Company[] {
        const all = load();
        const idx = all.findIndex(c => c.id === id);
        if (idx >= 0) all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
        save(all); return all;
    },

    updateIssue(companyId: string, issueId: string, patch: Partial<Issue>): Company[] {
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c) { const issue = c.issues.find(i => i.id === issueId); if (issue) Object.assign(issue, patch); c.updatedAt = new Date().toISOString(); }
        save(all); return all;
    },

    add(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Company[] {
        const all = load();
        const c: Company = { ...data, id: `c${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        all.unshift(c);
        save(all);
        return all;
    },

    triggerAI(companyId: string): void {
        store.update(companyId, { status: 'crawling', issues: [], aiDraftReady: false });
        const c0 = store.getById(companyId);
        addLog({ type: 'ai_analysis', label: '분석 시작', companyName: c0?.name, detail: '개인정보처리방침 자동 검토 및 이슈 분석 시작' });
        setTimeout(() => {
            const all = load();
            const c = all.find(co => co.id === companyId);
            if (c && c.status === 'crawling') {
                c.issues = BASE_ISSUES.map(i => ({ ...i }));
                c.status = 'analyzed';
                c.aiDraftReady = true;
                // 리드 통합: 리스크 점수/등급/이슈 수 자동 설정
                c.issueCount = c.issues.length;
                const highCount = c.issues.filter(i => i.level === 'HIGH').length;
                c.riskLevel = highCount >= 2 ? 'HIGH' : highCount >= 1 ? 'MEDIUM' : 'LOW';
                c.riskScore = highCount * 30 + c.issues.filter(i => i.level === 'MEDIUM').length * 15 + c.issues.filter(i => i.level === 'LOW').length * 5;
                c.updatedAt = new Date().toISOString();
                save(all);
                addLog({ type: 'ai_analysis', label: 'AI 분석 완료', companyName: c.name, detail: `이슈 ${c.issues.length}건 발견, AI 수정문구 초안 자동 생성 완료` });
                runAutoPipeline(companyId);
            }
        }, 3000);
    },

    /** @deprecated sales_confirmed 단계 삭제됨. analyzed → 바로 변호사배정으로 전환 */
    salesConfirm(companyId: string, by: string): Company[] {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        const result = store.update(companyId, { salesConfirmed: true, salesConfirmedAt: now, salesConfirmedBy: by, status: 'assigned' });
        runAutoPipeline(companyId);
        return result;
    },

    assignLawyer(companyId: string, lawyer: string): Company[] {
        return store.update(companyId, { assignedLawyer: lawyer, status: 'assigned' });
    },

    markReviewing(companyId: string): Company[] {
        const c = store.getById(companyId);
        if (c && c.status === 'assigned') return store.update(companyId, { status: 'reviewing' });
        return load();
    },

    lawyerConfirm(companyId: string): Company[] {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        const result = store.update(companyId, { lawyerConfirmed: true, lawyerConfirmedAt: now, status: 'lawyer_confirmed' });
        runAutoPipeline(companyId);
        return result;
    },

    // ── 리드 통합 메서드 (leadStore에서 흡수) ──
    addMemo(companyId: string, memo: { author: string; content: string }): Company[] {
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c) {
            if (!c.memos) c.memos = [];
            c.memos.push({ id: `m${Date.now()}`, createdAt: new Date().toISOString(), ...memo });
            c.updatedAt = new Date().toISOString();
        }
        save(all); return all;
    },

    addTimelineEvent(companyId: string, event: Omit<CompanyTimelineEvent, 'id'>): Company[] {
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c) {
            if (!c.timeline) c.timeline = [];
            c.timeline.push({ id: `t${Date.now()}`, ...event });
            c.updatedAt = new Date().toISOString();
        }
        save(all); return all;
    },

    saveScript(companyId: string, script: { call?: string; email?: string }): Company[] {
        const all = load();
        const c = all.find(x => x.id === companyId);
        if (c) {
            c.customScript = { ...c.customScript, ...script, lastEditedAt: new Date().toISOString() };
            c.updatedAt = new Date().toISOString();
        }
        save(all); return all;
    },

    sendEmail(companyId: string): Company[] {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        const c = store.getById(companyId);
        return store.update(companyId, {
            status: 'emailed',
            emailSentAt: now,
            emailSubject: `[IBS 법률사무소] ${c?.name ?? ''} 개인정보처리방침 법률 검토 결과`,
        });
    },

    markClientReplied(companyId: string, note: string): Company[] {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        return store.update(companyId, { clientReplied: true, clientRepliedAt: now, clientReplyNote: note, status: 'client_replied' });
    },

    markClientViewed(companyId: string): Company[] {
        return store.update(companyId, { status: 'client_viewed' });
    },

    sendContract(companyId: string, method: 'email' | 'system' | 'offline' = 'email', note?: string): Company[] {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        const c = store.getById(companyId);
        addLog({ type: 'auto_email', label: '계약서 발송', companyName: c?.name, detail: `계약서 ${method === 'email' ? '이메일' : method === 'system' ? '시스템' : '오프라인'} 발송` });
        return store.update(companyId, { status: 'contract_sent', contractSentAt: now, contractMethod: method, contractNote: note || '' });
    },

    signContract(companyId: string): Company[] {
        const now = new Date().toLocaleString('ko-KR', { hour12: false });
        const c = store.getById(companyId);
        addLog({ type: 'auto_confirm', label: '계약 서명 확인', companyName: c?.name, detail: '고객 계약서 서명 완료' });
        return store.update(companyId, { status: 'contract_signed', contractSignedAt: now });
    },

    subscribe(companyId: string, plan: 'starter' | 'standard' | 'premium'): Company[] {
        const result = store.update(companyId, { status: 'subscribed', plan });
        const c = store.getById(companyId);
        if (c) {
            // ── 송무팀 자동 이관 ──
            store.addLit({
                companyId: c.id,
                companyName: c.name,
                caseNo: `AUTO-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
                court: '',
                type: '개인정보 자문',
                opponent: '',
                claimAmount: 0,
                status: 'preparing',
                assignedLawyer: c.assignedLawyer || '',
                deadlines: [
                    { id: `d${Date.now()}`, label: '초기 자문 보고서 제출', dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], completed: false, completedAt: '' },
                    { id: `d${Date.now() + 1}`, label: '개인정보처리방침 수정 완료', dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], completed: false, completedAt: '' },
                ],
                notes: `구독 자동 이관. 플랜: ${plan}. 이슈 ${c.issueCount}건.`,
                result: '',
                resultNote: '',
            });
            addLog({ type: 'auto_confirm', label: '송무팀 자동 이관', companyName: c.name, detail: `구독 확정 → 송무팀에 자동 이관 (플랜: ${plan})` });
        }
        return result;
    },

    getBadge(role: 'admin' | 'employee' | 'lawyer' | 'litigation'): number {
        const all = load();
        if (role === 'lawyer') return all.filter(c => ['assigned', 'reviewing'].includes(c.status)).length;
        if (role === 'employee') return all.filter(c => c.status === 'analyzed' || c.status === 'lawyer_confirmed' || c.status === 'client_replied').length;
        if (role === 'admin') return all.filter(c => ['analyzed', 'lawyer_confirmed'].includes(c.status)).length;
        if (role === 'litigation') {
            const lits = loadLit();
            const today = new Date();
            return lits.filter(l => l.deadlines.some(d => !d.completed && new Date(d.dueDate) <= new Date(today.getTime() + 7 * 86400000))).length;
        }
        return 0;
    },

    reset(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(CASE_KEY);
        localStorage.removeItem(LIT_KEY);
        localStorage.removeItem(AUTO_KEY);
        localStorage.removeItem(LOG_KEY);
    },

    // ── 송무팀 ──
    getLitAll(): LitigationCase[] { return loadLit(); },
    getLitById(id: string): LitigationCase | undefined { return loadLit().find(l => l.id === id); },

    addLit(data: Omit<LitigationCase, 'id' | 'createdAt' | 'updatedAt' | 'notificationSettings'> & { notificationSettings?: LitigationCase['notificationSettings'] }): LitigationCase[] {
        const all = loadLit();
        const newCase = { 
            ...data, 
            id: `l${Date.now()}`, 
            notificationSettings: data.notificationSettings || { notifyEmail: true, notifyKakao: true, frequency: 'immediate' },
            createdAt: new Date().toISOString(), 
            updatedAt: new Date().toISOString() 
        };
        all.unshift(newCase);
        saveLit(all); return all;
    },

    updateLit(id: string, patch: Partial<LitigationCase>): LitigationCase[] {
        const all = loadLit();
        const idx = all.findIndex(l => l.id === id);
        if (idx >= 0) {
            const prev = all[idx];
            all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
            // P1: 사건 종결 → 만족도 설문 자동 트리거
            if (patch.status === 'closed' && prev.status !== 'closed') {
                const settings = loadAuto();
                if (settings.autoSatisfactionSurvey) {
                    addLog({
                        type: 'satisfaction_survey',
                        label: '만족도 설문 자동 발송',
                        companyName: all[idx].companyName,
                        detail: `사건 종결 → ${all[idx].companyName} 의뢰인에게 만족도 설문 이메일 발송 예약 (3일 후)`,
                        channel: '이메일',
                    });
                }
            }
            
            // 실시간 알림 전송 시뮬레이션
            if (patch.status && patch.status !== prev.status) {
                const ns = all[idx].notificationSettings;
                if (ns && (ns.notifyEmail || ns.notifyKakao) && ns.frequency === 'immediate') {
                    let channels = [];
                    if (ns.notifyEmail) channels.push('이메일');
                    if (ns.notifyKakao) channels.push('카카오톡');
                    addLog({
                        type: 'deadline_alert',
                        label: '사건 상태 업데이트 알림',
                        companyName: all[idx].companyName,
                        detail: `[맞춤형 알림 설정됨] 사건 진행 상황 변동 → ${channels.join(', ')} 즉시 발송`,
                        channel: channels.join(', '),
                    });
                }
            }
        }
        saveLit(all); return all;
    },

    updateDeadline(litId: string, deadlineId: string, patch: Partial<LitigationDeadline>): LitigationCase[] {
        const all = loadLit();
        const lit = all.find(l => l.id === litId);
        if (lit) { 
            const d = lit.deadlines.find(x => x.id === deadlineId); 
            if (d) {
                const wasCompleted = d.completed;
                Object.assign(d, patch); 
                lit.updatedAt = new Date().toISOString(); 

                if (patch.completed !== undefined && patch.completed !== wasCompleted && patch.completed) {
                    const ns = lit.notificationSettings;
                    if (ns && (ns.notifyEmail || ns.notifyKakao) && ns.frequency === 'immediate') {
                        let channels = [];
                        if (ns.notifyEmail) channels.push('이메일');
                        if (ns.notifyKakao) channels.push('카카오톡');
                        addLog({
                            type: 'deadline_alert', 
                            label: '기일/일정 완료 알림',
                            companyName: lit.companyName,
                            detail: `[맞춤형 알림 설정됨] 기일(${d.label}) 완료 처리 → ${channels.join(', ')} 즉시 발송`,
                            channel: channels.join(', '),
                        });
                    }
                }
            }
        }
        saveLit(all); return all;
    },

    closeLit(id: string, reason: string): LitigationCase[] {
        const all = loadLit();
        const idx = all.findIndex(l => l.id === id);
        if (idx >= 0) {
            all[idx] = { ...all[idx], status: 'closed', closedAt: new Date().toISOString(), closeReason: reason, updatedAt: new Date().toISOString() };
        }
        saveLit(all); return all;
    },

    restoreLit(id: string): LitigationCase[] {
        const all = loadLit();
        const idx = all.findIndex(l => l.id === id);
        if (idx >= 0) {
            all[idx] = { ...all[idx], status: 'preparing', closedAt: undefined, closeReason: undefined, updatedAt: new Date().toISOString() };
        }
        saveLit(all); return all;
    },
};

// ── 상수들은 src/lib/constants.ts로 분리됨 ──────────────────────
// (위의 re-export 선언으로 외부 호환성 유지)

// ── 문서 보관함 시스템 (E2E 동기화) ──────────────────────────────────────────
// DocumentCategory, DocumentStatus → types.ts로 분리됨 (위 re-export 참조)

export interface Document {
    id: string;
    companyId: string;
    authorRole: 'client' | 'lawyer' | 'admin';
    name: string;
    size: number;
    type: string;
    category: DocumentCategory;
    status: DocumentStatus;
    url: string;
    createdAt: string;
    isNewForClient: boolean;
    isNewForLawyer: boolean;
}

const DOC_KEY = 'ibs_documents_v1';

function loadDocs(): Document[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(DOC_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) { console.error('Failed to load documents', e); }
    return [];
}

function saveDocs(docs: Document[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DOC_KEY, JSON.stringify(docs));
    window.dispatchEvent(new CustomEvent('ibs-docs-updated'));
}

export const documentStore = {
    getAll: (): Document[] => {
        sbSyncLatest('docs', 'documents', DOC_KEY, []);
        return loadDocs();
    },
    getByCompanyId: (companyId: string): Document[] => {
        const allDocs = documentStore.getAll();
        let companyDocs = allDocs.filter(d => d.companyId === companyId);
        
        // 고객 최초 로그인 시 (또는 문서함 최초 접근 시) 개인정보처리방침 리포트 자동 생성
        const autoReportName = '개인정보보호법 기반 위험 진단 리포트 (통합본).pdf';
        const hasPrivacyReport = companyDocs.some(d => d.name === autoReportName);
        
        if (!hasPrivacyReport) {
            const autoReport: Document = {
                id: 'doc_auto_' + companyId + Math.random().toString(36).substr(2, 5),
                companyId: companyId,
                authorRole: 'lawyer',
                name: autoReportName,
                size: 2450000,
                type: 'application/pdf',
                category: '리포트',
                status: '검토 완료',
                url: '#',
                createdAt: new Date().toISOString(),
                isNewForClient: true,
                isNewForLawyer: false,
            };
            allDocs.push(autoReport);
            saveDocs(allDocs);
            companyDocs.push(autoReport);
        }
        
        return companyDocs;
    },
    upload: (doc: Omit<Document, 'id' | 'createdAt'>): Document => {
        const docs = documentStore.getAll();
        const newDoc: Document = {
            ...doc,
            id: 'doc_' + Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString()
        };
        docs.push(newDoc);
        saveDocs(docs);
        return newDoc;
    },
    updateStatus: (id: string, status: DocumentStatus) => {
        const docs = documentStore.getAll();
        const doc = docs.find(d => d.id === id);
        if (doc) {
            doc.status = status;
            saveDocs(docs);
        }
    },
    markAsReadByClient: (id: string) => {
        const docs = documentStore.getAll();
        const doc = docs.find(d => d.id === id);
        if (doc && doc.isNewForClient) {
            doc.isNewForClient = false;
            saveDocs(docs);
        }
    },
    markAsReadByLawyer: (id: string) => {
        const docs = documentStore.getAll();
        const doc = docs.find(d => d.id === id);
        let changed = false;
        if (doc && doc.isNewForLawyer) {
            doc.isNewForLawyer = false;
            changed = true;
        }
        // 변호사가 처음 열람 시, 상태가 '검토 대기'라면 '변호사 열람 완료'로 자동 변경
        if (doc && doc.status === '검토 대기') {
            doc.status = '변호사 열람 완료';
            doc.isNewForClient = true; // 클라이언트 측에 알림(NEW 뱃지)을 표시
            changed = true;
        }
        if (changed) {
            saveDocs(docs);
        }
    }
};

// ── 법률 상담 시스템 ──────────────────────────────────────────
export type ConsultCategory = '가맹계약' | '개인정보' | '형사' | '노무' | '지식재산' | '기타';
export type ConsultUrgency = 'urgent' | 'normal';
export type ConsultStatus =
    | 'submitted'    // 접수 완료
    | 'ai_analyzing' // AI 분류 중
    | 'ai_done'      // AI 1차 답변 완료
    | 'assigned'     // 변호사 배정
    | 'reviewing'    // 변호사 검토 중
    | 'answered'     // 변호사 답변 발송
    | 'callback_requested' // 콜백 요청됨
    | 'callback_done';     // 콜백 완료

export interface Consultation {
    id: string;
    companyId: string;   // 본사 ID
    companyName: string;
    branchName: string;  // 가맹점명 / 임직원 소속
    authorName: string;  // 작성자 이름
    authorRole: '가맹점주' | '임직원' | '본사직원';
    category: ConsultCategory;
    urgency: ConsultUrgency;
    title: string;
    body: string;        // 상담 내용
    aiAnswer: string;    // AI 1차 답변
    aiConfidence: number; // AI 신뢰도 0~100
    aiLaw: string[];     // AI가 참조한 법령
    lawyerAnswer: string; // 변호사 최종 답변 (편집됨)
    assignedLawyer: string;
    assignedAt: string;
    answeredAt: string;
    callbackPhone: string;
    callbackRequestedAt: string;
    callbackDoneAt: string;
    callbackNote: string;
    status: ConsultStatus;
    createdAt: string;
    updatedAt: string;
    isPrivate: boolean;  // 본사에 비공개 여부
    attachedFiles?: Document[]; // 첨부 파일
}

// AI 답변 mock 생성
function genAiAnswer(category: ConsultCategory, body: string): { answer: string; law: string[]; confidence: number } {
    const map: Record<ConsultCategory, { answer: string; law: string[] }> = {
        '가맹계약': {
            answer: `가맹사업거래의 공정화에 관한 법률(가맹사업법)에 따르면, 가맹본부는 가맹계약서를 계약 체결 14일 전에 제공해야 합니다.\n\n귀하의 질의 내용을 검토한 결과, 계약서 내 위약금 조항이 가맹사업법 시행령 제14조 기준을 초과할 가능성이 있습니다. 변호사 검토 후 구체적인 조치를 권장합니다.\n\n[AI 1차 분석 — 변호사 교차검증 후 최종 확인]`,
            law: ['가맹사업거래의 공정화에 관한 법률 제7조', '동법 시행령 제14조'],
        },
        '개인정보': {
            answer: `개인정보보호법 제29조에 따라 개인정보처리자는 안전성 확보에 필요한 기술적·관리적·물리적 조치를 취해야 합니다.\n\n귀하의 상황에서는 동의서 재수집 절차와 처리방침 개정이 우선적으로 필요해 보입니다. 위반 시 과태료가 최대 3,000만원에 달할 수 있습니다.\n\n[AI 1차 분석 — 변호사 교차검증 후 최종 확인]`,
            law: ['개인정보보호법 제29조', '동법 제30조 제1항'],
        },
        '형사': {
            answer: `형사 사안은 즉각적인 법률 전문가 상담이 필요합니다. 현재 AI 분석만으로는 형사 리스크 수준을 정확히 판단하기 어려우며, 담당 변호사의 긴급 개입이 권장됩니다.\n\n콜백을 요청하시면 익일 영업일 내 담당 변호사가 직접 연락드립니다.\n\n[AI 1차 분석 — 담당 변호사 긴급 배정 권장]`,
            law: ['형법 제347조(사기)', '형사소송법 제244조'],
        },
        '노무': {
            answer: `근로기준법 및 최저임금법에 따른 검토 결과, 근로계약서 미작성·최저임금 미달·초과근무 미지급 등이 주요 위험 요인입니다.\n\n가맹점의 경우도 가맹점주 사용자 책임이 인정될 수 있어 본사 차원의 가이드라인 정비가 필요합니다.\n\n[AI 1차 분석 — 변호사 교차검증 후 최종 확인]`,
            law: ['근로기준법 제17조', '최저임금법 제6조'],
        },
        '지식재산': {
            answer: `상표권·저작권 관련 분쟁은 상표법 및 저작권법에 따라 판단됩니다. 유사 상표 사용은 상표법 제108조 위반으로 형사처벌 대상이 될 수 있습니다.\n\n가맹계약 내 IP 사용 조항을 재검토하고, 상표 사용 허락 범위를 명확히 하는 것이 권장됩니다.\n\n[AI 1차 분석 — 변호사 교차검증 후 최종 확인]`,
            law: ['상표법 제108조', '저작권법 제136조'],
        },
        '기타': {
            answer: `귀하의 질의를 검토한 결과, 관련 법령 및 판례 분석이 필요합니다. 담당 변호사가 구체적인 사실관계를 확인 후 정확한 법적 견해를 제공해 드릴 예정입니다.\n\n48시간 내 답변을 드리겠으며, 긴급한 경우 콜백을 요청하시면 익일 영업일 내 연락드립니다.\n\n[AI 1차 분석 — 변호사 교차검증 후 최종 확인]`,
            law: ['민법 제750조(불법행위)', '상법 제1조'],
        },
    };
    const conf = category === '형사' ? 52 : category === '기타' ? 65 : Math.floor(Math.random() * 20) + 75;
    return { answer: map[category].answer, law: map[category].law, confidence: conf };
}

const CONSULT_KEY = 'ibs_consult_v1';

// 라운드로빈 배정 — AutoSettings.lawyerRoundRobin(localStorage)으로 통일 관리
// 이전의 인메모리 let _lawyerIdx 제거: 새고침 시리셋 문제 해결
function assignNextLawyer(): string {
    const s = loadAuto();
    const lawyer = LAWYERS[s.lawyerRoundRobin % LAWYERS.length];
    saveAuto({ ...s, lawyerRoundRobin: (s.lawyerRoundRobin + 1) % LAWYERS.length });
    return lawyer;
}

const DEFAULT_CONSULTATIONS: Consultation[] = [
    {
        id: 'q1', companyId: 'c1', companyName: '(주)놀부NBG', branchName: '강남1호점', authorName: '김가맹', authorRole: '가맹점주',
        category: '가맹계약', urgency: 'normal', title: '계약 갱신 거절 통보 받았습니다',
        body: '본사에서 5년 계약 만료 후 갱신 거절 공문을 받았습니다. 이게 법적으로 가능한가요? 보증금 환급도 요청했는데 묵묵부답입니다.',
        aiAnswer: genAiAnswer('가맹계약', '').answer, aiConfidence: 82, aiLaw: ['가맹사업거래의 공정화에 관한 법률 제7조', '동법 시행령 제14조'],
        lawyerAnswer: '', assignedLawyer: '이지원 변호사', assignedAt: '2026-02-28 09:00',
        answeredAt: '', callbackPhone: '', callbackRequestedAt: '', callbackDoneAt: '', callbackNote: '',
        status: 'assigned', createdAt: '2026-02-28 08:30', updatedAt: '2026-02-28 09:00', isPrivate: true,
    },
    {
        id: 'q2', companyId: 'c3', companyName: '(주)파리바게뜨', branchName: '분당판교점', authorName: '박점주', authorRole: '가맹점주',
        category: '개인정보', urgency: 'urgent', title: '개인정보보호위원회 조사 통보 받았습니다 — 긴급',
        body: '오늘 개인정보보호위원회로부터 현장조사 통보를 받았습니다. 다음주 월요일 방문 예정입니다. 어떻게 대응해야 하나요? 처리방침이 오래됐습니다.',
        aiAnswer: genAiAnswer('개인정보', '').answer, aiConfidence: 78, aiLaw: ['개인정보보호법 제29조', '동법 제30조 제1항'],
        lawyerAnswer: '', assignedLawyer: '', assignedAt: '',
        answeredAt: '', callbackPhone: '010-1234-5678', callbackRequestedAt: '2026-02-28 10:15',
        callbackDoneAt: '', callbackNote: '',
        status: 'callback_requested', createdAt: '2026-02-28 10:00', updatedAt: '2026-02-28 10:15', isPrivate: true,
    },
    {
        id: 'q3', companyId: 'c4', companyName: '(주)bhc치킨', branchName: '본사 인사팀', authorName: '이담당', authorRole: '임직원',
        category: '노무', urgency: 'normal', title: '가맹점 아르바이트 최저임금 위반 민원',
        body: '가맹점에서 알바 직원이 최저임금 위반 민원을 고용노동부에 제기했다는 연락이 왔습니다. 본사가 공동 책임을 질 수 있나요?',
        aiAnswer: genAiAnswer('노무', '').answer, aiConfidence: 79, aiLaw: ['근로기준법 제17조', '최저임금법 제6조'],
        lawyerAnswer: `귀하의 질의를 검토한 결과, 가맹본부의 사용자 책임 인정 여부는 가맹점에 대한 지배·관리 정도에 따라 판단됩니다.\n\n최근 판례(서울고법 2024나12345)에 따르면 본사가 인사·노무에 실질적 개입을 한 경우 공동사용자로 인정될 수 있습니다.\n\n**권장 조치:**\n1. 해당 가맹점 근로계약서 즉시 확인\n2. 가맹계약서 내 노무 관련 조항 점검\n3. 고용노동부 조사 전 자체감사 실시\n\n추가 상담이 필요하시면 연락주십시오.\n\n— 김수현 변호사`,
        assignedLawyer: '김수현 변호사', assignedAt: '2026-02-27 11:00',
        answeredAt: '2026-02-27 16:30', callbackPhone: '', callbackRequestedAt: '', callbackDoneAt: '', callbackNote: '',
        status: 'answered', createdAt: '2026-02-27 10:00', updatedAt: '2026-02-27 16:30', isPrivate: false,
    },
];

class ConsultStore {
    private items: Consultation[] = [];

    constructor() {
        if (typeof window === 'undefined') { this.items = [...DEFAULT_CONSULTATIONS]; return; }
        const saved = localStorage.getItem(CONSULT_KEY);
        this.items = saved ? JSON.parse(saved) : [...DEFAULT_CONSULTATIONS];
    }

    private save() {
        if (typeof window !== 'undefined') {
            localStorage.setItem(CONSULT_KEY, JSON.stringify(this.items));
            if (IS_SUPABASE_CONFIGURED) {
                const rows = this.items.map(c => objToRow(c as unknown as Record<string, unknown>, ['aiLaw']));
                sbUpsert('consultations', rows);
            }
        }
    }

    getAll(): Consultation[] { return [...this.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
    getByCompany(cid: string): Consultation[] { return this.getAll().filter(q => q.companyId === cid); }
    getById(id: string): Consultation | undefined { return this.items.find(q => q.id === id); }
    getUnassigned(): Consultation[] { return this.getAll().filter(q => q.status === 'ai_done' || q.status === 'callback_requested'); }
    getForLawyer(lawyer: string): Consultation[] { return this.getAll().filter(q => q.assignedLawyer === lawyer || q.status === 'ai_done'); }

    submit(data: {
        companyId: string; companyName: string; branchName: string;
        authorName: string; authorRole: Consultation['authorRole'];
        category: ConsultCategory; title: string; body: string;
        urgency: ConsultUrgency; callbackPhone?: string; isPrivate?: boolean;
    }): Consultation {
        const now = new Date().toLocaleString('ko-KR');
        const ai = genAiAnswer(data.category, data.body);
        const q: Consultation = {
            id: `q${Date.now()}`,
            ...data,
            aiAnswer: ai.answer, aiConfidence: ai.confidence, aiLaw: ai.law,
            lawyerAnswer: '', assignedLawyer: '', assignedAt: '',
            answeredAt: '', callbackPhone: data.callbackPhone || '',
            callbackRequestedAt: data.urgency === 'urgent' && data.callbackPhone ? now : '',
            callbackDoneAt: '', callbackNote: '',
            status: 'ai_analyzing',
            createdAt: now, updatedAt: now, isPrivate: data.isPrivate ?? true,
        };
        this.items.unshift(q);
        this.save();
        // AI 분석 시뮬레이션 (1.5초 후 자동 완료)
        setTimeout(() => {
            const idx = this.items.findIndex(x => x.id === q.id);
            if (idx >= 0) {
                this.items[idx].status = data.urgency === 'urgent' ? 'callback_requested' : 'ai_done';
                this.items[idx].updatedAt = new Date().toLocaleString('ko-KR');
                this.save();
            }
        }, 1500);
        return q;
    }

    assignLawyer(id: string, lawyer?: string): void {
        const q = this.items.find(x => x.id === id);
        if (!q) return;
        q.assignedLawyer = lawyer || assignNextLawyer();
        q.assignedAt = new Date().toLocaleString('ko-KR');
        q.status = 'assigned';
        q.updatedAt = q.assignedAt;
        this.save();
    }

    saveLawyerDraft(id: string, draft: string): void {
        const q = this.items.find(x => x.id === id);
        if (!q) return;
        q.lawyerAnswer = draft;
        q.status = 'reviewing';
        q.updatedAt = new Date().toLocaleString('ko-KR');
        this.save();
    }

    sendAnswer(id: string, answer: string): void {
        const q = this.items.find(x => x.id === id);
        if (!q) return;
        q.lawyerAnswer = answer;
        q.answeredAt = new Date().toLocaleString('ko-KR');
        q.status = 'answered';
        q.updatedAt = q.answeredAt;
        this.save();
    }

    markCallbackDone(id: string, note: string): void {
        const q = this.items.find(x => x.id === id);
        if (!q) return;
        q.callbackDoneAt = new Date().toLocaleString('ko-KR');
        q.callbackNote = note;
        q.status = 'callback_done';
        q.updatedAt = q.callbackDoneAt;
        this.save();
    }

    requestCallback(id: string, phone: string): void {
        const q = this.items.find(x => x.id === id);
        if (!q) return;
        q.callbackPhone = phone;
        q.callbackRequestedAt = new Date().toLocaleString('ko-KR');
        q.status = 'callback_requested';
        q.updatedAt = q.callbackRequestedAt;
        this.save();
    }
}

export const consultStore = new ConsultStore();

export const CONSULT_STATUS_LABEL: Record<ConsultStatus, string> = {
    submitted: '접수완료', ai_analyzing: 'AI분석중', ai_done: 'AI완료',
    assigned: '변호사배정', reviewing: '검토중', answered: '답변완료',
    callback_requested: '콜백요청', callback_done: '콜백완료',
};

export const CONSULT_CATEGORIES: ConsultCategory[] = ['가맹계약', '개인정보', '형사', '노무', '지식재산', '기타'];

// ══════════════════════════════════════════════════════════════
// ── 개인 의뢰인 소송 관리 시스템 ──────────────────────────────
// ══════════════════════════════════════════════════════════════

export interface PersonalClient {
    id: string;
    name: string;
    phone: string;
    email: string;
    birthYear: number;
    address: string;
    memo: string;
    createdAt: string;
}

export type PersonalLitStatus =
    | 'consulting'   // 상담 중
    | 'preparing'    // 소장 준비
    | 'filed'        // 접수 완료
    | 'hearing'      // 심리 중
    | 'settlement'   // 조정/합의
    | 'judgment'     // 판결 선고
    | 'appeal'       // 항소/상고
    | 'enforcing'    // 강제집행
    | 'closed';      // 종결

export type PersonalLitType =
    | '민사(손해배상)'
    | '민사(대여금)'
    | '민사(부동산)'
    | '가사(이혼)'
    | '가사(양육권)'
    | '가사(상속)'
    | '형사(피해자)'
    | '형사(피의자)'
    | '행정소송'
    | '산재/노동'
    | '채권추심'
    | '기타';

export interface PersonalLitDeadline {
    id: string;
    label: string;
    dueDate: string;
    completed: boolean;
    completedAt: string;
    isFixed?: boolean;
}

export interface PersonalLitDocument {
    id: string;
    name: string;
    type: 'complaint' | 'brief' | 'evidence' | 'court_order' | 'judgment' | 'other';
    addedAt: string;
}

export interface PersonalLitigation {
    id: string;
    clientId: string;
    clientName: string;
    caseNo: string;
    court: string;
    type: PersonalLitType;
    role: '원고' | '피고' | '고소인' | '피고소인' | '신청인' | '피신청인';
    opponent: string;
    opponentLawyer: string;
    claimAmount: number;
    status: PersonalLitStatus;
    assignedLawyer: string;
    deadlines: PersonalLitDeadline[];
    documents: PersonalLitDocument[];
    notes: string;
    result: '' | '승소' | '일부승소' | '패소' | '합의' | '취하' | '각하';
    resultNote: string;
    legalFee: number;        // 수임료
    courtFee: number;        // 인지대/송달료
    nextHearingDate: string;  // 다음 기일
    closedAt?: string;
    closeReason?: string;
    createdAt: string;
    updatedAt: string;
}

export const PERSONAL_LIT_STATUS_LABEL: Record<PersonalLitStatus, string> = {
    consulting: '상담중', preparing: '소장준비', filed: '접수완료',
    hearing: '심리중', settlement: '조정/합의', judgment: '판결선고',
    appeal: '항소/상고', enforcing: '강제집행', closed: '종결',
};

export const PERSONAL_LIT_STATUS_COLOR: Record<PersonalLitStatus, string> = {
    consulting: 'rgba(148,163,184,0.2)', preparing: 'rgba(251,191,36,0.2)',
    filed: 'rgba(59,130,246,0.2)', hearing: 'rgba(249,115,22,0.2)',
    settlement: 'rgba(167,139,250,0.2)', judgment: 'rgba(201,168,76,0.2)',
    appeal: 'rgba(236,72,153,0.2)', enforcing: 'rgba(6,182,212,0.2)',
    closed: 'rgba(74,222,128,0.15)',
};

export const PERSONAL_LIT_STATUS_TEXT: Record<PersonalLitStatus, string> = {
    consulting: '#94a3b8', preparing: '#d97706', filed: '#2563eb',
    hearing: '#ea580c', settlement: '#7c3aed', judgment: '#b8960a',
    appeal: '#db2777', enforcing: '#0891b2', closed: '#16a34a',
};

export const PERSONAL_LIT_STATUSES: PersonalLitStatus[] = [
    'consulting', 'preparing', 'filed', 'hearing', 'settlement',
    'judgment', 'appeal', 'enforcing', 'closed',
];

export const PERSONAL_LIT_TYPES: PersonalLitType[] = [
    '민사(손해배상)', '민사(대여금)', '민사(부동산)',
    '가사(이혼)', '가사(양육권)', '가사(상속)',
    '형사(피해자)', '형사(피의자)', '행정소송', '산재/노동', '채권추심', '기타',
];

const PERSONAL_KEY = 'ibs_personal_v1';
const PERSONAL_CLIENT_KEY = 'ibs_personal_clients_v1';

const DEFAULT_PERSONAL_CLIENTS: PersonalClient[] = [
    { id: 'pc1', name: '김민수', phone: '010-1234-5678', email: 'minsu@email.com', birthYear: 1985, address: '서울시 강남구 역삼동', memo: '부동산 분쟁 건으로 최초 상담', createdAt: '2025-11-10' },
    { id: 'pc2', name: '이영희', phone: '010-9876-5432', email: 'yh.lee@email.com', birthYear: 1978, address: '경기도 성남시 분당구', memo: '이혼 소송 + 양육권 분쟁', createdAt: '2025-12-05' },
    { id: 'pc3', name: '박준혁', phone: '010-5555-7777', email: 'jh.park@email.com', birthYear: 1990, address: '서울시 마포구 합정동', memo: '교통사고 손해배상 건', createdAt: '2026-01-15' },
];

const DEFAULT_PERSONAL_LITS: PersonalLitigation[] = [
    {
        id: 'pl1', clientId: 'pc1', clientName: '김민수',
        caseNo: '2025가합55001', court: '서울중앙지방법원',
        type: '민사(부동산)', role: '원고', opponent: '(주)강남건설',
        opponentLawyer: '법무법인 대륙', claimAmount: 350000000,
        status: 'hearing', assignedLawyer: '이지원 변호사',
        deadlines: [
            { id: 'pd1', label: '소장 접수', dueDate: '2025-12-01', completed: true, completedAt: '2025-11-28' },
            { id: 'pd2', label: '2차 준비서면', dueDate: '2026-03-20', completed: false, completedAt: '' },
            { id: 'pd3', label: '3차 변론기일', dueDate: '2026-04-15', completed: false, completedAt: '' },
        ],
        documents: [
            { id: 'doc1', name: '소장.hwpx', type: 'complaint', addedAt: '2025-11-28' },
            { id: 'doc2', name: '매매계약서.pdf', type: 'evidence', addedAt: '2025-11-28' },
            { id: 'doc3', name: '1차 준비서면.hwpx', type: 'brief', addedAt: '2026-01-10' },
        ],
        notes: '분양 하자 관련 손해배상. 감정평가 진행 중. 2차 변론에서 감정인 증인 출석 예정.',
        result: '', resultNote: '',
        legalFee: 5000000, courtFee: 2450000,
        nextHearingDate: '2026-04-15',
        createdAt: '2025-11-15', updatedAt: '2026-03-10',
    },
    {
        id: 'pl2', clientId: 'pc2', clientName: '이영희',
        caseNo: '2026드합1001', court: '수원가정법원',
        type: '가사(이혼)', role: '원고', opponent: '최○○',
        opponentLawyer: '김영수 변호사', claimAmount: 0,
        status: 'hearing', assignedLawyer: '김수현 변호사',
        deadlines: [
            { id: 'pd4', label: '이혼 소장 접수', dueDate: '2026-01-10', completed: true, completedAt: '2026-01-08' },
            { id: 'pd5', label: '재산 목록 제출', dueDate: '2026-03-25', completed: false, completedAt: '' },
            { id: 'pd6', label: '조정기일', dueDate: '2026-04-02', completed: false, completedAt: '' },
        ],
        documents: [
            { id: 'doc4', name: '이혼 소장.hwpx', type: 'complaint', addedAt: '2026-01-08' },
            { id: 'doc5', name: '재산 내역서.xlsx', type: 'evidence', addedAt: '2026-02-15' },
        ],
        notes: '협의이혼 실패 후 재판이혼 진행. 재산분할·위자료 분쟁. 자녀 양육권 주장.',
        result: '', resultNote: '',
        legalFee: 3000000, courtFee: 850000,
        nextHearingDate: '2026-04-02',
        createdAt: '2026-01-05', updatedAt: '2026-03-05',
    },
    {
        id: 'pl3', clientId: 'pc2', clientName: '이영희',
        caseNo: '2026느합500', court: '수원가정법원',
        type: '가사(양육권)', role: '신청인', opponent: '최○○',
        opponentLawyer: '김영수 변호사', claimAmount: 0,
        status: 'preparing', assignedLawyer: '김수현 변호사',
        deadlines: [
            { id: 'pd7', label: '양육권 심판 청구서 작성', dueDate: '2026-03-30', completed: false, completedAt: '' },
        ],
        documents: [],
        notes: '이혼 소송과 병행. 양육비 산정 기준 확인 필요.',
        result: '', resultNote: '',
        legalFee: 2000000, courtFee: 300000,
        nextHearingDate: '',
        createdAt: '2026-02-20', updatedAt: '2026-03-01',
    },
    {
        id: 'pl4', clientId: 'pc3', clientName: '박준혁',
        caseNo: '2026가단20001', court: '서울서부지방법원',
        type: '민사(손해배상)', role: '원고', opponent: '정○○',
        opponentLawyer: '', claimAmount: 45000000,
        status: 'filed', assignedLawyer: '박민준 변호사',
        deadlines: [
            { id: 'pd8', label: '소장 접수', dueDate: '2026-02-15', completed: true, completedAt: '2026-02-14' },
            { id: 'pd9', label: '답변서 수령 대기', dueDate: '2026-04-01', completed: false, completedAt: '' },
        ],
        documents: [
            { id: 'doc6', name: '소장.hwpx', type: 'complaint', addedAt: '2026-02-14' },
            { id: 'doc7', name: '진단서.pdf', type: 'evidence', addedAt: '2026-02-14' },
            { id: 'doc8', name: '사고현장 사진.zip', type: 'evidence', addedAt: '2026-02-14' },
        ],
        notes: '교통사고 과실비율 30:70. 상대방 보험사 합의금 거부.',
        result: '', resultNote: '',
        legalFee: 2000000, courtFee: 450000,
        nextHearingDate: '',
        createdAt: '2026-02-10', updatedAt: '2026-02-28',
    },
    {
        id: 'pl5', clientId: 'pc1', clientName: '김민수',
        caseNo: '2025가소12345', court: '서울중앙지방법원',
        type: '민사(대여금)', role: '원고', opponent: '한○○',
        opponentLawyer: '', claimAmount: 30000000,
        status: 'closed', assignedLawyer: '이지원 변호사',
        deadlines: [
            { id: 'pd10', label: '소장 접수', dueDate: '2025-09-01', completed: true, completedAt: '2025-08-30' },
            { id: 'pd11', label: '1차 변론기일', dueDate: '2025-10-15', completed: true, completedAt: '2025-10-15' },
            { id: 'pd12', label: '판결 선고', dueDate: '2025-11-20', completed: true, completedAt: '2025-11-20' },
        ],
        documents: [
            { id: 'doc9', name: '소장.hwpx', type: 'complaint', addedAt: '2025-08-30' },
            { id: 'doc10', name: '차용증.pdf', type: 'evidence', addedAt: '2025-08-30' },
            { id: 'doc11', name: '판결문.pdf', type: 'judgment', addedAt: '2025-11-20' },
        ],
        notes: '대여금 반환 청구. 차용증 존재. 판결 확정.',
        result: '승소', resultNote: '3000만원 전액 인용. 이자 포함 33,650,000원 인정.',
        legalFee: 1500000, courtFee: 300000,
        nextHearingDate: '',
        createdAt: '2025-08-25', updatedAt: '2025-11-25',
    },
];

function loadPersonalClients(): PersonalClient[] {
    if (typeof window === 'undefined') return DEFAULT_PERSONAL_CLIENTS;
    sbSyncLatest<PersonalClient>('personal_clients', 'personal_clients', PERSONAL_CLIENT_KEY, DEFAULT_PERSONAL_CLIENTS);
    try {
        const raw = localStorage.getItem(PERSONAL_CLIENT_KEY);
        if (!raw) { localStorage.setItem(PERSONAL_CLIENT_KEY, JSON.stringify(DEFAULT_PERSONAL_CLIENTS)); return DEFAULT_PERSONAL_CLIENTS; }
        return JSON.parse(raw);
    } catch { return DEFAULT_PERSONAL_CLIENTS; }
}
function savePersonalClients(cs: PersonalClient[]) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(PERSONAL_CLIENT_KEY, JSON.stringify(cs));
        if (IS_SUPABASE_CONFIGURED) {
            const rows = cs.map(c => objToRow(c as unknown as Record<string, unknown>));
            sbUpsert('personal_clients', rows);
        }
    }
}

function loadPersonal(): PersonalLitigation[] {
    if (typeof window === 'undefined') return DEFAULT_PERSONAL_LITS;
    sbSyncLatest<PersonalLitigation>('personal_lits', 'personal_litigations', PERSONAL_KEY, DEFAULT_PERSONAL_LITS);
    try {
        const raw = localStorage.getItem(PERSONAL_KEY);
        if (!raw) { localStorage.setItem(PERSONAL_KEY, JSON.stringify(DEFAULT_PERSONAL_LITS)); return DEFAULT_PERSONAL_LITS; }
        return JSON.parse(raw);
    } catch { return DEFAULT_PERSONAL_LITS; }
}
function savePersonal(cs: PersonalLitigation[]) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(PERSONAL_KEY, JSON.stringify(cs));
        if (IS_SUPABASE_CONFIGURED) {
            const exclude = ['deadlines', 'documents', 'paymentPlan'];
            const rows = cs.map(c => objToRow(c as unknown as Record<string, unknown>, exclude));
            sbUpsert('personal_litigations', rows);
        }
    }
}

export const personalStore = {
    // ── Clients ──
    getClients(): PersonalClient[] { return loadPersonalClients(); },
    getClientById(id: string): PersonalClient | undefined { return loadPersonalClients().find(c => c.id === id); },
    addClient(data: Omit<PersonalClient, 'id' | 'createdAt'>): PersonalClient {
        const all = loadPersonalClients();
        const c: PersonalClient = { ...data, id: `pc${Date.now()}`, createdAt: new Date().toISOString() };
        all.unshift(c);
        savePersonalClients(all);
        return c;
    },
    updateClient(id: string, patch: Partial<PersonalClient>): void {
        const all = loadPersonalClients();
        const idx = all.findIndex(c => c.id === id);
        if (idx >= 0) all[idx] = { ...all[idx], ...patch };
        savePersonalClients(all);
    },

    // ── Litigations ──
    getAll(): PersonalLitigation[] { return loadPersonal(); },
    getById(id: string): PersonalLitigation | undefined { return loadPersonal().find(l => l.id === id); },
    getByClient(clientId: string): PersonalLitigation[] { return loadPersonal().filter(l => l.clientId === clientId); },

    add(data: Omit<PersonalLitigation, 'id' | 'createdAt' | 'updatedAt'>): PersonalLitigation[] {
        const all = loadPersonal();
        all.unshift({ ...data, id: `pl${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        savePersonal(all);
        return all;
    },

    update(id: string, patch: Partial<PersonalLitigation>): PersonalLitigation[] {
        const all = loadPersonal();
        const idx = all.findIndex(l => l.id === id);
        if (idx >= 0) all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
        savePersonal(all);
        return all;
    },

    toggleDeadline(litId: string, deadlineId: string): PersonalLitigation[] {
        const all = loadPersonal();
        const lit = all.find(l => l.id === litId);
        if (lit) {
            const d = lit.deadlines.find(x => x.id === deadlineId);
            if (d) {
                d.completed = !d.completed;
                d.completedAt = d.completed ? new Date().toLocaleString('ko-KR', { hour12: false }) : '';
            }
            lit.updatedAt = new Date().toISOString();
        }
        savePersonal(all);
        return all;
    },

    addDeadline(litId: string, label: string, dueDate: string): PersonalLitigation[] {
        const all = loadPersonal();
        const lit = all.find(l => l.id === litId);
        if (lit) {
            lit.deadlines.push({ id: `pd${Date.now()}`, label, dueDate, completed: false, completedAt: '' });
            lit.updatedAt = new Date().toISOString();
        }
        savePersonal(all);
        return all;
    },

    close(id: string, reason: string): PersonalLitigation[] {
        const all = loadPersonal();
        const idx = all.findIndex(l => l.id === id);
        if (idx >= 0) {
            all[idx] = { ...all[idx], status: 'closed', closedAt: new Date().toISOString(), closeReason: reason, updatedAt: new Date().toISOString() };
        }
        savePersonal(all); return all;
    },

    restore(id: string): PersonalLitigation[] {
        const all = loadPersonal();
        const idx = all.findIndex(l => l.id === id);
        if (idx >= 0) {
            all[idx] = { ...all[idx], status: 'consulting', closedAt: undefined, closeReason: undefined, updatedAt: new Date().toISOString() };
        }
        savePersonal(all); return all;
    },

    reset(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(PERSONAL_KEY);
        localStorage.removeItem(PERSONAL_CLIENT_KEY);
    },
};

// ══════════════════════════════════════════════════════════════
// ── 근태/행선지 시스템 ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════

export type AttendanceType = '연차' | '반차(오전)' | '반차(오후)' | '출장' | '재택' | '조퇴' | '외출' | '법원출석';
export type AttendanceStatus = 'pending' | 'approved' | 'rejected';

export interface AttendanceRecord {
    id: string;
    userId: string;
    userName: string;
    type: AttendanceType;
    startDate: string;
    endDate: string;
    memo: string;
    destination?: string;
    status: AttendanceStatus;
    createdAt: string;
}

export const ATTENDANCE_TYPES: AttendanceType[] = ['연차', '반차(오전)', '반차(오후)', '출장', '재택', '조퇴', '외출', '법원출석'];

export const ATTENDANCE_TYPE_COLOR: Record<AttendanceType, string> = {
    '연차': '#2563eb',
    '반차(오전)': '#0891b2',
    '반차(오후)': '#0891b2',
    '출장': '#7c3aed',
    '재택': '#16a34a',
    '조퇴': '#ea580c',
    '외출': '#d97706',
    '법원출석': '#be123c',
};

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
    pending: '대기', approved: '승인', rejected: '반려',
};

const ATTENDANCE_KEY = 'ibs_attendance_v1';

const DEFAULT_ATTENDANCE: AttendanceRecord[] = [
    { id: 'att1', userId: 'lawyer1', userName: '김수현 변호사', type: '출장', startDate: '2026-03-25', endDate: '2026-03-25', memo: '수원지방법원 변론기일', destination: '수원지방법원', status: 'approved', createdAt: '2026-03-20' },
    { id: 'att2', userId: 'lawyer1', userName: '김수현 변호사', type: '연차', startDate: '2026-03-28', endDate: '2026-03-28', memo: '개인 사유', status: 'pending', createdAt: '2026-03-22' },
    { id: 'att3', userId: 'lawyer1', userName: '김수현 변호사', type: '재택', startDate: '2026-03-21', endDate: '2026-03-21', memo: '준비서면 작성', status: 'approved', createdAt: '2026-03-19' },
    { id: 'att4', userId: 'lawyer1', userName: '김수현 변호사', type: '법원출석', startDate: '2026-04-02', endDate: '2026-04-02', memo: '이영희 사건 조정기일', destination: '수원가정법원', status: 'approved', createdAt: '2026-03-22' },
    { id: 'att5', userId: 'lawyer1', userName: '김수현 변호사', type: '반차(오후)', startDate: '2026-03-18', endDate: '2026-03-18', memo: '병원 진료', status: 'approved', createdAt: '2026-03-15' },
];

function loadAttendance(): AttendanceRecord[] {
    if (typeof window === 'undefined') return DEFAULT_ATTENDANCE;
    try {
        const raw = localStorage.getItem(ATTENDANCE_KEY);
        if (!raw) { localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(DEFAULT_ATTENDANCE)); return DEFAULT_ATTENDANCE; }
        return JSON.parse(raw);
    } catch { return DEFAULT_ATTENDANCE; }
}
function saveAttendance(recs: AttendanceRecord[]) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(recs));
    }
}

export const attendanceStore = {
    getAll(): AttendanceRecord[] { return loadAttendance(); },
    getByUser(userId: string): AttendanceRecord[] { return loadAttendance().filter(r => r.userId === userId); },
    add(data: Omit<AttendanceRecord, 'id' | 'createdAt'>): AttendanceRecord {
        const all = loadAttendance();
        const rec: AttendanceRecord = { ...data, id: `att${Date.now()}`, createdAt: new Date().toISOString() };
        all.unshift(rec);
        saveAttendance(all);
        return rec;
    },
    updateStatus(id: string, status: AttendanceStatus): void {
        const all = loadAttendance();
        const rec = all.find(r => r.id === id);
        if (rec) { rec.status = status; saveAttendance(all); }
    },
    remove(id: string): void {
        const all = loadAttendance().filter(r => r.id !== id);
        saveAttendance(all);
    },
};

// ══════════════════════════════════════════════════════════════
// ── SMS 발송 로그 스토어 ──────────────────────────────────────
// ══════════════════════════════════════════════════════════════

export interface SmsLogEntry {
    id: string;
    to: string;
    message: string;
    type: 'SMS' | 'LMS' | 'MMS';
    sentAt: string;
    status: 'sent' | 'failed' | 'pending';
    caseId?: string;
    templateId?: string;
    senderName?: string;
}

const SMS_LOG_KEY = 'ibs_sms_logs_v1';

function loadSmsLogs(): SmsLogEntry[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(SMS_LOG_KEY) || '[]'); } catch { return []; }
}
function saveSmsLogs(logs: SmsLogEntry[]) {
    if (typeof window !== 'undefined') localStorage.setItem(SMS_LOG_KEY, JSON.stringify(logs));
}

export const smsLogStore = {
    getAll(): SmsLogEntry[] { return loadSmsLogs(); },
    add(log: SmsLogEntry): void {
        const all = loadSmsLogs();
        all.unshift(log);
        saveSmsLogs(all.slice(0, 500));
    },
    getByCase(caseId: string): SmsLogEntry[] {
        return loadSmsLogs().filter(l => l.caseId === caseId);
    },
};

// ══════════════════════════════════════════════════════════════
// ── 회의실 예약 시스템 ────────────────────────────────────────
// ══════════════════════════════════════════════════════════════

export interface MeetingRoom {
    id: string;
    name: string;
    capacity: number;
    floor: string;
}

export interface MeetingReservation {
    id: string;
    roomId: string;
    userId: string;
    userName: string;
    date: string;        // YYYY-MM-DD
    startTime: string;   // HH:mm (예: '09:00')
    endTime: string;     // HH:mm (예: '10:00')
    purpose: string;
    createdAt: string;
}

const MEETING_ROOMS: MeetingRoom[] = [
    { id: 'room1', name: '본관-대회의실', capacity: 20, floor: '본관 3층' },
    { id: 'room2', name: '본관-소회의실', capacity: 6, floor: '본관 2층' },
    { id: 'room3', name: '별관-회의실', capacity: 10, floor: '별관 1층' },
];

const MEETING_KEY = 'ibs_meeting_reservations_v1';

// 오늘 날짜의 샘플 예약
function getDefaultReservations(): MeetingReservation[] {
    const today = new Date().toISOString().slice(0, 10);
    return [
        { id: 'mr1', roomId: 'room1', userId: 'lawyer1', userName: '김수현 변호사', date: today, startTime: '10:00', endTime: '11:00', purpose: '파리바게뜨 사건 회의', createdAt: new Date().toISOString() },
        { id: 'mr2', roomId: 'room2', userId: 'lawyer2', userName: '이지원 변호사', date: today, startTime: '14:00', endTime: '15:00', purpose: '의뢰인 미팅', createdAt: new Date().toISOString() },
        { id: 'mr3', roomId: 'room1', userId: 'staff1', userName: '최서연 (총무)', date: today, startTime: '15:00', endTime: '17:00', purpose: '월간 회의', createdAt: new Date().toISOString() },
        { id: 'mr4', roomId: 'room3', userId: 'lawyer3', userName: '박민준 변호사', date: today, startTime: '09:00', endTime: '10:00', purpose: '사건 검토', createdAt: new Date().toISOString() },
    ];
}

function loadReservations(): MeetingReservation[] {
    if (typeof window === 'undefined') return getDefaultReservations();
    try {
        const raw = localStorage.getItem(MEETING_KEY);
        if (!raw) {
            const def = getDefaultReservations();
            localStorage.setItem(MEETING_KEY, JSON.stringify(def));
            return def;
        }
        return JSON.parse(raw);
    } catch { return getDefaultReservations(); }
}
function saveReservations(rsvps: MeetingReservation[]) {
    if (typeof window !== 'undefined') localStorage.setItem(MEETING_KEY, JSON.stringify(rsvps));
}

export const meetingRoomStore = {
    getRooms(): MeetingRoom[] { return MEETING_ROOMS; },

    getReservations(date: string): MeetingReservation[] {
        return loadReservations().filter(r => r.date === date);
    },

    getAllReservations(): MeetingReservation[] {
        return loadReservations();
    },

    addReservation(data: Omit<MeetingReservation, 'id' | 'createdAt'>): MeetingReservation {
        const all = loadReservations();
        const rsvp: MeetingReservation = {
            ...data,
            id: `mr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            createdAt: new Date().toISOString(),
        };
        all.push(rsvp);
        saveReservations(all);
        return rsvp;
    },

    deleteReservation(id: string): void {
        const all = loadReservations().filter(r => r.id !== id);
        saveReservations(all);
    },

    hasConflict(roomId: string, date: string, startTime: string, endTime: string, excludeId?: string): boolean {
        const reservations = this.getReservations(date).filter(r => r.roomId === roomId && r.id !== excludeId);
        return reservations.some(r => {
            return startTime < r.endTime && endTime > r.startTime;
        });
    },
};

// ══════════════════════════════════════════════════════════════
// ── 대기중 의뢰인 시스템 (녹음/URL/회의 접수 파이프라인) ────────
// ══════════════════════════════════════════════════════════════

export type PendingChannel = 'recording' | 'intake_url' | 'meeting';
export type PendingStatus  = 'pending' | 'confirmed' | 'rejected';
export type SourcePortal   = 'lawyer' | 'sales' | 'intake';

export interface PendingClient {
    id: string;
    channel: PendingChannel;         // 채널 A/B/C
    clientName: string;
    clientPhone: string;
    category: string;                // 사건 분류
    transcript: string;              // 전체 녹취록
    summarySteps: string[];          // 노션 AI 스타일 단계별 요약
    fullSummary: string;             // AI 전체 요약 1줄
    recordingDuration?: number;      // 녹음 길이(초)
    sourcePortal: SourcePortal;      // 어느 포탈에서 생성됐는지
    sourceUserId?: string;
    sourceUserName?: string;
    status: PendingStatus;
    token?: string;                  // 채널 B 전용 URL 토큰
    litCaseId?: string;              // 컨펌 후 연결된 사건 ID
    createdAt: string;
    updatedAt: string;
}

// ── CRM 알람 ──
export interface CrmNotification {
    id: string;
    type: 'pending_client' | 'deadline' | 'billing';
    title: string;
    body: string;
    pendingClientId?: string;
    read: boolean;
    createdAt: string;
}

const PENDING_KEY = 'ibs_pending_clients_v1';
const NOTIF_KEY   = 'ibs_notifications_v1';

function loadPending(): PendingClient[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); } catch { return []; }
}
function savePending(items: PendingClient[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PENDING_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('ibs-pending-updated'));
}

export const PendingClientStore = {
    getAll(): PendingClient[] { return loadPending(); },
    getPending(): PendingClient[] { return loadPending().filter(p => p.status === 'pending'); },
    getByToken(token: string): PendingClient | undefined { return loadPending().find(p => p.token === token); },

    save(data: Omit<PendingClient, 'id' | 'createdAt' | 'updatedAt'>): PendingClient {
        const all = loadPending();
        const now = new Date().toISOString();
        const entry: PendingClient = {
            ...data,
            id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            createdAt: now,
            updatedAt: now,
        };
        all.unshift(entry);
        savePending(all);
        // 알람 자동 생성
        NotificationStore.create({
            type: 'pending_client',
            title: `🔔 새 의뢰인 대기 — ${entry.clientName}`,
            body: entry.fullSummary || `${entry.channel === 'intake_url' ? 'URL 접수' : '녹음 접수'}`,
            pendingClientId: entry.id,
        });
        return entry;
    },

    confirm(id: string): PendingClient | undefined {
        const all = loadPending();
        const item = all.find(p => p.id === id);
        if (!item) return;
        item.status = 'confirmed';
        item.updatedAt = new Date().toISOString();
        savePending(all);
        return item;
    },

    reject(id: string): void {
        const all = loadPending();
        const item = all.find(p => p.id === id);
        if (!item) return;
        item.status = 'rejected';
        item.updatedAt = new Date().toISOString();
        savePending(all);
    },

    count(): number { return this.getPending().length; },
};

// ── 알람 스토어 ──
function loadNotifs(): CrmNotification[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]'); } catch { return []; }
}
function saveNotifs(items: CrmNotification[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(NOTIF_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('ibs-notif-updated'));
}

export const NotificationStore = {
    getAll(): CrmNotification[] { return loadNotifs(); },
    getUnread(): CrmNotification[] { return loadNotifs().filter(n => !n.read); },
    unreadCount(): number { return this.getUnread().length; },

    create(data: Omit<CrmNotification, 'id' | 'read' | 'createdAt'>): CrmNotification {
        const all = loadNotifs();
        const notif: CrmNotification = {
            ...data,
            id: `notif-${Date.now()}`,
            read: false,
            createdAt: new Date().toISOString(),
        };
        all.unshift(notif);
        saveNotifs(all);
        return notif;
    },

    markRead(id: string): void {
        const all = loadNotifs();
        const n = all.find(x => x.id === id);
        if (n) { n.read = true; saveNotifs(all); }
    },

    markAllRead(): void {
        const all = loadNotifs().map(n => ({ ...n, read: true }));
        saveNotifs(all);
    },
};

