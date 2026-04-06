'use client'

import { QuizQuestion } from '@/lib/mock-data'
import { useState } from 'react'
import { Check, X } from 'lucide-react'

interface QuestionComponentProps {
  question: QuizQuestion
  onAnswer: (correct: boolean, answer: string) => void
  disabled?: boolean
}

export function MultipleChoiceQuestion({
  question,
  onAnswer,
  disabled,
}: QuestionComponentProps) {
  const [answered, setAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [isCorrect, setIsCorrect] = useState(false)

  const handleSelect = (option: string) => {
    if (disabled || answered) return

    const correct = option === question.correctAnswer
    setSelectedAnswer(option)
    setIsCorrect(correct)
    setAnswered(true)
    onAnswer(correct, option)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {question.options?.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(option)}
            disabled={disabled || answered}
            className={`p-4 text-left rounded-lg border-2 transition-all ${
              answered && selectedAnswer === option
                ? isCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-950'
                  : 'border-red-500 bg-red-50 dark:bg-red-950'
                : answered && option === question.correctAnswer
                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                : 'border-border hover:border-primary cursor-pointer'
            } ${disabled || answered ? 'cursor-default' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{option}</span>
              {answered && selectedAnswer === option && (
                <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                  {isCorrect ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                </span>
              )}
              {answered && option === question.correctAnswer && selectedAnswer !== option && (
                <Check className="h-5 w-5 text-green-600" />
              )}
            </div>
          </button>
        ))}
      </div>

      {answered && (
        <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-950' : 'bg-blue-50 dark:bg-blue-950'}`}>
          <p className={`font-semibold mb-2 ${isCorrect ? 'text-green-900 dark:text-green-100' : 'text-blue-900 dark:text-blue-100'}`}>
            {isCorrect ? 'Correct!' : 'Explanation'}
          </p>
          <p className={isCorrect ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}>
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  )
}

export function FillInBlankQuestion({
  question,
  onAnswer,
  disabled,
}: QuestionComponentProps) {
  const [answer, setAnswer] = useState('')
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleSubmit = () => {
    if (disabled || answered || !answer.trim()) return

    const correct = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
    setIsCorrect(correct)
    setAnswered(true)
    onAnswer(correct, answer)
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted/30 p-4 rounded-lg">
        <p className="text-lg mb-4 leading-relaxed">
          {question.question.split('_').map((part, i) => (
            <span key={i}>
              {i > 0 && (
                <span className="inline-block mx-1 min-w-24 border-b-2 border-foreground"></span>
              )}
              {part}
            </span>
          ))}
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !answered && handleSubmit()}
          disabled={disabled || answered}
          placeholder="Type your answer here..."
          className="flex-1 rounded-lg border border-input bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || answered || !answer.trim()}
          className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          Submit
        </button>
      </div>

      {answered && (
        <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
          <p className={`font-semibold mb-2 ${isCorrect ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
            {isCorrect ? 'Correct!' : `Incorrect. The answer was: "${question.correctAnswer}"`}
          </p>
          <p className={isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  )
}

export function MatchingQuestion({
  question,
  onAnswer,
  disabled,
}: QuestionComponentProps) {
  const pairs = question.correctAnswer.split(',').map((pair) => {
    const [left, right] = pair.trim().split('|')
    return { left: left.trim(), right: right.trim() }
  })

  const [matches, setMatches] = useState<{ [key: string]: string }>({})
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const rightSide = [...pairs.map((p) => p.right)].sort(() => Math.random() - 0.5)

  const handleMatch = (left: string, right: string) => {
    if (disabled || answered) return
    setMatches((prev) => ({
      ...prev,
      [left]: prev[left] === right ? '' : right,
    }))
  }

  const handleSubmit = () => {
    if (disabled || answered || Object.keys(matches).length !== pairs.length) return

    const correct = pairs.every((p) => matches[p.left] === p.right)
    setIsCorrect(correct)
    setAnswered(true)
    onAnswer(correct, JSON.stringify(matches))
  }

  const allMatched = Object.keys(matches).length === pairs.length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          {pairs.map((pair) => (
            <div
              key={pair.left}
              className="p-3 rounded-lg bg-muted/30 border border-border text-sm font-medium"
            >
              {pair.left}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {rightSide.map((right) => {
            const matched = Object.values(matches).includes(right)
            return (
              <button
                key={right}
                onClick={() => {
                  const left = Object.keys(matches).find((k) => matches[k] === right)
                  if (left) {
                    handleMatch(left, right)
                  } else {
                    const unmatchedLeft = pairs.find(
                      (p) => !Object.keys(matches).includes(p.left) || !matches[p.left]
                    )?.left
                    if (unmatchedLeft) {
                      handleMatch(unmatchedLeft, right)
                    }
                  }
                }}
                disabled={disabled || answered}
                className={`w-full p-3 rounded-lg border text-sm font-medium text-left transition-all ${
                  matched
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-muted/30 hover:border-primary cursor-pointer'
                } ${disabled || answered ? 'cursor-default' : ''}`}
              >
                {right}
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || answered || !allMatched}
        className="w-full rounded-lg bg-primary text-primary-foreground py-2 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {answered ? 'Next' : 'Submit Matches'}
      </button>

      {answered && (
        <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
          <p className={`font-semibold mb-2 ${isCorrect ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
            {isCorrect ? 'All matches correct!' : 'Some matches were incorrect'}
          </p>
          <p className={isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  )
}

export function ListeningQuestion({
  question,
  onAnswer,
  disabled,
}: QuestionComponentProps) {
  const [answered, setAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [isCorrect, setIsCorrect] = useState(false)

  const handleAnswer = (answer: string) => {
    if (disabled || answered) return

    const correct = answer === question.correctAnswer
    setSelectedAnswer(answer)
    setIsCorrect(correct)
    setAnswered(true)
    onAnswer(correct, answer)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/30 p-6 text-center border border-border">
        <p className="text-sm text-muted-foreground mb-3">Listening Exercise</p>
        <button disabled className="px-6 py-3 rounded-lg bg-primary/20 text-primary font-medium cursor-default">
          🔊 Play Audio
        </button>
        <p className="text-xs text-muted-foreground mt-3">
          (Audio simulation: &quot;{question.question}&quot;)
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-medium text-sm">What did you hear?</p>
        <div className="grid gap-2">
          {['Option A', 'Option B', 'Option C', 'Option D'].map((_, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(question.correctAnswer)}
              disabled={disabled || answered}
              className={`p-3 text-left rounded-lg border-2 transition-all ${
                answered
                  ? index === 0
                    ? isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-950'
                      : 'border-red-500 bg-red-50 dark:bg-red-950'
                    : 'border-border'
                  : 'border-border hover:border-primary cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {['The speaker talks about habits', 'The speaker talks about preferences', 'The speaker talks about experiences', 'The speaker talks about abilities'][index]}
                </span>
                {answered && index === 0 && (
                  <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                    {isCorrect ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {answered && (
        <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-950' : 'bg-blue-50 dark:bg-blue-950'}`}>
          <p className={`font-semibold mb-2 ${isCorrect ? 'text-green-900 dark:text-green-100' : 'text-blue-900 dark:text-blue-100'}`}>
            {isCorrect ? 'Correct!' : 'Explanation'}
          </p>
          <p className={isCorrect ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}>
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  )
}
