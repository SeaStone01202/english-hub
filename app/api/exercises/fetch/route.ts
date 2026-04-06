import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const userId = request.nextUrl.searchParams.get("userId");
    const type = request.nextUrl.searchParams.get("type");
    const level = request.nextUrl.searchParams.get("level");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId query parameter" },
        { status: 400 }
      );
    }

    let query = supabase.from("exercises").select("*").eq("user_id", userId);

    if (type) {
      query = query.eq("type", type);
    }

    if (level) {
      query = query.eq("level", level);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch exercises" },
        { status: 500 }
      );
    }

    return NextResponse.json({ exercises: data });
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch exercises",
      },
      { status: 500 }
    );
  }
}
