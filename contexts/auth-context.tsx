'use client'

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

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

  useEffect(() => {
    let isMounted = true

    const mapUser = (
      authUser: {
        id: string
        email?: string | null
        created_at?: string | null
        user_metadata?: { name?: string } | null
      },
      profileData?: {
        id: string
        email: string
        name: string | null
        level: 'beginner' | 'intermediate' | 'advanced' | null
        created_at: string
      } | null,
    ): User => {
      if (profileData) {
        return {
          id: profileData.id,
          email: profileData.email,
          name: profileData.name || authUser.email?.split('@')[0] || 'User',
          level: profileData.level || 'beginner',
          joinedAt: profileData.created_at,
        }
      }

      return {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        level: 'beginner',
        joinedAt: authUser.created_at || new Date().toISOString(),
      }
    }

    const hydrateUser = async (
      authUser: {
        id: string
        email?: string | null
        created_at?: string | null
        user_metadata?: { name?: string } | null
      },
    ) => {
      try {
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle()

        if (isMounted) {
          setUser(mapUser(authUser, profileData))
        }
      } catch (error) {
        console.error('Profile hydration failed, falling back to auth user:', error)
        if (isMounted) {
          setUser(mapUser(authUser, null))
        }
      }
    }

    const hydrateUserFromServerCookie = async (): Promise<boolean> => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })

        if (!response.ok) {
          return false
        }

        const payload = (await response.json()) as {
          user: User | null
        }

        if (isMounted) {
          setUser(payload.user || null)
        }

        return !!payload.user
      } catch (error) {
        console.error('Server-cookie auth fallback failed:', error)
        return false
      }
    }

    // Check for existing session
    const checkAuth = async () => {
      const loadingTimeout = window.setTimeout(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      }, 8000)

      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (authUser) {
          await hydrateUser(authUser)
        } else {
          const restoredFromCookie = await hydrateUserFromServerCookie()
          if (!restoredFromCookie && isMounted) {
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        const restoredFromCookie = await hydrateUserFromServerCookie()
        if (!restoredFromCookie && isMounted) {
          setUser(null)
        }
      } finally {
        window.clearTimeout(loadingTimeout)
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
      try {
        if (session?.user) {
          await hydrateUser(session.user)
        } else if (isMounted) {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth state update failed:', error)
        if (isMounted) {
          setUser(
            session?.user
              ? mapUser(session.user, null)
              : null,
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        try {
          const fallbackName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User'

          await supabase.from('users').upsert(
            {
              id: data.user.id,
              email: data.user.email || email,
              name: fallbackName,
              level: 'beginner',
            },
            { onConflict: 'id' },
          )
        } catch (profileError) {
          console.error('Profile upsert failed after login:', profileError)
        }

        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle()

        setUser({
          id: data.user.id,
          email: data.user.email || email,
          name: profileData?.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          level: profileData?.level || 'beginner',
          joinedAt: profileData?.created_at || data.user.created_at || new Date().toISOString(),
        })
      }
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
