'use client'

import { useAuth } from '@/contexts/auth-context'
import { useProgress } from '@/contexts/progress-context'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, BookOpen, Flame, TrendingUp, Trophy } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const { progress, getTotalPoints, getAccuracy } = useProgress()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!progress) {
      const newProgress = {
        userId: user?.id || '',
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
      localStorage.setItem('userProgress', JSON.stringify(newProgress))
    }
    setIsInitialized(true)
  }, [progress, user?.id])

  if (!isInitialized) return null

  const stats = [
    {
      label: 'Total Points',
      value: getTotalPoints(),
      icon: Trophy,
      color: 'text-primary',
    },
    {
      label: 'Accuracy',
      value: `${Math.round(getAccuracy())}%`,
      icon: TrendingUp,
      color: 'text-secondary',
    },
    {
      label: 'Current Streak',
      value: progress?.currentStreak || 0,
      icon: Flame,
      color: 'text-accent',
    },
    {
      label: 'Completed',
      value: (progress?.completedExercises || 0) + (progress?.completedQuizzes || 0),
      icon: BarChart3,
      color: 'text-primary',
    },
  ]

  const quickActions = [
    {
      title: 'Practice Studio',
      description: 'Generate grammar, vocabulary, and mock test sessions',
      href: '/dashboard/practice',
      icon: BookOpen,
    },
    {
      title: 'Mock Tests',
      description: 'Continue exam-style sessions with AI-generated questions',
      href: '/dashboard/quizzes',
      icon: Trophy,
    },
    {
      title: 'View Progress',
      description: 'Track your learning journey and statistics',
      href: '/dashboard/progress',
      icon: BarChart3,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
        <p className="text-muted-foreground">
          You&apos;re on {user?.level} level. Keep up the great work!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">What&apos;s Next?</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-lg border border-border bg-card p-6 hover:border-primary transition-colors cursor-pointer"
              >
                <Icon className="h-10 w-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-2">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        {progress && progress.practiceHistory.length > 0 ? (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Question Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Result</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {progress.practiceHistory.slice(-5).reverse().map((record) => (
                    <tr key={record.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-3 text-sm capitalize">{record.type}</td>
                      <td className="px-6 py-3 text-sm">{record.questionType}</td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            record.correct
                              ? 'bg-green-100/20 text-green-700 dark:text-green-400'
                              : 'bg-red-100/20 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {record.correct ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold">+{record.earnedPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">No activity yet. Start practicing!</p>
            <Link
              href="/dashboard/practice"
              className="inline-block rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium hover:opacity-90 transition-opacity"
            >
              Start Practicing
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
