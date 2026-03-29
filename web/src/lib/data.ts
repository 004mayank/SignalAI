import { prisma } from "@/lib/db";
import { ArticleCategory, Prisma } from "@prisma/client";

export type ArticleFilters = {
  category?: "All" | ArticleCategory;
  minRelevance?: number;
};

export async function getArticles(filters: ArticleFilters = {}) {
  const where: Prisma.ArticleWhereInput = {};
  if (filters.category && filters.category !== "All") where.category = filters.category;
  if (filters.minRelevance) where.relevanceScore = { gte: filters.minRelevance };

  return prisma.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getTrends() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const grouped = await prisma.article.groupBy({
    by: ["category"],
    _count: { _all: true },
    where: { createdAt: { gte: since } },
    orderBy: { _count: { category: "desc" } },
  });

  const byCategory = grouped.map((g) => ({
    category: g.category,
    count: typeof g._count === "object" ? (g._count._all ?? 0) : 0,
  }));

  return { since, byCategory };
}
