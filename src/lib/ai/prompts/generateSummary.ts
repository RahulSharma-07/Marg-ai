/**
 * Prompt template: generateSummary
 *
 * Generates a structured summary for a completed topic including
 * explanation, key concepts, interview questions, and common mistakes.
 * Output is validated against SummarySchema.
 */

export interface GenerateSummaryPromptParams {
  topicTitle: string;
  /** Optional additional context — e.g., the learning outcome or roadmap goal */
  context?: string;
}

/**
 * Build the prompt string for summary generation.
 */
export function buildGenerateSummaryPrompt(
  params: GenerateSummaryPromptParams
): string {
  const { topicTitle, context } = params;

  const contextSection = context
    ? `\n## Additional Context\n${context}\n`
    : "";

  return `You are Marg AI, an expert educational content creator.
Generate a comprehensive yet concise study summary for the following topic.
${contextSection}
## Topic
${topicTitle}

## Instructions
1. **Explanation**: Write a clear, plain-language explanation (3–5 sentences) as if explaining to someone at an intermediate level.
2. **Key Concepts**: List the 5–8 most important concepts or terms the student must understand to master this topic.
3. **Interview Questions**: Provide 4–6 realistic technical interview questions that test understanding of this topic. Include a brief model answer in parentheses after each question.
4. **Common Mistakes**: List 3–5 common mistakes or misconceptions beginners make when learning this topic.

## Required Output Format (strict JSON, no markdown fences)
{
  "explanation": "<plain text explanation>",
  "key_concepts": [
    "<concept 1>",
    "<concept 2>"
  ],
  "interview_questions": [
    "<question 1> (Model answer: <brief answer>)",
    "<question 2> (Model answer: <brief answer>)"
  ],
  "common_mistakes": [
    "<mistake 1>",
    "<mistake 2>"
  ]
}

Return ONLY the JSON object. Do not include any explanation or text outside the JSON.`;
}
