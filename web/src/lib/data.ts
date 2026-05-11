import { prisma } from "@/lib/db";
import { ArticleCategory, Prisma, SourceLayer, SourceType } from "@prisma/client";

const ARTICLE_SELECT = {
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
} as const;

export type ArticleFilters = {
  category?: "All" | ArticleCategory;
  sourceType?: SourceType;
  layer?: SourceLayer;
  minRelevance?: number;
  tier?: "free" | "pro";
};

export async function getArticles(filters: ArticleFilters = {}, userId?: string) {
  const freeGateCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const where: Prisma.ArticleWhereInput = {
    duplicateOfId: null,
    ...(filters.tier !== "pro" ? { publishedAt: { lt: freeGateCutoff } } : {}),
  };

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.ignoredCategories?.length) {
      where.category = { notIn: user.ignoredCategories };
    }
    if (user?.likedCategories?.length && !filters.category) {
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
    select: ARTICLE_SELECT,
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
    select: ARTICLE_SELECT,
  });
}

export async function getTrendsPage(limit = 50) {
  return prisma.trend.findMany({
    orderBy: [{ velocity: "desc" }, { articleCount: "desc" }],
    take: limit,
  });
}
