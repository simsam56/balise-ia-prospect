import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { enrollLeadInSequence } from "@/lib/sequences";

const enrollSchema = z.object({
  leadId: z.string().uuid(),
  sequenceId: z.string().min(3),
});

export async function POST(request: NextRequest) {
  try {
    const payload = enrollSchema.parse(await request.json());
    const enrollment = await enrollLeadInSequence(prisma, payload);
    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erreur enrollment sequence." }, { status: 500 });
  }
}
