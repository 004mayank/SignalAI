import { prisma } from "@/lib/db";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function upsertTodayTrendStat(trendId: string, clusterId: string) {
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const count = await prisma.article.count({
    where: {
      clusterId,
      duplicateOfId: null,
      createdAt: { gte: today, lt: tomorrow },
    },
  });

  await prisma.trendStat.upsert({
    where: { trendId_date: { trendId, date: today } },
    create: { trendId, date: today, articleCount: count },
    update: { articleCount: count },
  });
}

export async function computeVelocityPercent(trendId: string): Promise<number> {
  const today = startOfDay(new Date());

  const currentStart = new Date(today);
  currentStart.setDate(currentStart.getDate() - 7);

  const prevStart = new Date(today);
  prevStart.setDate(prevStart.getDate() - 14);

  const current = await prisma.trendStat.aggregate({
    where: { trendId, date: { gte: currentStart, lt: today } },
    _sum: { articleCount: true },
  });

  const previous = await prisma.trendStat.aggregate({
    where: { trendId, date: { gte: prevStart, lt: currentStart } },
    _sum: { articleCount: true },
  });

  const c = current._sum.articleCount ?? 0;
  const p = previous._sum.articleCount ?? 0;
  if (p === 0) return c === 0 ? 0 : 1; // treat as 100% if emerging

  return (c - p) / p;
}

export function formatVelocity(v: number): string {
  const pct = Math.round(v * 100);
  if (pct === 0) return "0%";
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}
