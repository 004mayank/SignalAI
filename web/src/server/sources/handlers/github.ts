import type { SourceConfig } from "@/server/sources/registry";
import type { NormalizedItem } from "@/server/sources/normalized";
import { getEnv } from "@/lib/env";

export async function ingestGitHub(source: SourceConfig, limit = 20): Promise<NormalizedItem[]> {
  const { GITHUB_TOKEN } = getEnv();
  const resp = await fetch(source.url, {
    headers: {
      "User-Agent": "SignalAI",
      Accept: "application/vnd.github+json",
      ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
    },
  });
  if (!resp.ok) throw new Error(`GitHub fetch failed: ${resp.status}`);

  const json = (await resp.json()) as unknown;
  const items =
    typeof json === "object" && json && Array.isArray((json as { items?: unknown }).items)
      ? ((json as { items: unknown[] }).items as unknown[])
      : [];

  return items.slice(0, limit).flatMap((r0) => {
    const r = r0 as {
      full_name?: string;
      description?: string;
      stargazers_count?: number;
      language?: string;
      html_url?: string;
      created_at?: string;
      pushed_at?: string;
      topics?: string[];
    };
    // Skip repos with no name or no valid repo URL.
    if (!r.full_name || !r.html_url) return [];
    const title = `${r.full_name}: ${r.description ?? ""}`.trim();
    // Use pushed_at for recency so recently-active repos surface, not just newly created ones.
    const createdAt = r.pushed_at
      ? new Date(r.pushed_at)
      : r.created_at
        ? new Date(r.created_at)
        : new Date();
    return [{
      title,
      content: `Repo: ${r.full_name}\nStars: ${r.stargazers_count ?? 0}\nLanguage: ${r.language ?? ""}\nTopics: ${(r.topics ?? []).join(", ")}\n\n${r.description ?? ""}`.trim(),
      source: source.name,
      source_type: source.type,
      layer: source.layer,
      url: r.html_url,
      created_at: isNaN(createdAt.getTime()) ? new Date() : createdAt,
      engagement: {
        stars: r.stargazers_count ?? 0,
      },
    } satisfies NormalizedItem];
  });
}
