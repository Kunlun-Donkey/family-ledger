'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

interface Props {
  data: Array<{ month: string; income: number; expense: number; balance: number }>
}

export function MonthlyTrendChart({ data }: Props) {
  if (!data || data.length === 0) {
    return <div className="h-[240px] flex items-center justify-center text-subtitle text-[13px]">暂无数据</div>
  }

  const formatted = data.map(d => ({
    ...d,
    month: d.month.slice(5) + '月',
  }))

  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} barGap={6} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="var(--divider)" vertical={false} />
          <XAxis
            dataKey="month"
            fontSize={13}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--subtitle)' }}
          />
          <YAxis
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--subtitle)' }}
            tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
          />
          <Tooltip
            formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
            labelFormatter={(label) => label}
            contentStyle={{
              borderRadius: 16,
              border: '1px solid var(--divider)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
              fontSize: 13,
              padding: '8px 12px',
            }}
          />
          <Bar dataKey="income" name="收入" fill="#6D8B74" radius={[8, 8, 4, 4]} maxBarSize={32} />
          <Bar dataKey="expense" name="支出" fill="#D16D6A" radius={[8, 8, 4, 4]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#6D8B74]" />
          <span className="text-[13px] text-subtitle">收入</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#D16D6A]" />
          <span className="text-[13px] text-subtitle">支出</span>
        </div>
      </div>
    </div>
  )
}
