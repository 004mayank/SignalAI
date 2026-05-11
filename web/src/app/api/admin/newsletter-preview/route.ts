import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  renderNewsletterHtml,
  renderNewsletterSubject,
  renderPreviewText,
} from "@/lib/newsletter-template";

function requireAdminKey(req: Request): boolean {
  const key = process.env.ADMIN_API_KEY;
  if (!key) return true;
  return req.headers.get("x-admin-key") === key;
}

// GET /api/admin/newsletter-preview — render newsletter HTML without sending
export async function GET(req: Request) {
  if (!requireAdminKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const topTrends = await prisma.trend.findMany({
    orderBy: [{ velocity: "desc" }, { articleCount: "desc" }],
    take: 5,
    select: { name: true, summary: true, category: true, velocity: true, articleCount: true },
  });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const keyInsights = await prisma.article.findMany({
    where: { duplicateOfId: null, createdAt: { gte: sevenDaysAgo } },
    orderBy: [{ finalScore: "desc" }, { createdAt: "desc" }],
    take: 7,
    select: {
      title: true,
      url: true,
      summary: true,
      actionableTakeaway: true,
      impactLevel: true,
      targetPersona: true,
    },
  });

  const weekLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const trends = topTrends.map((t) => ({
    name: t.name,
    summary: t.summary,
    category: t.category,
    velocity: `${Math.round(t.velocity * 100)}%`,
    article_count: t.articleCount,
  }));

  const html = renderNewsletterHtml({
    generatedAt: new Date().toISOString(),
    weekLabel,
    topTrends: trends,
    keyInsights: keyInsights.map((a) => ({
      title: a.title,
      url: a.url,
      summary: a.summary,
      actionableTakeaway: a.actionableTakeaway,
      impactLevel: a.impactLevel,
      targetPersona: a.targetPersona,
    })),
    recommendedActions: ["Preview only — actions generated at send time."],
  });

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
