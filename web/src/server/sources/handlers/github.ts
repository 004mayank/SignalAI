import type { SourceConfig } from "@/server/sources/registry";
import type { NormalizedItem } from "@/server/sources/normalized";
import { getEnv } from "@/lib/env";

export async function ingestGitHub(source: SourceConfig, limit = 20): Promise<NormalizedItem[]> {
  const { GITHUB_TOKEN } = getEnv();
  const url = typeof source.url === "function" ? source.url() : source.url;
  const resp = await fetch(url, {
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

  const now = Date.now();

  return items.slice(0, limit).flatMap((r0) => {
    const r = r0 as {
      full_name?: string;
      description?: string;
      stargazers_count?: number;
      forks_count?: number;
      watchers_count?: number;
      open_issues_count?: number;
      language?: string;
      html_url?: string;
      created_at?: string;
      pushed_at?: string;
      topics?: string[];
    };
    // Skip repos with no name or no valid repo URL.
    if (!r.full_name || !r.html_url) return [];
    const title = `${r.full_name}: ${r.description ?? ""}`.trim();

    // Compute viral velocity: stars gained per day since repo creation.
    const stars = r.stargazers_count ?? 0;
    const repoCreatedAt = r.created_at ? new Date(r.created_at) : null;
    const ageMs = repoCreatedAt ? now - repoCreatedAt.getTime() : null;
    const ageDays = ageMs ? Math.max(1, ageMs / (1000 * 60 * 60 * 24)) : null;
    const starsPerDay = ageDays ? +(stars / ageDays).toFixed(2) : null;

    // Use pushed_at for recency so recently-active repos surface.
    const createdAt = r.pushed_at
      ? new Date(r.pushed_at)
      : repoCreatedAt ?? new Date();

    const viralNote = starsPerDay && starsPerDay >= 5
      ? `\nViral velocity: ${starsPerDay} stars/day`
      : "";

    return [{
      title,
      content: `Repo: ${r.full_name}\nStars: ${stars}\nForks: ${r.forks_count ?? 0}\nLanguage: ${r.language ?? ""}\nTopics: ${(r.topics ?? []).join(", ")}\nAge (days): ${ageDays ? Math.round(ageDays) : "unknown"}${viralNote}\n\n${r.description ?? ""}`.trim(),
      source: source.name,
      source_type: source.type,
      layer: source.layer,
      url: r.html_url,
      created_at: isNaN(createdAt.getTime()) ? new Date() : createdAt,
      engagement: {
        stars,
        // Surface forks as upvotes so the engagement scorer sees them too.
        upvotes: r.forks_count ?? 0,
      },
    } satisfies NormalizedItem];
  });
}
