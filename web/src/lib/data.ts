import { prisma } from "@/lib/db";
import { ArticleCategory, Prisma, SourceLayer, SourceType } from "@prisma/client";

function startOfDayUTC(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

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

export async function getTrendsPage(limit = 200) {
  return prisma.trend.findMany({
    where: { articleCount: { gte: 2 } },
    orderBy: [{ articleCount: "desc" }, { velocity: "desc" }],
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

export type RepoTrendingMeta = {
  trendingDays: number;    // days on trending in last 30 days
  bestStarsToday: number;  // max stars gained in a single day
  bestRank: number | null; // lowest rank seen (best = smallest number)
};

const AI_KEYWORDS = [
  "ai", "llm", "gpt", "claude", "gemini", "anthropic", "openai", "mistral",
  "llama", "agent", "agentic", "ml", "nlp", "neural", "transformer",
  "chatbot", "chatgpt", "langchain", "rag", "embedding", "vector",
  "inference", "fine-tun", "mcp", "copilot", "codex", "diffusion",
  "hugging", "multimodal", "reasoning", "alignment",
];

function isAiRelevant(fullName: string, description: string | null): boolean {
  const text = `${fullName} ${description ?? ""}`.toLowerCase();
  return AI_KEYWORDS.some((kw) => text.includes(kw));
}

export async function getTrendingRepos(since: "daily" | "weekly" | "monthly") {
  const today = startOfDayUTC(new Date());

  // Try today first; if the cron hasn't run yet, fall back to the most recent date.
  let all = await prisma.repoTrendingEntry.findMany({
    where: { since, date: today },
    orderBy: { rank: "asc" },
    take: 25,
  });

  if (all.length === 0) {
    const latest = await prisma.repoTrendingEntry.findFirst({
      where: { since },
      orderBy: { date: "desc" },
      select: { date: true },
    });
    if (latest) {
      all = await prisma.repoTrendingEntry.findMany({
        where: { since, date: latest.date },
        orderBy: { rank: "asc" },
        take: 25,
      });
    }
  }

  return all.filter((r) => isAiRelevant(r.repoFullName, r.description));
}

export type Trending90dEntry = {
  id: string;
  repoFullName: string;
  repoUrl: string;
  rank: number;
  trendingDays: number;     // days seen on trending in last 90d
  bestRank: number;         // best (lowest) rank achieved
  totalStarsGained: number; // sum of starsToday across all appearances
  totalStars: number;
  forks: number;
  language: string | null;
  description: string | null;
};

export async function getTrending90d(): Promise<Trending90dEntry[]> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const entries = await prisma.repoTrendingEntry.findMany({
    where: { since: "daily", date: { gte: ninetyDaysAgo } },
    orderBy: { date: "desc" },
  });

  const map = new Map<string, Trending90dEntry>();
  for (const e of entries) {
    const ex = map.get(e.repoFullName);
    if (!ex) {
      map.set(e.repoFullName, {
        id: e.id,
        repoFullName: e.repoFullName,
        repoUrl: e.repoUrl,
        rank: 0,
        trendingDays: 1,
        bestRank: e.rank,
        totalStarsGained: e.starsToday,
        totalStars: e.totalStars,
        forks: e.forks,
        language: e.language,
        description: e.description,
      });
    } else {
      map.set(e.repoFullName, {
        ...ex,
        trendingDays: ex.trendingDays + 1,
        bestRank: Math.min(ex.bestRank, e.rank),
        totalStarsGained: ex.totalStarsGained + e.starsToday,
      });
    }
  }

  return Array.from(map.values())
    .filter((r) => isAiRelevant(r.repoFullName, r.description))
    .sort((a, b) => b.trendingDays - a.trendingDays || a.bestRank - b.bestRank)
    .map((r, i) => ({ ...r, rank: i + 1 }))
    .slice(0, 25);
}

export async function getTrendingCountsMap(
  urls: string[],
): Promise<Map<string, RepoTrendingMeta>> {
  if (urls.length === 0) return new Map();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const entries = await prisma.repoTrendingEntry.findMany({
    where: { repoUrl: { in: urls }, since: "daily", date: { gte: thirtyDaysAgo } },
    select: { repoUrl: true, rank: true, starsToday: true },
  });
  const map = new Map<string, RepoTrendingMeta>();
  for (const e of entries) {
    const ex = map.get(e.repoUrl);
    if (!ex) {
      map.set(e.repoUrl, { trendingDays: 1, bestStarsToday: e.starsToday, bestRank: e.rank });
    } else {
      map.set(e.repoUrl, {
        trendingDays: ex.trendingDays + 1,
        bestStarsToday: Math.max(ex.bestStarsToday, e.starsToday),
        bestRank: Math.min(ex.bestRank ?? e.rank, e.rank),
      });
    }
  }
  return map;
}

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
    orderBy: [{ createdAt: "desc" }, { engagementStars: "desc" }],
    take: limit,
    select: { ...ARTICLE_SELECT, repoCreatedAt: true },
  });

  return repos;
}
