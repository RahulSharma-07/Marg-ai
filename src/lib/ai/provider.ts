/**
 * AI Provider Abstraction
 *
 * Thin wrapper over Gemini (google/generative-ai). All LLM calls in the
 * application go through this module — never call Gemini directly from
 * route handlers. This gives us one place for:
 *   - Cost logging (every call logs to ai_usage_logs)
 *   - Zod validation of structured JSON output
 *   - Provider swapping (Gemini → OpenAI, etc.) without touching business logic
 *   - Retry / error handling
 */

export const runtime = "nodejs";

import { GoogleGenerativeAI, type Content } from "@google/generative-ai";
import { RoadmapSchema, MindmapSchema, SummarySchema, ResourceSchema } from "./schemas";
import type { RoadmapOutput, MindmapOutput, SummaryOutput, ResourceOutput } from "./schemas";
import { logAIUsage, estimateGeminiFlashCost } from "./costLogger";
import { buildGenerateRoadmapPrompt } from "./prompts/generateRoadmap";
import { buildDoubtSolverContents } from "./prompts/doubtSolver";
import { buildGenerateMindmapPrompt } from "./prompts/generateMindmap";
import { buildGenerateSummaryPrompt } from "./prompts/generateSummary";

// ---------------------------------------------------------------------------
// Gemini client singleton
// ---------------------------------------------------------------------------

const MODEL_NAME = "gemini-2.5-flash";

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing env var: GEMINI_API_KEY");
  }
  return new GoogleGenerativeAI(apiKey);
}

// ---------------------------------------------------------------------------
// Internal helper: call Gemini and extract text + usage metadata
// ---------------------------------------------------------------------------

interface GeminiCallResult {
  text: string;
  totalTokens: number;
}

async function callGemini(
  contents: Content[],
  temperature = 0.7
): Promise<GeminiCallResult> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { temperature, maxOutputTokens: 4096 },
  });

  const result = await model.generateContent({ contents });
  const response = result.response;
  const text = response.text();
  const totalTokens =
    response.usageMetadata?.totalTokenCount ??
    response.usageMetadata?.promptTokenCount ??
    0;

  return { text, totalTokens };
}

// ---------------------------------------------------------------------------
// Internal helper: strip markdown fences from LLM output
// ---------------------------------------------------------------------------

function stripJsonFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

// ---------------------------------------------------------------------------
// generateRoadmap
// ---------------------------------------------------------------------------

export interface RoadmapProfile {
  userId: string;
  goal: string;
  level: string;
  studyHoursPerDay: string;
  learningStyle: string;
  primaryObjective: string;
}

/**
 * Generate a personalised learning roadmap for a student.
 *
 * @param profile - Student's assessment answers
 * @returns Validated roadmap object ready to insert into DB
 */
export async function generateRoadmap(
  profile: RoadmapProfile
): Promise<RoadmapOutput> {
  const prompt = buildGenerateRoadmapPrompt({
    goal: profile.goal,
    level: profile.level,
    studyHoursPerDay: profile.studyHoursPerDay,
    learningStyle: profile.learningStyle,
    primaryObjective: profile.primaryObjective,
  });

  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const { text, totalTokens } = await callGemini(contents, 0.5);

  const cleaned = stripJsonFences(text);
  const parsed = JSON.parse(cleaned);
  const validated = RoadmapSchema.parse(parsed);

  await logAIUsage(
    profile.userId,
    "roadmap_gen",
    MODEL_NAME,
    totalTokens,
    estimateGeminiFlashCost(totalTokens)
  );

  return validated;
}

// ---------------------------------------------------------------------------
// answerDoubt
// ---------------------------------------------------------------------------

export interface DoubtContext {
  userId: string;
  question: string;
  roadmapContext: string;
  topicContext: string;
  chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

/**
 * Answer a student's doubt using their roadmap and topic context.
 *
 * @param ctx - Question, roadmap context, topic context, and prior chat
 * @returns Markdown-formatted answer string
 */
export async function answerDoubt(ctx: DoubtContext): Promise<string> {
  const contents = buildDoubtSolverContents({
    question: ctx.question,
    roadmapContext: ctx.roadmapContext,
    topicContext: ctx.topicContext,
    chatHistory: ctx.chatHistory,
  });

  const { text, totalTokens } = await callGemini(contents, 0.8);

  await logAIUsage(
    ctx.userId,
    "doubt_solver",
    MODEL_NAME,
    totalTokens,
    estimateGeminiFlashCost(totalTokens)
  );

  return text;
}

// ---------------------------------------------------------------------------
// generateMindmap
// ---------------------------------------------------------------------------

/**
 * Generate a mindmap (nodes + edges) for a completed topic.
 *
 * @param userId      - For usage logging
 * @param topicTitle  - The topic to build a mindmap for
 * @param content     - Optional summary text to anchor concepts
 * @returns Validated mindmap object
 */
export async function generateMindmap(
  userId: string,
  topicTitle: string,
  content?: string
): Promise<MindmapOutput> {
  const prompt = buildGenerateMindmapPrompt({ topicTitle, summary: content });
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const { text, totalTokens } = await callGemini(contents, 0.6);

  const cleaned = stripJsonFences(text);
  const parsed = JSON.parse(cleaned);
  const validated = MindmapSchema.parse(parsed);

  await logAIUsage(
    userId,
    "mindmap_gen",
    MODEL_NAME,
    totalTokens,
    estimateGeminiFlashCost(totalTokens)
  );

  return validated;
}

// ---------------------------------------------------------------------------
// generateSummary
// ---------------------------------------------------------------------------

/**
 * Generate a structured topic summary: explanation, key concepts,
 * interview questions, and common mistakes.
 *
 * @param userId      - For usage logging
 * @param topicTitle  - Topic to summarise
 * @param context     - Optional context (learning outcome, roadmap goal)
 * @returns Validated summary object
 */
export async function generateSummary(
  userId: string,
  topicTitle: string,
  context?: string
): Promise<SummaryOutput> {
  const prompt = buildGenerateSummaryPrompt({ topicTitle, context });
  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const { text, totalTokens } = await callGemini(contents, 0.6);

  const cleaned = stripJsonFences(text);
  const parsed = JSON.parse(cleaned);
  const validated = SummarySchema.parse(parsed);

  await logAIUsage(
    userId,
    "summary_gen",
    MODEL_NAME,
    totalTokens,
    estimateGeminiFlashCost(totalTokens)
  );

  return validated;
}

// ---------------------------------------------------------------------------
// curateResources
// ---------------------------------------------------------------------------

/**
 * Curate a list of learning resources for a topic.
 *
 * @param userId      - For usage logging
 * @param topicTitle  - Topic to find resources for
 * @param level       - Student's level (calibrates resource complexity)
 * @returns Array of validated resource objects
 */
export async function curateResources(
  userId: string,
  topicTitle: string,
  level: string
): Promise<ResourceOutput[]> {
  const prompt = `You are Marg AI, an expert educational resource curator.
Recommend exactly 4 high-quality learning resources for the topic below.
Each resource must be a DIFFERENT type: one video, one documentation page, one practice resource, and one reading.

## Topic
${topicTitle}

## Student Level
${level}

## Requirements
- Video: a real, well-known YouTube tutorial or course video (e.g., from channels like Traversy Media, Fireship, freeCodeCamp, CS50, The Net Ninja)
- Documentation: official documentation or a trusted reference (MDN, Python docs, React docs, etc.)
- Practice: a real coding practice link (LeetCode, HackerRank, Exercism, etc.)
- Reading: a high-quality article or guide (freeCodeCamp blog, dev.to, Medium, official guide)

## Required Output Format (strict JSON array, no markdown fences)
[
  {
    "type": "video",
    "title": "<descriptive title>",
    "url": "https://...",
    "source_platform": "YouTube"
  },
  {
    "type": "documentation",
    "title": "<descriptive title>",
    "url": "https://...",
    "source_platform": "<e.g. MDN>"
  },
  {
    "type": "practice",
    "title": "<descriptive title>",
    "url": "https://...",
    "source_platform": "<e.g. LeetCode>"
  },
  {
    "type": "reading",
    "title": "<descriptive title>",
    "url": "https://...",
    "source_platform": "<e.g. freeCodeCamp>"
  }
]

Return ONLY the JSON array. Do not include any explanation or text outside the JSON.`;

  const contents = [{ role: "user", parts: [{ text: prompt }] }];
  const { text, totalTokens } = await callGemini(contents, 0.4);

  const cleaned = stripJsonFences(text);
  const parsed = JSON.parse(cleaned);

  // Validate each resource in the array
  const validated = parsed.map((r: unknown) => ResourceSchema.parse(r));

  await logAIUsage(
    userId,
    "resource_curation",
    MODEL_NAME,
    totalTokens,
    estimateGeminiFlashCost(totalTokens)
  );

  return validated;
}
