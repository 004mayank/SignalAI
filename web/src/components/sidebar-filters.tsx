"use client";

import { useRouter, useSearchParams } from "next/navigation";

const categories = ["All", "Agents", "LLMs", "Infra", "UX", "Other"] as const;

export function SidebarFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const category = sp.get("category") ?? "All";
  const min = Number(sp.get("min") ?? "1");

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value === "" || value === "All") next.delete(key);
    else next.set(key, value);
    router.push(`/?${next.toString()}`);
  }

  return (
    <aside className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Category
        </div>
        <div className="mt-2 space-y-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setParam("category", c)}
              className={
                "w-full rounded-lg px-3 py-2 text-left text-sm transition " +
                (category === c
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900")
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Min relevance
        </div>
        <div className="mt-2">
          <input
            type="range"
            min={1}
            max={5}
            value={min}
            onChange={(e) => setParam("min", e.target.value)}
            className="w-full"
          />
          <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{min}+</div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        Tip: run <code className="font-mono">POST /api/seed</code> to load sample data, or <code className="font-mono">POST /api/ingest</code> to pull RSS.
      </div>
    </aside>
  );
}
