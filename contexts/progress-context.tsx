'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './auth-context'

export interface UserProgress {
  userId: string
  totalExercises: number
  completedExercises: number
  totalQuizzes: number
  completedQuizzes: number
  correctAnswers: number
  totalAnswers: number
  currentStreak: number
  longestStreak: number
  lastActivityDate: string
  practiceHistory: PracticeRecord[]
}

export interface PracticeRecord {
  id: string
  type: 'exercise' | 'quiz'
  questionType: string
  correct: boolean
  earnedPoints: number
  timestamp: string
}

interface ProgressContextType {
  progress: UserProgress | null
  recordPractice: (record: Omit<PracticeRecord, 'id' | 'timestamp'>) => void
  updateProgress: (updates: Partial<UserProgress>) => void
  getAccuracy: () => number
  getTotalPoints: () => number
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

function createEmptyProgress(userId: string): UserProgress {
  return {
    userId,
    totalExercises: 0,
    completedExercises: 0,
    totalQuizzes: 0,
    completedQuizzes: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: new Date().toISOString(),
    practiceHistory: [],
  }
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [progress, setProgress] = useState<UserProgress | null>(null)

  useEffect(() => {
    if (!user) {
      setProgress(null)
      return
    }

    const stored = localStorage.getItem(`userProgress_${user.id}`)
    if (stored) {
      try {
        setProgress(JSON.parse(stored))
      } catch (e) {
        const newProgress = createEmptyProgress(user.id)
        setProgress(newProgress)
        localStorage.setItem(`userProgress_${user.id}`, JSON.stringify(newProgress))
      }
    } else {
      const newProgress = createEmptyProgress(user.id)
      setProgress(newProgress)
      localStorage.setItem(`userProgress_${user.id}`, JSON.stringify(newProgress))
    }
  }, [user])

  const recordPractice = (record: Omit<PracticeRecord, 'id' | 'timestamp'>) => {
    if (!progress || !user) return

    const newRecord: PracticeRecord = {
      ...record,
      id: `record_${Date.now()}`,
      timestamp: new Date().toISOString(),
    }

    const updated: UserProgress = {
      ...progress,
      totalAnswers: progress.totalAnswers + 1,
      correctAnswers: record.correct ? progress.correctAnswers + 1 : progress.correctAnswers,
      completedExercises:
        record.type === 'exercise'
          ? progress.completedExercises + 1
          : progress.completedExercises,
      completedQuizzes:
        record.type === 'quiz' ? progress.completedQuizzes + 1 : progress.completedQuizzes,
      practiceHistory: [...progress.practiceHistory, newRecord],
      lastActivityDate: new Date().toISOString(),
    }

    setProgress(updated)
    localStorage.setItem(`userProgress_${user.id}`, JSON.stringify(updated))
  }

  const updateProgress = (updates: Partial<UserProgress>) => {
    if (!progress || !user) return

    const updated = { ...progress, ...updates }
    setProgress(updated)
    localStorage.setItem(`userProgress_${user.id}`, JSON.stringify(updated))
  }

  const getAccuracy = () => {
    if (!progress || progress.totalAnswers === 0) return 0
    return (progress.correctAnswers / progress.totalAnswers) * 100
  }

  const getTotalPoints = () => {
    if (!progress) return 0
    return progress.practiceHistory.reduce((sum, record) => sum + record.earnedPoints, 0)
  }

  return (
    <ProgressContext.Provider
      value={{
        progress,
        recordPractice,
        updateProgress,
        getAccuracy,
        getTotalPoints,
      }}
    >
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const context = useContext(ProgressContext)
  if (!context) {
    throw new Error('useProgress must be used within ProgressProvider')
  }
  return context
}
