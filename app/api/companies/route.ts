import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildCompanyProfile } from "@/lib/company-profile";
import { prisma } from "@/lib/db";
import { EMPLOYEE_SIZE_VALUES, REVENUE_RANGE_VALUES } from "@/lib/domain";

const createCompanySchema = z.object({
  nom: z.string().min(2),
  pays: z.string().default("France"),
  region: z.string().default("Bretagne"),
  ville: z.string().default("Lorient"),
  codePostal: z.string().default("56100"),
  siren: z.string().optional(),
  secteurActivite: z.string().default("services"),
  tailleEffectif: z.enum(EMPLOYEE_SIZE_VALUES).default("10-49"),
  caEstime: z.enum(REVENUE_RANGE_VALUES).default("500k-2M"),
  siteWeb: z.string().default(""),
  lienLinkedinEntreprise: z.string().default(""),
  indicateurDataMaturity: z.number().int().min(0).max(3).default(0),
  notes: z.string().default(""),
});

export async function GET() {
  const companies = await prisma.company.findMany({
    orderBy: { nom: "asc" },
  });
  return NextResponse.json({ items: companies });
}

export async function POST(request: NextRequest) {
  const payload = createCompanySchema.parse(await request.json());

  const profile = buildCompanyProfile({
    nom: payload.nom,
    secteurActivite: payload.secteurActivite,
    tailleEffectif: payload.tailleEffectif,
    caEstime: payload.caEstime,
    ville: payload.ville,
    region: payload.region,
  });

  const company = await prisma.company.create({
    data: {
      ...payload,
      descriptionActivite: profile.descriptionActivite,
      motsCles: profile.motsCles,
    },
  });
  return NextResponse.json({ company }, { status: 201 });
}
