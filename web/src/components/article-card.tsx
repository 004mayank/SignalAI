import Link from "next/link";
import { Badge } from "@/components/badge";

export function ArticleCard(props: {
  article: {
    id: string;
    title: string;
    source: string;
    url: string;
    summary: string;
    whyItMatters: string;
    useCase: string;
    category: string;
    relevanceScore: number;
    createdAt: Date;
  };
}) {
  const a = props.article;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{a.category}</Badge>
            <Badge variant="muted">Relevance {a.relevanceScore}/5</Badge>
            <span className="text-xs text-zinc-500">{a.source}</span>
          </div>
          <h3 className="mt-2 line-clamp-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            <Link href={a.url} target="_blank" className="hover:underline">
              {a.title}
            </Link>
          </h3>
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        <div>
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">TL;DR</div>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{a.summary}</p>
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Why it matters</div>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{a.whyItMatters}</p>
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Use case</div>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{a.useCase}</p>
        </div>
      </div>
    </div>
  );
}
