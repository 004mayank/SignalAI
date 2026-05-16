"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NewsletterSubscribe } from "@/components/newsletter-subscribe";

const categories = ["All", "Agents", "LLMs", "Infra", "UX", "Other"] as const;
const layers = ["", "research", "labs", "builder", "community", "startup", "distribution"] as const;
const sourceTypes = ["", "rss", "arxiv", "github", "huggingface", "reddit", "hn", "producthunt"] as const;
const LAYER_LABELS: Record<string, string> = {
  "": "All", research: "Research", labs: "Labs", builder: "Builder", community: "Community", startup: "Startup", distribution: "Distribution",
};
const SOURCE_TYPE_LABELS: Record<string, string> = {
  "": "All", rss: "Blog / RSS", arxiv: "arXiv", github: "GitHub", huggingface: "HuggingFace", reddit: "Reddit", hn: "Hacker News", producthunt: "Product Hunt",
};

type Props = {
  showFilters?: boolean;
};

export function AppSidebar({ showFilters = true }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();

  const activeCategory = sp.get("category") ?? "All";
  const activeLayer = sp.get("layer") ?? "";
  const activeSourceType = sp.get("source_type") ?? "";
  const min = Number(sp.get("min") ?? "1");

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value === "" || value === "All") next.delete(key);
    else next.set(key, value);
    // Stay on the current filterable page (/feed or /repos); fall back to /feed.
    const base = pathname === "/repos" ? "/repos" : "/feed";
    router.push(`${base}?${next.toString()}`);
  }

  const navItem = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition " +
          (active
            ? "bg-white/10 text-white"
            : "text-zinc-300 hover:bg-white/5 hover:text-white")
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <aside className="hidden w-[280px] shrink-0 border-r border-white/5 bg-black/40 px-4 py-5 md:block">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 font-[family-name:var(--font-orbitron)] tracking-widest">
          <span className="text-lg font-black text-white">SIGNAL</span>
          <span className="text-lg font-black text-cyan-400">AI</span>
        </div>
      </div>

      <div className="mt-6 space-y-1">
        {navItem("/", "Home")}
        {navItem("/feed", "Feed")}
        {navItem("/repos", "GitHub Repos")}
        {navItem("/trends", "Trends")}
        {navItem("/newsletter", "Newsletter")}
        {navItem("/about", "About")}
      </div>

      {showFilters ? (
        <div className="mt-8">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Categories
          </div>
          <div className="mt-2 space-y-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setParam("category", c)}
                className={
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition " +
                  (activeCategory === c
                    ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/30"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white")
                }
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Layer</div>
            <select
              value={activeLayer}
              onChange={(e) => setParam("layer", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300"
            >
              {layers.map((l) => (
                <option key={l} value={l} className="bg-[#07090d]">{LAYER_LABELS[l]}</option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Source type</div>
            <select
              value={activeSourceType}
              onChange={(e) => setParam("source_type", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300"
            >
              {sourceTypes.map((t) => (
                <option key={t} value={t} className="bg-[#07090d]">{SOURCE_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Min relevance
              </div>
              <div className="text-xs text-zinc-400">{min.toFixed(1)}+</div>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={0.1}
              value={min}
              onChange={(e) => setParam("min", e.target.value)}
              className="mt-2 w-full accent-cyan-400"
            />
          </div>

        </div>
      ) : null}

      <div className="mt-6">
        <NewsletterSubscribe />
      </div>

      <div className="mt-6 text-[11px] text-zinc-600">© 2026 SignalAI</div>
    </aside>
  );
}
