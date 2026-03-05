import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [todayCount, overdueCount, leadsTotal, activeEnrollments, upcomingActivities] =
    await Promise.all([
      prisma.activity.count({
        where: {
          statut: "a_faire",
          dueDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      prisma.activity.count({
        where: {
          statut: "a_faire",
          dueDate: {
            lt: startOfDay,
          },
        },
      }),
      prisma.lead.count(),
      prisma.sequenceEnrollment.findMany({
        where: {
          status: "active",
        },
        select: {
          leadId: true,
        },
      }),
      prisma.activity.findMany({
        where: {
          statut: "a_faire",
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
        orderBy: [{ dueDate: "asc" }],
        take: 5,
      }),
    ]);

  const leadsInSequence = new Set(activeEnrollments.map((entry) => entry.leadId)).size;

  return NextResponse.json({
    kpis: {
      todayCount,
      overdueCount,
      leadsTotal,
      leadsInSequence,
    },
    upcomingActivities,
  });
}
