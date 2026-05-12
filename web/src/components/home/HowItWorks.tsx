"use client";

import { useEffect, useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Ingest",
    body: "SignalAI monitors 22 live sources around the clock, spanning research papers, company blogs, open-source repositories, and community forums.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor" opacity=".3"/>
        <circle cx="12" cy="12" r="3" fill="currentColor"/>
        <path d="M3 12h2M19 12h2M12 3v2M12 19v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    color: "text-cyan-400 bg-cyan-500/10 ring-cyan-500/20",
  },
  {
    number: "02",
    title: "Analyze",
    body: "Every article is processed by an LLM that extracts category, impact level, target persona, relevance score, and structured insights including what happened and why it matters.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "text-purple-400 bg-purple-500/10 ring-purple-500/20",
  },
  {
    number: "03",
    title: "Cluster",
    body: "Semantic embeddings group related signals into trend clusters. Velocity scores track how fast each topic is accelerating so the most important patterns surface first.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="5" cy="12" r="2" fill="currentColor" opacity=".4"/>
        <circle cx="12" cy="5" r="2" fill="currentColor" opacity=".4"/>
        <circle cx="19" cy="12" r="2" fill="currentColor" opacity=".4"/>
        <circle cx="12" cy="19" r="2" fill="currentColor" opacity=".4"/>
        <circle cx="12" cy="12" r="3" fill="currentColor"/>
        <path d="M7 12h3M14 12h3M12 7v3M12 14v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    color: "text-lime-400 bg-lime-500/10 ring-lime-500/20",
  },
  {
    number: "04",
    title: "Brief",
    body: "Every signal gets a full AI-generated deep-dive: introduction, technical analysis, real-world applications, and specific action steps. One click from the feed.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 12h6M9 16h4M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2M9 4a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2h-2a2 2 0 01-2-2v0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "text-amber-400 bg-amber-500/10 ring-amber-500/20",
  },
];

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = containerRef.current?.querySelectorAll(".step-card");
    if (!cards) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("is-visible"); }),
      { threshold: 0.15 }
    );
    cards.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 px-6 border-y border-white/5 bg-white/[0.01]">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-500">How it works</p>
        <h2 className="mt-3 text-center text-3xl font-bold text-white md:text-4xl">
          From raw noise to actionable signal.
        </h2>
        <p className="mt-4 text-center text-zinc-400 max-w-xl mx-auto text-[15px] leading-relaxed">
          Four steps, fully automated. You get the insight without doing the work.
        </p>

        <div ref={containerRef} className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div
              key={s.number}
              className="step-card group rounded-2xl border border-white/8 bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/15 transition-all duration-300"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className={`rounded-xl p-2.5 ring-1 ${s.color}`}>
                  {s.icon}
                </div>
                <span className="text-3xl font-bold text-white/10 group-hover:text-white/20 transition-colors">
                  {s.number}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
