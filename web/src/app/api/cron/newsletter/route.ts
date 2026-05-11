import { NextResponse } from "next/server";
import { generateAndSendWeeklyNewsletter } from "@/server/services/newsletter";

// Called by Vercel Cron every Friday at 6 AM UTC (see vercel.json).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await generateAndSendWeeklyNewsletter();
  return NextResponse.json({ data: result });
}
