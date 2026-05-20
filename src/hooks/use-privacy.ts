import { create } from 'zustand'

interface PrivacyState {
  hidden: boolean
  toggle: () => void
}

export const usePrivacy = create<PrivacyState>((set) => ({
  hidden: true,
  toggle: () => set((s) => ({ hidden: !s.hidden })),
}))

export function maskAmount(value: string, hidden: boolean): string {
  if (!hidden) return value
  return '****'
}
