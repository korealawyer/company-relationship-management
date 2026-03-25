import React from 'react';
import { Clock, CheckCircle2, FileText } from 'lucide-react';
import { T } from '../../types';
import { store } from '@/lib/mockStore';

export default function BillingActivityLog() {
    return (
        <div className="mt-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="px-6 py-4" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                <h3 className="font-black flex items-center gap-2" style={{ color: T.heading }}>
                    <Clock className="w-4 h-4" style={{ color: T.gold }} />
                    최근 활동 로그
                </h3>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
                {store.getLogs().filter(l =>
                    ['auto_email', 'auto_confirm', 'setting_change'].includes(l.type) &&
                    (l.label.includes('계약') || l.label.includes('구독') || l.label.includes('이관') || l.label.includes('이메일'))
                ).slice(0, 10).map(log => (
                    <div key={log.id} className="flex items-start gap-3 py-2.5"
                        style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                                background: log.type === 'auto_confirm' ? '#ecfdf5' : '#eff6ff',
                                color: log.type === 'auto_confirm' ? '#059669' : '#2563eb',
                            }}>
                            {log.type === 'auto_confirm' ? <CheckCircle2 className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold" style={{ color: T.heading }}>{log.label}</span>
                                {log.companyName && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                        style={{ background: T.goldBg, color: T.gold }}>{log.companyName}</span>
                                )}
                            </div>
                            <p className="text-[10px] mt-0.5" style={{ color: T.faint }}>{log.detail}</p>
                        </div>
                        <span className="text-[10px] flex-shrink-0" style={{ color: T.faint }}>{log.at}</span>
                    </div>
                ))}
                {store.getLogs().filter((l: any) =>
                    ['auto_email', 'auto_confirm'].includes(l.type) &&
                    (l.label.includes('계약') || l.label.includes('구독') || l.label.includes('이관') || l.label.includes('이메일'))
                ).length === 0 && (
                    <div className="text-center py-8">
                        <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: T.faint }} />
                        <p className="text-xs" style={{ color: T.muted }}>결제 관련 활동 로그가 없습니다</p>
                    </div>
                )}
            </div>
        </div>
    );
}
