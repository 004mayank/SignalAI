export const dynamic = "force-dynamic";

import { Shell } from "@/components/shell";
import { getTrendsPage } from "@/lib/data";

export default async function TrendsPage() {
  const trends = await getTrendsPage(50);

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Trends</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Clusters of related updates with velocity computed from the last 7 days vs the previous 7.
          </p>
        </div>

        {trends.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            No trends yet. Run ingestion to generate embeddings + clusters.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {trends.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {t.category} • {t.articleCount} articles
                    </div>
                  </div>
                  <div className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
                    {Math.round(t.velocity * 100) > 0 ? "+" : ""}
                    {Math.round(t.velocity * 100)}%
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{t.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
