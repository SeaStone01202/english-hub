import { generateLearningContent } from "@/lib/gemini-service";
import {
  GenerateRequest,
  LearningLevel,
  LearningMode,
} from "@/lib/learning-types";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const normalizeKey = (value: string | null | undefined) =>
      (value || "").trim().toLowerCase();

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as GenerateRequest;
    const mode = body.mode;
    const level = body.level;
    const topic = (body.topic || "General English").trim();
    const sessionId = body.sessionId;
    const quantity =
      typeof body.quantity === "number" && body.quantity > 0
        ? Math.min(body.quantity, 20)
        : mode === "vocabulary"
          ? 8
          : 10;

    if (!mode || !level) {
      return NextResponse.json(
        { error: "Missing required fields: mode, level" },
        { status: 400 },
      );
    }

    const validModes: LearningMode[] = ["grammar", "vocabulary", "mock_test"];
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        {
          error: `Invalid mode. Must be one of: ${validModes.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const validLevels: LearningLevel[] = [
      "beginner",
      "intermediate",
      "advanced",
    ];
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { error: `Invalid level. Must be one of: ${validLevels.join(", ")}` },
        { status: 400 },
      );
    }

    // Ensure profile row exists (important after DB reset/migration for existing auth users)
    const { error: ensureUserError } = await supabase.from("users").upsert(
      {
        id: user.id,
        email: user.email || `${user.id}@local.invalid`,
        name:
          (user.user_metadata?.name as string | undefined) ||
          (user.email ? user.email.split("@")[0] : "User"),
      },
      { onConflict: "id" },
    );

    if (ensureUserError) {
      console.error("users upsert error:", ensureUserError);
      return NextResponse.json(
        {
          error: "Failed to ensure user profile",
          detail: ensureUserError.message,
        },
        { status: 500 },
      );
    }

    let sessionRecord:
      | {
          id: string;
          user_id: string;
          mode: LearningMode;
          level: LearningLevel;
          topic: string;
          title: string | null;
          status: "active" | "completed" | "archived";
          created_at: string;
          updated_at: string;
        }
      | null = null;

    if (sessionId) {
      const { data: existingSession, error: sessionError } = await supabase
        .from("learning_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (sessionError || !existingSession) {
        return NextResponse.json(
          { error: "Session not found or access denied" },
          { status: 404 },
        );
      }

      sessionRecord = existingSession;
    } else {
      const { data: createdSession, error: createSessionError } = await supabase
        .from("learning_sessions")
        .insert({
          user_id: user.id,
          mode,
          level,
          topic,
          title:
            mode === "vocabulary"
              ? `${topic} Vocabulary`
              : `${topic} ${mode === "mock_test" ? "Mock Test" : "Grammar"}`,
          status: "active",
        })
        .select("*")
        .single();

      if (createSessionError || !createdSession) {
        console.error("learning_sessions insert error:", createSessionError);
        return NextResponse.json(
          {
            error: "Failed to create learning session",
            detail: createSessionError?.message || "Unknown database error",
          },
          { status: 500 },
        );
      }

      sessionRecord = createdSession;
    }

    if (!sessionRecord) {
      return NextResponse.json(
        { error: "Failed to initialize learning session" },
        { status: 500 },
      );
    }

    let existingQuestionKeys = new Set<string>();
    let existingWordKeys = new Set<string>();

    if (mode === "vocabulary") {
      const { data: existingWords } = await supabase
        .from("vocabulary_items")
        .select("word")
        .eq("session_id", sessionRecord.id);

      existingWordKeys = new Set(
        (existingWords || [])
          .map((item) => normalizeKey(item.word))
          .filter(Boolean),
      );
    } else {
      const { data: existingQuestions } = await supabase
        .from("session_questions")
        .select("question_text")
        .eq("session_id", sessionRecord.id);

      existingQuestionKeys = new Set(
        (existingQuestions || [])
          .map((item) => normalizeKey(item.question_text))
          .filter(Boolean),
      );
    }

    let content = await generateLearningContent({
      mode,
      level,
      topic,
      quantity,
    });

    if (mode === "vocabulary") {
      const seen = new Set(existingWordKeys);
      const filteredVocabulary = content.vocabulary.filter((item) => {
        const key = normalizeKey(item.word);
        if (!key || seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });

      if (filteredVocabulary.length === 0) {
        return NextResponse.json(
          {
            error:
              "Model returned duplicate vocabulary. Please click Generate again or change topic.",
          },
          { status: 422 },
        );
      }

      content = {
        ...content,
        vocabulary: filteredVocabulary,
        rawJson: {
          ...content.rawJson,
          items: filteredVocabulary,
        },
      };
    } else {
      const seen = new Set(existingQuestionKeys);
      const filteredQuestions = content.questions.filter((item) => {
        const key = normalizeKey(item.question);
        if (!key || seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });

      if (filteredQuestions.length === 0) {
        return NextResponse.json(
          {
            error:
              "Model returned duplicate questions. Please click Generate again or change topic.",
          },
          { status: 422 },
        );
      }

      content = {
        ...content,
        questions: filteredQuestions,
        rawJson: {
          ...content.rawJson,
          items: filteredQuestions,
        },
      };
    }

    const { data: generationRecord, error: generationError } = await supabase
      .from("ai_generations")
      .insert({
        session_id: sessionRecord.id,
        user_id: user.id,
        prompt_version: "v2",
        model: content.model,
        request_payload: {
          mode,
          level,
          topic,
          quantity,
        },
        response_json: content.rawJson,
        prompt_tokens: content.usage?.promptTokenCount ?? null,
        completion_tokens: content.usage?.candidatesTokenCount ?? null,
        total_tokens: content.usage?.totalTokenCount ?? null,
      })
      .select("*")
      .single();

    if (generationError || !generationRecord) {
      console.error("ai_generations insert error:", generationError);
      return NextResponse.json(
        { error: "Failed to save generation to database" },
        { status: 500 },
      );
    }

    let createdQuestions: Array<{
      id: string;
      session_id: string;
      generation_id: string | null;
      order_index: number;
      question_type: string;
      question_text: string;
      correct_answer: string;
      explanation: string | null;
      metadata: Record<string, unknown> | null;
    }> = [];
    let optionsByQuestionId = new Map<
      string,
      Array<{ optionText: string; optionOrder: number; isCorrect: boolean }>
    >();

    let createdVocab: Array<{
      id: string;
      session_id: string;
      generation_id: string | null;
      order_index: number;
      topic: string;
      word: string;
      phonetic: string | null;
      part_of_speech: string | null;
      meaning_vi: string;
      meaning_en: string | null;
      example_sentence: string;
      example_translation: string;
      audio_url: string | null;
    }> = [];

    if (mode === "vocabulary") {
      const { data: maxVocabOrder } = await supabase
        .from("vocabulary_items")
        .select("order_index")
        .eq("session_id", sessionRecord.id)
        .order("order_index", { ascending: false })
        .limit(1);

      const orderStart = (maxVocabOrder?.[0]?.order_index ?? 0) + 1;

      const vocabRows = content.vocabulary.map((item, index) => ({
        session_id: sessionRecord.id,
        generation_id: generationRecord.id,
        user_id: user.id,
        order_index: orderStart + index,
        topic: sessionRecord.topic,
        word: item.word,
        phonetic: item.phonetic || null,
        part_of_speech: item.part_of_speech || null,
        meaning_vi: item.meaning_vi,
        meaning_en: item.meaning_en || null,
        example_sentence: item.example_sentence,
        example_translation: item.example_translation,
      }));

      const { data: vocabInserted, error: vocabError } = await supabase
        .from("vocabulary_items")
        .insert(vocabRows)
        .select("*");

      if (vocabError) {
        console.error("vocabulary_items insert error:", vocabError);
        return NextResponse.json(
          { error: "Failed to save vocabulary items" },
          { status: 500 },
        );
      }

      createdVocab = vocabInserted ?? [];
    } else {
      const { data: maxQuestionOrder } = await supabase
        .from("session_questions")
        .select("order_index")
        .eq("session_id", sessionRecord.id)
        .order("order_index", { ascending: false })
        .limit(1);

      const orderStart = (maxQuestionOrder?.[0]?.order_index ?? 0) + 1;

      const questionRows = content.questions.map((item, index) => ({
        session_id: sessionRecord.id,
        generation_id: generationRecord.id,
        user_id: user.id,
        order_index: orderStart + index,
        question_type: item.question_type,
        question_text: item.question,
        correct_answer: item.correct_answer,
        explanation: item.explanation,
        metadata: {
          instruction: item.instruction,
          acceptable_answers: item.acceptable_answers ?? [],
          pairs: item.pairs ?? [],
        },
      }));

      const { data: questionInserted, error: questionError } = await supabase
        .from("session_questions")
        .insert(questionRows)
        .select("*");

      if (questionError) {
        console.error("session_questions insert error:", questionError);
        return NextResponse.json(
          { error: "Failed to save generated questions" },
          { status: 500 },
        );
      }

      createdQuestions = questionInserted ?? [];

      const optionRows = createdQuestions.flatMap((question, qIndex) => {
        const originalQuestion = content.questions[qIndex];
        if (
          originalQuestion.question_type !== "multiple_choice" ||
          !originalQuestion.options
        ) {
          return [];
        }

        return originalQuestion.options.map((option, optionIndex) => ({
          question_id: question.id,
          option_text: option,
          option_order: optionIndex,
          is_correct: option === originalQuestion.correct_answer,
        }));
      });

      if (optionRows.length > 0) {
        const { error: optionError } = await supabase
          .from("question_options")
          .insert(optionRows);

        if (optionError) {
          console.error("question_options insert error:", optionError);
          return NextResponse.json(
            { error: "Failed to save multiple choice options" },
            { status: 500 },
          );
        }
      }

      optionsByQuestionId = createdQuestions.reduce((acc, question, qIndex) => {
        const originalQuestion = content.questions[qIndex];
        if (
          originalQuestion.question_type !== "multiple_choice" ||
          !originalQuestion.options
        ) {
          return acc;
        }

        acc.set(
          question.id,
          originalQuestion.options.map((optionText, optionOrder) => ({
            optionText,
            optionOrder,
            isCorrect: optionText === originalQuestion.correct_answer,
          })),
        );
        return acc;
      }, optionsByQuestionId);
    }

    const { data: updatedSession } = await supabase
      .from("learning_sessions")
      .update({
        title: content.title || sessionRecord.title,
      })
      .eq("id", sessionRecord.id)
      .select("*")
      .single();

    const normalizedSession = updatedSession || sessionRecord;

    return NextResponse.json({
      success: true,
      session: {
        id: normalizedSession.id,
        userId: normalizedSession.user_id,
        mode: normalizedSession.mode,
        level: normalizedSession.level,
        topic: normalizedSession.topic,
        title: normalizedSession.title,
        status: normalizedSession.status,
        createdAt: normalizedSession.created_at,
        updatedAt: normalizedSession.updated_at,
      },
      generationId: generationRecord.id,
      model: content.model,
      questions: createdQuestions.map((question) => {
        const metadata = (question.metadata || {}) as {
          instruction?: string;
          acceptable_answers?: string[];
          pairs?: Array<{ left: string; right: string }>;
        };

        return {
          id: question.id,
          sessionId: question.session_id,
          generationId: question.generation_id,
          orderIndex: question.order_index,
          questionType: question.question_type,
          questionText: question.question_text,
          correctAnswer: question.correct_answer,
          explanation: question.explanation || "",
          metadata: {
            instruction: metadata.instruction || "",
            acceptableAnswers: metadata.acceptable_answers || [],
            pairs: metadata.pairs || [],
          },
          options: optionsByQuestionId.get(question.id) || [],
        };
      }),
      vocabulary: createdVocab.map((item) => ({
        id: item.id,
        sessionId: item.session_id,
        generationId: item.generation_id,
        orderIndex: item.order_index,
        topic: item.topic,
        word: item.word,
        phonetic: item.phonetic,
        partOfSpeech: item.part_of_speech,
        meaningVi: item.meaning_vi,
        meaningEn: item.meaning_en,
        exampleSentence: item.example_sentence,
        exampleTranslation: item.example_translation,
        audioUrl: item.audio_url,
      })),
    });
  } catch (error) {
    console.error("Error generating exercises:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate exercises",
      },
      { status: 500 },
    );
  }
}
