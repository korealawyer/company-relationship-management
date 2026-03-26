import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Send, TrendingUp } from 'lucide-react';
import { useLitigations } from '@/hooks/useDataLayer';

export function LitBillingTrigger() {
  const { litigations } = useLitigations();
  const [unbilled, setUnbilled] = useState<any[]>([]);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const all = litigations || [];
    const filtered = all.filter((i: any) => i.status === 'closed' && (i.claimAmount > 0 || i.successFee > 0));
    setUnbilled(filtered.length ? filtered : [
      { id: '1', title: '손해배상(기)', clientName: '김철수', claimAmount: 5500000 },
      { id: '2', title: '부당해고구제', clientName: '박영희', claimAmount: 3300000 }
    ]);
  }, [litigations]);

  const total = unbilled.reduce((acc, i) => acc + (i.claimAmount || i.successFee || 0), 0);

  const handleBill = (id: string) => {
    setUnbilled(prev => prev.filter(i => i.id !== id));
    setToast(true); setTimeout(() => setToast(false), 3000);
  };

  return (
    <div className="bg-[#ffffff] rounded-xl shadow-sm border border-gray-100 p-6 relative">
      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertCircle className="w-5 h-5" /></div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              송무 기일 → 회계 청구 트리거
              {unbilled.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unbilled.length}건 미청구</span>}
            </h3>
            <p className="text-sm text-gray-500 mt-1">변론기일 완료 사건 중 성공보수 미청구 건</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 flex gap-1 justify-end"><TrendingUp className="w-4 h-4 text-[#b8960a]" /> AI 예측 청구가능</div>
          <div className="text-2xl font-bold text-[#b8960a] mt-1">₩ {total.toLocaleString()}</div>
        </div>
      </div>
      <table className="w-full text-left text-sm bg-white border border-gray-100 rounded-lg overflow-hidden">
        <thead className="bg-[#f8f9fc] border-b text-gray-500">
          <tr><th className="py-3 px-4">사건명</th><th className="py-3 px-4">의뢰인</th><th className="py-3 px-4 text-right">청구 예상액</th><th className="py-3 px-4 text-right">액션</th></tr>
        </thead>
        <tbody>
          {unbilled.map((item) => (
            <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b last:border-0 hover:bg-gray-50">
              <td className="py-4 px-4 font-bold">{item.title}</td><td className="py-4 px-4">{item.clientName}</td>
              <td className="py-4 px-4 text-right font-bold text-gray-900">₩ {(item.claimAmount || item.successFee || 0).toLocaleString()}</td>
              <td className="py-4 px-4 text-right">
                <button onClick={() => handleBill(item.id)} className="inline-flex gap-2 px-3 py-1.5 bg-[#f8f9fc] hover:bg-[#b8960a] hover:text-white text-gray-700 font-bold rounded-lg border border-gray-200 transition-colors">
                  <Send className="w-4 h-4" /> 청구서 즉시 발행
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      {toast && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-4 left-1/2 -translate-x-1/2 p-4 bg-gray-900 text-white rounded-lg shadow-xl flex gap-3 z-50">
        <div className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center"><Send className="w-4 h-4" /></div>
        <div><p className="font-bold text-sm">카카오 알림톡 전송 완료</p></div>
      </motion.div>}
    </div>
  );
}
