'use client';

import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';

const mockData = [
  { month: '10월', revenue: 45000000, expense: 12000000 },
  { month: '11월', revenue: 52000000, expense: 15000000 },
  { month: '12월', revenue: 48000000, expense: 18000000 },
  { month: '1월', revenue: 61000000, expense: 13000000 },
  { month: '2월', revenue: 59000000, expense: 14000000 },
  { month: '3월', revenue: 75000000, expense: 16000000 },
];

export default function FinanceStatsView() {
  const currentMonthRevenue = mockData[mockData.length - 1].revenue;
  const currentMonthExpense = mockData[mockData.length - 1].expense;
  const netProfit = currentMonthRevenue - currentMonthExpense;

  const previousMonthProfit = mockData[mockData.length - 2].revenue - mockData[mockData.length - 2].expense;
  const profitGrowth = ((netProfit - previousMonthProfit) / previousMonthProfit) * 100;

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard 
          title="당월 수납액"
          value={`₩${currentMonthRevenue.toLocaleString()}`}
          trend={{ value: 15, isPositive: true }}
          icon={DollarSign}
        />
        <KPICard 
          title="당월 지출액"
          value={`₩${currentMonthExpense.toLocaleString()}`}
          trend={{ value: 5, isPositive: false }}
          icon={Wallet}
        />
        <KPICard 
          title="당월 순이익"
          value={`₩${netProfit.toLocaleString()}`}
          trend={{ value: profitGrowth, isPositive: profitGrowth > 0 }}
          icon={profitGrowth > 0 ? TrendingUp : TrendingDown}
        />
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">최근 6개월 수지 동향</h3>
          <p className="text-sm text-slate-500 mt-1">월별 수납액 및 지출 내역 비교</p>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mockData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                yAxisId="left" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 12 }}
                tickFormatter={(value) => `${(value / 10000000).toFixed(0)}천만`}
                dx={-10}
              />
              <RechartsTooltip 
                cursor={{ fill: '#F8FAFC' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`₩${Number(value).toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar yAxisId="left" dataKey="revenue" name="수납액 (수익)" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar yAxisId="left" dataKey="expense" name="지출액 (비용)" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
