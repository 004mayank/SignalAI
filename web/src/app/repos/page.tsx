export const dynamic = "force-dynamic";

import Link from "next/link";
import { Shell } from "@/components/shell";
import {
  getGitHubRepos,
  getTrendingRepos,
  getTrending90d,
  getTrendingCountsMap,
  type RepoTrendingMeta,
  type Trending90dEntry,
} from "@/lib/data";

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

const CATEGORY_TABS = ["All", "Agents", "LLMs", "Infra", "UX", "Other"] as const;
type CategoryTab = (typeof CATEGORY_TABS)[number];

const CURRENT_YEAR = new Date().getFullYear();

function cleanText(s: string): string {
  return s.replace(/[—–]/g, "-").trim();
}

function parseRepo(title: string): { owner: string; repo: string; description: string } {
  const slashIdx = title.indexOf("/");
  const colonIdx = title.indexOf(": ");
  if (slashIdx !== -1 && colonIdx !== -1 && colonIdx > slashIdx) {
    const fullName = title.slice(0, colonIdx);
    const parts = fullName.split("/");
    return { owner: parts[0] ?? "", repo: parts[1] ?? fullName, description: cleanText(title.slice(colonIdx + 2)) };
  }
  return { owner: "", repo: cleanText(title.slice(0, 60)), description: "" };
}

function starDisplay(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── GitHub icon ───────────────────────────────────────────────────────────────
function GithubIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

// ── Trending today card (ranked, from scraper) ────────────────────────────────
type TrendingEntry = {
  id: string;
  repoFullName: string;
  repoUrl: string;
  rank: number;
  starsToday: number;
  totalStars: number;
  forks: number;
  language: string | null;
  description: string | null;
  since: string;
};

function TrendingTodayCard({ entry }: { entry: TrendingEntry }) {
  const parts = entry.repoFullName.split("/");
  const owner = parts[0] ?? "";
  const repo = parts[1] ?? entry.repoFullName;

  return (
    <a
      href={entry.repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition hover:bg-white/[0.07] hover:border-white/10"
    >
      {/* Rank badge */}
      <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 text-xs font-bold text-zinc-400">
        #{entry.rank}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <GithubIcon />
              <span className="font-medium text-zinc-400">{owner}</span>
              <span className="text-zinc-600">/</span>
              <span className="font-semibold text-zinc-200 group-hover:text-white transition truncate">{repo}</span>
            </div>
            {entry.description && (
              <p className="mt-1.5 line-clamp-2 text-sm text-zinc-400 leading-snug">
                {entry.description}
              </p>
            )}
          </div>

          {/* Stars + Forks */}
          <div className="shrink-0 flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 ring-1 ring-white/10">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="text-yellow-400">
                <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
              </svg>
              <span className="text-xs font-semibold text-zinc-200">{starDisplay(entry.totalStars)}</span>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 ring-1 ring-white/10">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="text-zinc-500">
                <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              <span className="text-xs font-semibold text-zinc-400">{starDisplay(entry.forks)}</span>
            </div>
          </div>
        </div>

        {/* Footer badges */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {entry.language && (
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-white/10">
              {entry.language}
            </span>
          )}
          {entry.starsToday > 0 && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
              ↑ {starDisplay(entry.starsToday)} {entry.since === "weekly" ? "this week" : entry.since === "monthly" ? "this month" : "today"}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

// ── 90-day streak card ────────────────────────────────────────────────────────
function Trending90dCard({ entry }: { entry: Trending90dEntry }) {
  const parts = entry.repoFullName.split("/");
  const owner = parts[0] ?? "";
  const repo = parts[1] ?? entry.repoFullName;

  return (
    <a
      href={entry.repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition hover:bg-white/[0.07] hover:border-white/10"
    >
      <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 text-xs font-bold text-zinc-400">
        #{entry.rank}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <GithubIcon />
              <span className="font-medium text-zinc-400">{owner}</span>
              <span className="text-zinc-600">/</span>
              <span className="font-semibold text-zinc-200 group-hover:text-white transition truncate">{repo}</span>
            </div>
            {entry.description && (
              <p className="mt-1.5 line-clamp-2 text-sm text-zinc-400 leading-snug">{entry.description}</p>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 ring-1 ring-white/10">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="text-yellow-400">
                <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
              </svg>
              <span className="text-xs font-semibold text-zinc-200">{starDisplay(entry.totalStars)}</span>
            </div>
            {entry.forks > 0 && (
              <div className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 ring-1 ring-white/10">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="text-zinc-500">
                  <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                <span className="text-xs font-semibold text-zinc-400">{starDisplay(entry.forks)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {entry.language && (
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-white/10">
              {entry.language}
            </span>
          )}
          <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-300 ring-1 ring-purple-400/20">
            {entry.trendingDays}d trending
          </span>
          <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] text-zinc-400 ring-1 ring-white/10">
            best rank #{entry.bestRank}
          </span>
          {entry.totalStarsGained > 0 && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
              ↑ {starDisplay(entry.totalStarsGained)} total
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

// ── AI repo card (from our scored articles) ───────────────────────────────────
type ArticleShape = {
  id: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  category: string;
  finalScore: number;
  engagementStars: number | null;
  engagementUpvotes: number | null;
  createdAt: Date;
  repoCreatedAt: Date | null;
};

function RepoCard(props: {
  article: ArticleShape;
  trending: RepoTrendingMeta | null;
}) {
  const a = props.article;
  const t = props.trending;
  const { owner, repo, description } = parseRepo(a.title);
  const stars = a.engagementStars ?? 0;
  const forks = a.engagementUpvotes ?? 0;
  const isViral = VIRAL_SOURCE_NAMES.has(a.source);
  const isNew = a.repoCreatedAt ? a.repoCreatedAt.getFullYear() >= CURRENT_YEAR : false;
  const summary = cleanText(a.summary ?? "");

  return (
    <Link
      href={`/article/${a.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition hover:bg-white/[0.07] hover:border-white/10"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 truncate">
            <GithubIcon />
            <span className="font-medium text-zinc-400">{owner}</span>
            <span className="text-zinc-600">/</span>
            <span className="font-semibold text-zinc-300 group-hover:text-white transition truncate">{repo}</span>
          </div>
          {description && (
            <p className="mt-1.5 line-clamp-2 text-sm text-zinc-400 leading-snug">{description}</p>
          )}
        </div>

        {/* Stars + Forks */}
        <div className="shrink-0 flex items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 ring-1 ring-white/10">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="text-yellow-400">
              <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
            </svg>
            <span className="text-xs font-semibold text-zinc-200">{starDisplay(stars)}</span>
          </div>
          {forks > 0 && (
            <div className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 ring-1 ring-white/10">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="text-zinc-500">
                <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              <span className="text-xs font-semibold text-zinc-400">{starDisplay(forks)}</span>
            </div>
          )}
        </div>
      </div>

      {summary && (
        <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">{summary}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400 ring-1 ring-white/10">
          {a.category}
        </span>
        {isNew && (
          <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300 ring-1 ring-cyan-400/20">
            NEW {CURRENT_YEAR}
          </span>
        )}
        {isViral && (
          <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-300 ring-1 ring-orange-400/20">
            Rising fast
          </span>
        )}
        {t && t.trendingDays > 0 && (
          <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold text-purple-300 ring-1 ring-purple-400/20">
            Trending {t.trendingDays}d
          </span>
        )}
        {t && t.bestStarsToday > 0 && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
            ↑ {starDisplay(t.bestStarsToday)} today
          </span>
        )}
        <span className="ml-auto text-[10px] text-zinc-600 truncate max-w-[140px]">{a.source}</span>
      </div>
    </Link>
  );
}

const MIN_STARS_OPTIONS = [
  { label: "Any", value: 0 },
  { label: "100+", value: 100 },
  { label: "1k+", value: 1000 },
  { label: "10k+", value: 10000 },
] as const;

export default async function ReposPage(props: {
  searchParams: Promise<{
    category?: string;
    viral?: string;
    days?: string;
    page?: string;
    per_page?: string;
    min_stars?: string;
  }>;
}) {
  const sp = await props.searchParams;

  const allowedCats = ["Agents", "LLMs", "Infra", "UX", "Other"] as const;
  const category = allowedCats.find((c) => c === sp.category);
  const viralOnly = sp.viral === "1";
  const activeCategory = (sp.category ?? "All") as CategoryTab;

  const rawDays = Number(sp.days ?? "7");
  const trendingSince =
    rawDays === 1 ? "daily" :
    rawDays === 7 ? "weekly" :
    rawDays === 30 ? "monthly" : null;
  const show90dTrending = rawDays === 90;
  const trendingLabel =
    rawDays === 1 ? "GitHub Trending Today" :
    rawDays === 7 ? "GitHub Trending This Week" :
    rawDays === 30 ? "GitHub Trending This Month" :
    rawDays === 90 ? "Trending Streak — Last 90 Days" : null;
  const days = [1, 7, 30, 90].includes(rawDays) ? Math.max(rawDays, 7) : 7;

  const allowedMinStars = [0, 100, 1000, 10000];
  const minStars = allowedMinStars.includes(Number(sp.min_stars)) ? Number(sp.min_stars) : 0;

  const perPage = [10, 15, 20].includes(Number(sp.per_page)) ? Number(sp.per_page) : 10;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const [todayTrending, trending90d, allRepos, risingRepos] = await Promise.all([
    trendingSince ? getTrendingRepos(trendingSince) : Promise.resolve([]),
    show90dTrending ? getTrending90d() : Promise.resolve([]),
    getGitHubRepos({ category, viralOnly, days, limit: 500, minStars: minStars || undefined }),
    viralOnly ? Promise.resolve([]) : getGitHubRepos({ viralOnly: true, days: 14, limit: 6 }),
  ]);

  const trendingCounts = await getTrendingCountsMap(allRepos.map((r) => r.url));

  const totalPages = Math.max(1, Math.ceil(allRepos.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageRepos = allRepos.slice((safePage - 1) * perPage, safePage * perPage);

  function buildUrl(params: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (params.category && params.category !== "All") next.set("category", params.category);
    if (params.viral) next.set("viral", params.viral);
    if (sp.days) next.set("days", sp.days);
    if (sp.per_page) next.set("per_page", sp.per_page);
    if (sp.min_stars && sp.min_stars !== "0") next.set("min_stars", sp.min_stars);
    if (params.page && params.page !== "1") next.set("page", params.page);
    const qs = next.toString();
    return `/repos${qs ? `?${qs}` : ""}`;
  }

  function pageUrl(p: number) {
    const next = new URLSearchParams();
    if (sp.category && sp.category !== "All") next.set("category", sp.category);
    if (sp.viral) next.set("viral", sp.viral);
    if (sp.days) next.set("days", sp.days);
    if (sp.per_page) next.set("per_page", sp.per_page);
    if (sp.min_stars && sp.min_stars !== "0") next.set("min_stars", sp.min_stars);
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return `/repos${qs ? `?${qs}` : ""}`;
  }

  function daysUrl(val: number) {
    const next = new URLSearchParams();
    if (sp.category && sp.category !== "All") next.set("category", sp.category);
    if (sp.viral) next.set("viral", sp.viral);
    if (val !== 7) next.set("days", String(val));
    if (sp.per_page) next.set("per_page", sp.per_page);
    if (sp.min_stars && sp.min_stars !== "0") next.set("min_stars", sp.min_stars);
    const qs = next.toString();
    return `/repos${qs ? `?${qs}` : ""}`;
  }

  function perPageUrl(val: number) {
    const next = new URLSearchParams();
    if (sp.category && sp.category !== "All") next.set("category", sp.category);
    if (sp.viral) next.set("viral", sp.viral);
    if (sp.days) next.set("days", sp.days);
    if (val !== 10) next.set("per_page", String(val));
    if (sp.min_stars && sp.min_stars !== "0") next.set("min_stars", sp.min_stars);
    const qs = next.toString();
    return `/repos${qs ? `?${qs}` : ""}`;
  }

  function starsUrl(val: number) {
    const next = new URLSearchParams();
    if (sp.category && sp.category !== "All") next.set("category", sp.category);
    if (sp.viral) next.set("viral", sp.viral);
    if (sp.days) next.set("days", sp.days);
    if (sp.per_page) next.set("per_page", sp.per_page);
    if (val > 0) next.set("min_stars", String(val));
    const qs = next.toString();
    return `/repos${qs ? `?${qs}` : ""}`;
  }

  return (
    <Shell>
      <div className="space-y-8">
        {/* Hero */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <GithubIcon />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">GitHub Discovery</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            AI Repos Worth <span className="text-cyan-200">Watching</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            GitHub&apos;s trending AI repos ranked and scored. Updated daily.
          </p>
        </section>

        {/* Time filter + per-page */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {([{ label: "Today", value: 1 }, { label: "7d", value: 7 }, { label: "30d", value: 30 }, { label: "90d", value: 90 }] as const).map(({ label, value }) => (
              <Link
                key={value}
                href={daysUrl(value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  rawDays === value
                    ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-500">Show</span>
            {([10, 15, 20] as const).map((n) => (
              <Link
                key={n}
                href={perPageUrl(n)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  perPage === n
                    ? "bg-white/10 text-zinc-200 ring-1 ring-white/20"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {n}
              </Link>
            ))}
          </div>
        </div>

        {/* GitHub Trending section */}
        {todayTrending.length > 0 && trendingLabel && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                {trendingLabel}
              </span>
              <span className="ml-auto text-[11px] text-zinc-600">{todayTrending.length} repos</span>
            </div>
            <div className="flex flex-col gap-2">
              {todayTrending.map((entry) => (
                <TrendingTodayCard key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        )}

        {/* 90-day streak section */}
        {show90dTrending && trending90d.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">
                Trending Streak — Last 90 Days
              </span>
              <span className="ml-auto text-[11px] text-zinc-600">{trending90d.length} repos</span>
            </div>
            <div className="flex flex-col gap-2">
              {trending90d.map((entry) => (
                <Trending90dCard key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        )}

        {/* Rising fast */}
        {risingRepos.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">Rising fast</span>
              </div>
              <Link
                href={buildUrl({ viral: "1" })}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition"
              >
                View all
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {risingRepos.map((r) => (
                <RepoCard
                  key={r.id}
                  article={r}
                  trending={trendingCounts.get(r.url) ?? null}
                />
              ))}
            </div>
          </section>
        )}

        {/* Main grid */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap gap-1">
              {CATEGORY_TABS.map((cat) => (
                <Link
                  key={cat}
                  href={buildUrl({ category: cat })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    activeCategory === cat
                      ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/30"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-500 mr-1">Min stars</span>
              {MIN_STARS_OPTIONS.map(({ label, value }) => (
                <Link
                  key={value}
                  href={starsUrl(value)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    minStars === value
                      ? "bg-yellow-400/15 text-yellow-200 ring-1 ring-yellow-400/30"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mb-4 text-xs text-zinc-600">
            {allRepos.length} repo{allRepos.length !== 1 ? "s" : ""}
            {viralOnly ? " · viral only" : ""}
            {totalPages > 1 && ` · page ${safePage} of ${totalPages}`}
          </div>

          {allRepos.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/5 p-8 text-center text-sm text-zinc-500">
              No GitHub repos ingested yet. Run <code className="font-mono text-cyan-400">POST /api/ingest</code> to populate.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pageRepos.map((r) => (
                <RepoCard
                  key={r.id}
                  article={r}
                  trending={trendingCounts.get(r.url) ?? null}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between gap-4">
              <Link
                href={pageUrl(safePage - 1)}
                aria-disabled={safePage === 1}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors ${
                  safePage === 1
                    ? "pointer-events-none border-white/5 text-zinc-700"
                    : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Previous
              </Link>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const isActive = p === safePage;
                  const isNearby = Math.abs(p - safePage) <= 1 || p === 1 || p === totalPages;
                  if (!isNearby) {
                    if (p === 2 || p === totalPages - 1) return <span key={p} className="text-xs text-zinc-700 px-1">…</span>;
                    return null;
                  }
                  return (
                    <Link
                      key={p}
                      href={pageUrl(p)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {p}
                    </Link>
                  );
                })}
              </div>

              <Link
                href={pageUrl(safePage + 1)}
                aria-disabled={safePage === totalPages}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors ${
                  safePage === totalPages
                    ? "pointer-events-none border-white/5 text-zinc-700"
                    : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                }`}
              >
                Next
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
