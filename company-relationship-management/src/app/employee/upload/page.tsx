'use client';
import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, FileSpreadsheet, CheckCircle2, X, AlertTriangle,
    ArrowLeft, Trash2, Download, Eye, RefreshCw,
} from 'lucide-react';
import { leadStore, Lead, LeadStatus } from '@/lib/leadStore';

// ── 색상 시스템 ────────────────────────────────────────────────
const T = {
    heading: '#0f172a', body: '#1e293b', sub: '#475569',
    muted: '#64748b', faint: '#94a3b8',
    border: '#d1d5db', borderSub: '#e5e7eb',
    bg: '#f8f9fc', card: '#ffffff',
};

interface ParsedRow {
    companyName: string;
    bizNumber: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    storeCount: number;
    bizType: string;
    bizCategory: string;
    domain: string;
    privacyUrl: string;
    valid: boolean;
    error?: string;
    warning?: string;
}

const REQUIRED_HEADERS = ['회사명', '사업자번호', '담당자명', '이메일', '전화번호', '가맹점수', '업종', '사업형태', '도메인', '개인정보처리방침URL'];
const SAMPLE_CSV = `회사명,사업자번호,담당자명,이메일,전화번호,가맹점수,업종,사업형태,도메인,개인정보처리방침URL
(주)샐러디,123-45-67890,김마케팅,kim@salady.co.kr,010-1234-5678,180,외식,프랜차이즈,salady.co.kr,https://salady.co.kr/privacy
(주)메가커피,234-56-78901,이운영,lee@megacoffee.co.kr,010-2345-6789,2800,카페,프랜차이즈,megacoffee.co.kr,https://megacoffee.co.kr/privacy`;

export default function UploadPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
    const [uploadResult, setUploadResult] = useState<{ total: number; valid: number } | null>(null);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

    // ── CSV 파싱 ──────────────────────────────────────────────
    const parseCSV = useCallback((text: string) => {
        try {
            const lines = text.split(/\r?\n/).filter(Boolean);
            if (lines.length < 2) {
                setError('데이터가 없습니다. 헤더 행과 최소 1개의 데이터 행이 필요합니다.');
                return;
            }

            const headerLine = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            setHeaders(headerLine);

            // 1차: 기본 파싱
            const rows: ParsedRow[] = lines.slice(1).map(line => {
                const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                const companyName = cols[0] ?? '';
                const bizNumber = cols[1] ?? '';
                const storeCount = parseInt(cols[5]) || 0;
                const errors: string[] = [];
                if (!companyName) errors.push('회사명 부재');
                if (!bizNumber) errors.push('사업자번호 부재');
                const valid = errors.length === 0;

                return {
                    companyName,
                    bizNumber,
                    contactName: cols[2] ?? '',
                    contactEmail: cols[3] ?? '',
                    contactPhone: cols[4] ?? '',
                    storeCount,
                    bizType: cols[6] ?? '기타',
                    bizCategory: cols[7] ?? '',
                    domain: cols[8] ?? '',
                    privacyUrl: cols[9] ?? '',
                    valid,
                    error: valid ? undefined : errors.join(', '),
                    warning: undefined as string | undefined,
                };
            });

            // 2차: 중복 & 사업형태 경고 체크
            const seenBizNumbers = new Map<string, number>();
            const seenNames = new Map<string, number>();
            rows.forEach((row, i) => {
                if (!row.valid) return;
                const warnings: string[] = [];
                // 사업자번호 중복 체크
                if (row.bizNumber) {
                    const prev = seenBizNumbers.get(row.bizNumber);
                    if (prev !== undefined) {
                        warnings.push(`사업자번호 중복 (#${prev + 1}행)`);
                    } else {
                        seenBizNumbers.set(row.bizNumber, i);
                    }
                }
                // 회사명 중복 체크
                if (row.companyName) {
                    const prev = seenNames.get(row.companyName);
                    if (prev !== undefined) {
                        warnings.push(`회사명 중복 (#${prev + 1}행)`);
                    } else {
                        seenNames.set(row.companyName, i);
                    }
                }
                // 사업형태 비어있거나 공백
                if (!row.bizCategory || !row.bizCategory.trim()) {
                    warnings.push('사업형태 미입력');
                }
                if (warnings.length > 0) {
                    row.warning = warnings.join(', ');
                }
            });

            setParsedRows(rows);
            // valid이고 warning이 없는 행만 기본 선택
            setSelectedRows(new Set(rows.map((_, i) => i).filter(i => rows[i].valid && !rows[i].warning)));
            setStep('preview');
            setError(null);
        } catch {
            setError('파일 파싱 오류. CSV 형식을 확인해주세요.');
        }
    }, []);

    // ── 파일 처리 ──────────────────────────────────────────────
    const handleFile = useCallback((file: File) => {
        if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
            setError('CSV 또는 TXT 파일만 지원됩니다.');
            return;
        }
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            parseCSV(text);
        };
        reader.readAsText(file, 'UTF-8');
    }, [parseCSV]);

    // ── 드래그 앤 드롭 ────────────────────────────────────────
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = '';
    }, [handleFile]);

    // ── 업로드 실행 ──────────────────────────────────────────
    const handleUpload = useCallback(() => {
        const validRows = parsedRows.filter((_, i) => selectedRows.has(i));
        if (validRows.length === 0) {
            setError('업로드할 유효한 데이터가 없습니다.');
            return;
        }

        const now = new Date().toISOString();
        const genId = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        const newLeads: Lead[] = validRows.map(r => ({
            id: genId('lead'),
            companyName: r.companyName,
            domain: r.domain,
            privacyUrl: r.privacyUrl,
            contactName: r.contactName,
            contactEmail: r.contactEmail,
            contactPhone: r.contactPhone,
            contacts: [],
            storeCount: r.storeCount,
            bizType: r.bizType,
            bizNumber: r.bizNumber,
            bizCategory: r.bizCategory || undefined,
            riskScore: 0,
            riskLevel: '' as const,
            issueCount: 0,
            status: 'pending' as LeadStatus,
            memos: [],
            timeline: [{
                id: genId('t'),
                createdAt: now,
                author: '시스템',
                type: 'status_change' as const,
                content: 'CSV 대량 업로드',
                toStatus: 'pending' as LeadStatus,
            }],
            createdAt: now,
            updatedAt: now,
            source: 'excel' as const,
        }));

        const existing = leadStore.getAll();
        localStorage.setItem('ibs_leads_v1', JSON.stringify([...newLeads, ...existing]));

        setUploadResult({ total: parsedRows.length, valid: validRows.length });
        setStep('done');
    }, [parsedRows, selectedRows]);

    // ── 샘플 다운로드 ────────────────────────────────────────
    const handleSampleDownload = () => {
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_leads.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── 초기화 ────────────────────────────────────────────────
    const reset = () => {
        setStep('upload');
        setParsedRows([]);
        setHeaders([]);
        setFileName(null);
        setError(null);
        setUploadResult(null);
        setSelectedRows(new Set());
    };

    const validCount = parsedRows.filter((_, i) => selectedRows.has(i)).length;
    const invalidCount = parsedRows.filter(r => !r.valid).length;
    const warningCount = parsedRows.filter(r => r.valid && !!r.warning).length;
    const problemRows = parsedRows.filter(r => !r.valid || !!r.warning);

    const downloadErrorCSV = () => {
        const bom = '\uFEFF';
        const header = [...REQUIRED_HEADERS, '사유'].join(',');
        const rows = problemRows.map(r => {
            const reason = !r.valid ? `[오류] ${r.error}` : `[경고] ${r.warning}`;
            return [r.companyName, r.bizNumber, r.contactName, r.contactEmail, r.contactPhone, r.storeCount, r.bizType, r.bizCategory, r.domain, r.privacyUrl, reason].join(',');
        });
        const csv = bom + [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `upload_errors_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen" style={{ background: T.bg }}>
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* 헤더 */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.push('/employee')}
                        className="p-2 rounded-xl hover:bg-white transition-colors"
                        style={{ border: `1px solid ${T.border}` }}>
                        <ArrowLeft className="w-5 h-5" style={{ color: T.sub }} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black" style={{ color: T.heading }}>📊 리드 대량 업로드</h1>
                        <p className="text-sm mt-1" style={{ color: T.muted }}>
                            CSV 파일을 업로드하여 리드를 일괄 등록합니다. 업로드 전 데이터를 미리 확인할 수 있습니다.
                        </p>
                    </div>
                </div>

                {/* 단계 표시 */}
                <div className="flex items-center gap-3 mb-8">
                    {[
                        { key: 'upload', label: '1. 파일 선택', icon: Upload },
                        { key: 'preview', label: '2. 데이터 확인', icon: Eye },
                        { key: 'done', label: '3. 업로드 완료', icon: CheckCircle2 },
                    ].map((s, i) => (
                        <React.Fragment key={s.key}>
                            {i > 0 && <div className="w-12 h-0.5" style={{ background: step === s.key || (s.key === 'done' && step === 'done') || (s.key === 'preview' && step !== 'upload') ? '#c9a84c' : T.borderSub }} />}
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
                                style={{
                                    background: step === s.key ? '#fffbeb' : T.card,
                                    border: `1px solid ${step === s.key ? '#fde68a' : T.border}`,
                                    color: step === s.key ? '#b8960a' : T.muted,
                                }}>
                                <s.icon className="w-4 h-4" />
                                {s.label}
                            </div>
                        </React.Fragment>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* STEP 1: 파일 업로드 */}
                    {step === 'upload' && (
                        <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            <div className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                                {/* 드래그 앤 드롭 영역 */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center justify-center py-20 px-8 cursor-pointer transition-all duration-300"
                                    style={{
                                        background: isDragging ? '#fffbeb' : 'transparent',
                                        borderBottom: `2px dashed ${isDragging ? '#fde68a' : T.borderSub}`,
                                    }}>
                                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                                        style={{ background: isDragging ? '#fef3c7' : '#f1f5f9' }}>
                                        <FileSpreadsheet className="w-10 h-10" style={{ color: isDragging ? '#b8960a' : T.faint }} />
                                    </div>
                                    <p className="text-lg font-black mb-2" style={{ color: isDragging ? '#b8960a' : T.heading }}>
                                        {isDragging ? '여기에 파일을 놓으세요' : 'CSV 파일을 드래그하거나 클릭하세요'}
                                    </p>
                                    <p className="text-sm" style={{ color: T.muted }}>
                                        지원 형식: .csv, .txt (UTF-8 인코딩)
                                    </p>
                                    <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleInputChange} />
                                </div>

                                {/* 하단 안내 */}
                                <div className="px-8 py-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <p className="text-sm font-black mb-3" style={{ color: T.heading }}>📋 CSV 파일 형식 안내</p>
                                            <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${T.borderSub}` }}>
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr style={{ background: '#f8f9fc' }}>
                                                            {REQUIRED_HEADERS.map(h => (
                                                                <th key={h} className="px-3 py-2 text-left font-bold whitespace-nowrap" style={{ color: '#b8960a', borderBottom: `1px solid ${T.borderSub}` }}>{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td className="px-3 py-2" style={{ color: T.body, borderBottom: `1px solid ${T.borderSub}` }}>(주)샐러디</td>
                                                            <td className="px-3 py-2" style={{ color: T.body, borderBottom: `1px solid ${T.borderSub}` }}>123-45-67890</td>
                                                            <td className="px-3 py-2" style={{ color: T.body, borderBottom: `1px solid ${T.borderSub}` }}>김마케팅</td>
                                                            <td className="px-3 py-2" style={{ color: T.body, borderBottom: `1px solid ${T.borderSub}` }}>kim@salady.co.kr</td>
                                                            <td className="px-3 py-2" style={{ color: T.body, borderBottom: `1px solid ${T.borderSub}` }}>010-1234-5678</td>
                                                            <td className="px-3 py-2" style={{ color: T.body, borderBottom: `1px solid ${T.borderSub}` }}>180</td>
                                                            <td className="px-3 py-2" style={{ color: T.body, borderBottom: `1px solid ${T.borderSub}` }}>외식</td>
                                                            <td className="px-3 py-2" style={{ color: T.body, borderBottom: `1px solid ${T.borderSub}` }}>프랜차이즈</td>
                                                            <td className="px-3 py-2" style={{ color: T.body, borderBottom: `1px solid ${T.borderSub}` }}>salady.co.kr</td>
                                                            <td className="px-3 py-2" style={{ color: T.body, borderBottom: `1px solid ${T.borderSub}` }}>https://...</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="flex gap-3 mt-4">
                                                <button onClick={handleSampleDownload}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-blue-50"
                                                    style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                                                    <Download className="w-3.5 h-3.5" />
                                                    샘플 CSV 다운로드
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 mt-4 px-4 py-3 rounded-xl"
                                    style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm font-bold">{error}</span>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* STEP 2: 데이터 미리보기 */}
                    {step === 'preview' && (
                        <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            {/* 요약 카드 */}
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1 px-5 py-4 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                                    <p className="text-xs font-bold mb-1" style={{ color: T.muted }}>파일명</p>
                                    <p className="text-sm font-black flex items-center gap-2" style={{ color: T.heading }}>
                                        <FileSpreadsheet className="w-4 h-4" style={{ color: '#b8960a' }} />
                                        {fileName}
                                    </p>
                                </div>
                                <div className="px-5 py-4 rounded-2xl" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                                    <p className="text-xs font-bold mb-1" style={{ color: '#2563eb' }}>전체 행</p>
                                    <p className="text-xl font-black" style={{ color: '#2563eb' }}>{parsedRows.length}</p>
                                </div>
                                <div className="px-5 py-4 rounded-2xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                    <p className="text-xs font-bold mb-1" style={{ color: '#16a34a' }}>유효</p>
                                    <p className="text-xl font-black" style={{ color: '#16a34a' }}>{validCount}</p>
                                </div>
                                {warningCount > 0 && (
                                    <div className="px-5 py-4 rounded-2xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                                        <p className="text-xs font-bold mb-1" style={{ color: '#d97706' }}>경고</p>
                                        <p className="text-xl font-black" style={{ color: '#d97706' }}>{warningCount}</p>
                                    </div>
                                )}
                                {invalidCount > 0 && (
                                    <div className="px-5 py-4 rounded-2xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                                        <p className="text-xs font-bold mb-1" style={{ color: '#dc2626' }}>오류</p>
                                        <p className="text-xl font-black" style={{ color: '#dc2626' }}>{invalidCount}</p>
                                    </div>
                                )}
                            </div>

                            {/* 데이터 테이블 */}
                            <div className="rounded-2xl overflow-hidden mb-6" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                                <div className="overflow-x-auto" style={{ maxHeight: '500px' }}>
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0" style={{ zIndex: 1 }}>
                                            <tr style={{ background: '#f8f9fc', borderBottom: `2px solid ${T.border}` }}>
                                                <th className="py-3 px-3 text-left text-xs font-black whitespace-nowrap" style={{ color: '#b8960a' }}>#</th>
                                                <th className="py-3 px-3 text-left text-xs font-black whitespace-nowrap" style={{ color: '#b8960a' }}>상태</th>
                                                {REQUIRED_HEADERS.map(h => (
                                                    <th key={h} className="py-3 px-3 text-left text-xs font-black whitespace-nowrap" style={{ color: '#b8960a' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedRows.map((row, i) => (
                                                <tr key={i} className="transition-colors hover:bg-slate-50"
                                                    style={{
                                                        borderBottom: `1px solid ${T.borderSub}`,
                                                        opacity: selectedRows.has(i) ? 1 : 0.4,
                                                        background: !row.valid ? '#fef2f220' : row.warning ? '#fffbeb40' : 'transparent',
                                                    }}>
                                                    <td className="py-2.5 px-3">
                                                        <input type="checkbox" checked={selectedRows.has(i)} disabled={!row.valid || !!row.warning}
                                                            onChange={() => {
                                                                const s = new Set(selectedRows);
                                                                s.has(i) ? s.delete(i) : s.add(i);
                                                                setSelectedRows(s);
                                                            }}
                                                            className="rounded" />
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        {!row.valid
                                                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#fef2f2', color: '#dc2626' }}>
                                                                <AlertTriangle className="w-3 h-3" /> {row.error}
                                                            </span>
                                                            : row.warning
                                                                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#fffbeb', color: '#d97706' }}>
                                                                    <AlertTriangle className="w-3 h-3" /> {row.warning}
                                                                </span>
                                                                : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                                                                    <CheckCircle2 className="w-3 h-3" /> 유효
                                                                </span>
                                                        }
                                                    </td>
                                                    <td className="py-2.5 px-3 font-bold" style={{ color: T.body }}>{row.companyName || '—'}</td>
                                                    <td className="py-2.5 px-3 font-mono text-xs" style={{ color: T.sub }}>{row.bizNumber || '—'}</td>
                                                    <td className="py-2.5 px-3" style={{ color: T.sub }}>{row.contactName || '—'}</td>
                                                    <td className="py-2.5 px-3" style={{ color: T.sub }}>{row.contactEmail || '—'}</td>
                                                    <td className="py-2.5 px-3" style={{ color: T.sub }}>{row.contactPhone || '—'}</td>
                                                    <td className="py-2.5 px-3 font-bold" style={{ color: T.body }}>{row.storeCount.toLocaleString()}</td>
                                                    <td className="py-2.5 px-3" style={{ color: T.sub }}>{row.bizType}</td>
                                                    <td className="py-2.5 px-3" style={{ color: T.sub }}>{row.bizCategory || '—'}</td>
                                                    <td className="py-2.5 px-3" style={{ color: T.sub }}>{row.domain || '—'}</td>
                                                    <td className="py-2.5 px-3 text-xs truncate" style={{ color: T.faint, maxWidth: 200 }}>{row.privacyUrl || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 액션 버튼 */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button onClick={reset}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors hover:bg-slate-100"
                                        style={{ background: T.card, border: `1px solid ${T.border}`, color: T.sub }}>
                                        <ArrowLeft className="w-4 h-4" /> 다시 선택
                                    </button>
                                    {problemRows.length > 0 && (
                                        <button onClick={downloadErrorCSV}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors hover:bg-red-50"
                                            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                                            <Download className="w-4 h-4" /> 오류/경고 목록 CSV
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm" style={{ color: T.muted }}>
                                        <strong style={{ color: '#b8960a' }}>{validCount}건</strong> 업로드 예정
                                        {(warningCount + invalidCount) > 0 && (
                                            <span style={{ color: '#dc2626', marginLeft: 8 }}>
                                                ({warningCount + invalidCount}건 제외)
                                            </span>
                                        )}
                                    </span>
                                    <button onClick={handleUpload} disabled={validCount === 0}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all disabled:opacity-40"
                                        style={{
                                            background: 'linear-gradient(135deg, #e8c87a 0%, #c9a84c 60%, #a8872c 100%)',
                                            color: '#04091a',
                                            boxShadow: '0 4px 20px rgba(201,168,76,0.4)',
                                        }}>
                                        <Upload className="w-4 h-4" />
                                        일괄 업로드
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 mt-4 px-4 py-3 rounded-xl"
                                    style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm font-bold">{error}</span>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* STEP 3: 완료 */}
                    {step === 'done' && uploadResult && (
                        <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="rounded-2xl p-12 text-center"
                            style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                                style={{ background: '#f0fdf4' }}>
                                <CheckCircle2 className="w-10 h-10" style={{ color: '#16a34a' }} />
                            </div>
                            <h2 className="text-2xl font-black mb-2" style={{ color: T.heading }}>업로드 완료! 🎉</h2>
                            <p className="text-sm mb-8" style={{ color: T.muted }}>
                                전체 {uploadResult.total}건 중 <strong style={{ color: '#16a34a' }}>{uploadResult.valid}건</strong>이 성공적으로 등록되었습니다.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={reset}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors hover:bg-slate-100"
                                    style={{ background: T.card, border: `1px solid ${T.border}`, color: T.sub }}>
                                    <RefreshCw className="w-4 h-4" /> 추가 업로드
                                </button>
                                <button onClick={() => router.push('/employee')}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all"
                                    style={{
                                        background: 'linear-gradient(135deg, #e8c87a 0%, #c9a84c 60%, #a8872c 100%)',
                                        color: '#04091a',
                                        boxShadow: '0 4px 20px rgba(201,168,76,0.4)',
                                    }}>
                                    CRM으로 이동 →
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
