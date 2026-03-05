import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { SEQUENCES } from "@/lib/sequenceCatalog";

export async function GET() {
  const enrollments = await prisma.sequenceEnrollment.findMany({
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
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({
    sequences: SEQUENCES,
    enrollments,
  });
}
