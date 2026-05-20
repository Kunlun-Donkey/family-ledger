'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, TrendingDown, CalendarDays, ArrowUpRight, ArrowDownRight, Eye, EyeOff } from 'lucide-react'
import { usePrivacy } from '@/hooks/use-privacy'
import { formatCurrency } from '@/lib/utils'

const CATEGORIES: Record<string, string> = {
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

const CATEGORY_COLORS: Record<string, string> = {
  mortgage: '#7C8DB5',
  food: '#6D8B74',
  utilities: '#5BA4A4',
  childcare: '#9F86C0',
  medical: '#D16D6A',
  transport: '#D9A441',
  entertainment: '#B5836D',
  shopping: '#8B9467',
  insurance: '#6B8FA3',
  other: '#9CA3AF',
}

const PAY_METHODS: Record<string, string> = {
  alipay: '支付宝',
  wechat: '微信',
  card: '银行卡',
  cash: '现金',
}

interface Expense {
  id: string
  category: string
  amount: number
  date: string
  payMethod: string
  isFixed: boolean
  remark: string
  user: { nickname: string }
}

export default function ExpensePage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [lastMonthExpenses, setLastMonthExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const lastMonth = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [month])

  const fetchExpenses = useCallback(async () => {
    const [res, lastRes] = await Promise.all([
      fetch(`/api/expenses?month=${month}`),
      fetch(`/api/expenses?month=${lastMonth}`),
    ])
    const data = await res.json()
    const lastData = await lastRes.json()
    setExpenses(data.expenses || [])
    setLastMonthExpenses(lastData.expenses || [])
    setLoading(false)
  }, [month, lastMonth])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除？')) return
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    fetchExpenses()
  }

  const { hidden, toggle } = usePrivacy()
  const show = (v: string) => hidden ? '****' : v

  // ─── Analytics ───
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const lastTotal = lastMonthExpenses.reduce((s, e) => s + e.amount, 0)
  const changePercent = lastTotal > 0 ? ((total - lastTotal) / lastTotal) * 100 : 0
  const daysInMonth = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate()
  const currentDay = month === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    ? new Date().getDate() : daysInMonth
  const dailyAvg = currentDay > 0 ? total / currentDay : 0

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount, percent: total > 0 ? (amount / total) * 100 : 0 }))
  }, [expenses, total])

  const topCategory = categoryBreakdown[0]

  // Monthly insight
  const insight = useMemo(() => {
    if (total === 0) return null
    if (changePercent > 10) {
      const topIncrease = categoryBreakdown[0]
      return `本月支出较上月增长 ${changePercent.toFixed(0)}%，最大支出为${CATEGORIES[topIncrease?.category] || '其他'}`
    } else if (changePercent < -10) {
      return `本月支出较上月减少 ${Math.abs(changePercent).toFixed(0)}%，开支控制良好`
    }
    return `本月支出与上月基本持平，保持稳定`
  }, [total, changePercent, categoryBreakdown])

  return (
    <div className="pb-24 lg:pb-0 space-y-8">

      {/* ═══ Header ═══ */}
      <header className="flex items-start justify-between pt-2">
        <div>
          <h1 className="text-[32px] font-bold text-title tracking-tight">支出管理</h1>
          <p className="text-[15px] text-subtitle mt-1">追踪与分析家庭支出</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="p-2.5 rounded-[12px] text-subtitle hover:text-foreground hover:bg-card border border-transparent hover:border-[var(--divider)] transition-all duration-200"
          >
            {hidden ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[160px]" />
          <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
            <Plus className="h-4 w-4 mr-1.5" />
            记一笔
          </Button>
        </div>
      </header>

      {/* ═══ Stats Cards ═══ */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="本月总支出"
          value={show(formatCurrency(total))}
          sub={changePercent !== 0 ? (
            <span className={`flex items-center gap-0.5 text-[12px] font-medium ${changePercent > 0 ? 'text-destructive' : 'text-success'}`}>
              {changePercent > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(changePercent).toFixed(1)}%
            </span>
          ) : null}
        />
        <StatCard
          label="日均支出"
          value={show(formatCurrency(Math.round(dailyAvg)))}
          sub={<span className="text-[12px] text-subtitle">已统计 {currentDay} 天</span>}
        />
        <StatCard
          label="最大分类"
          value={topCategory ? CATEGORIES[topCategory.category] || topCategory.category : '-'}
          sub={topCategory ? <span className="text-[12px] text-subtitle">{show(formatCurrency(topCategory.amount))}</span> : null}
        />
        <StatCard
          label="上月支出"
          value={show(formatCurrency(lastTotal))}
          sub={<span className="text-[12px] text-subtitle">对比基准</span>}
        />
      </section>

      {/* ═══ Insight ═══ */}
      {insight && (
        <section className="bg-card rounded-[20px] border border-[var(--divider)] shadow-[var(--shadow-sm)] px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[10px] bg-warning/10 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="h-4 w-4 text-warning" />
          </div>
          <p className="text-[14px] text-foreground">{insight}</p>
        </section>
      )}

      {/* ═══ Category Breakdown ═══ */}
      {categoryBreakdown.length > 0 && (
        <section className="bg-card rounded-[24px] border border-[var(--divider)] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.04)] p-6">
          <h3 className="text-[20px] font-semibold text-title mb-1">支出结构</h3>
          <p className="text-[13px] text-subtitle mb-6">各分类占比分析</p>
          <div className="space-y-3">
            {categoryBreakdown.map(({ category, amount, percent }) => (
              <div key={category} className="flex items-center gap-4">
                <span className="text-[13px] text-foreground w-16 flex-shrink-0">{CATEGORIES[category] || category}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, percent)}%`, backgroundColor: CATEGORY_COLORS[category] || '#9CA3AF' }}
                  />
                </div>
                <span className="text-[13px] font-medium text-title w-20 text-right">{show(formatCurrency(amount))}</span>
                <span className="text-[12px] text-subtitle w-12 text-right">{percent.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ Detail Table ═══ */}
      <section className="bg-card rounded-[24px] border border-[var(--divider)] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--divider)] flex items-center justify-between">
          <div>
            <h3 className="text-[20px] font-semibold text-title">支出明细</h3>
            <p className="text-[13px] text-subtitle mt-0.5">{expenses.length} 笔记录</p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-subtitle">加载中...</div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <TrendingDown className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-[15px] text-subtitle">本月暂无支出记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead className="hidden sm:table-cell">支付方式</TableHead>
                  <TableHead className="hidden sm:table-cell">备注</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-subtitle">{expense.date.slice(5)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[expense.category] || '#9CA3AF' }} />
                        {CATEGORIES[expense.category] || expense.category}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-destructive">
                      {show(formatCurrency(expense.amount))}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-subtitle">
                      {PAY_METHODS[expense.payMethod] || expense.payMethod}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-subtitle">
                      {expense.remark || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-[8px] hover:bg-muted transition-colors" onClick={() => { setEditing(expense); setDialogOpen(true) }}>
                          <Pencil className="h-3.5 w-3.5 text-subtitle" />
                        </button>
                        <button className="p-1.5 rounded-[8px] hover:bg-destructive/5 transition-colors" onClick={() => handleDelete(expense.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive/60" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <ExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSuccess={fetchExpenses} />
    </div>
  )
}

/* ─── Sub Components ─── */

function StatCard({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="bg-card rounded-[20px] border border-[var(--divider)] p-5 shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]">
      <p className="text-[13px] text-subtitle mb-2">{label}</p>
      <p className="text-[24px] font-bold text-title tracking-tight leading-none">{value}</p>
      {sub && <div className="mt-2">{sub}</div>}
    </div>
  )
}

function ExpenseDialog({ open, onOpenChange, editing, onSuccess }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Expense | null
  onSuccess: () => void
}) {
  const [category, setCategory] = useState('food')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [payMethod, setPayMethod] = useState('alipay')
  const [remark, setRemark] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setCategory(editing.category)
      setAmount(String(editing.amount))
      setDate(editing.date)
      setPayMethod(editing.payMethod)
      setRemark(editing.remark)
    } else {
      setCategory('food')
      setAmount('')
      setDate(new Date().toISOString().slice(0, 10))
      setPayMethod('alipay')
      setRemark('')
    }
  }, [editing, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const url = editing ? `/api/expenses/${editing.id}` : '/api/expenses'
    const method = editing ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, amount, date, payMethod, remark }),
    })

    setLoading(false)
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{editing ? '编辑支出' : '记一笔支出'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>分类</Label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>金额 (元)</Label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>日期</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>支付方式</Label>
              <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                {Object.entries(PAY_METHODS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>备注</Label>
            <Input value={remark} onChange={e => setRemark(e.target.value)} placeholder="可选" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
