'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronLeft, Save, RotateCcw, Users, Lock, Unlock, Eye } from 'lucide-react';
import Link from 'next/link';
import {
  permissionStore,
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  PRESET_LABELS,
  PRESETS,
  type UserPermission,
  type PermissionKey,
  type PermissionLevel,
  type PresetRole,
} from '@/lib/permissions';

const LEVEL_COLORS: Record<PermissionLevel, { bg: string; text: string; border: string; label: string }> = {
  full: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: '전체' }, // emerald
  own: { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: '담당건만' }, // amber
  none: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: '제한' }, // red
};

export default function AdminPermissionsPage() {
  const [users, setUsers] = useState<UserPermission[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUsers(permissionStore.getAll());
  }, []);

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) setSelectedUserId(users[0].userId);
  }, [users, selectedUserId]);

  const selectedUser = users.find(u => u.userId === selectedUserId);

  const handleLevelChange = (userId: string, key: PermissionKey, level: PermissionLevel) => {
    setUsers(prev => prev.map(u =>
      u.userId === userId ? { ...u, permissions: { ...u.permissions, [key]: level } } : u
    ));
  };

  const applyPreset = (userId: string, preset: PresetRole) => {
    setUsers(prev => prev.map(u =>
      u.userId === userId ? { ...u, permissions: { ...PRESETS[preset] }, role: preset } : u
    ));
    showToast(`✅ ${PRESET_LABELS[preset]} 프리셋이 적용되었습니다`);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    permissionStore.saveAll(users);
    setSaving(false);
    showToast('✅ 권한 설정이 저장되었습니다');
  };

  const handleReset = () => {
    setUsers(permissionStore.getAll());
    showToast('↩️ 변경사항이 초기화되었습니다');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const cyclePerm = (userId: string, key: PermissionKey) => {
    const current = users.find(u => u.userId === userId)?.permissions[key] || 'none';
    const order: PermissionLevel[] = ['full', 'own', 'none'];
    const idx = order.indexOf(current);
    const next = order[(idx + 1) % order.length];
    handleLevelChange(userId, key, next);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-16">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 h-[60px] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/employee">
            <button className="text-[13px] text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-none cursor-pointer font-medium">← 돌아가기</button>
          </Link>
          <div className="w-px h-4 bg-slate-200" />
          <span className="text-[15px] font-black text-slate-800 flex items-center gap-2">🛡️ 권한 관리</span>
          <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 py-0.5 px-2 rounded-full">관리자 전용</span>
        </div>
        <div className="flex gap-2">
            <button onClick={handleReset} className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg py-1.5 px-3.5 cursor-pointer text-[13px] font-semibold transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> 초기화
            </button>
            <button onClick={handleSave} disabled={saving} className={`flex items-center gap-1.5 border-none rounded-lg py-1.5 px-4 cursor-pointer text-[13px] font-bold shadow-sm transition-all ${saving ? 'opacity-60 bg-amber-500' : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'}`}>
                <Save className="w-3.5 h-3.5" /> {saving ? '저장 중...' : '저장'}
            </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto py-8 px-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* 좌측: 직원 목록 */}
          <div className="w-full md:w-[260px] shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[12px] font-bold text-slate-600">직원 목록</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-bold ml-auto">{users.length}명</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
              {users.map(u => (
                <div key={u.userId} onClick={() => setSelectedUserId(u.userId)} className={`px-4 py-3 cursor-pointer transition-all border-l-[3px] ${selectedUserId === u.userId ? 'bg-amber-50/30 border-l-amber-500' : 'bg-transparent border-l-transparent hover:bg-slate-50'}`}>
                  <p className="text-[14px] font-black text-slate-800 m-0">{u.userName}</p>
                  <div className="flex gap-1.5 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold" style={{ background: LEVEL_COLORS[u.role === 'partner' ? 'full' : u.role === 'associate' ? 'own' : 'none'].bg, color: LEVEL_COLORS[u.role === 'partner' ? 'full' : u.role === 'associate' ? 'own' : 'none'].text, border: `1px solid ${LEVEL_COLORS[u.role === 'partner' ? 'full' : u.role === 'associate' ? 'own' : 'none'].border}` }}>
                      {PRESET_LABELS[u.role as PresetRole] || u.role}
                    </span>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>

          {/* 우측: 권한 매트릭스 */}
          <div className="flex-1 min-w-0">
            {selectedUser ? (
              <motion.div key={selectedUser.userId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {/* 사용자 헤더 */}
                <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-black text-slate-800 m-0 leading-none">{selectedUser.userName}</h2>
                    <p className="text-xs font-medium text-slate-500 m-0 mt-2">11가지 권한을 개별 설정하거나 프리셋을 적용하세요</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {(Object.keys(PRESET_LABELS) as PresetRole[]).map(p => (
                      <button key={p} onClick={() => applyPreset(selectedUser.userId, p)} className={`text-[11px] px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all border ${selectedUser.role === p ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'}`}>
                        {PRESET_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 권한 항목 목록 */}
                <div className="divide-y divide-slate-100">
                  {PERMISSION_KEYS.map((key, idx) => {
                    const level = selectedUser.permissions[key];
                    const lc = LEVEL_COLORS[level];
                    return (
                      <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between p-4 sm:px-5 sm:py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm shrink-0" style={{ background: lc.bg, borderColor: lc.border }}>
                            {level === 'full' ? <Unlock className="w-4 h-4" style={{ color: lc.text }} /> :
                             level === 'own' ? <Eye className="w-4 h-4" style={{ color: lc.text }} /> :
                             <Lock className="w-4 h-4" style={{ color: lc.text }} />}
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-slate-800 m-0">{idx + 1}. {PERMISSION_LABELS[key]}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {(['full', 'own', 'none'] as PermissionLevel[]).map(l => {
                            const c = LEVEL_COLORS[l];
                            const isActive = level === l;
                            return (
                              <button key={l} onClick={() => handleLevelChange(selectedUser.userId, key, l)} className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition-all border`} style={{ background: isActive ? c.bg : 'transparent', color: isActive ? c.text : '#94a3b8', borderColor: isActive ? c.border : '#e2e8f0', boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>
                                {c.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <div className="text-center p-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-[14px] font-bold">직원을 선택하세요</p>
              </div>
            )}

            {/* 일괄 매트릭스 뷰 (하단) */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-6">
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
                <span className="text-[12px] font-bold text-slate-600">📊 전체 권한 매트릭스 (클릭하여 변경)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-3 text-left font-bold text-slate-500 border-b border-slate-200 sticky left-0 z-10 min-w-[120px]" style={{ background: '#f8f9fc', WebkitBackdropFilter: 'blur(4px)', backdropFilter: 'blur(4px)' }}>직원</th>
                      {PERMISSION_KEYS.map((key, i) => (
                        <th key={key} className="p-2 text-center font-bold text-slate-400 border-b border-slate-200 whitespace-nowrap min-w-[60px]">{i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.userId} className={`transition-colors ${selectedUserId === u.userId ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}>
                        <td className="p-3 font-bold text-slate-800 sticky left-0 whitespace-nowrap" style={{ background: selectedUserId === u.userId ? '#f8f9fc' : '#ffffff', WebkitBackdropFilter: 'blur(4px)', backdropFilter: 'blur(4px)' }}>{u.userName}</td>
                        {PERMISSION_KEYS.map(key => {
                          const l = u.permissions[key];
                          const c = LEVEL_COLORS[l];
                          return (
                            <td key={key} onClick={() => cyclePerm(u.userId, key)} className="p-1.5 text-center cursor-pointer">
                              <span className="inline-block px-1.5 py-0.5 rounded-md font-bold text-[10px] border transition-all hover:opacity-80" style={{ background: c.bg, color: c.text, borderColor: c.border }}>{c.label}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-4 flex-wrap">
                {PERMISSION_KEYS.map((key, i) => (
                  <span key={key} className="text-[10px] font-medium text-slate-500 whitespace-nowrap">{i + 1}. {PERMISSION_LABELS[key]}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-[13px] font-bold bg-slate-800 text-white shadow-lg border border-slate-700 z-[200] whitespace-nowrap">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
