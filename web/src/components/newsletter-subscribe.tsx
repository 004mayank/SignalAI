"use client";

import { useState } from "react";

type State = "idle" | "loading" | "success" | "error";

export function NewsletterSubscribe() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setErrorMsg(body.error ?? "Something went wrong");
        setState("error");
        return;
      }
      setState("success");
    } catch {
      setErrorMsg("Network error - please try again");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-xl border border-lime-400/20 bg-lime-400/5 p-3 text-xs text-lime-300">
        ✓ You&apos;re on the list. Weekly signals incoming.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/5 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Weekly Newsletter
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
        Get the top AI signals delivered every Friday.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-2">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="rounded-lg bg-cyan-500/20 px-3 py-2 text-xs font-semibold text-cyan-200 ring-1 ring-cyan-400/30 hover:bg-cyan-500/30 disabled:opacity-50"
        >
          {state === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
        {state === "error" && (
          <p className="text-[11px] text-red-400">{errorMsg}</p>
        )}
      </form>
    </div>
  );
}
