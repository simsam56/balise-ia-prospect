import {
  DecisionLevel,
  EmployeeSize,
  LeadPriority,
  LeadStatus,
  RevenueRange,
} from "@/lib/domain";

export const employeeSizeLabels: Record<EmployeeSize, string> = {
  "1-9": "1-9",
  "10-49": "10-49",
  "50-249": "50-249",
  "250+": "250+",
};

export const revenueRangeLabels: Record<RevenueRange, string> = {
  "<500k": "<500k",
  "500k-2M": "500k-2M",
  "2M-10M": "2M-10M",
  ">10M": ">10M",
};

export const decisionLevelLabels: Record<DecisionLevel, string> = {
  decideur: "decideur",
  prescripteur: "prescripteur",
  utilisateur: "utilisateur",
};

export const leadStatusLabels: Record<LeadStatus, string> = {
  nouveau: "nouveau",
  a_contacter: "a_contacter",
  contacte: "contacte",
  en_discussion: "en_discussion",
  chaud: "chaud",
  perdu: "perdu",
};

export const priorityLabels: Record<LeadPriority, string> = {
  A: "A",
  B: "B",
  C: "C",
};
