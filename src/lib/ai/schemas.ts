/**
 * Zod schemas for validating all AI JSON output.
 *
 * Every response from Gemini that is meant to be persisted to the DB
 * must be validated against one of these schemas before writing.
 * Treat the LLM as an untrusted source — reject and retry on failure.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Topic schema — used inside RoadmapSchema and standalone
// ---------------------------------------------------------------------------

export const TopicSchema = z.object({
  title: z.string().min(1),
  sequence_order: z.number().int().nonnegative(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  estimated_time: z.string().min(1),
  /** Array of prerequisite topic titles */
  prerequisites: z.array(z.string()).default([]),
  learning_outcome: z.string().min(1),
  week_number: z.number().int().positive(),
});

export type TopicOutput = z.infer<typeof TopicSchema>;

// ---------------------------------------------------------------------------
// Roadmap schema — returned by generateRoadmap()
// ---------------------------------------------------------------------------

export const RoadmapSchema = z.object({
  title: z.string().min(1),
  estimated_total_time: z.string().min(1),
  topics: z.array(TopicSchema).min(1),
});

export type RoadmapOutput = z.infer<typeof RoadmapSchema>;

// ---------------------------------------------------------------------------
// Resource schema — returned by curateResources()
// ---------------------------------------------------------------------------

export const ResourceSchema = z.object({
  type: z.enum(["video", "documentation", "practice", "project", "reading"]),
  title: z.string().min(1),
  url: z.string().url(),
  source_platform: z.string().optional(),
});

export type ResourceOutput = z.infer<typeof ResourceSchema>;

// ---------------------------------------------------------------------------
// Mindmap schema — returned by generateMindmap()
// Nodes have an id and label; edges link node ids
// ---------------------------------------------------------------------------

export const MindmapNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** Optional grouping / depth level */
  level: z.number().int().nonnegative().optional(),
});

export const MindmapEdgeSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional(),
});

export const MindmapSchema = z.object({
  nodes: z.array(MindmapNodeSchema).min(1),
  edges: z.array(MindmapEdgeSchema),
});

export type MindmapOutput = z.infer<typeof MindmapSchema>;

// ---------------------------------------------------------------------------
// Summary schema — returned by generateSummary()
// ---------------------------------------------------------------------------

export const SummarySchema = z.object({
  explanation: z.string().min(1),
  key_concepts: z.array(z.string()).min(1),
  interview_questions: z.array(z.string()).min(1),
  common_mistakes: z.array(z.string()).min(1),
});

export type SummaryOutput = z.infer<typeof SummarySchema>;
