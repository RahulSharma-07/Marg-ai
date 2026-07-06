import { NextResponse } from "next/server";

export const runtime = "nodejs";

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YOUTUBE_DATA_API_KEY not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      new URLSearchParams({
        part: "snippet",
        q: `${query} tutorial`,
        type: "video",
        maxResults: "1",
        relevanceLanguage: "en",
        videoDuration: "medium",
        key: apiKey,
      }),
      { next: { revalidate: 3600 } } // cache for 1 hour
    );

    if (!res.ok) {
      const err = await res.json();
      console.error("[YouTube API error]", err);
      return NextResponse.json({ error: "YouTube API error" }, { status: res.status });
    }

    const data = await res.json();
    const item = data.items?.[0];

    if (!item) {
      return NextResponse.json({ video: null });
    }

    const video: YouTubeVideo = {
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    };

    return NextResponse.json({ video });
  } catch (err) {
    console.error("[YouTube search error]", err);
    return NextResponse.json({ error: "Failed to fetch YouTube video" }, { status: 500 });
  }
}
