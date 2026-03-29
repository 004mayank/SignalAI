export const dynamic = "force-dynamic";

import { Shell } from "@/components/shell";
import { SidebarFilters } from "@/components/sidebar-filters";
import { ArticleCard } from "@/components/article-card";
import { getArticles, getInsightOfTheDay, getTrendingNow } from "@/lib/data";

export default async function FeedPage(props: {
  searchParams: Promise<{ category?: string; min?: string }>;
}) {
  const sp = await props.searchParams;
  const allowed = ["Agents", "LLMs", "Infra", "UX", "Other"] as const;
  const category = allowed.find((c) => c === sp.category);
  const minRelevance = sp.min ? Number(sp.min) : 1;

  const [articles, trending, insight] = await Promise.all([
    getArticles({ category, minRelevance }),
    getTrendingNow(3),
    getInsightOfTheDay(),
  ]);

  return (
    <Shell>
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <SidebarFilters />
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">AI Feed</h1>
              <p className="mt-1 text-sm text-zinc-500">
                High-signal updates with AI summaries and actionable takeaways.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Trending now
              </div>
              <div className="mt-3 space-y-3">
                {trending.length === 0 ? (
                  <div className="text-sm text-zinc-500">No trends yet. Ingest a few articles.</div>
                ) : (
                  trending.map((t) => (
                    <div key={t.id} className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/40">
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {t.category} • {t.articleCount} articles
                      </div>
                      <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                        {t.summary}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Insight of the day
              </div>
              <div className="mt-3">
                {insight ? (
                  <ArticleCard article={insight} />
                ) : (
                  <div className="text-sm text-zinc-500">No articles yet.</div>
                )}
              </div>
            </div>
          </div>

          {articles.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              No articles yet. Seed data via <code className="font-mono">POST /api/seed</code> or ingest RSS via <code className="font-mono">POST /api/ingest</code>.
            </div>
          ) : (
            <div className="grid gap-4">
              {articles.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
