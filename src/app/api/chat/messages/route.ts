import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// GET — fetch all messages for a session
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

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
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ messages: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST — save a message to a session
export async function POST(request: Request) {
  try {
    const { session_id, role, content } = await request.json();

    if (!session_id || !role || !content) {
      return NextResponse.json(
        { error: "session_id, role, and content are required" },
        { status: 400 }
      );
    }

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
      .from("chat_messages")
      .insert({ session_id, role, content })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save message" },
      { status: 500 }
    );
  }
}
