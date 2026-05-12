import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About | SignalAI",
  description:
    "SignalAI monitors 22 live AI sources, extracts structured insights with LLMs, and delivers velocity-ranked briefings for developers, PMs, and founders.",
};

const PRINCIPLES = [
  {
    n: "01",
    color: "text-cyan-400",
    title: "Signal over volume",
    body: "More sources does not mean more insight. We rank by impact and velocity, not by recency alone. The most recent article is not always the most important one.",
  },
  {
    n: "02",
    color: "text-purple-400",
    title: "Structure beats summaries",
    body: "A one-line summary is not enough. Every signal includes what happened, why it matters technically, who it affects, and what to do next. We extract that structure because prose alone does not transfer into action.",
  },
  {
    n: "03",
    color: "text-lime-400",
    title: "Automation, not curation",
    body: "Human curation does not scale across 22 sources updated daily. The pipeline is fully automated so coverage is consistent, fast, and free from editorial drift. We build tooling, not editorial calendars.",
  },
  {
    n: "04",
    color: "text-amber-400",
    title: "Build in public",
    body: "SignalAI is an early-stage product shipping new features regularly. We iterate based on what users actually use. No roadmap theater.",
  },
];

const TECH = [
  {
    accent: "text-cyan-400 bg-cyan-500/10 ring-cyan-500/20",
    border: "hover:border-cyan-500/20",
    title: "LLM Structured Extraction",
    body: "Every ingested item is passed through a structured LLM prompt that extracts six fields: a plain-language summary, why it matters technically, the target persona, the category, impact level (High / Medium / Low), and a relevance score 1-5. Reliable, typed output at scale.",
    tags: ["GPT-4o-mini", "Structured output", "JSON schema"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    accent: "text-purple-400 bg-purple-500/10 ring-purple-500/20",
    border: "hover:border-purple-500/20",
    title: "Semantic Embeddings",
    body: "After extraction, each article is passed through an embedding model to produce a dense vector. These vectors live in a vector-indexed Postgres table. Cosine similarity lookup determines whether a new signal belongs to an existing trend cluster or starts a new one.",
    tags: ["text-embedding-3-small", "pgvector", "cosine similarity"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="5" cy="12" r="2" fill="currentColor" opacity=".4" />
        <circle cx="12" cy="5" r="2" fill="currentColor" opacity=".4" />
        <circle cx="19" cy="12" r="2" fill="currentColor" opacity=".4" />
        <circle cx="12" cy="19" r="2" fill="currentColor" opacity=".4" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <path d="M7 12h3M14 12h3M12 7v3M12 14v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    accent: "text-lime-400 bg-lime-500/10 ring-lime-500/20",
    border: "hover:border-lime-500/20",
    title: "Velocity-Ranked Clusters",
    body: "Related signals are grouped into clusters using a threshold-based similarity algorithm. Each cluster carries a velocity score comparing article count in the current 7-day window vs the prior 7 days. Fastest-accelerating clusters surface first in the Trends view.",
    tags: ["Threshold clustering", "7-day velocity window", "Auto-labeling"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const SYMPTOMS = [
  { dot: "bg-amber-400", title: "Information overload", body: "22+ relevant sources publishing daily. No human reads all of it without burning out." },
  { dot: "bg-rose-400", title: "Stale intelligence", body: "By the time a trend surfaces on social media, the builders already acted on it 72 hours ago." },
  { dot: "bg-purple-400", title: "No structure", body: "Raw feeds give you links, not answers. What happened, why it matters, what to do - those are on you." },
  { dot: "bg-zinc-500", title: "Context switching", body: "Jumping between arXiv, HuggingFace, Reddit, and GitHub every morning is a half-day gone." },
];

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-[#07090d] text-zinc-100">

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#07090d]/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-8 py-4">
          <Link href="/" className="flex items-center gap-1 font-[family-name:var(--font-orbitron)] tracking-widest">
            <span className="text-lg font-black text-white">SIGNAL</span>
            <span className="text-lg font-black text-cyan-400">AI</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {[["Feed", "/feed"], ["Trends", "/trends"], ["Newsletter", "/newsletter"], ["About", "/about"]].map(([label, href]) => (
              <Link key={href} href={href} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </nav>
          <Link href="/feed" className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-bold text-black hover:opacity-90 transition-opacity">
            Explore Feed
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-8 pb-24 pt-24 lg:px-16">
        <div className="absolute inset-0 [background:radial-gradient(800px_circle_at_50%_30%,rgba(168,85,247,0.07),transparent_55%),radial-gradient(600px_circle_at_70%_80%,rgba(34,211,238,0.06),transparent_50%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-purple-400">
            Our Mission
          </div>
          <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
            The AI space moves fast.<br />
            <span className="text-cyan-300">We built the radar.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-400">
            SignalAI exists for one reason: to give developers, PMs, and founders a continuous, structured view of what is actually happening in AI - without the noise, the doomscrolling, or the FOMO.
          </p>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-white/5 bg-white/[0.01] px-8 py-24 lg:px-16">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">The Problem</p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">The AI frontier is a firehose.</h2>
            <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-zinc-400">
              <p>Every day, dozens of research papers drop on arXiv. GitHub sees hundreds of new AI repositories. Company blogs, X threads, Hacker News posts, and Reddit discussions pile up simultaneously. No one person can read all of it.</p>
              <p>The result? You either dedicate hours to staying current and still miss things, or you rely on second-hand takes that are already 48 hours stale. Both options cost you clarity when it matters most.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {SYMPTOMS.map((s) => (
              <div key={s.title} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                <div className={`h-2 w-2 rounded-full ${s.dot} mb-3`} />
                <p className="text-sm font-bold text-white">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="px-8 py-24 lg:px-16">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Our Approach</p>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">One continuous loop. Ingest, analyze, cluster, brief.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
            A fully automated pipeline runs every six hours. It pulls from 22 live sources, passes every item through an LLM for structured extraction, groups related signals using semantic embeddings, and surfaces the highest-velocity clusters first. You open SignalAI and the important things are already ranked and explained.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { stat: "22", label: "live sources monitored", color: "text-cyan-400" },
            { stat: "6 hrs", label: "full pipeline refresh cycle", color: "text-purple-400" },
            { stat: "6", label: "structured fields per signal", color: "text-lime-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-center">
              <div className={`text-4xl font-bold ${s.color}`}>{s.stat}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Technology */}
      <section className="border-y border-white/5 bg-white/[0.01] px-8 py-24 lg:px-16">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Under the Hood</p>
        <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">Built on three technical layers.</h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
          No dashboards built from hand-curated RSS feeds. No hourly manual curation. SignalAI's pipeline is code from ingestion to briefing, using modern LLM tooling and vector search at every step.
        </p>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TECH.map((t) => (
            <div key={t.title} className={`rounded-2xl border border-white/8 bg-white/[0.02] p-7 transition-all duration-300 hover:bg-white/[0.04] ${t.border}`}>
              <div className={`inline-flex rounded-xl p-2.5 ring-1 ${t.accent}`}>{t.icon}</div>
              <h3 className="mt-5 text-base font-bold text-white">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t.body}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {t.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-xs text-zinc-400">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="px-8 py-24 lg:px-16">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Principles</p>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">What we stand for, specifically.</h2>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.n} className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <p className={`text-xs font-bold uppercase tracking-widest ${p.color}`}>{p.n}</p>
              <h3 className="mt-1 text-base font-bold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="border-y border-white/5 bg-white/[0.01] px-8 py-24 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">The Story</p>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">Built by someone who needed it.</h2>

          <div className="mt-10 grid gap-12 lg:grid-cols-[280px_1fr] items-start">
            {/* Photo + name card */}
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-center">
              <div className="relative h-36 w-36 overflow-hidden rounded-full ring-2 ring-cyan-500/30">
                <Image
                  src="/mayank.jpeg"
                  alt="Mayank Malviya"
                  fill
                  className="object-cover"
                  sizes="144px"
                />
              </div>
              <div>
                <p className="text-base font-bold text-white">Mayank Malviya</p>
                <p className="mt-0.5 text-xs text-zinc-500 uppercase tracking-widest">Founder</p>
                <div className="mt-3 flex justify-center gap-3">
                  <a href="https://www.linkedin.com/in/mayank-malviya-pm/" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-cyan-400 transition-colors" aria-label="LinkedIn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  <a href="https://x.com/wassupiammayank" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-cyan-400 transition-colors" aria-label="X / Twitter">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <a href="https://github.com/004mayank" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-cyan-400 transition-colors" aria-label="GitHub">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                  </a>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-zinc-500">
                <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1">Product</span>
                <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1">Engineering</span>
                <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1">AI</span>
              </div>
            </div>

            {/* Story text */}
            <div>
              <div className="space-y-5 text-[15px] leading-relaxed text-zinc-400">
                <p>Hi, I am Mayank. SignalAI started as a personal tool because I was spending two to three hours every morning trying to keep up with AI research, open-source releases, and company announcements - and most of what surfaced was noise anyway. The signal-to-noise ratio was broken.</p>
                <p>The first version was a scraper and a spreadsheet. The second added an LLM extraction step. The third added embeddings and clustering. At some point it became a product worth sharing, so I shipped it.</p>
                <p>This is still a one-person operation. I build it, use it daily, and iterate based on what actually works. That means your feedback goes directly to the person writing the code.</p>
              </div>

              <div className="mt-8 flex flex-wrap gap-6 border-t border-white/5 pt-6 text-sm text-zinc-400">
                <span>Solo-founded</span>
                <span className="text-zinc-700">|</span>
                <span>Shipping since 2025</span>
                <span className="text-zinc-700">|</span>
                <span>Used daily by Mayank</span>
              </div>

              <div className="mt-6 flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                <div className="flex shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 p-2.5 ring-1 ring-cyan-500/20 text-cyan-400">
                  <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><path d="M2 6l9 6 9-6M2 6a2 2 0 012-2h14a2 2 0 012 2M2 6v10a2 2 0 002 2h14a2 2 0 002-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Have feedback or a feature request?</p>
                  <p className="mt-0.5 text-xs text-zinc-400">Reach out directly. Every message gets read by Mayank.</p>
                  <Link href="/newsletter" className="mt-1 inline-block text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                    Subscribe to stay in the loop
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-24 lg:px-16">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-950/40 via-[#07090d] to-purple-950/30 p-10 text-center md:p-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan-400">
              Start now - it is free
            </div>
            <h2 className="mt-5 text-3xl font-bold text-white md:text-4xl">
              Stop finding out <span className="text-cyan-300">late.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
              The feed is live. The briefings are ready. Every signal from the last six hours is waiting.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/feed" className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-4 text-sm font-bold text-black shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-opacity">
                Explore the Feed
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <Link href="/newsletter" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-8 py-4 text-sm font-semibold text-white hover:border-white/30 transition-colors">
                Get the Newsletter
              </Link>
            </div>
            <p className="mt-5 text-xs text-zinc-600">Free to explore. No account required to read briefings.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-8 py-12 lg:px-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-1 font-[family-name:var(--font-orbitron)] tracking-widest">
              <span className="text-base font-black text-white">SIGNAL</span>
              <span className="text-base font-black text-cyan-400">AI</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-zinc-600">Signal for the AI era. Built for developers, PMs, and founders who need to stay ahead.</p>
          </div>
          <div>
            <div className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Product</div>
            <div className="space-y-2">
              {[["Feed", "/feed"], ["Trends", "/trends"], ["Newsletter", "/newsletter"], ["About", "/about"]].map(([label, href]) => (
                <Link key={href} href={href} className="block text-sm text-zinc-500 hover:text-white transition-colors">{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Sources</div>
            <div className="space-y-2 text-sm text-zinc-600">
              <div>22 live sources</div><div>6 source layers</div><div>Updated every 6 hours</div>
            </div>
          </div>
          <div>
            <div className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Coverage</div>
            <div className="space-y-2 text-sm text-zinc-600">
              <div>Research</div><div>Open Source</div><div>Community</div><div>Company Blogs</div>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row">
          <div className="text-xs text-zinc-700">2026 SignalAI. All rights reserved.</div>
          <Link href="/feed" className="text-xs text-cyan-600 hover:text-cyan-400 transition-colors">Explore the Feed</Link>
        </div>
      </footer>
    </div>
  );
}
