import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { buildLeadWhere, normalizeLeadFilters } from "@/lib/lead-filters";
import { toCsv } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const filters = normalizeLeadFilters(request.nextUrl.searchParams);
  const delimiterParam = request.nextUrl.searchParams.get("delimiter");
  const delimiter = delimiterParam === ";" ? ";" : ",";

  const where = buildLeadWhere(filters);
  const leads = await prisma.lead.findMany({
    where,
    include: {
      contact: {
        include: {
          entreprise: true,
        },
      },
    },
    orderBy: [{ scoreGlobal: "desc" }, { updatedAt: "desc" }],
  });

  const rows = leads.map((lead) => ({
    entreprise: lead.contact.entreprise.nom,
    pays: lead.contact.entreprise.pays,
    region: lead.contact.entreprise.region,
    ville: lead.contact.entreprise.ville,
    secteur_activite: lead.contact.entreprise.secteurActivite,
    contact_nom: lead.contact.nom,
    contact_prenom: lead.contact.prenom,
    poste: lead.contact.poste,
    email_pro: lead.contact.emailPro,
    linkedin_profil: lead.contact.linkedinProfil,
    score_entreprise: lead.scoreEntreprise,
    score_contact: lead.scoreContact,
    score_global: lead.scoreGlobal,
    priorite: lead.priorite,
    statut_lead: lead.statutLead,
    notes_lead: lead.notes,
  }));

  const csv = toCsv(rows, delimiter);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="balise-ia-leads-export.csv"',
    },
  });
}
