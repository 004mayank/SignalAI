import { prisma } from "@/lib/db";
import { scrapeGitHubTrending } from "@/server/sources/handlers/github-trending";

function startOfDayUTC(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export type TrendingScrapeResult = {
  scraped: number;
  upserted: number;
  errors: string[];
};

async function scrapeAndUpsert(
  since: "daily" | "weekly" | "monthly",
  date: Date,
): Promise<TrendingScrapeResult> {
  const repos = await scrapeGitHubTrending(since);

  if (repos.length === 0) {
    console.warn(`[trending] ${since} scrape returned 0 repos`);
    return { scraped: 0, upserted: 0, errors: [`No repos for ${since}`] };
  }

  let upserted = 0;
  const errors: string[] = [];

  for (const repo of repos) {
    try {
      await prisma.repoTrendingEntry.upsert({
        where: { repoFullName_since_date: { repoFullName: repo.fullName, since, date } },
        create: {
          repoFullName: repo.fullName,
          repoUrl: repo.repoUrl,
          rank: repo.rank,
          starsToday: repo.starsToday,
          totalStars: repo.totalStars,
          forks: repo.forks,
          language: repo.language,
          description: repo.description,
          since,
          date,
        },
        update: {
          rank: repo.rank,
          starsToday: repo.starsToday,
          totalStars: repo.totalStars,
          forks: repo.forks,
        },
      });
      upserted++;
    } catch (err) {
      errors.push(`${repo.fullName}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { scraped: repos.length, upserted, errors };
}

export async function runTrendingScrape(): Promise<Record<string, TrendingScrapeResult>> {
  const today = startOfDayUTC(new Date());

  const [daily, weekly, monthly] = await Promise.all([
    scrapeAndUpsert("daily", today),
    scrapeAndUpsert("weekly", today),
    scrapeAndUpsert("monthly", today),
  ]);

  console.log("[trending] daily:", daily.scraped, "weekly:", weekly.scraped, "monthly:", monthly.scraped);
  return { daily, weekly, monthly };
}
