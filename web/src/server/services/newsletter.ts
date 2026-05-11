import { prisma } from "@/lib/db";
import { getOpenAIClient } from "@/lib/openai";
import { sendNewsletter } from "@/lib/beehiiv";
import {
  renderNewsletterHtml,
  renderNewsletterSubject,
  renderPreviewText,
} from "@/lib/newsletter-template";

function weekLabel(): string {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1); // Monday
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Sunday
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}, ${now.getFullYear()}`;
}

export async function generateAndSendWeeklyNewsletter(): Promise<{
  postId: string;
  weekLabel: string;
}> {
  // 1. Fetch top trends and articles for this week
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

  // 2. Generate recommended actions via LLM
  const openai = getOpenAIClient();
  let recommendedActions: string[] = [
    "Pick one emerging trend and prototype a small integration this week.",
    "Share your take on the top signal with your team or community.",
    "Update your AI tool stack watchlist based on this week's releases.",
  ];

  if (openai && topTrends.length > 0) {
    const trendBullets = topTrends
      .map((t) => `- ${t.name} (${t.category}) velocity=${Math.round(t.velocity * 100)}%`)
      .join("\n");
    const prompt = `You are an AI trend analyst. Based on these top AI trends this week:\n${trendBullets}\n\nReturn JSON {"recommended_actions":["...","...","..."]} — 3 practical, specific actions for AI builders. Be concrete, not generic.`;

    const resp = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    const json = JSON.parse(resp.choices[0]?.message?.content ?? "{}");
    if (Array.isArray(json.recommended_actions) && json.recommended_actions.length > 0) {
      recommendedActions = json.recommended_actions.map(String);
    }
  }

  // 3. Render HTML
  const label = weekLabel();
  const trends = topTrends.map((t) => ({
    name: t.name,
    summary: t.summary,
    category: t.category,
    velocity: `${Math.round(t.velocity * 100)}%`,
    article_count: t.articleCount,
  }));

  const html = renderNewsletterHtml({
    generatedAt: new Date().toISOString(),
    weekLabel: label,
    topTrends: trends,
    keyInsights: keyInsights.map((a) => ({
      title: a.title,
      url: a.url,
      summary: a.summary,
      actionableTakeaway: a.actionableTakeaway,
      impactLevel: a.impactLevel,
      targetPersona: a.targetPersona,
    })),
    recommendedActions,
  });

  const subject = renderNewsletterSubject(label);
  const previewText = renderPreviewText(trends);

  // 4. Send via Beehiiv
  const postId = await sendNewsletter({ subject, previewText, body: html });

  return { postId, weekLabel: label };
}
