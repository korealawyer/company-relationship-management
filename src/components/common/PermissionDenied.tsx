import React from 'react';
import { Lock } from 'lucide-react';

export default function PermissionDenied({ label }: { label: string }) {
    return (
        <div className="h-full flex items-center justify-center" style={{ minHeight: 400 }}>
            <div className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#fef2f2' }}>
                    <Lock className="w-8 h-8" style={{ color: '#dc2626' }} />
                </div>
                <p className="font-bold text-base mb-1" style={{ color: '#1e293b' }}>접근 권한이 없습니다</p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>{label} 기능에 대한 접근 권한이 없습니다.<br/>관리자에게 문의하세요.</p>
            </div>
        </div>
    );
}
