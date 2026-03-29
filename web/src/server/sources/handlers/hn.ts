import type { SourceConfig } from "@/server/sources/registry";
import type { NormalizedItem } from "@/server/sources/normalized";

export async function ingestHN(source: SourceConfig, limit = 20): Promise<NormalizedItem[]> {
  const resp = await fetch(source.url);
  if (!resp.ok) throw new Error(`HN fetch failed: ${resp.status}`);
  const ids = (await resp.json()) as number[];

  const top = ids.slice(0, limit);
  const items = await Promise.all(
    top.map(async (id) => {
      const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      if (!r.ok) return null;
      return (await r.json()) as unknown;
    }),
  );

  return items
    .filter(Boolean)
    .map((d0) => {
      const d = d0 as {
        id?: number;
        url?: string;
        title?: string;
        time?: number;
        score?: number;
        descendants?: number;
      };
      const url = d.url || `https://news.ycombinator.com/item?id=${d.id ?? ""}`;
      return {
        title: d.title ?? "(untitled)",
        content: `HN: ${d.title ?? ""}`,
        source: source.name,
        source_type: source.type,
        layer: source.layer,
        url,
        created_at: d.time ? new Date(d.time * 1000) : new Date(),
        engagement: {
          upvotes: d.score,
          comments: d.descendants,
        },
      } satisfies NormalizedItem;
    });
}
