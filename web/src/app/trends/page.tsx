export const dynamic = "force-dynamic";

import { Shell } from "@/components/shell";
import { Topbar } from "@/components/topbar";
import { getTrendsPage } from "@/lib/data";

export default async function TrendsPage() {
  const trends = await getTrendsPage(50);

  return (
    <Shell sidebarFilters={false}>
      <div className="space-y-10">
        <Topbar />

        <section>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Trends</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Clusters of related updates with velocity computed from the last 7 days vs the previous 7.
          </p>
        </section>

        {trends.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-sm text-zinc-400">
            No trends yet. Run ingestion to generate embeddings + clusters.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {trends.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-white/5 bg-white/5 p-5 hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      {t.category} • {t.articleCount} articles
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">{t.name}</div>
                  </div>
                  <div className="rounded-xl bg-black/40 px-3 py-2 text-xs text-zinc-200 ring-1 ring-white/10">
                    <div className="text-[10px] uppercase tracking-wide text-zinc-400">Velocity</div>
                    <div className="text-sm font-semibold text-cyan-200">
                      {Math.round(t.velocity * 100) > 0 ? "+" : ""}
                      {Math.round(t.velocity * 100)}%
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">{t.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
