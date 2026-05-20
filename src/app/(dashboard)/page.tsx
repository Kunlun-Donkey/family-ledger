'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { usePrivacy } from '@/hooks/use-privacy'
import { TrendingUp, TrendingDown, Wallet, Building2, PiggyBank, ArrowUpRight, Eye, EyeOff } from 'lucide-react'
import { MonthlyTrendChart } from '@/components/charts/monthly-trend'
import { ExpensePieChart } from '@/components/charts/expense-pie'

interface DashboardData {
  summary: {
    totalAssets: number
    totalDebt: number
    netAssets: number
    monthIncome: number
    monthExpense: number
    monthBalance: number
  }
  monthlyTrend: Array<{ month: string; income: number; expense: number; balance: number }>
  expenseByCategory: Array<{ category: string; amount: number }>
  loans: Array<{ id: string; name: string; remainPrincipal: number }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { hidden, toggle } = usePrivacy()

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-[15px] text-subtitle">加载中...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-[15px] text-subtitle">暂无数据，请先添加收支记录</div>
      </div>
    )
  }

  const { summary } = data
  const now = new Date()
  const greeting = now.getHours() < 12 ? '早上好' : now.getHours() < 18 ? '下午好' : '晚上好'
  const show = (v: string) => hidden ? '****' : v

  return (
    <div className="pb-24 lg:pb-0 space-y-8">

      {/* ═══ Header ═══ */}
      <header className="pt-2 flex items-start justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-title tracking-tight leading-tight">
            {greeting}
          </h1>
          <p className="text-[15px] text-subtitle mt-1">
            这是您的家庭资产概况
          </p>
        </div>
        <button
          onClick={toggle}
          className="mt-2 p-2.5 rounded-[12px] text-subtitle hover:text-foreground hover:bg-card border border-transparent hover:border-[var(--divider)] transition-all duration-200"
          title={hidden ? '显示金额' : '隐藏金额'}
        >
          {hidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </header>

      {/* ═══ Key Metrics ═══ */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Net Assets - Hero card */}
          <div className="sm:col-span-2 lg:col-span-1 bg-primary rounded-[24px] p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <PiggyBank className="h-5 w-5 opacity-80" />
                <span className="text-[13px] font-medium opacity-80">净资产</span>
              </div>
              <p className="text-[36px] font-bold tracking-tight leading-none">
                {show(formatCurrency(summary.netAssets))}
              </p>
              <p className="text-[13px] opacity-60 mt-3">
                总资产 {show(formatCurrency(summary.totalAssets))} · 负债 {show(formatCurrency(summary.totalDebt))}
              </p>
            </div>
          </div>

          {/* Income */}
          <MetricCard
            icon={TrendingUp}
            label="本月收入"
            value={summary.monthIncome}
            color="#4F8A5B"
            hidden={hidden}
          />

          {/* Expense */}
          <MetricCard
            icon={TrendingDown}
            label="本月支出"
            value={summary.monthExpense}
            color="#D16D6A"
            hidden={hidden}
          />
        </div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <SmallMetric label="总资产" value={summary.totalAssets} hidden={hidden} />
          <SmallMetric label="总负债" value={summary.totalDebt} hidden={hidden} />
          <SmallMetric label="本月结余" value={summary.monthBalance} highlight={summary.monthBalance >= 0} hidden={hidden} />
        </div>
      </section>

      {/* ═══ Charts ═══ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-[24px] p-6 border border-[var(--divider)] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="mb-6">
            <h3 className="text-[20px] font-semibold text-title">收支趋势</h3>
            <p className="text-[13px] text-subtitle mt-1">近 6 个月收入与支出对比</p>
          </div>
          <MonthlyTrendChart data={data.monthlyTrend} />
        </div>

        <div className="bg-card rounded-[24px] p-6 border border-[var(--divider)] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="mb-6">
            <h3 className="text-[20px] font-semibold text-title">支出结构</h3>
            <p className="text-[13px] text-subtitle mt-1">本月各类支出占比</p>
          </div>
          <ExpensePieChart data={data.expenseByCategory} />
        </div>
      </section>

      {/* ═══ Loans ═══ */}
      {data.loans.length > 0 && (
        <section>
          <div className="bg-card rounded-[24px] p-6 border border-[var(--divider)] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[20px] font-semibold text-title">贷款</h3>
                <p className="text-[13px] text-subtitle mt-1">
                  共 {data.loans.length} 笔贷款 · 剩余本金 {show(formatCurrency(data.loans.reduce((s, l) => s + l.remainPrincipal, 0)))}
                </p>
              </div>
              <a href="/loans" className="flex items-center gap-1 text-[13px] font-medium text-primary hover:opacity-80 transition-opacity">
                查看详情
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="space-y-3">
              {data.loans.map(loan => {
                // Assume 30yr loan, show rough progress
                const totalEstimate = loan.remainPrincipal * 1.3 // rough estimate
                const progress = Math.max(5, Math.min(95, ((totalEstimate - loan.remainPrincipal) / totalEstimate) * 100))
                return (
                  <div key={loan.id} className="p-4 rounded-[16px] bg-[var(--background)] border border-[var(--divider)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[12px] bg-info/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-info" />
                        </div>
                        <div>
                          <p className="text-[15px] font-medium text-title">{loan.name}</p>
                          <p className="text-[13px] text-subtitle">还款中</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[15px] font-semibold text-title">{show(formatCurrency(loan.remainPrincipal))}</p>
                        <p className="text-[12px] text-subtitle">剩余本金</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-info rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

/* ─── Sub Components ─── */

function MetricCard({ icon: Icon, label, value, color, hidden }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: string
  hidden?: boolean
}) {
  return (
    <div className="bg-card rounded-[24px] p-6 border border-[var(--divider)] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-[12px]" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-[18px] w-[18px]" style={{ color }} />
        </div>
        <span className="text-[13px] text-subtitle font-medium">{label}</span>
      </div>
      <p className="text-[36px] font-bold tracking-[-0.5px] leading-none text-title">
        {hidden ? '****' : formatCurrency(value)}
      </p>
    </div>
  )
}

function SmallMetric({ label, value, highlight, hidden }: {
  label: string
  value: number
  highlight?: boolean
  hidden?: boolean
}) {
  return (
    <div className="bg-card rounded-[16px] px-4 py-3 border border-[var(--divider)] shadow-[var(--shadow-sm)]">
      <p className="text-[12px] text-subtitle mb-1">{label}</p>
      <p className={`text-[15px] font-semibold tracking-tight ${highlight === false ? 'text-destructive' : highlight ? 'text-success' : 'text-title'}`}>
        {hidden ? '****' : formatCurrency(value)}
      </p>
    </div>
  )
}
