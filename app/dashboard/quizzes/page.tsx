'use client'

import { LearningSession } from '@/lib/learning-types'
import { Clock3, TestTubeDiagonal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function QuizzesPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<LearningSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await fetch('/api/exercises/fetch?mode=mock_test&limit=20')
        if (!response.ok) return
        const payload = (await response.json()) as { sessions: LearningSession[] }
        setSessions(payload.sessions || [])
      } finally {
        setIsLoading(false)
      }
    }

    loadSessions()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Mock Tests</h1>
        <p className="text-muted-foreground">
          Continue your previous test sessions or start a new one in Practice Studio.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <button
          onClick={() => router.push('/dashboard/practice?mode=mock_test')}
          className="rounded-lg bg-primary px-5 py-2.5 text-primary-foreground font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
        >
          <TestTubeDiagonal className="h-4 w-4" />
          Start New Mock Test
        </button>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-4">
          {isLoading ? 'Loading sessions...' : `Found ${sessions.length} mock test sessions`}
        </p>

        {sessions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() =>
                  router.push(`/dashboard/practice?mode=mock_test&session=${session.id}`)
                }
                className="rounded-lg border border-border bg-card p-6 text-left hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <TestTubeDiagonal className="h-6 w-6 text-primary" />
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">{session.level}</span>
                </div>
                <h3 className="font-semibold mb-1 line-clamp-2">
                  {session.title || 'Mock Test Session'}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{session.topic}</p>
                <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>{new Date(session.updatedAt).toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          !isLoading && (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <p className="text-muted-foreground mb-4">
                No mock tests yet. Start your first test session.
              </p>
              <button
                onClick={() => router.push('/dashboard/practice?mode=mock_test')}
                className="text-primary hover:underline font-medium"
              >
                Go to Practice Studio
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
