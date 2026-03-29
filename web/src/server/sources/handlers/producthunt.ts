import type { SourceConfig } from "@/server/sources/registry";
import type { NormalizedItem } from "@/server/sources/normalized";

// Product Hunt has no stable unauthenticated public API. For MVP we parse Next.js data.
export async function ingestProductHunt(source: SourceConfig, limit = 20): Promise<NormalizedItem[]> {
  const resp = await fetch(source.url, {
    headers: { "User-Agent": "SignalAI/1.0" },
  });
  if (!resp.ok) throw new Error(`Product Hunt fetch failed: ${resp.status}`);

  const html = await resp.text();
  const match = html.match(/__NEXT_DATA__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/);
  if (!match) return [];

  const data = JSON.parse(match[1]) as unknown;
  const products = extractProducts(data);

  return products.slice(0, limit).map((p) => {
    const title = p.name ? `${p.name}: ${p.tagline ?? ""}` : String(p.tagline ?? "Product");
    const url = p.url || (p.slug ? `https://www.producthunt.com/posts/${p.slug}` : source.url);
    return {
      title,
      content: p.description || p.tagline || title,
      source: source.name,
      source_type: source.type,
      layer: source.layer,
      url,
      created_at: p.createdAt ? new Date(p.createdAt) : new Date(),
      engagement: {
        upvotes: p.votesCount,
        comments: p.commentsCount,
      },
    } satisfies NormalizedItem;
  });
}

type Product = {
  name?: string;
  tagline?: string;
  description?: string;
  url?: string;
  slug?: string;
  createdAt?: string;
  votesCount?: number;
  commentsCount?: number;
};

function extractProducts(data: unknown): Product[] {
  if (!data || typeof data !== "object") return [];
  const props = (data as { props?: unknown }).props;
  if (!props || typeof props !== "object") return [];

  const pageProps = (props as { pageProps?: unknown }).pageProps;
  if (!pageProps || typeof pageProps !== "object") return [];

  // Try: dehydratedState.queries[].state.data.pages[].posts[]
  const dehydrated = (pageProps as { dehydratedState?: unknown }).dehydratedState;
  if (dehydrated && typeof dehydrated === "object") {
    const queries = (dehydrated as { queries?: unknown }).queries;
    if (Array.isArray(queries)) {
      const out: Product[] = [];
      for (const q of queries) {
        const state = q && typeof q === "object" ? (q as { state?: unknown }).state : undefined;
        const data2 = state && typeof state === "object" ? (state as { data?: unknown }).data : undefined;
        const pages = data2 && typeof data2 === "object" ? (data2 as { pages?: unknown }).pages : undefined;
        if (Array.isArray(pages)) {
          for (const page of pages) {
            const posts = page && typeof page === "object" ? (page as { posts?: unknown }).posts : undefined;
            if (Array.isArray(posts)) {
              for (const p of posts) out.push(p as Product);
            }
          }
        }
      }
      if (out.length) return out;
    }
  }

  // Fallback: topic.posts
  const topic = (pageProps as { topic?: unknown }).topic;
  if (topic && typeof topic === "object") {
    const posts = (topic as { posts?: unknown }).posts;
    if (Array.isArray(posts)) return posts as Product[];
  }

  return [];
}
