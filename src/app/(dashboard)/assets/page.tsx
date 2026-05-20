'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageTitle } from '@/components/ui/page-title'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const ASSET_TYPES: Record<string, string> = {
  cash_bank: '银行卡',
  cash_wechat: '微信余额',
  cash_alipay: '支付宝余额',
  cash_hand: '现金',
  invest_stock: '股票',
  invest_fund: '基金',
  fixed_house: '房产',
  fixed_car: '汽车',
}

interface Asset {
  id: string
  type: string
  name: string
  value: number
  user: { nickname: string }
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)

  const fetchAssets = async () => {
    const res = await fetch('/api/assets')
    const data = await res.json()
    setAssets(data.assets || [])
    setLoading(false)
  }

  useEffect(() => { fetchAssets() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除？')) return
    await fetch(`/api/assets/${id}`, { method: 'DELETE' })
    fetchAssets()
  }

  const totalValue = assets.reduce((s, a) => s + a.value, 0)

  // Group by type
  const grouped = assets.reduce<Record<string, Asset[]>>((acc, a) => {
    const category = a.type.startsWith('cash') ? '现金类' : a.type.startsWith('invest') ? '投资类' : '固定资产'
    if (!acc[category]) acc[category] = []
    acc[category].push(a)
    return acc
  }, {})

  return (
    <div className="pb-20 lg:pb-0">
      <PageTitle extra={
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" />
          新增资产
        </Button>
      }>资产管理</PageTitle>

      <div className="mt-4 space-y-4">
      <div className="bg-card rounded-lg border border-border/50 px-4 py-3">
        <span className="text-sm text-muted-foreground">总资产: </span>
        <strong className="text-primary text-lg">{formatCurrency(totalValue)}</strong>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground p-8">加载中...</div>
      ) : assets.length === 0 ? (
        <div className="text-center text-muted-foreground p-8">暂无资产记录，点击右上角新增</div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-base">{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ASSET_TYPES[asset.type] || asset.type} · {asset.user.nickname}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(asset.value)}</span>
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(asset); setDialogOpen(true) }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(asset.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}

      <AssetDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSuccess={fetchAssets} />
      </div>
    </div>
  )
}

function AssetDialog({ open, onOpenChange, editing, onSuccess }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Asset | null
  onSuccess: () => void
}) {
  const [type, setType] = useState('cash_bank')
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setType(editing.type)
      setName(editing.name)
      setValue(String(editing.value))
    } else {
      setType('cash_bank')
      setName('')
      setValue('')
    }
  }, [editing, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const url = editing ? `/api/assets/${editing.id}` : '/api/assets'
    const method = editing ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name, value }),
    })

    setLoading(false)
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{editing ? '编辑资产' : '新增资产'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>类型</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(ASSET_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>名称</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="例如: 招商银行储蓄卡" required />
          </div>
          <div className="space-y-2">
            <Label>当前价值 (元)</Label>
            <Input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
