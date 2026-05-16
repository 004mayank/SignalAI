import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleById } from "@/lib/data";
import { generateDeepArticle } from "@/lib/ai";

export const dynamic = "force-dynamic";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreLabel(score: number) {
  return `${clamp(score, 0, 5).toFixed(1)}/5`;
}

// LLMs occasionally emit em-dashes despite instructions. Strip them at render time.
function clean(text: string): string {
  return text.replace(/[—–]/g, "-").replace(/\s{2,}/g, " ").trim();
}

// For GitHub repos the title is "owner/repo: description".
// Return description as the primary heading and owner/repo as subtitle.
function parseTitle(title: string): { primary: string; repo?: string } {
  const colonIdx = title.indexOf(": ");
  if (colonIdx !== -1) {
    const before = title.slice(0, colonIdx);
    if (before.includes("/")) {
      const description = clean(title.slice(colonIdx + 2));
      return { primary: description || before, repo: before };
    }
  }
  return { primary: clean(title) };
}

function categoryColor(category: string) {
  const map: Record<string, string> = {
    Agents: "text-lime-200 bg-lime-400/10 ring-lime-400/30",
    LLMs: "text-cyan-200 bg-cyan-400/10 ring-cyan-400/30",
    Infra: "text-purple-200 bg-purple-400/10 ring-purple-400/30",
    UX: "text-pink-200 bg-pink-400/10 ring-pink-400/30",
    Other: "text-zinc-200 bg-white/5 ring-white/10",
  };
  return map[category] ?? map["Other"];
}

function impactColor(level: string) {
  if (level === "High") return "text-red-300 bg-red-400/10 ring-red-400/30";
  if (level === "Medium") return "text-amber-300 bg-amber-400/10 ring-amber-400/30";
  return "text-zinc-300 bg-white/5 ring-white/10";
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) notFound();

  const deep = await generateDeepArticle({
    id: article.id,
    title: article.title,
    source: article.source,
    url: article.url,
    category: article.category,
    impactLevel: article.impactLevel,
    targetPersona: article.targetPersona,
    summary: article.summary ?? "",
    whatHappened: article.whatHappened,
    whyItMatters: article.whyItMatters,
    useCase: article.useCase,
    actionableTakeaway: article.actionableTakeaway,
  });

  const publishedDate = article.publishedAt ?? article.createdAt;

  return (
    <div className="min-h-dvh bg-[#07090d] text-zinc-100">
      {/* Sticky top nav */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#07090d]/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-3">
          <Link
            href="/feed"
            className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to feed
          </Link>
          <span className="text-sm font-semibold tracking-tight text-white">SignalAI</span>
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-200 ring-1 ring-cyan-400/30 transition-colors hover:bg-cyan-500/20"
          >
            View source
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="shrink-0">
              <path d="M3.5 8.5L8.5 3.5M8.5 3.5H5M8.5 3.5V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </header>

      {/* Full-width hero */}
      <div className="relative overflow-hidden border-b border-white/5 bg-gradient-to-br from-[#07090d] via-cyan-950/20 to-[#07090d] px-6 py-14">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(900px_circle_at_20%_50%,rgba(34,211,238,0.15),transparent_55%),radial-gradient(700px_circle_at_80%_20%,rgba(168,85,247,0.12),transparent_45%)]" />
        <div className="relative">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2.5 py-1 font-semibold ring-1 ${categoryColor(article.category)}`}>
              {article.category}
            </span>
            <span className={`rounded-full px-2.5 py-1 font-semibold ring-1 ${impactColor(article.impactLevel)}`}>
              {article.impactLevel} impact
            </span>
            <span className="rounded-full bg-white/5 px-2.5 py-1 ring-1 ring-white/10">
              For {article.targetPersona}
            </span>
            <span className="ml-2 text-zinc-500">
              {article.source} · {publishedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
          </div>

          {/* Title */}
          {(() => {
            const { primary, repo } = parseTitle(article.title);
            return (
              <>
                <h1 className="mt-5 max-w-5xl text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
                  {primary}
                </h1>
                {repo && (
                  <p className="mt-2 text-base text-zinc-500 font-mono">{repo}</p>
                )}
              </>
            );
          })()}

          {/* Key quote */}
          <blockquote className="mt-6 max-w-3xl border-l-2 border-cyan-400/50 pl-5 text-lg leading-relaxed text-zinc-300 italic">
            {clean(deep.key_quote)}
          </blockquote>

          {/* Signal strength */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-xl bg-black/40 px-4 py-2 ring-1 ring-white/10">
            <span className="text-xs uppercase tracking-widest text-zinc-400">Signal strength</span>
            <span className="text-sm font-bold text-cyan-200">{scoreLabel(article.finalScore ?? 0)}</span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs text-zinc-400">{article.engagementStars ? `${article.engagementStars.toLocaleString()} stars` : article.engagementUpvotes ? `${article.engagementUpvotes} upvotes` : article.source}</span>
          </div>
        </div>
      </div>

      {/* Main body: article + sidebar */}
      <div className="grid px-6 py-12 gap-12 lg:grid-cols-[1fr_300px]">

        {/* Article content */}
        <article className="min-w-0 space-y-12">

          {/* Introduction */}
          <section>
            <p className="text-xl leading-[1.85] text-zinc-200">{clean(deep.introduction)}</p>
          </section>

          {/* TL;DR callout */}
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-6">
            <div className="mb-3 text-sm font-bold uppercase tracking-widest text-cyan-300">TL;DR</div>
            <p className="text-lg leading-relaxed text-zinc-100">{clean(article.summary)}</p>
          </div>

          {/* What Happened */}
          <section>
            <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-zinc-500">What happened</h2>
            <p className="text-lg leading-[1.9] text-zinc-300">{clean(deep.what_happened_deep)}</p>
          </section>

          <div className="h-px bg-white/5" />

          {/* The Bigger Picture */}
          <section>
            <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-lime-400">The bigger picture</h2>
            <p className="text-lg leading-[1.9] text-zinc-300">{clean(deep.bigger_picture)}</p>
          </section>

          <div className="h-px bg-white/5" />

          {/* Technical Deep Dive */}
          <section>
            <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-purple-400">Technical deep dive</h2>
            <p className="text-lg leading-[1.9] text-zinc-300">{clean(deep.technical_deep_dive)}</p>
          </section>

          <div className="h-px bg-white/5" />

          {/* Real-world applications */}
          <section>
            <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-amber-400">Real-world applications</h2>
            <div className="space-y-4">
              {deep.real_world_applications.map((app, i) => (
                <div key={i} className="flex gap-4 rounded-xl border border-white/5 bg-white/5 p-5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">
                    {i + 1}
                  </span>
                  <p className="text-base leading-relaxed text-zinc-300">{clean(app)}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="h-px bg-white/5" />

          {/* What to do now */}
          <section>
            <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-cyan-400">What to do now</h2>
            <div className="space-y-4">
              {deep.what_to_do_now.map((action, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <svg className="mt-1.5 shrink-0 text-cyan-400" width="16" height="16" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-base leading-relaxed text-zinc-200">{clean(action)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Source CTA */}
          <div className="rounded-3xl border border-white/5 bg-white/5 p-8 text-center">
            <p className="text-sm text-zinc-400">Go deeper - read the original source</p>
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-500 px-7 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90"
            >
              Open {article.source}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4 10L10 4M10 4H6.5M10 4V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <div className="mt-4">
              <Link href="/feed" className="text-xs text-zinc-500 hover:text-zinc-300">
                Back to all signals
              </Link>
            </div>
          </div>
        </article>

        {/* Sticky sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-16 space-y-4">

            {/* Signal metadata */}
            <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
              <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Signal metadata</div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Source</span>
                  <span className="text-zinc-200 font-medium">{article.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Category</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${categoryColor(article.category)}`}>{article.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Impact</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${impactColor(article.impactLevel)}`}>{article.impactLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Audience</span>
                  <span className="text-zinc-200">{article.targetPersona}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Signal score</span>
                  <span className="font-bold text-cyan-200">{scoreLabel(article.finalScore ?? 0)}</span>
                </div>
                {article.engagementStars ? (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stars</span>
                    <span className="text-zinc-200">{article.engagementStars.toLocaleString()}</span>
                  </div>
                ) : null}
                {article.engagementUpvotes ? (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Upvotes</span>
                    <span className="text-zinc-200">{article.engagementUpvotes.toLocaleString()}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span className="text-zinc-500">Published</span>
                  <span className="text-zinc-200">{publishedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </div>
            </div>

            {/* View source */}
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 ring-1 ring-cyan-400/30 transition-colors hover:bg-cyan-500/20"
            >
              View original source
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3.5 8.5L8.5 3.5M8.5 3.5H5M8.5 3.5V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>

            <Link
              href="/feed"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              All signals
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
