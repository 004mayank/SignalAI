export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getTrendDetail } from "@/lib/data";

function categoryColor(cat: string) {
  const m: Record<string, string> = {
    Agents: "text-lime-300 bg-lime-400/10 ring-lime-400/30",
    LLMs: "text-cyan-300 bg-cyan-400/10 ring-cyan-400/30",
    Infra: "text-purple-300 bg-purple-400/10 ring-purple-400/30",
    UX: "text-pink-300 bg-pink-400/10 ring-pink-400/30",
    Other: "text-zinc-300 bg-white/5 ring-white/10",
  };
  return m[cat] ?? m["Other"];
}

function LineChart({ stats }: { stats: { date: Date; articleCount: number }[] }) {
  if (stats.length === 0) return null;
  const max = Math.max(...stats.map((s) => s.articleCount), 1);
  const W = 400;
  const H = 100;
  const padL = 8;
  const padR = 8;
  const padT = 10;
  const padB = 28; // space for date labels

  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const pts = stats.map((s, i) => {
    const x = padL + (stats.length === 1 ? chartW / 2 : (i / (stats.length - 1)) * chartW);
    const y = padT + chartH - Math.round((s.articleCount / max) * chartH);
    return { x, y, s };
  });

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");

  // Show every label if ≤7 points, else show first/last and every other
  const showLabel = (i: number) => stats.length <= 7 || i === 0 || i === stats.length - 1 || i % 2 === 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {/* Grid line at top */}
      <line x1={padL} y1={padT} x2={W - padR} y2={padT} stroke="currentColor" strokeWidth={0.5} className="text-white/5" />
      {/* Grid line at midpoint */}
      <line x1={padL} y1={padT + chartH / 2} x2={W - padR} y2={padT + chartH / 2} stroke="currentColor" strokeWidth={0.5} strokeDasharray="3 3" className="text-white/5" />
      {/* Fill area under line */}
      <polygon
        points={`${pts[0].x},${padT + chartH} ${polyline} ${pts[pts.length - 1].x},${padT + chartH}`}
        className="fill-cyan-500/10"
      />
      {/* Line */}
      <polyline points={polyline} fill="none" stroke="#22d3ee" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots + date labels */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={2.5} className="fill-cyan-400" />
          {/* Count label above dot */}
          <text x={p.x} y={p.y - 5} textAnchor="middle" fontSize={7} className="fill-cyan-300/70">
            {p.s.articleCount}
          </text>
          {/* Date label below chart */}
          {showLabel(i) && (
            <text x={p.x} y={H - 4} textAnchor="middle" fontSize={7} className="fill-zinc-500">
              {new Date(p.s.date).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

export default async function TrendDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getTrendDetail(id);
  if (!data) notFound();

  const { trend, articles } = data;

  // Prefer TrendStat records when ≥2 days of data exist.
  // Fallback: group articles by publishedAt date so there's always a meaningful chart.
  const chartStats: { date: Date; articleCount: number }[] =
    trend.stats.length >= 2
      ? trend.stats
      : (() => {
          const map = new Map<string, number>();
          for (const a of articles) {
            if (!a.publishedAt) continue;
            const key = new Date(a.publishedAt).toISOString().slice(0, 10);
            map.set(key, (map.get(key) ?? 0) + 1);
          }
          return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, articleCount]) => ({ date: new Date(date), articleCount }));
        })();

  return (
    <div className="min-h-dvh bg-[#07090d] text-zinc-100">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#07090d]/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-3">
          <Link href="/trends" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to trends
          </Link>
          <span className="text-sm font-semibold text-white">SignalAI</span>
          <div className="w-24" />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12 space-y-10">

        {/* Hero */}
        <section>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${categoryColor(trend.category)}`}>
              {trend.category}
            </span>
            <span className="text-xs text-zinc-500">{trend.articleCount} articles</span>
          </div>
          <h1 className="text-3xl font-bold text-white md:text-4xl">{trend.name}</h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-300">{trend.summary}</p>

          {/* Velocity badge */}
          <div className="mt-5 inline-flex items-center gap-3 rounded-xl bg-black/40 px-4 py-2 ring-1 ring-white/10">
            <span className="text-xs uppercase tracking-widest text-zinc-400">Velocity</span>
            <span className="text-sm font-bold text-cyan-200">
              {trend.velocity === 0 ? "—" : `${Math.round(trend.velocity * 100)}%`}
            </span>
          </div>
        </section>

        {/* Chart */}
        {chartStats.length > 0 && (
          <section>
            <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Article volume over time
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
              <LineChart stats={chartStats} />
              <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
                <span>Older</span>
                <span>Most recent</span>
              </div>
            </div>
          </section>
        )}

        {/* Articles */}
        <section>
          <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
            Articles in this trend
          </div>
          {articles.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-sm text-zinc-500">
              No articles yet for this trend cluster.
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((a) => (
                <Link
                  key={a.id}
                  href={`/article/${a.id}`}
                  className="group flex gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 hover:bg-white/[0.07] hover:border-white/10 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] text-zinc-500">{a.source}</span>
                      {a.engagementStars ? (
                        <span className="text-[11px] text-yellow-400">★ {a.engagementStars.toLocaleString()}</span>
                      ) : a.engagementUpvotes ? (
                        <span className="text-[11px] text-zinc-500">▲ {a.engagementUpvotes}</span>
                      ) : null}
                    </div>
                    <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-cyan-200 transition-colors">
                      {a.title.replace(/[—–]/g, "-")}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500 line-clamp-2">{a.summary}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className="text-[10px] font-bold text-cyan-400 opacity-0 group-hover:opacity-100 transition">
                      Read →
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
