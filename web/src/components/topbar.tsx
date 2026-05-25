"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";

const DAYS_OPTIONS = [
  { label: "Today", value: 1 },
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
] as const;

const PER_PAGE_OPTIONS = [10, 15, 20] as const;

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentDays = Number(searchParams.get("days") ?? "7") || 7;
  const currentSearch = searchParams.get("search") ?? "";
  const currentPerPage = Number(searchParams.get("per_page") ?? "10") || 10;

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === null || val === "") {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, searchParams, pathname],
  );

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams({ search: value || null });
    }, 400);
  }

  function handleDaySelect(days: number) {
    pushParams({ days: days === 7 ? null : String(days), page: null });
  }

  function handlePerPageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    pushParams({ per_page: e.target.value === "10" ? null : e.target.value, page: null });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2">
          <div className="text-zinc-500">⌕</div>
          <input
            placeholder="Search signals…"
            defaultValue={currentSearch}
            onChange={handleSearchChange}
            className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
          />
        </div>

      </div>

      {/* Timeline + per-page filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {DAYS_OPTIONS.map(({ label, value }) => {
            const active = currentDays === value;
            return (
              <button
                key={value}
                onClick={() => handleDaySelect(value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Show</span>
          <select
            value={currentPerPage}
            onChange={handlePerPageChange}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n} className="bg-[#07090d]">{n}</option>
            ))}
          </select>
          <span>per page</span>
        </div>
      </div>
    </div>
  );
}
