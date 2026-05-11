import { Shell } from "@/components/shell";
import { NewsletterSubscribe } from "@/components/newsletter-subscribe";

export default function NewsletterPage() {
  return (
    <Shell sidebarFilters={false}>
      <div className="mx-auto max-w-xl py-20">
        <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          ⚡ SignalAI Weekly
        </div>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          The AI signal,
          <br />
          <span className="text-cyan-200">no noise.</span>
        </h1>

        <p className="mt-5 text-sm leading-relaxed text-zinc-400">
          Every Friday, get the top 5 trending AI developments ranked by velocity — with executive
          summaries, technical implications, and concrete actions from across 20+ sources including
          arXiv, GitHub, Anthropic, OpenAI, DeepMind, and more.
        </p>

        <div className="mt-4 space-y-2 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Trend velocity ranked by 7-day momentum
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            LLM-extracted executive summary per signal
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Actionable takeaway for devs, PMs, and founders
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            No fluff — just what matters and why
          </div>
        </div>

        <div className="mt-8">
          <NewsletterSubscribe />
        </div>

        <p className="mt-4 text-[11px] text-zinc-600">
          Free forever. Unsubscribe anytime.
        </p>
      </div>
    </Shell>
  );
}
