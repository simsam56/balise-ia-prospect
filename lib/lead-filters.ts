import { Prisma } from "@prisma/client";

import { LeadPriority, LeadStatus } from "@/lib/domain";

export type LeadFilterInput = {
  companyId?: string;
  search?: string;
  priorite?: LeadPriority;
  statutLead?: LeadStatus;
  region?: string;
  ville?: string;
  secteur?: string;
  minScore?: number;
  page?: number;
  pageSize?: number;
};

export function normalizeLeadFilters(params: URLSearchParams): Required<LeadFilterInput> {
  const toInt = (value: string | null, fallback: number) => {
    if (!value) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    companyId: (params.get("companyId") || "").trim(),
    search: (params.get("search") || "").trim(),
    priorite: (params.get("priorite") as LeadPriority) || undefined,
    statutLead: (params.get("statutLead") as LeadStatus) || undefined,
    region: (params.get("region") || "").trim(),
    ville: (params.get("ville") || "").trim(),
    secteur: (params.get("secteur") || "").trim(),
    minScore: Math.max(0, Math.min(100, toInt(params.get("minScore"), 0))),
    page: Math.max(1, toInt(params.get("page"), 1)),
    pageSize: Math.max(1, Math.min(100, toInt(params.get("pageSize"), 20))),
  };
}

export function buildLeadWhere(filters: LeadFilterInput): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};

  if (filters.minScore && filters.minScore > 0) {
    where.scoreGlobal = { gte: filters.minScore };
  }
  if (filters.priorite) {
    where.priorite = filters.priorite;
  }
  if (filters.statutLead) {
    where.statutLead = filters.statutLead;
  }

  const companyFilter: Prisma.CompanyWhereInput = {};
  if (filters.companyId) companyFilter.id = filters.companyId;
  if (filters.region) companyFilter.region = { contains: filters.region };
  if (filters.ville) companyFilter.ville = { contains: filters.ville };
  if (filters.secteur) companyFilter.secteurActivite = { contains: filters.secteur };

  const search = (filters.search || "").trim();
  const hasCompanyFilter = Object.keys(companyFilter).length > 0;

  if (search || hasCompanyFilter) {
    where.contact = {
      is: {
        ...(search
          ? {
              OR: [
                { nom: { contains: search } },
                { prenom: { contains: search } },
                { poste: { contains: search } },
                {
                  entreprise: {
                    OR: [
                      { nom: { contains: search } },
                      { ville: { contains: search } },
                      { secteurActivite: { contains: search } },
                    ],
                  },
                },
              ],
            }
          : {}),
        ...(hasCompanyFilter ? { entreprise: { is: companyFilter } } : {}),
      },
    };
  }

  return where;
}
