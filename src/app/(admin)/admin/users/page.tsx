'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Users, Search, Edit3, Trash2, Key, Save, X, ChevronDown,
    Shield, ShieldCheck, Phone, Briefcase, Scale, Gavel,
    Calculator, Heart, UserCheck, User, RotateCcw, CheckCircle2, AlertTriangle
} from 'lucide-react';

// ── 타입 정의 ────────────────────────────────────────────────────
interface ManagedUser {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId: string;
    companyName: string;
    createdAt: string;
    lastSignIn: string | null;
    emailConfirmed: boolean;
}

type EditField = 'name' | 'email' | 'role' | 'companyName' | 'password';

interface EditState {
    userId: string;
    field: EditField;
    value: string;
}

// ── 역할 라벨 매핑 ──────────────────────────────────────────────
const ROLE_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    super_admin:     { label: '슈퍼 관리자', color: '#dc2626', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    admin:           { label: '관리자',      color: '#ea580c', icon: <Shield className="w-3.5 h-3.5" /> },
    sales:           { label: '영업팀',      color: '#2563eb', icon: <Phone className="w-3.5 h-3.5" /> },
    lawyer:          { label: '변호사',      color: '#7c3aed', icon: <Scale className="w-3.5 h-3.5" /> },
    litigation:      { label: '송무팀',      color: '#0891b2', icon: <Gavel className="w-3.5 h-3.5" /> },
    general:         { label: '총무팀',      color: '#4b5563', icon: <Briefcase className="w-3.5 h-3.5" /> },
    hr:              { label: '인사팀',      color: '#059669', icon: <UserCheck className="w-3.5 h-3.5" /> },
    finance:         { label: '회계팀',      color: '#ca8a04', icon: <Calculator className="w-3.5 h-3.5" /> },
    counselor:       { label: '상담사',      color: '#db2777', icon: <Heart className="w-3.5 h-3.5" /> },
    client_hr:       { label: '고객사 HR',   color: '#0d9488', icon: <Users className="w-3.5 h-3.5" /> },
    personal_client: { label: '개인 의뢰인', color: '#64748b', icon: <User className="w-3.5 h-3.5" /> },
};

const ALL_ROLES = Object.keys(ROLE_MAP);

export default function AdminUsersPage() {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [editState, setEditState] = useState<EditState | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);

    // ── 유저 목록 로드 ──────────────────────────────────────────
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '유저 목록 조회 실패');
            setUsers(data.users || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // ── 토스트 자동 해제 ────────────────────────────────────────
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    // ── 유저 정보 저장 ──────────────────────────────────────────
    const handleSave = async () => {
        if (!editState) return;
        setSaving(true);
        try {
            const body: any = { userId: editState.userId };
            if (editState.field === 'password') {
                if (editState.value.length < 6) {
                    setToast({ message: '비밀번호는 6자 이상이어야 합니다.', type: 'error' });
                    setSaving(false);
                    return;
                }
                body.password = editState.value;
            } else {
                body[editState.field] = editState.value;
            }

            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '수정 실패');

            setToast({ message: '✅ 수정 완료', type: 'success' });
            setEditState(null);
            fetchUsers();
        } catch (err: any) {
            setToast({ message: err.message, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // ── 유저 삭제 ────────────────────────────────────────────────
    const handleDelete = async (userId: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '삭제 실패');

            setToast({ message: '🗑️ 계정이 삭제되었습니다.', type: 'success' });
            setDeleteConfirm(null);
            fetchUsers();
        } catch (err: any) {
            setToast({ message: err.message, type: 'error' });
        }
    };

    // ── 필터링 ───────────────────────────────────────────────────
    const filtered = users.filter(u => {
        const matchSearch = !search ||
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    // ── 인라인 편집 셀 ──────────────────────────────────────────
    const EditableCell = ({ user, field, currentValue }: { user: ManagedUser; field: EditField; currentValue: string }) => {
        const isEditing = editState?.userId === user.id && editState?.field === field;

        if (isEditing) {
            if (field === 'role') {
                return (
                    <div className="relative">
                        <button
                            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                            className="flex items-center gap-1.5 px-2 py-1 border border-amber-400 rounded-lg bg-white text-[12px] font-semibold text-slate-700 cursor-pointer min-w-[120px]"
                        >
                            {ROLE_MAP[editState.value]?.label || editState.value}
                            <ChevronDown className="w-3 h-3 text-slate-400 ml-auto" />
                        </button>
                        {showRoleDropdown && (
                            <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-[180px] max-h-[260px] overflow-y-auto">
                                {ALL_ROLES.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => {
                                            setEditState({ ...editState, value: r });
                                            setShowRoleDropdown(false);
                                        }}
                                        className={`flex items-center gap-2 w-full px-3 py-2 text-[12px] font-medium text-left border-none cursor-pointer transition-colors ${
                                            editState.value === r ? 'bg-amber-50 text-amber-700 font-bold' : 'bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span style={{ color: ROLE_MAP[r]?.color }}>{ROLE_MAP[r]?.icon}</span>
                                        {ROLE_MAP[r]?.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            }

            return (
                <input
                    autoFocus
                    type={field === 'password' ? 'password' : 'text'}
                    value={editState.value}
                    onChange={e => setEditState({ ...editState, value: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditState(null); }}
                    placeholder={field === 'password' ? '새 비밀번호 (6자 이상)' : ''}
                    className="w-full px-2 py-1 border border-amber-400 rounded-lg text-[12px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20 bg-white"
                />
            );
        }

        if (field === 'password') {
            return (
                <button
                    onClick={() => setEditState({ userId: user.id, field: 'password', value: '' })}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg px-2.5 py-1 cursor-pointer transition-all"
                >
                    <Key className="w-3 h-3" /> 비밀번호 변경
                </button>
            );
        }

        if (field === 'role') {
            const rm = ROLE_MAP[currentValue];
            return (
                <button
                    onClick={() => { setEditState({ userId: user.id, field, value: currentValue }); setShowRoleDropdown(false); }}
                    className="group flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0"
                >
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border"
                        style={{
                            color: rm?.color || '#64748b',
                            backgroundColor: `${rm?.color || '#64748b'}10`,
                            borderColor: `${rm?.color || '#64748b'}30`,
                        }}
                    >
                        {rm?.icon} {rm?.label || currentValue}
                    </span>
                    <Edit3 className="w-3 h-3 text-slate-300 group-hover:text-amber-500 transition-colors" />
                </button>
            );
        }

        return (
            <button
                onClick={() => setEditState({ userId: user.id, field, value: currentValue })}
                className="group flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0 text-left"
            >
                <span className="text-[13px] font-medium text-slate-700">{currentValue || '—'}</span>
                <Edit3 className="w-3 h-3 text-slate-300 group-hover:text-amber-500 transition-colors shrink-0" />
            </button>
        );
    };

    // ── 시간 포맷 ────────────────────────────────────────────────
    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    const formatDateTime = (d: string | null) => {
        if (!d) return '없음';
        const dt = new Date(d);
        return dt.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) + ' ' +
               dt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* 토스트 */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[200] px-4 py-3 rounded-xl shadow-lg text-[13px] font-bold flex items-center gap-2 transition-all animate-in fade-in ${
                    toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            {/* 헤더 */}
            <div className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 h-[60px] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/employee">
                        <button className="text-[13px] text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-none cursor-pointer font-medium">← 돌아가기</button>
                    </Link>
                    <div className="w-px h-4 bg-slate-200" />
                    <span className="text-[15px] font-black text-slate-800 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-500" /> 계정 관리
                    </span>
                    <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 py-0.5 px-2 rounded-full">Super Admin</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchUsers}
                        className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg py-1.5 px-3.5 cursor-pointer text-[13px] font-semibold transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" /> 새로고침
                    </button>
                    {editState && (
                        <>
                            <button onClick={() => { setEditState(null); setShowRoleDropdown(false); }}
                                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg py-1.5 px-3.5 cursor-pointer text-[13px] font-semibold transition-colors">
                                <X className="w-3.5 h-3.5" /> 취소
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-none rounded-lg py-1.5 px-4 cursor-pointer text-[13px] font-bold shadow-sm transition-all disabled:opacity-50">
                                <Save className="w-3.5 h-3.5" /> {saving ? '저장 중...' : '저장'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* 메인 */}
            <div className="max-w-[1400px] mx-auto py-8 px-6">
                {/* 검색 + 탭 필터 */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-6 overflow-hidden">
                    {/* 검색 바 */}
                    <div className="p-4 border-b border-slate-100">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="이름 또는 이메일로 검색..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all bg-slate-50"
                            />
                        </div>
                    </div>
                    {/* 역할 탭 */}
                    <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto">
                        {/* 전체 탭 */}
                        <button
                            onClick={() => setRoleFilter('all')}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold border-none cursor-pointer transition-all whitespace-nowrap ${
                                roleFilter === 'all'
                                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                                    : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                            }`}
                        >
                            <Users className="w-3.5 h-3.5" />
                            전체
                            <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md ${
                                roleFilter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                            }`}>{users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())).length}</span>
                        </button>

                        <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />

                        {/* 존재하는 역할별 탭 */}
                        {ALL_ROLES.filter(r => users.some(u => u.role === r)).map(r => {
                            const rm = ROLE_MAP[r];
                            const count = users.filter(u => u.role === r && (!search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))).length;
                            const isActive = roleFilter === r;
                            return (
                                <button
                                    key={r}
                                    onClick={() => setRoleFilter(r)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold border-none cursor-pointer transition-all whitespace-nowrap ${
                                        isActive
                                            ? 'ring-1 ring-opacity-40'
                                            : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                    }`}
                                    style={isActive ? {
                                        backgroundColor: `${rm.color}10`,
                                        color: rm.color,
                                        // @ts-ignore
                                        '--tw-ring-color': `${rm.color}60`,
                                    } : undefined}
                                >
                                    <span style={{ color: isActive ? rm.color : undefined }}>{rm.icon}</span>
                                    {rm.label}
                                    <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md ${
                                        isActive ? 'bg-white/60' : 'bg-slate-100 text-slate-500'
                                    }`} style={isActive ? { color: rm.color } : undefined}>{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 에러/로딩 */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-[13px] font-bold text-red-700 flex items-center gap-2 mb-6">
                        <AlertTriangle className="w-4 h-4" /> {error}
                    </div>
                )}

                {loading ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-20 shadow-sm flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[13px] font-bold text-slate-500">계정 목록을 불러오는 중...</span>
                    </div>
                ) : (
                    /* 유저 테이블 */
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200">
                                        <th className="p-4 text-xs font-bold text-slate-500 w-[180px]">이름</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 w-[220px]">이메일</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 w-[130px]">역할</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 w-[150px]">소속</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 w-[100px]">가입일</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 w-[120px]">최근 로그인</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 w-[130px]">비밀번호</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 w-[60px] text-right">삭제</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-12 text-center text-[13px] font-medium text-slate-400">
                                                검색 결과가 없습니다.
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map(user => (
                                            <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="p-4">
                                                    <EditableCell user={user} field="name" currentValue={user.name} />
                                                </td>
                                                <td className="p-4">
                                                    <EditableCell user={user} field="email" currentValue={user.email} />
                                                </td>
                                                <td className="p-4">
                                                    <EditableCell user={user} field="role" currentValue={user.role} />
                                                </td>
                                                <td className="p-4">
                                                    <EditableCell user={user} field="companyName" currentValue={user.companyName} />
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-[12px] font-medium text-slate-500">{formatDate(user.createdAt)}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-[12px] font-medium ${user.lastSignIn ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {formatDateTime(user.lastSignIn)}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <EditableCell user={user} field="password" currentValue="" />
                                                </td>
                                                <td className="p-4 text-right">
                                                    {deleteConfirm === user.id ? (
                                                        <div className="flex items-center gap-1 justify-end">
                                                            <button onClick={() => handleDelete(user.id)}
                                                                className="text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 border-none rounded-lg px-2.5 py-1 cursor-pointer transition-colors">
                                                                확인
                                                            </button>
                                                            <button onClick={() => setDeleteConfirm(null)}
                                                                className="text-[11px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 border-none rounded-lg px-2.5 py-1 cursor-pointer transition-colors">
                                                                취소
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setDeleteConfirm(user.id)}
                                                            className="p-1.5 rounded-lg border-none cursor-pointer bg-transparent hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                                                            title="계정 삭제"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
