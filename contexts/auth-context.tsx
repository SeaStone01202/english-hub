'use client'

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  id: string
  email: string
  name: string
  level: 'beginner' | 'intermediate' | 'advanced'
  joinedAt: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
type IpEventType = 'login_success' | 'login_failed' | 'register_success' | 'register_failed' | 'logout'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const trackIpEvent = async (
    eventType: IpEventType,
    metadata?: Record<string, unknown>,
  ) => {
    try {
      await fetch('/api/ip-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          metadata: metadata || {},
        }),
      })
    } catch (error) {
      console.error('Failed to track IP event:', error)
    }
  }

  const mapUser = (authUser: SupabaseUser): User => ({
    id: authUser.id,
    email: authUser.email || '',
    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
    level: 'beginner',
    joinedAt: authUser.created_at || new Date().toISOString(),
  })

  useEffect(() => {
    let isMounted = true

    // Check for existing session
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (isMounted) {
          setUser(session?.user ? mapUser(session.user) : null)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isMounted) {
        setUser(session?.user ? mapUser(session.user) : null)
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [supabase])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      await trackIpEvent('login_success')
    } catch (error) {
      await trackIpEvent('login_failed')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/dashboard`,
          data: {
            name,
          },
        },
      })

      if (error) throw error

      // Note: If email confirmation is required, the user won't have a session yet
      // The profile will be created via database trigger or on first login
      if (data.user && data.session) {
        // User is logged in (email confirmation disabled or already confirmed)
        setUser({
          id: data.user.id,
          email: data.user.email || email,
          name: name,
          level: 'beginner',
          joinedAt: data.user.created_at || new Date().toISOString(),
        })
      }
      await trackIpEvent('register_success')
    } catch (error) {
      await trackIpEvent('register_failed')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await trackIpEvent('logout')
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
