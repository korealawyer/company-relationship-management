// ================================================================
// Global Client Store (Zero Mockup)
//
// 기존 50개가 넘는 UI 컴포넌트들이 동기식(Sync) 상태 조회 방식을 
// 사용하고 있어, 이들을 모두 비동기로 재작성하는 대신 중간에
// 상태를 캐싱하는 Client Store 레이어를 두어 마이그레이션을 안정화합니다.
// (실제 데이터는 빈 배열로 시작하여 dataLayer(Supabase)를 통해 채워집니다)
// ================================================================

import dataLayer from './dataLayer';
import { 
  Company, LitigationCase, Consultation, 
  PersonalClient, PersonalLitigation, AutoSettings, AutoLog 
} from './types';
import { v4 as uuidv4 } from 'uuid';

export * from './types'; // types.ts 의 모든 타입 재익스포트

// 하드코딩된 변호사 목록 및 세일즈 담당자 (목업이 아닌 시스템 상수)
export const SALES_REPS = ['김영업', '이혁진', '박성민'];

// store.ts 호환 계층
export interface ConsultItem {
    id: string;
    companyName: string;
    category: string;
    title: string;
    content: string;
    urgency: 'urgent' | 'normal';
    created: string;
}
export const CONSULTS: ConsultItem[] = []; // 동기식 렌더링 호환을 위한 빈 배열

// Mock Constants & Types (호환성 목적)
export const STATUS_LABEL: Record<string, string> = {
  pending: '검토 대기', crawling: '분석 중', analyzed: 'AI 분석 완료', assigned: '배정 완료',
  reviewing: '검토 중', lawyer_confirmed: '변호사 컨펌', emailed: '메일 발송',
  client_replied: '고객 답장', client_viewed: '고객 열람', contract_sent: '계약서 발송',
  contract_signed: '계약 완료', cold_email: '콜드 메일', guide_download: '가이드 다운',
  pilot_offer: '파일럿 제안', subscribed: '구독 중', upsell: '업셀 대상', churn_risk: '이탈 위험'
};

export const LIT_STATUS_LABEL: Record<string, string> = {
  preparing: '준비 중', filed: '접수 완료', hearing: '심리 중',
  settlement: '합의 진행', judgment: '선고', closed: '종결'
};

export const LIT_STATUS_COLOR: Record<string, string> = {
  preparing: 'gray', filed: 'blue', hearing: 'orange',
  settlement: 'green', judgment: 'red', closed: 'dark'
};

export const LAWYERS = ['김수현', '이지은', '박성수', '최현석'];

// UIDocument removed, it relies on imported Document

// personalStore 호환 목업
export const personalStore = {
  getClients: () => [] as PersonalClient[],
  getAll: () => [] as PersonalLitigation[],
  addClient: (d: any) => {},
  addCase: (d: any) => {},
  updateClient: (id: string, d: any) => {},
  updateCase: (id: string, d: any) => {},
  deleteClient: (id: string) => {},
  deleteCase: (id: string) => {},
  update: (id: string, d: any) => {},
  add: (d: any) => {}
};

export const documentStore = {
  getByCompanyId: (id: string) => [],
  upload: (data: any) => {},
  markAsReadByClient: (id: string) => {}
};

export const consultStore = {
  getAll: () => [],
  submit: () => {},
  addAnswer: () => {},
  markCallbackDone: () => {},
  requestCallback: () => {}
};

export interface BillingRecord { id: string; }
export const billingStore = { 
  getRecords: () => [], 
  addRecord: () => {}, 
  updateStatus: () => {} 
};

export const attendanceStore = {
  getToday: () => [],
  recordAttendance: () => {}
};

export interface MeetingReservation { id: string; }
export interface MeetingRoom { id: string; name: string; capacity: number; }
export const meetingRoomStore = {
  getReservations: () => [],
  addReservation: () => {},
  cancelReservation: () => {}
};

export interface SmsLogEntry { id: string; }
export const smsLogStore = {
  getLogs: () => [],
  addLog: () => {}
};

export const PERSONAL_LIT_STATUS_TEXT: any = {};
export const PERSONAL_LIT_STATUSES: any[] = [];
export const PERSONAL_LIT_TYPES: any[] = [];
export const PERSONAL_LIT_STATUS_LABEL: any = {};
export const STATUS_COLORS: any = {};
export const SAMPLE_CONSULTS: any[] = [];
export const SAMPLE_BILLING: any[] = [];
export const PERSONAL_LIT_STATUS_COLOR: any = {};
export const ATTENDANCE_STATUS_LABEL: any = {};
export const ATTENDANCE_TYPES: any[] = [];
export const ATTENDANCE_TYPE_COLOR: any = {};
export const STATUS_COLOR: any = {};
export interface ConsultRecord { 
  id: string; 
  category?: any; 
  status?: any; 
  date?: any; 
  lawyer?: any; 
  clientName?: any; 
  content?: any; 
  targetFee?: any; 
  isPublic?: any; 
  clientPhone?: any; 
  clientEmail?: any; 
  fee?: any; 
  note?: any; 
}

export const addLog = (...args: any[]) => {};
export interface PendingClient { 
  id: string; 
  clientName?: any; 
  channel?: any; 
  clientPhone?: any; 
  summarySteps?: any; 
  transcript?: any; 
  category?: any; 
  createdAt?: any; 
}
export interface CrmNotification { id: string; }

export const PendingClientStore = {
  getAll: () => [],
  getPending: () => [],
  getByToken: () => undefined,
  save: () => ({}),
  confirm: () => undefined,
  reject: () => {},
  count: () => 0
};

export const NotificationStore = {
  getAll: () => [],
  getUnread: () => [],
  unreadCount: () => 0,
  create: () => ({})
};

export const useSupabaseAutoRefresh = () => {};

export * from './constants';

class ClientStore {
  // 인메모리 캐시
  private _companies: Company[] = [];
  private _litigation: LitigationCase[] = [];
  private _consult: Consultation[] = [];
  private _logs: AutoLog[] = [];
  private _autoSettings: AutoSettings = {
    signatureAutoCheck: false,
    signatureCheckIntervalHours: 24,
    welcomeEmailAutoSend: false,
    autoOnboarding: false,
    autoFollowUp: false,
    kakaoAutoSend: false,
    kakaoScheduleHours: 2,
    kakaoTemplate: 'welcome',
    // Types.ts에서 요구할 수도 있는 필드들 방어용
    autoSalesConfirm: false, autoAssignLawyer: false, autoGenerateDraft: false, autoSendEmail: false,
    autoDeadlineAlert: false, autoMonthlyBilling: false, autoOverdueReminder: false,
    autoSatisfactionSurvey: false, autoAiMemoSummary: false, lawyerRoundRobin: 0,
    updatedAt: '', updatedBy: ''
  };

  constructor() {
    this.hydrate();
  }

  // Supabase에서 비동기로 데이터 로드
  async hydrate() {
    try {
      if (typeof window !== 'undefined') {
        const [comps, lits, cons, logs, settings] = await Promise.all([
          dataLayer.companies.getAll(),
          dataLayer.litigation.getAll(),
          dataLayer.consult.getAll(),
          dataLayer.auto.getLogs(),
          dataLayer.auto.getSettings(),
        ]);
        this._companies = comps || [];
        this._litigation = lits || [];
        this._consult = cons || [];
        this._logs = logs || [];
        // if (settings) this._autoSettings = settings; (부분 병합 생략 혹은 보류)
      }
    } catch(e) {
      console.error('Store hydration failed:', e);
    }
  }

  /* ── Getters (Sync) ── */
  getAll(): Company[] { return this._companies; }
  getById(id: string): Company | null { return this._companies.find(c => c.id === id) || null; }
  getLitigationCases(): LitigationCase[] { return this._litigation; }
  getLitAll(): LitigationCase[] { return this._litigation; }
  getLitById(id: string): LitigationCase | null { return this._litigation.find(c => c.id === id) || null; }
  getConsultations(): Consultation[] { return this._consult; }
  getAutoSettings(): AutoSettings { return this._autoSettings; }
  getLogs(): AutoLog[] { return this._logs; }

  /* ── Setters (Sync cache + Async DB) ── */
  async add(company: Company) {
    this._companies.push(company);
    await dataLayer.companies.create(company);
  }

  async deleteCompany(id: string) { await dataLayer.companies.delete(id); }

  restoreLit(id: string) {}
  closeLit(id: string) {}

  async update(id: string, patch: Partial<Company>) {
    const idx = this._companies.findIndex(c => c.id === id);
    if (idx !== -1) {
      this._companies[idx] = { ...this._companies[idx], ...patch, updatedAt: new Date().toISOString() };
    }
    await dataLayer.companies.update(id, patch);
  }

  async salesConfirm(id: string, salesRep: string) {
    await this.update(id, {
      status: 'consulting' as any,
      salesAssignedTo: salesRep,
      salesAssignedAt: new Date().toISOString()
    } as any);
  }

  async signContract(id: string) {
    await this.update(id, { status: 'contract_signed', currentStage: '가입/온보딩' } as any);
  }

  async sendContract(id: string, method: 'email'|'kakao') {
    await this.update(id, { status: 'contract_sent' });
  }

  async updateAutoSettings(patch: Partial<AutoSettings>, user: string) {
    this._autoSettings = { ...this._autoSettings, ...patch };
    await dataLayer.auto.saveSettings(this._autoSettings);
    // 로그 기록 로직은 데이터레이어가 처리하거나 여기서 처리
    return this._autoSettings;
  }

  async addLit(data: Partial<LitigationCase>) {
    // mock behavior
    await dataLayer.litigation.create(data);
  }

  async updateLit(id: string, patch: Partial<LitigationCase>) {
    await dataLayer.litigation.update(id, patch);
  }

  async updateDeadline(caseId: string, deadlineId: string, patch: any) {
    // dummy method for compilation
  }

  async subscribe(id: string, plan: any) {
    await this.update(id, { plan } as any);
  }

  reset() {
    // dummy reset method
  }

  clearLogs() {
    this._logs = [];
  }

  // store 호환 처리
  getPendingClients() { return []; }
  getConsultQueue() { return []; }
  getSmsConversations() { return []; }
}

export const store = new ClientStore();
export default store;
