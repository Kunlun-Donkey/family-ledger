'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import { useBackgroundStore, type BackgroundSettings } from '@/store/background-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, TrendingUp, TrendingDown, Wallet, Building2,
  Settings, LogOut, Menu, X, Moon, Sun, Users, Download
} from 'lucide-react'
import { useTheme } from 'next-themes'

const navItems = [
  { href: '/', label: '首页', icon: LayoutDashboard },
  { href: '/income', label: '收入', icon: TrendingUp },
  { href: '/expense', label: '支出', icon: TrendingDown },
  { href: '/assets', label: '资产', icon: Wallet },
  { href: '/loans', label: '贷款', icon: Building2 },
  { href: '/export', label: '导出', icon: Download },
  { href: '/settings', label: '设置', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, family, loading, fetchMe, logout } = useAuthStore()
  const { getBackground, loadFromStorage } = useBackgroundStore()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetchMe()
    loadFromStorage()
  }, [fetchMe, loadFromStorage])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  // Determine current page for background
  const pageMap: Record<string, keyof BackgroundSettings> = {
    '/': 'dashboard',
    '/income': 'income',
    '/expense': 'expense',
    '/assets': 'assets',
    '/loans': 'loans',
    '/settings': 'settings',
  }
  const currentPage = pageMap[pathname] || 'dashboard'
  const bgUrl = getBackground(currentPage)

  return (
    <div className="min-h-screen flex relative">
      {/* Page background */}
      {bgUrl && (
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgUrl})` }}
        >
          <div className="absolute inset-0 bg-background/60 dark:bg-background/80 backdrop-blur-[1px]" />
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[240px] bg-card border-r border-border transform transition-transform duration-300 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-5 border-b border-[var(--divider)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[12px] bg-primary flex items-center justify-center shadow-sm">
                <Wallet className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-title leading-tight">资产管理</h1>
                {family && (
                  <p className="text-[12px] text-subtitle leading-tight mt-0.5">{family.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-[12px] text-[15px] font-medium transition-all duration-200',
                    isActive
                      ? 'bg-accent text-primary shadow-sm'
                      : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className={cn('h-[18px] w-[18px]', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="px-3 py-4 border-t border-[var(--divider)] space-y-1">
            <div className="flex items-center justify-between px-4">
              <span className="text-[13px] text-subtitle font-medium">{user.nickname}</span>
              <button
                className="p-1.5 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
            <button
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 bg-[linear-gradient(180deg,#F5F3EF_0%,#F8F7F4_100%)] dark:bg-[linear-gradient(180deg,#1A1A1A_0%,#1E1E1E_100%)]">
        {/* Top navbar (mobile) */}
        <header className="lg:hidden sticky top-0 z-30 h-16 flex items-center gap-3 border-b border-border bg-[rgba(245,243,239,0.8)] dark:bg-[rgba(26,26,26,0.85)] backdrop-blur-[16px] px-5">
          <button className="p-2 rounded-[10px] hover:bg-muted transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-[15px] font-semibold text-title">家庭资产管理</h1>
        </header>

        <div className="px-6 py-8 lg:px-10 lg:py-10 max-w-[1200px] mx-auto">
          {!family ? <FamilySetup /> : children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(36,36,36,0.9)] backdrop-blur-[16px] border-t border-border flex h-16">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5 mb-1', isActive && 'text-primary')} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function FamilySetup() {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { fetchMe } = useAuthStore()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        await fetchMe()
      } else {
        const data = await res.json()
        setError(data.error)
      }
    } catch { setError('网络错误') }
    finally { setLoading(false) }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/family', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code }),
      })
      if (res.ok) {
        await fetchMe()
      } else {
        const data = await res.json()
        setError(data.error)
      }
    } catch { setError('网络错误') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <h2 className="text-xl font-bold mb-4 text-center">设置家庭</h2>
      <div className="flex gap-2 mb-4">
        <Button
          variant={mode === 'create' ? 'default' : 'outline'}
          onClick={() => setMode('create')}
          className="flex-1"
        >
          创建家庭
        </Button>
        <Button
          variant={mode === 'join' ? 'default' : 'outline'}
          onClick={() => setMode('join')}
          className="flex-1"
        >
          加入家庭
        </Button>
      </div>

      {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm mb-4">{error}</div>}

      {mode === 'create' ? (
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="familyName">家庭名称</Label>
            <Input id="familyName" value={name} onChange={e => setName(e.target.value)} placeholder="例如：温馨小家" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '创建中...' : '创建'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">邀请码</Label>
            <Input id="inviteCode" value={code} onChange={e => setCode(e.target.value)} placeholder="输入6位邀请码" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '加入中...' : '加入'}
          </Button>
        </form>
      )}
    </div>
  )
}
