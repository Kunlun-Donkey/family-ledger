'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

const CATEGORY_LABELS: Record<string, string> = {
  mortgage: '房贷',
  food: '餐饮',
  utilities: '水电',
  childcare: '育儿',
  medical: '医疗',
  transport: '交通',
  entertainment: '娱乐',
  shopping: '购物',
  insurance: '保险',
  other: '其他',
}

const COLORS = ['#7C8DB5', '#6D8B74', '#D16D6A', '#D9A441', '#9F86C0', '#5BA4A4', '#B5836D', '#8B9467', '#7B6D8B', '#6B8FA3']

interface Props {
  data: Array<{ category: string; amount: number }>
}

export function ExpensePieChart({ data }: Props) {
  if (!data || data.length === 0) {
    return <div className="h-[240px] flex items-center justify-center text-subtitle text-[13px]">暂无数据</div>
  }

  const formatted = data.map(d => ({
    name: CATEGORY_LABELS[d.category] || d.category,
    value: d.amount,
  }))

  const total = formatted.reduce((s, d) => s + d.value, 0)

  return (
    <div className="h-[240px] flex items-center">
      {/* Chart */}
      <div className="w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={formatted}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
              paddingAngle={3}
              cornerRadius={6}
              strokeWidth={0}
            >
              {formatted.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `¥${value.toLocaleString()}`}
              contentStyle={{
                borderRadius: 14,
                border: '1px solid var(--divider)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                fontSize: 13,
                padding: '8px 12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="w-1/2 space-y-2 pl-2">
        {formatted.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-[13px] text-foreground truncate">{item.name}</span>
            </div>
            <span className="text-[13px] text-subtitle ml-2 flex-shrink-0">
              {((item.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
