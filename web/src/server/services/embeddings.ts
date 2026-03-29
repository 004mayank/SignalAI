import { getOpenAIClient } from "@/lib/openai";
import { truncate } from "@/lib/text";

export async function embedText(input: string): Promise<number[]> {
  const openai = getOpenAIClient();
  if (!openai) {
    // Deterministic pseudo-embedding fallback for local dev without API key.
    // DO NOT use in production; it exists to keep the system runnable.
    const seed = Array.from(truncate(input, 512)).reduce((a, c) => a + c.charCodeAt(0), 0);
    const dim = 256;
    return Array.from({ length: dim }, (_, i) => {
      const v = Math.sin(seed * (i + 1)) * 0.5 + Math.cos(seed / (i + 1)) * 0.5;
      return Number(v.toFixed(6));
    });
  }

  const resp = await openai.embeddings.create({
    model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    input: truncate(input, 8000),
  });

  return resp.data[0]?.embedding ?? [];
}
