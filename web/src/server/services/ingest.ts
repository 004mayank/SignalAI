import Parser from "rss-parser";
import { prisma } from "@/lib/db";
import { analyzeArticleWithLLM } from "@/lib/ai";
import { stripHtml, truncate } from "@/lib/text";
import { embedText } from "@/server/services/embeddings";
import { cosineSimilarity } from "@/server/services/similarity";
import { assignCluster, updateClusterCentroid, upsertTrendForCluster } from "@/server/services/trend-engine";
import { computeVelocityPercent, upsertTodayTrendStat } from "@/server/services/trend-stats";
import { finalRelevanceScore, recencyScore, sourceWeight } from "@/server/services/scoring";

export async function runIngestion(params: { feeds: string[]; limitPerFeed?: number }) {
  const parser = new Parser();
  const limit = params.limitPerFeed ?? 15;

  let fetched = 0;
  let created = 0;
  let skipped = 0;

  for (const feedUrl of params.feeds) {
    const feed = await parser.parseURL(feedUrl);
    const items = (feed.items ?? []).slice(0, limit);

    for (const item of items) {
      fetched++;
      const url = item.link;
      const title = item.title;
      if (!url || !title) {
        skipped++;
        continue;
      }

      const exists = await prisma.article.findUnique({ where: { url } });
      if (exists) {
        skipped++;
        continue;
      }

      const source = feed.title || new URL(feedUrl).hostname;
      const it = item as unknown as {
        contentSnippet?: string;
        content?: string;
        summary?: string;
        pubDate?: string;
      };
      const rawContent = it.contentSnippet || it.content || it.summary || "";
      const content = truncate(stripHtml(String(rawContent)), 8000);

      const ai = await analyzeArticleWithLLM({ title, source, url, content });
      const embedding = await embedText(`${title}\n\n${content}`);

      // Dedup via embeddings (compare against recent items).
      const recent = await prisma.article.findMany({
        orderBy: { createdAt: "desc" },
        take: 300,
        select: { id: true, embedding: true },
      });
      const dup = recent
        .map((r) => ({ id: r.id, sim: cosineSimilarity(embedding, r.embedding) }))
        .sort((a, b) => b.sim - a.sim)[0];

      const publishedAt = it.pubDate ? new Date(it.pubDate) : undefined;
      const finalScore = finalRelevanceScore({
        llmScore: ai.relevance_score,
        sourceWeight: sourceWeight(source),
        recencyScore: recencyScore(publishedAt),
      });

      if (dup && dup.sim >= 0.9) {
        await prisma.article.create({
          data: {
            title,
            url,
            source,
            content,
            summary: ai.tldr,
            whatHappened: ai.what_happened,
            whyItMatters: ai.why_it_matters,
            useCase: ai.use_case,
            actionableTakeaway: ai.actionable_takeaway,
            impactLevel: ai.impact_level,
            targetPersona: ai.target_persona,
            category: ai.category,
            llmScore: ai.relevance_score,
            finalScore,
            embedding,
            duplicateOfId: dup.id,
            publishedAt,
          },
        });
        skipped++;
        continue;
      }

      const { clusterId } = await assignCluster({ category: ai.category, embedding, threshold: 0.8 });

      await prisma.article.create({
        data: {
          title,
          url,
          source,
          content,
          summary: ai.tldr,
          whatHappened: ai.what_happened,
          whyItMatters: ai.why_it_matters,
          useCase: ai.use_case,
          actionableTakeaway: ai.actionable_takeaway,
          impactLevel: ai.impact_level,
          targetPersona: ai.target_persona,
          category: ai.category,
          llmScore: ai.relevance_score,
          finalScore,
          embedding,
          clusterId,
          publishedAt,
        },
      });

      await updateClusterCentroid(clusterId);
      await upsertTrendForCluster({ clusterId, category: ai.category });

      const trend = await prisma.trend.findUnique({ where: { clusterId } });
      if (trend) {
        await upsertTodayTrendStat(trend.id, clusterId);
        const v = await computeVelocityPercent(trend.id);
        await prisma.trend.update({ where: { id: trend.id }, data: { velocity: v } });
      }

      created++;
    }
  }

  return { feeds: params.feeds, fetched, created, skipped };
}
