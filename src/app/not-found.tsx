import React from 'react';
import Link from 'next/link';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div
            className="min-h-[60vh] flex items-center justify-center px-4"
            style={{ background: '#04091a' }}
        >
            <div className="text-center max-w-md">
                {/* 404 숫자 */}
                <div
                    className="text-8xl font-black mb-4"
                    style={{
                        background: 'linear-gradient(135deg, #e8c87a, #c9a84c)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    404
                </div>

                {/* 아이콘 */}
                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{
                        background: 'rgba(201,168,76,0.08)',
                        border: '1px solid rgba(201,168,76,0.2)',
                    }}
                >
                    <Search className="w-6 h-6" style={{ color: '#c9a84c' }} />
                </div>

                {/* 제목 */}
                <h2
                    className="text-2xl font-black mb-3"
                    style={{ color: '#f0f4ff' }}
                >
                    페이지를 찾을 수 없습니다
                </h2>

                {/* 설명 */}
                <p
                    className="text-sm mb-8 leading-relaxed"
                    style={{ color: 'rgba(240,244,255,0.6)' }}
                >
                    요청하신 페이지가 존재하지 않거나 이동되었습니다.
                    <br />
                    주소를 다시 확인하시거나, 아래 링크를 이용해 주세요.
                </p>

                {/* 액션 버튼 */}
                <div className="flex gap-3 justify-center">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                            background: 'linear-gradient(135deg,#e8c87a,#c9a84c)',
                            color: '#04091a',
                        }}
                    >
                        <Home className="w-4 h-4" />
                        홈페이지로
                    </Link>
                    <Link
                        href="/login"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#f0f4ff',
                        }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        로그인
                    </Link>
                </div>
            </div>
        </div>
    );
}
