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

export const DEFAULT_SEQUENCE_ID = "sequence-classique-14j";

export const SEQUENCES: SequenceDefinition[] = [
  {
    id: DEFAULT_SEQUENCE_ID,
    nom: "Sequence Balise-IA 14 jours",
    description:
      "Sequence unique: J0, J+3, J+7 et J+14 pour garder une cadence simple et soutenable.",
    steps: [
      { dayOffset: 0, type: "COLD", label: "Email 1 - prise de contact" },
      { dayOffset: 3, type: "FOLLOW_UP", label: "Email 2 - relance courte" },
      { dayOffset: 7, type: "VALUE", label: "Email 3 - cas d usage / valeur" },
      { dayOffset: 14, type: "BREAKUP", label: "Email 4 - dernier message" },
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
