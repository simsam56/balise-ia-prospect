import { PrismaClient } from "@prisma/client";

import {
  DecisionLevel,
  EmployeeSize,
  LeadPriority,
  RevenueRange,
} from "@/lib/domain";

const sectorKeywordWeights: Array<{ pattern: RegExp; points: number }> = [
  { pattern: /(e[- ]?commerce|retail)/i, points: 12 },
  { pattern: /(saas|logiciel|software)/i, points: 11 },
  { pattern: /(services|b2b|conseil)/i, points: 10 },
  { pattern: /(industrie|manufacturing|production)/i, points: 9 },
];

const posteKeywordWeights: Array<{ pattern: RegExp; points: number }> = [
  { pattern: /(ceo|dg|directeur general|fondateur|founder)/i, points: 12 },
  { pattern: /(data|ia|ai|digital)/i, points: 9 },
  { pattern: /(operation|ops|transformation)/i, points: 8 },
  { pattern: /(innovation|strategie|performance)/i, points: 6 },
];

const employeeSizePoints: Record<EmployeeSize, number> = {
  "1-9": 6,
  "10-49": 15,
  "50-249": 18,
  "250+": 10,
};

const revenueRangePoints: Record<RevenueRange, number> = {
  "<500k": 4,
  "500k-2M": 14,
  "2M-10M": 16,
  ">10M": 10,
};

const decisionPoints: Record<DecisionLevel, number> = {
  decideur: 22,
  prescripteur: 14,
  utilisateur: 8,
};

export type CompanyLike = {
  tailleEffectif: string;
  caEstime: string;
  secteurActivite: string;
  indicateurDataMaturity: number;
};

export type ContactLike = {
  poste: string;
  niveauDecision: string;
  emailPro: string;
  linkedinProfil: string;
};

function asEmployeeSize(value: string): EmployeeSize {
  if (["1-9", "10-49", "50-249", "250+"].includes(value)) {
    return value as EmployeeSize;
  }
  return "10-49";
}

function asRevenueRange(value: string): RevenueRange {
  if (["<500k", "500k-2M", "2M-10M", ">10M"].includes(value)) {
    return value as RevenueRange;
  }
  return "500k-2M";
}

function asDecisionLevel(value: string): DecisionLevel {
  if (["decideur", "prescripteur", "utilisateur"].includes(value)) {
    return value as DecisionLevel;
  }
  return "prescripteur";
}

export function computeLeadScore(
  entreprise: CompanyLike,
  contact: ContactLike,
): {
  scoreEntreprise: number;
  scoreContact: number;
  scoreGlobal: number;
  priorite: LeadPriority;
} {
  const taille = asEmployeeSize(entreprise.tailleEffectif);
  const revenue = asRevenueRange(entreprise.caEstime);
  const decision = asDecisionLevel(contact.niveauDecision);

  let scoreEntreprise = employeeSizePoints[taille] + revenueRangePoints[revenue];

  for (const candidate of sectorKeywordWeights) {
    if (candidate.pattern.test(entreprise.secteurActivite || "")) {
      scoreEntreprise += candidate.points;
      break;
    }
  }

  const maturity = Math.max(0, Math.min(3, entreprise.indicateurDataMaturity || 0));
  scoreEntreprise += maturity * 7;
  scoreEntreprise = Math.max(0, Math.min(60, scoreEntreprise));

  let scoreContact = decisionPoints[decision];
  let posteBonus = 0;
  for (const candidate of posteKeywordWeights) {
    if (candidate.pattern.test(contact.poste || "")) {
      posteBonus += candidate.points;
    }
  }
  scoreContact += Math.min(14, posteBonus);

  if (contact.emailPro?.trim()) scoreContact += 2;
  if (contact.linkedinProfil?.trim()) scoreContact += 2;
  scoreContact = Math.max(0, Math.min(40, scoreContact));

  const scoreGlobal = Math.max(0, Math.min(100, scoreEntreprise + scoreContact));
  const priorite: LeadPriority = scoreGlobal >= 70 ? "A" : scoreGlobal >= 40 ? "B" : "C";

  return { scoreEntreprise, scoreContact, scoreGlobal, priorite };
}

export async function recomputeAllLeadScores(
  prisma: PrismaClient,
): Promise<{ updatedCount: number }> {
  const contacts = await prisma.contact.findMany({
    include: {
      entreprise: true,
      lead: true,
    },
  });

  let updatedCount = 0;

  for (const contact of contacts) {
    const score = computeLeadScore(contact.entreprise, contact);

    if (contact.lead) {
      await prisma.lead.update({
        where: { id: contact.lead.id },
        data: {
          scoreEntreprise: score.scoreEntreprise,
          scoreContact: score.scoreContact,
          scoreGlobal: score.scoreGlobal,
          priorite: score.priorite,
          lastScoredAt: new Date(),
        },
      });
    } else {
      await prisma.lead.create({
        data: {
          contactId: contact.id,
          scoreEntreprise: score.scoreEntreprise,
          scoreContact: score.scoreContact,
          scoreGlobal: score.scoreGlobal,
          priorite: score.priorite,
          lastScoredAt: new Date(),
        },
      });
    }

    updatedCount += 1;
  }

  return { updatedCount };
}
