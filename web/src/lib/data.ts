import { prisma } from "@/lib/db";
import { ArticleCategory, Prisma, SourceLayer, SourceType } from "@prisma/client";

export type ArticleFilters = {
  category?: "All" | ArticleCategory;
  sourceType?: SourceType;
  layer?: SourceLayer;
  minRelevance?: number;
};

export async function getArticles(filters: ArticleFilters = {}, userId?: string) {
  const where: Prisma.ArticleWhereInput = { duplicateOfId: null };

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.ignoredCategories?.length) {
      where.category = { notIn: user.ignoredCategories };
    }
    if (user?.likedCategories?.length && !filters.category) {
      // Light personalization: boost liked categories by filtering to them when no explicit filter is set.
      where.category = { in: user.likedCategories };
    }
  }
  if (filters.category && filters.category !== "All") where.category = filters.category;
  if (filters.sourceType) where.sourceType = filters.sourceType;
  if (filters.layer) where.layer = filters.layer;
  if (filters.minRelevance) where.finalScore = { gte: filters.minRelevance };

  return prisma.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getTrendingNow(limit = 3) {
  return prisma.trend.findMany({
    orderBy: [{ velocity: "desc" }, { articleCount: "desc" }],
    take: limit,
  });
}

export async function getInsightOfTheDay() {
  return prisma.article.findFirst({
    where: { duplicateOfId: null },
    orderBy: [{ finalScore: "desc" }, { createdAt: "desc" }],
  });
}

export async function getTrendsPage(limit = 50) {
  return prisma.trend.findMany({
    orderBy: [{ velocity: "desc" }, { articleCount: "desc" }],
    take: limit,
  });
}
