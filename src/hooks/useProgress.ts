/**
 * useProgress — React Query hook
 *
 * Fetches the user's progress for their active roadmap.
 * Used by the dashboard to show the progress bar and last activity.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import type { Roadmap, Progress } from "@/types";

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

interface ProgressResponse {
  roadmap: Roadmap | null;
  progress: (Progress & { completion_percentage: number }) | null;
}

async function fetchProgress(): Promise<ProgressResponse> {
  const res = await fetch("/api/progress");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to fetch progress (${res.status})`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Hook: useProgress
// ---------------------------------------------------------------------------

/**
 * Fetch the user's progress for their active roadmap.
 *
 * @example
 * const { data, isLoading } = useProgress();
 * const pct = data?.progress?.completion_percentage ?? 0;
 */
export function useProgress() {
  return useQuery<ProgressResponse>({
    queryKey: ["progress"],
    queryFn: fetchProgress,
    staleTime: 30_000, // 30 s — progress doesn't change frequently
    gcTime: 5 * 60_000, // 5 min cache
  });
}
