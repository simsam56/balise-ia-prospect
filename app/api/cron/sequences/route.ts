import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { processSequences } from "@/lib/sequenceScheduler";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : "";

  if (!expected || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized cron call." }, { status: 401 });
  }

  const result = await processSequences(prisma);
  return NextResponse.json({ ok: true, result });
}
