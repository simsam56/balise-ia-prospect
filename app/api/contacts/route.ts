import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { computeLeadScore } from "@/lib/scoring";
import { DECISION_LEVEL_VALUES } from "@/lib/domain";

const createContactSchema = z.object({
  entrepriseId: z.string().uuid(),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  poste: z.string().default("Responsable operations"),
  niveauDecision: z.enum(DECISION_LEVEL_VALUES).default("prescripteur"),
  emailPro: z.string().default(""),
  linkedinProfil: z.string().default(""),
  telephone: z.string().optional(),
  languePrincipale: z.string().default("fr"),
  notes: z.string().default(""),
});

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId");

  const contacts = await prisma.contact.findMany({
    where: companyId ? { entrepriseId: companyId } : undefined,
    include: {
      entreprise: true,
      lead: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: contacts });
}

export async function POST(request: NextRequest) {
  const payload = createContactSchema.parse(await request.json());

  const contact = await prisma.contact.create({
    data: payload,
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
      lastScoredAt: new Date(),
    },
  });

  if (!contact.emailPro.trim() || !contact.linkedinProfil.trim()) {
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        titre: "Completer les coordonnees de contact",
        description:
          "Verifier et completer email professionnel / profil LinkedIn pour declencher les relances automatisees.",
        type: "tache",
        statut: "a_faire",
        dueDate: new Date(),
        autoRuleKey: "lead_data_completeness",
      },
    });
  }

  return NextResponse.json({ contact, lead }, { status: 201 });
}
