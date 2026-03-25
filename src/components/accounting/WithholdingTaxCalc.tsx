import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Download } from 'lucide-react';

export function WithholdingTaxCalc() {
  const [amount, setAmount] = useState(3300000);
  const [debounced, setDebounced] = useState(3300000);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(amount), 300);
    return () => clearTimeout(timer);
  }, [amount]);

  const tax1 = Math.floor(debounced * 0.03); 
  const tax2 = Math.floor(debounced * 0.003); 
  const net = debounced - (tax1 + tax2);

  return (
    <div className="bg-[#ffffff] rounded-xl shadow-sm border border-gray-100 p-6 relative">
      <div className="flex justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold flex gap-2"><Calculator className="w-5 h-5 text-[#b8960a]" /> 원천징수 계산기</h3>
          <p className="text-sm text-gray-500">성공보수 지급 시 3.3% 자동 계산</p>
        </div>
        <button onClick={() => { setToast(true); setTimeout(() => setToast(false), 3000); }} className="flex gap-2 px-4 py-2 bg-[#b8960a] text-white rounded-lg text-sm font-bold">
          <Download className="w-4 h-4"/> 신고서 PDF 생성
        </button>
      </div>
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <label className="text-sm font-bold text-gray-700">총액 입력</label>
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full mt-2 p-3 bg-[#f8f9fc] border rounded-lg font-bold" />
          <input type="range" min="1000000" max="50000000" step="100000" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full mt-4 accent-[#b8960a]" />
        </div>
        <div className="bg-[#f8f9fc] p-5 rounded-xl border border-gray-100 space-y-3">
          <div className="flex justify-between text-sm"><span className="text-gray-500">소득세(3%)</span><span className="font-bold">₩ {tax1.toLocaleString()}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">지방세(0.3%)</span><span className="font-bold">₩ {tax2.toLocaleString()}</span></div>
          <div className="flex justify-between text-sm border-t pt-2"><span className="font-bold">원천징수 합계</span><span className="font-bold text-red-500">- ₩ {(tax1+tax2).toLocaleString()}</span></div>
          <div className="flex justify-between text-lg border-t pt-2"><span className="font-bold">실지급액</span><span className="font-black text-[#b8960a] text-2xl">₩ {net.toLocaleString()}</span></div>
        </div>
      </div>
      <table className="w-full text-left text-sm bg-gray-50 rounded-lg overflow-hidden">
        <thead className="border-b text-gray-500"><tr><th className="py-2 px-3">처리일자</th><th className="py-2 px-3">의뢰인</th><th className="py-2 px-3 text-right">총액</th></tr></thead>
        <tbody>
          <tr><td className="py-2 px-3">2026-03-24</td><td className="py-2 px-3 font-bold">김지현</td><td className="py-2 px-3 text-right">₩ 5,000,000</td></tr>
          <tr><td className="py-2 px-3">2026-03-22</td><td className="py-2 px-3 font-bold">이민호</td><td className="py-2 px-3 text-right">₩ 3,300,000</td></tr>
        </tbody>
      </table>
      {toast && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-4 left-1/2 -translate-x-1/2 p-4 bg-gray-900 text-white rounded-lg shadow-xl">완료</motion.div>}
    </div>
  );
}
