import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { removeSubscriber } from "@/lib/beehiiv";

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

  await prisma.newsletterSubscriber.updateMany({
    where: { email },
    data: { active: false },
  });

  if (process.env.BEEHIIV_API_KEY && process.env.BEEHIIV_PUBLICATION_ID) {
    try {
      await removeSubscriber(email);
    } catch (err) {
      console.error("Beehiiv unsubscribe error:", err);
    }
  }

  return NextResponse.json({ data: { unsubscribed: true } });
}
