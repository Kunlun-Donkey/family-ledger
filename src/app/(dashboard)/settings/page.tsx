'use client'

import { useRef, useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useBackgroundStore, type BackgroundSettings } from '@/store/background-store'
import { PageTitle } from '@/components/ui/page-title'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Upload, X, Image, Pencil, Check } from 'lucide-react'

const PAGE_LABELS: Record<keyof BackgroundSettings, string> = {
  login: '登录页面（全局默认）',
  dashboard: '首页',
  income: '收入页面',
  expense: '支出页面',
  assets: '资产页面',
  loans: '贷款页面',
  settings: '设置页面',
}

export default function SettingsPage() {
  const { user, family, role, fetchMe } = useAuthStore()
  const { backgrounds, setBackground, loadFromStorage } = useBackgroundStore()

  const [editingNickname, setEditingNickname] = useState(false)
  const [nickname, setNickname] = useState('')
  const [editingFamily, setEditingFamily] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    if (user) setNickname(user.nickname)
    if (family) setFamilyName(family.name)
  }, [user, family])

  const copyInviteCode = () => {
    if (family?.inviteCode) {
      navigator.clipboard.writeText(family.inviteCode)
      alert('邀请码已复制到剪贴板')
    }
  }

  const saveNickname = async () => {
    if (!nickname.trim()) return
    setSaving(true)
    await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nickname.trim() }),
    })
    await fetchMe()
    setEditingNickname(false)
    setSaving(false)
  }

  const saveFamilyName = async () => {
    if (!familyName.trim()) return
    setSaving(true)
    await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ familyName: familyName.trim() }),
    })
    await fetchMe()
    setEditingFamily(false)
    setSaving(false)
  }

  return (
    <div className="pb-20 lg:pb-0 max-w-2xl">
      <PageTitle>设置</PageTitle>
      <div className="mt-4 space-y-4">

      <Card>
        <CardHeader>
          <CardTitle className="text-base">个人信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">昵称</span>
            {editingNickname ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  className="w-32 h-8 text-sm"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && saveNickname()}
                />
                <button onClick={saveNickname} disabled={saving} className="p-1 rounded-md hover:bg-muted text-primary">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => { setEditingNickname(false); setNickname(user?.nickname || '') }} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{user?.nickname}</span>
                <button onClick={() => setEditingNickname(true)} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">邮箱</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">角色</span>
            <span>{role === 'owner' ? '家庭创建者' : '家庭成员'}</span>
          </div>
        </CardContent>
      </Card>

      {family && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">家庭信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">家庭名称</span>
              {editingFamily ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={familyName}
                    onChange={e => setFamilyName(e.target.value)}
                    className="w-32 h-8 text-sm"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && saveFamilyName()}
                  />
                  <button onClick={saveFamilyName} disabled={saving} className="p-1 rounded-md hover:bg-muted text-primary">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setEditingFamily(false); setFamilyName(family.name) }} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{family.name}</span>
                  {role === 'owner' && (
                    <button onClick={() => setEditingFamily(true)} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">邀请码</span>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{family.inviteCode}</code>
                <Button size="icon" variant="ghost" onClick={copyInviteCode}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              将邀请码分享给您的配偶，对方注册后使用邀请码加入家庭即可共同管理资产。
            </p>
          </CardContent>
        </Card>
      )}

      {/* Background Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="h-4 w-4" />
            背景图片设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            设置各页面的背景图片。如果单独页面未设置，将使用「登录页面」的背景作为默认背景。
          </p>
          {(Object.keys(PAGE_LABELS) as Array<keyof BackgroundSettings>).map((page) => (
            <BackgroundItem
              key={page}
              page={page}
              label={PAGE_LABELS[page]}
              currentUrl={backgrounds[page]}
              onSet={(url) => setBackground(page, url)}
              onClear={() => setBackground(page, '')}
            />
          ))}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

function BackgroundItem({ page, label, currentUrl, onSet, onClear }: {
  page: string
  label: string
  currentUrl: string
  onSet: (url: string) => void
  onClear: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.url) {
        onSet(data.url)
      } else {
        alert(data.error || '上传失败')
      }
    } catch {
      alert('上传失败')
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
      {/* Preview */}
      <div className="w-16 h-10 rounded border overflow-hidden flex-shrink-0 bg-muted">
        {currentUrl ? (
          <img src={currentUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Image className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        {currentUrl && (
          <p className="text-xs text-muted-foreground truncate">{currentUrl}</p>
        )}
        {!currentUrl && page !== 'login' && (
          <p className="text-xs text-muted-foreground">使用默认背景</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3 w-3 mr-1" />
          上传
        </Button>
        {currentUrl && (
          <Button size="icon" variant="ghost" onClick={onClear}>
            <X className="h-3 w-3 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  )
}
