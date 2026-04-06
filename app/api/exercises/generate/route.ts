import { NextRequest, NextResponse } from "next/server";
import { generateExercises } from "@/lib/gemini-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { type, level, topic, quantity, userId } = body;

    // Validate input
    if (!type || !level || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: type, level, userId" },
        { status: 400 }
      );
    }

    const validTypes = ["multiple-choice", "fill-blank", "matching", "listening"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid exercise type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const validLevels = ["beginner", "intermediate", "advanced"];
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { error: `Invalid level. Must be one of: ${validLevels.join(", ")}` },
        { status: 400 }
      );
    }

    // Generate exercises using Gemini
    const exercises = await generateExercises({
      type,
      level,
      topic,
      quantity: quantity || 3,
    });

    // Save exercises to Supabase
    const exercisesToSave = exercises.map((exercise, index) => ({
      user_id: userId,
      title: `${type} Exercise ${index + 1}`,
      description: topic || `${level} level ${type} exercise`,
      level: level,
      category: type,
      content: exercise,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("exercises")
      .insert(exercisesToSave)
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save exercises to database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      exercises: data,
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
      { status: 500 }
    );
  }
}
