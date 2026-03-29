import type { SourceConfig } from "@/server/sources/registry";
import type { NormalizedItem } from "@/server/sources/normalized";

export async function ingestGitHub(source: SourceConfig, limit = 20): Promise<NormalizedItem[]> {
  const resp = await fetch(source.url, {
    headers: {
      "User-Agent": "SignalAI",
      Accept: "application/vnd.github+json",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  });
  if (!resp.ok) throw new Error(`GitHub fetch failed: ${resp.status}`);

  const json = (await resp.json()) as unknown;
  const items =
    typeof json === "object" && json && Array.isArray((json as { items?: unknown }).items)
      ? ((json as { items: unknown[] }).items as unknown[])
      : [];

  return items.slice(0, limit).map((r0) => {
    const r = r0 as {
      full_name?: string;
      description?: string;
      stargazers_count?: number;
      language?: string;
      html_url?: string;
      created_at?: string;
    };
    const fullName = r.full_name ?? "unknown";
    const title = `${fullName}: ${r.description ?? ""}`.trim();
    return {
      title,
      content: `Repo: ${fullName}\nStars: ${r.stargazers_count ?? 0}\nLanguage: ${r.language ?? ""}\n\n${r.description ?? ""}`.trim(),
      source: source.name,
      source_type: source.type,
      layer: source.layer,
      url: r.html_url ?? source.url,
      created_at: r.created_at ? new Date(r.created_at) : new Date(),
      engagement: {
        stars: r.stargazers_count ?? 0,
      },
    } satisfies NormalizedItem;
  });
}
