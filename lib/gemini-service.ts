import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  LearningLevel,
  LearningMode,
  SessionQuestionType,
} from "@/lib/learning-types";

interface GenerateLearningPayload {
  mode: LearningMode;
  level: LearningLevel;
  topic: string;
  quantity: number;
}

interface GeneratedGrammarQuestion {
  question_type: SessionQuestionType;
  question: string;
  instruction: string;
  options?: string[];
  correct_answer: string;
  acceptable_answers?: string[];
  explanation: string;
  pairs?: Array<{ left: string; right: string }>;
}

interface GeneratedVocabularyItem {
  word: string;
  phonetic: string;
  part_of_speech: string;
  meaning_vi: string;
  meaning_en: string;
  example_sentence: string;
  example_translation: string;
}

interface GeneratedGrammarResponse {
  title: string;
  description: string;
  items: GeneratedGrammarQuestion[];
}

interface GeneratedVocabularyResponse {
  title: string;
  description: string;
  items: GeneratedVocabularyItem[];
}

const defaultModelCandidates = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

const preferredModelOrder = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
}

function getClient() {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY (or NEXT_PUBLIC_GEMINI_API_KEY) environment variable",
    );
  }

  return new GoogleGenerativeAI(apiKey);
}

function normalizeModelName(name: string) {
  return name.replace(/^models\//, "");
}

function scoreModelName(name: string) {
  const normalized = normalizeModelName(name);
  const preferredIndex = preferredModelOrder.indexOf(normalized);
  if (preferredIndex >= 0) {
    return 1000 - preferredIndex * 10;
  }
  if (normalized.includes("flash")) {
    return 500;
  }
  if (normalized.includes("pro")) {
    return 300;
  }
  return 100;
}

async function listApiModelCandidates() {
  const apiKey = getApiKey();
  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      models?: Array<{
        name?: string;
        supportedGenerationMethods?: string[];
      }>;
    };

    const candidates = (payload.models || [])
      .filter((model) => {
        const name = normalizeModelName(model.name || "");
        if (!name || !name.includes("gemini")) {
          return false;
        }
        if (name.includes("embedding")) {
          return false;
        }

        const methods = model.supportedGenerationMethods || [];
        return methods.includes("generateContent");
      })
      .map((model) => normalizeModelName(model.name || ""))
      .filter(Boolean)
      .sort((a, b) => scoreModelName(b) - scoreModelName(a));

    return Array.from(new Set(candidates));
  } catch {
    return [];
  }
}

function stripMarkdownCodeFence(input: string) {
  const cleaned = input.trim();
  if (!cleaned.startsWith("```") || !cleaned.endsWith("```")) {
    return cleaned;
  }

  return cleaned
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function safeJsonParse<T>(raw: string): T {
  const sanitized = stripMarkdownCodeFence(raw);

  try {
    return JSON.parse(sanitized) as T;
  } catch {
    const firstBrace = sanitized.indexOf("{");
    const lastBrace = sanitized.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const sliced = sanitized.slice(firstBrace, lastBrace + 1);
      return JSON.parse(sliced) as T;
    }

    throw new Error("Gemini response is not valid JSON");
  }
}

function createSystemPrompt(mode: LearningMode) {
  if (mode === "vocabulary") {
    return [
      "You are an English vocabulary coach for Vietnamese learners.",
      "Return only valid JSON.",
      "No markdown, no extra keys, no explanations outside JSON.",
      "meaning_vi and example_translation must be natural Vietnamese.",
      "Use practical words and avoid duplicates.",
    ].join(" ");
  }

  return [
    "You are an English assessment coach.",
    "Return only valid JSON.",
    "No markdown, no extra keys, no explanations outside JSON.",
    "Use clear and student-friendly language.",
    "Make answers unambiguous and avoid trick questions.",
  ].join(" ");
}

function createUserPrompt({
  mode,
  level,
  topic,
  quantity,
}: GenerateLearningPayload) {
  if (mode === "vocabulary") {
    return [
      `Create ${quantity} vocabulary items for level ${level}.`,
      `Topic: ${topic}.`,
      "Return JSON with structure:",
      '{"title":"...","description":"...","items":[{"word":"...","phonetic":"...","part_of_speech":"...","meaning_vi":"...","meaning_en":"...","example_sentence":"...","example_translation":"..."}]}',
      "example_sentence must be under 20 words.",
    ].join("\n");
  }

  const modeLabel = mode === "mock_test" ? "mock test" : "grammar";
  return [
    `Create ${quantity} ${modeLabel} questions for level ${level}.`,
    `Topic: ${topic}.`,
    "Question mix requirements:",
    "- At least 4 multiple_choice",
    "- At least 3 fill_blank",
    "- At least 2 matching",
    "Return JSON with structure:",
    '{"title":"...","description":"...","items":[{"question_type":"multiple_choice|fill_blank|matching","question":"...","instruction":"...","options":["..."],"correct_answer":"...","acceptable_answers":["..."],"pairs":[{"left":"...","right":"..."}],"explanation":"..."}]}',
    "Rules:",
    "- multiple_choice: must include exactly 4 options and correct_answer must match one option.",
    "- fill_blank: question must include at least one ____ blank. acceptable_answers required.",
    "- matching: include 4 pairs, correct_answer format: left|right,left|right,...",
  ].join("\n");
}

function normalizeQuestionType(type: string): SessionQuestionType {
  if (
    type === "multiple_choice" ||
    type === "fill_blank" ||
    type === "matching"
  ) {
    return type;
  }

  return "multiple_choice";
}

function validateGrammarResponse(response: GeneratedGrammarResponse) {
  if (!response || !Array.isArray(response.items) || response.items.length === 0) {
    throw new Error("Gemini did not return valid grammar/mock items");
  }

  response.items.forEach((item, index) => {
    const type = normalizeQuestionType(item.question_type);
    if (!item.question || !item.correct_answer || !item.explanation) {
      throw new Error(`Invalid question at index ${index}`);
    }

    if (type === "multiple_choice") {
      if (!item.options || item.options.length !== 4) {
        throw new Error(`Multiple choice question at index ${index} must have 4 options`);
      }
      if (!item.options.includes(item.correct_answer)) {
        throw new Error(`Multiple choice correct_answer mismatch at index ${index}`);
      }
    }

    if (type === "fill_blank") {
      if (!item.question.includes("____")) {
        throw new Error(`Fill blank question at index ${index} must contain ____`);
      }
      if (!item.acceptable_answers || item.acceptable_answers.length === 0) {
        throw new Error(`Fill blank question at index ${index} needs acceptable_answers`);
      }
    }

    if (type === "matching") {
      if (!item.pairs || item.pairs.length < 3) {
        throw new Error(`Matching question at index ${index} needs pairs`);
      }
    }
  });
}

function validateVocabularyResponse(response: GeneratedVocabularyResponse) {
  if (!response || !Array.isArray(response.items) || response.items.length === 0) {
    throw new Error("Gemini did not return valid vocabulary items");
  }

  response.items.forEach((item, index) => {
    if (!item.word || !item.meaning_vi || !item.example_sentence || !item.example_translation) {
      throw new Error(`Invalid vocabulary item at index ${index}`);
    }
  });
}

async function generateWithModel(
  prompt: string,
  systemPrompt: string,
  modelName: string,
) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: modelName });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\n${prompt}` }],
      },
    ],
    generationConfig: {
      temperature: 0.8,
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  return { text, usage: result.response.usageMetadata ?? null };
}

export async function generateLearningContent(payload: GenerateLearningPayload): Promise<{
  model: string;
  title: string;
  description: string;
  questions: GeneratedGrammarQuestion[];
  vocabulary: GeneratedVocabularyItem[];
  rawJson: Record<string, unknown>;
  usage: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  } | null;
}> {
  const apiModelCandidates = await listApiModelCandidates();
  const modelCandidates = [
    process.env.GEMINI_MODEL,
    ...apiModelCandidates,
    ...defaultModelCandidates,
  ].filter((value, index, arr): value is string => !!value && arr.indexOf(value) === index);

  let lastError: unknown;
  const modelErrors: string[] = [];
  const systemPrompt = createSystemPrompt(payload.mode);
  const prompt = createUserPrompt(payload);

  for (const modelName of modelCandidates) {
    try {
      const { text, usage } = await generateWithModel(prompt, systemPrompt, modelName);

      if (payload.mode === "vocabulary") {
        const parsed = safeJsonParse<GeneratedVocabularyResponse>(text);
        validateVocabularyResponse(parsed);

        return {
          model: modelName,
          title: parsed.title || `${payload.topic} Vocabulary`,
          description:
            parsed.description ||
            `Vocabulary practice for ${payload.topic} (${payload.level})`,
          questions: [],
          vocabulary: parsed.items,
          rawJson: parsed as unknown as Record<string, unknown>,
          usage,
        };
      }

      const parsed = safeJsonParse<GeneratedGrammarResponse>(text);
      validateGrammarResponse(parsed);

      const normalized = parsed.items.map((item) => ({
        ...item,
        question_type: normalizeQuestionType(item.question_type),
      }));

      return {
        model: modelName,
        title:
          parsed.title ||
          `${payload.topic} ${payload.mode === "mock_test" ? "Mock Test" : "Grammar"}`,
        description:
          parsed.description ||
          `${payload.mode === "mock_test" ? "Mock test" : "Grammar"} practice for ${payload.topic}`,
        questions: normalized,
        vocabulary: [],
        rawJson: {
          title: parsed.title,
          description: parsed.description,
          items: normalized,
        },
        usage,
      };
    } catch (error) {
      lastError = error;
      modelErrors.push(
        `${modelName}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  throw new Error(
    lastError instanceof Error
      ? `Failed generating with all Gemini models (${modelCandidates.join(", ")}). Last error: ${lastError.message}. Attempts: ${modelErrors.join(" | ")}`
      : `Failed generating with all Gemini models (${modelCandidates.join(", ")})`,
  );
}
