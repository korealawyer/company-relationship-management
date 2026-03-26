import React from 'react';
import { Activity, Star, TrendingUp, Users } from 'lucide-react';
// @ts-ignore
import { SAMPLE_BILLING } from '@/lib/store';

export function ClientLTVPanel() {
  const data = [
    { name: '(주)알파로보틱스', total: 85000000, count: 12, health: 95 },
    { name: '넥스트젠 바이오', total: 62000000, count: 8, health: 88 },
    { name: '스타트업 팩토리', total: 41000000, count: 5, health: 76 }
  ];

  return (
    <div className="bg-[#ffffff] rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold flex gap-2 mb-4"><Users className="w-5 h-5 text-[#b8960a]" /> 의뢰인 LTV & 재수임율</h3>
      <div className="space-y-4">
        {data.map((c, i) => (
          <div key={i} className="p-4 border rounded-lg bg-[#f8f9fc]/50">
            <div className="flex justify-between mb-3">
              <span className="font-bold text-gray-900 flex items-center gap-2">
                {c.name} {i===0 && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded font-bold"><Star className="w-3 h-3 inline"/> VIP</span>}
              </span>
              <span className="font-bold text-[#b8960a]">₩ {c.total.toLocaleString()}</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 w-1/3 text-sm"><div className="w-6 h-6 bg-blue-50 flex items-center justify-center rounded-full"><TrendingUp className="w-3 h-3 text-blue-600"/></div><span className="font-bold">{c.count}회</span></div>
              <div className="flex items-center gap-2 w-2/3 text-sm">
                <div className="w-6 h-6 bg-green-50 flex items-center justify-center rounded-full"><Activity className="w-3 h-3 text-green-600"/></div>
                <div className="w-full">
                  <div className="flex justify-between text-xs mb-1 font-bold text-gray-500"><span>헬스스코어</span><span className="text-green-600">{c.health}%</span></div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full"><div className="h-1.5 bg-green-500 rounded-full" style={{ width: `${c.health}%` }}></div></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
