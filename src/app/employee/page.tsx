'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, TrendingUp, Bot, Phone, LayoutGrid, Ticket, Download, Upload, AlertTriangle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PIPELINE, STATUS_LABEL, STATUS_COLOR, STATUS_TEXT, store, Company } from '@/lib/mockStore';
import SlidePanel from '@/components/crm/SlidePanel';
import KanbanBoard from '@/components/crm/KanbanBoard';
import SalesDashboard from '@/components/crm/SalesDashboard';
import ContractEmailTemplate from '@/components/crm/ContractEmailTemplate';
import { useRequireAuth } from '@/lib/AuthContext';
import { useEmployeeCRM } from '@/hooks/useEmployeeCRM';
import { useExcelImportExport } from '@/hooks/useExcelImportExport';
import { T } from '@/components/employee/shared';
import AutoSettingsPanel from '@/components/employee/AutoSettingsPanel';
import InvitePanel from '@/components/employee/InvitePanel';
import ExcelUploadModal from '@/components/employee/ExcelUploadModal';
import AddCompanyModal from '@/components/employee/AddCompanyModal';
import PhoneView from '@/components/employee/PhoneView';
import TableView from '@/components/employee/TableView';

export default function EmployeePage() {
    const { loading: authLoading, authorized } = useRequireAuth(['super_admin', 'admin', 'sales']);
    const crm = useEmployeeCRM();
    const excel = useExcelImportExport(crm.companies, crm.refresh, crm.showToast);

    const [showAutoPanel, setShowAutoPanel] = useState(false);
    const [showInvitePanel, setShowInvitePanel] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    
    const [phoneIdx, setPhoneIdx] = useState(0);
    const [panelCompany, setPanelCompany] = useState<Company | null>(null);
    const [contractModal, setContractModal] = useState<Company | null>(null);

    if (authLoading || !authorized) return null;

    const filtered = crm.companies.filter(c => {
        const q = crm.search.toLowerCase();
        return (c.name.includes(q) || c.biz.includes(q) || c.email.includes(q) || c.phone.includes(q))
            && (crm.filterStatus === 'all' || c.status === crm.filterStatus);
    });
    const counts = Object.fromEntries(PIPELINE.map(s => [s, crm.companies.filter(c => c.status === s).length]));
    const needsAction = crm.companies.filter(c => ['analyzed', 'lawyer_confirmed', 'client_replied'].includes(c.status));

    return (
        <div className="min-h-screen px-3 sm:px-4 py-4 sm:py-8 max-w-[1600px] mx-auto" style={{ background: T.bg }}>
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div>
                        <h1 className="text-lg sm:text-2xl font-black" style={{ color: T.heading }}>{crm.isAdmin ? '⚙️ 관리자 CRM' : '📊 영업팀 CRM'}</h1>
                        <p className="text-xs sm:text-sm mt-0.5" style={{ color: T.muted }}>총 {crm.companies.length}개 기업</p>
                    </div>
                    <div className="sm:hidden">
                        <Button variant="premium" size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /></Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {(['table', 'phone', 'kanban'] as const).map(mode => {
                        const icons = { table: <Search className="w-3.5 h-3.5" />, phone: <Phone className="w-3.5 h-3.5" />, kanban: <LayoutGrid className="w-3.5 h-3.5" /> };
                        const labels = { table: '테이블', phone: '전화', kanban: '칸반' };
                        const active = crm.viewMode === mode;
                        return (
                            <button key={mode} onClick={() => crm.setViewMode(mode)}
                                className="flex items-center gap-1 sm:gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all"
                                style={{ background: active ? '#eff6ff' : T.card, color: active ? '#2563eb' : T.sub, border: `1px solid ${active ? '#93c5fd' : T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                {icons[mode]}<span className="hidden xs:inline sm:inline">{labels[mode]}</span>
                            </button>
                        );
                    })}
                    <button onClick={() => setShowDashboard(p => !p)}
                        className="flex items-center gap-1 sm:gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all"
                        style={{ background: showDashboard ? '#fffbeb' : T.card, color: showDashboard ? '#b8960a' : T.sub, border: `1px solid ${showDashboard ? '#fde68a' : T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                        <TrendingUp className="w-3.5 h-3.5" /><span className="hidden sm:inline">성과</span>
                    </button>
                    {crm.isAdmin && (
                        <>
                            <button onClick={() => setShowAutoPanel(p => !p)}
                                className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                                style={{ background: showAutoPanel ? '#f0fdf4' : T.card, color: showAutoPanel ? '#16a34a' : T.sub, border: `1px solid ${showAutoPanel ? '#86efac' : T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                <Bot className="w-3.5 h-3.5" /> 자동화
                                {crm.autoLogs.length > 0 && <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-black" style={{ background: '#dcfce7', color: '#16a34a' }}>{crm.autoLogs.length}</span>}
                            </button>
                            <button onClick={() => setShowInvitePanel(p => !p)}
                                className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                                style={{ background: showInvitePanel ? '#fef3c7' : T.card, color: showInvitePanel ? '#92400e' : T.sub, border: `1px solid ${showInvitePanel ? '#fde68a' : T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                <Ticket className="w-3.5 h-3.5" /> 초대
                            </button>
                            <button onClick={() => { store.reset(); crm.refresh(); }}
                                className="hidden sm:block text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                                style={{ background: T.card, color: T.muted, border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                초기화
                            </button>
                            <button onClick={excel.handleExcelDownload}
                                className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                                style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                <Download className="w-3.5 h-3.5" /> Excel
                            </button>
                            <button onClick={() => excel.fileInputRef.current?.click()}
                                className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                                style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #93c5fd', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                <Upload className="w-3.5 h-3.5" /> 업로드
                            </button>
                            <input ref={excel.fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={excel.handleExcelFile} />
                        </>
                    )}
                    <div className="hidden sm:block">
                        <Button variant="premium" size="sm" onClick={() => setShowAdd(true)}>
                            <Plus className="w-4 h-4 mr-1" /> 기업 등록
                        </Button>
                    </div>
                </div>
            </div>

            {/* Panels */}
            {crm.isAdmin && <AnimatePresence>{showAutoPanel && <AutoSettingsPanel autoSettings={crm.autoSettings} autoLogs={crm.autoLogs} updateAuto={crm.updateAuto} clearLogs={crm.clearLogs} />}</AnimatePresence>}
            {crm.isAdmin && <AnimatePresence>{showInvitePanel && <InvitePanel />}</AnimatePresence>}

            {/* Action Banners & Filters */}
            {needsAction.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                    <div className="rounded-xl p-4" style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4" style={{ color: '#dc2626' }} />
                            <p className="text-sm font-black" style={{ color: '#dc2626' }}>조치 필요 — {needsAction.length}건</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {needsAction.map(c => (
                                <span key={c.id} className="text-xs px-2.5 py-1 rounded-full font-bold"
                                    style={{ background: STATUS_COLOR[c.status], color: STATUS_TEXT[c.status] }}>
                                    {c.name} · {STATUS_LABEL[c.status]}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="mb-5 overflow-x-auto pb-1">
                <div className="flex gap-2 min-w-max">
                    <button onClick={() => crm.setFilterStatus('all')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                        style={{ background: crm.filterStatus === 'all' ? '#fffbeb' : T.card, border: `1px solid ${crm.filterStatus === 'all' ? '#fde68a' : T.border}`, color: crm.filterStatus === 'all' ? '#b8960a' : T.sub }}>
                        전체 <span>{crm.companies.length}</span>
                    </button>
                    {PIPELINE.map(s => (
                        <button key={s} onClick={() => crm.setFilterStatus(s)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                            style={{ background: crm.filterStatus === s ? STATUS_COLOR[s] : T.card, border: `1px solid ${crm.filterStatus === s ? STATUS_TEXT[s] + '60' : T.border}`, color: crm.filterStatus === s ? STATUS_TEXT[s] : T.sub }}>
                            {STATUS_LABEL[s]} <span>{counts[s] ?? 0}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.faint }} />
                <input value={crm.search} onChange={e => crm.setSearch(e.target.value)}
                    placeholder="기업명, 사업자번호, 이메일, 전화번호 검색..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: T.card, border: `1px solid ${T.border}`, color: T.body, outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
            </div>

            <AnimatePresence>{showDashboard && <SalesDashboard companies={crm.companies} logs={crm.autoLogs} />}</AnimatePresence>

            {/* main views */}
            {crm.viewMode === 'phone' ? (
                <PhoneView filtered={filtered} phoneIdx={phoneIdx} setPhoneIdx={setPhoneIdx} autoSettings={crm.autoSettings} refresh={crm.refresh} showToast={crm.showToast} setContractModal={setContractModal} />
            ) : crm.viewMode === 'kanban' ? (
                <KanbanBoard companies={filtered} onCardClick={setPanelCompany} />
            ) : (
                <TableView filtered={filtered} setPanelCompany={setPanelCompany} refresh={crm.refresh} />
            )}

            {/* Modals & Overlays */}
            <AnimatePresence>
                {excel.showExcelUpload && <ExcelUploadModal excelPreview={excel.excelPreview} excelUploading={excel.excelUploading} onClose={() => { excel.setShowExcelUpload(false); excel.setExcelPreview([]); }} onImport={excel.handleExcelImport} />}
                {showAdd && <AddCompanyModal onClose={() => setShowAdd(false)} refresh={crm.refresh} />}
                {panelCompany && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={() => setPanelCompany(null)} />
                        <SlidePanel company={panelCompany} onClose={() => setPanelCompany(null)} onUpdate={() => { crm.refresh(); const updated = store.getById(panelCompany.id); if (updated) setPanelCompany(updated); }} />
                    </>
                )}
                {contractModal && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setContractModal(null)}>
                        <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }} className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl" style={{ background: '#ffffff', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <h2 className="text-sm font-black" style={{ color: T.heading }}>📧 계약서 이메일 미리보기</h2>
                                <button onClick={() => setContractModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" style={{ color: T.muted }} /></button>
                            </div>
                            <div className="p-6"><ContractEmailTemplate company={contractModal} plan="standard" /></div>
                            <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #e5e7eb', background: '#f8f9fc' }}>
                                <Button variant="ghost" className="flex-1" onClick={() => setContractModal(null)}>취소</Button>
                                <Button variant="premium" className="flex-1" onClick={() => { store.sendContract(contractModal.id, 'email'); crm.refresh(); crm.showToast(`📧 ${contractModal.name}에 계약서가 발송되었습니다`); setContractModal(null); }}>
                                    <Send className="w-4 h-4 mr-1" /> 발송 확인
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                {crm.toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-xl text-sm font-bold"
                        style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#e8c87a', boxShadow: '0 12px 40px rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,76,0.3)' }}>
                        {crm.toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
