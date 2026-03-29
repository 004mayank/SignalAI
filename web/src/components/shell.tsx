import Link from "next/link";

export function Shell(props: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold">
              SignalAI
            </Link>
            <nav className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
              <Link href="/" className="hover:underline">
                Feed
              </Link>
              <Link href="/trends" className="hover:underline">
                Trends
              </Link>
            </nav>
          </div>
          <div className="text-xs text-zinc-500">AI Trend Intelligence (MVP)</div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{props.children}</main>
    </div>
  );
}
