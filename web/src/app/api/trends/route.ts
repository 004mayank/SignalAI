import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatVelocity } from "@/server/services/trend-stats";

export async function GET() {
  // Return top trends by velocity + volume.
  const trends = await prisma.trend.findMany({
    orderBy: [{ velocity: "desc" }, { articleCount: "desc" }],
    take: 50,
    select: {
      name: true,
      summary: true,
      articleCount: true,
      velocity: true,
      category: true,
      clusterId: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(
    trends.map((t) => ({
      name: t.name,
      summary: t.summary,
      article_count: t.articleCount,
      velocity: formatVelocity(t.velocity),
      category: t.category,
      cluster_id: t.clusterId,
      updated_at: t.updatedAt,
      demo: false,
    })),
  );
}
