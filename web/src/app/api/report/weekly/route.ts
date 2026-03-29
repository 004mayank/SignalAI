import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOpenAIClient } from "@/lib/openai";

export async function GET() {
  const topTrends = await prisma.trend.findMany({
    orderBy: [{ velocity: "desc" }, { articleCount: "desc" }],
    take: 5,
    select: { name: true, summary: true, category: true, velocity: true, articleCount: true },
  });

  const keyInsights = await prisma.article.findMany({
    where: { duplicateOfId: null },
    orderBy: [{ finalScore: "desc" }, { createdAt: "desc" }],
    take: 5,
    select: {
      title: true,
      summary: true,
      actionableTakeaway: true,
      targetPersona: true,
      impactLevel: true,
      url: true,
    },
  });

  const openai = getOpenAIClient();
  let recommendedActions: string[] = [];

  if (openai) {
    const trendBullets = topTrends
      .map((t) => `- ${t.name} (${t.category}) v=${Math.round(t.velocity * 100)}% count=${t.articleCount}`)
      .join("\n");

    const insightBullets = keyInsights
      .map((i) => `- ${i.title} (impact=${i.impactLevel}, persona=${i.targetPersona})`) 
      .join("\n");

    const prompt = `You are an AI trend analyst writing a weekly report for builders.\n\nTop trends:\n${trendBullets}\n\nKey insights:\n${insightBullets}\n\nReturn JSON: {"recommended_actions": ["..."]}. Each action should be specific and practical. 3-6 items.`;

    const resp = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [{ role: "user", content: prompt }],
      text: {
        format: {
          type: "json_schema",
          name: "WeeklyReport",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              recommended_actions: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["recommended_actions"],
          },
        },
      },
    });

    const json = JSON.parse(resp.output_text);
    recommendedActions = Array.isArray(json.recommended_actions)
      ? json.recommended_actions.map(String)
      : [];
  } else {
    recommendedActions = [
      "Pick 1 trend and run a 1-week prototype to validate usefulness.",
      "Update your roadmap with 1 concrete experiment driven by this week’s insights.",
      "Create an internal doc: ‘What changed this week in AI infra and why it matters’.",
    ];
  }

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    top_trends: topTrends.map((t) => ({
      name: t.name,
      summary: t.summary,
      category: t.category,
      velocity: `${Math.round(t.velocity * 100)}%`,
      article_count: t.articleCount,
    })),
    key_insights: keyInsights,
    recommended_actions: recommendedActions,
  });
}
