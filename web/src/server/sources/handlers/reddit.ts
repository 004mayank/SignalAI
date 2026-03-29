import type { SourceConfig } from "@/server/sources/registry";
import type { NormalizedItem } from "@/server/sources/normalized";
import { truncate } from "@/lib/text";

export async function ingestReddit(source: SourceConfig, limit = 20): Promise<NormalizedItem[]> {
  const resp = await fetch(source.url, {
    headers: {
      "User-Agent": "SignalAI/1.0",
      Accept: "application/json",
    },
  });
  if (!resp.ok) throw new Error(`Reddit fetch failed: ${resp.status}`);

  const json = (await resp.json()) as unknown;
  const children = (() => {
    if (!json || typeof json !== "object") return [] as unknown[];
    const data = (json as { data?: unknown }).data;
    if (!data || typeof data !== "object") return [] as unknown[];
    const kids = (data as { children?: unknown }).children;
    return Array.isArray(kids) ? kids : ([] as unknown[]);
  })();

  const out: NormalizedItem[] = [];

  for (const c0 of children.slice(0, limit)) {
    const c = c0 as { data?: unknown };
    const d = (c.data ?? {}) as {
      url_overridden_by_dest?: string;
      url?: string;
      title?: string;
      selftext?: string;
      subreddit?: string;
      created_utc?: number;
      ups?: number;
      num_comments?: number;
    };

    const url = d.url_overridden_by_dest || d.url;
    const title = d.title;
    if (!url || !title) continue;

    const selftext = d.selftext ? truncate(String(d.selftext), 8000) : "";

    out.push({
      title,
      content: selftext || `Subreddit: r/${d.subreddit ?? ""}\n${title}`,
      source: source.name,
      source_type: source.type,
      layer: source.layer,
      url,
      created_at: d.created_utc ? new Date(d.created_utc * 1000) : new Date(),
      engagement: {
        upvotes: d.ups,
        comments: d.num_comments,
      },
    });
  }

  return out;
}
