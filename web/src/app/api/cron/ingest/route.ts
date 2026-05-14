import { NextResponse } from "next/server";
import { runIngestion } from "@/server/services/ingest";

// Called by Vercel Cron every 6 hours (see vercel.json).
// Guard with CRON_SECRET to prevent unauthorized triggers.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  // In production, CRON_SECRET must be set — reject requests without it.
  // Vercel automatically sends Authorization: Bearer <CRON_SECRET> on its cron calls.
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await runIngestion();
  return NextResponse.json({ data: result });
}
