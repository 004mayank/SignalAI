import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

// All date arithmetic uses UTC to avoid DST shifts and timezone-dependent
// day boundaries. The database stores timestamps in UTC so comparisons are exact.
function startOfDayUTC(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export async function upsertTodayTrendStat(trendId: string, clusterId: string) {
  const today = startOfDayUTC(new Date());
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);

  const count = await prisma.article.count({
    where: {
      clusterId,
      duplicateOfId: null,
      createdAt: { gte: today, lt: tomorrow },
    },
  });

  // Prisma's upsert is not atomic (SELECT then INSERT/UPDATE) so concurrent
  // calls for the same (trendId, date) can race and hit the unique constraint.
  // Catch P2002 and fall back to a plain UPDATE — the row was just created by
  // the concurrent caller, so we know it exists.
  try {
    await prisma.trendStat.upsert({
      where: { trendId_date: { trendId, date: today } },
      create: { trendId, date: today, articleCount: count },
      update: { articleCount: count },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      await prisma.trendStat.update({
        where: { trendId_date: { trendId, date: today } },
        data: { articleCount: count },
      });
    } else {
      throw e;
    }
  }
}

export async function computeVelocityPercent(trendId: string): Promise<number> {
  const today = startOfDayUTC(new Date());

  const currentStart = new Date(today);
  currentStart.setUTCDate(today.getUTCDate() - 7);

  const prevStart = new Date(today);
  prevStart.setUTCDate(today.getUTCDate() - 14);

  // Include today in the current window so intra-day velocity isn't understated.
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const current = await prisma.trendStat.aggregate({
    where: { trendId, date: { gte: currentStart, lt: tomorrow } },
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
