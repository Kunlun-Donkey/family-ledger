'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Building2, Calendar, Percent, Clock, CreditCard, ArrowDownToLine, RefreshCw, Eye, Trash2, Pencil } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const LOAN_TYPES: Record<string, string> = {
  provident_fund: '公积金贷款',
  commercial: '商业贷款',
  mixed: '组合贷',
}

const REPAYMENT_TYPES: Record<string, string> = {
  equal_payment: '等额本息',
  equal_principal: '等额本金',
}

interface Loan {
  id: string
  loanType: string
  name: string
  providentAmount: number
  commercialAmount: number
  providentRate: number
  commercialRate: number
  years: number
  startDate: string
  repaymentType: string
  remainPrincipal: number
  isSettled: boolean
}

interface LoanScheduleItem {
  id: string
  period: number
  date: string
  payment: number
  principal: number
  interest: number
  remainPrincipal: number
  status: string
  loanPart: string
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editLoan, setEditLoan] = useState<Loan | null>(null)
  const [detailLoan, setDetailLoan] = useState<string | null>(null)
  const [actionOpen, setActionOpen] = useState<{ loanId: string; type: 'prepayment' | 'rate_change' } | null>(null)

  const fetchLoans = async () => {
    const res = await fetch('/api/loans')
    const data = await res.json()
    setLoans(data.loans || [])
    setLoading(false)
  }

  useEffect(() => { fetchLoans() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该贷款？所有还款计划将一并删除。')) return
    await fetch(`/api/loans/${id}`, { method: 'DELETE' })
    fetchLoans()
  }

  const totalDebt = loans.filter(l => !l.isSettled).reduce((s, l) => s + l.remainPrincipal, 0)
  const activeCount = loans.filter(l => !l.isSettled).length

  return (
    <div className="pb-24 lg:pb-0 space-y-8">

      {/* ═══ Header ═══ */}
      <header className="flex items-start justify-between pt-2">
        <div>
          <h1 className="text-[32px] font-bold text-title tracking-tight">贷款管理</h1>
          <p className="text-[15px] text-subtitle mt-1">
            {activeCount > 0 ? `${activeCount} 笔贷款还款中 · 剩余本金 ${formatCurrency(totalDebt)}` : '管理您的房贷与其他贷款'}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          新增贷款
        </Button>
      </header>

      {/* ═══ Content ═══ */}
      {loading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <p className="text-[15px] text-subtitle">加载中...</p>
        </div>
      ) : loans.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] text-center">
          <div className="w-16 h-16 rounded-[20px] bg-muted flex items-center justify-center mb-4">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-[15px] text-subtitle">暂无贷款记录</p>
          <p className="text-[13px] text-subtitle mt-1">点击右上角新增贷款开始管理</p>
        </div>
      ) : (
        <div className="space-y-6">
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onViewSchedule={() => setDetailLoan(loan.id)}
              onPrepay={() => setActionOpen({ loanId: loan.id, type: 'prepayment' })}
              onRateChange={() => setActionOpen({ loanId: loan.id, type: 'rate_change' })}
              onEdit={() => setEditLoan(loan)}
              onDelete={() => handleDelete(loan.id)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateLoanDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={fetchLoans} />
      {editLoan && <EditLoanDialog loan={editLoan} onClose={() => setEditLoan(null)} onSuccess={fetchLoans} />}
      {detailLoan && <LoanDetailDialog loanId={detailLoan} onClose={() => setDetailLoan(null)} />}
      {actionOpen && (
        <LoanActionDialog
          loanId={actionOpen.loanId}
          actionType={actionOpen.type}
          onClose={() => setActionOpen(null)}
          onSuccess={fetchLoans}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Loan Card - The core visual component
   ═══════════════════════════════════════════════ */

function LoanCard({ loan, onViewSchedule, onPrepay, onRateChange, onEdit, onDelete }: {
  loan: Loan
  onViewSchedule: () => void
  onPrepay: () => void
  onRateChange: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const totalPrincipal = (loan.providentAmount || 0) + (loan.commercialAmount || 0)
  const paidPrincipal = totalPrincipal - loan.remainPrincipal
  const progress = totalPrincipal > 0 ? (paidPrincipal / totalPrincipal) * 100 : 0

  // Use commercial loan's term as the primary display (since it's usually longer)
  const startDate = new Date(loan.startDate)
  const now = new Date()
  const elapsedMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth())
  const totalMonths = loan.years * 12
  const remainMonths = Math.max(0, totalMonths - elapsedMonths)
  const remainYears = Math.floor(remainMonths / 12)
  const remainMonthsRem = remainMonths % 12

  // Display rate: use commercial rate as primary for mixed loans
  const displayRate = loan.commercialRate || loan.providentRate || 0

  // Estimate monthly payment (sum of both parts)
  const calcMonthly = (principal: number, rate: number, months: number) => {
    if (months <= 0 || principal <= 0) return 0
    const r = rate / 100 / 12
    if (r === 0) return principal / months
    return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1)
  }

  const providentRatio = totalPrincipal > 0 ? (loan.providentAmount || 0) / totalPrincipal : 0
  const providentRemainEst = loan.remainPrincipal * providentRatio
  const commercialRemainEst = loan.remainPrincipal * (1 - providentRatio)

  const monthlyPayment =
    calcMonthly(providentRemainEst, loan.providentRate || 0, remainMonths) +
    calcMonthly(commercialRemainEst, loan.commercialRate || 0, remainMonths)

  return (
    <div className="bg-card rounded-[24px] border border-[var(--divider)] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.04)] overflow-hidden">

      {/* Top section */}
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-info/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-info" />
            </div>
            <div>
              <h3 className="text-[20px] font-semibold text-title">{loan.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[13px] text-subtitle">{LOAN_TYPES[loan.loanType]}</span>
                <span className="text-[13px] text-subtitle">·</span>
                <span className="text-[13px] text-subtitle">{REPAYMENT_TYPES[loan.repaymentType]}</span>
              </div>
            </div>
          </div>
          <span className={`text-[12px] font-medium px-3 py-1 rounded-full ${loan.isSettled ? 'bg-success/10 text-success' : 'bg-info/10 text-info'}`}>
            {loan.isSettled ? '已结清' : '还款中'}
          </span>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricBlock
            icon={CreditCard}
            label="预估月供"
            value={formatCurrency(Math.round(monthlyPayment))}
          />
          <MetricBlock
            icon={Building2}
            label="剩余本金"
            value={formatCurrency(loan.remainPrincipal)}
            highlight
          />
          <MetricBlock
            icon={Clock}
            label="剩余期限"
            value={remainYears > 0 ? `${remainYears}年${remainMonthsRem}月` : `${remainMonthsRem}个月`}
          />
          <MetricBlock
            icon={Percent}
            label={loan.loanType === 'mixed' ? '商贷利率' : '年利率'}
            value={`${displayRate.toFixed(2)}%`}
          />
        </div>

        {/* Progress section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-subtitle">还款进度</span>
            <span className="text-[13px] font-medium text-title">{progress.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[12px] text-subtitle">已还 {formatCurrency(paidPrincipal)}</span>
            <span className="text-[12px] text-subtitle">贷款总额 {formatCurrency(totalPrincipal)}</span>
          </div>
        </div>

        {/* Loan parts breakdown with individual progress */}
        {loan.loanType === 'mixed' && (
          <LoanPartsBreakdown loan={loan} totalPrincipal={totalPrincipal} />
        )}
      </div>

      {/* Actions bar */}
      <div className="px-6 py-4 border-t border-[var(--divider)] bg-[var(--background)]/50 flex items-center gap-2 flex-wrap">
        <button
          onClick={onViewSchedule}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-medium text-foreground bg-card border border-[var(--divider)] hover:border-primary/40 hover:text-primary shadow-[var(--shadow-sm)] transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        >
          <Eye className="h-3.5 w-3.5" />
          还款计划
        </button>
        {!loan.isSettled && (
          <>
            <button
              onClick={onPrepay}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-medium text-foreground bg-card border border-[var(--divider)] hover:border-success/40 hover:text-success shadow-[var(--shadow-sm)] transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              提前还款
            </button>
            <button
              onClick={onRateChange}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-medium text-foreground bg-card border border-[var(--divider)] hover:border-warning/40 hover:text-warning shadow-[var(--shadow-sm)] transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              利率调整
            </button>
          </>
        )}
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-medium text-foreground bg-card border border-[var(--divider)] hover:border-info/40 hover:text-info shadow-[var(--shadow-sm)] transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        >
          <Pencil className="h-3.5 w-3.5" />
          修改信息
        </button>
        <div className="flex-1" />
        <button
          onClick={onDelete}
          className="p-2 rounded-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-[250ms]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function LoanPartsBreakdown({ loan, totalPrincipal }: { loan: Loan; totalPrincipal: number }) {
  const providentRatio = totalPrincipal > 0 ? loan.providentAmount / totalPrincipal : 0.5
  const providentRemain = loan.remainPrincipal * providentRatio
  const commercialRemain = loan.remainPrincipal * (1 - providentRatio)
  const providentPaid = loan.providentAmount - providentRemain
  const commercialPaid = loan.commercialAmount - commercialRemain
  const providentProgress = loan.providentAmount > 0 ? (providentPaid / loan.providentAmount) * 100 : 0
  const commercialProgress = loan.commercialAmount > 0 ? (commercialPaid / loan.commercialAmount) * 100 : 0

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="px-4 py-4 rounded-[14px] bg-[var(--background)] border border-[var(--divider)]">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[12px] text-subtitle font-medium">公积金贷款</p>
          <p className="text-[11px] text-subtitle">{providentProgress.toFixed(1)}%</p>
        </div>
        <p className="text-[18px] font-bold text-title tracking-tight">{formatCurrency(loan.providentAmount)}</p>
        <p className="text-[12px] text-subtitle mt-0.5 mb-3">利率 {loan.providentRate}% · 剩余 {formatCurrency(providentRemain)}</p>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-[#9F86C0] rounded-full transition-all duration-700"
            style={{ width: `${Math.max(2, providentProgress)}%` }}
          />
        </div>
      </div>
      <div className="px-4 py-4 rounded-[14px] bg-[var(--background)] border border-[var(--divider)]">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[12px] text-subtitle font-medium">商业贷款</p>
          <p className="text-[11px] text-subtitle">{commercialProgress.toFixed(1)}%</p>
        </div>
        <p className="text-[18px] font-bold text-title tracking-tight">{formatCurrency(loan.commercialAmount)}</p>
        <p className="text-[12px] text-subtitle mt-0.5 mb-3">利率 {loan.commercialRate}% · 剩余 {formatCurrency(commercialRemain)}</p>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-info rounded-full transition-all duration-700"
            style={{ width: `${Math.max(2, commercialProgress)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function MetricBlock({ icon: Icon, label, value, highlight }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="px-4 py-3 rounded-[14px] bg-[var(--background)] border border-[var(--divider)]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-subtitle" />
        <span className="text-[12px] text-subtitle">{label}</span>
      </div>
      <p className={`text-[18px] font-bold tracking-tight ${highlight ? 'text-info' : 'text-title'}`}>
        {value}
      </p>
    </div>
  )
}

/* ═══ Dialogs (same logic, updated styling) ═══ */

function CreateLoanDialog({ open, onOpenChange, onSuccess }: {
  open: boolean; onOpenChange: (v: boolean) => void; onSuccess: () => void
}) {
  const [loanType, setLoanType] = useState('mixed')
  const [name, setName] = useState('')
  const [providentAmount, setProvidentAmount] = useState('')
  const [commercialAmount, setCommercialAmount] = useState('')
  const [providentRate, setProvidentRate] = useState('3.1')
  const [commercialRate, setCommercialRate] = useState('3.45')
  const [years, setYears] = useState('30')
  const [startDate, setStartDate] = useState('')
  const [repaymentType, setRepaymentType] = useState('equal_payment')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loanType, name, providentAmount, commercialAmount, providentRate, commercialRate, years, startDate, repaymentType }),
    })
    setLoading(false)
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>新增贷款</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>贷款名称</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="例如: 首套房贷" required />
          </div>
          <div className="space-y-2">
            <Label>贷款类型</Label>
            <Select value={loanType} onChange={e => setLoanType(e.target.value)}>
              {Object.entries(LOAN_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
          {(loanType === 'provident_fund' || loanType === 'mixed') && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>公积金本金 (元)</Label>
                <Input type="number" step="0.01" value={providentAmount} onChange={e => setProvidentAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>公积金利率 (%)</Label>
                <Input type="number" step="0.01" value={providentRate} onChange={e => setProvidentRate(e.target.value)} />
              </div>
            </div>
          )}
          {(loanType === 'commercial' || loanType === 'mixed') && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>商贷本金 (元)</Label>
                <Input type="number" step="0.01" value={commercialAmount} onChange={e => setCommercialAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>商贷利率 (%)</Label>
                <Input type="number" step="0.01" value={commercialRate} onChange={e => setCommercialRate(e.target.value)} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>贷款年限</Label>
              <Input type="number" value={years} onChange={e => setYears(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>开始日期</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>还款方式</Label>
            <Select value={repaymentType} onChange={e => setRepaymentType(e.target.value)}>
              {Object.entries(REPAYMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? '创建中...' : '创建贷款'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LoanDetailDialog({ loanId, onClose }: { loanId: string; onClose: () => void }) {
  const [schedules, setSchedules] = useState<LoanScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'provident' | 'commercial'>('all')

  useEffect(() => {
    fetch(`/api/loans/${loanId}`)
      .then(res => res.json())
      .then(data => {
        setSchedules(data.loan?.schedules || [])
        setLoading(false)
      })
  }, [loanId])

  const hasBothParts = schedules.some(s => s.loanPart === 'provident') && schedules.some(s => s.loanPart === 'commercial')

  const filtered = tab === 'all'
    ? schedules
    : schedules.filter(s => s.loanPart === tab)

  // Summary stats for filtered
  const totalInterest = filtered.reduce((s, item) => s + item.interest, 0)
  const totalPayment = filtered.reduce((s, item) => s + item.payment, 0)

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>还款计划表</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-subtitle">加载中...</div>
        ) : (
          <>
            {/* Tabs */}
            {hasBothParts && (
              <div className="flex items-center gap-1 p-1 bg-muted rounded-[12px] mb-4">
                {[
                  { key: 'all' as const, label: '全部' },
                  { key: 'provident' as const, label: '公积金' },
                  { key: 'commercial' as const, label: '商业贷款' },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex-1 px-4 py-2 rounded-[10px] text-[13px] font-medium transition-all duration-200 ${
                      tab === t.key
                        ? 'bg-card text-title shadow-sm'
                        : 'text-subtitle hover:text-foreground'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="px-4 py-3 rounded-[12px] bg-[var(--background)] border border-[var(--divider)]">
                <p className="text-[12px] text-subtitle">总期数</p>
                <p className="text-[18px] font-bold text-title">{filtered.length}</p>
              </div>
              <div className="px-4 py-3 rounded-[12px] bg-[var(--background)] border border-[var(--divider)]">
                <p className="text-[12px] text-subtitle">总还款</p>
                <p className="text-[15px] font-bold text-title">{formatCurrency(totalPayment)}</p>
              </div>
              <div className="px-4 py-3 rounded-[12px] bg-[var(--background)] border border-[var(--divider)]">
                <p className="text-[12px] text-subtitle">总利息</p>
                <p className="text-[15px] font-bold text-warning">{formatCurrency(totalInterest)}</p>
              </div>
            </div>

            {/* Table */}
            <div className="max-h-[50vh] overflow-y-auto -mx-6 px-6 rounded-[12px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>期数</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>月供</TableHead>
                    <TableHead>本金</TableHead>
                    <TableHead>利息</TableHead>
                    <TableHead>剩余本金</TableHead>
                    {tab === 'all' && hasBothParts && <TableHead>类型</TableHead>}
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.period}</TableCell>
                      <TableCell className="text-subtitle">{s.date}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(s.payment)}</TableCell>
                      <TableCell>{formatCurrency(s.principal)}</TableCell>
                      <TableCell className="text-subtitle">{formatCurrency(s.interest)}</TableCell>
                      <TableCell>{formatCurrency(s.remainPrincipal)}</TableCell>
                      {tab === 'all' && hasBothParts && (
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            s.loanPart === 'provident' ? 'bg-[#9F86C0]/10 text-[#9F86C0]' : 'bg-info/10 text-info'
                          }`}>
                            {s.loanPart === 'provident' ? '公积金' : '商贷'}
                          </span>
                        </TableCell>
                      )}
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${s.status === 'paid' ? 'bg-success/10 text-success' : 'bg-muted text-subtitle'}`}>
                          {s.status === 'paid' ? '已还' : '待还'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function LoanActionDialog({ loanId, actionType, onClose, onSuccess }: {
  loanId: string; actionType: 'prepayment' | 'rate_change'; onClose: () => void; onSuccess: () => void
}) {
  const [amount, setAmount] = useState('')
  const [target, setTarget] = useState<'provident' | 'commercial' | 'both'>('both')
  const [repayMethod, setRepayMethod] = useState<'equal_payment' | 'equal_principal'>('equal_payment')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [newProvidentRate, setNewProvidentRate] = useState('')
  const [newCommercialRate, setNewCommercialRate] = useState('')
  const [loading, setLoading] = useState(false)
  const [loan, setLoan] = useState<Loan | null>(null)

  useEffect(() => {
    fetch(`/api/loans/${loanId}`)
      .then(res => res.json())
      .then(data => {
        const l = data.loan || null
        setLoan(l)
        if (l) setRepayMethod(l.repaymentType || 'equal_payment')
      })
  }, [loanId])

  const isMixed = loan?.loanType === 'mixed'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch(`/api/loans/${loanId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionType, amount, date, target, repayMethod, newProvidentRate, newCommercialRate }),
    })
    setLoading(false)
    onClose()
    onSuccess()
  }

  // Calculate impact preview
  const prepayAmount = parseFloat(amount) || 0
  const totalPrincipal = (loan?.providentAmount || 0) + (loan?.commercialAmount || 0)
  const providentRatio = totalPrincipal > 0 ? (loan?.providentAmount || 0) / totalPrincipal : 0.5
  const currentProvidentRemain = (loan?.remainPrincipal || 0) * providentRatio
  const currentCommercialRemain = (loan?.remainPrincipal || 0) * (1 - providentRatio)

  let providentReduction = 0
  let commercialReduction = 0
  if (target === 'provident') {
    providentReduction = Math.min(prepayAmount, currentProvidentRemain)
  } else if (target === 'commercial') {
    commercialReduction = Math.min(prepayAmount, currentCommercialRemain)
  } else {
    providentReduction = prepayAmount * providentRatio
    commercialReduction = prepayAmount * (1 - providentRatio)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>{actionType === 'prepayment' ? '提前还款' : '利率调整'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>日期</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>

          {actionType === 'prepayment' ? (
            <>
              {/* Target selection for mixed loans */}
              {isMixed && (
                <div className="space-y-2">
                  <Label>还款目标</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'both' as const, label: '按比例分配' },
                      { key: 'provident' as const, label: '仅公积金' },
                      { key: 'commercial' as const, label: '仅商贷' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setTarget(opt.key)}
                        className={`px-3 py-2.5 rounded-[10px] text-[13px] font-medium border transition-all duration-200 ${
                          target === opt.key
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-[var(--divider)] text-subtitle hover:border-primary/30'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>提前还款金额 (元)</Label>
                <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="输入还款金额" required />
              </div>

              {/* Repayment method after prepayment */}
              <div className="space-y-2">
                <Label>还款后还款方式</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'equal_payment' as const, label: '等额本息', desc: '月供固定' },
                    { key: 'equal_principal' as const, label: '等额本金', desc: '月供递减' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setRepayMethod(opt.key)}
                      className={`px-3 py-3 rounded-[10px] text-left border transition-all duration-200 ${
                        repayMethod === opt.key
                          ? 'border-primary bg-primary/5'
                          : 'border-[var(--divider)] hover:border-primary/30'
                      }`}
                    >
                      <p className={`text-[13px] font-medium ${repayMethod === opt.key ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
                      <p className="text-[11px] text-subtitle mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact preview */}
              {prepayAmount > 0 && loan && (
                <div className="p-4 rounded-[14px] bg-[var(--background)] border border-[var(--divider)] space-y-3">
                  <p className="text-[13px] font-medium text-title">还款影响预览</p>

                  {(target === 'provident' || target === 'both') && isMixed && (
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-subtitle">公积金减少</span>
                      <span className="text-[13px] font-medium text-[#9F86C0]">-{formatCurrency(providentReduction)}</span>
                    </div>
                  )}
                  {(target === 'commercial' || target === 'both') && isMixed && (
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-subtitle">商贷减少</span>
                      <span className="text-[13px] font-medium text-info">-{formatCurrency(commercialReduction)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[var(--divider)] flex items-center justify-between">
                    <span className="text-[13px] text-subtitle">还款后总剩余</span>
                    <span className="text-[15px] font-bold text-title">
                      {formatCurrency(Math.max(0, (loan.remainPrincipal || 0) - prepayAmount))}
                    </span>
                  </div>

                  {isMixed && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="text-center px-3 py-2 rounded-[8px] bg-card">
                        <p className="text-[11px] text-subtitle">公积金剩余</p>
                        <p className="text-[13px] font-semibold text-title">{formatCurrency(Math.max(0, currentProvidentRemain - providentReduction))}</p>
                      </div>
                      <div className="text-center px-3 py-2 rounded-[8px] bg-card">
                        <p className="text-[11px] text-subtitle">商贷剩余</p>
                        <p className="text-[13px] font-semibold text-title">{formatCurrency(Math.max(0, currentCommercialRemain - commercialReduction))}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {(isMixed || loan?.loanType === 'provident_fund') && (
                <div className="space-y-2">
                  <Label>公积金年利率 (%)</Label>
                  <Input type="number" step="0.01" value={newProvidentRate} onChange={e => setNewProvidentRate(e.target.value)} placeholder={`当前 ${loan?.providentRate || 0}%`} />
                </div>
              )}
              {(isMixed || loan?.loanType === 'commercial') && (
                <div className="space-y-2">
                  <Label>商贷年利率 (%)</Label>
                  <Input type="number" step="0.01" value={newCommercialRate} onChange={e => setNewCommercialRate(e.target.value)} placeholder={`当前 ${loan?.commercialRate || 0}%`} />
                </div>
              )}
            </div>
          )}

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? '处理中...' : '确认提交'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditLoanDialog({ loan, onClose, onSuccess }: {
  loan: Loan; onClose: () => void; onSuccess: () => void
}) {
  const [name, setName] = useState(loan.name)
  const [startDate, setStartDate] = useState(loan.startDate)
  const [repaymentType, setRepaymentType] = useState(loan.repaymentType || 'equal_payment')
  const [providentAmount, setProvidentAmount] = useState(String(loan.providentAmount))
  const [commercialAmount, setCommercialAmount] = useState(String(loan.commercialAmount))
  const [providentRate, setProvidentRate] = useState(String(loan.providentRate))
  const [commercialRate, setCommercialRate] = useState(String(loan.commercialRate))
  const [years, setYears] = useState(String(loan.years))

  // Split remain principal by ratio
  const totalOrig = (loan.providentAmount || 0) + (loan.commercialAmount || 0)
  const pRatio = totalOrig > 0 ? loan.providentAmount / totalOrig : 0.5
  const [providentRemain, setProvidentRemain] = useState(String(Math.round(loan.remainPrincipal * pRatio * 100) / 100))
  const [commercialRemain, setCommercialRemain] = useState(String(Math.round(loan.remainPrincipal * (1 - pRatio) * 100) / 100))
  const [loading, setLoading] = useState(false)

  const isMixed = loan.loanType === 'mixed'
  const hasProvident = loan.loanType === 'provident_fund' || isMixed
  const hasCommercial = loan.loanType === 'commercial' || isMixed

  const totalRemainPrincipal = (parseFloat(providentRemain) || 0) + (parseFloat(commercialRemain) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch(`/api/loans/${loan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, startDate, repaymentType, providentAmount, commercialAmount, providentRate, commercialRate, years, remainPrincipal: String(totalRemainPrincipal) }),
    })
    setLoading(false)
    onClose()
    onSuccess()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>修改贷款信息</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>贷款名称</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </div>

          {hasProvident && (
            <div className="p-4 rounded-[14px] bg-[var(--background)] border border-[var(--divider)] space-y-3">
              <p className="text-[13px] font-medium text-[#9F86C0]">公积金贷款</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[12px]">贷款总额 (元)</Label>
                  <Input type="number" step="0.01" value={providentAmount} onChange={e => setProvidentAmount(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px]">年利率 (%)</Label>
                  <Input type="number" step="0.01" value={providentRate} onChange={e => setProvidentRate(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {hasCommercial && (
            <div className="p-4 rounded-[14px] bg-[var(--background)] border border-[var(--divider)] space-y-3">
              <p className="text-[13px] font-medium text-info">商业贷款</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[12px]">贷款总额 (元)</Label>
                  <Input type="number" step="0.01" value={commercialAmount} onChange={e => setCommercialAmount(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px]">年利率 (%)</Label>
                  <Input type="number" step="0.01" value={commercialRate} onChange={e => setCommercialRate(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>还款方式</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'equal_payment', label: '等额本息', desc: '月供固定' },
                { key: 'equal_principal', label: '等额本金', desc: '月供递减' },
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setRepaymentType(opt.key)}
                  className={`px-3 py-3 rounded-[10px] text-left border transition-all duration-200 ${
                    repaymentType === opt.key
                      ? 'border-primary bg-primary/5'
                      : 'border-[var(--divider)] hover:border-primary/30'
                  }`}
                >
                  <p className={`text-[13px] font-medium ${repaymentType === opt.key ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
                  <p className="text-[11px] text-subtitle mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>还款开始日期</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>贷款年限</Label>
              <Input type="number" value={years} onChange={e => setYears(e.target.value)} required />
            </div>
          </div>

          {/* Remaining principal breakdown */}
          <div className="p-4 rounded-[14px] bg-[var(--background)] border border-[var(--divider)] space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-title">剩余本金</p>
              <p className="text-[15px] font-bold text-title">{formatCurrency(totalRemainPrincipal)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {hasProvident && (
                <div className="space-y-1.5">
                  <Label className="text-[12px]">公积金剩余 (元)</Label>
                  <Input type="number" step="0.01" value={providentRemain} onChange={e => setProvidentRemain(e.target.value)} required />
                </div>
              )}
              {hasCommercial && (
                <div className="space-y-1.5">
                  <Label className="text-[12px]">商贷剩余 (元)</Label>
                  <Input type="number" step="0.01" value={commercialRemain} onChange={e => setCommercialRemain(e.target.value)} required />
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-warning/5 border border-warning/20">
            <p className="text-[12px] text-warning">
              修改贷款总额或剩余本金后，建议重新生成还款计划以保持数据一致。
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '保存中...' : '保存修改'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
