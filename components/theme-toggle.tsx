'use client'

import { useTheme } from '@/contexts/theme-context'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="h-9 w-9 rounded-lg border border-border" />
  }

  return (
    <button
      onClick={() => {
        const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
      }}
      className="rounded-lg border border-border bg-background p-2 hover:bg-muted transition-colors"
      aria-label="Toggle theme"
      title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-5 w-5 text-amber-500" />
      ) : (
        <Moon className="h-5 w-5 text-slate-600" />
      )}
    </button>
  )
}
