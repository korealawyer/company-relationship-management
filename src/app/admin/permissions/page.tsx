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
  full: { bg: '#dcfce7', text: '#16a34a', border: '#86efac', label: '전체' },
  own: { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: '담당건만' },
  none: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5', label: '제한' },
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
    <div style={{ minHeight: '100vh', background: '#f8f9fc' }}>
      {/* 헤더 */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: '#64748b', textDecoration: 'none' }}>
                <ChevronLeft style={{ width: 16, height: 16 }} /> 관리자
              </Link>
              <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield style={{ width: 18, height: 18, color: '#2563eb' }} />
                </div>
                <div>
                  <h1 style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', margin: 0 }}>권한 관리</h1>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>직원별 기능 접근 권한을 설정합니다</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                <RotateCcw style={{ width: 14, height: 14 }} /> 초기화
              </button>
              <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: '#ffffff', border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                <Save style={{ width: 14, height: 14 }} /> {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', gap: 20 }}>
          {/* 좌측: 직원 목록 */}
          <div style={{ width: 260, flexShrink: 0 }}>
            <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8f9fc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users style={{ width: 14, height: 14, color: '#64748b' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>직원 목록</span>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: '#eff6ff', color: '#2563eb', fontWeight: 700 }}>{users.length}명</span>
                </div>
              </div>
              {users.map(u => (
                <div key={u.userId} onClick={() => setSelectedUserId(u.userId)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: selectedUserId === u.userId ? '#eff6ff' : 'transparent', borderLeft: selectedUserId === u.userId ? '3px solid #2563eb' : '3px solid transparent', transition: 'all 0.15s' }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', margin: 0 }}>{u.userName}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: LEVEL_COLORS[u.role === 'partner' ? 'full' : u.role === 'associate' ? 'own' : 'none'].bg, color: LEVEL_COLORS[u.role === 'partner' ? 'full' : u.role === 'associate' ? 'own' : 'none'].text, fontWeight: 700 }}>
                      {PRESET_LABELS[u.role as PresetRole] || u.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 우측: 권한 매트릭스 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {selectedUser ? (
              <motion.div key={selectedUser.userId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {/* 사용자 헤더 */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 900, color: '#1e293b', margin: 0 }}>{selectedUser.userName}</h2>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>11가지 권한을 개별 설정하거나 프리셋을 적용하세요</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(Object.keys(PRESET_LABELS) as PresetRole[]).map(p => (
                      <button key={p} onClick={() => applyPreset(selectedUser.userId, p)} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 8, fontWeight: 700, background: selectedUser.role === p ? '#1e293b' : '#f1f5f9', color: selectedUser.role === p ? '#ffffff' : '#64748b', border: `1px solid ${selectedUser.role === p ? '#1e293b' : '#e2e8f0'}`, cursor: 'pointer' }}>
                        {PRESET_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 권한 항목 목록 */}
                <div>
                  {PERMISSION_KEYS.map((key, idx) => {
                    const level = selectedUser.permissions[key];
                    const lc = LEVEL_COLORS[level];
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: idx < PERMISSION_KEYS.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: lc.bg }}>
                            {level === 'full' ? <Unlock style={{ width: 14, height: 14, color: lc.text }} /> :
                             level === 'own' ? <Eye style={{ width: 14, height: 14, color: lc.text }} /> :
                             <Lock style={{ width: 14, height: 14, color: lc.text }} />}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>{idx + 1}. {PERMISSION_LABELS[key]}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {(['full', 'own', 'none'] as PermissionLevel[]).map(l => {
                            const c = LEVEL_COLORS[l];
                            const isActive = level === l;
                            return (
                              <button key={l} onClick={() => handleLevelChange(selectedUser.userId, key, l)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, fontWeight: 700, background: isActive ? c.bg : 'transparent', color: isActive ? c.text : '#94a3b8', border: `1px solid ${isActive ? c.border : '#e2e8f0'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
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
              <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                <Users style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.3 }} />
                <p style={{ fontSize: 14, fontWeight: 700 }}>직원을 선택하세요</p>
              </div>
            )}

            {/* 일괄 매트릭스 뷰 (하단) */}
            <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: 20 }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8f9fc' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>📊 전체 권한 매트릭스 (클릭하여 변경)</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f8f9fc' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0', position: 'sticky', left: 0, background: '#f8f9fc', minWidth: 120 }}>직원</th>
                      {PERMISSION_KEYS.map((key, i) => (
                        <th key={key} style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, color: '#94a3b8', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', minWidth: 60 }}>{i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.userId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1e293b', position: 'sticky', left: 0, background: '#ffffff', whiteSpace: 'nowrap' }}>{u.userName}</td>
                        {PERMISSION_KEYS.map(key => {
                          const l = u.permissions[key];
                          const c = LEVEL_COLORS[l];
                          return (
                            <td key={key} onClick={() => cyclePerm(u.userId, key)} style={{ padding: '6px 4px', textAlign: 'center', cursor: 'pointer' }}>
                              <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: 6, fontWeight: 700, fontSize: 10, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{c.label}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '8px 20px', background: '#f8f9fc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {PERMISSION_KEYS.map((key, i) => (
                  <span key={key} style={{ fontSize: 10, color: '#94a3b8' }}>{i + 1}={PERMISSION_LABELS[key]}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: '#111827', color: '#f0f4ff', border: '1px solid rgba(201,168,76,0.3)', zIndex: 100, whiteSpace: 'nowrap' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
