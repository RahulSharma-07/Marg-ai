/**
 * Shared TypeScript types for Marg AI.
 * These mirror the DB schema exactly so API responses and
 * React Query hooks are fully typed end-to-end.
 */

// ---------------------------------------------------------------------------
// Enums (union types mirroring DB enums)
// ---------------------------------------------------------------------------

export type UserLevel = "beginner" | "intermediate" | "advanced";
export type StudyHours = "0.5" | "1" | "2" | "4+";
export type LearningStyle = "videos" | "reading" | "interactive" | "mixed";
export type PrimaryObjective =
  | "placement"
  | "internship"
  | "freelancing"
  | "projects"
  | "higher_studies";
export type UserPlan = "free" | "premium";

export type RoadmapStatus = "generating" | "active" | "completed" | "archived";

export type TopicDifficulty = "easy" | "medium" | "hard";
export type TopicStatus = "locked" | "available" | "in_progress" | "completed";

export type ResourceType =
  | "video"
  | "documentation"
  | "practice"
  | "project"
  | "reading";
export type VerificationStatus = "unverified" | "verified" | "broken";
export type CurationMethod = "ai_generated" | "human_reviewed";

export type AICallType =
  | "roadmap_gen"
  | "mindmap_gen"
  | "summary_gen"
  | "doubt_solver"
  | "resource_curation";

// ---------------------------------------------------------------------------
// DB Row types
// ---------------------------------------------------------------------------

/** public.users — product profile extending auth.users */
export interface User {
  id: string;
  name: string | null;
  email: string | null;
  goal: string | null;
  level: UserLevel | null;
  study_hours_per_day: StudyHours | null;
  learning_style: LearningStyle | null;
  primary_objective: PrimaryObjective | null;
  plan: UserPlan;
  created_at: string;
}

/** public.roadmaps */
export interface Roadmap {
  id: string;
  user_id: string;
  title: string;
  estimated_total_time: string | null;
  status: RoadmapStatus;
  created_at: string;
}

/** public.topics */
export interface Topic {
  id: string;
  roadmap_id: string;
  title: string;
  sequence_order: number;
  difficulty: TopicDifficulty | null;
  estimated_time: string | null;
  prerequisites: string[];
  learning_outcome: string | null;
  status: TopicStatus;
  week_number: number | null;
  mindmap: MindmapData | null;
  summary: SummaryData | null;
  created_at: string;
  completed_at: string | null;
}

/** public.resources */
export interface Resource {
  id: string;
  topic_id: string;
  type: ResourceType;
  title: string;
  url: string;
  source_platform: string | null;
  verification_status: VerificationStatus;
  curation_method: CurationMethod;
  created_at: string;
}

/** public.progress */
export interface Progress {
  id: string;
  user_id: string;
  roadmap_id: string;
  topics_completed: number;
  total_topics: number;
  total_learning_hours: number;
  last_activity_at: string;
  updated_at: string;
}

/** public.chat_history */
export interface ChatHistory {
  id: string;
  user_id: string;
  topic_id: string | null;
  question: string;
  answer: string;
  context_snapshot: Record<string, unknown> | null;
  created_at: string;
}

/** public.assessments */
export interface Assessment {
  id: string;
  user_id: string;
  raw_answers: Record<string, unknown>;
  generated_profile: Record<string, unknown> | null;
  created_at: string;
}

/** public.ai_usage_logs */
export interface AIUsageLog {
  id: string;
  user_id: string;
  call_type: AICallType;
  provider: string;
  tokens_used: number;
  estimated_cost_usd: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Nested JSON types stored in JSONB columns
// ---------------------------------------------------------------------------

export interface MindmapNode {
  id: string;
  label: string;
  level?: number;
}

export interface MindmapEdge {
  source: string;
  target: string;
  label?: string;
}

export interface MindmapData {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
}

export interface SummaryData {
  explanation: string;
  key_concepts: string[];
  interview_questions: string[];
  common_mistakes: string[];
}

// ---------------------------------------------------------------------------
// API response shapes (composite types for route handler returns)
// ---------------------------------------------------------------------------

/** Roadmap with its topics included */
export interface RoadmapWithTopics extends Roadmap {
  topics: Topic[];
}

/** Topic with its resources included */
export interface TopicWithResources extends Topic {
  resources: Resource[];
}

/** Assessment submission payload (matches the API request body) */
export interface AssessmentAnswers {
  goal: string;
  level: UserLevel;
  study_hours_per_day: StudyHours;
  learning_style: LearningStyle;
  primary_objective: PrimaryObjective;
}
