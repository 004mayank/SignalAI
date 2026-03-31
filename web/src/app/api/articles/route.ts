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

  const where: Prisma.ArticleWhereInput = { duplicateOfId: null };
  if (parsed.category) where.category = parsed.category;
  if (parsed.source_type) where.sourceType = parsed.source_type;
  if (parsed.layer) where.layer = parsed.layer;
  if (minRelevance) where.finalScore = { gte: minRelevance };

  const articles = await prisma.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ articles, demo: false });
}
