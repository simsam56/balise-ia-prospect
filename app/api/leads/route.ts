import { NextRequest, NextResponse } from "next/server";

import { buildLeadWhere, normalizeLeadFilters } from "@/lib/lead-filters";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const filters = normalizeLeadFilters(request.nextUrl.searchParams);
  const where = buildLeadWhere(filters);

  const total = await prisma.lead.count({ where });

  const items = await prisma.lead.findMany({
    where,
    include: {
      contact: {
        include: {
          entreprise: true,
        },
      },
    },
    orderBy: [{ scoreGlobal: "desc" }, { updatedAt: "desc" }],
    skip: (filters.page - 1) * filters.pageSize,
    take: filters.pageSize,
  });

  return NextResponse.json({
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    filters,
  });
}
