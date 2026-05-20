import { create } from 'zustand'

interface User {
  id: string
  email: string
  nickname: string
}

interface Family {
  id: string
  name: string
  inviteCode: string
}

interface AuthState {
  user: User | null
  family: Family | null
  role: string | null
  loading: boolean
  setUser: (user: User | null) => void
  setFamily: (family: Family | null) => void
  setRole: (role: string | null) => void
  setLoading: (loading: boolean) => void
  fetchMe: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  family: null,
  role: null,
  loading: true,
  setUser: (user) => set({ user }),
  setFamily: (family) => set({ family }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ loading }),
  fetchMe: async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        set({ user: data.user, family: data.family, role: data.role, loading: false })
      } else {
        set({ user: null, family: null, role: null, loading: false })
      }
    } catch {
      set({ user: null, family: null, role: null, loading: false })
    }
  },
  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    set({ user: null, family: null, role: null })
  },
}))
