// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2 } from 'lucide-react';
import { getCurrentUserId } from '@/lib/permissions';

interface MeetingRoom { id: string; name: string; capacity: number; floor: string; }
interface MeetingReservation { id: string; roomId: string; userId: string; userName: string; date: string; startTime: string; endTime: string; purpose: string; }

const DEFAULT_ROOMS: MeetingRoom[] = [
    { id: 'r1', name: '본관(대회의실)', capacity: 10, floor: '본관' },
    { id: 'r2', name: '본관(소회의실)', capacity: 4, floor: '본관' },
    { id: 'r3', name: '신관(3층)', capacity: 8, floor: '신관 3층' },
    { id: 'r4', name: '신관(4층-대회의실)', capacity: 5, floor: '신관 4층' },
    { id: 'r5', name: '신관(4층-소회의실)', capacity: 4, floor: '신관 4층' },
];

let memoryReservations: MeetingReservation[] = [];

const TIME_SLOTS = [
    '07:00','08:00','09:00','10:00','11:00','12:00',
    '13:00','14:00','15:00','16:00','17:00','18:00',
    '19:00','20:00','21:00','22:00','23:00'
];
const ROOM_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

export default function MeetingRoomTab() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [rooms] = useState<MeetingRoom[]>(DEFAULT_ROOMS);
    const [reservations, setReservations] = useState<MeetingReservation[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({ roomId: '', startTime: '09:00', endTime: '10:00', purpose: '' });
    const [toast, setToast] = useState('');
    const currentUserId = getCurrentUserId();

    const refreshData = useCallback(() => {
        setReservations(memoryReservations.filter(r => r.date === selectedDate));
    }, [selectedDate]);

    useEffect(() => { refreshData(); }, [refreshData]);

    const handleSlotClick = (roomId: string, time: string) => {
        const endHour = (parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0');
        setModalData({ roomId, startTime: time, endTime: `${endHour}:00`, purpose: '' });
        setShowModal(true);
    };

    const handleReserve = () => {
        if (!modalData.roomId || !modalData.purpose.trim()) return;
        const hasConflict = memoryReservations.some(r => 
            r.roomId === modalData.roomId && 
            r.date === selectedDate && 
            r.startTime < modalData.endTime && 
            r.endTime > modalData.startTime
        );
        if (hasConflict) {
            setToast('❌ 해당 시간에 이미 예약이 있습니다');
            setTimeout(() => setToast(''), 2500);
            return;
        }
        memoryReservations.push({
            id: Date.now().toString(),
            roomId: modalData.roomId,
            userId: currentUserId,
            userName: '김수현 변호사',
            date: selectedDate,
            startTime: modalData.startTime,
            endTime: modalData.endTime,
            purpose: modalData.purpose
        });
        refreshData();
        setShowModal(false);
        setToast('✅ 예약이 완료되었습니다');
        setTimeout(() => setToast(''), 2500);
    };

    const handleDelete = (id: string) => {
        memoryReservations = memoryReservations.filter(r => r.id !== id);
        refreshData();
        setToast('🗑️ 예약이 취소되었습니다');
        setTimeout(() => setToast(''), 2500);
    };

    const myReservations = reservations.filter(r => r.userId === currentUserId);

    return (
        <div className="h-full overflow-y-auto p-4 sm:p-6" style={{ background: '#f8f9fc' }}>
            {/* 날짜 선택 */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                        className="px-4 py-2 rounded-xl text-sm font-bold outline-none"
                        style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                    <button onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
                        className="px-3 py-2 rounded-xl text-xs font-bold"
                        style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>오늘</button>
                </div>
                <button onClick={() => { setModalData({ roomId: rooms[0]?.id || '', startTime: '09:00', endTime: '10:00', purpose: '' }); setShowModal(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c87a)', color: '#78350f' }}>
                    <Plus className="w-4 h-4" /> 새 예약
                </button>
            </div>

            {/* 시간대별 그래프 뷰 */}
            <div className="rounded-xl overflow-hidden mb-5" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="p-3" style={{ background: '#f8f9fc', borderBottom: '1px solid #e2e8f0' }}>
                    <span className="text-xs font-bold" style={{ color: '#64748b' }}>🏢 시간대별 예약 현황 ({selectedDate})</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <div style={{ minWidth: 1200, padding: '12px 16px' }}>
                        {/* 시간 헤더 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '170px repeat(17, 1fr)', gap: 2, marginBottom: 8 }}>
                            <div />
                            {TIME_SLOTS.map(t => (
                                <div key={t} className="text-center text-[10px] font-bold" style={{ color: '#94a3b8' }}>{t}</div>
                            ))}
                        </div>
                        {/* 각 회의실별 행 */}
                        {rooms.map((room, ri) => (
                            <div key={room.id} style={{ display: 'grid', gridTemplateColumns: '170px repeat(17, 1fr)', gap: 2, marginBottom: 6 }}>
                                <div className="flex items-center gap-1.5 pr-2">
                                    <div style={{ minWidth: 8, height: 8, borderRadius: 2, background: ROOM_COLORS[ri] }} />
                                    <span className="text-xs font-bold whitespace-nowrap" style={{ color: '#1e293b' }}>{room.name}</span>
                                    <span className="text-[10px] whitespace-nowrap" style={{ color: '#94a3b8' }}>({room.capacity}명)</span>
                                </div>
                                {TIME_SLOTS.map(time => {
                                    const rsvp = reservations.find(r => r.roomId === room.id && r.startTime <= time && r.endTime > time);
                                    return (
                                        <div key={time} onClick={() => !rsvp && handleSlotClick(room.id, time)}
                                            style={{ height: 36, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: rsvp ? ROOM_COLORS[ri] + '20' : '#f8f9fc', border: `1px solid ${rsvp ? ROOM_COLORS[ri] + '40' : '#e2e8f0'}`, cursor: rsvp ? 'default' : 'pointer', transition: 'all 0.15s' }}
                                            title={rsvp ? `${rsvp.userName}: ${rsvp.purpose}` : '클릭하여 예약'}>
                                            {rsvp ? (
                                                <span className="text-[9px] font-bold truncate px-1" style={{ color: ROOM_COLORS[ri] }}>{rsvp.userName.split(' ')[0]}</span>
                                            ) : (
                                                <Plus className="w-3 h-3" style={{ color: '#cbd5e1', opacity: 0.5 }} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 내 예약 리스트 */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="p-3 flex items-center justify-between" style={{ background: '#f8f9fc', borderBottom: '1px solid #e2e8f0' }}>
                    <span className="text-xs font-bold" style={{ color: '#64748b' }}>📌 내 예약 목록</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: '#eff6ff', color: '#2563eb' }}>{myReservations.length}건</span>
                </div>
                {myReservations.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-sm" style={{ color: '#94a3b8' }}>예약된 회의실이 없습니다</p>
                    </div>
                ) : myReservations.map(r => {
                    const room = rooms.find(rm => rm.id === r.roomId);
                    return (
                        <div key={r.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <div className="flex items-center gap-3">
                                <div style={{ width: 6, height: 24, borderRadius: 3, background: ROOM_COLORS[rooms.findIndex(rm => rm.id === r.roomId)] || '#94a3b8' }} />
                                <div>
                                    <p className="text-sm font-bold" style={{ color: '#1e293b' }}>{room?.name}</p>
                                    <p className="text-xs" style={{ color: '#64748b' }}>{r.startTime} ~ {r.endTime} · {r.purpose}</p>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg"
                                style={{ color: '#dc2626', background: '#fef2f2' }}>
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* 예약 모달 */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
                        onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="w-full max-w-md rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-black text-lg" style={{ color: '#1e293b' }}>🏢 회의실 예약</h2>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg" style={{ color: '#94a3b8' }}><X className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>회의실</label>
                                    <select value={modalData.roomId} onChange={e => setModalData(p => ({ ...p, roomId: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                                        {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.capacity}명, {r.floor})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>시작</label>
                                        <select value={modalData.startTime} onChange={e => setModalData(p => ({ ...p, startTime: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                                            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>종료</label>
                                        <select value={modalData.endTime} onChange={e => setModalData(p => ({ ...p, endTime: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }}>
                                            {TIME_SLOTS.map(t => { const h = (parseInt(t.split(':')[0]) + 1).toString().padStart(2, '0'); return <option key={h} value={`${h}:00`}>{h}:00</option>; })}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1 block" style={{ color: '#b8960a' }}>용무</label>
                                    <input value={modalData.purpose} onChange={e => setModalData(p => ({ ...p, purpose: e.target.value }))}
                                        placeholder="회의 목적을 입력하세요" className="w-full px-3 py-2 rounded-lg text-sm"
                                        style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', color: '#1e293b' }} />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-5">
                                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                                    style={{ background: '#f1f5f9', color: '#64748b' }}>취소</button>
                                <button onClick={handleReserve} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                                    style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)' }}>예약</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-bold z-50"
                        style={{ background: '#111827', color: '#f0f4ff', border: '1px solid rgba(201,168,76,0.3)' }}>
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
