/**
 * Prompt template: generateMindmap
 *
 * Creates a visual mindmap structure (nodes + edges) for a given topic.
 * The output is validated against MindmapSchema before being persisted.
 */

export interface GenerateMindmapPromptParams {
  topicTitle: string;
  /** Optional summary text to anchor the mindmap concepts */
  summary?: string;
}

/**
 * Build the prompt string for mindmap generation.
 */
export function buildGenerateMindmapPrompt(
  params: GenerateMindmapPromptParams
): string {
  const { topicTitle, summary } = params;

  const summarySection = summary
    ? `\n## Topic Summary (use this to anchor the concepts)\n${summary}\n`
    : "";

  return `You are Marg AI, an expert at creating clear educational mind maps.
Generate a mind map for the following topic to help students visualise the concept landscape.

## Topic
${topicTitle}
${summarySection}
## Instructions
1. The root node should be the topic title itself.
2. Create 4–8 main concept nodes branching from the root.
3. Each main concept can have 2–4 sub-concept nodes.
4. Keep node labels short (3–6 words maximum).
5. Edges should connect parent nodes to their children.
6. Use meaningful, descriptive labels (not generic "relates to").

## Required Output Format (strict JSON, no markdown fences)
{
  "nodes": [
    { "id": "root", "label": "${topicTitle}", "level": 0 },
    { "id": "n1", "label": "<main concept>", "level": 1 },
    { "id": "n1_1", "label": "<sub concept>", "level": 2 }
  ],
  "edges": [
    { "source": "root", "target": "n1", "label": "includes" },
    { "source": "n1", "target": "n1_1", "label": "uses" }
  ]
}

Return ONLY the JSON object. Do not include any explanation or text outside the JSON.`;
}
