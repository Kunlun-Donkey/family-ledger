'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileSpreadsheet, FileText, Download, CheckCircle, Loader2, BarChart3 } from 'lucide-react'

export default function ExportPage() {
  return (
    <div className="pb-24 lg:pb-0 space-y-8">
      <header className="pt-2">
        <h1 className="text-[32px] font-bold text-title tracking-tight">导出中心</h1>
        <p className="text-[15px] text-subtitle mt-1">导出财务数据，生成专业报表</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExportExpenseCard />
        <ExportIncomeCard />
        <ExportLoanPDFCard />
        <ExportAnnualReportCard />
      </div>
    </div>
  )
}

/* ═══ Expense Export ═══ */
function ExportExpenseCard() {
  const [periodType, setPeriodType] = useState<'month' | 'year'>('month')
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  const handleExport = async () => {
    setStatus('loading')
    try {
      type ExpenseItem = { date: string; category: string; amount: number; payMethod: string; remark: string; user: { nickname: string } }
      let allExpenses: Array<{ date: string; category: string; amount: number; payMethod: string; remark: string; user: string }> = []
      const period = periodType === 'month' ? month : year

      if (periodType === 'year') {
        for (let m = 1; m <= 12; m++) {
          const res = await fetch(`/api/expenses?month=${year}-${String(m).padStart(2, '0')}`)
          const data = await res.json()
          ;(data.expenses || []).forEach((e: ExpenseItem) => {
            allExpenses.push({ date: e.date, category: e.category, amount: e.amount, payMethod: e.payMethod, remark: e.remark, user: e.user?.nickname || '' })
          })
        }
      } else {
        const res = await fetch(`/api/expenses?month=${month}`)
        const data = await res.json()
        allExpenses = (data.expenses || []).map((e: ExpenseItem) => ({
          date: e.date, category: e.category, amount: e.amount, payMethod: e.payMethod, remark: e.remark, user: e.user?.nickname || '',
        }))
      }

      const { exportExpenseExcel } = await import('@/lib/export/excel')
      await exportExpenseExcel(allExpenses, period)
      setStatus('done')
      setTimeout(() => setStatus('idle'), 3000)
    } catch { setStatus('idle') }
  }

  return (
    <ExportCard icon={FileSpreadsheet} iconColor="#4F8A5B" title="支出明细 Excel" description="导出支出明细表格，含分类汇总">
      <div className="space-y-3">
        <PeriodToggle value={periodType} onChange={setPeriodType} />
        <div className="flex items-end gap-3">
          <div className="flex-1">
            {periodType === 'month'
              ? <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
              : <Input type="number" value={year} onChange={e => setYear(e.target.value)} min="2020" max="2030" placeholder="年份" />
            }
          </div>
          <ExportButton status={status} onClick={handleExport} />
        </div>
      </div>
    </ExportCard>
  )
}

/* ═══ Income Export ═══ */
function ExportIncomeCard() {
  const [periodType, setPeriodType] = useState<'month' | 'year'>('month')
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  const handleExport = async () => {
    setStatus('loading')
    try {
      type IncomeItem = { date: string; type: string; amount: number; remark: string; user: { nickname: string } }
      let allIncomes: Array<{ date: string; type: string; amount: number; remark: string; user: string }> = []
      const period = periodType === 'month' ? month : year

      if (periodType === 'year') {
        for (let m = 1; m <= 12; m++) {
          const res = await fetch(`/api/incomes?month=${year}-${String(m).padStart(2, '0')}`)
          const data = await res.json()
          ;(data.incomes || []).forEach((i: IncomeItem) => {
            allIncomes.push({ date: i.date, type: i.type, amount: i.amount, remark: i.remark, user: i.user?.nickname || '' })
          })
        }
      } else {
        const res = await fetch(`/api/incomes?month=${month}`)
        const data = await res.json()
        allIncomes = (data.incomes || []).map((i: IncomeItem) => ({
          date: i.date, type: i.type, amount: i.amount, remark: i.remark, user: i.user?.nickname || '',
        }))
      }

      const { exportIncomeExcel } = await import('@/lib/export/excel')
      await exportIncomeExcel(allIncomes, period)
      setStatus('done')
      setTimeout(() => setStatus('idle'), 3000)
    } catch { setStatus('idle') }
  }

  return (
    <ExportCard icon={FileSpreadsheet} iconColor="#6D8B74" title="收入明细 Excel" description="导出收入明细表格">
      <div className="space-y-3">
        <PeriodToggle value={periodType} onChange={setPeriodType} />
        <div className="flex items-end gap-3">
          <div className="flex-1">
            {periodType === 'month'
              ? <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
              : <Input type="number" value={year} onChange={e => setYear(e.target.value)} min="2020" max="2030" placeholder="年份" />
            }
          </div>
          <ExportButton status={status} onClick={handleExport} />
        </div>
      </div>
    </ExportCard>
  )
}

/* ═══ Loan PDF Export ═══ */
function ExportLoanPDFCard() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [loans, setLoans] = useState<Array<{ id: string; name: string }>>([])
  const [selectedLoan, setSelectedLoan] = useState('')

  const fetchLoans = async () => {
    const res = await fetch('/api/loans')
    const data = await res.json()
    const list = data.loans || []
    setLoans(list)
    if (list.length > 0 && !selectedLoan) setSelectedLoan(list[0].id)
  }

  useState(() => { fetchLoans() })

  const handleExport = async () => {
    if (!selectedLoan) return
    setStatus('loading')
    try {
      const res = await fetch(`/api/loans/${selectedLoan}`)
      const data = await res.json()
      const loan = data.loan
      const { exportLoanPDF } = await import('@/lib/export/pdf')
      exportLoanPDF(loan, loan.schedules || [])
      setStatus('done')
      setTimeout(() => setStatus('idle'), 3000)
    } catch { setStatus('idle') }
  }

  return (
    <ExportCard icon={FileText} iconColor="#7C8DB5" title="贷款还款计划 PDF" description="导出完整还款计划表，支持打印归档">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5 flex-1">
          <Label className="text-[12px]">选择贷款</Label>
          <select
            value={selectedLoan}
            onChange={e => setSelectedLoan(e.target.value)}
            onFocus={fetchLoans}
            className="flex h-11 w-full rounded-[14px] border border-input bg-card px-4 py-2 text-[15px] shadow-[var(--shadow-sm)] focus:outline-none focus:border-primary transition-all duration-200"
          >
            {loans.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            {loans.length === 0 && <option value="">暂无贷款</option>}
          </select>
        </div>
        <ExportButton status={status} onClick={handleExport} disabled={!selectedLoan} />
      </div>
    </ExportCard>
  )
}

/* ═══ Annual Report ═══ */
function ExportAnnualReportCard() {
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  const handleExport = async () => {
    setStatus('loading')
    try {
      const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
      const monthlyData: Array<{ month: string; income: number; expense: number }> = []

      for (const m of months) {
        const [incRes, expRes] = await Promise.all([
          fetch(`/api/incomes?month=${m}`),
          fetch(`/api/expenses?month=${m}`),
        ])
        const incData = await incRes.json()
        const expData = await expRes.json()
        const income = (incData.incomes || []).reduce((s: number, i: { amount: number }) => s + i.amount, 0)
        const expense = (expData.expenses || []).reduce((s: number, e: { amount: number }) => s + e.amount, 0)
        monthlyData.push({ month: m, income, expense })
      }

      const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0)
      const totalExpense = monthlyData.reduce((s, m) => s + m.expense, 0)

      // Category breakdown
      const allExpenses: Array<{ category: string; amount: number }> = []
      for (const m of months) {
        const res = await fetch(`/api/expenses?month=${m}`)
        const data = await res.json()
        ;(data.expenses || []).forEach((e: { category: string; amount: number }) => {
          allExpenses.push({ category: e.category, amount: e.amount })
        })
      }
      const catMap: Record<string, number> = {}
      allExpenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount })
      const categoryBreakdown = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([category, amount]) => ({ category, amount }))

      const [assetsRes, loansRes] = await Promise.all([fetch('/api/assets'), fetch('/api/loans')])
      const assetsData = await assetsRes.json()
      const loansData = await loansRes.json()
      const totalAssets = (assetsData.assets || []).reduce((s: number, a: { value: number }) => s + a.value, 0)
      const loansList = loansData.loans || []
      const totalDebt = loansList.reduce((s: number, l: { remainPrincipal: number }) => s + l.remainPrincipal, 0)

      const { exportAnnualReportPDF } = await import('@/lib/export/pdf')
      exportAnnualReportPDF({
        year: parseInt(year), totalIncome, totalExpense,
        netAssets: totalAssets - totalDebt, totalAssets, totalDebt,
        monthlyData, categoryBreakdown,
        loans: loansList.map((l: { name: string; remainPrincipal: number }) => ({ name: l.name, remainPrincipal: l.remainPrincipal })),
      })

      setStatus('done')
      setTimeout(() => setStatus('idle'), 3000)
    } catch { setStatus('idle') }
  }

  return (
    <ExportCard icon={BarChart3} iconColor="#D9A441" title="年度资产报告 PDF" description="生成完整的家庭年度财务报告" className="lg:col-span-2">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5 w-32">
          <Label className="text-[12px]">选择年份</Label>
          <Input type="number" value={year} onChange={e => setYear(e.target.value)} min="2020" max="2030" />
        </div>
        <ExportButton status={status} onClick={handleExport} label="生成年报" />
      </div>
    </ExportCard>
  )
}

/* ─── Shared Components ─── */

function PeriodToggle({ value, onChange }: { value: 'month' | 'year'; onChange: (v: 'month' | 'year') => void }) {
  return (
    <div className="flex gap-2">
      {[{ key: 'month' as const, label: '按月' }, { key: 'year' as const, label: '按年' }].map(opt => (
        <button key={opt.key} type="button" onClick={() => onChange(opt.key)}
          className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium border transition-all duration-200 ${value === opt.key ? 'border-primary bg-primary/5 text-primary' : 'border-[var(--divider)] text-subtitle hover:border-primary/30'}`}
        >{opt.label}</button>
      ))}
    </div>
  )
}

function ExportCard({ icon: Icon, iconColor, title, description, children, className }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  iconColor: string
  title: string
  description: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-card rounded-[24px] border border-[var(--divider)] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.04)] p-6 flex flex-col ${className || ''}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: `${iconColor}15` }}>
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-title">{title}</h3>
          <p className="text-[12px] text-subtitle">{description}</p>
        </div>
      </div>
      <div className="mt-auto pt-4 border-t border-[var(--divider)]">
        {children}
      </div>
    </div>
  )
}

function ExportButton({ status, onClick, disabled, label }: {
  status: 'idle' | 'loading' | 'done'
  onClick: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <Button onClick={onClick} disabled={disabled || status === 'loading'}
      className={status === 'done' ? 'bg-success hover:bg-success' : ''}>
      {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
      {status === 'done' && <CheckCircle className="h-4 w-4" />}
      {status === 'idle' && <Download className="h-4 w-4" />}
      <span className="ml-1.5">
        {status === 'loading' ? '导出中...' : status === 'done' ? '已完成' : (label || '导出')}
      </span>
    </Button>
  )
}
