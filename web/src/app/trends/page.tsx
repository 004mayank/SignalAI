export const dynamic = "force-dynamic";

import Link from "next/link";
import { Shell } from "@/components/shell";
import { Topbar } from "@/components/topbar";
import { getTrendsPage } from "@/lib/data";

export default async function TrendsPage(props: {
  searchParams: Promise<{ page?: string; per_page?: string }>;
}) {
  const sp = await props.searchParams;
  const perPage = [10, 15, 20].includes(Number(sp.per_page)) ? Number(sp.per_page) : 10;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const trends = await getTrendsPage(200);

  const totalPages = Math.max(1, Math.ceil(trends.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageTrends = trends.slice((safePage - 1) * perPage, safePage * perPage);

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (sp.per_page) params.set("per_page", sp.per_page);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/trends${qs ? `?${qs}` : ""}`;
  }

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
          <>
            <div className="flex items-center justify-between -mt-4">
              <span className="text-xs text-zinc-600">{trends.length} trend{trends.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {pageTrends.map((t) => (
                <Link
                  key={t.id}
                  href={`/trends/${t.id}`}
                  className="rounded-2xl border border-white/5 bg-white/5 p-5 hover:bg-white/10 hover:border-white/10 transition block"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                        {t.category} • {t.articleCount} articles
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white">{t.name}</div>
                    </div>
                    <div className="rounded-xl bg-black/40 px-3 py-2 text-xs text-zinc-200 ring-1 ring-white/10 text-center min-w-[56px]">
                      <div className="text-[10px] uppercase tracking-wide text-zinc-400">Velocity</div>
                      {t.velocity === 0 ? (
                        <div className="text-sm font-semibold text-zinc-500">—</div>
                      ) : (
                        <div className="text-sm font-semibold text-cyan-200">
                          {Math.round(t.velocity * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">{t.summary}</p>
                </Link>
              ))}
            </div>

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
          </>
        )}
      </div>
    </Shell>
  );
}
