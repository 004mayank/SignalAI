"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const categories = ["All", "Agents", "LLMs", "Infra", "UX", "Other"] as const;

type Props = {
  showFilters?: boolean;
};

export function AppSidebar({ showFilters = true }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();

  const activeCategory = sp.get("category") ?? "All";
  const min = Number(sp.get("min") ?? "1");

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value === "" || value === "All") next.delete(key);
    else next.set(key, value);
    // Keep category filters on feed only.
    router.push(`/?${next.toString()}`);
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
        <div>
          <div className="text-lg font-semibold tracking-tight text-white">SignalAI</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            Electric intelligence
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-1">
        {navItem("/", "Home")}
        {navItem("/trends", "Trends")}
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

          <div className="mt-6 rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-zinc-300">
            Tip: ingest real sources via <span className="font-mono">POST /api/ingest</span>.
          </div>
        </div>
      ) : null}

      <div className="mt-10 text-[11px] text-zinc-600">© 2026 SignalAI</div>
    </aside>
  );
}
