import { PrismaClient } from "@prisma/client";

import { buildCompanyProfile } from "./company-profile";
import { parseCsvText, toCsv } from "./csv";
import { enrichCompany, enrichContact, RawCsvRow } from "./enrichment";
import { applyColumnMapping, ColumnMapping } from "./import-mapping";
import { computeLeadScore } from "./scoring";

export type ImportSummary = {
  processedRows: number;
  companiesCreated: number;
  companiesUpdated: number;
  contactsCreated: number;
  contactsUpdated: number;
  leadsUpdated: number;
  delimiter: "," | ";";
  enrichedCsv: string;
};

export async function importAndEnrichRows(
  prisma: PrismaClient,
  rows: RawCsvRow[],
  delimiter: "," | ";" = ",",
  columnMapping?: ColumnMapping,
): Promise<ImportSummary> {
  let companiesCreated = 0;
  let companiesUpdated = 0;
  let contactsCreated = 0;
  let contactsUpdated = 0;
  let leadsUpdated = 0;
  const enrichedRows: Array<Record<string, string | number>> = [];

  const normalizedRows = applyColumnMapping(rows, columnMapping);

  for (const rawRow of normalizedRows) {
    const companyData = await enrichCompany(rawRow);
    const profile = buildCompanyProfile({
      nom: companyData.nom,
      secteurActivite: companyData.secteurActivite,
      tailleEffectif: companyData.tailleEffectif,
      caEstime: companyData.caEstime,
      ville: companyData.ville,
      region: companyData.region,
    });

    const existingCompany = await prisma.company.findFirst({
      where: {
        nom: companyData.nom,
        ville: companyData.ville,
      },
    });

    const company = existingCompany
      ? await prisma.company.update({
          where: { id: existingCompany.id },
          data: {
            pays: companyData.pays,
            region: companyData.region,
            codePostal: companyData.codePostal,
            siren: companyData.siren,
            secteurActivite: companyData.secteurActivite,
            tailleEffectif: companyData.tailleEffectif,
            caEstime: companyData.caEstime,
            siteWeb: companyData.siteWeb,
            lienLinkedinEntreprise: companyData.lienLinkedinEntreprise,
            indicateurDataMaturity: companyData.indicateurDataMaturity,
            descriptionActivite: profile.descriptionActivite,
            motsCles: profile.motsCles,
            notes: companyData.notes,
          },
        })
      : await prisma.company.create({
          data: {
            ...companyData,
            descriptionActivite: profile.descriptionActivite,
            motsCles: profile.motsCles,
          },
        });

    if (existingCompany) {
      companiesUpdated += 1;
    } else {
      companiesCreated += 1;
    }

    const contactData = await enrichContact(rawRow, company.siteWeb);

    const existingContact = await prisma.contact.findFirst({
      where: {
        entrepriseId: company.id,
        nom: contactData.nom,
        prenom: contactData.prenom,
      },
      include: { lead: true, entreprise: true },
    });

    const contact = existingContact
      ? await prisma.contact.update({
          where: { id: existingContact.id },
          data: {
            poste: contactData.poste,
            niveauDecision: contactData.niveauDecision,
            emailPro: contactData.emailPro,
            linkedinProfil: contactData.linkedinProfil,
            telephone: contactData.telephone,
            languePrincipale: contactData.languePrincipale,
            notes: contactData.notes,
          },
          include: {
            entreprise: true,
            lead: true,
          },
        })
      : await prisma.contact.create({
          data: {
            entrepriseId: company.id,
            ...contactData,
          },
          include: {
            entreprise: true,
            lead: true,
          },
        });

    if (existingContact) {
      contactsUpdated += 1;
    } else {
      contactsCreated += 1;
    }

    const score = computeLeadScore(contact.entreprise, contact);

    const lead = contact.lead
      ? await prisma.lead.update({
        where: { id: contact.lead.id },
        data: {
          scoreEntreprise: score.scoreEntreprise,
          scoreContact: score.scoreContact,
          scoreGlobal: score.scoreGlobal,
          priorite: score.priorite,
          lastScoredAt: new Date(),
        },
      })
      : await prisma.lead.create({
        data: {
          contactId: contact.id,
          scoreEntreprise: score.scoreEntreprise,
          scoreContact: score.scoreContact,
          scoreGlobal: score.scoreGlobal,
          priorite: score.priorite,
          lastScoredAt: new Date(),
        },
      });
    if (!contact.emailPro.trim() || !contact.linkedinProfil.trim()) {
      const existingDataQualityTask = await prisma.activity.findFirst({
        where: {
          leadId: lead.id,
          autoRuleKey: "lead_data_completeness",
        },
      });

      if (!existingDataQualityTask) {
        await prisma.activity.create({
          data: {
            leadId: lead.id,
            titre: "Completer les coordonnees de contact",
            description:
              "Verifier et completer email professionnel / profil LinkedIn pour declencher les relances automatisees.",
            type: "tache",
            statut: "a_faire",
            dueDate: new Date(),
            autoRuleKey: "lead_data_completeness",
          },
        });
      }
    }

    leadsUpdated += 1;

    enrichedRows.push({
      nom_entreprise: company.nom,
      pays: company.pays,
      region: company.region,
      ville: company.ville,
      code_postal: company.codePostal,
      secteur_activite: company.secteurActivite,
      taille_effectif: company.tailleEffectif,
      ca_estime: company.caEstime,
      site_web: company.siteWeb,
      linkedin_entreprise: company.lienLinkedinEntreprise,
      description_activite: company.descriptionActivite,
      mots_cles: company.motsCles,
      data_maturity: company.indicateurDataMaturity,
      nom_contact: contact.nom,
      prenom_contact: contact.prenom,
      poste: contact.poste,
      niveau_decision: contact.niveauDecision,
      email_pro: contact.emailPro,
      linkedin_profil: contact.linkedinProfil,
      score_entreprise: score.scoreEntreprise,
      score_contact: score.scoreContact,
      score_global: score.scoreGlobal,
      priorite: score.priorite,
    });
  }

  return {
    processedRows: normalizedRows.length,
    companiesCreated,
    companiesUpdated,
    contactsCreated,
    contactsUpdated,
    leadsUpdated,
    delimiter,
    enrichedCsv: toCsv(enrichedRows, delimiter),
  };
}

export async function importAndEnrichCsv(
  prisma: PrismaClient,
  csvText: string,
  columnMapping?: ColumnMapping,
): Promise<ImportSummary> {
  const { rows, delimiter } = parseCsvText(csvText);
  return importAndEnrichRows(prisma, rows, delimiter, columnMapping);
}
