import { prisma } from "@/lib/db";
import { computeVelocityPercent } from "./trend-stats";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Backfill TrendStat records for a single trend by counting actual articles
 * per calendar day (using publishedAt) for the last `lookbackDays` days.
 * Then recompute and persist velocity on the Trend record.
 */
async function backfillTrendStats(
  trendId: string,
  clusterId: string,
  lookbackDays = 14,
) {
  const today = startOfDay(new Date());

  for (let i = 0; i < lookbackDays; i++) {
    const dayStart = new Date(today);
    dayStart.setDate(today.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const count = await prisma.article.count({
      where: {
        clusterId,
        duplicateOfId: null,
        publishedAt: { gte: dayStart, lt: dayEnd },
      },
    });

    // Only upsert days that actually have articles to keep TrendStat lean
    if (count > 0) {
      await prisma.trendStat.upsert({
        where: { trendId_date: { trendId, date: dayStart } },
        create: { trendId, date: dayStart, articleCount: count },
        update: { articleCount: count },
      });
    }
  }
}

export type RecalcResult = {
  total: number;
  updated: number;
  velocities: Array<{ trendId: string; name: string; velocity: number }>;
};

/**
 * Backfill TrendStat history from real article data, then recompute
 * and persist velocity for every Trend in the database.
 */
export async function recalcAllVelocities(): Promise<RecalcResult> {
  const trends = await prisma.trend.findMany({
    select: { id: true, clusterId: true, name: true },
  });

  const velocities: RecalcResult["velocities"] = [];

  for (const trend of trends) {
    await backfillTrendStats(trend.id, trend.clusterId);
    const v = await computeVelocityPercent(trend.id);
    await prisma.trend.update({
      where: { id: trend.id },
      data: { velocity: v },
    });
    velocities.push({ trendId: trend.id, name: trend.name, velocity: v });
  }

  const updated = velocities.filter((t) => t.velocity !== 0).length;

  return { total: trends.length, updated, velocities };
}
