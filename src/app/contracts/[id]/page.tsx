'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2, Clock, ArrowLeft, Send, Shield, AlertTriangle, Loader2, Download, Eraser } from 'lucide-react';
import Link from 'next/link';
import { getBrowserSupabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Document, Page, Text, View, StyleSheet, Font, Image as PDFImage, pdf } from '@react-pdf/renderer';

// Register font for React PDF (Korean support)
Font.register({
    family: 'NotoSansKR',
    src: 'https://fonts.gstatic.com/s/notosanskr/v36/PbykFmXiEBPT4ITcgEWnRL8DPc4szhM.ttf'
});

const pdfStyles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'NotoSansKR' },
    title: { fontSize: 24, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
    meta: { fontSize: 10, color: '#666', marginBottom: 20, textAlign: 'right' },
    content: { fontSize: 11, lineHeight: 1.6, marginBottom: 40, whiteSpace: 'pre-wrap' },
    signatures: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
    signBox: { width: '45%', borderTop: 1, borderTopColor: '#000', paddingTop: 10 },
    signTitle: { fontSize: 12, marginBottom: 5 },
    signName: { fontSize: 12, marginBottom: 10 },
    signImage: { width: 100, height: 50 },
    timestamp: { fontSize: 9, color: '#666', marginTop: 5 }
});

const ContractPDF = ({ contract }: { contract: any }) => (
    <Document>
        <Page size="A4" style={pdfStyles.page}>
            <Text style={pdfStyles.title}>{contract.title}</Text>
            <Text style={pdfStyles.meta}>작성일: {new Date(contract.created_at).toLocaleString('ko-KR')}</Text>
            
            <Text style={pdfStyles.content}>{contract.content}</Text>
            
            <View style={pdfStyles.signatures}>
                <View style={pdfStyles.signBox}>
                    <Text style={pdfStyles.signTitle}>갑 (요청자)</Text>
                    <Text style={pdfStyles.signName}>{contract.party_a_name}</Text>
                    <Text style={pdfStyles.timestamp}>{contract.party_a_signed ? '서명 완료' : '미서명'}</Text>
                </View>
                <View style={pdfStyles.signBox}>
                    <Text style={pdfStyles.signTitle}>을 (수신자)</Text>
                    <Text style={pdfStyles.signName}>{contract.party_b_name}</Text>
                    {contract.signature_data_url ? (
                        <PDFImage style={pdfStyles.signImage} src={contract.signature_data_url} />
                    ) : (
                         <Text style={pdfStyles.timestamp}>서명 아직 없음</Text>
                    )}
                    <Text style={pdfStyles.timestamp}>
                        {contract.party_b_signed ? `서명 일자: ${new Date(contract.updated_at).toLocaleString('ko-KR')}` : '미서명'}
                    </Text>
                </View>
            </View>
        </Page>
    </Document>
);

type Props = {
    params: {
        id: string;
    }
};

export default function ContractDetailPage({ params }: Props) {
    const [name, setName] = useState('');
    const [agreed, setAgreed] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    
    const [contract, setContract] = useState<any>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);

    const showToast = (msg: string, type: 'success'|'error' = 'success') => {
        setToastMsg(msg);
        setToastType(type);
        setTimeout(() => setToastMsg(''), 3000);
    };

    useEffect(() => {
        const fetchContract = async () => {
            if (!params?.id) return;
            
            const supabase = getBrowserSupabase();
            if (!supabase) return;
            
            const { data, error } = await supabase
                .from('contracts')
                .select('*')
                .eq('id', params.id)
                .single();
                
            if (error || !data) {
                notFound();
                return;
            }
            
            setContract(data);
            setLoading(false);
        };
        fetchContract();
    }, [params?.id]);

    useEffect(() => {
        if (!canvasRef.current || loading || !contract || (contract.status === 'both_signed' || contract.party_b_signed)) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#c9a84c';
    }, [contract, loading]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let clientX = 0, clientY = 0;

        if ('touches' in e) {
            clientX = (e as React.TouchEvent).touches[0].clientX;
            clientY = (e as React.TouchEvent).touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
        setIsDrawing(true);
        setIsCanvasEmpty(false);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let clientX = 0, clientY = 0;

        if ('touches' in e) {
            clientX = (e as React.TouchEvent).touches[0].clientX;
            clientY = (e as React.TouchEvent).touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        setIsCanvasEmpty(true);
    };

    const handleSign = async () => {
        if (!name || !agreed) {
            showToast('서명자 이름을 입력하고 동의 체크박스에 체크해주세요.', 'error');
            return;
        }
        if (isCanvasEmpty) {
            showToast('서명 패드에 서명을 그려주세요.', 'error');
            return;
        }
        
        setSigning(true);
        
        try {
            const signature_data_url = canvasRef.current?.toDataURL('image/png') || null;
            const supabase = getBrowserSupabase();
            if (!supabase) throw new Error('데이터베이스 설정(Supabase) 에러입니다.');
            
            const { error, data } = await supabase
                .from('contracts')
                .update({
                    party_b_signed: true,
                    party_b_name: name,
                    signature_data_url: signature_data_url,
                    status: 'both_signed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', params.id)
                .select()
                .single();
                
            if (error) throw error;
            
            setContract(data);
            showToast('서명이 완료되었습니다.');
        } catch (err: any) {
             showToast(err.message || '서명 처리 중 오류가 발생했습니다.', 'error');
        } finally {
            setSigning(false);
        }
    };

    const handleDownloadPDF = async () => {
        setDownloadingPDF(true);
        try {
            const blob = await pdf(<ContractPDF contract={contract} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${contract.title.replace(/\s+/g, '_')}_서명완료.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast('PDF 다운로드가 시작되었습니다.');
        } catch (error) {
            console.error('PDF generation error:', error);
            showToast('PDF 생성 중 오류가 발생했습니다.', 'error');
        } finally {
            setDownloadingPDF(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-32 flex justify-center" style={{ background: '#04091a' }}>
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#c9a84c' }} />
            </div>
        );
    }

    if (!contract) return null;

    const isFullySigned = contract.status === 'both_signed' || contract.party_b_signed;
    const createdDate = new Date(contract.created_at).toLocaleString('ko-KR');

    return (
        <div className="min-h-screen pt-20 pb-12" style={{ background: '#04091a' }}>
            <div className="max-w-3xl mx-auto px-4 relative">
                {toastMsg && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                                className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full font-bold text-sm shadow-lg flex items-center gap-2"
                                style={{ 
                                    background: toastType === 'success' ? '#111827' : '#27272a',
                                    border: toastType === 'error' ? '1px solid #dc2626' : '1px solid #4ade80',
                                    color: '#fff' 
                                }}>
                        {toastType === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                        {toastMsg}
                    </motion.div>
                )}

                <Link href="/contracts">
                    <button className="flex items-center gap-2 text-sm mb-6 mt-4 transition-all hover:opacity-80"
                        style={{ color: 'rgba(240,244,255,0.5)' }}>
                        <ArrowLeft className="w-4 h-4" /> 목록으로
                    </button>
                </Link>

                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl mb-6"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.15)' }}>
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl shrink-0" style={{ background: 'rgba(201,168,76,0.12)' }}>
                            <FileText className="w-6 h-6" style={{ color: '#c9a84c' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-black mb-1 truncate" style={{ color: '#f0f4ff' }}>{contract.title}</h1>
                            <p className="text-sm truncate" style={{ color: 'rgba(240,244,255,0.5)' }}>
                                {contract.template} · 작성일 {createdDate.split(' ')[0]}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3">
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {contract.party_a_signed
                                        ? <CheckCircle2 className="w-4 h-4" style={{ color: '#4ade80' }} />
                                        : <Clock className="w-4 h-4" style={{ color: '#94a3b8' }} />}
                                    <span className="text-xs" style={{ color: 'rgba(240,244,255,0.6)' }}>
                                        {contract.party_a_name} {contract.party_a_signed ? `서명 완료` : '서명 대기'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {isFullySigned
                                        ? <CheckCircle2 className="w-4 h-4" style={{ color: '#4ade80' }} />
                                        : <Clock className="w-4 h-4" style={{ color: '#fb923c' }} />}
                                    <span className="text-xs" style={{ color: 'rgba(240,244,255,0.6)' }}>
                                        {contract.party_b_name || contract.party_b_email || '상대방'} {isFullySigned ? '서명 완료' : '서명 대기'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="p-6 rounded-2xl mb-6"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <h2 className="font-bold text-sm mb-4" style={{ color: 'rgba(240,244,255,0.6)' }}>계약서 내용</h2>
                    <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'rgba(240,244,255,0.85)', fontFamily: 'inherit' }}>
                        {contract.content}
                    </pre>
                </div>

                {!isFullySigned ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-2xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.2)' }}>
                        <div className="flex items-center gap-2 mb-5">
                            <Shield className="w-5 h-5" style={{ color: '#c9a84c' }} />
                            <h2 className="font-black" style={{ color: '#c9a84c' }}>전자 서명</h2>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-1.5" style={{ color: 'rgba(240,244,255,0.7)' }}>서명자 이름</label>
                            <input value={name} onChange={e => setName(e.target.value)}
                                placeholder="서명할 이름을 입력하세요 (예: 홍길동)"
                                className="w-full px-4 py-3 rounded-xl outline-none text-sm transition-all focus:border-opacity-50"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff' }} />
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-sm font-bold" style={{ color: 'rgba(240,244,255,0.7)' }}>서명 (패드에 직접 그려주세요)</label>
                                <button onClick={clearCanvas}
                                    className="text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-white/5"
                                    style={{ color: 'rgba(240,244,255,0.5)' }}>
                                    <Eraser className="w-3 h-3" /> 지우기
                                </button>
                            </div>
                            <div className="relative rounded-xl overflow-hidden w-full h-[150px] sm:h-[200px]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', touchAction: 'none' }}>
                                <canvas
                                    ref={canvasRef}
                                    width={800}
                                    height={200}
                                    className="w-full h-full cursor-crosshair"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                    onTouchCancel={stopDrawing}
                                />
                                {isCanvasEmpty && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-sm" style={{ color: 'rgba(240,244,255,0.2)' }}>
                                        여기에 서명해주세요
                                    </div>
                                )}
                            </div>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer mb-5">
                            <div onClick={() => setAgreed(a => !a)}
                                className="w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-all bg-white/5 border border-white/10"
                                style={{ background: agreed ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${agreed ? '#4ade80' : 'rgba(255,255,255,0.15)'}` }}>
                                {agreed && <CheckCircle2 className="w-3 h-3" style={{ color: '#4ade80' }} />}
                            </div>
                            <span className="text-sm cursor-pointer select-none" onClick={() => setAgreed(a => !a)} style={{ color: 'rgba(240,244,255,0.6)' }}>
                                위 계약 내용을 충분히 읽고 이해하였으며, 전자서명에 동의합니다. 본 전자서명은 전자서명법 제3조에 따라 법적 효력을 가집니다.
                            </span>
                        </label>
                        
                        <button onClick={handleSign} disabled={signing || !name || !agreed || isCanvasEmpty}
                            className="w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#0a0e1a' }}>
                            {signing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> 서명 완료</>}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="p-8 rounded-2xl text-center"
                        style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}>
                        <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#4ade80' }} />
                        <h2 className="text-2xl font-black mb-2" style={{ color: '#4ade80' }}>서명 완료!</h2>
                        <p className="text-sm mb-6" style={{ color: 'rgba(240,244,255,0.6)' }}>
                            양쪽 서명이 모두 완료되었습니다.<br />
                            안전하게 저장되었으며, 담당자가 확인 후 연락드리겠습니다.
                        </p>
                        
                        <button onClick={handleDownloadPDF} disabled={downloadingPDF}
                            className="mx-auto px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: 'rgba(255,255,255,0.1)', color: '#f0f4ff', border: '1px solid rgba(255,255,255,0.2)' }}>
                            {downloadingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {downloadingPDF ? 'PDF 생성 중...' : 'PDF 다운로드 (서명 포함)'}
                        </button>

                        <p className="text-xs mt-6" style={{ color: 'rgba(240,244,255,0.3)' }}>
                            서명 일시: {new Date(contract.updated_at).toLocaleString('ko-KR')} · 블록체인 타임스탬프 기록 완료
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
