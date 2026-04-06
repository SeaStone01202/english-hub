'use client'

import { useProgress } from '@/contexts/progress-context'
import { TrendingUp, Flame, Target, Calendar } from 'lucide-react'

export default function ProgressPage() {
  const { progress, getAccuracy, getTotalPoints } = useProgress()

  if (!progress) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading progress data...</p>
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Points',
      value: getTotalPoints(),
      icon: Target,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Accuracy Rate',
      value: `${Math.round(getAccuracy())}%`,
      icon: TrendingUp,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'Current Streak',
      value: progress.currentStreak,
      icon: Flame,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Total Activities',
      value: progress.completedExercises + progress.completedQuizzes,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ]

  const practiceByType = {
    exercises: progress.practiceHistory.filter((p) => p.type === 'exercise').length,
    quizzes: progress.practiceHistory.filter((p) => p.type === 'quiz').length,
  }

  const questionTypeStats = progress.practiceHistory.reduce(
    (acc, record) => {
      if (!acc[record.questionType]) {
        acc[record.questionType] = { correct: 0, total: 0 }
      }
      acc[record.questionType].total++
      if (record.correct) {
        acc[record.questionType].correct++
      }
      return acc
    },
    {} as Record<string, { correct: number; total: number }>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Your Progress</h1>
        <p className="text-muted-foreground">
          Track your learning journey and achievements
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-start justify-between mb-3">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Activity Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Practice Type Distribution */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-bold mb-6">Activity Distribution</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Exercises Completed</span>
                <span className="text-sm font-semibold text-primary">
                  {practiceByType.exercises}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{
                    width: `${
                      progress.practiceHistory.length > 0
                        ? (practiceByType.exercises / progress.practiceHistory.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Quizzes Completed</span>
                <span className="text-sm font-semibold text-secondary">
                  {practiceByType.quizzes}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-secondary h-2 rounded-full"
                  style={{
                    width: `${
                      progress.practiceHistory.length > 0
                        ? (practiceByType.quizzes / progress.practiceHistory.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Accuracy by Question Type */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-bold mb-6">Performance by Question Type</h2>
          <div className="space-y-3">
            {Object.entries(questionTypeStats).map(([type, stats]) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize">
                    {type.replace('-', ' ')}
                  </span>
                  <span className="text-xs font-semibold">
                    {Math.round((stats.correct / stats.total) * 100)}% ({stats.correct}/{stats.total})
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full"
                    style={{ width: `${(stats.correct / stats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-bold mb-6">Recent Activity</h2>

        {progress.practiceHistory.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {progress.practiceHistory
              .slice()
              .reverse()
              .map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">
                      {record.type} - {record.questionType.replace('-', ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(record.timestamp).toLocaleDateString()} at{' '}
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        record.correct
                          ? 'bg-green-100/20 text-green-700 dark:text-green-400'
                          : 'bg-red-100/20 text-red-700 dark:text-red-400'
                      }`}
                    >
                      {record.correct ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                    <span className="text-sm font-semibold">+{record.earnedPoints}</span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No activity yet</p>
            <p className="text-sm text-muted-foreground">
              Start practicing to see your progress here
            </p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Longest Streak</p>
          <p className="text-4xl font-bold text-primary">{progress.longestStreak}</p>
          <p className="text-xs text-muted-foreground mt-2">days</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Total Activities</p>
          <p className="text-4xl font-bold text-secondary">
            {progress.practiceHistory.length}
          </p>
          <p className="text-xs text-muted-foreground mt-2">completed</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Average Accuracy</p>
          <p className="text-4xl font-bold text-accent">{Math.round(getAccuracy())}%</p>
          <p className="text-xs text-muted-foreground mt-2">across all activities</p>
        </div>
      </div>
    </div>
  )
}
