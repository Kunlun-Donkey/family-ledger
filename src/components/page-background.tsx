'use client'

import { useEffect } from 'react'
import { useBackgroundStore, type BackgroundSettings } from '@/store/background-store'

interface Props {
  page: keyof BackgroundSettings
  children: React.ReactNode
}

export function PageBackground({ page, children }: Props) {
  const { getBackground, loadFromStorage } = useBackgroundStore()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  const bgUrl = getBackground(page)

  return (
    <div className="relative min-h-screen">
      {bgUrl && (
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgUrl})` }}
        >
          <div className="absolute inset-0 bg-background/60 dark:bg-background/80 backdrop-blur-[2px]" />
        </div>
      )}
      {children}
    </div>
  )
}
