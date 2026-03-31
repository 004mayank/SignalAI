function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreLabel(score: number) {
  const s = clamp(score, 0, 5);
  return `${s.toFixed(1)}/5`;
}

export function ArticleCard(props: {
  article: {
    id: string;
    title: string;
    source: string;
    url: string;
    summary: string;
    whyItMatters: string;
    useCase: string;
    category: string;
    finalScore: number;
    impactLevel: string;
    targetPersona: string;
    actionableTakeaway: string;
    createdAt: Date;
  };
}) {
  const a = props.article;

  return (
    <a
      href={a.url}
      target="_blank"
      rel="noreferrer"
      className="group grid gap-4 rounded-3xl border border-white/5 bg-white/5 p-5 hover:bg-white/10 md:grid-cols-[240px_1fr]"
    >
      {/* Media / score panel (we don't have images yet; keep it as an intentional visual block) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 via-cyan-500/10 to-purple-500/10 ring-1 ring-white/10">
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(400px_circle_at_20%_20%,rgba(34,211,238,0.25),transparent_45%),radial-gradient(500px_circle_at_80%_70%,rgba(168,85,247,0.18),transparent_40%)]" />
        <div className="relative flex h-full min-h-[140px] flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-black/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-200 ring-1 ring-white/10">
              {a.category}
            </span>
            <span className="rounded-xl bg-black/40 px-3 py-2 text-xs text-zinc-200 ring-1 ring-white/10">
              <div className="text-[10px] uppercase tracking-wide text-zinc-400">Relevance</div>
              <div className="text-sm font-semibold text-cyan-200">{scoreLabel(a.finalScore)}</div>
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] text-zinc-300">
            <span className="rounded-full bg-white/5 px-2 py-1 ring-1 ring-white/10">
              Impact: {a.impactLevel}
            </span>
            <span className="rounded-full bg-white/5 px-2 py-1 ring-1 ring-white/10">
              Target: {a.targetPersona}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          Authored by {a.source}
        </div>
        <h3 className="mt-2 text-xl font-semibold leading-snug text-white group-hover:text-cyan-100">
          {a.title}
        </h3>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-cyan-200">
              Executive summary
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{a.summary}</p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-lime-200">
              Technical implication
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{a.whyItMatters}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/5 bg-black/30 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Implementation guide
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
            <li>{a.useCase}</li>
            {a.actionableTakeaway ? <li>{a.actionableTakeaway}</li> : null}
          </ul>
        </div>
      </div>
    </a>
  );
}
