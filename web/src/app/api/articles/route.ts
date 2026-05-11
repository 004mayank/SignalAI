import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

const CategorySchema = z.enum(["Agents", "LLMs", "Infra", "UX", "Other"]);

const SourceTypeSchema = z.enum([
  "rss",
  "arxiv",
  "github",
  "huggingface",
  "reddit",
  "hn",
  "producthunt",
]);
const LayerSchema = z.enum([
  "research",
  "labs",
  "builder",
  "community",
  "startup",
  "distribution",
]);

const QuerySchema = z.object({
  category: CategorySchema.optional(),
  source_type: SourceTypeSchema.optional(),
  layer: LayerSchema.optional(),
  min_relevance: z.string().optional(),
  limit: z.string().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.parse({
    category: url.searchParams.get("category") ?? undefined,
    source_type: url.searchParams.get("source_type") ?? undefined,
    layer: url.searchParams.get("layer") ?? undefined,
    min_relevance: url.searchParams.get("min_relevance") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  const minRelevance = parsed.min_relevance ? Number(parsed.min_relevance) : undefined;
  const limit = parsed.limit ? Math.min(100, Math.max(1, Number(parsed.limit))) : 50;

  // Freemium gate: free tier sees articles older than 48 hours.
  const tier = (req as Request & { headers: Headers }).headers.get("x-user-tier") ?? "free";
  const freeGateCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const where: Prisma.ArticleWhereInput = {
    duplicateOfId: null,
    ...(tier === "free" ? { publishedAt: { lt: freeGateCutoff } } : {}),
  };
  if (parsed.category) where.category = parsed.category;
  if (parsed.source_type) where.sourceType = parsed.source_type;
  if (parsed.layer) where.layer = parsed.layer;
  if (minRelevance) where.finalScore = { gte: minRelevance };

  const articles = await prisma.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      summary: true,
      whatHappened: true,
      whyItMatters: true,
      useCase: true,
      actionableTakeaway: true,
      impactLevel: true,
      targetPersona: true,
      category: true,
      llmScore: true,
      finalScore: true,
      clusterId: true,
      source: true,
      sourceType: true,
      layer: true,
      engagementStars: true,
      engagementUpvotes: true,
      engagementComments: true,
      url: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ articles, demo: false });
}
