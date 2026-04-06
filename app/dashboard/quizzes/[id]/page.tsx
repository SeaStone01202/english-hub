'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getQuizById, getRandomizedQuestions } from '@/lib/mock-data'
import { useProgress } from '@/contexts/progress-context'
import {
  MultipleChoiceQuestion,
  FillInBlankQuestion,
  MatchingQuestion,
  ListeningQuestion,
} from '@/components/quiz-questions'
import { ArrowLeft, ChevronRight, BarChart3 } from 'lucide-react'

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const { recordPractice } = useProgress()

  const quiz = getQuizById(params.id as string)
  const [questions, setQuestions] = useState(getRandomizedQuestions(quiz || { questions: [] }))
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<
    { questionId: string; correct: boolean; answer: string }[]
  >([])
  const [quizCompleted, setQuizCompleted] = useState(false)

  useEffect(() => {
    if (quiz) {
      setQuestions(getRandomizedQuestions(quiz))
    }
  }, [quiz])

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Quiz not found</p>
        <button
          onClick={() => router.back()}
          className="text-primary hover:underline font-medium"
        >
          Go back
        </button>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  const handleAnswer = (correct: boolean, answer: string) => {
    const points = correct ? currentQuestion.points : 0
    recordPractice({
      type: 'quiz',
      questionType: currentQuestion.type,
      correct,
      earnedPoints: points,
    })

    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        correct,
        answer,
      },
    ])
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      setQuizCompleted(true)
    }
  }

  const correctAnswers = answers.filter((a) => a.correct).length
  const totalPoints = answers.reduce((sum, a, i) => {
    const q = questions.find((q) => q.id === a.questionId)
    return sum + (a.correct && q ? q.points : 0)
  }, 0)

  const accuracy = answers.length > 0 ? (correctAnswers / answers.length) * 100 : 0
  const isPassing = accuracy >= quiz.passingScore

  if (quizCompleted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-lg border border-border bg-card p-8">
          <div className="text-center mb-8">
            <BarChart3 className={`h-16 w-16 mx-auto mb-4 ${isPassing ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
            <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
            <p className={`text-lg font-semibold ${isPassing ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              {isPassing ? 'Congratulations! You passed! 🎉' : `You need ${quiz.passingScore}% to pass`}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold text-primary">{correctAnswers}/{answers.length}</p>
              <p className="text-sm text-muted-foreground">Correct Answers</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold text-secondary">{Math.round(accuracy)}%</p>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold text-accent">{totalPoints}</p>
              <p className="text-sm text-muted-foreground">Points Earned</p>
            </div>
          </div>

          {answers.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold mb-3">Summary:</h3>
              {answers.map((answer, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    answer.correct
                      ? 'bg-green-50 dark:bg-green-950'
                      : 'bg-red-50 dark:bg-red-950'
                  }`}
                >
                  <span className="text-sm">Question {idx + 1}</span>
                  <span className={`text-sm font-medium ${answer.correct ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {answer.correct ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => {
                setCurrentQuestionIndex(0)
                setAnswers([])
                setQuizCompleted(false)
                setQuestions(getRandomizedQuestions(quiz))
              }}
              className="flex-1 rounded-lg border border-border px-4 py-2 font-medium hover:bg-muted transition-colors"
            >
              Retake Quiz
            </button>
            <button
              onClick={() => router.push('/dashboard/quizzes')}
              className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium hover:opacity-90 transition-opacity"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isAnswered = answers.some((a) => a.questionId === currentQuestion.id)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-primary hover:underline font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Quizzes
      </button>

      {/* Quiz Info */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
        <p className="text-muted-foreground mb-4">{quiz.description}</p>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div>Questions: {quiz.questions.length}</div>
          {quiz.timeLimit && <div>Time limit: {quiz.timeLimit} min</div>}
          <div>Pass score: {quiz.passingScore}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-muted-foreground">
            {correctAnswers} correct
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="rounded-lg border border-border bg-card p-8">
        <h2 className="text-xl font-bold mb-2">
          {currentQuestion.question}
        </h2>

        <div className="mt-6">
          {currentQuestion.type === 'multiple-choice' && (
            <MultipleChoiceQuestion
              question={currentQuestion}
              onAnswer={handleAnswer}
              disabled={isAnswered}
            />
          )}
          {currentQuestion.type === 'fill-in-blank' && (
            <FillInBlankQuestion
              question={currentQuestion}
              onAnswer={handleAnswer}
              disabled={isAnswered}
            />
          )}
          {currentQuestion.type === 'matching' && (
            <MatchingQuestion
              question={currentQuestion}
              onAnswer={handleAnswer}
              disabled={isAnswered}
            />
          )}
          {currentQuestion.type === 'listening' && (
            <ListeningQuestion
              question={currentQuestion}
              onAnswer={handleAnswer}
              disabled={isAnswered}
            />
          )}
        </div>

        {isAnswered && (
          <button
            onClick={handleNextQuestion}
            className="w-full mt-6 rounded-lg bg-primary text-primary-foreground py-2 font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
