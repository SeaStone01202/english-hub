export type LearningMode = "grammar" | "vocabulary" | "mock_test";
export type LearningLevel = "beginner" | "intermediate" | "advanced";

export type SessionQuestionType =
  | "multiple_choice"
  | "fill_blank"
  | "matching";

export interface SessionQuestionOption {
  optionText: string;
  optionOrder: number;
  isCorrect: boolean;
}

export interface SessionQuestion {
  id: string;
  sessionId: string;
  generationId: string | null;
  orderIndex: number;
  questionType: SessionQuestionType;
  questionText: string;
  correctAnswer: string;
  explanation: string;
  metadata: {
    instruction?: string;
    acceptableAnswers?: string[];
    pairs?: Array<{ left: string; right: string }>;
  };
  options: SessionQuestionOption[];
}

export interface VocabularyItem {
  id: string;
  sessionId: string;
  generationId: string | null;
  orderIndex: number;
  topic: string;
  word: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  meaningVi: string;
  meaningEn: string | null;
  exampleSentence: string;
  exampleTranslation: string;
  audioUrl: string | null;
}

export interface LearningSession {
  id: string;
  userId: string;
  mode: LearningMode;
  level: LearningLevel;
  topic: string;
  title: string | null;
  status: "active" | "completed" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface GenerateRequest {
  mode: LearningMode;
  level: LearningLevel;
  topic?: string;
  sessionId?: string;
  quantity?: number;
}

export interface GenerateResponse {
  session: LearningSession;
  generationId: string;
  model: string;
  questions: SessionQuestion[];
  vocabulary: VocabularyItem[];
}
