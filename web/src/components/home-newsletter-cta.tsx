"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const LS_KEY = "signalai_newsletter_subscribed";

export function HomeNewsletterCta() {
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(LS_KEY)) setSubscribed(true);
  }, []);

  if (subscribed) {
    return (
      <div className="mt-8 inline-flex items-center gap-2.5 rounded-xl border border-lime-400/20 bg-lime-400/5 px-6 py-4 text-sm font-semibold text-lime-300">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        You&apos;re on the list. Weekly signals incoming.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Link
        href="/newsletter"
        className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-4 text-sm font-bold text-black hover:opacity-90 transition-opacity"
      >
        Subscribe on Beehiiv
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  );
}
