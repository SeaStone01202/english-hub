'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getQuizzes } from '@/lib/mock-data'
import { ExerciseGenerator } from '@/components/exercise-generator'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Trophy, ChevronRight, Filter } from 'lucide-react'

interface Quiz {
  id: string
  title: string
  description: string
  level: 'beginner' | 'intermediate' | 'advanced'
  category: string
  questions: Array<{ id: string; type: string }>
  timeLimit?: number
  passingScore: number
}

export default function QuizzesPage() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all')

  // Fetch quizzes from database and mock data
  useEffect(() => {
    const supabase = createClient()
    const fetchQuizzes = async () => {
      try {
        let data: Quiz[] = []

        // Try to fetch from Supabase if user is logged in
        if (user?.id) {
          const { data: dbSessions, error } = await supabase
            .from('quiz_sessions')
            .select('id, title, description, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (!error && dbSessions) {
            // For each session, fetch questions
            for (const session of dbSessions) {
              const { data: questions } = await supabase
                .from('quiz_questions')
                .select('id, exercise_id')
                .eq('session_id', session.id)

              data.push({
                id: session.id,
                title: session.title,
                description: session.description || 'Quiz from database',
                level: 'intermediate', // Default level
                category: 'Custom',
                questions: questions?.map((q: any) => ({ id: q.id, type: 'mixed' })) || [],
                passingScore: 70,
              })
            }
          }
        }

        // Combine with mock data
        const mockData = getQuizzes()
        setQuizzes([...data, ...mockData])
      } catch (error) {
        console.error('Error fetching quizzes:', error)
        // Fallback to mock data only
        setQuizzes(getQuizzes())
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuizzes()
  }, [user?.id])

  const levels = ['all', 'beginner', 'intermediate', 'advanced'] as const
  const filteredQuizzes = quizzes.filter((quiz) => selectedLevel === 'all' || quiz.level === selectedLevel)

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100/20 text-green-700 dark:text-green-400'
      case 'intermediate':
        return 'bg-yellow-100/20 text-yellow-700 dark:text-yellow-400'
      case 'advanced':
        return 'bg-red-100/20 text-red-700 dark:text-red-400'
      default:
        return ''
    }
  }

  const handleExerciseGenerated = (exercise: any) => {
    // In a real scenario, we would create a quiz session from the exercise
    console.log('Exercise generated for quiz:', exercise)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Quizzes</h1>
        <p className="text-muted-foreground">
          Test your knowledge with comprehensive quizzes featuring multiple question types
        </p>
      </div>

      {/* Exercise Generator for Quizzes */}
      <ExerciseGenerator onExerciseGenerated={handleExerciseGenerated} />

      {/* Filters */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold">Filter by Level</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedLevel === level
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Quizzes Grid */}
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredQuizzes.length} quiz{filteredQuizzes.length !== 1 ? 'zes' : ''}
        </p>

        {filteredQuizzes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredQuizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/dashboard/quizzes/${quiz.id}`}
                className="group rounded-lg border border-border bg-card p-6 hover:border-primary hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">{quiz.category}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(quiz.level)}`}>
                    {quiz.level}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {quiz.description}
                </p>

                <div className="space-y-2 mb-4 text-xs text-muted-foreground">
                  <p>Questions: {quiz.questions.length}</p>
                  {quiz.timeLimit && <p>Time limit: {quiz.timeLimit} min</p>}
                  <p>Pass score: {quiz.passingScore}%</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs font-medium text-muted-foreground">Question types:</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {quiz.questions.slice(0, 3).map((_, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-muted px-2 py-1 rounded capitalize"
                    >
                      {quiz.questions[idx].type.split('-').join(' ')}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground mb-4">No quizzes found with the selected filters.</p>
            <button
              onClick={() => setSelectedLevel('all')}
              className="text-primary hover:underline font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
