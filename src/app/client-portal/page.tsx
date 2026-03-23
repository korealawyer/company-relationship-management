'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/* /client-portal → /privacy-report redirect
 * 영업팀의 기존 이메일 링크(?biz=&rep=)를 깨지 않고 그대로 전달합니다.
 */
function RedirectInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    useEffect(() => {
        const qs = searchParams.toString();
        router.replace(`/privacy-report${qs ? `?${qs}` : ''}`);
    }, [router, searchParams]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8f7f4',
        }}>
            <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 600 }}>
                이동 중...
            </div>
        </div>
    );
}

export default function ClientPortalRedirect() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f4' }}>
                <div style={{ fontSize: 14, color: '#6b7280' }}>이동 중...</div>
            </div>
        }>
            <RedirectInner />
        </Suspense>
    );
}
