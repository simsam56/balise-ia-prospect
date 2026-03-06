import { prisma } from "../lib/db";
import { buildCompanyProfile } from "../lib/company-profile";
import { computeLeadScore } from "../lib/scoring";

async function seed() {
  await prisma.emailLog.deleteMany();
  await prisma.sequenceEnrollment.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();

  const companies = await prisma.$transaction([
    prisma.company.create({
      data: {
        nom: "Armor Process Industrie",
        pays: "France",
        region: "Bretagne",
        ville: "Lorient",
        codePostal: "56100",
        secteurActivite: "industrie process",
        tailleEffectif: "50-249",
        caEstime: "2M-10M",
        siteWeb: "https://armor-process.fr",
        lienLinkedinEntreprise: "https://www.linkedin.com/company/armor-process-industrie",
        indicateurDataMaturity: 2,
        ...buildCompanyProfile({
          nom: "Armor Process Industrie",
          secteurActivite: "industrie process",
          tailleEffectif: "50-249",
          caEstime: "2M-10M",
          ville: "Lorient",
          region: "Bretagne",
        }),
        notes: "PME rentable avec enjeux de qualite et de flux ops.",
      },
    }),
    prisma.company.create({
      data: {
        nom: "Blue Breizh Commerce",
        pays: "France",
        region: "Bretagne",
        ville: "Vannes",
        codePostal: "56000",
        secteurActivite: "e-commerce retail",
        tailleEffectif: "10-49",
        caEstime: "500k-2M",
        siteWeb: "https://bluebreizh.fr",
        lienLinkedinEntreprise: "https://www.linkedin.com/company/blue-breizh-commerce",
        indicateurDataMaturity: 1,
        ...buildCompanyProfile({
          nom: "Blue Breizh Commerce",
          secteurActivite: "e-commerce retail",
          tailleEffectif: "10-49",
          caEstime: "500k-2M",
          ville: "Vannes",
          region: "Bretagne",
        }),
        notes: "Volumetrie commandes en croissance.",
      },
    }),
    prisma.company.create({
      data: {
        nom: "Ker Data Services",
        pays: "France",
        region: "Bretagne",
        ville: "Rennes",
        codePostal: "35000",
        secteurActivite: "services b2b data",
        tailleEffectif: "10-49",
        caEstime: "2M-10M",
        siteWeb: "https://kerdata.fr",
        lienLinkedinEntreprise: "https://www.linkedin.com/company/ker-data-services",
        indicateurDataMaturity: 3,
        ...buildCompanyProfile({
          nom: "Ker Data Services",
          secteurActivite: "services b2b data",
          tailleEffectif: "10-49",
          caEstime: "2M-10M",
          ville: "Rennes",
          region: "Bretagne",
        }),
        notes: "Tres receptive aux sujets dashboard + automatisation.",
      },
    }),
  ]);

  const contacts = await prisma.$transaction([
    prisma.contact.create({
      data: {
        entrepriseId: companies[0].id,
        nom: "Le Goff",
        prenom: "Mathieu",
        poste: "Directeur general",
        niveauDecision: "decideur",
        emailPro: "mathieu.legoff@armor-process.fr",
        linkedinProfil: "https://www.linkedin.com/in/mathieu-legoff",
        languePrincipale: "fr",
        notes: "Cherche gains de productivite sur reporting qualite.",
      },
    }),
    prisma.contact.create({
      data: {
        entrepriseId: companies[1].id,
        nom: "Riou",
        prenom: "Claire",
        poste: "Responsable operations",
        niveauDecision: "prescripteur",
        emailPro: "claire.riou@bluebreizh.fr",
        linkedinProfil: "https://www.linkedin.com/in/claire-riou",
        languePrincipale: "fr",
        notes: "Interessee par automatisation SAV + previsions.",
      },
    }),
    prisma.contact.create({
      data: {
        entrepriseId: companies[2].id,
        nom: "Martin",
        prenom: "Aurelien",
        poste: "Head of Data & Innovation",
        niveauDecision: "prescripteur",
        emailPro: "aurelien.martin@kerdata.fr",
        linkedinProfil: "https://www.linkedin.com/in/aurelien-martin",
        languePrincipale: "fr",
        notes: "Besoin de prioriser les cas d'usage IA.",
      },
    }),
  ]);

  let enrollmentCreated = false;

  for (const contact of contacts) {
    const contactWithCompany = await prisma.contact.findUniqueOrThrow({
      where: { id: contact.id },
      include: { entreprise: true },
    });

    const score = computeLeadScore(contactWithCompany.entreprise, contactWithCompany);

    const lead = await prisma.lead.create({
      data: {
        contactId: contact.id,
        scoreEntreprise: score.scoreEntreprise,
        scoreContact: score.scoreContact,
        scoreGlobal: score.scoreGlobal,
        priorite: score.priorite,
        statutLead: "a_contacter",
        notes: "Seed generated",
        lastScoredAt: new Date(),
      },
    });

    await prisma.activity.create({
      data: {
        leadId: lead.id,
        titre: "Appel de qualification",
        description: "Comprendre les priorites data/IA et valider un premier cas d usage.",
        type: "appel",
        statut: "a_faire",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    if (!enrollmentCreated) {
      const startDate = new Date();
      startDate.setHours(9, 0, 0, 0);
      const nextSendDate = new Date(startDate);
      nextSendDate.setDate(nextSendDate.getDate() + 3);

      await prisma.sequenceEnrollment.create({
        data: {
          leadId: lead.id,
          sequenceId: "sequence-classique-14j",
          currentStep: 1,
          startDate,
          nextSendDate,
          status: "active",
        },
      });

      await prisma.emailLog.create({
        data: {
          leadId: lead.id,
          subject: "Armor Process Industrie: idee concrete IA pour accelerer vos resultats",
          body: "Premier email seed envoye automatiquement.",
          provider: "seed",
          status: "sent",
          sentAt: startDate,
        },
      });

      enrollmentCreated = true;
    }
  }

  console.log("Seed done.");
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
