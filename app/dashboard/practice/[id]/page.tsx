'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getExerciseById } from '@/lib/mock-data'
import { useProgress } from '@/contexts/progress-context'
import { ArrowLeft, CheckCircle2, BookOpen } from 'lucide-react'

export default function ExerciseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { recordPractice } = useProgress()
  const [completed, setCompleted] = useState(false)

  const exercise = getExerciseById(params.id as string)

  if (!exercise) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Exercise not found</p>
        <button
          onClick={() => router.back()}
          className="text-primary hover:underline font-medium"
        >
          Go back
        </button>
      </div>
    )
  }

  const handleComplete = () => {
    recordPractice({
      type: 'exercise',
      questionType: exercise.category,
      correct: true,
      earnedPoints: 25,
    })
    setCompleted(true)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-primary hover:underline font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Exercises
      </button>

      {!completed ? (
        <>
          {/* Exercise Card */}
          <div className="rounded-lg border border-border bg-card p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">{exercise.category}</span>
                </div>
                <h1 className="text-3xl font-bold">{exercise.title}</h1>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                exercise.level === 'beginner'
                  ? 'bg-green-100/20 text-green-700 dark:text-green-400'
                  : exercise.level === 'intermediate'
                  ? 'bg-yellow-100/20 text-yellow-700 dark:text-yellow-400'
                  : 'bg-red-100/20 text-red-700 dark:text-red-400'
              }`}>
                {exercise.level}
              </span>
            </div>

            <p className="text-muted-foreground mb-6">{exercise.description}</p>

            {/* Content */}
            <div className="bg-muted/30 rounded-lg p-6 mb-6 border border-border">
              <h3 className="font-semibold mb-3">Lesson Content:</h3>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {exercise.content}
              </p>
            </div>

            {/* Complete Button */}
            <button
              onClick={handleComplete}
              className="w-full rounded-lg bg-primary text-primary-foreground py-3 font-semibold hover:opacity-90 transition-opacity"
            >
              Mark as Complete
            </button>
          </div>

          {/* Info Box */}
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            After completing this exercise, you&apos;ll earn 25 points towards your progress.
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
            Congratulations!
          </h2>
          <p className="text-green-700 dark:text-green-300 mb-6">
            You&apos;ve successfully completed this exercise and earned 25 points!
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="rounded-lg border border-green-600 text-green-600 dark:text-green-400 px-6 py-2 font-medium hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
            >
              Back to Exercises
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-lg bg-green-600 text-white px-6 py-2 font-medium hover:opacity-90 transition-opacity"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
