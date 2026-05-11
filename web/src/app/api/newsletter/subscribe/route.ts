import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { addSubscriber } from "@/lib/beehiiv";

const BodySchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 422 });
  }

  const { email } = parsed.data;

  // Upsert local subscriber record
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (existing?.active) {
    return NextResponse.json({ data: { subscribed: true, existing: true } });
  }

  let beehiivId: string | undefined;
  if (process.env.BEEHIIV_API_KEY && process.env.BEEHIIV_PUBLICATION_ID) {
    try {
      beehiivId = await addSubscriber(email);
    } catch (err) {
      console.error("Beehiiv subscribe error:", err);
    }
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email, active: true, beehiivId },
    update: { active: true, beehiivId: beehiivId ?? undefined },
  });

  return NextResponse.json({ data: { subscribed: true } }, { status: 201 });
}
