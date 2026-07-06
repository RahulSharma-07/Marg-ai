/**
 * Prompt template: generateRoadmap
 *
 * Produces a structured JSON learning roadmap based on the student's
 * assessment answers. The output is validated against RoadmapSchema.
 */

export interface GenerateRoadmapPromptParams {
  goal: string;
  level: string;
  studyHoursPerDay: string;
  learningStyle: string;
  primaryObjective: string;
}

/**
 * Build the prompt string for roadmap generation.
 */
export function buildGenerateRoadmapPrompt(
  params: GenerateRoadmapPromptParams
): string {
  const { goal, level, studyHoursPerDay, learningStyle, primaryObjective } =
    params;

  return `You are Marg AI, an expert educational curriculum designer.
A student has completed their onboarding assessment. Generate a complete, personalized learning roadmap for them.

## Student Profile
- **Goal:** ${goal}
- **Current Level:** ${level}
- **Daily Study Time:** ${studyHoursPerDay} hours
- **Learning Style:** ${learningStyle}
- **Primary Objective:** ${primaryObjective}

## Instructions
1. Design a roadmap with 8–20 topics ordered logically from foundational to advanced.
2. Group topics into weeks based on ${studyHoursPerDay} hours/day availability.
3. Each topic should be completable in a single study session where possible.
4. Prerequisites must reference exact topic titles from the same roadmap.
5. For a "${level}" learner, calibrate difficulty: don't start with advanced concepts.
6. Keep learning_outcome concrete and measurable (e.g., "Able to write a for-loop and iterate over a list").

## Required Output Format (strict JSON, no markdown fences)
{
  "title": "<roadmap title, e.g. 'Python for Web Development'>",
  "estimated_total_time": "<total duration, e.g. '6 weeks'>",
  "topics": [
    {
      "title": "<topic title>",
      "sequence_order": <integer starting at 1>,
      "difficulty": "<easy|medium|hard>",
      "estimated_time": "<e.g. '2 hours'>",
      "prerequisites": ["<topic title>", ...],
      "learning_outcome": "<concrete outcome>",
      "week_number": <integer starting at 1>
    }
  ]
}

Return ONLY the JSON object. Do not include any explanation, markdown, or text outside the JSON.`;
}
