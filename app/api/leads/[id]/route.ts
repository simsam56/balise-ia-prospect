import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { runLeadStatusAutomations } from "@/lib/automations";
import { prisma } from "@/lib/db";
import { LEAD_STATUS_VALUES, LeadStatus } from "@/lib/domain";

const updateLeadSchema = z.object({
  statut: z.enum(LEAD_STATUS_VALUES).optional(),
  statutLead: z.enum(LEAD_STATUS_VALUES).optional(),
  notes: z.string().max(5000).optional(),
  scoreGlobal: z.number().int().min(0).max(100).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const payload = updateLeadSchema.parse(await request.json());

    const existing = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, statutLead: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lead introuvable." }, { status: 404 });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...((payload.statutLead || payload.statut)
          ? { statutLead: payload.statutLead || payload.statut }
          : {}),
        ...(typeof payload.notes === "string" ? { notes: payload.notes } : {}),
        ...(typeof payload.scoreGlobal === "number" ? { scoreGlobal: payload.scoreGlobal } : {}),
      },
      include: {
        contact: {
          include: {
            entreprise: true,
          },
        },
      },
    });

    if (payload.statutLead || payload.statut) {
      await runLeadStatusAutomations(prisma, {
        leadId: lead.id,
        previousStatus: existing.statutLead as LeadStatus,
        nextStatus: (payload.statutLead || payload.statut) as LeadStatus,
      });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erreur de mise a jour lead." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur de suppression lead." }, { status: 500 });
  }
}
