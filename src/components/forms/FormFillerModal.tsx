'use client';
import { useState } from 'react';

/**
 * 법률 서식 생성기 모달 (AI 매핑 & DOCX 다운로드)
 */
export default function FormFillerModal({ isOpen, onClose, formTitle, formId, caseContext }: any) {
    const [userInput, setUserInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [mappedData, setMappedData] = useState<any>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    if (!isOpen) return null;

    // 1. AI API 호출하여 자연어 -> JSON 매핑
    const handleAiMapping = async () => {
        if (!userInput.trim()) return alert('내용을 입력해주세요.');
        setIsThinking(true);
        try {
            const res = await fetch('/api/forms/map-fields', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userInput, formId, caseContext })
            });
            const data = await res.json();
            if (data.success) {
                setMappedData(data.mappedFields);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsThinking(false);
        }
    };

    // 2. 완성된 JSON을 DOCX 엔진으로 전송하여 문서 생성
    const handleGenerateDocx = async () => {
        setIsThinking(true);
        try {
            const res = await fetch('/api/forms/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formId, mappedData })
            });
            const data = await res.json();
            if (data.success && data.downloadUrl) {
                setDownloadUrl(data.downloadUrl);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-indigo-50 flex justify-between items-center" style={{ background: 'linear-gradient(to right, #4f46e5, #7c3aed)' }}>
                    <h2 className="text-xl font-bold text-white">[{formTitle}] 자동 완성 AI</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white text-xl">✕</button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50">
                    
                    {/* Step 1: 자연어 입력 */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">채팅하듯 상황을 설명해주세요</label>
                        <textarea 
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="예: 친구가 작년 10월에 빌린 500만원을 아직도 안 갚고 있습니다."
                            className="w-full p-4 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-600 outline-none resize-none h-28"
                        />
                        <button 
                            onClick={handleAiMapping}
                            disabled={isThinking}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors"
                        >
                            {isThinking ? 'AI 두뇌 가동 중...' : '마법처럼 빈칸 채우기 ✨'}
                        </button>
                    </div>

                    {/* Step 2: AI 매핑 결과 검토 및 서면 생성 */}
                    {mappedData && (
                        <div className="animate-fade-in bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
                            <h3 className="text-sm font-bold text-indigo-900 mb-4 border-b pb-2"> AI 추출 데이터 확인</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(mappedData).map(([key, value]: any) => (
                                    <div key={key}>
                                        <p className="text-xs text-slate-500 font-medium mb-1">{key}</p>
                                        <input 
                                            value={value}
                                            onChange={(e) => setMappedData({...mappedData, [key]: e.target.value})}
                                            className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm font-bold"
                                        />
                                    </div>
                                ))}
                            </div>
                            
                            {!downloadUrl ? (
                                <button 
                                    onClick={handleGenerateDocx}
                                    className="mt-6 w-full py-3.5 bg-black hover:bg-slate-800 text-white font-black rounded-xl"
                                >
                                    서식 렌더링 및 다운로드 준비 ⬇️
                                </button>
                            ) : (
                                <a  href={downloadUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="mt-6 block w-full py-4 text-center bg-green-500 hover:bg-green-600 text-white font-black rounded-xl text-lg animate-pulse"
                                >
                                    ✅ 완성된 워드(DOCX) 다운로드
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
