import { DecisionLevel, EmployeeSize, RevenueRange } from "@/lib/domain";

export type RawCsvRow = Record<string, string>;

export type EnrichedCompanyRow = {
  nom: string;
  pays: string;
  region: string;
  ville: string;
  codePostal: string;
  siren?: string;
  secteurActivite: string;
  tailleEffectif: EmployeeSize;
  caEstime: RevenueRange;
  siteWeb: string;
  lienLinkedinEntreprise: string;
  indicateurDataMaturity: number;
  notes: string;
};

export type EnrichedContactRow = {
  nom: string;
  prenom: string;
  poste: string;
  niveauDecision: DecisionLevel;
  emailPro: string;
  linkedinProfil: string;
  telephone?: string;
  languePrincipale: string;
  notes: string;
};

function pick(row: RawCsvRow, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = row[key];
    if (value && String(value).trim()) {
      return String(value).trim();
    }
  }
  return fallback;
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizeUrl(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export async function placeholderSearchWebsite(companyName: string): Promise<string | null> {
  void companyName;
  return null;
}

export async function placeholderSearchLinkedinCompany(companyName: string): Promise<string | null> {
  void companyName;
  return null;
}

export function inferEmployeeSize(raw: string): EmployeeSize {
  const normalized = raw.toLowerCase();
  if (normalized.includes("50") || normalized.includes("249")) return "50-249";
  if (normalized.includes("10") || normalized.includes("49")) return "10-49";
  if (normalized.includes("250")) return "250+";
  return "1-9";
}

export function inferRevenueRange(raw: string): RevenueRange {
  const normalized = raw.toLowerCase();
  if (normalized.includes("2m") || normalized.includes("10m")) return "2M-10M";
  if (normalized.includes("500") || normalized.includes("2m")) return "500k-2M";
  if (normalized.includes(">10") || normalized.includes("10m")) return ">10M";
  return "<500k";
}

export function inferDecisionLevel(poste: string): DecisionLevel {
  const p = poste.toLowerCase();
  if (/(ceo|dg|directeur general|fondateur|founder|president|gerant)/i.test(p)) {
    return "decideur";
  }
  if (/(directeur|head|responsable|manager|lead)/i.test(p)) {
    return "prescripteur";
  }
  return "utilisateur";
}

export function generateWebsiteFromName(companyName: string): string {
  const slug = toSlug(companyName).replace(/-+/g, "-");
  return slug ? `https://www.${slug}.fr` : "";
}

export function generateLinkedinCompany(companyName: string): string {
  const slug = toSlug(companyName);
  return slug ? `https://www.linkedin.com/company/${slug}` : "";
}

export function extractDomainFromWebsite(website: string): string {
  try {
    const withProtocol = normalizeUrl(website);
    if (!withProtocol) return "";
    return new URL(withProtocol).hostname.replace(/^www\./, "").trim();
  } catch {
    return "";
  }
}

export function guessProfessionalEmail(
  firstName: string,
  lastName: string,
  domain: string,
): string {
  if (!firstName || !lastName || !domain) return "";
  const f = toSlug(firstName).replace(/-/g, "");
  const l = toSlug(lastName).replace(/-/g, "");
  if (!f || !l) return "";
  return `${f}.${l}@${domain}`;
}

export async function enrichCompany(rawRow: RawCsvRow): Promise<EnrichedCompanyRow> {
  const nom = pick(rawRow, ["nom_entreprise", "entreprise", "company", "nom"], "Entreprise inconnue");
  const pays = pick(rawRow, ["pays", "country"], "France");
  const region = pick(rawRow, ["region", "région"], "Bretagne");
  const ville = pick(rawRow, ["ville", "city"], "Lorient");
  const codePostal = pick(rawRow, ["code_postal", "cp", "postal_code"], "56100");
  const secteurActivite = pick(rawRow, ["secteur_activite", "secteur", "industry"], "services");

  const siteRaw = pick(rawRow, ["site_web", "website", "domaine"], "");
  const foundWebsite = siteRaw || (await placeholderSearchWebsite(nom)) || generateWebsiteFromName(nom);
  const siteWeb = normalizeUrl(foundWebsite);

  const linkedinRaw = pick(rawRow, ["lien_linkedin_entreprise", "linkedin_entreprise"], "");
  const linkedin =
    linkedinRaw || (await placeholderSearchLinkedinCompany(nom)) || generateLinkedinCompany(nom);

  const maturityRaw = Number(pick(rawRow, ["indicateur_data_maturity", "data_maturity"], "0"));

  return {
    nom,
    pays,
    region,
    ville,
    codePostal,
    siren: pick(rawRow, ["siren"], "") || undefined,
    secteurActivite,
    tailleEffectif: inferEmployeeSize(pick(rawRow, ["taille_effectif", "effectif"], "10-49")),
    caEstime: inferRevenueRange(pick(rawRow, ["ca_estime", "ca", "revenue"], "500k-2M")),
    siteWeb,
    lienLinkedinEntreprise: linkedin,
    indicateurDataMaturity: Number.isFinite(maturityRaw)
      ? Math.max(0, Math.min(3, maturityRaw))
      : 0,
    notes: pick(rawRow, ["notes_entreprise", "notes"], ""),
  };
}

export async function enrichContact(
  rawRow: RawCsvRow,
  companyWebsite: string,
): Promise<EnrichedContactRow> {
  const prenom = pick(rawRow, ["prenom", "first_name"], "");
  const nom = pick(rawRow, ["nom_contact", "nom", "last_name"], "");
  const poste = pick(rawRow, ["poste", "title", "fonction"], "Responsable operations");
  const niveauDecision = inferDecisionLevel(poste);
  const linkedinProfil = pick(rawRow, ["linkedin_profil", "linkedin"], "");
  const emailRaw = pick(rawRow, ["email", "email_pro"], "");

  const domain = extractDomainFromWebsite(companyWebsite);
  const emailPro = emailRaw || guessProfessionalEmail(prenom, nom, domain);

  return {
    nom: nom || "Inconnu",
    prenom: prenom || "Contact",
    poste,
    niveauDecision,
    emailPro,
    linkedinProfil,
    telephone: pick(rawRow, ["telephone", "phone"], "") || undefined,
    languePrincipale: pick(rawRow, ["langue_principale", "langue"], "fr"),
    notes: pick(rawRow, ["notes_contact", "notes"], ""),
  };
}
