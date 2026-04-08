import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get("sessionId");
    const mode = request.nextUrl.searchParams.get("mode");
    const limit = Number(request.nextUrl.searchParams.get("limit") || "20");

    if (sessionId) {
      const { data: session, error: sessionError } = await supabase
        .from("learning_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (sessionError || !session) {
        return NextResponse.json(
          { error: "Session not found or access denied" },
          { status: 404 },
        );
      }

      const { data: questions, error: questionError } = await supabase
        .from("session_questions")
        .select("*")
        .eq("session_id", sessionId)
        .order("order_index", { ascending: true });

      if (questionError) {
        return NextResponse.json(
          { error: "Failed to fetch questions" },
          { status: 500 },
        );
      }

      const questionIds = (questions || []).map((item) => item.id);
      let optionsByQuestionId = new Map<
        string,
        Array<{ optionText: string; optionOrder: number; isCorrect: boolean }>
      >();

      if (questionIds.length > 0) {
        const { data: options, error: optionError } = await supabase
          .from("question_options")
          .select("*")
          .in("question_id", questionIds)
          .order("option_order", { ascending: true });

        if (optionError) {
          return NextResponse.json(
            { error: "Failed to fetch question options" },
            { status: 500 },
          );
        }

        optionsByQuestionId = (options || []).reduce((acc, option) => {
          const current = acc.get(option.question_id) ?? [];
          current.push({
            optionText: option.option_text,
            optionOrder: option.option_order,
            isCorrect: option.is_correct,
          });
          acc.set(option.question_id, current);
          return acc;
        }, optionsByQuestionId);
      }

      const { data: vocabulary, error: vocabError } = await supabase
        .from("vocabulary_items")
        .select("*")
        .eq("session_id", sessionId)
        .order("order_index", { ascending: true });

      if (vocabError) {
        return NextResponse.json(
          { error: "Failed to fetch vocabulary items" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        session: {
          id: session.id,
          userId: session.user_id,
          mode: session.mode,
          level: session.level,
          topic: session.topic,
          title: session.title,
          status: session.status,
          createdAt: session.created_at,
          updatedAt: session.updated_at,
        },
        questions: (questions || []).map((item) => {
          const metadata = (item.metadata || {}) as {
            instruction?: string;
            acceptable_answers?: string[];
            pairs?: Array<{ left: string; right: string }>;
          };

          return {
            id: item.id,
            sessionId: item.session_id,
            generationId: item.generation_id,
            orderIndex: item.order_index,
            questionType: item.question_type,
            questionText: item.question_text,
            correctAnswer: item.correct_answer,
            explanation: item.explanation || "",
            metadata: {
              instruction: metadata.instruction || "",
              acceptableAnswers: metadata.acceptable_answers || [],
              pairs: metadata.pairs || [],
            },
            options: optionsByQuestionId.get(item.id) || [],
          };
        }),
        vocabulary: (vocabulary || []).map((item) => ({
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
    }

    let query = supabase
      .from("learning_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(Number.isNaN(limit) ? 20 : Math.min(limit, 50));

    if (mode === "mock_test") {
      return NextResponse.json(
        { error: "Mock test is temporarily disabled" },
        { status: 410 },
      );
    }

    if (mode) {
      query = query.eq("mode", mode);
    } else {
      query = query.neq("mode", "mock_test");
    }

    const { data: sessions, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      sessions: (sessions || []).map((session) => ({
        id: session.id,
        userId: session.user_id,
        mode: session.mode,
        level: session.level,
        topic: session.topic,
        title: session.title,
        status: session.status,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch exercises",
      },
      { status: 500 },
    );
  }
}
