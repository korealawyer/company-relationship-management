import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PenTool, Mail, CheckCircle, Clock } from 'lucide-react';
// @ts-ignore
import { store } from '@/lib/mockStore';
// @ts-ignore
import { AutoSignatureService } from '@/lib/salesAutomation';

export function ESignaturePanel() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    setContracts([
      { id: '1', name: '(주)알파로보틱스', amount: 3300000, status: 'signed', at: '03-24 15:20' },
      { id: '2', name: '넥스트젠 바이오', amount: 5500000, status: 'pending' },
      { id: '3', name: '스타트업 팩토리', amount: 2200000, status: 'unsent' },
    ]);
  }, []);

  const handleSend = (id: string) => {
    if (store.sendContract) store.sendContract(id, 'email');
    if (AutoSignatureService?.watchForSignature) AutoSignatureService.watchForSignature({ id });
    setContracts(p => p.map(c => c.id === id ? { ...c, status: 'pending' } : c));
    setToast(true); setTimeout(() => setToast(false), 3000);
  };

  return (
    <div className="bg-[#ffffff] rounded-xl shadow-sm border border-gray-100 p-6 relative">
      <h3 className="text-lg font-bold flex gap-2 mb-4"><PenTool className="w-5 h-5 text-[#b8960a]" /> 자체 전자계약 현황 패널</h3>
      <table className="w-full text-left text-sm bg-white border rounded">
        <thead className="bg-[#f8f9fc]"><tr><th className="py-3 px-4">기업명</th><th className="py-3 px-4 text-center">상태</th><th className="py-3 px-4 text-right">액션</th></tr></thead>
        <tbody>
          {contracts.map(c => (
            <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
              <td className="py-4 px-4 font-bold">{c.name}</td>
              <td className="py-4 px-4 text-center">
                {c.status === 'signed' && <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs"><CheckCircle className="w-3 h-3 inline mr-1"/>서명 완료</span>}
                {c.status === 'pending' && <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs"><Clock className="w-3 h-3 inline mr-1"/>서명 대기 중</span>}
                {c.status === 'unsent' && <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs text-center"><Mail className="w-3 h-3 inline mr-1"/>미발송</span>}
              </td>
              <td className="py-4 px-4 text-right">
                {c.status === 'unsent' && <button onClick={() => handleSend(c.id)} className="bg-[#b8960a] text-white px-3 py-1 text-xs rounded font-bold">지금 발송</button>}
                {c.status === 'signed' && <span className="text-xs text-gray-500">{c.at}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {toast && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-4 left-1/2 -translate-x-1/2 p-3 bg-gray-900 text-white text-sm rounded shadow-xl">계약서 발송 완료 — 자동 감지 시작</motion.div>}
    </div>
  );
}
