export const dynamic = "force-dynamic";

import Link from "next/link";
import { Shell } from "@/components/shell";
import { getTrendsPage } from "@/lib/data";

const DAYS_OPTIONS = [
  { label: "Today", value: 1 },
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Agents: "text-lime-300",
  LLMs: "text-cyan-300",
  Infra: "text-purple-300",
  UX: "text-pink-300",
  Other: "text-zinc-400",
};

export default async function TrendsPage(props: {
  searchParams: Promise<{ page?: string; per_page?: string; days?: string }>;
}) {
  const sp = await props.searchParams;

  const rawDays = [1, 7, 30, 90].includes(Number(sp.days)) ? Number(sp.days) : 7;
  const perPage = [10, 15, 20].includes(Number(sp.per_page)) ? Number(sp.per_page) : 10;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const trends = await getTrendsPage(200, rawDays);

  const totalPages = Math.max(1, Math.ceil(trends.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageTrends = trends.slice((safePage - 1) * perPage, safePage * perPage);

  function daysUrl(val: number) {
    const params = new URLSearchParams();
    if (val !== 7) params.set("days", String(val));
    if (sp.per_page) params.set("per_page", sp.per_page);
    const qs = params.toString();
    return `/trends${qs ? `?${qs}` : ""}`;
  }

  function perPageUrl(val: number) {
    const params = new URLSearchParams();
    if (rawDays !== 7) params.set("days", String(rawDays));
    if (val !== 10) params.set("per_page", String(val));
    const qs = params.toString();
    return `/trends${qs ? `?${qs}` : ""}`;
  }

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (rawDays !== 7) params.set("days", String(rawDays));
    if (sp.per_page) params.set("per_page", sp.per_page);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/trends${qs ? `?${qs}` : ""}`;
  }

  const windowLabel =
    rawDays === 1 ? "today" :
    rawDays === 7 ? "the last 7 days" :
    rawDays === 30 ? "the last 30 days" :
    "the last 90 days";

  return (
    <Shell sidebarFilters={false}>
      <div className="space-y-8">

        {/* Header + time filter */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              {DAYS_OPTIONS.map(({ label, value }) => (
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

          <h1 className="text-4xl font-semibold tracking-tight text-white">Trends</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Topic clusters from {windowLabel} — grouped by semantic similarity across ingested signals.
            Sorted by article coverage.
          </p>
        </section>

        {trends.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-sm text-zinc-400">
            No multi-article trends in this window yet. Try a wider time range or run ingestion.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between -mt-2">
              <span className="text-xs text-zinc-600">
                {trends.length} trend{trends.length !== 1 ? "s" : ""}
                {totalPages > 1 && ` · page ${safePage} of ${totalPages}`}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {pageTrends.map((t) => {
                const catColor = CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS.Other;
                return (
                  <Link
                    key={t.id}
                    href={`/trends/${t.id}`}
                    className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 hover:bg-white/[0.07] hover:border-white/10 transition block"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className={`text-[11px] uppercase tracking-[0.18em] font-semibold ${catColor}`}>
                          {t.category}
                        </div>
                        <div className="mt-1.5 text-base font-semibold text-white leading-snug">
                          {t.name}
                        </div>
                      </div>
                      {/* Signal badge: article count is the honest strength indicator */}
                      <div className="shrink-0 rounded-xl bg-black/40 px-3 py-2 text-center min-w-[52px] ring-1 ring-white/10">
                        <div className="text-[10px] uppercase tracking-wide text-zinc-500">Signal</div>
                        <div className="text-lg font-bold text-cyan-200 leading-none mt-0.5">
                          {t.articleCount}
                        </div>
                        <div className="text-[9px] text-zinc-600 mt-0.5">articles</div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">{t.summary}</p>
                  </Link>
                );
              })}
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
