export const dynamic = "force-dynamic";

import Link from "next/link";
import { Shell } from "@/components/shell";
import { ArticleCard } from "@/components/article-card";
import { Topbar } from "@/components/topbar";
import { TrendingGrid } from "@/components/trending-grid";
import { getArticles, getInsightOfTheDay } from "@/lib/data";

export default async function FeedPage(props: {
  searchParams: Promise<{
    category?: string; min?: string; source_type?: string; layer?: string;
    days?: string; search?: string; page?: string; per_page?: string;
  }>;
}) {
  const sp = await props.searchParams;
  const allowed = ["Agents", "LLMs", "Infra", "UX", "Other"] as const;
  const category = allowed.find((c) => c === sp.category);
  const minRelevance = sp.min ? Number(sp.min) : 1;

  const allowedSourceTypes = [
    "rss", "arxiv", "github", "huggingface", "reddit", "hn", "producthunt", "twitter",
  ] as const;
  const sourceType = allowedSourceTypes.find((t) => t === sp.source_type);

  const allowedLayers = [
    "research", "labs", "builder", "community", "startup", "distribution",
  ] as const;
  const layer = allowedLayers.find((l) => l === sp.layer);

  const allowedDays = [1, 7, 30, 90] as const;
  const days = allowedDays.find((d) => d === Number(sp.days)) ?? 1;
  const search = sp.search?.trim() || undefined;

  const perPage = [10, 15, 20].includes(Number(sp.per_page)) ? Number(sp.per_page) : 10;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const [articles, insight] = await Promise.all([
    getArticles({ category, minRelevance, sourceType, layer, days, search }),
    getInsightOfTheDay(),
  ]);

  const trendingArticles = [...articles]
    .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))
    .slice(0, 5);
  const trendingIds = new Set(trendingArticles.map((a) => a.id));
  const insightId = insight?.id;
  const feedArticles = articles.filter((a) => !trendingIds.has(a.id) && a.id !== insightId);

  const totalPages = Math.max(1, Math.ceil(feedArticles.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageArticles = feedArticles.slice((safePage - 1) * perPage, safePage * perPage);

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (sp.category) params.set("category", sp.category);
    if (sp.min) params.set("min", sp.min);
    if (sp.source_type) params.set("source_type", sp.source_type);
    if (sp.layer) params.set("layer", sp.layer);
    if (sp.days) params.set("days", sp.days);
    if (sp.search) params.set("search", sp.search);
    if (sp.per_page) params.set("per_page", sp.per_page);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/feed${qs ? `?${qs}` : ""}`;
  }

  return (
    <Shell sidebarFilters={true}>
      <div className="space-y-10">
        <Topbar />

        <section className="mt-2">
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl">
            Decoding the <span className="text-cyan-200">Next Frequency</span>
            <br />
            of Artificial Intelligence.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
            High-signal insights extracted from the global noise. Updated continuously as new sources are ingested.
          </p>
        </section>

        <TrendingGrid articles={trendingArticles} />

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              ✦ Insights of the day
            </div>
            {feedArticles.length > 0 && (
              <div className="text-xs text-zinc-600">
                {feedArticles.length} signal{feedArticles.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-4">
            {safePage === 1 && insight ? <ArticleCard article={insight} /> : null}

            {articles.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-sm text-zinc-400">
                No articles yet. Ingest RSS via <code className="font-mono">POST /api/ingest</code>.
              </div>
            ) : (
              pageArticles.map((a) => <ArticleCard key={a.id} article={a} />)
            )}
          </div>

          {/* Pagination */}
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
                    if (p === 2 || p === totalPages - 1) {
                      return <span key={p} className="text-xs text-zinc-700 px-1">…</span>;
                    }
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
