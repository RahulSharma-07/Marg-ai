/**
 * useRoadmap — React Query hook
 *
 * Fetches the user's active roadmap with its topics.
 * Polls every 5 seconds when status is 'generating' so the UI
 * automatically updates when the AI roadmap generation completes.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import type { RoadmapWithTopics } from "@/types";

// ---------------------------------------------------------------------------
// Fetcher helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a roadmap by id, including its topics and progress.
 */
async function fetchRoadmap(id: string): Promise<{
  roadmap: RoadmapWithTopics;
  progress: {
    topics_completed: number;
    total_topics: number;
    completion_percentage: number;
    last_activity_at: string;
  } | null;
}> {
  const res = await fetch(`/api/roadmap/${id}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to fetch roadmap (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch the user's current progress (active roadmap id + progress row).
 * Used to discover which roadmap id to query.
 */
async function fetchActiveRoadmapId(): Promise<string | null> {
  const res = await fetch("/api/progress");
  if (!res.ok) return null;
  const data = await res.json();
  return data?.roadmap?.id ?? null;
}

// ---------------------------------------------------------------------------
// Hook: useRoadmap
// ---------------------------------------------------------------------------

interface UseRoadmapOptions {
  /** Provide an explicit roadmap id if known (e.g., from the assessment response) */
  roadmapId?: string;
}

/**
 * Fetch the active roadmap with its topics.
 *
 * @example
 * const { data, isLoading, error } = useRoadmap();
 * const { roadmap, progress } = data ?? {};
 */
export function useRoadmap(options: UseRoadmapOptions = {}) {
  // Step 1: resolve the roadmap id (either provided or fetched from /api/progress)
  const idQuery = useQuery({
    queryKey: ["activeRoadmapId"],
    queryFn: fetchActiveRoadmapId,
    enabled: !options.roadmapId,
    staleTime: 60_000, // 1 min
  });

  const resolvedId = options.roadmapId ?? idQuery.data ?? undefined;

  // Step 2: fetch the actual roadmap data
  const roadmapQuery = useQuery({
    queryKey: ["roadmap", resolvedId],
    queryFn: () => fetchRoadmap(resolvedId!),
    enabled: !!resolvedId,
    staleTime: 30_000, // 30 s
    // Poll every 5 s while the roadmap is generating
    refetchInterval: (query) => {
      const status = query.state.data?.roadmap?.status;
      return status === "generating" ? 5_000 : false;
    },
  });

  return {
    ...roadmapQuery,
    roadmapId: resolvedId,
    isLoadingId: idQuery.isLoading,
  };
}
