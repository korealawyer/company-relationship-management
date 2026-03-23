'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Mail, Lock, User, Eye, EyeOff, CheckCircle2, Shield, ChevronRight } from 'lucide-react';
import { signUpClientPortal } from '@/lib/auth';

// 사업자번호 포매팅 (000-00-00000)
function formatBiz(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

export default function ClientSignupPage() {
    const router = useRouter();
    const [step, setStep] = useState<'form' | 'done'>('form');
    const [doneCompany, setDoneCompany] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showPw2, setShowPw2] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        bizNum: '',
        name: '',
        email: '',
        password: '',
        password2: '',
        agreedTerms: false,
        agreedPrivacy: false,
        agreedMarketing: false,
    });

    const set = (k: keyof typeof form, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.password2) {
            setError('비밀번호가 일치하지 않습니다.'); return;
        }
        setSubmitting(true);
        // 짧은 딜레이로 로딩 UX 제공
        await new Promise(r => setTimeout(r, 600));
        const result = await signUpClientPortal({
            bizNum: form.bizNum,
            email: form.email,
            password: form.password,
            name: form.name,
            agreedTerms: form.agreedTerms,
            agreedPrivacy: form.agreedPrivacy,
        });
        setSubmitting(false);
        if (result.success) {
            setDoneCompany(result.companyName);
            setStep('done');
        } else {
            setError(result.error);
        }
    };

    // ── 완료 화면 ────────────────────────────────────────────
    if (step === 'done') return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ background: '#fff', borderRadius: 24, padding: '48px 56px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <CheckCircle2 size={40} color="#16a34a" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>가입 완료!</h2>
                <p style={{ fontSize: 15, color: '#374151', fontWeight: 700, margin: '0 0 4px' }}>{doneCompany}</p>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 28px' }}>IBS 법률사무소 고객 포털에 오신 것을 환영합니다.</p>
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', marginBottom: 28, textAlign: 'left' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 10, letterSpacing: 0.5 }}>가입 완료 → 이후 로그인 방법</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                        <Mail size={14} color="#2563eb" />
                        <span>{form.email}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>위 이메일 + 비밀번호로 재방문 시 로그인하세요.</div>
                </div>
                <button
                    onClick={() => router.push('/dashboard')}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 900, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    대시보드 바로가기 <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );

    // ── 가입 폼 화면 ─────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ width: '100%', maxWidth: 480 }}>

                {/* 헤더 */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '8px 18px', marginBottom: 20 }}>
                        <Shield size={16} color="#c9a84c" />
                        <span style={{ color: '#c9a84c', fontWeight: 800, fontSize: 13 }}>IBS 법률사무소</span>
                    </div>
                    <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.02em' }}>고객 포털 가입</h1>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: 0 }}>사업자번호로 귀사를 확인 후 계정을 만드세요</p>
                </div>

                {/* 카드 */}
                <div style={{ background: '#fff', borderRadius: 20, padding: '36px 40px', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                        {/* 사업자번호 */}
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                                사업자번호 <span style={{ color: '#ef4444' }}>*</span>
                                <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>회사 본인 확인 (1회)</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Building2 size={15} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    required
                                    placeholder="000-00-00000"
                                    value={form.bizNum}
                                    onChange={e => set('bizNum', formatBiz(e.target.value))}
                                    style={{ width: '100%', padding: '11px 12px 11px 36px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                                />
                            </div>
                        </div>

                        {/* 이름 */}
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                                담당자 이름 <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <User size={15} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    required
                                    placeholder="홍길동"
                                    value={form.name}
                                    onChange={e => set('name', e.target.value)}
                                    style={{ width: '100%', padding: '11px 12px 11px 36px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        {/* 이메일 */}
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                                이메일 <span style={{ color: '#ef4444' }}>*</span>
                                <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>이후 로그인 ID로 사용</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={15} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    required
                                    type="email"
                                    placeholder="you@company.com"
                                    value={form.email}
                                    onChange={e => set('email', e.target.value)}
                                    style={{ width: '100%', padding: '11px 12px 11px 36px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        {/* 비밀번호 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>비밀번호 <span style={{ color: '#ef4444' }}>*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={15} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                                    <input
                                        required
                                        type={showPw ? 'text' : 'password'}
                                        placeholder="6자 이상"
                                        value={form.password}
                                        onChange={e => set('password', e.target.value)}
                                        style={{ width: '100%', padding: '11px 36px 11px 36px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                    <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                        {showPw ? <EyeOff size={14} color="#9ca3af" /> : <Eye size={14} color="#9ca3af" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>비밀번호 확인 <span style={{ color: '#ef4444' }}>*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={15} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                                    <input
                                        required
                                        type={showPw2 ? 'text' : 'password'}
                                        placeholder="동일하게 입력"
                                        value={form.password2}
                                        onChange={e => set('password2', e.target.value)}
                                        style={{ width: '100%', padding: '11px 36px 11px 36px', border: `1.5px solid ${form.password2 && form.password !== form.password2 ? '#ef4444' : '#e5e7eb'}`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                    <button type="button" onClick={() => setShowPw2(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                        {showPw2 ? <EyeOff size={14} color="#9ca3af" /> : <Eye size={14} color="#9ca3af" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 구분선 */}
                        <div style={{ borderTop: '1px solid #f3f4f6', margin: '0 -4px' }} />

                        {/* 약관 동의 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { key: 'agreedTerms', label: '서비스 이용약관 동의', required: true, href: '/terms/service' },
                                { key: 'agreedPrivacy', label: '개인정보처리방침 동의', required: true, href: '/terms/privacy' },
                                { key: 'agreedMarketing', label: '법무 뉴스레터 수신 동의', required: false, href: null },
                            ].map(t => (
                                <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={form[t.key as keyof typeof form] as boolean}
                                        onChange={e => set(t.key as keyof typeof form, e.target.checked)}
                                        style={{ width: 16, height: 16, accentColor: '#1d4ed8', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>
                                        {t.required && <span style={{ color: '#ef4444', marginRight: 3 }}>[필수]</span>}
                                        {!t.required && <span style={{ color: '#9ca3af', marginRight: 3 }}>[선택]</span>}
                                        {t.label}
                                    </span>
                                    {t.href && (
                                        <a href={t.href} target="_blank" style={{ fontSize: 11, color: '#2563eb', textDecoration: 'underline' }}>보기</a>
                                    )}
                                </label>
                            ))}
                        </div>

                        {/* 에러 메시지 */}
                        {error && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                                ⚠️ {error}
                            </div>
                        )}

                        {/* 제출 버튼 */}
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{ background: submitting ? '#93c5fd' : 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 900, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(29,78,216,0.35)' }}>
                            {submitting ? '가입 처리 중...' : <>가입 완료 <ChevronRight size={18} /></>}
                        </button>

                        <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', margin: 0 }}>
                            이미 계정이 있으신가요?{' '}
                            <a href="/login" style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>로그인</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
