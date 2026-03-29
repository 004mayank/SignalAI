import { z } from "zod";
import { getOpenAIClient } from "@/lib/openai";
import { truncate } from "@/lib/text";

export const ArticleAIResultSchema = z.object({
  tldr: z.string().min(1),
  what_happened: z.string().min(1),
  why_it_matters: z.string().min(1),
  use_case: z.string().min(1),
  category: z.enum(["Agents", "LLMs", "Infra", "UX", "Other"]),
  relevance_score: z.number().int().min(1).max(5),
  impact_level: z.enum(["High", "Medium", "Low"]),
  actionable_takeaway: z.string().min(1),
  target_persona: z.enum(["Dev", "PM", "Founder"]),
});

export type ArticleAIResult = z.infer<typeof ArticleAIResultSchema>;

export async function analyzeArticleWithLLM(params: {
  title: string;
  source: string;
  url: string;
  content: string;
}): Promise<ArticleAIResult> {
  const openai = getOpenAIClient();

  // If no OpenAI key is configured, fall back to a deterministic mock.
  if (!openai) {
    return {
      tldr: truncate(params.content || params.title, 180),
      what_happened: truncate(params.content || params.title, 260),
      why_it_matters: "Helps track meaningful changes in the AI ecosystem without reading everything.",
      use_case: "Use this as input to roadmap decisions, experiments, or tech evaluation.",
      category: "Other",
      relevance_score: 3,
      impact_level: "Medium",
      actionable_takeaway: "Bookmark this and decide if it impacts your roadmap or infra choices.",
      target_persona: "Dev",
    };
  }

  const system =
    "You are SignalAI, an AI trend intelligence analyst. " +
    "Given an AI-related update, extract structured, high-signal insights. " +
    "Be concise, factual, and avoid hype.";

  const user = `Title: ${params.title}\nSource: ${params.source}\nURL: ${params.url}\n\nContent:\n${truncate(
    params.content,
    6000,
  )}\n\nReturn JSON with keys: tldr, what_happened, why_it_matters, use_case, category, relevance_score, impact_level, actionable_takeaway, target_persona.`;

  // Use JSON mode to keep the output robust.
  const resp = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "SignalAIArticleAnalysis",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            tldr: { type: "string" },
            what_happened: { type: "string" },
            why_it_matters: { type: "string" },
            use_case: { type: "string" },
            category: {
              type: "string",
              enum: ["Agents", "LLMs", "Infra", "UX", "Other"],
            },
            relevance_score: { type: "integer", minimum: 1, maximum: 5 },
            impact_level: {
              type: "string",
              enum: ["High", "Medium", "Low"],
            },
            actionable_takeaway: { type: "string" },
            target_persona: { type: "string", enum: ["Dev", "PM", "Founder"] },
          },
          required: [
            "tldr",
            "what_happened",
            "why_it_matters",
            "use_case",
            "category",
            "relevance_score",
            "impact_level",
            "actionable_takeaway",
            "target_persona",
          ],
        },
      },
    },
  });

  const text = resp.output_text;
  const json = JSON.parse(text);
  return ArticleAIResultSchema.parse(json);
}
