export type CompanyProfileInput = {
  nom: string;
  secteurActivite: string;
  tailleEffectif: string;
  caEstime: string;
  ville: string;
  region: string;
};

const SECTOR_KEYWORDS: Array<{ matcher: RegExp; keywords: string[]; message: string }> = [
  {
    matcher: /e[- ]?commerce|retail|boutique/i,
    keywords: ["conversion", "panier moyen", "abandon panier", "segmentation client"],
    message:
      "Entreprise orientee commerce: opportunites fortes sur conversion, relance client et pilotage marketing.",
  },
  {
    matcher: /saas|logiciel|software/i,
    keywords: ["churn", "activation", "MRR", "usage produit"],
    message:
      "Activite SaaS/logicielle: focus sur retention, parcours d activation et pilotage revenu recurrent.",
  },
  {
    matcher: /industrie|process|production|usine/i,
    keywords: ["qualite", "TRS", "maintenance", "planification"],
    message:
      "Contexte industriel: gains rapides possibles sur qualite, suivi process et anticipation des incidents.",
  },
  {
    matcher: /service|conseil|b2b/i,
    keywords: ["productivite", "marge", "reporting", "satisfaction client"],
    message:
      "Societe de services B2B: priorite sur productivite equipe, standardisation et visibilite business.",
  },
];

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function buildSizeKeyword(tailleEffectif: string): string {
  if (tailleEffectif === "1-9") return "structure-legere";
  if (tailleEffectif === "10-49") return "PME-en-croissance";
  if (tailleEffectif === "50-249") return "PME-structuree";
  return "organisation-scale";
}

function buildRevenueKeyword(caEstime: string): string {
  if (caEstime === "<500k") return "budget-contraint";
  if (caEstime === "500k-2M") return "ROI-rapide";
  if (caEstime === "2M-10M") return "capacite-investissement";
  return "transformation-a-echelle";
}

export function buildCompanyProfile(input: CompanyProfileInput): {
  descriptionActivite: string;
  motsCles: string;
} {
  const sector = SECTOR_KEYWORDS.find((entry) => entry.matcher.test(input.secteurActivite));
  const baseKeywords = [
    input.secteurActivite.toLowerCase(),
    input.ville.toLowerCase(),
    input.region.toLowerCase(),
    buildSizeKeyword(input.tailleEffectif),
    buildRevenueKeyword(input.caEstime),
    ...(sector?.keywords ?? ["automatisation", "dashboard", "pilotage data"]),
  ];

  const description = [
    `${input.nom} est une entreprise ${input.secteurActivite} basee a ${input.ville} (${input.region}).`,
    `Cible type ${input.tailleEffectif} avec CA ${input.caEstime}.`,
    sector?.message ??
      "Pistes prioritaires: automatisation des workflows, dashboards de pilotage et fiabilisation des donnees.",
  ].join(" ");

  return {
    descriptionActivite: description,
    motsCles: unique(baseKeywords).join(", "),
  };
}
