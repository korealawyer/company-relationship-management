'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Briefcase, Image as ImageIcon, CheckCircle2, Upload, Loader2, Save } from 'lucide-react';
import { getBrowserSupabase } from '@/lib/supabase';
import { getCurrentUserId } from '@/lib/permissions';

export default function LawyerProfileTab() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>({ name: '', department: '', title: '' });
    const [signatureUrl, setSignatureUrl] = useState<string>('');
    const [uploadingImage, setUploadingImage] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function fetchProfile() {
            setLoading(true);
            const lawyerId = getCurrentUserId() || '3'; 
            const supabase = getBrowserSupabase();
            
            try {
                const { data, error } = await supabase
                    .from('lawyers')
                    .select('*')
                    .eq('id', lawyerId)
                    .single();
                
                if (data) {
                    setProfile({
                       name: data.name || '',
                       department: data.department || '',
                       title: data.title || '',
                    });
                    setSignatureUrl(data.signature_image_url || '');
                } else {
                    // Fallback mock if data is missing
                    setProfile({
                        name: '임시 변호사',
                        department: '기업자문팀',
                        title: '파트너 변호사',
                    });
                }
            } catch (err) {
                console.error("fetchProfile err", err);
            }
            setLoading(false);
        }
        fetchProfile();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset file input so same file can be uploaded again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';

        setUploadingImage(true);
        try {
            const supabase = getBrowserSupabase();
            const lawyerId = getCurrentUserId() || '3';
            const fileExt = file.name.split('.').pop();
            const fileName = `signature_${lawyerId}_${Date.now()}.${fileExt}`;
            
            // Upload to Supabase Storage bucket 'signatures'
            const { error } = await supabase.storage
                .from('signatures')
                .upload(fileName, file, { upsert: true });

            if (error) {
                console.error(error);
                throw error;
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from('signatures')
                .getPublicUrl(fileName);

            const url = publicUrlData.publicUrl;
            
            // Update local state
            setSignatureUrl(url);
            
        } catch (err: any) {
            console.error('Upload error:', err);
            // Storage bucket might not exist yet -> show helpful alert
            alert(`이미지 업로드 실패\n\n에러 메세지: ${err.message || '알 수 없는 에러'}\n\n* Supabase 대시보드에 'signatures' 이라는 공개(Public) Storage 버킷이 생성되어 있는지 확인해주세요!`);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const supabase = getBrowserSupabase();
            const lawyerId = getCurrentUserId() || '3';
            
            const { error } = await supabase
                .from('lawyers')
                .upsert({ 
                    id: lawyerId, 
                    name: profile.name,
                    department: profile.department,
                    title: profile.title,
                    signature_image_url: signatureUrl,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });
                
            if (error) throw error;
            alert('프로필이 성공적으로 저장되었습니다.');
        } catch (err) {
            console.error('Save error:', err);
            alert('저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>프로필 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-2">
                    <User className="w-6 h-6 text-violet-500" />
                    내 프로필 설정
                </h1>
                <p className="text-sm text-slate-500 font-medium">개인정보 보호 분석 검토안 및 파트너 서명란에 노출될 정보를 관리합니다.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {/* 폼 영역 */}
                <div className="p-8 space-y-8">
                    
                    {/* 일반 정보 */}
                    <div>
                        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            담당자 기본 정보
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[13px] font-bold text-slate-600 mb-1.5">이름 (Full Name)</label>
                                <input
                                    type="text"
                                    disabled
                                    value={profile.name}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 font-medium"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">이름 변경은 관리자에게 문의하세요.</p>
                            </div>
                            <div>
                                <label className="block text-[13px] font-bold text-slate-600 mb-1.5">직함 (Title)</label>
                                <input
                                    type="text"
                                    value={profile.title}
                                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all"
                                    placeholder="예: 파트너 변호사"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[13px] font-bold text-slate-600 mb-1.5">소속 부서 (Department)</label>
                                <input
                                    type="text"
                                    value={profile.department}
                                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all"
                                    placeholder="예: 개인정보보호 및 AI 규제대응팀"
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* 서명 이미지 섹션 */}
                    <div>
                        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-slate-400" />
                            전자 서명 이미지
                        </h2>
                        
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* 업로드 & 미리보기 */}
                            <div className="flex-1 w-full">
                                <div 
                                    className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all ${
                                        uploadingImage ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                                    }`}
                                >
                                    <input 
                                        ref={fileInputRef}
                                        type="file" 
                                        accept="image/png, image/jpeg" 
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        disabled={uploadingImage}
                                    />
                                    
                                    {uploadingImage ? (
                                        <div className="flex flex-col items-center text-violet-500">
                                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                            <p className="text-sm font-bold">업로드 중...</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-400 pointer-events-none">
                                            <Upload className="w-8 h-8 mb-3 text-slate-300" />
                                            <p className="text-sm font-bold text-slate-600 mb-1">여기를 클릭하여 서명 업로드</p>
                                            <p className="text-xs">PNG, JPG (투명 배경 권장)</p>
                                            
                                            {signatureUrl && (
                                                <div className="mt-4 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> 새로 업로드됨
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <p className="text-[12px] text-slate-400 font-medium mt-3 leading-snug">
                                    💡 <b>팁:</b> 흰 배경이 있는 사진보다는, 종이에 서명 후 배경을 투명하게 지운 PNG 파일을 올리시면 클라이언트 리포트에서 훨씬 더 자연스럽게 렌더링됩니다.
                                </p>
                            </div>

                            {/* 클라이언트 노출 프리뷰 */}
                            <div className="w-full md:w-[300px] shrink-0 border border-slate-200 rounded-xl overflow-hidden bg-white">
                                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                                    <p className="text-[11px] font-black tracking-wider text-slate-500 uppercase">
                                        고객 리포트 (미리보기)
                                    </p>
                                </div>
                                <div className="p-6 relative flex justify-end" style={{ backgroundColor: '#e5e3db' /* Privacy Review Paper Texture */ }}>
                                    <div className="text-right">
                                        <div className="text-[12px] font-medium text-slate-500 mb-1 tracking-tight">검토 담당 변호사</div>
                                        <div className="flex items-center justify-end gap-3">
                                            <span className="text-[15px] font-black text-slate-800 tracking-wide" style={{ letterSpacing: '-0.02em' }}>
                                                변호사 {profile.name}
                                            </span>
                                            {signatureUrl ? (
                                                <div className="w-16 h-12 relative -my-4 -mr-1" style={{ mixBlendMode: 'multiply' }}>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img 
                                                        src={signatureUrl} 
                                                        alt="Lawyer Signature Preview" 
                                                        className="w-full h-full object-contain object-right"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-8 border border-dashed border-slate-400/30 rounded flex items-center justify-center text-[10px] text-slate-500 font-bold">
                                                    서명 없음
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* 텍스쳐 효과 오버레이 (간이) */}
                                    <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 하단 버튼 */}
                <div className="bg-slate-50 px-8 py-5 border-t border-slate-200 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving || uploadingImage}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-white shadow-sm transition-all relative overflow-hidden disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                저장 중...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                프로필 변경사항 저장
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
