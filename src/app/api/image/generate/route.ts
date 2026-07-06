import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 500 });
  }

  // Auth guard — reject unauthenticated requests
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt } = body;
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Generate a high quality image of: ${prompt}` }] }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
          }),
        }
      );

      if (res.status === 429) {
        if (attempt < 3) { await delay(3000 * attempt); continue; }
        return NextResponse.json(
          { error: "Gemini is busy. Please wait a few seconds and try again." },
          { status: 429 }
        );
      }

      const data = await res.json() as {
        error?: { message?: string };
        candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType: string; data: string } }> } }>;
      };

      if (!res.ok) {
        return NextResponse.json(
          { error: data?.error?.message ?? "Image generation failed" },
          { status: res.status }
        );
      }

      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find((p) => p.inlineData);

      if (!imagePart?.inlineData) {
        return NextResponse.json(
          { error: "No image returned. Try a different prompt." },
          { status: 500 }
        );
      }

      const { mimeType, data: base64 } = imagePart.inlineData;
      return NextResponse.json({ imageUrl: `data:${mimeType};base64,${base64}` });

    } catch (err) {
      if (attempt === 3) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Failed to generate image" },
          { status: 500 }
        );
      }
      await delay(2000);
    }
  }

  return NextResponse.json({ error: "Image generation failed after retries" }, { status: 500 });
}
