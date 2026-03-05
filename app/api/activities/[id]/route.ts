import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { ACTIVITY_STATUS_VALUES, ACTIVITY_TYPE_VALUES } from "@/lib/domain";

const patchActivitySchema = z.object({
  titre: z.string().min(2).max(160).optional(),
  description: z.string().max(4000).optional(),
  type: z.enum(ACTIVITY_TYPE_VALUES).optional(),
  statut: z.enum(ACTIVITY_STATUS_VALUES).optional(),
  dueDate: z.string().datetime().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const payload = patchActivitySchema.parse(await request.json());

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        ...(payload.titre ? { titre: payload.titre } : {}),
        ...(typeof payload.description === "string" ? { description: payload.description } : {}),
        ...(payload.type ? { type: payload.type } : {}),
        ...(payload.statut ? { statut: payload.statut } : {}),
        ...(payload.dueDate ? { dueDate: new Date(payload.dueDate) } : {}),
      },
      include: {
        lead: {
          include: {
            contact: {
              include: {
                entreprise: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ activity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erreur mise a jour activite." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await prisma.activity.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur suppression activite." }, { status: 500 });
  }
}
