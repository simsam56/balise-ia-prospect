import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";

const patchSchema = z.object({
  status: z.enum(["paused", "active", "stopped", "completed"]),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const payload = patchSchema.parse(await request.json());

    const data =
      payload.status === "active"
        ? {
            status: payload.status,
            nextSendDate: new Date(),
          }
        : { status: payload.status };

    const enrollment = await prisma.sequenceEnrollment.update({
      where: { id },
      data,
    });

    return NextResponse.json({ enrollment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erreur update enrollment." }, { status: 500 });
  }
}
