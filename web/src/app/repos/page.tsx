export const dynamic = "force-dynamic";

import Link from "next/link";
import { Shell } from "@/components/shell";
import { Topbar } from "@/components/topbar";
import { getGitHubRepos } from "@/lib/data";

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

function parseRepo(title: string): { owner: string; repo: string; description: string } {
  const slashIdx = title.indexOf("/");
  const colonIdx = title.indexOf(": ");
  if (slashIdx !== -1 && colonIdx !== -1 && colonIdx > slashIdx) {
    const fullName = title.slice(0, colonIdx);
    const parts = fullName.split("/");
    return {
      owner: parts[0] ?? "",
      repo: parts[1] ?? fullName,
      description: title.slice(colonIdx + 2).replace(/—/g, ",").trim(),
    };
  }
  return { owner: "", repo: title.slice(0, 60), description: "" };
}

function starDisplay(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function RepoCard(props: {
  article: {
    id: string;
    title: string;
    source: string;
    url: string;
    summary: string;
    category: string;
    finalScore: number;
    engagementStars: number | null;
    createdAt: Date;
  };
}) {
  const a = props.article;
  const { owner, repo, description } = parseRepo(a.title);
  const stars = a.engagementStars ?? 0;
  const isViral = VIRAL_SOURCE_NAMES.has(a.source);

  return (
    <Link
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition hover:bg-white/[0.07] hover:border-white/10"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 truncate">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span className="font-medium text-zinc-400">{owner}</span>
            <span className="text-zinc-600">/</span>
            <span className="font-semibold text-zinc-300 group-hover:text-white transition truncate">{repo}</span>
          </div>
          {description && (
            <p className="mt-1.5 line-clamp-2 text-sm text-zinc-400 leading-snug">{description}</p>
          )}
        </div>

        {/* Stars */}
        <div className="shrink-0 flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 ring-1 ring-white/10">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="text-yellow-400">
            <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
          </svg>
          <span className="text-xs font-semibold text-zinc-200">{starDisplay(stars)}</span>
        </div>
      </div>

      {/* Summary */}
      {a.summary && (
        <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">{a.summary}</p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400 ring-1 ring-white/10">
          {a.category}
        </span>
        {isViral && (
          <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-300 ring-1 ring-orange-400/20">
            Rising fast
          </span>
        )}
        <span className="ml-auto text-[10px] text-zinc-600 truncate max-w-[140px]">{a.source}</span>
      </div>
    </Link>
  );
}

export default async function ReposPage(props: {
  searchParams: Promise<{ category?: string; viral?: string; days?: string }>;
}) {
  const sp = await props.searchParams;
  const allowedCats = ["Agents", "LLMs", "Infra", "UX", "Other"] as const;
  const category = allowedCats.find((c) => c === sp.category);
  const viralOnly = sp.viral === "1";
  const allowedDays = [7, 30, 90];
  const days = allowedDays.includes(Number(sp.days)) ? Number(sp.days) : 30;
  const activeCategory = (sp.category ?? "All") as CategoryTab;

  const [allRepos, risingRepos] = await Promise.all([
    getGitHubRepos({ category, viralOnly, days, limit: 80 }),
    viralOnly ? Promise.resolve([]) : getGitHubRepos({ viralOnly: true, days: 14, limit: 12 }),
  ]);

  function buildUrl(params: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (params.category && params.category !== "All") next.set("category", params.category);
    if (params.viral) next.set("viral", params.viral);
    if (params.days && params.days !== "30") next.set("days", params.days);
    const qs = next.toString();
    return `/repos${qs ? `?${qs}` : ""}`;
  }

  return (
    <Shell>
      <div className="space-y-8">
        <Topbar />

        {/* Hero */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" className="text-zinc-400">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">GitHub Discovery</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            AI Repos Worth <span className="text-cyan-200">Watching</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Every AI-relevant GitHub repo we track — agents, LLMs, tools, infra — scored for relevance and surfaced early. Updated every ingest cycle.
          </p>
        </section>

        {/* Rising fast section */}
        {risingRepos.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">Rising fast</span>
              </div>
              <Link
                href={buildUrl({ viral: "1", days: "14" })}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {risingRepos.slice(0, 6).map((r) => (
                <RepoCard key={r.id} article={r} />
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1">
              {CATEGORY_TABS.map((cat) => (
                <Link
                  key={cat}
                  href={buildUrl({ category: cat, days: String(days) })}
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

            <div className="ml-auto flex items-center gap-2">
              {/* Days filter */}
              {[7, 30, 90].map((d) => (
                <Link
                  key={d}
                  href={buildUrl({ category: activeCategory, days: String(d) })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    days === d
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {d}d
                </Link>
              ))}
            </div>
          </div>

          {/* Count */}
          <div className="mb-4 text-xs text-zinc-600">
            {allRepos.length} repo{allRepos.length !== 1 ? "s" : ""}
            {viralOnly ? " · viral only" : ""}
          </div>

          {allRepos.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/5 p-8 text-center text-sm text-zinc-500">
              No GitHub repos ingested yet. Run <code className="font-mono text-cyan-400">POST /api/ingest</code> to populate.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {allRepos.map((r) => (
                <RepoCard key={r.id} article={r} />
              ))}
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
