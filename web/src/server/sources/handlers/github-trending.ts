import * as cheerio from "cheerio";

export type TrendingRepo = {
  fullName: string;   // "owner/repo"
  repoUrl: string;    // "https://github.com/owner/repo"
  description: string;
  language: string | null;
  totalStars: number;
  forks: number;
  starsToday: number;
  rank: number;
};

function parseNum(text: string): number {
  const m = text.match(/([\d,]+)/);
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : 0;
}

export async function scrapeGitHubTrending(
  since: "daily" | "weekly" | "monthly" = "daily",
): Promise<TrendingRepo[]> {
  const url =
    since === "daily"
      ? "https://github.com/trending"
      : `https://github.com/trending?since=${since}`;

  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    },
  });

  if (!resp.ok) throw new Error(`GitHub trending fetch failed: ${resp.status}`);
  const html = await resp.text();

  const $ = cheerio.load(html);
  const repos: TrendingRepo[] = [];

  $("article.Box-row").each((i, el) => {
    const rank = i + 1;

    // Repo full name from h2 link
    const href = $(el).find("h2 a").first().attr("href") ?? "";
    const fullName = href.replace(/^\//, "").trim();
    if (!fullName || !/^[^/]+\/[^/]+$/.test(fullName)) return;

    const repoUrl = `https://github.com/${fullName}`;

    const description = $(el).find("p").first().text().trim();
    const language =
      $(el).find("[itemprop='programmingLanguage']").first().text().trim() ||
      null;

    // Use contains selector — GitHub's trending page sometimes omits the exact
    // full-path href depending on how they render the stats row.
    const totalStars = parseNum(
      $(el).find('a[href*="/stargazers"]').first().text(),
    );
    const forks = parseNum(
      $(el).find('a[href*="/network/members"]').first().text(),
    );

    // GitHub trending shows "X stars today" or "X stars this week/month"
    const starsToday = parseNum($(el).find(".float-sm-right").text());

    repos.push({
      fullName,
      repoUrl,
      description,
      language,
      totalStars,
      forks,
      starsToday,
      rank,
    });
  });

  return repos;
}
