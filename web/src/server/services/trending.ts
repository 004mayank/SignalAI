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

export async function runTrendingScrape(): Promise<TrendingScrapeResult> {
  const today = startOfDayUTC(new Date());
  const repos = await scrapeGitHubTrending("daily");

  if (repos.length === 0) {
    console.warn("[trending] scrape returned 0 repos — GitHub may have changed layout");
    return { scraped: 0, upserted: 0, errors: ["No repos scraped — possible layout change"] };
  }

  let upserted = 0;
  const errors: string[] = [];

  for (const repo of repos) {
    try {
      await prisma.repoTrendingEntry.upsert({
        where: {
          repoFullName_since_date: {
            repoFullName: repo.fullName,
            since: "daily",
            date: today,
          },
        },
        create: {
          repoFullName: repo.fullName,
          repoUrl: repo.repoUrl,
          rank: repo.rank,
          starsToday: repo.starsToday,
          totalStars: repo.totalStars,
          forks: repo.forks,
          language: repo.language,
          description: repo.description,
          since: "daily",
          date: today,
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

  console.log(`[trending] scraped=${repos.length} upserted=${upserted} errors=${errors.length}`);
  return { scraped: repos.length, upserted, errors };
}
