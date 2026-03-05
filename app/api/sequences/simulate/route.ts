import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { processSequences } from "@/lib/sequenceScheduler";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Route reservee au dev local." }, { status: 403 });
  }

  const result = await processSequences(prisma);
  return NextResponse.json({ ok: true, result });
}
