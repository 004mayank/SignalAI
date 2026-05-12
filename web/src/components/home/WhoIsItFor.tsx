"use client";

import { useState } from "react";
import Link from "next/link";

type Persona = "dev" | "pm" | "founder";

const personas = {
  dev: {
    label: "Developer",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M9 10L5 14L9 18M19 10L23 14L19 18M15 8L13 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    headline: "Stop scrolling for AI news. Start acting on it.",
    body: "SignalAI surfaces model releases, benchmark results, and library updates from arXiv, Hugging Face, and GitHub before they hit your timeline. Every signal comes with a technical deep-dive so you understand the implications without opening ten tabs.",
    useCases: [
      "Track new model releases and fine-tuning techniques as they publish",
      "Read structured paper briefings without opening PDFs",
      "Spot infrastructure shifts before they affect your stack",
      "Filter signals by category so only relevant updates reach you",
    ],
    cta: { label: "Explore the feed", href: "/feed" },
    accent: "cyan",
  },
  pm: {
    label: "Product Manager",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="6" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 14L12 17L19 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    headline: "Know which AI features are shipping. Know which are hype.",
    body: "Track competitor product moves, new API announcements, and emerging UX patterns across 22 sources in one daily view. SignalAI ranks every signal by impact level and target persona so your roadmap decisions are grounded in what is actually happening, not what got the most retweets.",
    useCases: [
      "Monitor competing products for new AI feature launches",
      "Spot category trends before your next roadmap cycle",
      "Share structured briefings with your team in one click",
      "Filter by impact level to focus on high-signal developments",
    ],
    cta: { label: "See trending topics", href: "/trends" },
    accent: "purple",
  },
  founder: {
    label: "Founder",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4L17 10L23 11L18.5 15.5L19.5 22L14 19L8.5 22L9.5 15.5L5 11L11 10L14 4Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    headline: "Find the white space before it fills.",
    body: "SignalAI tracks the frontier so you can see which problems are still open, which infrastructure is maturing, and where attention is starting to concentrate. Get a daily briefing on what the best researchers, engineers, and operators are shipping, without hiring a research analyst.",
    useCases: [
      "Identify under-covered research areas before they become crowded",
      "Monitor lab and investor announcements as they happen",
      "Get a structured weekly newsletter delivered to your inbox",
      "Spot velocity spikes in emerging topic clusters early",
    ],
    cta: { label: "Subscribe to the newsletter", href: "/newsletter" },
    accent: "lime",
  },
};

const accentClasses: Record<string, { tab: string; icon: string; border: string }> = {
  cyan: {
    tab: "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30",
    icon: "text-cyan-400 bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  purple: {
    tab: "bg-purple-500/10 text-purple-300 border border-purple-500/30",
    icon: "text-purple-400 bg-purple-500/10",
    border: "border-purple-500/20",
  },
  lime: {
    tab: "bg-lime-500/10 text-lime-300 border border-lime-500/30",
    icon: "text-lime-400 bg-lime-500/10",
    border: "border-lime-500/20",
  },
};

export function WhoIsItFor() {
  const [active, setActive] = useState<Persona>("dev");
  const p = personas[active];
  const colors = accentClasses[p.accent];

  return (
    <section className="py-24 px-8 lg:px-16">
      <div className="w-full">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-500">Who is it for</p>
        <h2 className="mt-3 text-center text-3xl font-bold text-white md:text-4xl">
          Built for the people building AI products.
        </h2>

        {/* Tabs */}
        <div className="mt-10 flex justify-center">
          <div className="flex gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-1">
            {(["dev", "pm", "founder"] as Persona[]).map((key) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={
                  "rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 " +
                  (active === key
                    ? accentClasses[personas[key].accent].tab
                    : "text-zinc-400 hover:text-white")
                }
              >
                {personas[key].label}
              </button>
            ))}
          </div>
        </div>

        {/* Panel */}
        <div
          key={active}
          className={`mt-6 rounded-2xl border bg-white/[0.02] p-8 md:p-10 transition-all duration-200 ${colors.border}`}
        >
          <div className="flex items-start gap-5">
            <div className={`rounded-xl p-3 ${colors.icon}`}>
              {p.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white md:text-2xl">{p.headline}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-zinc-300">{p.body}</p>
            </div>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {p.useCases.map((uc, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg className={`mt-0.5 shrink-0 ${colors.icon.split(" ")[0]}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm text-zinc-300">{uc}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link
              href={p.cta.href}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 ${colors.tab}`}
            >
              {p.cta.label}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
