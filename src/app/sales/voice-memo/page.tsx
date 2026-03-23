'use client';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Search, Building2, ChevronRight, Check,
  Clock, RefreshCw, ArrowLeft, Sparkles, Phone, X,
  Download, User, MessageSquare, Square,
  ChevronDown, ChevronUp, Edit3,
  Calculator, Users, Headphones, Settings, LayoutDashboard,
} from 'lucide-react';
import Link from 'next/link';
import { store, type Company } from '@/lib/mockStore';
import {
  CallRecorder, STTService, CallRecordingStore, AudioVisualizer,
  formatDuration, type CallRecording,
} from '@/lib/callRecordingService';

/* ─── 디자인 토큰 ─── */
const C = {
  bg:       '#F0F2F5',
  surface:  '#FFFFFF',
  card:     '#FFFFFF',
  border:   '#E1E4E8',
  divider:  '#F0F2F5',

  text1:    '#111827',
  text2:    '#374151',
  text3:    '#6B7280',
  text4:    '#9CA3AF',

  primary:   '#2563EB',
  primaryBg: '#EFF6FF',
  primaryLight: '#BFDBFE',

  green:   '#059669',
  greenBg: '#ECFDF5',
  greenLight: '#A7F3D0',

  red:   '#DC2626',
  redBg: '#FEF2F2',

  amber:   '#D97706',
  amberBg: '#FFFBEB',

  purple:   '#7C3AED',
  purpleBg: '#F5F3FF',
};

function cleanPhone(raw: string) { return raw.replace(/[^0-9+]/g, ''); }

type Step = 'select' | 'record' | 'result';

/* ─── 사이드바 네비 아이템 ─── */
const NAV = [
  { href: '/employee',                  icon: Users,      label: 'CRM 대시보드' },
  { href: '/sales/call',                icon: Headphones, label: '전화 영업' },
  { href: '/sales/voice-memo',          icon: Mic,        label: '음성 메모', active: true },
  { href: '/sales/pricing-calculator',  icon: Calculator, label: '견적 계산기' },
  { href: '/settings',                  icon: Settings,   label: '설정' },
];

/* ─── 기업 카드 ─── */
function CompanyCard({
  co, onClick, selected, lastCallDate,
}: { co: Company; onClick: () => void; selected: boolean; lastCallDate?: string }) {
  const phone = co.contactPhone || co.phone || '';
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '14px 16px',
        background: selected ? C.primaryBg : C.surface,
        border: `1.5px solid ${selected ? C.primary : C.border}`,
        borderRadius: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: selected ? C.primaryLight : C.divider,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Building2 style={{ width: 20, height: 20, color: selected ? C.primary : C.text3 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{co.name}</span>
          {co.storeCount > 0 && (
            <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, fontWeight: 500, background: C.divider, color: C.text3, flexShrink: 0 }}>
              {co.storeCount.toLocaleString()}개점
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Phone style={{ width: 12, height: 12, color: C.text4, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: C.text3, fontFamily: 'monospace' }}>{phone || '번호 미등록'}</span>
          {co.contactName && <span style={{ fontSize: 12, color: C.text4 }}>· {co.contactName}</span>}
        </div>
      </div>
      <ChevronRight style={{ width: 16, height: 16, color: selected ? C.primary : C.text4, flexShrink: 0 }} />
    </button>
  );
}

/* ─── 통화 결과 뱃지 ─── */
function resultStyle(r: string) {
  if (r === 'connected') return { bg: C.greenBg, color: C.green, label: '✅ 연결됨' };
  if (r === 'callback')  return { bg: C.primaryBg, color: C.primary, label: '📋 콜백예정' };
  return { bg: C.amberBg, color: C.amber, label: '📵 부재중' };
}

/* ═══════════════════════════════════════════
   메인 컴포넌트
═══════════════════════════════════════════ */
export default function VoiceMemoPage() {
  const [step, setStep] = useState<Step>('select');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Company | null>(null);
  const [callResult, setCallResult] = useState<'connected' | 'no_answer' | 'callback'>('connected');
  const [toast, setToast] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [quickMemo, setQuickMemo] = useState('');
  const [showQuickMemo, setShowQuickMemo] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const recorderRef = useRef(new CallRecorder());
  const visualizerRef = useRef(new AudioVisualizer());
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  // AudioVisualizer.getFrequencyData()는 fftSize=64 기준으로 32개(frequencyBinCount)를 반환하나
  // getFrequencyData()에서 slice(0,16)으로 16개만 돌려주므로 16으로 맞춤
  const [waveformData, setWaveformData] = useState<number[]>(new Array(16).fill(0));
  const waveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const [sttStatus, setSttStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [lastRecording, setLastRecording] = useState<CallRecording | null>(null);
  const [recentRecordings, setRecentRecordings] = useState<CallRecording[]>([]);

  const refresh = useCallback(() => {
    setCompanies(store.getAll());
    setRecentRecordings(CallRecordingStore.getRecent(20));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); }, [toast]);

  useEffect(() => {
    const h = (e: any) => { e.preventDefault(); setInstallPrompt(e); setShowInstallBanner(true); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  useEffect(() => {
    const h = (e: StorageEvent) => { if (e.key === 'ibs_call_recordings') refresh(); };
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, [refresh]);

  const filtered = useMemo(() => {
    if (!search.trim()) return companies.slice(0, 50);
    const q = search.toLowerCase();
    return companies.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.biz.includes(q) ||
      (c.contactName || '').includes(q) ||
      (c.contactPhone || '').includes(q) ||
      (c.phone || '').includes(q)
    ).slice(0, 50);
  }, [companies, search]);

  const getPhoneList = (co: Company) => {
    const list: { label: string; phone: string; isPrimary: boolean }[] = [];
    if (co.contactPhone) list.push({ label: `${co.contactName || '담당자'} 휴대폰`, phone: co.contactPhone, isPrimary: true });
    if (co.phone && co.phone !== co.contactPhone) list.push({ label: '회사 대표번호', phone: co.phone, isPrimary: !co.contactPhone });
    if (co.contacts?.length) {
      co.contacts.forEach(ct => {
        if (ct.phone && ct.phone !== co.contactPhone && ct.phone !== co.phone)
          list.push({ label: `${ct.name} (${ct.role || ct.department || ''})`, phone: ct.phone, isPrimary: false });
      });
    }
    return list;
  };

  const getPrimaryPhone = (co: Company) => co.contactPhone || co.phone || '';

  const handleSelect = (co: Company) => {
    setSelected(co); setStep('record'); setSttStatus('idle');
    setLastRecording(null); setShowHistory(false);
    setQuickMemo(''); setShowQuickMemo(false);
  };

  const startRecording = async () => {
    const ok = await recorderRef.current.start();
    if (ok) {
      setIsRecording(true); setElapsed(0);
      setToast('녹음이 시작되었습니다');
      elapsedInterval.current = setInterval(() => setElapsed(s => s + 1), 1000);
      const stream = recorderRef.current.getStream();
      if (stream) {
        visualizerRef.current.connect(stream);
        waveInterval.current = setInterval(() => setWaveformData(visualizerRef.current.getFrequencyData()), 80);
      }
    } else { setToast('마이크 접근이 불가합니다'); }
  };

  const stopRecording = async () => {
    if (!selected) return;
    if (elapsedInterval.current) { clearInterval(elapsedInterval.current); elapsedInterval.current = null; }
    if (waveInterval.current) { clearInterval(waveInterval.current); waveInterval.current = null; }
    visualizerRef.current.disconnect();
    const rec = await recorderRef.current.stop();
    setIsRecording(false); setWaveformData(new Array(16).fill(0));
    if (!rec || rec.durationSeconds < 2) { setToast('녹음이 너무 짧습니다 (최소 2초)'); return; }

    setSttStatus('processing'); setStep('result');

    const saved = CallRecordingStore.save({
      companyId: selected.id, companyName: selected.name,
      salesUserName: '영업팀', fileSizeBytes: rec.blob.size,
      durationSeconds: rec.durationSeconds, transcript: '', transcriptSummary: '',
      callResult, sttStatus: 'processing', sttProvider: 'mock',
      contactName: selected.contactName || '', contactPhone: getPrimaryPhone(selected),
    });
    // CallRecordingStore.save()가 내부적으로 _dispatchSync()를 호출하므로 중복 syncEvent 제거

    try {
      const stt = await STTService.transcribe(rec.blob, rec.durationSeconds, callResult);
      const summary = await STTService.summarize(stt.transcript, selected);
      const transcript = quickMemo ? `[메모] ${quickMemo}\n\n${stt.transcript}` : stt.transcript;
      CallRecordingStore.updateTranscript(saved.id, transcript, summary, 'completed');
      CallRecordingStore.syncToCallNote(saved.id);
      setSttStatus('completed');
      setLastRecording({ ...saved, transcript, transcriptSummary: summary, sttStatus: 'completed' });
      setToast('✅ 변환 완료 — CRM에 동기화되었습니다');
    } catch {
      CallRecordingStore.updateTranscript(saved.id, '', '', 'failed');
      setSttStatus('failed');
      setLastRecording({ ...saved, sttStatus: 'failed' });
      setToast('❌ 변환에 실패했습니다. 다시 시도해주세요.');
    }
    refresh();
  };

  const resetToSelect = () => {
    setStep('select'); setSelected(null); setSttStatus('idle'); setLastRecording(null); setElapsed(0);
    setShowHistory(false); setQuickMemo(''); setShowQuickMemo(false); refresh();
  };

  const handleInstall = async () => {
    if (!installPrompt) return; installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setToast('홈 화면에 설치되었습니다');
    setInstallPrompt(null); setShowInstallBanner(false);
  };

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const companyRecordings = useMemo(() => {
    if (!selected) return [];
    return recentRecordings.filter(r => r.companyId === selected.id);
  }, [selected, recentRecordings]);

  // 기업별 마지막 통화 날짜 맵
  const lastCallMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const rec of recentRecordings) {
      if (!map[rec.companyId]) {
        map[rec.companyId] = new Date(rec.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      }
    }
    return map;
  }, [recentRecordings]);

  /* ─── 렌더 ─── */
  return (
    <div style={{
      minHeight: 'calc(100dvh - 80px)',
      background: C.bg,
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', -apple-system, sans-serif",
      display: 'flex',
      color: C.text1,
    }}>
      {/* ══ 사이드바 (PC) ══ */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 80, height: 'calc(100dvh - 80px)',
      }}
        className="hidden md:flex"
      >
        {/* 로고 */}
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${C.border}` }}>
          <Link href="/employee" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg,#2563EB,#7C3AED)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>IB</span>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text1, margin: 0 }}>IBS 영업팀</p>
                <p style={{ fontSize: 11, color: C.text3, margin: 0 }}>CRM 플랫폼</p>
              </div>
            </div>
          </Link>
        </div>

        {/* 메뉴 */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.text4, margin: '0 0 8px 8px', letterSpacing: '0.05em' }}>영업 도구</p>
          {NAV.map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: item.active ? C.primaryBg : 'transparent',
                  color: item.active ? C.primary : C.text2,
                  fontWeight: item.active ? 600 : 400,
                  fontSize: 14,
                  transition: 'all 0.15s',
                  borderLeft: item.active ? `3px solid ${C.primary}` : '3px solid transparent',
                }}>
                  <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* 하단 정보 */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.text4, lineHeight: 1.8 }}>
            <p style={{ margin: 0, fontWeight: 600, color: C.text3 }}>음성 메모</p>
            <p style={{ margin: 0 }}>통화 → 녹음 → AI 변환</p>
            <p style={{ margin: 0 }}>CRM 자동 동기화</p>
          </div>
        </div>
      </aside>

      {/* ══ 메인 콘텐츠 ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* 상단 헤더 바 */}
        <header style={{
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: '0 24px',
          height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 80, zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {step !== 'select' && (
              <button onClick={resetToSelect} style={{
                width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
                background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: 4,
              }}>
                <ArrowLeft style={{ width: 16, height: 16, color: C.text2 }} />
              </button>
            )}
            {/* 브레드크럼 */}
            <Link href="/employee" style={{ fontSize: 13, color: C.primary, textDecoration: 'none', fontWeight: 500 }}>영업팀</Link>
            <ChevronRight style={{ width: 14, height: 14, color: C.text4 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>
              {step === 'select' ? '음성 메모' : step === 'record' ? (selected?.name || '녹음') : '메모 완료'}
            </span>
          </div>
          {/* 퀵 버튼들 (상단 네비게이션) */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            <Link href="/employee" style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.surface, color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
                <LayoutDashboard style={{ width: 14, height: 14 }} />
                <span className="hidden sm:inline">대시보드</span>
              </button>
            </Link>
            <Link href="/sales/call" style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.surface, color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
                <Headphones style={{ width: 14, height: 14 }} />
                <span className="hidden sm:inline">전화 영업</span>
              </button>
            </Link>
            <Link href="/sales/voice-memo" style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.primary}`,
                background: '#eef2ff', color: C.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
                <Mic style={{ width: 14, height: 14 }} />
                <span className="hidden sm:inline">음성 메모</span>
              </button>
            </Link>
            <Link href="/sales/pricing-calculator" style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.surface, color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
                <Calculator style={{ width: 14, height: 14 }} />
                <span className="hidden sm:inline">견적 계산기</span>
              </button>
            </Link>
          </div>
        </header>

        {/* 토스트 */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{
                position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
                zIndex: 50, padding: '10px 20px', borderRadius: 24, fontSize: 14, fontWeight: 600,
                background: C.text1, color: '#fff', whiteSpace: 'nowrap',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}
            >{toast}</motion.div>
          )}
        </AnimatePresence>

        {/* PWA 배너 */}
        <AnimatePresence>
          {showInstallBanner && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{
                margin: '12px 24px 0', padding: '12px 16px', borderRadius: 12,
                background: C.primaryBg, border: `1px solid ${C.primaryLight}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
              <Download style={{ width: 18, height: 18, color: C.primary, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text1, margin: 0 }}>홈 화면에 추가</p>
                <p style={{ fontSize: 11, color: C.text3, margin: 0 }}>앱처럼 빠르게 메모를 기록하세요</p>
              </div>
              <button onClick={handleInstall} style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: C.primary, color: '#fff', border: 'none', cursor: 'pointer',
              }}>설치</button>
              <button onClick={() => setShowInstallBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text4 }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ 본문 ══ */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>

          {/* ── STEP 1: 기업 선택 ── */}
          {step === 'select' && (
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
              {/* 상단 타이틀 */}
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: C.text1 }}>음성 메모 녹음</h1>
                <p style={{ fontSize: 15, color: C.text3, margin: 0 }}>통화할 기업을 선택하면 음성 녹음이 시작됩니다. AI가 자동으로 내용을 정리해 CRM에 저장합니다.</p>
              </div>

              {/* 안내 카드 3종 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[
                  { icon: Building2, color: C.green, bg: C.greenBg, title: '① 기업 선택', desc: '아래 목록에서 통화할 기업을 클릭하세요' },
                  { icon: Mic, color: C.red, bg: C.redBg, title: '② 녹음 시작', desc: '빨간 버튼을 누르면 통화 내용이 녹음됩니다' },
                  { icon: Sparkles, color: C.purple, bg: C.purpleBg, title: '③ AI 정리', desc: 'AI가 핵심 내용을 요약해 CRM에 자동 저장합니다' },
                ].map(({ icon: Icon, color, bg, title, desc }) => (
                  <div key={title} style={{
                    padding: '16px', borderRadius: 12,
                    background: bg, border: `1px solid ${color}20`,
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon style={{ width: 18, height: 18, color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.text1, margin: '0 0 3px' }}>{title}</p>
                      <p style={{ fontSize: 12, color: C.text3, margin: 0, lineHeight: 1.5 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 검색 */}
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: '6px 16px',
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
              }}>
                <Search style={{ width: 18, height: 18, color: C.text4, flexShrink: 0 }} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="기업명, 전화번호, 담당자 이름으로 검색"
                  style={{
                    flex: 1, border: 'none', outline: 'none', fontSize: 15, color: C.text1,
                    background: 'transparent', fontFamily: 'inherit', padding: '10px 0',
                  }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text4 }}>
                    <X style={{ width: 16, height: 16 }} />
                  </button>
                )}
              </div>

              {/* 기업 수 표시 */}
              <p style={{ fontSize: 13, color: C.text3, margin: '0 0 12px', fontWeight: 500 }}>
                {search ? `"${search}" 검색 결과 ${filtered.length}개` : `전체 ${filtered.length}개 기업`}
              </p>

              {/* 기업 목록 — 2컬럼 그리드 (PC) */}
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Search style={{ width: 40, height: 40, margin: '0 auto 12px', color: C.text4, display: 'block' }} />
                  <p style={{ fontSize: 16, fontWeight: 600, color: C.text2 }}>검색 결과가 없습니다</p>
                  <p style={{ fontSize: 14, color: C.text3 }}>다른 키워드로 검색해보세요</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 10 }}>
                  {filtered.map(co => (
                    <CompanyCard
                      key={co.id} co={co} selected={false}
                      onClick={() => handleSelect(co)}
                      lastCallDate={lastCallMap[co.id]}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: 녹음 ── */}
          {step === 'record' && selected && (
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              {/* 기업 정보 카드 */}
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 16, padding: '20px 24px', marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: C.divider, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Building2 style={{ width: 26, height: 26, color: C.text3 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selected.name}</h2>
                      {selected.storeCount > 0 && (
                        <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: C.divider, color: C.text3, fontWeight: 500 }}>
                          {selected.storeCount.toLocaleString()}개점
                        </span>
                      )}
                    </div>
                    {selected.biz && <p style={{ fontSize: 13, color: C.text3, margin: '4px 0 0' }}>{selected.biz}</p>}
                  </div>
                  {selected.contactName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: C.divider }}>
                      <User style={{ width: 14, height: 14, color: C.text3 }} />
                      <span style={{ fontSize: 14, fontWeight: 500, color: C.text2 }}>{selected.contactName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 두 컬럼 레이아웃 (PC: 좌/우, 모바일: 상/하) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

                {/* 왼쪽: 전화번호 + 통화 결과 + 빠른 메모 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* 전화번호 */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.text3, margin: '0 0 12px', letterSpacing: '0.05em' }}>전화번호</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {getPhoneList(selected).map((p, i) => (
                        <a key={i} href={`tel:${cleanPhone(p.phone)}`}
                          onClick={() => setCallResult('connected')}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 16px', borderRadius: 10, textDecoration: 'none',
                            background: p.isPrimary ? C.greenBg : C.divider,
                            border: `1px solid ${p.isPrimary ? C.greenLight : C.border}`,
                          }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                            background: p.isPrimary ? C.green : C.text3,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Phone style={{ width: 15, height: 15, color: '#fff' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 11, color: p.isPrimary ? C.green : C.text3, margin: 0, fontWeight: 500 }}>{p.label}</p>
                            <p style={{ fontSize: 16, fontWeight: 600, color: C.text1, margin: '2px 0 0', fontFamily: 'monospace' }}>{p.phone}</p>
                          </div>
                          <span style={{
                            padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                            background: p.isPrimary ? C.green : C.text2, color: '#fff',
                          }}>📞 전화</span>
                        </a>
                      ))}
                      {getPhoneList(selected).length === 0 && (
                        <p style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: C.text4, margin: 0 }}>등록된 전화번호가 없습니다</p>
                      )}
                    </div>
                  </div>

                  {/* 통화 결과 */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.text3, margin: '0 0 12px', letterSpacing: '0.05em' }}>통화 결과</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {([
                        { k: 'connected' as const, l: '연결됨', color: C.green, bg: C.greenBg },
                        { k: 'no_answer' as const, l: '부재중', color: C.amber, bg: C.amberBg },
                        { k: 'callback' as const, l: '콜백예정', color: C.primary, bg: C.primaryBg },
                      ]).map(r => (
                        <button key={r.k} onClick={() => setCallResult(r.k)} style={{
                          padding: '12px 0', border: `1.5px solid ${callResult === r.k ? r.color : C.border}`,
                          borderRadius: 10, cursor: 'pointer',
                          background: callResult === r.k ? r.bg : C.surface,
                          color: callResult === r.k ? r.color : C.text3,
                          fontSize: 13, fontWeight: callResult === r.k ? 700 : 400,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          transition: 'all 0.15s',
                        }}>
                          {callResult === r.k && <Check style={{ width: 14, height: 14 }} />}
                          {r.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 빠른 메모 */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
                    <button onClick={() => setShowQuickMemo(!showQuickMemo)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    }}>
                      <Edit3 style={{ width: 16, height: 16, color: showQuickMemo ? C.primary : C.text3 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: showQuickMemo ? C.primary : C.text3 }}>
                        빠른 메모 {quickMemo && '✓'}
                      </span>
                      {showQuickMemo ? <ChevronUp style={{ width: 14, height: 14, marginLeft: 'auto', color: C.text4 }} /> : <ChevronDown style={{ width: 14, height: 14, marginLeft: 'auto', color: C.text4 }} />}
                    </button>
                    <AnimatePresence>
                      {showQuickMemo && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                          <textarea
                            value={quickMemo} onChange={e => setQuickMemo(e.target.value)}
                            placeholder="통화 핵심 키워드를 메모하세요"
                            rows={3} autoFocus
                            style={{
                              width: '100%', marginTop: 12, padding: '12px', borderRadius: 8, fontSize: 14,
                              resize: 'none', background: C.divider, border: 'none', color: C.text1,
                              outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box',
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 이전 상담 메모 */}
                  {selected.callNote && (
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: C.text3, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.05em' }}>
                        <MessageSquare style={{ width: 13, height: 13 }} /> 이전 상담 메모
                      </p>
                      <p style={{ fontSize: 14, color: C.text2, margin: 0, lineHeight: 1.7 }}>{selected.callNote}</p>
                    </div>
                  )}
                </div>

                {/* 오른쪽: 녹음 패널 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* 녹음 메인 카드 */}
                  <div style={{
                    background: C.surface, border: `2px solid ${isRecording ? C.red : C.border}`,
                    borderRadius: 16, padding: '32px 24px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    transition: 'border-color 0.3s',
                  }}>
                    {/* 파형 */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3, height: 56, marginBottom: 20, width: '100%' }}>
                      {waveformData.map((v, i) => (
                        <motion.div key={i}
                          style={{
                            width: 4, borderRadius: 2,
                            background: isRecording
                              ? `hsl(${355 - (v / 8)}, 80%, 55%)`
                              : C.border,
                          }}
                          animate={{ height: isRecording ? Math.max(4, v / 4) : 4 }}
                          transition={{ duration: 0.05 }}
                        />
                      ))}
                    </div>

                    {/* 타이머 */}
                    <div style={{
                      fontSize: 52, fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      color: isRecording ? C.red : C.text4,
                      letterSpacing: '0.03em', lineHeight: 1,
                      marginBottom: 8,
                    }}>
                      {fmtTime(elapsed)}
                    </div>
                    <p style={{ fontSize: 14, color: isRecording ? C.red : C.text4, margin: '0 0 28px', fontWeight: isRecording ? 600 : 400 }}>
                      {isRecording ? '● 녹음 중' : '녹음 대기'}
                    </p>

                    {/* 녹음 버튼 */}
                    <motion.button
                      onClick={isRecording ? stopRecording : startRecording}
                      whileTap={{ scale: 0.93 }}
                      style={{
                        width: 88, height: 88, borderRadius: '50%',
                        border: `4px solid ${isRecording ? C.red + '30' : C.border}`,
                        cursor: 'pointer',
                        background: isRecording
                          ? 'linear-gradient(135deg, #DC2626, #EF4444)'
                          : 'linear-gradient(135deg, #DC2626, #EF4444)',
                        boxShadow: isRecording ? '0 0 0 12px rgba(220,38,38,0.12)' : '0 4px 16px rgba(220,38,38,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      {isRecording && (
                        <motion.div
                          style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `2px solid ${C.red}30` }}
                          animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.3 }}
                        />
                      )}
                      {isRecording
                        ? <Square style={{ width: 28, height: 28, color: '#fff', fill: '#fff' }} />
                        : <Mic style={{ width: 34, height: 34, color: '#fff' }} />}
                    </motion.button>

                    <p style={{ fontSize: 13, color: C.text3, marginTop: 18, textAlign: 'center' }}>
                      {isRecording ? '버튼을 클릭하면 녹음이 종료됩니다' : '버튼을 클릭하면 녹음이 시작됩니다'}
                    </p>
                  </div>

                  {/* 이전 녹음 내역 */}
                  {companyRecordings.length > 0 && (
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
                      <button onClick={() => setShowHistory(!showHistory)} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      }}>
                        <Clock style={{ width: 15, height: 15, color: C.text3 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text2 }}>이전 녹음 {companyRecordings.length}건</span>
                        {showHistory ? <ChevronUp style={{ width: 14, height: 14, marginLeft: 'auto', color: C.text4 }} /> : <ChevronDown style={{ width: 14, height: 14, marginLeft: 'auto', color: C.text4 }} />}
                      </button>
                      <AnimatePresence>
                        {showHistory && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {companyRecordings.slice(0, 5).map(rec => (
                                <div key={rec.id} style={{
                                  display: 'flex', alignItems: 'flex-start', gap: 10,
                                  padding: '10px 12px', borderRadius: 10, background: C.divider,
                                }}>
                                  <div style={{
                                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                                    background: rec.sttStatus === 'completed' ? C.green : C.amber,
                                  }} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 13, color: C.text2, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {rec.transcriptSummary || rec.transcript?.slice(0, 50) || '변환 중…'}
                                    </p>
                                    <p style={{ fontSize: 11, color: C.text4, margin: '3px 0 0' }}>
                                      {new Date(rec.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      {' · '}{formatDuration(rec.durationSeconds)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: 결과 ── */}
          {step === 'result' && selected && (
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              {/* 상태 표시 */}
              <div style={{ textAlign: 'center', padding: '40px 0 32px' }}>
                {sttStatus === 'processing' && (
                  <div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      style={{ width: 56, height: 56, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <RefreshCw style={{ width: 36, height: 36, color: C.primary }} />
                    </motion.div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text1, margin: '0 0 6px' }}>AI가 내용을 정리하고 있습니다</h2>
                    <p style={{ fontSize: 14, color: C.text3, margin: 0 }}>음성을 텍스트로 변환하고 핵심 내용을 요약합니다 (보통 10~30초)</p>
                  </div>
                )}
                {sttStatus === 'completed' && (
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                      background: C.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check style={{ width: 32, height: 32, color: C.green }} />
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text1, margin: '0 0 6px' }}>메모가 저장되었습니다</h2>
                    <p style={{ fontSize: 14, color: C.text3, margin: 0 }}>AI 요약 내용이 CRM에 자동으로 업데이트되었습니다</p>
                  </motion.div>
                )}
                {sttStatus === 'failed' && (
                  <div>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                      background: C.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <MicOff style={{ width: 32, height: 32, color: C.red }} />
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text1, margin: '0 0 6px' }}>변환에 실패했습니다</h2>
                    <p style={{ fontSize: 14, color: C.text3, margin: 0 }}>다시 시도해 주세요</p>
                  </div>
                )}
              </div>

              {/* 결과 카드 */}
              {lastRecording && sttStatus === 'completed' && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px', marginBottom: 20 }}
                >
                  {/* 헤더 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Building2 style={{ width: 20, height: 20, color: C.text3 }} />
                      <span style={{ fontSize: 18, fontWeight: 700 }}>{selected.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(() => { const rs = resultStyle(callResult); return (
                        <span style={{
                          fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 600,
                          background: rs.bg, color: rs.color,
                        }}>{rs.label}</span>
                      ); })()}
                      <span style={{
                        fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500,
                        background: C.divider, color: C.text3,
                      }}>🕐 {formatDuration(lastRecording.durationSeconds)}</span>
                    </div>
                  </div>

                  {/* AI 요약 */}
                  {lastRecording.transcriptSummary && (
                    <div style={{ padding: '16px 20px', borderRadius: 12, marginBottom: 16, background: C.purpleBg, border: `1px solid ${C.purple}20` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <Sparkles style={{ width: 15, height: 15, color: C.purple }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.purple }}>AI 요약</span>
                      </div>
                      <p style={{ fontSize: 15, lineHeight: 1.75, color: C.text1, margin: 0 }}>{lastRecording.transcriptSummary}</p>
                    </div>
                  )}

                  {/* 전문 */}
                  {lastRecording.transcript && (
                    <details>
                      <summary style={{ fontSize: 13, fontWeight: 600, color: C.primary, cursor: 'pointer', padding: '8px 0', userSelect: 'none' }}>
                        📄 전체 녹취 내용 보기
                      </summary>
                      <div style={{
                        fontSize: 14, lineHeight: 1.75, padding: '16px', borderRadius: 10, marginTop: 8,
                        background: C.divider, color: C.text2,
                        whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                      }}>{lastRecording.transcript}</div>
                    </details>
                  )}
                </motion.div>
              )}

              {/* 다음 액션 버튼 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button onClick={() => { setStep('record'); setSttStatus('idle'); setLastRecording(null); setElapsed(0); }}
                  style={{
                    padding: '16px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: C.primary, color: '#fff',
                    fontSize: 15, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  <Mic style={{ width: 18, height: 18 }} /> 추가 녹음
                </button>
                <button onClick={resetToSelect}
                  style={{
                    padding: '16px 0', borderRadius: 12,
                    background: C.surface, border: `1px solid ${C.border}`, cursor: 'pointer',
                    color: C.text2, fontSize: 15, fontWeight: 500,
                  }}>
                  다른 기업 선택
                </button>
              </div>
            </div>
          )}
        </main>

        {/* ══ 하단 탭바 (모바일 전용) ══ */}
        <nav className="flex md:hidden" style={{
          position: 'sticky', bottom: 0,
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
          <div style={{ display: 'flex', width: '100%' }}>
            {NAV.map(item => {
              const Icon = item.icon;
              const isActive = item.active;
              return (
                <Link key={item.href} href={item.href} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 3, textDecoration: 'none', padding: '10px 4px',
                  position: 'relative',
                }}>
                  {isActive && (
                    <div style={{
                      position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                      width: 24, height: 3, borderRadius: 2, background: C.primary,
                    }} />
                  )}
                  <Icon style={{ width: 22, height: 22, color: isActive ? C.primary : C.text4, strokeWidth: isActive ? 2.2 : 1.8 }} />
                  <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, color: isActive ? C.primary : C.text4 }}>
                    {item.label.split(' ')[0]}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
