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
  days?: number;   // 1 | 7 | 30 | 90, defaults to 1 (Today)
  search?: string; // title full-text search
};

export async function getArticles(filters: ArticleFilters = {}, userId?: string) {
  const days = filters.days && [1, 7, 30, 90].includes(filters.days) ? filters.days : 7;
  const recencyCutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const where: Prisma.ArticleWhereInput = {
    duplicateOfId: null,
    createdAt: { gte: recencyCutoff },
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
  if (filters.search?.trim()) {
    where.title = { contains: filters.search.trim(), mode: "insensitive" };
  }

  return prisma.article.findMany({
    where,
    orderBy: { publishedAt: "desc" },
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
  const recencyCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return prisma.article.findFirst({
    where: { duplicateOfId: null, publishedAt: { gte: recencyCutoff } },
    orderBy: [{ finalScore: "desc" }, { publishedAt: "desc" }],
    select: ARTICLE_SELECT,
  });
}

export async function getArticleById(id: string) {
  return prisma.article.findUnique({
    where: { id },
    select: ARTICLE_SELECT,
  });
}

export async function getTrendsPage(limit = 50) {
  return prisma.trend.findMany({
    orderBy: [{ velocity: "desc" }, { articleCount: "desc" }],
    take: limit,
  });
}

export async function getTrendDetail(id: string) {
  const trend = await prisma.trend.findUnique({
    where: { id },
    include: {
      stats: { orderBy: { date: "asc" }, take: 14 },
    },
  });
  if (!trend) return null;

  const articles = await prisma.article.findMany({
    where: { clusterId: trend.clusterId, duplicateOfId: null },
    orderBy: [{ finalScore: "desc" }, { publishedAt: "desc" }],
    take: 20,
    select: ARTICLE_SELECT,
  });

  return { trend, articles };
}

// Viral source names — repos surfaced by flash/trend detection queries.
const VIRAL_SOURCE_NAMES = new Set([
  "GitHub Viral AI Agents",
  "GitHub Viral LLMs",
  "GitHub Rising AI Tools",
  "GitHub Trending AI",
  "GitHub New MCP Tools",
  "GitHub Flash Viral AI",
  "GitHub Flash Viral Agents",
  "GitHub Flash New MCP",
  "GitHub Surging AI",
]);

export type GitHubRepoFilters = {
  category?: "Agents" | "LLMs" | "Infra" | "UX" | "Other";
  viralOnly?: boolean;
  days?: number;
  limit?: number;
  minStars?: number;
};

export async function getGitHubRepos(filters: GitHubRepoFilters = {}) {
  const days = filters.days ?? 30;
  const limit = filters.limit ?? 60;
  const recencyCutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const where: Prisma.ArticleWhereInput = {
    sourceType: "github",
    duplicateOfId: null,
    createdAt: { gte: recencyCutoff },
  };

  if (filters.category) where.category = filters.category;
  if (filters.viralOnly) where.source = { in: Array.from(VIRAL_SOURCE_NAMES) };
  if (filters.minStars) where.engagementStars = { gte: filters.minStars };

  const repos = await prisma.article.findMany({
    where,
    orderBy: [{ engagementStars: "desc" }, { finalScore: "desc" }],
    take: limit,
    select: ARTICLE_SELECT,
  });

  return repos;
}
