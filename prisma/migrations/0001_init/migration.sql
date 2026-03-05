CREATE TABLE IF NOT EXISTS "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "pays" TEXT NOT NULL DEFAULT 'France',
    "region" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "codePostal" TEXT NOT NULL,
    "siren" TEXT,
    "secteurActivite" TEXT NOT NULL,
    "tailleEffectif" TEXT NOT NULL,
    "caEstime" TEXT NOT NULL,
    "siteWeb" TEXT NOT NULL,
    "lienLinkedinEntreprise" TEXT NOT NULL,
    "indicateurDataMaturity" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entrepriseId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "poste" TEXT NOT NULL,
    "niveauDecision" TEXT NOT NULL,
    "emailPro" TEXT NOT NULL,
    "linkedinProfil" TEXT NOT NULL,
    "telephone" TEXT,
    "languePrincipale" TEXT NOT NULL DEFAULT 'fr',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("entrepriseId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "scoreEntreprise" INTEGER NOT NULL DEFAULT 0,
    "scoreContact" INTEGER NOT NULL DEFAULT 0,
    "scoreGlobal" INTEGER NOT NULL DEFAULT 0,
    "priorite" TEXT NOT NULL DEFAULT 'C',
    "statutLead" TEXT NOT NULL DEFAULT 'nouveau',
    "notes" TEXT NOT NULL DEFAULT '',
    "lastScoredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'a_faire',
    "dueDate" DATETIME NOT NULL,
    "autoRuleKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "SequenceEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME NOT NULL,
    "nextSendDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "EmailLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "messageId" TEXT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Company_region_ville_idx" ON "Company"("region", "ville");
CREATE INDEX IF NOT EXISTS "Company_secteurActivite_idx" ON "Company"("secteurActivite");
CREATE INDEX IF NOT EXISTS "Company_nom_idx" ON "Company"("nom");
CREATE INDEX IF NOT EXISTS "Contact_entrepriseId_idx" ON "Contact"("entrepriseId");
CREATE INDEX IF NOT EXISTS "Contact_nom_prenom_idx" ON "Contact"("nom", "prenom");
CREATE INDEX IF NOT EXISTS "Contact_emailPro_idx" ON "Contact"("emailPro");
CREATE UNIQUE INDEX IF NOT EXISTS "Lead_contactId_key" ON "Lead"("contactId");
CREATE INDEX IF NOT EXISTS "Lead_scoreGlobal_priorite_idx" ON "Lead"("scoreGlobal", "priorite");
CREATE INDEX IF NOT EXISTS "Lead_statutLead_idx" ON "Lead"("statutLead");
CREATE INDEX IF NOT EXISTS "Activity_leadId_dueDate_idx" ON "Activity"("leadId", "dueDate");
CREATE INDEX IF NOT EXISTS "Activity_statut_dueDate_idx" ON "Activity"("statut", "dueDate");
CREATE INDEX IF NOT EXISTS "Activity_autoRuleKey_idx" ON "Activity"("autoRuleKey");
CREATE INDEX IF NOT EXISTS "SequenceEnrollment_leadId_status_idx" ON "SequenceEnrollment"("leadId", "status");
CREATE INDEX IF NOT EXISTS "SequenceEnrollment_sequenceId_status_idx" ON "SequenceEnrollment"("sequenceId", "status");
CREATE INDEX IF NOT EXISTS "SequenceEnrollment_nextSendDate_status_idx" ON "SequenceEnrollment"("nextSendDate", "status");
CREATE INDEX IF NOT EXISTS "EmailLog_leadId_sentAt_idx" ON "EmailLog"("leadId", "sentAt");
CREATE INDEX IF NOT EXISTS "EmailLog_status_sentAt_idx" ON "EmailLog"("status", "sentAt");
