import { create } from 'zustand'

export interface BackgroundSettings {
  login: string      // login page background
  dashboard: string  // dashboard page
  income: string     // income page
  expense: string    // expense page
  assets: string     // assets page
  loans: string      // loans page
  settings: string   // settings page
}

const DEFAULT_BG = '/backgrounds/default.svg'

interface BackgroundState {
  backgrounds: BackgroundSettings
  setBackground: (page: keyof BackgroundSettings, url: string) => void
  getBackground: (page: keyof BackgroundSettings) => string
  loadFromStorage: () => void
}

export const useBackgroundStore = create<BackgroundState>((set, get) => ({
  backgrounds: {
    login: DEFAULT_BG,
    dashboard: '',
    income: '',
    expense: '',
    assets: '',
    loans: '',
    settings: '',
  },

  setBackground: (page, url) => {
    set((state) => {
      const newBgs = { ...state.backgrounds, [page]: url }
      if (typeof window !== 'undefined') {
        localStorage.setItem('family-finance-backgrounds', JSON.stringify(newBgs))
      }
      return { backgrounds: newBgs }
    })
  },

  getBackground: (page) => {
    const { backgrounds } = get()
    // If specific page has no background, fall back to login background
    return backgrounds[page] || backgrounds.login || DEFAULT_BG
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('family-finance-backgrounds')
      if (stored) {
        const parsed = JSON.parse(stored)
        set({ backgrounds: { ...get().backgrounds, ...parsed } })
      }
    } catch {
      // ignore
    }
  },
}))
