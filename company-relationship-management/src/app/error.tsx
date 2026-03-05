'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // TODO: Sentry 등 에러 트래킹 서비스로 에러 전송
        console.error('[GlobalError]', error);
    }, [error]);

    return (
        <div
            className="min-h-[60vh] flex items-center justify-center px-4"
            style={{ background: '#04091a' }}
        >
            <div className="text-center max-w-md">
                {/* 아이콘 */}
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{
                        background: 'rgba(248,113,113,0.1)',
                        border: '1px solid rgba(248,113,113,0.3)',
                    }}
                >
                    <AlertTriangle className="w-8 h-8" style={{ color: '#f87171' }} />
                </div>

                {/* 제목 */}
                <h2
                    className="text-2xl font-black mb-3"
                    style={{ color: '#f0f4ff' }}
                >
                    문제가 발생했습니다
                </h2>

                {/* 설명 */}
                <p
                    className="text-sm mb-8 leading-relaxed"
                    style={{ color: 'rgba(240,244,255,0.6)' }}
                >
                    페이지를 표시하는 중 예상치 못한 오류가 발생했습니다.
                    <br />
                    다시 시도하시거나, 문제가 계속되면 고객센터에 문의해 주세요.
                </p>

                {/* 에러 디테일 (개발 모드에서만 표시) */}
                {process.env.NODE_ENV === 'development' && (
                    <div
                        className="text-left text-xs p-4 rounded-xl mb-6 font-mono overflow-auto max-h-32"
                        style={{
                            background: 'rgba(248,113,113,0.05)',
                            border: '1px solid rgba(248,113,113,0.15)',
                            color: '#f87171',
                        }}
                    >
                        {error.message}
                    </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                            background: 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                            color: '#04091a',
                        }}
                    >
                        <RefreshCw className="w-4 h-4" />
                        다시 시도
                    </button>
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#f0f4ff',
                        }}
                    >
                        <Home className="w-4 h-4" />
                        홈으로
                    </Link>
                </div>
            </div>
        </div>
    );
}
