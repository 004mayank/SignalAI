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
    "You are SignalAI, a strict AI signal intelligence analyst. " +
    "Your primary job is to REJECT noise and only pass through genuine AI technology signals. " +
    "\n\n" +
    "ACCEPT (is_ai_relevant: true):\n" +
    "- New AI models, model releases, fine-tunes, or quantisations with real capability\n" +
    "- AI agent frameworks, tools, and real deployments (not announcements)\n" +
    "- AI infrastructure: GPUs, TPUs, inference optimisation, serving systems\n" +
    "- Research papers on LLMs, agents, reasoning, multimodal, RLHF, alignment\n" +
    "- AI product launches where AI is the core feature, not a buzzword\n" +
    "- Real-world AI deployments with measurable outcomes\n" +
    "- AI safety, security exploits using AI, AI policy with direct technical impact\n" +
    "\n" +
    "REJECT (is_ai_relevant: false) — even if from an AI community:\n" +
    "- Conference logistics, visa issues, scheduling, travel\n" +
    "- Job postings, hiring threads, internship announcements\n" +
    "- Community meta: AMA announcements, reading groups, self-promotion threads\n" +
    "- General software engineering not specific to AI (Docker, WASM, general security)\n" +
    "- Marketing copy: 'X tips to...', 'how brands use AI', case studies without technical depth\n" +
    "- Social media / platform news (TikTok bans, Instagram features) unless AI is central\n" +
    "- Opinion pieces, vague commentary, doom/hype posts without factual substance\n" +
    "- Corporate partnerships, data-center expansions, country investments without AI model/product news\n" +
    "- Events, courses, meetups, webinars\n" +
    "\n" +
    "Be strict. When in doubt, reject. One strong signal is worth ten weak ones. " +
    "Be concise, factual, and avoid hype. Never use em-dashes in output.";

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
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`LLM returned invalid JSON for article analysis: ${text.slice(0, 200)}`);
  }

  // Lenient parse: coerce enum values and fall back on invalid/missing fields so
  // a single wrong enum value from the LLM doesn't silently discard the article.
  const LenientSchema = z.object({
    is_ai_relevant: z.boolean().catch(false),
    tldr: z.string().catch(""),
    what_happened: z.string().catch(""),
    why_it_matters: z.string().catch(""),
    use_case: z.string().catch(""),
    category: z.enum(["Agents", "LLMs", "Infra", "UX", "Other"]).catch("Other"),
    relevance_score: z.number().int().min(1).max(5).catch(1),
    impact_level: z.enum(["High", "Medium", "Low"]).catch("Low"),
    actionable_takeaway: z.string().catch(""),
    target_persona: z.enum(["Dev", "PM", "Founder"]).catch("Dev"),
  });
  const result = LenientSchema.parse(json);
  return {
    is_ai_relevant: result.is_ai_relevant,
    tldr: result.tldr || "No summary available.",
    what_happened: result.what_happened || result.tldr || "No details available.",
    why_it_matters: result.why_it_matters || "Significance not assessed.",
    use_case: result.use_case || "No use case identified.",
    category: result.category,
    relevance_score: result.relevance_score,
    impact_level: result.impact_level,
    actionable_takeaway: result.actionable_takeaway || "Review and evaluate applicability.",
    target_persona: result.target_persona,
  };
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

  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(resp.choices[0]?.message?.content ?? "{}");
  } catch {
    // Malformed JSON — fall through to field-level fallbacks below.
  }

  const str = (v: unknown, fallback: string): string =>
    typeof v === "string" && v.length > 0 ? v : fallback;

  return {
    introduction: str(raw.introduction, params.summary),
    what_happened_deep: str(raw.what_happened_deep, params.whatHappened ?? params.summary),
    bigger_picture: str(raw.bigger_picture, params.whyItMatters ?? ""),
    technical_deep_dive: str(raw.technical_deep_dive, ""),
    real_world_applications: Array.isArray(raw.real_world_applications)
      ? (raw.real_world_applications as string[])
      : [params.useCase ?? ""],
    what_to_do_now: Array.isArray(raw.what_to_do_now)
      ? (raw.what_to_do_now as string[])
      : [params.actionableTakeaway ?? ""],
    key_quote: str(raw.key_quote, params.summary),
  };
}

// Wrap unstable_cache so the article ID is part of the cache key.
// The bare ["deep-article"] key caused every article to share one cache slot —
// the second article viewed would silently return the first article's deep dive.
export function generateDeepArticle(params: Parameters<typeof _generateDeepArticle>[0]) {
  return unstable_cache(
    _generateDeepArticle,
    ["deep-article", params.id],
    { revalidate: 86400 },
  )(params);
}
