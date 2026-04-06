import { generateText } from "ai";

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

  const result = await generateText({
    model: "google/gemini-2.0-flash",
    prompt: `${prompt}\n\nIMPORTANT: Return ONLY the JSON array, no other text or markdown formatting.`,
  });

  const response = result.text;
  
  console.log("[v0] Raw AI response:", response);

  if (!response || response.trim() === "") {
    throw new Error("AI returned empty response");
  }

  // Clean up the response - remove markdown code blocks if present
  let cleanedResponse = response.trim();
  
  // Remove markdown code block syntax
  cleanedResponse = cleanedResponse.replace(/^```json?\s*/i, "");
  cleanedResponse = cleanedResponse.replace(/```\s*$/i, "");
  cleanedResponse = cleanedResponse.trim();

  // Extract JSON from response
  const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error("[v0] Failed to find JSON array in response:", cleanedResponse);
    throw new Error("Failed to parse generated exercises from AI response");
  }

  try {
    const exercises: Exercise[] = JSON.parse(jsonMatch[0]);
    console.log("[v0] Parsed exercises:", exercises.length);
    return exercises;
  } catch (parseError) {
    console.error("[v0] JSON parse error:", parseError);
    console.error("[v0] Attempted to parse:", jsonMatch[0]);
    throw new Error("Failed to parse JSON from AI response");
  }
}
