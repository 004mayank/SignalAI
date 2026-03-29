import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Basic trends: count articles by category + top "high relevance" in last 7 days.
export async function GET() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const byCategory = await prisma.article.groupBy({
    by: ["category"],
    _count: { _all: true },
    where: { createdAt: { gte: since } },
    // Prisma v6: order by count of the grouped field (equivalent to total count here)
    orderBy: { _count: { category: "desc" } },
  });

  const top = await prisma.article.findMany({
    where: { createdAt: { gte: since }, relevanceScore: { gte: 4 } },
    orderBy: [{ relevanceScore: "desc" }, { createdAt: "desc" }],
    take: 10,
    select: {
      id: true,
      title: true,
      source: true,
      url: true,
      category: true,
      relevanceScore: true,
      summary: true,
      whyItMatters: true,
      createdAt: true,
    },
  });

  const trendHighlights = byCategory.map((c) => ({
    category: c.category,
    count: c._count._all,
    label: `${c.category} rising`,
  }));

  return NextResponse.json({
    since: since.toISOString(),
    trendHighlights,
    byCategory,
    top,
  });
}
