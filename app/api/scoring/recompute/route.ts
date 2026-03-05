import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { recomputeAllLeadScores } from "@/lib/scoring";

export async function POST() {
  const result = await recomputeAllLeadScores(prisma);
  return NextResponse.json(result);
}
