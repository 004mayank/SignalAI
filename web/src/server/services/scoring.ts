export type SourceWeights = Record<string, number>;

// Keep this config simple + explicit for MVP. Later: move to DB.
export const DEFAULT_SOURCE_WEIGHTS: SourceWeights = {
  OpenAI: 0.95,
  Anthropic: 0.95,
  "Google AI": 0.9,
  DeepMind: 0.9,
  "Hugging Face": 0.85,
  Arxiv: 0.8,
  GitHub: 0.75,
  Mock: 0.6,
};

export function sourceWeight(source: string): number {
  return DEFAULT_SOURCE_WEIGHTS[source] ?? 0.7;
}

// 1..5 scale
export function recencyScore(publishedAt: Date | null | undefined): number {
  const now = Date.now();
  const ts = publishedAt?.getTime() ?? now;
  const ageHours = Math.max(0, (now - ts) / (1000 * 60 * 60));

  // Simple decay: 0h => 5, 24h => ~4, 72h => ~3, 168h => ~2
  const score = 5 - Math.log1p(ageHours) / Math.log(2) * 0.6;
  return clamp(score, 1, 5);
}

export function finalRelevanceScore(params: {
  llmScore: number; // 1..5
  sourceWeight: number; // 0..1
  recencyScore: number; // 1..5
}): number {
  const llm = clamp(params.llmScore, 1, 5);
  const src = clamp(params.sourceWeight, 0, 1) * 5;
  const rec = clamp(params.recencyScore, 1, 5);

  const final = 0.5 * llm + 0.3 * src + 0.2 * rec;
  return Number(clamp(final, 1, 5).toFixed(2));
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
