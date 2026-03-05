export type SequenceStepType = "COLD" | "FOLLOW_UP" | "VALUE" | "OFFER" | "BREAKUP";

export type SequenceStepDefinition = {
  dayOffset: number;
  type: SequenceStepType;
  label: string;
};

export type SequenceDefinition = {
  id: string;
  nom: string;
  description: string;
  steps: SequenceStepDefinition[];
};

export const SEQUENCES: SequenceDefinition[] = [
  {
    id: "sequence-classique-14j",
    nom: "Sequence classique 14 jours",
    description: "Prospection B2B en 4 emails sur 14 jours.",
    steps: [
      { dayOffset: 0, type: "COLD", label: "Email 1 - prise de contact" },
      { dayOffset: 3, type: "FOLLOW_UP", label: "Email 2 - relance contexte" },
      { dayOffset: 7, type: "VALUE", label: "Email 3 - cas d usage" },
      { dayOffset: 14, type: "BREAKUP", label: "Email 4 - breakup" },
    ],
  },
  {
    id: "sequence-audit-flash",
    nom: "Sequence Audit Flash",
    description: "Approche orientee audit data/IA rapide.",
    steps: [
      { dayOffset: 0, type: "COLD", label: "Email 1 - pain point operations" },
      { dayOffset: 4, type: "VALUE", label: "Email 2 - benchmark sectoriel" },
      { dayOffset: 9, type: "OFFER", label: "Email 3 - proposition mini audit" },
      { dayOffset: 13, type: "BREAKUP", label: "Email 4 - dernier message" },
    ],
  },
];

export function getSequenceById(sequenceId: string): SequenceDefinition | undefined {
  return SEQUENCES.find((sequence) => sequence.id === sequenceId);
}

export function buildStepDate(startDate: Date, dayOffset: number): Date {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(9, 0, 0, 0);
  return date;
}
