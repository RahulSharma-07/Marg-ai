import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Use rpc to run a trivial query — works even with empty database
    const { error } = await supabase.rpc("version");

    // Any response (including "function not found") means DB is reachable
    const connected = !error || error.code === "PGRST202";

    return NextResponse.json({
      connected,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      message: connected
        ? "✅ Supabase connection successful"
        : `❌ ${error?.message}`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        connected: false,
        error: err instanceof Error ? err.message : "Unknown error",
        message: "❌ Supabase connection failed",
      },
      { status: 500 }
    );
  }
}
