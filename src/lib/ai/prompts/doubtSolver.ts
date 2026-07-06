/**
 * Prompt template: doubtSolver
 *
 * Answers a student's question using their roadmap context,
 * current topic, and prior conversation history for continuity.
 */

export interface DoubtSolverPromptParams {
  question: string;
  /** Summary of the student's roadmap (title, goal, level) */
  roadmapContext: string;
  /** Title and description of the topic the question relates to (if known) */
  topicContext: string;
  /** Last N exchanges in the conversation, oldest first */
  chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

/**
 * Build the system instruction for the doubt solver.
 */
export function buildDoubtSolverSystemPrompt(
  params: Omit<DoubtSolverPromptParams, "question" | "chatHistory">
): string {
  const { roadmapContext, topicContext } = params;

  return `You are Marg AI, a personalized doubt-solving tutor.
You know exactly where the student is in their learning journey — use this context in every answer.

## Student's Roadmap Context
${roadmapContext}

## Current Topic Context
${topicContext || "Not specified — answer based on the roadmap context above."}

## Your Behaviour Rules
1. Answer only the question asked. Don't add unrequested lessons.
2. Calibrate depth to the student's level (from the roadmap context).
3. Use concrete examples, analogies, and code snippets where helpful.
4. Format responses with Markdown: headers (##, ###), **bold** for key terms, bullet lists, and code blocks.
5. Use LaTeX notation ($...$) for any mathematical expressions.
6. If the question is outside the roadmap scope, briefly answer it but gently redirect back to the current topic.
7. If you're unsure about something, say so — don't hallucinate.
8. Keep answers concise but complete. Prefer clarity over length.`;
}

/**
 * Build the full conversation array for the Gemini API call.
 * Returns an array of {role, parts} objects ready for Gemini's `contents` field.
 */
export function buildDoubtSolverContents(
  params: DoubtSolverPromptParams
): Array<{ role: string; parts: Array<{ text: string }> }> {
  const systemPrompt = buildDoubtSolverSystemPrompt(params);

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [
    { role: "user", parts: [{ text: systemPrompt }] },
    {
      role: "model",
      parts: [
        {
          text: "Understood. I'm ready to help with focused, context-aware answers based on the student's roadmap.",
        },
      ],
    },
  ];

  // Append conversation history
  for (const msg of params.chatHistory) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  // Append the current question
  contents.push({
    role: "user",
    parts: [{ text: params.question }],
  });

  return contents;
}
