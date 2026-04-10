'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Shield, Scale, Briefcase, FolderOpen,
    Download, Eye, Clock, CheckCircle2, AlertTriangle,
    Lock, Search, Filter, ChevronDown, ArrowRight,
    FileSignature, Gavel, Users, Phone, ExternalLink,
    Calendar, Tag, MoreVertical, Star, UploadCloud, MessageSquare, X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/AuthContext';
import { Document, DocumentCategory, DocumentStatus } from '@/lib/types';
import { ServiceRequestModal } from '@/components/ServiceRequestModal';

/* ── 메타데이터 매핑 ──────────────────────────────────────── */
const DOC_TYPE_META: Record<DocumentCategory, { label: string; icon: React.ElementType; color: string }> = {
    '계약서': { label: '계약서 검토', icon: FileSignature, color: '#2563eb' },
    '의견서': { label: '법률 의견서', icon: Scale, color: '#7c3aed' },
    '리포트': { label: '진단 리포트', icon: Shield, color: '#dc2626' },
    '소장': { label: '소장/준비서면', icon: Gavel, color: '#059669' },
    '영수증': { label: '영수증/견적서', icon: FileText, color: '#d97706' },
    '기타': { label: '기타 문서', icon: Briefcase, color: '#0891b2' },
};

const STATUS_META: Record<DocumentStatus, { label: string; color: string; bg: string }> = {
    '검토 대기': { label: '검토 대기', color: '#dc2626', bg: '#fef2f2' },
    '변호사 열람 완료': { label: '변호사 열람', color: '#d97706', bg: '#fffbeb' },
    '검토 중': { label: '검토 중', color: '#2563eb', bg: '#eff6ff' },
    '검토 완료': { label: '검토 완료', color: '#059669', bg: '#ecfdf5' },
};

/* ── Extended Document Type for UI ──────────────────────── */
interface UIDocument extends Document {
    isDemo?: boolean;
    summary?: string;
    riskScore?: number;
    issueCount?: number;
    highRiskCount?: number;
    starred?: boolean;
}

/* ── 데모 데이터 제거 완료 ────────────────────────────────────────── */

/* ── 통계 위젯 ─────────────────────────────────────────── */
function StatsRow({ documents }: { documents: UIDocument[] }) {
    const total = documents.length;
    const completed = documents.filter(d => d.status === '검토 완료').length;
    const reviewing = documents.filter(d => d.status === '변호사 열람 완료' || d.status === '검토 중').length;
    const pending = documents.filter(d => d.status === '검토 대기').length;

    const stats = [
        { label: '전체 문서', value: total, icon: <FolderOpen className="w-4 h-4" />, color: '#c9a84c' },
        { label: '완료', value: completed, icon: <CheckCircle2 className="w-4 h-4" />, color: '#059669' },
        { label: '피드백/열람', value: reviewing, icon: <MessageSquare className="w-4 h-4" />, color: '#2563eb' },
        { label: '검토 대기', value: pending, icon: <Clock className="w-4 h-4" />, color: '#dc2626' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {stats.map(s => (
                <div key={s.label} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: `${s.color}10` }}>
                            <span style={{ color: s.color }}>{s.icon}</span>
                        </div>
                    </div>
                    <div className="text-2xl font-black text-gray-900">{s.value}</div>
                    <div className="text-xs font-medium text-gray-500">{s.label}</div>
                </div>
            ))}
        </div>
    );
}

/* ── 문서 카드 컴포넌트 ─────────────────────────────────── */
function DocumentCard({ doc, onClick }: { doc: UIDocument, onClick: (doc: UIDocument) => void }) {
    const typeMeta = DOC_TYPE_META[doc.category] || DOC_TYPE_META['기타'];
    const statusMeta = STATUS_META[doc.status] || STATUS_META['검토 대기'];
    const TypeIcon = typeMeta.icon;
    const dateStr = new Date(doc.createdAt).toLocaleDateString('ko-KR');

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="group relative rounded-2xl overflow-hidden transition-all cursor-pointer"
            style={{
                background: doc.isDemo ? '#fafaf8' : '#fff',
                border: doc.isDemo ? '1px dashed #d1cdc4' : '1px solid #f3f4f6',
                opacity: doc.isDemo ? 0.85 : 1,
            }}
            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', opacity: 1 }}
            onClick={() => onClick(doc)}
        >
            {/* 데모 배지 */}
            {doc.isDemo && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-200">
                    샘플
                </div>
            )}
            {/* NEW 배지 */}
            {!doc.isDemo && doc.isNewForClient && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-red-50 text-red-600 border border-red-200">
                    NEW
                </div>
            )}
            
            <div className="h-1" style={{ background: doc.isDemo ? '#d1d5db' : typeMeta.color }} />

            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: `${typeMeta.color}10` }}>
                            <TypeIcon className="w-4.5 h-4.5" style={{ color: typeMeta.color }} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: typeMeta.color }}>
                                {typeMeta.label}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                    style={{ color: statusMeta.color, background: statusMeta.bg }}>
                                    {statusMeta.label}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-[10px] text-gray-400">{dateStr}</div>
                </div>

                <h3 className="font-bold text-[15px] leading-snug mb-2 text-gray-900 truncate">
                    {doc.name}
                </h3>
                
                {doc.summary && (
                    <p className="text-xs leading-relaxed mb-3 text-gray-500 line-clamp-2">
                        {doc.summary}
                    </p>
                )}

                {(doc.riskScore || doc.issueCount || doc.highRiskCount) && (
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                        {doc.riskScore && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                                style={{ background: doc.riskScore >= 70 ? '#fef2f2' : '#fffbeb' }}>
                                <AlertTriangle className="w-3 h-3" style={{ color: doc.riskScore >= 70 ? '#dc2626' : '#d97706' }} />
                                <span className="text-xs font-bold" style={{ color: doc.riskScore >= 70 ? '#dc2626' : '#d97706' }}>
                                    위험도 {doc.riskScore}점
                                </span>
                            </div>
                        )}
                        {doc.issueCount && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-500">
                                    이슈 <strong className="text-gray-900">{doc.issueCount}건</strong>
                                </span>
                            </div>
                        )}
                        {doc.highRiskCount && doc.highRiskCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-50 text-red-600">
                                고위험 {doc.highRiskCount}
                            </span>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between mt-4">
                    <span className="text-[10px] text-gray-400">
                        Size: {(doc.size / 1024).toFixed(1)} KB
                    </span>
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-gray-800 bg-gray-900 text-white">
                        <Eye className="w-3 h-3" /> 열람
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

/* ── 메인 페이지 ───────────────────────────────────────── */
export function DocumentsClient({ initialUser }: { initialUser: any }) {
    const session = initialUser;
    const router = useRouter();
    
    const [docs, setDocs] = useState<UIDocument[]>([]);
    const [filterCategory, setFilterCategory] = useState<DocumentCategory | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<DocumentStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    // 파일 업로드 관련
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // 뷰어 관련
    const [previewDoc, setPreviewDoc] = useState<UIDocument | null>(null);

    // 모달 관련
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (session?.companyId) {
                // TODO: Supabase Storage 및 DB 문서 테이블 구현 시 교체
                const companyId = session.companyId;
                
                // dataLayer를 임포트 해야 함 (위에 추가 확인)
                try {
                    const dataLayer = (await import('@/lib/dataLayer')).default;
                    const company = await dataLayer.companies.getById(companyId);
                    
                    const fetchedDocs: UIDocument[] = [];
                    
                    if (company && company.lawyerConfirmed) {
                        fetchedDocs.push({
                            id: `privacy-report-${company.id}`,
                            companyId: company.id,
                            authorRole: 'lawyer',
                            name: '개인정보보호법 1차 검토 의견서.pdf',
                            size: 1024 * 350,
                            type: 'application/pdf',
                            category: '리포트',
                            status: '검토 완료',
                            url: '#',
                            createdAt: company.updatedAt || new Date().toISOString(),
                            updatedAt: company.updatedAt || new Date().toISOString(),
                            isNewForClient: false,
                            isNewForLawyer: false,
                            isDemo: false,
                            summary: `발견된 법적 취약점 ${company.issues?.length || 0}건에 대한 상세 진단 결과 및 시정 조치 안내서입니다.`,
                            issueCount: company.issues?.length || 0,
                            highRiskCount: company.issues?.filter((i:any) => i.level === 'HIGH').length || 0,
                            riskScore: company.issues?.length ? 100 - (company.issues.length * 5) : 100
                        });
                    }
                    
                    const dbDocs = await dataLayer.documents.getAll(companyId);
                    
                    setDocs([...fetchedDocs, ...dbDocs]);
                } catch(e) {
                    console.error(e);
                    setDocs([]);
                }
            }
        };
        load();
        window.addEventListener('ibs-docs-updated', load);
        return () => window.removeEventListener('ibs-docs-updated', load);
    }, [session?.companyId]);

    const handleFileUpload = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const companyId = session?.companyId;
        if (!companyId) {
            alert("회사 정보가 없습니다.");
            return;
        }

        Array.from(files).forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                alert(`${file.name}은(는) 10MB 이하만 가능합니다.`);
                return;
            }
            
            // TODO: Supabase Storage 업로드 로직으로 교체 필요
            const newDoc: any = {
                id: `temp-${Date.now()}-${Math.random()}`,
                companyId,
                authorRole: 'client',
                name: file.name,
                size: file.size,
                type: file.type || 'application/octet-stream',
                category: '기타',
                status: '검토 대기',
                url: URL.createObjectURL(file),
                isNewForClient: false,
                isNewForLawyer: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            
            setDocs(prev => [newDoc, ...prev]);
        });
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    };

    const handleDocClick = (doc: UIDocument) => {
        if (doc.isNewForClient && !doc.isDemo) {
            // TODO: dataLayer.documents.markAsRead(doc.id) 구현 시 교체
            setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, isNewForClient: false } : d));
        }
        
        // 추가: 개인정보처리방침 (통합본) 은 프리뷰 모달 대신 전용 리포트 페이지로 바로 이동
        if (doc.name.includes('개인정보보호법 1차 검토 의견서')) {
            router.push('/privacy-analysis');
            return;
        }

        setPreviewDoc(doc);
    };

    // Auth checking is now handled by the Server Component

    const allDocs = [...docs];
    const filteredDocs = allDocs.filter(doc => {
        if (filterCategory !== 'all' && doc.category !== filterCategory) return false;
        if (filterStatus !== 'all' && doc.status !== filterStatus) return false;
        if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="min-h-screen pt-20 pb-16 bg-gray-50" style={{ background: '#f8f7f4' }}>
            <div className="max-w-6xl mx-auto px-4">
                
                {/* ── 상단 헤더 & 컨트롤 ── */}
                <div className="py-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <FolderOpen className="w-5 h-5" style={{ color: '#c9a84c' }} />
                            <span className="text-xs font-bold" style={{ color: '#c9a84c' }}>
                                {session?.companyName || '내 기업 문서함'}
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900">개인정보보호법 1차 검토 의견서</h1>
                        <p className="text-sm text-gray-500 mt-2">
                            법률 검토 의뢰, 계약서, 의견서 등 모든 양방향 문서를 한 곳에서 관리합니다.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:bg-gray-800 bg-gray-900 text-white">
                            <FileText className="w-4 h-4" /> 새 의뢰하기
                        </button>
                    </div>
                </div>

                {/* ── 통계 ── */}
                <StatsRow documents={allDocs} />

                {/* ── 메인 레이아웃 ── */}
                <div className="grid lg:grid-cols-4 gap-6">
                    {/* 좌측 사이드: 업로드 & 필터 */}
                    <div className="lg:col-span-1 space-y-4">
                        
                        {/* 업로드 존 */}
                        <div 
                            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
                                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                multiple 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={(e) => handleFileUpload(e.target.files)} 
                            />
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex flex-col items-center justify-center mx-auto mb-3">
                                <UploadCloud className="w-6 h-6 text-blue-500" />
                            </div>
                            <p className="text-sm font-bold text-gray-800 mb-1">파일 업로드</p>
                            <p className="text-[10px] text-gray-400">클릭 또는 파일 드래그 (HWP, Word, PDF, 사진 등 / 최대 10MB)</p>
                        </div>

                        {/* 필터 영역 */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-2 block">검색</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="문서명 검색..."
                                        className="w-full text-sm rounded-xl pl-9 pr-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-500"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-2 block">문서 종류</label>
                                <div className="flex flex-wrap gap-1.5">
                                    <button onClick={() => setFilterCategory('all')} className={`px-2.5 py-1 rounded text-[10px] font-bold ${filterCategory === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                        전체
                                    </button>
                                    {Object.entries(DOC_TYPE_META).map(([key, meta]) => (
                                        <button key={key} onClick={() => setFilterCategory(key as DocumentCategory)}
                                            className={`px-2.5 py-1 rounded text-[10px] font-bold`}
                                            style={{
                                                background: filterCategory === key ? `${meta.color}15` : '#f3f4f6',
                                                color: filterCategory === key ? meta.color : '#4b5563',
                                            }}>
                                            {meta.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-2 block">처리 상태</label>
                                <div className="flex flex-wrap gap-1.5">
                                    <button onClick={() => setFilterStatus('all')} className={`px-2.5 py-1 rounded text-[10px] font-bold ${filterStatus === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                        전체
                                    </button>
                                    {Object.entries(STATUS_META).map(([key, meta]) => (
                                        <button key={key} onClick={() => setFilterStatus(key as DocumentStatus)}
                                            className={`px-2.5 py-1 rounded text-[10px] font-bold`}
                                            style={{
                                                background: filterStatus === key ? meta.bg : '#f3f4f6',
                                                color: filterStatus === key ? meta.color : '#4b5563',
                                            }}>
                                            {meta.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 우측 사이드: 리스트 */}
                    <div className="lg:col-span-3">
                        {filteredDocs.length === 0 ? (
                            <div className="text-center py-20 rounded-2xl bg-white border border-gray-100 shadow-sm">
                                <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="font-bold text-gray-500 mb-1">문서가 없습니다</p>
                                <p className="text-sm text-gray-400">조건에 맞는 문서가 없거나 직접 업로드하여 보관을 시작해 보세요.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
                                {filteredDocs.map((doc, i) => (
                                    <DocumentCard key={doc.id} doc={doc} onClick={handleDocClick} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── 프리뷰 모달 ── */}
            <AnimatePresence>
                {previewDoc && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPreviewDoc(null)} />
                        
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative z-10 overflow-hidden">
                            
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                            {previewDoc.name}
                                            {previewDoc.isDemo && <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] px-2 py-0.5 rounded-full">샘플 문서</span>}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {previewDoc.category} · {(previewDoc.size/1024).toFixed(1)}KB · {new Date(previewDoc.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={async () => {
                                            if (previewDoc.isDemo || previewDoc.url === '#') {
                                                alert("샘플 문서는 안내용 텍스트만 존재하며 실제 다운로드를 지원하지 않습니다.");
                                                return;
                                            }
                                            try {
                                                const res = await fetch(previewDoc.url);
                                                const blob = await res.blob();
                                                const objectUrl = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.style.display = 'none';
                                                a.href = objectUrl;
                                                a.download = previewDoc.name || 'document';
                                                document.body.appendChild(a);
                                                a.click();
                                                window.URL.revokeObjectURL(objectUrl);
                                                document.body.removeChild(a);
                                            } catch (e) {
                                                console.error("다운로드 실패 (CORS 등):", e);
                                                window.open(previewDoc.url, '_blank');
                                            }
                                        }}
                                        className="p-2 text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm font-semibold"
                                    >
                                        <Download className="w-4 h-4" /> 다운로드
                                    </button>
                                    <button onClick={() => setPreviewDoc(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 bg-gray-100 p-6 overflow-y-auto flex items-center justify-center min-h-[400px]">
                                {previewDoc.isDemo ? (
                                    <div className="bg-white p-10 rounded-xl shadow-sm text-center max-w-md border border-gray-200">
                                        <h4 className="font-black text-xl mb-3 text-gray-800">{previewDoc.name.replace('.pdf', '')}</h4>
                                        <p className="text-gray-500 text-sm leading-relaxed mb-6">{previewDoc.summary}</p>
                                        <div className="h-40 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center">
                                            <span className="text-xs font-bold text-gray-400 tracking-widest">[ 법률 문서 본문 샘플 ]</span>
                                        </div>
                                    </div>
                                ) : (
                                    previewDoc.type.includes('image') || previewDoc.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                                        <img src={previewDoc.url} alt="preview" className="max-w-full max-h-full object-contain rounded shadow-lg" />
                                    ) : previewDoc.type.includes('pdf') || previewDoc.name.toLowerCase().endsWith('.pdf') ? (
                                        <iframe src={previewDoc.url} className="w-full h-[600px] border-none bg-white rounded shadow-sm" title="PDF Preview" />
                                    ) : previewDoc.name.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i) ? (
                                        previewDoc.url.startsWith('blob:') || previewDoc.url.includes('localhost') ? (
                                            <div className="text-center bg-white p-12 rounded-2xl shadow-sm max-w-sm">
                                                <FileText className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                                                <p className="font-bold text-gray-900 mb-2">오피스 문서 미리보기 안내</p>
                                                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                                                    로컬 개발 환경 보안 정책으로 지금은 창이 표시되지 않습니다.<br/>
                                                    <strong className="text-blue-600">Vercel 배포 후</strong>에는 MS Office 뷰어가 자동 연동되어 이곳에 문서가 바로 열립니다.
                                                </p>
                                            </div>
                                        ) : (
                                            <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewDoc.url)}`} className="w-full h-[600px] border-none bg-white rounded shadow-sm" title="Office Preview" />
                                        )
                                    ) : previewDoc.name.match(/\.(hwp|hwpx)$/i) ? (
                                        <div className="text-center bg-white p-12 rounded-2xl shadow-sm max-w-sm">
                                            <FileText className="w-16 h-16 mx-auto mb-4 text-indigo-400" />
                                            <p className="font-bold text-gray-900 mb-2">한글(HWP) 문서 안내</p>
                                            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                                                HWP 파일은 범용 웹 뷰어가 존재하지 않아 브라우저 렌더링이 제한됩니다.<br/><br/>
                                                상단의 <strong>다운로드 버튼</strong>을 통해 원본을 확인해 주세요.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center bg-white p-12 rounded-2xl shadow-sm">
                                            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                            <p className="font-bold text-gray-900 mb-2">프리뷰를 지원하지 않는 파일 형식입니다</p>
                                            <p className="text-sm text-gray-500 mb-6">상단의 다운로드 버튼을 눌러 확인해 주세요.</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ServiceRequestModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                defaultType="document" 
            />
        </div>
    );
}