import { prisma } from "@/lib/db";
import { ArticleCategory } from "@prisma/client";
import { cosineSimilarity, meanVector } from "@/server/services/similarity";
import { getOpenAIClient } from "@/lib/openai";

export async function assignCluster(params: {
  category: ArticleCategory;
  embedding: number[];
  threshold?: number;
}): Promise<{ clusterId: string; similarity: number; createdNew: boolean }> {
  const threshold = params.threshold ?? 0.8;

  const clusters = await prisma.trendCluster.findMany({
    where: { category: params.category },
    select: { id: true, centroid: true },
  });

  let best: { id: string; sim: number } | null = null;
  for (const c of clusters) {
    const sim = cosineSimilarity(params.embedding, c.centroid);
    if (!best || sim > best.sim) best = { id: c.id, sim };
  }

  if (best && best.sim >= threshold) {
    return { clusterId: best.id, similarity: best.sim, createdNew: false };
  }

  // Create new cluster.
  const created = await prisma.trendCluster.create({
    data: {
      id: crypto.randomUUID(),
      category: params.category,
      centroid: params.embedding,
    },
  });

  return { clusterId: created.id, similarity: best?.sim ?? 0, createdNew: true };
}

export async function updateClusterCentroid(clusterId: string) {
  const recent = await prisma.article.findMany({
    where: { clusterId, duplicateOfId: null },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: { embedding: true },
  });

  const vectors = recent.map((r) => r.embedding);
  const centroid = meanVector(vectors);
  if (centroid.length === 0) return;

  await prisma.trendCluster.update({
    where: { id: clusterId },
    data: { centroid },
  });
}

export async function upsertTrendForCluster(params: {
  clusterId: string;
  category: ArticleCategory;
}): Promise<void> {
  // Compute current article count
  const articleCount = await prisma.article.count({
    where: { clusterId: params.clusterId, duplicateOfId: null },
  });

  const existing = await prisma.trend.findUnique({ where: { clusterId: params.clusterId } });
  if (!existing) {
    const meta = await generateTrendMeta(params.clusterId);
    await prisma.trend.create({
      data: {
        clusterId: params.clusterId,
        category: params.category,
        name: meta.name,
        summary: meta.summary,
        articleCount,
      },
    });
    return;
  }

  // Refresh meta occasionally.
  if (articleCount >= existing.articleCount + 5) {
    const meta = await generateTrendMeta(params.clusterId);
    await prisma.trend.update({
      where: { id: existing.id },
      data: {
        name: meta.name,
        summary: meta.summary,
        articleCount,
      },
    });
  } else {
    await prisma.trend.update({
      where: { id: existing.id },
      data: { articleCount },
    });
  }
}

async function generateTrendMeta(clusterId: string): Promise<{ name: string; summary: string }> {
  const openai = getOpenAIClient();

  const reps = await prisma.article.findMany({
    where: { clusterId, duplicateOfId: null },
    orderBy: [{ finalScore: "desc" }, { createdAt: "desc" }],
    take: 8,
    select: { title: true, summary: true },
  });

  const titles = reps.map((r) => `- ${r.title}`).join("\n");

  if (!openai) {
    return {
      name: reps[0]?.title?.slice(0, 60) ?? "Emerging trend",
      summary: reps[0]?.summary ?? "Clustered AI updates that appear to be related.",
    };
  }

  const prompt = `You are naming an AI ecosystem trend from a cluster of related updates.\n\nTitles:\n${titles}\n\nReturn JSON: {"name": "...", "summary": "..."}.\nRules: name <= 60 chars, summary <= 220 chars, no hype.`;

  const resp = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [{ role: "user", content: prompt }],
    text: {
      format: {
        type: "json_schema",
        name: "TrendMeta",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: { name: { type: "string" }, summary: { type: "string" } },
          required: ["name", "summary"],
        },
      },
    },
  });

  const json = JSON.parse(resp.output_text);
  return {
    name: String(json.name).slice(0, 60),
    summary: String(json.summary).slice(0, 220),
  };
}
