import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FileImage, File, CheckCircle2, Clock, MessageSquare, Eye, ScanSearch, Loader2 } from 'lucide-react';
import { Document, DocumentStatus } from '@/lib/store';

export const STATUS_CONFIG: Record<DocumentStatus, { color: string, bg: string, icon: any }> = {
    '검토 대기': { color: '#dc2626', bg: '#fef2f2', icon: Clock },
    '변호사 열람 완료': { color: '#d97706', bg: '#fffbeb', icon: Eye },
    '검토 중': { color: '#2563eb', bg: '#eff6ff', icon: MessageSquare },
    '검토 완료': { color: '#16a34a', bg: '#f0fdf4', icon: CheckCircle2 }
};

interface Props {
    filteredDocs: Document[];
    ocrLoading: string | null;
    ocrProgress: number;
    handleDocClick: (doc: Document) => void;
    isOcrCompatible: (doc: Document) => boolean;
    handleOcr: (doc: Document) => void;
    handleStatusChange: (docId: string, newStatus: DocumentStatus) => void;
}

export function DocumentList({
    filteredDocs, ocrLoading, ocrProgress,
    handleDocClick, isOcrCompatible, handleOcr, handleStatusChange
}: Props) {
    return (
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
                        const isProcessing = ocrLoading === doc.id;
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
                                
                                {/* OCR Progress Bar */}
                                {isProcessing && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-2"
                                    >
                                        <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold mb-1">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            OCR 텍스트 추출 중... {ocrProgress}%
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${ocrProgress}%` }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-bold" 
                                         style={{ 
                                             background: STATUS_CONFIG[doc.status].bg, 
                                             borderColor: STATUS_CONFIG[doc.status].color + '30', 
                                             color: STATUS_CONFIG[doc.status].color 
                                         }}>
                                        <StatusIcon className="w-3 h-3" />
                                        {doc.status}
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {/* OCR Button */}
                                        {isOcrCompatible(doc) && (
                                            <button
                                                onClick={() => handleOcr(doc)}
                                                disabled={!!ocrLoading}
                                                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                title="OCR 텍스트 추출"
                                            >
                                                <ScanSearch className="w-3 h-3" />
                                                OCR
                                            </button>
                                        )}
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
    );
}
