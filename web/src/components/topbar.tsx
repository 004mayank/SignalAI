"use client";

export function Topbar() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2">
        <div className="text-zinc-500">⌕</div>
        <input
          placeholder="Search signals…"
          className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
        />
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-lime-400" />
          <span className="uppercase tracking-wide">Live feed active</span>
        </div>
        <button className="rounded-full border border-white/5 bg-white/5 px-3 py-2 text-xs text-zinc-300 hover:bg-white/10">
          ⚙
        </button>
      </div>
    </div>
  );
}
