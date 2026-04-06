export interface Exercise {
  id: string
  title: string
  description: string
  level: 'beginner' | 'intermediate' | 'advanced'
  category: string
  content: string
  completed: boolean
}

export interface QuizQuestion {
  id: string
  type: 'multiple-choice' | 'fill-in-blank' | 'matching' | 'listening'
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
  imageUrl?: string
  audioUrl?: string
  points: number
}

export interface Quiz {
  id: string
  title: string
  description: string
  level: 'beginner' | 'intermediate' | 'advanced'
  category: string
  questions: QuizQuestion[]
  timeLimit?: number
  passingScore: number
}

const EXERCISES: Exercise[] = [
  {
    id: 'ex1',
    title: 'Present Simple Tense',
    description: 'Learn how to use present simple tense correctly',
    level: 'beginner',
    category: 'Grammar',
    content:
      'The present simple is used for habitual actions, facts, and general statements. Examples: I go to school. She likes cats. They eat breakfast at 7 AM.',
    completed: false,
  },
  {
    id: 'ex2',
    title: 'Common Phrasal Verbs',
    description: 'Master essential phrasal verbs in English',
    level: 'beginner',
    category: 'Vocabulary',
    content:
      'Phrasal verbs are combinations of words that have a special meaning. Examples: run out (finish), look up (search), put off (postpone), come across (find by chance).',
    completed: false,
  },
  {
    id: 'ex3',
    title: 'Past Continuous Tense',
    description: 'Understand past continuous and its usage',
    level: 'intermediate',
    category: 'Grammar',
    content:
      'Past continuous describes an action that was happening at a specific time in the past. Formation: was/were + verb-ing. Example: I was reading when she called.',
    completed: false,
  },
  {
    id: 'ex4',
    title: 'Collocations in Business English',
    description: 'Learn common business collocations',
    level: 'intermediate',
    category: 'Vocabulary',
    content:
      'Collocations are words that go together naturally. Business examples: make a decision, meet a deadline, take a break, close a deal, sign a contract.',
    completed: false,
  },
  {
    id: 'ex5',
    title: 'Conditionals (If Clauses)',
    description: 'Master all types of conditional sentences',
    level: 'advanced',
    category: 'Grammar',
    content:
      'There are 4 types of conditionals: Zero (If + present, present), First (If + present, will), Second (If + past, would), Third (If + had + past participle, would have).',
    completed: false,
  },
]

const QUIZZES: Quiz[] = [
  {
    id: 'quiz1',
    title: 'Present Tenses Quiz',
    description: 'Test your knowledge on present tenses',
    level: 'beginner',
    category: 'Grammar',
    passingScore: 70,
    timeLimit: 10,
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Which sentence uses the present simple correctly?',
        options: [
          'She is going to school every day.',
          'She goes to school every day.',
          'She go to school every day.',
          'She going to school every day.',
        ],
        correctAnswer: 'She goes to school every day.',
        explanation:
          'The present simple uses the base form of the verb (goes, not go/going). We use it for regular actions and habits.',
        points: 10,
      },
      {
        id: 'q2',
        type: 'fill-in-blank',
        question: 'I ___ coffee every morning.',
        correctAnswer: 'drink',
        explanation: 'The verb "drink" in present simple form without the -s because "I" is first person.',
        points: 10,
      },
      {
        id: 'q3',
        type: 'multiple-choice',
        question: 'What does she do?',
        options: [
          'She is a teacher.',
          'She teaches English.',
          'She is teaching right now.',
          'All of the above are grammatically possible.',
        ],
        correctAnswer: 'All of the above are grammatically possible.',
        explanation: 'Different tenses and structures are appropriate in different contexts.',
        points: 10,
      },
      {
        id: 'q4',
        type: 'matching',
        question: 'Match the subject with the correct verb form:',
        correctAnswer: 'He|plays,They|play,She|eats,We|eat',
        explanation: 'Third person singular (he/she/it) takes -s; other pronouns do not.',
        points: 20,
      },
      {
        id: 'q5',
        type: 'listening',
        question: 'Listen to the sentence and identify the tense: "I work in an office."',
        correctAnswer: 'Present Simple',
        explanation: 'The sentence indicates a habitual action in the present.',
        points: 10,
      },
    ],
  },
  {
    id: 'quiz2',
    title: 'Past Tenses Quiz',
    description: 'Test your knowledge on past tenses',
    level: 'intermediate',
    category: 'Grammar',
    passingScore: 70,
    timeLimit: 15,
    questions: [
      {
        id: 'q6',
        type: 'multiple-choice',
        question: 'Which is correct?',
        options: [
          'I was eating dinner when he was arriving.',
          'I was eating dinner when he arrived.',
          'I ate dinner when he was arriving.',
          'I was ate dinner when he arrived.',
        ],
        correctAnswer: 'I was eating dinner when he arrived.',
        explanation:
          'Use past continuous for the ongoing action (was eating) and simple past for the interrupting action (arrived).',
        points: 10,
      },
      {
        id: 'q7',
        type: 'fill-in-blank',
        question: 'She ___ to Paris five times before she moved there.',
        correctAnswer: 'had been',
        explanation: 'This needs past perfect (had + been/gone) to show something happened before another past action.',
        points: 10,
      },
      {
        id: 'q8',
        type: 'matching',
        question: 'Match the action with the correct tense description:',
        correctAnswer: 'Started and finished|Simple Past,Was happening at a time|Past Continuous,Completed before another action|Past Perfect',
        explanation: 'Each tense describes different aspects of past actions.',
        points: 20,
      },
      {
        id: 'q9',
        type: 'listening',
        question: 'Listen: "They had already left when I called." Which tense is used first?',
        correctAnswer: 'Past Perfect',
        explanation: 'Had left is past perfect; it happened before the simple past action (called).',
        points: 10,
      },
    ],
  },
  {
    id: 'quiz3',
    title: 'Vocabulary - Emotions',
    description: 'Expand your vocabulary with emotion words',
    level: 'beginner',
    category: 'Vocabulary',
    passingScore: 75,
    timeLimit: 8,
    questions: [
      {
        id: 'q10',
        type: 'multiple-choice',
        question: 'Which word means to feel slightly afraid or worried?',
        options: ['Terrified', 'Anxious', 'Furious', 'Delighted'],
        correctAnswer: 'Anxious',
        explanation: 'Anxious means feeling nervous or worried about something.',
        points: 10,
      },
      {
        id: 'q11',
        type: 'fill-in-blank',
        question: 'After she won the lottery, she was absolutely ___.',
        correctAnswer: 'thrilled',
        explanation: 'Thrilled means extremely happy or excited.',
        points: 10,
      },
      {
        id: 'q12',
        type: 'matching',
        question: 'Match emotions with their definitions:',
        correctAnswer: 'Ecstatic|Extremely happy,Melancholy|Sad and thoughtful,Furious|Extremely angry',
        explanation: 'These are common emotion words with specific meanings.',
        points: 20,
      },
    ],
  },
]

export function getExercises(): Exercise[] {
  return EXERCISES
}

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((ex) => ex.id === id)
}

export function getExercisesByLevel(level: 'beginner' | 'intermediate' | 'advanced'): Exercise[] {
  return EXERCISES.filter((ex) => ex.level === level)
}

export function getQuizzes(): Quiz[] {
  return QUIZZES
}

export function getQuizById(id: string): Quiz | undefined {
  return QUIZZES.find((q) => q.id === id)
}

export function getQuizzesByLevel(level: 'beginner' | 'intermediate' | 'advanced'): Quiz[] {
  return QUIZZES.filter((q) => q.level === level)
}

export function getRandomizedQuestions(quiz: Quiz, count?: number): QuizQuestion[] {
  const questions = [...quiz.questions]
  const toReturn = count || questions.length

  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[questions[i], questions[j]] = [questions[j], questions[i]]
  }

  return questions.slice(0, toReturn)
}
