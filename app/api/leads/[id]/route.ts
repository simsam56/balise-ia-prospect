import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { LEAD_STATUS_VALUES } from "@/lib/domain";

const updateLeadSchema = z.object({
  statutLead: z.enum(LEAD_STATUS_VALUES).optional(),
  notes: z.string().max(5000).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const payload = updateLeadSchema.parse(await request.json());

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...(payload.statutLead ? { statutLead: payload.statutLead } : {}),
      ...(typeof payload.notes === "string" ? { notes: payload.notes } : {}),
    },
    include: {
      contact: {
        include: {
          entreprise: true,
        },
      },
    },
  });

  return NextResponse.json({ lead });
}
