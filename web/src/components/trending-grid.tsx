import Link from "next/link";
import { Article } from "@prisma/client";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreLabel(score: number) {
  const s = clamp(score, 0, 5);
  return `${s.toFixed(1)}/5`;
}

export function TrendingGrid(props: { articles: Article[] }) {
  const items = [...props.articles]
    .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))
    .slice(0, 5);

  const featured = items[0];
  const rest = items.slice(1);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
          ⚡ Trending now
        </div>
        <Link href="/trends" className="text-xs text-cyan-300 hover:underline">
          View all trends
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-white/5 bg-white/5 p-6 text-sm text-zinc-400">
          No articles yet. Ingest a few sources.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {featured ? (
            <a
              href={featured.url}
              target="_blank"
              rel="noreferrer"
              className="group relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-cyan-500/10 via-white/5 to-purple-500/10 p-6"
            >
              <div className="absolute inset-0 opacity-30 [background:radial-gradient(600px_circle_at_30%_30%,rgba(34,211,238,0.25),transparent_50%),radial-gradient(600px_circle_at_70%_60%,rgba(168,85,247,0.18),transparent_45%)]" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-lime-400/20 px-2 py-1 text-[11px] font-semibold text-lime-200 ring-1 ring-lime-400/30">
                      {featured.category}
                    </span>
                    <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-zinc-300 ring-1 ring-white/10">
                      {featured.targetPersona}
                    </span>
                  </div>
                  <div className="rounded-xl bg-black/40 px-3 py-2 text-xs text-zinc-200 ring-1 ring-white/10">
                    <div className="text-[10px] uppercase tracking-wide text-zinc-400">Relevance</div>
                    <div className="text-sm font-semibold text-cyan-200">{scoreLabel(featured.finalScore)}</div>
                  </div>
                </div>

                <h2 className="mt-5 text-2xl font-semibold leading-tight text-white group-hover:text-cyan-100">
                  {featured.title}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-300">
                  {featured.summary}
                </p>
                <div className="mt-5 text-xs text-zinc-400">
                  Source: <span className="text-zinc-200">{featured.source}</span>
                </div>
              </div>
            </a>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {rest.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-white/5 bg-white/5 p-4 hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      {a.category} • {a.sourceType}
                    </div>
                    <div className="mt-2 line-clamp-2 text-sm font-semibold text-white">
                      {a.title}
                    </div>
                  </div>
                  <div className="shrink-0 rounded-lg bg-black/40 px-2 py-1 text-xs text-cyan-200 ring-1 ring-white/10">
                    {scoreLabel(a.finalScore)}
                  </div>
                </div>
                <div className="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                  {a.summary}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
