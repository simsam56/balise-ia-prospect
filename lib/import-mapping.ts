import { RawCsvRow } from "@/lib/enrichment";

export const IMPORT_CANONICAL_FIELDS = [
  "nom_entreprise",
  "pays",
  "region",
  "ville",
  "code_postal",
  "siren",
  "secteur_activite",
  "taille_effectif",
  "ca_estime",
  "site_web",
  "lien_linkedin_entreprise",
  "indicateur_data_maturity",
  "notes_entreprise",
  "nom_contact",
  "prenom",
  "poste",
  "niveau_decision",
  "email",
  "linkedin_profil",
  "telephone",
  "langue_principale",
  "notes_contact",
] as const;

export type CanonicalImportField = (typeof IMPORT_CANONICAL_FIELDS)[number];
export type ColumnMapping = Partial<Record<CanonicalImportField, string>>;

const FIELD_ALIASES: Record<CanonicalImportField, string[]> = {
  nom_entreprise: ["nom_entreprise", "entreprise", "company", "societe", "nom"],
  pays: ["pays", "country"],
  region: ["region", "région", "departement", "dept"],
  ville: ["ville", "city", "commune"],
  code_postal: ["code_postal", "cp", "postal_code", "zipcode"],
  siren: ["siren"],
  secteur_activite: ["secteur_activite", "secteur", "industry", "activite"],
  taille_effectif: ["taille_effectif", "effectif", "employees", "headcount"],
  ca_estime: ["ca_estime", "ca", "revenue", "turnover"],
  site_web: ["site_web", "website", "domaine", "domain"],
  lien_linkedin_entreprise: [
    "lien_linkedin_entreprise",
    "linkedin_entreprise",
    "linkedin_company",
  ],
  indicateur_data_maturity: [
    "indicateur_data_maturity",
    "data_maturity",
    "maturite_data",
  ],
  notes_entreprise: ["notes_entreprise", "company_notes"],
  nom_contact: ["nom_contact", "nom", "last_name", "contact_last_name"],
  prenom: ["prenom", "prénom", "first_name", "contact_first_name"],
  poste: ["poste", "title", "fonction", "job_title"],
  niveau_decision: ["niveau_decision", "decision_level"],
  email: ["email", "email_pro", "work_email"],
  linkedin_profil: ["linkedin_profil", "linkedin", "linkedin_profile"],
  telephone: ["telephone", "phone", "mobile"],
  langue_principale: ["langue_principale", "langue", "language"],
  notes_contact: ["notes_contact", "contact_notes", "notes"],
};

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const normalizedHeaders = headers.map((header) => ({
    raw: header,
    key: normalize(header),
  }));

  const mapping: ColumnMapping = {};

  for (const field of IMPORT_CANONICAL_FIELDS) {
    const aliases = FIELD_ALIASES[field].map(normalize);
    const exact = normalizedHeaders.find((header) => aliases.includes(header.key));
    if (exact) {
      mapping[field] = exact.raw;
      continue;
    }
    const partial = normalizedHeaders.find((header) =>
      aliases.some((alias) => header.key.includes(alias) || alias.includes(header.key)),
    );
    if (partial) {
      mapping[field] = partial.raw;
    }
  }

  return mapping;
}

export function applyColumnMapping(rows: RawCsvRow[], mapping?: ColumnMapping): RawCsvRow[] {
  if (!mapping || Object.keys(mapping).length === 0) {
    return rows;
  }

  return rows.map((row) => {
    const mappedRow: RawCsvRow = { ...row };
    for (const field of IMPORT_CANONICAL_FIELDS) {
      const source = mapping[field];
      if (!source) continue;
      const value = row[source];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        mappedRow[field] = String(value);
      }
    }
    return mappedRow;
  });
}
