import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  const samples = [
    {
      title: "OpenAI releases a smaller, faster reasoning model",
      source: "Mock",
      url: "https://example.com/openai-small-reasoning-model",
      content:
        "A new smaller model aims to reduce latency and cost while keeping strong reasoning. Early benchmarks show competitive performance for agentic workflows.",
      summary: "A smaller reasoning-focused model reduces latency and cost while keeping strong performance.",
      whatHappened: "A new smaller reasoning model was announced with better latency/cost tradeoffs.",
      whyItMatters: "Makes agentic features practical in more products due to lower serving cost.",
      useCase: "Ship faster copilots/agents with lower inference cost.",
      category: "LLMs" as const,
      relevanceScore: 4,
    },
    {
      title: "New open-source agent framework simplifies tool calling",
      source: "Mock",
      url: "https://example.com/oss-agent-framework",
      content:
        "A lightweight framework standardizes tool schemas and execution traces, improving debuggability.",
      summary: "An OSS agent framework standardizes tools and traces to improve reliability.",
      whatHappened: "An open-source agent framework was released with better tool-calling primitives.",
      whyItMatters: "Better traces and schemas reduce time-to-debug and improve agent safety.",
      useCase: "Build internal automation agents with clear observability.",
      category: "Agents" as const,
      relevanceScore: 5,
    },
    {
      title: "GPU inference cost optimizations for transformer serving",
      source: "Mock",
      url: "https://example.com/gpu-inference-optimizations",
      content:
        "A set of optimizations improve throughput via batching, KV cache tuning, and quantization.",
      summary: "Serving optimizations improve throughput with batching, KV tuning, and quantization.",
      whatHappened: "New best practices for transformer serving were published.",
      whyItMatters: "Throughput gains directly reduce cost for production AI features.",
      useCase: "Lower infra cost for LLM endpoints and chat features.",
      category: "Infra" as const,
      relevanceScore: 3,
    },
  ];

  let created = 0;
  for (const s of samples) {
    const exists = await prisma.article.findUnique({ where: { url: s.url } });
    if (exists) continue;
    await prisma.article.create({
      data: {
        title: s.title,
        source: s.source,
        url: s.url,
        content: s.content,
        summary: s.summary,
        whatHappened: s.whatHappened,
        whyItMatters: s.whyItMatters,
        useCase: s.useCase,
        category: s.category,
        relevanceScore: s.relevanceScore,
      },
    });
    created++;
  }

  return NextResponse.json({ created });
}
