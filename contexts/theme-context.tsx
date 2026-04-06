'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
      setThemeState(stored)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setResolvedTheme(prefersDark ? 'dark' : 'light')
      setThemeState('system')
    }
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const root = document.documentElement
    let effectiveTheme: 'light' | 'dark' = 'light'

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      effectiveTheme = prefersDark ? 'dark' : 'light'
    } else {
      effectiveTheme = theme
    }

    if (effectiveTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    setResolvedTheme(effectiveTheme)
  }, [theme, isMounted])

  const handleSetTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const value: ThemeContextType = {
    theme,
    setTheme: handleSetTheme,
    resolvedTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    return {
      theme: 'system',
      setTheme: () => {},
      resolvedTheme: 'light',
    }
  }
  return context
}
