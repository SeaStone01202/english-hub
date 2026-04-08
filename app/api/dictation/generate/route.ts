import { generateDictationSentence } from "@/lib/gemini-service";
import { LearningLevel } from "@/lib/learning-types";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface DictationRequest {
  level: LearningLevel;
  topic?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as DictationRequest;
    const level = body.level;
    const topic = (body.topic || "Daily English").trim();
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

    const content = await generateDictationSentence({
      level,
      topic,
    });

    return NextResponse.json({
      success: true,
      model: content.model,
      sentence: content.sentence,
      translationVi: content.translationVi,
      hintVi: content.hintVi,
    });
  } catch (error) {
    console.error("Error generating dictation:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate dictation",
      },
      { status: 500 },
    );
  }
}
