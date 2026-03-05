import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { ACTIVITY_STATUS_VALUES, ACTIVITY_TYPE_VALUES } from "@/lib/domain";

const createActivitySchema = z.object({
  leadId: z.string().uuid(),
  titre: z.string().min(2).max(160).optional(),
  description: z.string().max(4000).optional().default(""),
  type: z.enum(ACTIVITY_TYPE_VALUES),
  statut: z.enum(ACTIVITY_STATUS_VALUES).optional().default("a_faire"),
  dueDate: z.string().datetime().optional(),
  echeance: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  const status =
    request.nextUrl.searchParams.get("status") ||
    request.nextUrl.searchParams.get("statut") ||
    "";
  const leadId = request.nextUrl.searchParams.get("leadId") || "";

  const activities = await prisma.activity.findMany({
    where: {
      ...(status ? { statut: status } : {}),
      ...(leadId ? { leadId } : {}),
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
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ items: activities });
}

export async function POST(request: NextRequest) {
  try {
    const payload = createActivitySchema.parse(await request.json());

    const activity = await prisma.activity.create({
      data: {
        leadId: payload.leadId,
        titre: payload.titre || `Activite ${payload.type}`,
        description: payload.description,
        type: payload.type,
        statut: payload.statut,
        dueDate: new Date(payload.dueDate || payload.echeance || new Date().toISOString()),
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

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erreur creation activite." }, { status: 500 });
  }
}
