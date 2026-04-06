'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Zap } from 'lucide-react'

type ExerciseType = 'multiple-choice' | 'fill-blank' | 'matching' | 'listening'
type Level = 'beginner' | 'intermediate' | 'advanced'

interface ExerciseGeneratorProps {
  onExerciseGenerated?: (exercise: any) => void
}

export function ExerciseGenerator({ onExerciseGenerated }: ExerciseGeneratorProps) {
  const { user } = useAuth()
  const [exerciseType, setExerciseType] = useState<ExerciseType>('multiple-choice')
  const [level, setLevel] = useState<Level>('beginner')
  const [topic, setTopic] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateExercise = async () => {
    if (!user) {
      setError('You must be logged in to generate exercises')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/exercises/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: exerciseType,
          level,
          topic: topic || 'General English',
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate exercise')
      }

      const exercise = await response.json()
      onExerciseGenerated?.(exercise)
      setTopic('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Generate New Exercise
        </CardTitle>
        <CardDescription>
          Use AI to generate a custom exercise tailored to your level
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Exercise Type</label>
            <Select value={exerciseType} onValueChange={(value) => setExerciseType(value as ExerciseType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="fill-blank">Fill in the Blank</SelectItem>
                <SelectItem value="matching">Matching Pairs</SelectItem>
                <SelectItem value="listening">Listening Comprehension</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Level</label>
            <Select value={level} onValueChange={(value) => setLevel(value as Level)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="topic" className="text-sm font-medium">
            Topic (Optional)
          </label>
          <input
            id="topic"
            type="text"
            placeholder="e.g., Business English, Travel, Food"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-100/20 p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <Button
          onClick={handleGenerateExercise}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Generate Exercise
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
