import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const SYSTEM_PROMPT = `You are Marg AI, a helpful educational assistant. Always format responses using proper Markdown:
- Use ## and ### headers to organize sections
- Use **bold** for key terms and important concepts
- Use bullet points and numbered lists where appropriate
- Use LaTeX math notation with $ delimiters for ALL mathematical expressions. Examples: $\\overline{AB}$, $x^2$, $\\frac{a}{b}$, $\\pi$
- Use inline code for technical terms
- Keep responses well-structured, clear and easy to read
Always respond in the same language the user asks in.

IMPORTANT: At the very end of your response, if the question is about a learnable topic, add exactly this on a new line:
YOUTUBE_SEARCH: <concise search query for a YouTube tutorial video about the topic>
If the question is a simple greeting or not a learnable topic, do NOT add the YOUTUBE_SEARCH line.`;

export async function GET() {
  const key = process.env.GROQ_API_KEY;
  return NextResponse.json({
    provider: "groq",
    model: MODEL,
    key_loaded: !!key,
    prefix: key ? key.slice(0, 8) + "..." : "MISSING",
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY not configured. Add it to .env.local and restart the server." },
      { status: 500 }
    );
  }

  // CRITICAL FIX: Verify authentication before processing
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: { messages?: { role: string; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages array is required" }, { status: 400 });
  }

  // Build OpenAI-compatible messages array for Groq
  const groqMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
  ];

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    const data = await groqRes.json() as {
      choices?: Array<{ message: { content: string } }>;
      error?: { message: string; type?: string };
    };

    if (!groqRes.ok) {
      const errMsg = data?.error?.message ?? "Groq API returned an error";
      console.error("[Groq Error]", errMsg);

      if (groqRes.status === 429) {
        const retryMatch = errMsg.match(/try again in (\d+(\.\d+)?)s/i);
        const retryAfter = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 30;
        return NextResponse.json(
          { error: errMsg, rateLimited: true, retryAfter },
          { status: 429 }
        );
      }

      return NextResponse.json({ error: errMsg }, { status: groqRes.status });
    }

    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json({ error: "No response from Groq" }, { status: 500 });
    }

    // Extract YOUTUBE_SEARCH query
    const youtubeMatch = text.match(/YOUTUBE_SEARCH:\s*(.+)$/m);
    const youtubeQuery = youtubeMatch?.[1]?.trim() ?? null;
    const cleanResponse = text.replace(/\nYOUTUBE_SEARCH:.*$/m, "").trim();

    // Fetch YouTube video
    let youtubeVideo = null;
    const ytApiKey = process.env.YOUTUBE_DATA_API_KEY;
    if (youtubeQuery && ytApiKey) {
      try {
        const ytRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?` +
          new URLSearchParams({
            part: "snippet",
            q: youtubeQuery,
            type: "video",
            maxResults: "1",
            relevanceLanguage: "en",
            key: ytApiKey,
          })
        );
        if (ytRes.ok) {
          const ytData = await ytRes.json() as {
            items?: Array<{
              id: { videoId: string };
              snippet: {
                title: string;
                channelTitle: string;
                thumbnails: { medium?: { url: string }; default?: { url: string } };
              };
            }>;
          };
          const item = ytData.items?.[0];
          if (item) {
            youtubeVideo = {
              videoId: item.id.videoId,
              title: item.snippet.title,
              channelTitle: item.snippet.channelTitle,
              thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url,
              url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            };
          }
        }
      } catch (ytErr) {
        console.error("[YouTube fetch error]", ytErr);
      }
    }

    return NextResponse.json({ response: cleanResponse, youtubeVideo });

  } catch (err) {
    console.error("[Groq fetch error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Network error calling Groq" },
      { status: 500 }
    );
  }
}
