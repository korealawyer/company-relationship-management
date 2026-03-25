import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanSearch, X, Users, Calendar, DollarSign, Hash, Tag, LayoutGrid } from 'lucide-react';

export interface OcrResultData {
    id: string;
    fileName: string;
    extractedText: string;
    confidence: number;
    language: 'ko' | 'en' | 'mixed';
    processedAt: string;
    pageCount: number;
    structuredData?: {
        parties?: string[];
        dates?: string[];
        amounts?: string[];
        caseNumbers?: string[];
        keyPhrases?: string[];
        tables?: Array<{ headers: string[]; rows: string[][]; rawText: string }>;
    };
}

interface Props {
    ocrResult: OcrResultData | null;
    setOcrResult: (val: OcrResultData | null) => void;
    ocrError: string | null;
    setOcrError: (val: string | null) => void;
}

export function OcrResultPanel({ ocrResult, setOcrResult, ocrError, setOcrError }: Props) {
    return (
        <>
            <AnimatePresence>
                {ocrResult && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 overflow-hidden"
                    >
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <ScanSearch className="w-4 h-4 text-violet-600" />
                                    <h4 className="text-sm font-black text-violet-800">OCR 추출 결과</h4>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-200 text-violet-700 font-bold">
                                        신뢰도 {ocrResult.confidence}%
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-200 text-blue-700 font-bold">
                                        {ocrResult.language === 'ko' ? '한국어' : ocrResult.language === 'en' ? '영어' : '혼합'}
                                    </span>
                                    {ocrResult.pageCount > 1 && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 font-bold">
                                            {ocrResult.pageCount}페이지
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setOcrResult(null)}
                                    className="p-1 rounded-md hover:bg-violet-200 text-violet-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Structured Data Tags */}
                            {ocrResult.structuredData && (
                                <div className="mb-3 space-y-1.5">
                                    {ocrResult.structuredData.parties && ocrResult.structuredData.parties.length > 0 && (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Users className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                            <span className="text-[9px] font-bold text-blue-600 flex-shrink-0">당사자</span>
                                            {ocrResult.structuredData.parties.map((p, i) => (
                                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">{p}</span>
                                            ))}
                                        </div>
                                    )}
                                    {ocrResult.structuredData.dates && ocrResult.structuredData.dates.length > 0 && (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Calendar className="w-3 h-3 text-green-500 flex-shrink-0" />
                                            <span className="text-[9px] font-bold text-green-600 flex-shrink-0">날짜</span>
                                            {ocrResult.structuredData.dates.map((d, i) => (
                                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">{d}</span>
                                            ))}
                                        </div>
                                    )}
                                    {ocrResult.structuredData.amounts && ocrResult.structuredData.amounts.length > 0 && (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <DollarSign className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                            <span className="text-[9px] font-bold text-amber-600 flex-shrink-0">금액</span>
                                            {ocrResult.structuredData.amounts.map((a, i) => (
                                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">{a}</span>
                                            ))}
                                        </div>
                                    )}
                                    {ocrResult.structuredData.caseNumbers && ocrResult.structuredData.caseNumbers.length > 0 && (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Hash className="w-3 h-3 text-purple-500 flex-shrink-0" />
                                            <span className="text-[9px] font-bold text-purple-600 flex-shrink-0">사건번호</span>
                                            {ocrResult.structuredData.caseNumbers.map((c, i) => (
                                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">{c}</span>
                                            ))}
                                        </div>
                                    )}
                                    {ocrResult.structuredData.keyPhrases && ocrResult.structuredData.keyPhrases.length > 0 && (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Tag className="w-3 h-3 text-rose-500 flex-shrink-0" />
                                            <span className="text-[9px] font-bold text-rose-600 flex-shrink-0">핵심</span>
                                            {ocrResult.structuredData.keyPhrases.slice(0, 10).map((k, i) => (
                                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-medium">{k}</span>
                                            ))}
                                        </div>
                                    )}
                                    {ocrResult.structuredData.tables && ocrResult.structuredData.tables.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-violet-100 flex flex-col gap-2">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <LayoutGrid className="w-3 h-3 text-emerald-500" />
                                                <span className="text-[9px] font-bold text-emerald-600">표/양식 인식 결과</span>
                                            </div>
                                            {ocrResult.structuredData.tables.map((table, tIdx) => (
                                                <div key={tIdx} className="border border-emerald-100 rounded-md overflow-hidden bg-white shadow-sm">
                                                    <table className="w-full text-left text-[10px]">
                                                        {table.headers && table.headers.length > 0 && (
                                                            <thead className="bg-emerald-50 text-emerald-800 font-bold">
                                                                <tr>
                                                                    {table.headers.map((h, i) => <th key={i} className="p-1 px-1.5 border-b border-r border-emerald-100 last:border-r-0 whitespace-nowrap">{h}</th>)}
                                                                </tr>
                                                            </thead>
                                                        )}
                                                        <tbody>
                                                            {table.rows.map((row, rIdx) => (
                                                                <tr key={rIdx} className="border-b border-emerald-50 last:border-b-0 hover:bg-gray-50 transition-colors">
                                                                    {row.map((cell, cIdx) => <td key={cIdx} className="p-1 px-1.5 border-r border-emerald-50 last:border-r-0">{cell}</td>)}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Extracted Text */}
                            <div className="max-h-[200px] overflow-y-auto p-3 bg-white rounded-lg border border-violet-100 text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">
                                {ocrResult.extractedText || '(텍스트 없음)'}
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[9px] text-gray-400">
                                    {ocrResult.fileName} · {new Date(ocrResult.processedAt).toLocaleString('ko-KR')}
                                </span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(ocrResult.extractedText);
                                        alert('클립보드에 복사되었습니다.');
                                    }}
                                    className="text-[10px] font-bold px-2 py-1 rounded bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                                >
                                    텍스트 복사
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {ocrError && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-red-200 bg-red-50 p-3"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-red-600 font-bold">⚠ OCR 오류: {ocrError}</span>
                            <button onClick={() => setOcrError(null)} className="text-red-400 hover:text-red-600">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
