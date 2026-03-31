export const dynamic = "force-dynamic";

import { Shell } from "@/components/shell";
import { ArticleCard } from "@/components/article-card";
import { Topbar } from "@/components/topbar";
import { TrendingGrid } from "@/components/trending-grid";
import { getArticles, getInsightOfTheDay } from "@/lib/data";

export default async function FeedPage(props: {
  searchParams: Promise<{ category?: string; min?: string; source_type?: string; layer?: string }>;
}) {
  const sp = await props.searchParams;
  const allowed = ["Agents", "LLMs", "Infra", "UX", "Other"] as const;
  const category = allowed.find((c) => c === sp.category);
  const minRelevance = sp.min ? Number(sp.min) : 1;

  const allowedSourceTypes = [
    "rss",
    "arxiv",
    "github",
    "huggingface",
    "reddit",
    "hn",
    "producthunt",
  ] as const;
  const sourceType = allowedSourceTypes.find((t) => t === sp.source_type);

  const allowedLayers = [
    "research",
    "labs",
    "builder",
    "community",
    "startup",
    "distribution",
  ] as const;
  const layer = allowedLayers.find((l) => l === sp.layer);

  const [articles, insight] = await Promise.all([
    getArticles({ category, minRelevance, sourceType, layer }),
    getInsightOfTheDay(),
  ]);

  const trendingArticles = [...articles]
    .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))
    .slice(0, 5);

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
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            ✦ Insights of the day
          </div>

          <div className="mt-4 space-y-4">
            {insight ? <ArticleCard article={insight} /> : null}

            {articles.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-sm text-zinc-400">
                No articles yet. Ingest RSS via <code className="font-mono">POST /api/ingest</code>.
              </div>
            ) : (
              articles.slice(0, 10).map((a) => <ArticleCard key={a.id} article={a} />)
            )}
          </div>
        </section>
      </div>
    </Shell>
  );
}
