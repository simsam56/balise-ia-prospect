import { PrismaClient } from "@prisma/client";

import { LeadStatus } from "@/lib/domain";

export const CRM_AUTOMATIONS_ENABLED = process.env.CRM_AUTOMATIONS_ENABLED !== "false";

type AutomationRule = {
  status: LeadStatus;
  title: string;
  description: string;
  type: "appel" | "email" | "reunion" | "relance" | "tache";
  dueInDays: number;
  key: string;
};

const RULES: AutomationRule[] = [
  {
    status: "a_contacter",
    title: "Appel initial",
    description: "Premier contact pour cadrer les enjeux data/IA et qualifier le besoin.",
    type: "appel",
    dueInDays: 0,
    key: "lead_status_a_contacter",
  },
  {
    status: "contacte",
    title: "Relance J+3",
    description: "Relancer avec une proposition de prochain pas concret sous 3 jours.",
    type: "relance",
    dueInDays: 3,
    key: "lead_status_contacte",
  },
  {
    status: "chaud",
    title: "Preparer proposition",
    description: "Structurer une proposition orientee ROI et plan de deploiement.",
    type: "tache",
    dueInDays: 1,
    key: "lead_status_chaud",
  },
];

function buildDueDate(dueInDays: number): Date {
  const due = new Date();
  due.setHours(9, 0, 0, 0);
  due.setDate(due.getDate() + dueInDays);
  return due;
}

export async function runLeadStatusAutomations(
  prisma: PrismaClient,
  input: {
    leadId: string;
    previousStatus: LeadStatus;
    nextStatus: LeadStatus;
  },
): Promise<void> {
  if (!CRM_AUTOMATIONS_ENABLED) return;
  if (input.previousStatus === input.nextStatus) return;

  const rule = RULES.find((candidate) => candidate.status === input.nextStatus);
  if (!rule) return;

  const existing = await prisma.activity.findFirst({
    where: {
      leadId: input.leadId,
      autoRuleKey: rule.key,
    },
    select: { id: true },
  });

  if (existing) return;

  await prisma.activity.create({
    data: {
      leadId: input.leadId,
      titre: rule.title,
      description: rule.description,
      type: rule.type,
      statut: "a_faire",
      dueDate: buildDueDate(rule.dueInDays),
      autoRuleKey: rule.key,
    },
  });
}
