// Using Google Generative AI SDK
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use server-side only environment variable for security
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }
  return new GoogleGenerativeAI(apiKey);
};

interface ExerciseRequest {
  type: "multiple-choice" | "fill-blank" | "matching" | "listening";
  level: "beginner" | "intermediate" | "advanced";
  topic?: string;
  quantity?: number;
}

interface MultipleChoiceExercise {
  type: "multiple-choice";
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface FillBlankExercise {
  type: "fill-blank";
  sentence: string;
  blanks: string[];
  answers: string[];
  explanation: string;
}

interface MatchingExercise {
  type: "matching";
  pairs: Array<{ term: string; definition: string }>;
  explanation: string;
}

interface ListeningExercise {
  type: "listening";
  script: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
  explanation: string;
}

export type Exercise =
  | MultipleChoiceExercise
  | FillBlankExercise
  | MatchingExercise
  | ListeningExercise;

export async function generateExercises(
  request: ExerciseRequest
): Promise<Exercise[]> {
  const { type, level, topic, quantity = 3 } = request;

  const prompts = {
    "multiple-choice": `Generate ${quantity} multiple-choice English exercises at ${level} level${topic ? ` about ${topic}` : ""}. 
    For each exercise, provide:
    - A clear question
    - 4 options (A, B, C, D)
    - The correct answer (0-3 index)
    - A brief explanation
    
    Return as JSON array with structure: [{"type":"multiple-choice","question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"..."}]`,

    "fill-blank": `Generate ${quantity} fill-in-the-blank English exercises at ${level} level${topic ? ` about ${topic}` : ""}.
    Each exercise should have 1-3 blanks in a sentence.
    For each exercise, provide:
    - A sentence with blanks marked as [BLANK]
    - An array of the correct answers for each blank
    - A brief explanation
    
    Return as JSON array with structure: [{"type":"fill-blank","sentence":"The [BLANK] cat sat on the [BLANK]...","blanks":["adjective","noun"],"answers":["fluffy","mat"],"explanation":"..."}]`,

    matching: `Generate ${quantity} matching exercises at ${level} level${topic ? ` about ${topic}` : ""}.
    Each exercise should have 5-8 matching pairs.
    For each exercise, provide:
    - Pairs of terms and their definitions
    - A brief explanation
    
    Return as JSON array with structure: [{"type":"matching","pairs":[{"term":"...","definition":"..."}],"explanation":"..."}]`,

    listening: `Generate ${quantity} listening comprehension exercises at ${level} level${topic ? ` about ${topic}` : ""}.
    For each exercise, provide:
    - A short dialogue or script (2-3 paragraphs)
    - 2-3 comprehension questions with 4 options each
    - The correct answers
    - A brief explanation
    
    Return as JSON array with structure: [{"type":"listening","script":"...","questions":[{"question":"...","options":["A","B","C","D"],"correctAnswer":0}],"explanation":"..."}]`,
  };

  const prompt = prompts[type];

  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  // Extract JSON from response
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse generated exercises from Gemini response");
  }

  const exercises: Exercise[] = JSON.parse(jsonMatch[0]);
  return exercises;
}
