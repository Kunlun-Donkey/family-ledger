'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageTitle } from '@/components/ui/page-title'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const INCOME_TYPES: Record<string, string> = {
  salary: '工资',
  bonus: '奖金',
  side_income: '副业',
  other: '其他',
}

interface Income {
  id: string
  type: string
  amount: number
  date: string
  remark: string
  user: { nickname: string }
}

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Income | null>(null)
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const fetchIncomes = useCallback(async () => {
    const res = await fetch(`/api/incomes?month=${month}`)
    const data = await res.json()
    setIncomes(data.incomes || [])
    setLoading(false)
  }, [month])

  useEffect(() => {
    fetchIncomes()
  }, [fetchIncomes])

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除？')) return
    await fetch(`/api/incomes/${id}`, { method: 'DELETE' })
    fetchIncomes()
  }

  const total = incomes.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="pb-20 lg:pb-0">
      <PageTitle extra={
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" />
          新增收入
        </Button>
      }>收入管理</PageTitle>

      <div className="mt-4 space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center bg-card rounded-lg border border-border/50 px-4 py-3">
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-40"
        />
        <span className="text-sm text-muted-foreground">
          合计: <strong className="text-primary text-base">{formatCurrency(total)}</strong>
        </span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">加载中...</div>
          ) : incomes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">暂无收入记录</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead className="hidden sm:table-cell">备注</TableHead>
                  <TableHead className="hidden sm:table-cell">录入人</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell className="text-xs">{income.date}</TableCell>
                    <TableCell>{INCOME_TYPES[income.type] || income.type}</TableCell>
                    <TableCell className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(income.amount)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                      {income.remark}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs">
                      {income.user.nickname}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(income); setDialogOpen(true) }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(income.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <IncomeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSuccess={fetchIncomes}
      />
      </div>
    </div>
  )
}

function IncomeDialog({ open, onOpenChange, editing, onSuccess }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Income | null
  onSuccess: () => void
}) {
  const [type, setType] = useState('salary')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [remark, setRemark] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setType(editing.type)
      setAmount(String(editing.amount))
      setDate(editing.date)
      setRemark(editing.remark)
    } else {
      setType('salary')
      setAmount('')
      setDate(new Date().toISOString().slice(0, 10))
      setRemark('')
    }
  }, [editing, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const url = editing ? `/api/incomes/${editing.id}` : '/api/incomes'
    const method = editing ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, amount, date, remark }),
    })

    setLoading(false)
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{editing ? '编辑收入' : '新增收入'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>类型</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(INCOME_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>金额</Label>
            <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>日期</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>备注</Label>
            <Input value={remark} onChange={e => setRemark(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
