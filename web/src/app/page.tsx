import Link from "next/link";
import { getArticles } from "@/lib/data";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhoIsItFor } from "@/components/home/WhoIsItFor";
import { NodeMesh } from "@/components/home/NodeMesh";
import { Marquee } from "@/components/home/Marquee";

export const revalidate = 300;

const SOURCES = [
  "arXiv", "OpenAI Blog", "DeepMind Blog", "GitHub Trending",
  "Hugging Face", "Reddit ML", "Reddit LocalLLaMA", "Reddit Artificial",
  "Hacker News", "Product Hunt", "Meta AI Blog", "Mistral Blog",
  "LangChain Blog", "Weights and Biases", "Microsoft AI Blog", "Google AI Blog",
  "X: Sam Altman", "X: Andrej Karpathy", "X: Yann LeCun",
];

function categoryColor(cat: string) {
  const m: Record<string, string> = {
    Agents: "text-lime-300 bg-lime-400/10",
    LLMs: "text-cyan-300 bg-cyan-400/10",
    Infra: "text-purple-300 bg-purple-400/10",
    UX: "text-pink-300 bg-pink-400/10",
    Other: "text-zinc-300 bg-white/5",
  };
  return m[cat] ?? m["Other"];
}

function impactColor(level: string) {
  if (level === "High") return "text-red-300";
  if (level === "Medium") return "text-amber-300";
  return "text-zinc-400";
}

export default async function HomePage() {
  const articles = await getArticles({});
  const liveSignals = articles.slice(0, 6);

  return (
    <div className="min-h-dvh bg-[#07090d] text-zinc-100">

      {/* Sticky nav */}
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
      <section className="relative overflow-hidden pb-10 pt-16">
        <div className="absolute inset-0 [background:radial-gradient(900px_circle_at_20%_40%,rgba(34,211,238,0.08),transparent_55%),radial-gradient(700px_circle_at_80%_10%,rgba(168,85,247,0.08),transparent_50%)]" />
        <div className="relative grid w-full items-center gap-8 px-8 lg:grid-cols-2 lg:px-16">

          {/* Text */}
          <div>
            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
              Know what matters<br />
              <span className="text-cyan-300">in AI</span> before<br />
              everyone else.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-400">
              SignalAI tracks 22 live sources, surfaces rising trends, and delivers AI-generated briefings so you spend time acting on signal, not searching for it.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/feed" className="flex items-center gap-2 rounded-xl bg-cyan-500 px-7 py-3.5 text-sm font-bold text-black shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-opacity">
                Explore the Feed
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <Link href="/newsletter" className="flex items-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-sm font-semibold text-white hover:border-white/30 transition-colors">
                Get the Newsletter
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-xs text-zinc-500">
              <span>22 sources tracked</span>
              <span className="text-zinc-700">|</span>
              <span>Updated every 6 hours</span>
              <span className="text-zinc-700">|</span>
              <span>Free to start</span>
            </div>
          </div>

          {/* 3D Node Mesh */}
          <div className="flex items-center justify-center">
            <div className="relative h-[520px] w-full lg:h-[580px]">
              <NodeMesh />
            </div>
          </div>
        </div>
      </section>

      {/* Live Signals */}
      <section className="border-y border-white/5 bg-white/[0.01] pb-16 pt-10">
        <div className="px-8 lg:px-16">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Live right now</p>
              <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">Latest signals from the feed.</h2>
            </div>
            <Link href="/feed" className="group hidden items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors md:flex">
              View all signals
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform group-hover:translate-x-1">
                <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {liveSignals.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-white/5 bg-white/5 p-8 text-center text-sm text-zinc-500">
              No recent signals yet. Check back soon as we ingest new sources.
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {liveSignals.map((a, i) => (
                <Link key={a.id} href={`/article/${a.id}`}
                  className={"group rounded-2xl border p-6 transition-all duration-200 hover:bg-white/[0.05] " +
                    (i === 0 ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/8 bg-white/[0.025] hover:border-white/15")}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{a.source}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${impactColor(a.impactLevel)}`}>{a.impactLevel}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${categoryColor(a.category)}`}>{a.category}</span>
                    </div>
                  </div>
                  <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-cyan-200">{a.title}</h3>
                  <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-zinc-400">{a.summary}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-zinc-600">
                      {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                    </span>
                    <span className="text-xs font-bold text-cyan-400 opacity-0 transition-opacity group-hover:opacity-100">Read briefing →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Source Coverage */}
      <section className="overflow-hidden border-b border-white/5 bg-white/[0.01] py-16">
        <div className="mb-10 px-8 lg:px-16">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-500">Sources</p>
          <h2 className="mt-3 text-center text-2xl font-bold text-white md:text-3xl">22 sources. One feed.</h2>
          <p className="mt-3 text-center text-sm text-zinc-500">Research labs, open-source repos, community forums, and key voices across the AI ecosystem.</p>
        </div>
        <Marquee items={SOURCES} duration={65} />
      </section>

      {/* Who Is It For */}
      <WhoIsItFor />

      {/* Newsletter CTA */}
      <section className="py-24 px-8 lg:px-16">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-950/40 via-[#07090d] to-purple-950/30 p-10 text-center md:p-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl" />
          <div className="relative">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/20 text-cyan-400">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M2 6l9 6 9-6M2 6a2 2 0 012-2h14a2 2 0 012 2M2 6v10a2 2 0 002 2h14a2 2 0 002-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h2 className="text-3xl font-bold text-white md:text-4xl">AI intelligence in your inbox, every week.</h2>
            <p className="mt-4 text-lg text-zinc-400">The five signals that mattered most this week, curated and structured. No filler.</p>
            <div className="mt-8">
              <Link href="/newsletter" className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-4 text-sm font-bold text-black hover:opacity-90 transition-opacity">
                Subscribe on Beehiiv
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
            <p className="mt-4 text-xs text-zinc-600">No spam. Unsubscribe any time.</p>
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
