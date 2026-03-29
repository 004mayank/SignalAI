import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const PrefSchema = z.object({
  liked_categories: z.array(z.enum(["Agents", "LLMs", "Infra", "UX", "Other"]))
    .optional()
    .default([]),
  ignored_categories: z.array(z.enum(["Agents", "LLMs", "Infra", "UX", "Other"]))
    .optional()
    .default([]),
});

function getUserId(req: Request) {
  // Lightweight personalization: client sets x-user-id (or use a cookie later).
  return req.headers.get("x-user-id") || "demo";
}

export async function GET(req: Request) {
  const id = getUserId(req);
  const user = await prisma.user.upsert({
    where: { id },
    create: { id, likedCategories: [], ignoredCategories: [] },
    update: {},
  });

  return NextResponse.json({
    user_id: user.id,
    liked_categories: user.likedCategories,
    ignored_categories: user.ignoredCategories,
  });
}

export async function PUT(req: Request) {
  const id = getUserId(req);
  const body = PrefSchema.parse(await req.json());

  const user = await prisma.user.upsert({
    where: { id },
    create: {
      id,
      likedCategories: body.liked_categories,
      ignoredCategories: body.ignored_categories,
    },
    update: {
      likedCategories: body.liked_categories,
      ignoredCategories: body.ignored_categories,
    },
  });

  return NextResponse.json({
    user_id: user.id,
    liked_categories: user.likedCategories,
    ignored_categories: user.ignoredCategories,
  });
}
