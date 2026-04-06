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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          // Fetch user profile from database
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (profileData) {
            setUser({
              id: profileData.id,
              email: profileData.email,
              name: profileData.name || authUser.email?.split('@')[0] || 'User',
              level: profileData.level || 'beginner',
              joinedAt: profileData.created_at,
            })
          } else {
            // If no profile exists, use auth user data
            setUser({
              id: authUser.id,
              email: authUser.email || '',
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
              level: 'beginner',
              joinedAt: authUser.created_at || new Date().toISOString(),
            })
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileData) {
          setUser({
            id: profileData.id,
            email: profileData.email,
            name: profileData.name,
            level: profileData.level,
            joinedAt: profileData.created_at,
          })
        }
      } else {
        setUser(null)
      }
    })

    return () => {
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

      if (data.session?.user) {
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single()

        if (profileData) {
          setUser({
            id: profileData.id,
            email: profileData.email,
            name: profileData.name,
            level: profileData.level,
            joinedAt: profileData.created_at,
          })
        }
      }
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
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
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
