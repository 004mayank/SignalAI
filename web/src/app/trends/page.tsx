export const dynamic = "force-dynamic";

import { Shell } from "@/components/shell";
import Link from "next/link";
import { getTrends } from "@/lib/data";

export default async function TrendsPage() {
  const { since, byCategory } = await getTrends();

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Trends</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Basic trend detection: what categories are most active in the last 7 days.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {byCategory.map((c) => (
            <div
              key={c.category}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="text-sm font-semibold">{c.category} rising</div>
              <div className="mt-1 text-3xl font-bold">{c.count}</div>
              <div className="mt-2 text-xs text-zinc-500">
                Since {since.toISOString().slice(0, 10)}
              </div>
              <div className="mt-3">
                <Link
                  href={`/?category=${encodeURIComponent(c.category)}`}
                  className="text-sm text-zinc-700 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                >
                  View feed →
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          MVP note: trend detection is currently category aggregation. Next step is clustering by topic embeddings.
        </div>
      </div>
    </Shell>
  );
}
