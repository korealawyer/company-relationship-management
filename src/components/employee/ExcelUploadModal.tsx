import React from 'react';
import { motion } from 'framer-motion';
import { X, Upload, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { T } from './shared';

interface ExcelUploadModalProps {
    excelPreview: Record<string, string>[];
    excelUploading: boolean;
    onClose: () => void;
    onImport: () => void;
}

export default function ExcelUploadModal({ excelPreview, excelUploading, onClose, onImport }: ExcelUploadModalProps) {
    return (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
                className="w-full max-w-3xl max-h-[80vh] flex flex-col rounded-2xl"
                style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <div>
                        <h2 className="text-base font-black flex items-center gap-2" style={{ color: T.heading }}>
                            <Upload className="w-4 h-4" style={{ color: '#2563eb' }} />
                            Excel 업로드 미리보기
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: T.muted }}>{excelPreview.length}건의 데이터가 파싱되었습니다</p>
                    </div>
                    <button onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100" style={{ color: T.muted }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-auto px-6 py-4">
                    {excelPreview.length > 0 && (
                        <table className="w-full text-xs">
                            <thead>
                                <tr style={{ background: '#f8f9fc' }}>
                                    <th className="py-2 px-2 text-left font-black" style={{ color: '#c9a84c' }}>#</th>
                                    {Object.keys(excelPreview[0]).slice(0, 8).map(k => (
                                        <th key={k} className="py-2 px-2 text-left font-black whitespace-nowrap" style={{ color: '#c9a84c' }}>{k}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {excelPreview.slice(0, 20).map((row, i) => (
                                    <tr key={i} style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                                        <td className="py-2 px-2 font-bold" style={{ color: T.faint }}>{i + 1}</td>
                                        {Object.values(row).slice(0, 8).map((v, j) => (
                                            <td key={j} className="py-2 px-2 truncate max-w-[150px]" style={{ color: T.body }}>{String(v)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {excelPreview.length > 20 && (
                        <p className="text-center text-xs py-2" style={{ color: T.faint }}>... 외 {excelPreview.length - 20}건 더</p>
                    )}
                </div>
                <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: `1px solid ${T.border}`, background: '#f8f9fc' }}>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: '#dbeafe', color: '#2563eb' }}>
                            필수 열: 기업명 (또는 회사명)
                        </span>
                        <span className="text-[10px]" style={{ color: T.faint }}>선택: 사업자번호, 이메일, 전화번호, 가맹점수 등</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onClose}>취소</Button>
                        <Button variant="premium" onClick={onImport} disabled={excelUploading}>
                            {excelUploading ? (
                                <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> 등록 중...</>
                            ) : (
                                <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {excelPreview.length}건 등록</>
                            )}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
