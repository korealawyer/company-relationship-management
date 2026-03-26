// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, UploadCloud } from 'lucide-react';
import type { Document, DocumentCategory, DocumentStatus } from '@/lib/types';

import { OcrResultData, OcrResultPanel } from './documents/OcrResultPanel';
import { DocumentList } from './documents/DocumentList';

const CATEGORIES: DocumentCategory[] = ['계약서', '의견서', '리포트', '소장', '영수증', '기타'];

interface DocumentWidgetProps {
    companyId: string;
    currentUserRole: 'lawyer' | 'admin';
}

export function DocumentWidget({ companyId, currentUserRole }: DocumentWidgetProps) {
    const [docs, setDocs] = useState<Document[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | '전체'>('전체');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── OCR State ──
    const [ocrLoading, setOcrLoading] = useState<string | null>(null);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrResult, setOcrResult] = useState<OcrResultData | null>(null);
    const [ocrError, setOcrError] = useState<string | null>(null);
    const [ocrEngine, setOcrEngine] = useState<'auto'|'cloud_vision'|'tesseract'>('auto');
    const [ocrMode, setOcrMode] = useState<'document'|'text'|'handwriting'>('document');

    // load docs
    useEffect(() => {
        // TODO: Replace with SWR-based fetching from Supabase Storage & DB
        const load = () => setDocs([]);
        load();
        window.addEventListener('ibs-docs-updated', load);
        return () => window.removeEventListener('ibs-docs-updated', load);
    }, [companyId]);

    const handleFileUpload = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        
        Array.from(files).forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                alert(`${file.name} 10MB 이하의 파일만 업로드 가능합니다.`);
                return;
            }
            
            // TODO: Implement Supabase Storage upload
            const fileDoc: Document = {
                id: Math.random().toString(),
                companyId,
                authorRole: currentUserRole,
                name: file.name,
                size: file.size,
                type: file.type || 'application/octet-stream',
                category: '의견서', // Default for lawyers
                status: '검토 완료',
                url: URL.createObjectURL(file),
                isNewForClient: true,
                isNewForLawyer: false,
                createdAt: new Date().toISOString()
            };
            setDocs(prev => [fileDoc, ...prev]);
            console.log('Document upload pending Supabase Integration:', file.name);
        });
    };

    const handleStatusChange = (docId: string, newStatus: DocumentStatus) => {
        // TODO: Update via Supabase DB mutation
        setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: newStatus } : d));
    };

    const handleDocClick = (doc: Document) => {
        if (doc.isNewForLawyer) {
            // TODO: Mark as read via Supabase DB mutation
            setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, isNewForLawyer: false } : d));
        }
        window.open(doc.url, '_blank');
    };

    // ── OCR Handler ──
    const handleOcr = useCallback(async (doc: Document) => {
        setOcrLoading(doc.id);
        setOcrProgress(0);
        setOcrResult(null);
        setOcrError(null);

        try {
            // Lazy import to avoid loading Tesseract on every page
            const { extractText, isOcrSupported } = await import('@/lib/ocr');

            // 실제 File 객체를 URL에서 fetch로 가져오거나, 더미 파일 생성
            let file: globalThis.File;
            if (doc.url.startsWith('blob:') || doc.url.startsWith('http')) {
                const res = await fetch(doc.url);
                const blob = await res.blob();
                file = new globalThis.File([blob], doc.name, { type: doc.type });
            } else {
                // URL이 '#'인 경우 (mock 데이터) — 데모용 OCR 시뮬레이션
                setOcrProgress(50);
                await new Promise(r => setTimeout(r, 800));
                setOcrProgress(100);
                setOcrResult({
                    id: `ocr_demo_${Date.now()}`,
                    fileName: doc.name,
                    extractedText: `[데모] "${doc.name}" 파일의 OCR 텍스트 추출 결과입니다.\n\n이 문서는 실제 파일이 아닌 시스템 생성 문서이므로,\n실제 업로드된 이미지/PDF 파일에서 OCR을 실행하면\n한국어/영어 텍스트가 정확히 추출됩니다.\n\n원고: 김민수\n피고: (주)프랜차이즈코리아\n2024년 3월 15일\n손해배상금 50,000,000원\n사건번호: 2024가합12345`,
                    confidence: 85,
                    language: 'ko',
                    processedAt: new Date().toISOString(),
                    pageCount: 1,
                    structuredData: {
                        parties: ['김민수', '(주)프랜차이즈코리아'],
                        dates: ['2024-03-15'],
                        amounts: ['50,000,000원'],
                        caseNumbers: ['2024가합12345'],
                        keyPhrases: ['손해배상'],
                    }
                });
                setOcrLoading(null);
                return;
            }

            if (!isOcrSupported(file)) {
                setOcrError('지원하지 않는 파일 형식입니다.');
                setOcrLoading(null);
                return;
            }

            const result = await extractText(file, {
                engine: ocrEngine,
                mode: ocrMode,
                language: 'kor+eng',
                extractStructured: true,
                onProgress: (pct) => setOcrProgress(pct),
            });

            setOcrResult(result);
        } catch (err: any) {
            console.error('OCR Error:', err);
            setOcrError(err.message || 'OCR 처리 중 오류가 발생했습니다.');
        } finally {
            setOcrLoading(null);
        }
    }, [ocrEngine, ocrMode]);

    // Check if a doc is OCR-compatible by extension
    const isOcrCompatible = (doc: Document) => {
        const ext = doc.name.split('.').pop()?.toLowerCase() || '';
        return ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'tif', 'pdf', 'docx', 'hwp', 'hwpx'].includes(ext)
            || doc.type.includes('image') || doc.type.includes('pdf');
    };

    const filteredDocs = docs.filter(doc => selectedCategory === '전체' || doc.category === selectedCategory)
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        의뢰인 문서함
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">고객이 업로드한 문서와 수임 결과를 관리합니다.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select 
                        value={ocrEngine}
                        onChange={(e) => setOcrEngine(e.target.value as any)}
                        className="text-[10px] border border-gray-200 rounded-md bg-white px-2 py-1 outline-none text-gray-600 font-medium"
                    >
                        <option value="auto">Auto (Cloud 우선)</option>
                        <option value="cloud_vision">Cloud Vision</option>
                        <option value="tesseract">Tesseract (로컬)</option>
                    </select>
                    <select 
                        value={ocrMode}
                        onChange={(e) => setOcrMode(e.target.value as any)}
                        className="text-[10px] border border-gray-200 rounded-md bg-white px-2 py-1 outline-none text-gray-600 font-medium"
                    >
                        <option value="document">일반 문서</option>
                        <option value="text">텍스트 위주</option>
                        <option value="handwriting">필기체 포함</option>
                    </select>
                    <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value as any)}
                        className="text-xs border-gray-200 rounded-md bg-white pr-7 py-1 outline-none"
                    >
                        <option value="전체">모든 분류</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* List */}
            <DocumentList 
                filteredDocs={filteredDocs}
                ocrLoading={ocrLoading}
                ocrProgress={ocrProgress}
                handleDocClick={handleDocClick}
                isOcrCompatible={isOcrCompatible}
                handleOcr={handleOcr}
                handleStatusChange={handleStatusChange}
            />

            {/* OCR Result Panel */}
            <OcrResultPanel 
                ocrResult={ocrResult}
                setOcrResult={setOcrResult}
                ocrError={ocrError}
                setOcrError={setOcrError}
            />

            {/* Upload Area */}
            <div className="p-3 border-t border-gray-100 bg-gray-50">
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => handleFileUpload(e.target.files)} />
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files); }}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-bold cursor-pointer transition-colors ${
                        isDragging ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                    <UploadCloud className="w-4 h-4" />
                    결과물 / 참고 서류 업로드 (HWP, Word, PDF, 이미지 등)
                </div>
            </div>
        </div>
    );
}
