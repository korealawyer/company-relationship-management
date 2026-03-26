'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Company } from '@/lib/types';
import { useCompanies } from '@/hooks/useDataLayer';
import { CallRecordingStore, type CallRecording } from '@/lib/callRecordingService';
import type { Step } from './_constants';
import { getPhoneList } from './_utils/helpers';
import { useRecording } from './_utils/useRecording';
import SidebarNav from './_components/SidebarNav';
import MobileTabBar from './_components/MobileTabBar';
import PageHeader from './_components/PageHeader';
import ToastNotification from './_components/ToastNotification';
import { CompanyList } from './_components/CompanyList';
import RecordPanel from './_components/RecordPanel';
import ResultPanel from './_components/ResultPanel';

export default function VoiceMemoPage() {
  const [step, setStep] = useState<Step>('select');
  const { companies, mutate: mutateCompanies } = useCompanies();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Company | null>(null);
  const [callResult, setCallResult] = useState<'connected' | 'no_answer' | 'callback'>('connected');
  const [toast, setToast] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [quickMemo, setQuickMemo] = useState('');
  const [showQuickMemo, setShowQuickMemo] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [recentRecordings, setRecentRecordings] = useState<CallRecording[]>([]);

  const refresh = useCallback(async () => {
    await mutateCompanies();
    setRecentRecordings(CallRecordingStore.getRecent(20));
  }, [mutateCompanies]);

  const { isRecording, elapsed, waveformData, sttStatus, lastRecording, startRecording, stopRecording, resetRecording } =
    useRecording(selected, quickMemo, callResult, setToast, setStep, refresh);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);
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
      c.name.toLowerCase().includes(q) || c.biz.includes(q) ||
      (c.contactName || '').includes(q) || (c.contactPhone || '').includes(q) || (c.phone || '').includes(q)
    ).slice(0, 50);
  }, [companies, search]);

  const handleSelect = (co: Company) => {
    setSelected(co); setStep('record');
    resetRecording(); setShowHistory(false); setQuickMemo(''); setShowQuickMemo(false);
  };

  const resetToSelect = () => {
    setStep('select'); setSelected(null); resetRecording();
    setShowHistory(false); setQuickMemo(''); setShowQuickMemo(false); refresh();
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setToast('홈 화면에 설치되었습니다');
    setInstallPrompt(null); setShowInstallBanner(false);
  };

  const companyRecordings = useMemo(
    () => selected ? recentRecordings.filter(r => r.companyId === selected.id) : [],
    [selected, recentRecordings],
  );

  const lastCallMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const rec of recentRecordings)
      if (!map[rec.companyId])
        map[rec.companyId] = new Date(rec.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    return map;
  }, [recentRecordings]);

  return (
    <div style={{
      minHeight: 'calc(100dvh - 80px)', background: '#F0F2F5',
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', -apple-system, sans-serif",
      display: 'flex', color: '#111827',
    }}>
      <SidebarNav />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <PageHeader step={step} selectedName={selected?.name} onBack={resetToSelect} />
        <ToastNotification
          toast={toast} showInstallBanner={showInstallBanner}
          onInstall={handleInstall} onDismissBanner={() => setShowInstallBanner(false)}
        />
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {step === 'select' && (
            <CompanyList
              filtered={filtered} search={search} setSearch={setSearch}
              lastCallMap={lastCallMap} onSelect={handleSelect}
            />
          )}
          {step === 'record' && selected && (
            <RecordPanel
              selected={selected} isRecording={isRecording} elapsed={elapsed}
              waveformData={waveformData} callResult={callResult} setCallResult={setCallResult}
              quickMemo={quickMemo} setQuickMemo={setQuickMemo}
              showQuickMemo={showQuickMemo} setShowQuickMemo={setShowQuickMemo}
              showHistory={showHistory} setShowHistory={setShowHistory}
              companyRecordings={companyRecordings}
              onStart={startRecording} onStop={stopRecording} getPhoneList={getPhoneList}
            />
          )}
          {step === 'result' && selected && (
            <ResultPanel
              selected={selected} sttStatus={sttStatus} lastRecording={lastRecording}
              callResult={callResult}
              onReRecord={() => { setStep('record'); resetRecording(); }}
              onReset={resetToSelect}
            />
          )}
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}
