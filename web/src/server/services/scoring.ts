export type SourceWeights = Record<string, number>;

// Registry weights (1..5) are the primary signal. Keep this config as fallback.
export const DEFAULT_SOURCE_WEIGHTS: SourceWeights = {
  OpenAI: 5,
  Anthropic: 5,
  DeepMind: 5,
  "Google AI": 4,
  "Microsoft AI Blog": 4,
  "Hugging Face": 5,
  GitHub: 5,
  Arxiv: 3,
  Mock: 2,
};

export function sourceWeight(source: string): number {
  return DEFAULT_SOURCE_WEIGHTS[source] ?? 3;
}

// 1..5 from engagement metrics (stars/upvotes/comments). Log-scaled.
export function engagementScore(params: {
  stars?: number | null;
  upvotes?: number | null;
  comments?: number | null;
}): number {
  const stars = params.stars ?? 0;
  const up = params.upvotes ?? 0;
  const com = params.comments ?? 0;

  // Weighted sum with diminishing returns.
  const raw = Math.log1p(stars) * 1.0 + Math.log1p(up) * 0.9 + Math.log1p(com) * 0.7;

  // Map typical ranges to 1..5.
  // raw ~0 => 1, raw ~4 => ~3, raw ~7 => ~4, raw ~10 => 5
  const score = 1 + (raw / 10) * 4;
  return clamp(score, 1, 5);
}

// Backward-compatible recency score (1..5). Used when engagement is missing.
export function recencyScore(publishedAt: Date | null | undefined): number {
  const now = Date.now();
  const ts = publishedAt?.getTime() ?? now;
  const ageHours = Math.max(0, (now - ts) / (1000 * 60 * 60));
  const score = 5 - Math.log1p(ageHours) / Math.log(2) * 0.6;
  return clamp(score, 1, 5);
}

// Final Score (requested):
// 0.5 * llm_score + 0.3 * source_weight + 0.2 * engagement_score
export function finalRelevanceScore(params: {
  llmScore: number; // 1..5
  sourceWeight: number; // 1..5
  engagementScore: number; // 1..5
}): number {
  const llm = clamp(params.llmScore, 1, 5);
  const src = clamp(params.sourceWeight, 1, 5);
  const eng = clamp(params.engagementScore, 1, 5);

  const final = 0.5 * llm + 0.3 * src + 0.2 * eng;
  return Number(clamp(final, 1, 5).toFixed(2));
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
