'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, FileImage, File, UploadCloud, Download, Eye,
    CheckCircle2, Clock, MessageSquare, X
} from 'lucide-react';
import { documentStore, Document, DocumentCategory, DocumentStatus } from '@/lib/mockStore';

const STATUS_CONFIG: Record<DocumentStatus, { color: string, bg: string, icon: any }> = {
    '검토 대기': { color: '#dc2626', bg: '#fef2f2', icon: Clock },
    '변호사 열람 완료': { color: '#d97706', bg: '#fffbeb', icon: Eye },
    '검토 중': { color: '#2563eb', bg: '#eff6ff', icon: MessageSquare },
    '검토 완료': { color: '#16a34a', bg: '#f0fdf4', icon: CheckCircle2 }
};

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

    // load docs
    useEffect(() => {
        const load = () => setDocs(documentStore.getByCompanyId(companyId));
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
            
            documentStore.upload({
                companyId,
                authorRole: currentUserRole,
                name: file.name,
                size: file.size,
                type: file.type || 'application/octet-stream',
                category: '의견서', // Default for lawyers
                status: '검토 완료',
                url: URL.createObjectURL(file),
                isNewForClient: true,
                isNewForLawyer: false
            });
        });
    };

    const handleStatusChange = (docId: string, newStatus: DocumentStatus) => {
        documentStore.updateStatus(docId, newStatus);
    };

    const handleDocClick = (doc: Document) => {
        if (doc.isNewForLawyer) {
            documentStore.markAsReadByLawyer(doc.id);
        }
        window.open(doc.url, '_blank');
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
            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[300px]">
                <AnimatePresence>
                    {filteredDocs.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center text-gray-400">
                            <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">문서가 없습니다.</p>
                        </motion.div>
                    ) : (
                        filteredDocs.map((doc, i) => {
                            const StatusIcon = STATUS_CONFIG[doc.status].icon;
                            return (
                                <motion.div 
                                    key={doc.id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-white group transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        <div 
                                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-500 cursor-pointer hover:bg-blue-100"
                                            onClick={() => handleDocClick(doc)}
                                        >
                                            {doc.type.includes('pdf') ? <FileText className="w-5 h-5"/> : 
                                             doc.type.includes('image') ? <FileImage className="w-5 h-5"/> : 
                                             <File className="w-5 h-5"/>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 
                                                    className="text-sm font-bold text-gray-800 truncate cursor-pointer hover:text-blue-600"
                                                    onClick={() => handleDocClick(doc)}
                                                >
                                                    {doc.name}
                                                </h4>
                                                {doc.isNewForLawyer && (
                                                    <span className="text-[9px] font-black bg-red-100 text-red-600 px-1 py-0.5 rounded leading-none">
                                                        NEW
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium flex-wrap">
                                                <span className="bg-gray-100 px-1.5 py-0.5 rounded">{doc.category}</span>
                                                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                                <span>{(doc.size / 1024 / 1024).toFixed(1)} MB</span>
                                                <span className={doc.authorRole === 'client' ? 'text-orange-500' : 'text-blue-500'}>
                                                    {doc.authorRole === 'client' ? '고객 업로드' : '변호사 등록'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-bold" 
                                             style={{ background: STATUS_CONFIG[doc.status].bg, borderColor: STATUS_CONFIG[doc.status].color + '30', color: STATUS_CONFIG[doc.status].color }}>
                                            <StatusIcon className="w-3 h-3" />
                                            {doc.status}
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <select 
                                                value={doc.status}
                                                onChange={(e) => handleStatusChange(doc.id, e.target.value as DocumentStatus)}
                                                className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1.5 py-1 outline-none font-medium cursor-pointer flex-shrink-0 max-w-[100px]"
                                            >
                                                {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s} 상태로 변경</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

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
