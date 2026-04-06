'use client'

import { useProgress } from '@/contexts/progress-context'
import { useAuth } from '@/contexts/auth-context'
import { Award, Star, Trophy, Flame, Target, Zap, BookOpen, Users } from 'lucide-react'

export default function AchievementsPage() {
  const { progress, getTotalPoints, getAccuracy } = useProgress()
  const { user } = useAuth()

  const achievements = [
    {
      id: 'first-step',
      title: 'First Step',
      description: 'Complete your first exercise',
      icon: BookOpen,
      condition: () => progress && progress.completedExercises > 0,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100/20',
    },
    {
      id: 'quiz-master',
      title: 'Quiz Master',
      description: 'Complete your first quiz',
      icon: Trophy,
      condition: () => progress && progress.completedQuizzes > 0,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100/20',
    },
    {
      id: 'on-fire',
      title: 'On Fire!',
      description: 'Achieve a 5-day streak',
      icon: Flame,
      condition: () => progress && progress.currentStreak >= 5,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100/20',
    },
    {
      id: 'perfect-score',
      title: 'Perfect Score',
      description: 'Get 100% accuracy on a quiz',
      icon: Target,
      condition: () => progress && getAccuracy() === 100,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100/20',
    },
    {
      id: 'hundred-points',
      title: 'Centum',
      description: 'Earn 100 points',
      icon: Zap,
      condition: () => getTotalPoints() >= 100,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100/20',
    },
    {
      id: 'power-learner',
      title: 'Power Learner',
      description: 'Complete 10 activities',
      icon: Star,
      condition: () => progress && progress.practiceHistory.length >= 10,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-100/20',
    },
    {
      id: 'top-performer',
      title: 'Top Performer',
      description: 'Maintain 80% accuracy',
      icon: Award,
      condition: () => getAccuracy() >= 80,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100/20',
    },
    {
      id: 'community-member',
      title: 'Community Member',
      description: 'Join EnglishHub',
      icon: Users,
      condition: () => !!user,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100/20',
    },
  ]

  const unlockedAchievements = achievements.filter((a) => a.condition())
  const lockedAchievements = achievements.filter((a) => !a.condition())

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Achievements</h1>
        <p className="text-muted-foreground">
          Unlock badges and milestones as you progress
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-2">Achievements Unlocked</p>
          <p className="text-3xl font-bold">
            {unlockedAchievements.length}/{achievements.length}
          </p>
          <div className="mt-4 w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{
                width: `${(unlockedAchievements.length / achievements.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Points</p>
          <p className="text-3xl font-bold text-primary">{getTotalPoints()}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-2">Current Accuracy</p>
          <p className="text-3xl font-bold text-secondary">{Math.round(getAccuracy())}%</p>
        </div>
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Unlocked Achievements</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {unlockedAchievements.map((achievement) => {
              const Icon = achievement.icon
              return (
                <div
                  key={achievement.id}
                  className={`rounded-lg border-2 border-green-500 ${achievement.bgColor} p-6 text-center`}
                >
                  <Icon className={`h-12 w-12 mx-auto mb-3 ${achievement.color}`} />
                  <h3 className="font-semibold mb-1">{achievement.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {achievement.description}
                  </p>
                  <div className="mt-3 text-xs font-medium text-green-600 dark:text-green-400">
                    ✓ Unlocked
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Locked Achievements</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lockedAchievements.map((achievement) => {
              const Icon = achievement.icon
              return (
                <div
                  key={achievement.id}
                  className={`rounded-lg border-2 border-muted ${achievement.bgColor} p-6 text-center opacity-50`}
                >
                  <Icon className={`h-12 w-12 mx-auto mb-3 ${achievement.color}`} />
                  <h3 className="font-semibold mb-1">{achievement.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {achievement.description}
                  </p>
                  <div className="mt-3 text-xs font-medium text-muted-foreground">
                    🔒 Locked
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Milestone Information */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-bold mb-4">Milestones</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span>Exercises Completed</span>
            <span className="font-semibold">
              {progress?.completedExercises || 0} / 25
            </span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span>Quizzes Completed</span>
            <span className="font-semibold">
              {progress?.completedQuizzes || 0} / 10
            </span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span>Total Activities</span>
            <span className="font-semibold">
              {progress?.practiceHistory.length || 0} / 50
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Current Streak</span>
            <span className="font-semibold">
              {progress?.currentStreak || 0} days
            </span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-lg border border-border bg-muted/30 p-6">
        <h3 className="font-semibold mb-3">Tips to Unlock More Achievements</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Practice regularly to build your streak</li>
          <li>• Try different question types to master all skills</li>
          <li>• Focus on accuracy to achieve high scores</li>
          <li>• Earn points by completing exercises and quizzes</li>
          <li>• Challenge yourself with higher difficulty levels</li>
        </ul>
      </div>
    </div>
  )
}
