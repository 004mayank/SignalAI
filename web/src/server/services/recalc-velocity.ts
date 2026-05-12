import { prisma } from "@/lib/db";

export type RecalcResult = {
  total: number;
  updated: number;
  velocities: Array<{
    trendId: string;
    name: string;
    velocity: number;
    avgScore: number;
    articleCount: number;
  }>;
};

/**
 * Compute velocity for every Trend using a normalized signal-strength score:
 *
 *  signal = avg(finalScore) of non-duplicate articles in the cluster
 *           × log(1 + articleCount)   ← rewards clusters with more articles
 *
 * Then normalize linearly so the strongest cluster = 1.0 (100%) and the
 * weakest = 0.0 (0%).  This gives a stable, meaningful range even when
 * we don't yet have enough temporal history for week-over-week velocity.
 *
 * Once temporal data accumulates (14+ days), the ingestion pipeline's
 * computeVelocityPercent() will provide true growth rates.
 */
export async function recalcAllVelocities(): Promise<RecalcResult> {
  const trends = await prisma.trend.findMany({
    select: { id: true, clusterId: true, name: true },
  });

  // Aggregate finalScore and article count per cluster in one pass
  const clusterStats = await Promise.all(
    trends.map(async (trend) => {
      const agg = await prisma.article.aggregate({
        where: { clusterId: trend.clusterId, duplicateOfId: null },
        _avg: { finalScore: true },
        _count: { id: true },
      });
      const avgScore = agg._avg.finalScore ?? 0;
      const count = agg._count.id;
      // Weight by article count so clusters with more coverage rank higher
      const signal = avgScore * Math.log1p(count);
      return { trend, avgScore, count, signal };
    }),
  );

  const signals = clusterStats.map((s) => s.signal);
  const minSignal = Math.min(...signals);
  const maxSignal = Math.max(...signals);
  const range = maxSignal - minSignal || 1;

  const velocities: RecalcResult["velocities"] = [];

  await Promise.all(
    clusterStats.map(async ({ trend, avgScore, count, signal }) => {
      const velocity = (signal - minSignal) / range; // 0–1
      await prisma.trend.update({
        where: { id: trend.id },
        data: { velocity },
      });
      velocities.push({
        trendId: trend.id,
        name: trend.name,
        velocity,
        avgScore,
        articleCount: count,
      });
    }),
  );

  velocities.sort((a, b) => b.velocity - a.velocity);
  const updated = velocities.filter((t) => t.velocity > 0).length;
  return { total: trends.length, updated, velocities };
}
