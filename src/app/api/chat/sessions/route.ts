import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET — fetch sessions (most recent 50)
export async function GET() {
  try {
    const supabase = await createClient();

    // CRITICAL FIX: Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ sessions: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// POST — create a new session
export async function POST(request: Request) {
  try {
    const { title } = await request.json();
    const supabase = await createClient();

    // CRITICAL FIX: Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ title: title || "New Chat" })
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating session:", error);
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: 500 }
      );
    }

    return NextResponse.json({ session: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create session" },
      { status: 500 }
    );
  }
}
