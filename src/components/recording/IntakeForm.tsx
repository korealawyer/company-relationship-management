import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, RefreshCw, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_OPTIONS = ['민사', '형사', '가사', '행정', '개인정보', '가맹계약', '노무', '기타'];

export interface IntakeFormProps {
    clientName: string;
    setClientName: (v: string) => void;
    clientPhone: string;
    setClientPhone: (v: string) => void;
    category: string;
    setCategory: (v: string) => void;
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
    fileData: Record<string, { progress: number, status: string, text?: string, structuredData?: any }>;
    handleFileChange: (fl: FileList | null) => void;
}

export function IntakeForm({
    clientName, setClientName, clientPhone, setClientPhone, category, setCategory,
    files, setFiles, fileData, handleFileChange
}: IntakeFormProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [viewerData, setViewerData] = useState<{name: string, text: string}|null>(null);
    const attachInputRef = useRef<HTMLInputElement>(null);

    const iS = { background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-bold mb-1 block" style={{ color: '#64748b' }}>의뢰인 이름</label>
                    <input value={clientName} onChange={e => setClientName(e.target.value)}
                        placeholder="김○○" className="w-full px-3 py-2 rounded-lg text-sm" style={iS} />
                </div>
                <div>
                    <label className="text-xs font-bold mb-1 block" style={{ color: '#64748b' }}>연락처</label>
                    <input value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                        placeholder="010-0000-0000" className="w-full px-3 py-2 rounded-lg text-sm" style={iS} />
                </div>
                <div className="col-span-2">
                    <label className="text-xs font-bold mb-1 block" style={{ color: '#64748b' }}>사건 분류</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm" style={iS}>
                        {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: '#64748b' }}>
                    첨부 파일 <span style={{ color: '#94a3b8', fontWeight: 400 }}>(선택 · 최대 10MB)</span>
                </label>
                <div
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${isDragging ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files); }}
                    onClick={() => attachInputRef.current?.click()}
                >
                    <input type="file" multiple className="hidden" ref={attachInputRef}
                        onChange={e => { handleFileChange(e.target.files); e.target.value = ''; }} />
                    <UploadCloud className="w-5 h-5 mx-auto mb-1" style={{ color: '#94a3b8' }} />
                    <p className="text-xs font-bold" style={{ color: '#64748b' }}>클릭 또는 드래그하여 업로드</p>
                    <p className="text-[10px]" style={{ color: '#94a3b8' }}>소장, 계약서, 증거자료 등</p>
                </div>
                {files.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                        {files.map((f, i) => {
                            const d = fileData[f.name + f.size];
                            return (
                                <div key={i} className="flex flex-col p-2 rounded-lg bg-gray-50 border border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                            <span className="text-xs font-medium text-gray-700 truncate">{f.name}</span>
                                            <span className="text-[10px] text-gray-400 flex-shrink-0">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                                            {d?.status === 'processing' && (
                                                <span className="text-[10px] text-blue-500 ml-2 animate-pulse flex items-center">
                                                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> {d.progress}%
                                                </span>
                                            )}
                                            {d?.status === 'done' && (
                                                <button onClick={(e) => { e.stopPropagation(); setViewerData({ name: f.name, text: d.text || '' }); }} className="ml-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100 transition-colors">📄 텍스트 보기</button>
                                            )}
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((_, j) => j !== i)); }}
                                            className="p-0.5 text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Viewer Modal */}
            {viewerData && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                     onClick={(e) => e.target === e.currentTarget && setViewerData(null)}>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                        style={{ maxHeight: '80vh' }}>
                        <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">📄 {viewerData.name} 텍스트 추출 결과</h3>
                            <button onClick={() => setViewerData(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1 bg-gray-50/50">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{viewerData.text || '(텍스트 없음)'}</pre>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
