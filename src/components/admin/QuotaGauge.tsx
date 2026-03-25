import React, { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { Target } from 'lucide-react';

export function QuotaGauge() {
  const target = 500000000;
  const current = 405000000;
  const pct = (current / target) * 100;
  
  const [val, setVal] = useState(0);
  useEffect(() => animate(0, current, { duration: 1.5, onUpdate: setVal }).stop, []);

  const color = pct >= 80 ? '#b8960a' : pct >= 50 ? '#3b82f6' : '#ef4444';
  const radius = 70; const circum = radius * 2 * Math.PI;
  const offset = circum - (pct / 100) * circum;

  return (
    <div className="bg-[#ffffff] rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
      <div className="w-full flex justify-between mb-2">
        <div>
          <h3 className="text-lg font-bold flex gap-2"><Target className="w-5 h-5 text-[#b8960a]" /> 팀 목표 달성률</h3>
          <p className="text-xs text-gray-500">이번 달 수임 목표 (₩ 500M)</p>
        </div>
        <span className="bg-red-50 text-red-600 px-2 py-1 text-xs font-bold rounded">D-6</span>
      </div>
      <div className="relative w-40 h-40 flex items-center justify-center mt-4">
        <svg className="absolute transform -rotate-90 w-full h-full"><circle cx="80" cy="80" r={radius} fill="none" stroke="#f8f9fc" strokeWidth="12" /><motion.circle cx="80" cy="80" r={radius} fill="none" stroke={color} strokeWidth="12" strokeDasharray={circum} initial={{ strokeDashoffset: circum }} animate={{ strokeDashoffset: offset }} strokeLinecap="round" transition={{ duration: 1.5 }} /></svg>
        <div className="text-center">
          <span className="block text-xl font-black" style={{ color }}>{(val / 1000000).toFixed(0)}M</span>
          <span className="text-xs font-bold text-gray-400">{pct.toFixed(1)}%</span>
        </div>
      </div>
      <div className="mt-4 w-full bg-[#f8f9fc] rounded p-2 text-center text-sm font-medium">
        목표까지 <span className="font-bold text-[#b8960a]">₩ {(target - current)/1000000}M</span> 남음
      </div>
    </div>
  );
}
