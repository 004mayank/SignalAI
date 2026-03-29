import { prisma } from "@/lib/db";
import { analyzeArticleWithLLM } from "@/lib/ai";
import { embedText } from "@/server/services/embeddings";
import { cosineSimilarity } from "@/server/services/similarity";
import { assignCluster, updateClusterCentroid, upsertTrendForCluster } from "@/server/services/trend-engine";
import { computeVelocityPercent, upsertTodayTrendStat } from "@/server/services/trend-stats";
import { engagementScore, finalRelevanceScore } from "@/server/services/scoring";
import { SOURCES, type SourceConfig } from "@/server/sources/registry";
import { ingestSource } from "@/server/sources/ingest";

export async function runIngestion(params?: {
  // Backward compatible: RSS feeds list
  feeds?: string[];
  // New: restrict to certain registry source names
  sourceNames?: string[];
  limitPerSource?: number;
}) {
  const limit = params?.limitPerSource ?? 15;

  const sources: SourceConfig[] = params?.feeds?.length
    ? params.feeds.map((url) => ({
        name: new URL(url).hostname,
        type: "rss",
        url,
        weight: 4,
        layer: "distribution",
      }))
    : params?.sourceNames?.length
      ? SOURCES.filter((s) => params.sourceNames!.includes(s.name))
      : SOURCES;

  let fetched = 0;
  let created = 0;
  let skipped = 0;
  const errors: { source: string; error: string }[] = [];

  for (const source of sources) {
    try {
      const normalized = await ingestSource(source, limit);
      fetched += normalized.length;

      for (const item of normalized) {
        const url = item.url;
        const title = item.title;
        const content = item.content;

        if (!url || !title || !content) {
          skipped++;
          continue;
        }

        const exists = await prisma.article.findUnique({ where: { url } });
        if (exists) {
          skipped++;
          continue;
        }

        const ai = await analyzeArticleWithLLM({
          title,
          source: item.source,
          url,
          content,
        });

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

        const engScore = engagementScore({
          stars: item.engagement.stars,
          upvotes: item.engagement.upvotes,
          comments: item.engagement.comments,
        });

        const finalScore = finalRelevanceScore({
          llmScore: ai.relevance_score,
          sourceWeight: source.weight,
          engagementScore: engScore,
        });

        // If duplicate: store it but mark duplicateOfId, no clustering.
        if (dup && dup.sim >= 0.9) {
          await prisma.article.create({
            data: {
              title,
              url,
              source: item.source,
              sourceType: item.source_type,
              layer: item.layer,
              engagementStars: item.engagement.stars,
              engagementUpvotes: item.engagement.upvotes,
              engagementComments: item.engagement.comments,
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
              publishedAt: item.created_at,
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
            source: item.source,
            sourceType: item.source_type,
            layer: item.layer,
            engagementStars: item.engagement.stars,
            engagementUpvotes: item.engagement.upvotes,
            engagementComments: item.engagement.comments,
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
            publishedAt: item.created_at,
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({ source: source.name, error: msg });
    }
  }

  return { sources: sources.map((s) => s.name), fetched, created, skipped, errors };
}
