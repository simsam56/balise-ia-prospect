import { LeadPriority } from "@/lib/domain";

export type EmailTone = "professionnel" | "amical" | "technique" | "consulting";
export type EmailLength = "court" | "moyen" | "long";

export type LeadEmailContext = {
  prenom: string;
  nom: string;
  poste: string;
  entreprise: string;
  secteur: string;
  ville: string;
  priorite: LeadPriority;
};

export function buildProspectionSubject(
  priority: LeadPriority,
  companyName: string,
): string {
  if (priority === "A") return `${companyName}: idee concrete IA pour accelerer vos resultats`;
  if (priority === "B") return `${companyName}: piste data/IA pragmatique a explorer`;
  return `${companyName}: proposition rapide pour gagner en productivite`;
}

export function buildProspectionBody(input: {
  lead: LeadEmailContext;
  tone: EmailTone;
  length: EmailLength;
}): string {
  const { lead, tone, length } = input;

  const introByTone: Record<EmailTone, string> = {
    professionnel: `Bonjour ${lead.prenom},`,
    amical: `Bonjour ${lead.prenom}, j espere que vous allez bien.`,
    technique: `Bonjour ${lead.prenom},`,
    consulting: `Bonjour ${lead.prenom},`,
  };

  const contextByTone: Record<EmailTone, string> = {
    professionnel: `Je dirige Balise-IA a Lorient et j accompagne des PME comme ${lead.entreprise} sur l analyse de donnees, l automatisation et l IA appliquee au business.`,
    amical: `Je suis fondateur de Balise-IA a Lorient, et j aide les PME bretonnes a gagner du temps et de la fiabilite grace a la data et l IA.`,
    technique: `Chez Balise-IA, nous structurons des workflows data/IA pour industrialiser reporting, prediction et automatisation des processus metier.`,
    consulting: `J accompagne des dirigeants et responsables operations pour transformer des donnees existantes en gains mesurables (productivite, qualite, vitesse de decision).`,
  };

  const useCase = `Vu votre contexte (${lead.poste}, ${lead.secteur}, ${lead.ville}), je pense qu un mini-audit de vos flux CRM/facturation/dashboard pourrait identifier 2-3 quick wins tres concrets.`;

  const closeByLength: Record<EmailLength, string> = {
    court: "Ouverts a un echange de 20 min la semaine prochaine ?",
    moyen:
      "Si vous voulez, je peux vous partager une approche en 3 etapes (diagnostic, priorisation ROI, plan d implementation) en 20 minutes.",
    long:
      "Si c est pertinent pour vous, je vous propose un point de 20 minutes pour cadrer: 1) les processus a fort ROI, 2) les donnees deja disponibles, 3) un plan de deploiement progressif sans complexite technique inutile.",
  };

  const signature =
    "\n\nBien a vous,\nSimon Hingant\nBalise-IA\nLorient, Bretagne";

  const segments = [introByTone[tone], "", contextByTone[tone], "", useCase];

  if (length === "long") {
    segments.push(
      "",
      "Exemples frequents de livrables: dashboard pilotage CODIR, automatisation reporting ops/commercial, alertes data qualite, et premiers assistants IA internes.",
    );
  }

  segments.push("", closeByLength[length], signature);
  return segments.join("\n");
}
