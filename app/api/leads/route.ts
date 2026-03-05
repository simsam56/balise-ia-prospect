import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildLeadWhere, normalizeLeadFilters } from "@/lib/lead-filters";
import { prisma } from "@/lib/db";
import { LEAD_STATUS_VALUES } from "@/lib/domain";
import { computeLeadScore } from "@/lib/scoring";

const createLeadSchema = z.object({
  entreprise: z.string().min(2).max(160),
  contact: z.string().min(2).max(160),
  poste: z.string().min(2).max(120).default("Dirigeant"),
  ville: z.string().min(2).max(120),
  secteur: z.string().min(2).max(120),
  email: z.string().email(),
  notes: z.string().max(5000).optional(),
});

function splitFullName(fullName: string): { prenom: string; nom: string } {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { prenom: "Contact", nom: "Inconnu" };
  if (tokens.length === 1) return { prenom: tokens[0], nom: "Inconnu" };
  return { prenom: tokens[0], nom: tokens.slice(1).join(" ") };
}

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
      sequenceEnrollments: {
        where: {
          status: {
            in: ["active", "paused"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: [{ scoreGlobal: "desc" }, { updatedAt: "desc" }],
    skip: (filters.page - 1) * filters.pageSize,
    take: filters.pageSize,
  });

  const [priorityA, toContact, averageAggregate, statusBuckets] = await Promise.all([
    prisma.lead.count({
      where: {
        ...where,
        priorite: "A",
      },
    }),
    prisma.lead.count({
      where: {
        ...where,
        statutLead: {
          in: ["nouveau", "a_contacter"],
        },
      },
    }),
    prisma.lead.aggregate({
      where,
      _avg: {
        scoreGlobal: true,
      },
    }),
    Promise.all(
      LEAD_STATUS_VALUES.map(async (status) => ({
        status,
        count: await prisma.lead.count({
          where: {
            ...where,
            statutLead: status,
          },
        }),
      })),
    ),
  ]);

  const statusCounts = Object.fromEntries(statusBuckets.map((entry) => [entry.status, entry.count]));

  const leads = items.map((lead) => ({
    id: lead.id,
    entreprise: lead.contact.entreprise.nom,
    contact: `${lead.contact.prenom} ${lead.contact.nom}`.trim(),
    poste: lead.contact.poste,
    ville: lead.contact.entreprise.ville,
    secteur: lead.contact.entreprise.secteurActivite,
    scoreGlobal: lead.scoreGlobal,
    priorite: lead.priorite,
    statut: lead.statutLead,
    email: lead.contact.emailPro,
    notes: lead.notes,
  }));

  return NextResponse.json({
    items,
    leads,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    filters,
    stats: {
      totalLeads: total,
      priorityA,
      toContact,
      averageScore: Math.round(averageAggregate._avg.scoreGlobal ?? 0),
      statusCounts,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const payload = createLeadSchema.parse(await request.json());
    const { prenom, nom } = splitFullName(payload.contact);

    const existingCompany = await prisma.company.findFirst({
      where: {
        nom: payload.entreprise,
        ville: payload.ville,
      },
    });

    const company =
      existingCompany ||
      (await prisma.company.create({
        data: {
          nom: payload.entreprise,
          pays: "France",
          region: "Bretagne",
          ville: payload.ville,
          codePostal: "56100",
          secteurActivite: payload.secteur,
          tailleEffectif: "10-49",
          caEstime: "500k-2M",
          siteWeb: "",
          lienLinkedinEntreprise: "",
          indicateurDataMaturity: 1,
          notes: payload.notes || "",
        },
      }));

    const contact = await prisma.contact.create({
      data: {
        entrepriseId: company.id,
        prenom,
        nom,
        poste: payload.poste,
        niveauDecision: "prescripteur",
        emailPro: payload.email,
        linkedinProfil: "",
        languePrincipale: "fr",
        notes: payload.notes || "",
      },
      include: {
        entreprise: true,
      },
    });

    const score = computeLeadScore(contact.entreprise, contact);

    const lead = await prisma.lead.create({
      data: {
        contactId: contact.id,
        scoreEntreprise: score.scoreEntreprise,
        scoreContact: score.scoreContact,
        scoreGlobal: score.scoreGlobal,
        priorite: score.priorite,
        statutLead: "nouveau",
        notes: payload.notes || "",
        lastScoredAt: new Date(),
      },
      include: {
        contact: {
          include: {
            entreprise: true,
          },
        },
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erreur creation lead." }, { status: 500 });
  }
}
