import { z } from "zod";
import { unstable_cache } from "next/cache";
import { getOpenAIClient } from "@/lib/openai";
import { truncate } from "@/lib/text";

export const ArticleAIResultSchema = z.object({
  is_ai_relevant: z.boolean(),
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
      is_ai_relevant: true,
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
    "You are SignalAI, an AI trend intelligence analyst and strict content filter. " +
    "Your job is to extract insights from genuine AI technology news AND to reject noise. " +
    "AI-relevant content includes: new models, papers, research breakthroughs, AI tools/frameworks/libraries, " +
    "product launches with AI at the core, AI infrastructure, agent systems, and applied AI use cases. " +
    "NOT AI-relevant: conference logistics, visa issues, job postings, community drama, general programming " +
    "unrelated to AI, opinion pieces without new technical substance, events/meetups, and off-topic posts " +
    "that happen to appear in AI communities. Be strict — when in doubt, mark as not relevant. " +
    "Be concise, factual, and avoid hype.";

  const user = `Title: ${params.title}\nSource: ${params.source}\nURL: ${params.url}\n\nContent:\n${truncate(
    params.content,
    6000,
  )}\n\nReturn JSON with exactly these keys and constraints:
- is_ai_relevant: boolean — true ONLY if this is genuinely about AI technology, models, tools, research, or direct AI applications. false for logistics, visa issues, job posts, community meta, events, or anything not substantively about AI itself.
- tldr: string (1-2 sentences)
- what_happened: string (factual summary)
- why_it_matters: string (significance)
- use_case: string (practical application)
- category: MUST be exactly one of: "Agents", "LLMs", "Infra", "UX", "Other"
- relevance_score: integer from 1 to 5 (1=low, 5=high) — MUST NOT exceed 5. Score 1-2 for tangentially related content, 3-4 for solid AI news, 5 only for major breakthroughs.
- impact_level: MUST be exactly one of: "High", "Medium", "Low"
- actionable_takeaway: string (what to do with this)
- target_persona: MUST be exactly one of: "Dev", "PM", "Founder"`;

  // Use JSON mode to keep the output robust.
  const resp = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  });

  const text = resp.choices[0]?.message?.content ?? "{}";
  const json = JSON.parse(text);
  return ArticleAIResultSchema.parse(json);
}

export type DeepArticle = {
  introduction: string;
  what_happened_deep: string;
  bigger_picture: string;
  technical_deep_dive: string;
  real_world_applications: string[];
  what_to_do_now: string[];
  key_quote: string;
};

async function _generateDeepArticle(params: {
  id: string;
  title: string;
  source: string;
  url: string;
  category: string;
  impactLevel: string;
  targetPersona: string;
  summary: string;
  whatHappened: string | null;
  whyItMatters: string | null;
  useCase: string | null;
  actionableTakeaway: string | null;
}): Promise<DeepArticle> {
  const openai = getOpenAIClient();

  // Fallback: expand the stored fields into readable prose without calling the LLM.
  if (!openai) {
    return {
      introduction: params.summary,
      what_happened_deep: params.whatHappened ?? params.summary,
      bigger_picture: params.whyItMatters ?? "This development represents a meaningful shift in the AI landscape.",
      technical_deep_dive: `From a ${params.targetPersona} perspective, this is a ${params.impactLevel.toLowerCase()}-impact development in the ${params.category} category. ${params.whyItMatters ?? ""}`,
      real_world_applications: [params.useCase ?? "Evaluate how this applies to your current roadmap."],
      what_to_do_now: [params.actionableTakeaway ?? "Bookmark and revisit when planning your next sprint."],
      key_quote: params.summary,
    };
  }

  const system =
    "You are a senior AI analyst writing a deep-dive signal brief for SignalAI, a platform that helps " +
    "developers, PMs, and founders navigate the AI landscape. " +
    "Write like a cross between a Stratechery analysis and a technical engineering blog. " +
    "Be specific, insightful, and opinionated. Avoid filler. Write in flowing prose for narrative sections. " +
    "Do not use markdown headers or bullet symbols in prose sections, just well-structured paragraphs. " +
    "CRITICAL: Never use em-dashes (the character —) anywhere in your output. Use commas, colons, or rewrite the sentence instead.";

  const user = `Write a comprehensive deep-dive signal brief about this AI development.

Title: ${params.title}
Source: ${params.source}
Category: ${params.category}
Impact: ${params.impactLevel}
Primary audience: ${params.targetPersona}

Known facts:
- Summary: ${params.summary}
- What happened: ${params.whatHappened ?? "see summary"}
- Why it matters: ${params.whyItMatters ?? "see summary"}
- Use case: ${params.useCase ?? "see summary"}
- Actionable takeaway: ${params.actionableTakeaway ?? "see summary"}

Return JSON with exactly these keys:
- introduction: 3-4 sentence compelling opening paragraph that hooks the reader and frames why this moment matters. No hype.
- what_happened_deep: 4-6 sentences of detailed, factual explanation of what occurred — include specifics like numbers, names, timelines where relevant.
- bigger_picture: 4-6 sentences analyzing the broader strategic and industry implications. What does this signal about where AI is heading?
- technical_deep_dive: 5-8 sentences of technical depth appropriate for a ${params.targetPersona}. Include implementation considerations, architectural implications, or strategic decisions this creates.
- real_world_applications: array of exactly 4 concrete, specific application scenarios (each a 1-2 sentence string — not generic, be specific to this development)
- what_to_do_now: array of exactly 4 specific, actionable next steps (each a 1-2 sentence string — concrete actions, not vague advice)
- key_quote: one punchy 1-sentence insight that captures the essence of why this matters. Should be quotable.`;

  const resp = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  });

  const raw = JSON.parse(resp.choices[0]?.message?.content ?? "{}");

  return {
    introduction: raw.introduction ?? params.summary,
    what_happened_deep: raw.what_happened_deep ?? params.whatHappened ?? params.summary,
    bigger_picture: raw.bigger_picture ?? params.whyItMatters ?? "",
    technical_deep_dive: raw.technical_deep_dive ?? "",
    real_world_applications: Array.isArray(raw.real_world_applications) ? raw.real_world_applications : [params.useCase ?? ""],
    what_to_do_now: Array.isArray(raw.what_to_do_now) ? raw.what_to_do_now : [params.actionableTakeaway ?? ""],
    key_quote: raw.key_quote ?? params.summary,
  };
}

export const generateDeepArticle = unstable_cache(
  _generateDeepArticle,
  ["deep-article"],
  { revalidate: 86400 }, // cache for 24h per article
);
