import { GoogleGenerativeAI } from "@google/generative-ai";

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

// Helper function to delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateExercises(
  request: ExerciseRequest
): Promise<Exercise[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }

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

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Retry logic for rate limiting
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(
        `${prompt}\n\nIMPORTANT: Return ONLY the JSON array, no other text or markdown formatting.`
      );
      const response = result.response.text();

      if (!response || response.trim() === "") {
        throw new Error("AI returned empty response");
      }

      // Clean up the response - remove markdown code blocks if present
      let cleanedResponse = response.trim();
      cleanedResponse = cleanedResponse.replace(/^```json?\s*/i, "");
      cleanedResponse = cleanedResponse.replace(/```\s*$/i, "");
      cleanedResponse = cleanedResponse.trim();

      // Extract JSON from response
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Failed to parse generated exercises from AI response");
      }

      const exercises: Exercise[] = JSON.parse(jsonMatch[0]);
      return exercises;
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a rate limit error
      if (lastError.message?.includes("429") || lastError.message?.includes("rate limit") || lastError.message?.includes("quota")) {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 5000; // 5s, 10s, 20s
        console.log(`Rate limited, waiting ${waitTime/1000}s before retry ${attempt + 1}/${maxRetries}`);
        await delay(waitTime);
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }

  throw lastError || new Error("Failed to generate exercises after retries");
}
