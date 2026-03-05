export const EMPLOYEE_SIZE_VALUES = ["1-9", "10-49", "50-249", "250+"] as const;
export const REVENUE_RANGE_VALUES = ["<500k", "500k-2M", "2M-10M", ">10M"] as const;
export const DECISION_LEVEL_VALUES = ["decideur", "prescripteur", "utilisateur"] as const;
export const LEAD_PRIORITY_VALUES = ["A", "B", "C"] as const;
export const LEAD_STATUS_VALUES = [
  "nouveau",
  "a_contacter",
  "contacte",
  "en_discussion",
  "chaud",
  "perdu",
] as const;
export const ACTIVITY_TYPE_VALUES = [
  "appel",
  "email",
  "reunion",
  "relance",
  "tache",
] as const;
export const ACTIVITY_STATUS_VALUES = ["a_faire", "termine"] as const;

export type EmployeeSize = (typeof EMPLOYEE_SIZE_VALUES)[number];
export type RevenueRange = (typeof REVENUE_RANGE_VALUES)[number];
export type DecisionLevel = (typeof DECISION_LEVEL_VALUES)[number];
export type LeadPriority = (typeof LEAD_PRIORITY_VALUES)[number];
export type LeadStatus = (typeof LEAD_STATUS_VALUES)[number];
export type ActivityType = (typeof ACTIVITY_TYPE_VALUES)[number];
export type ActivityStatus = (typeof ACTIVITY_STATUS_VALUES)[number];
