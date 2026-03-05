# Balise-IA Prospect

Outil local de prospection B2B pour Balise-IA (Lorient, Bretagne):

- gestion entreprises + contacts
- scoring transparent et recalculable
- import CSV + enrichissement + insertion base
- export CSV filtre pour outreach
- interface web moderne (Next.js + Tailwind)

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Prisma ORM + SQLite (migrable vers Postgres)
- Scripts CLI en `tsx`

## Prerequis

- Node.js 20+
- npm 10+
- macOS Apple Silicon compatible (M-series)

## Installation

```bash
git clone <repo-url> balise-ia-prospect
cd balise-ia-prospect
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Application: [http://localhost:3000](http://localhost:3000)

## Lancement local (2-3 commandes)

```bash
npm install
npm run db:migrate
npm run dev
```

## Scripts utiles

```bash
npm run dev              # app web
npm run db:migrate       # applique migration SQL locale (equivalent migration dev)
npm run db:seed          # seed demo
npm run score            # recalcul de tous les scores
npm run import-csv -- ./data/leads.csv   # import + enrichissement + scoring
npm run import-csv -- ./data/leads.csv --mapping ./data/mapping.json
```

Note migration:
- Ce projet utilise `npm run db:migrate` comme equivalent local de migration.
- Le script applique `prisma/migrations/0001_init/migration.sql` de facon idempotente sur SQLite.
- Le script regenere aussi Prisma Client automatiquement.

## Modele de donnees

Le schema Prisma est dans [prisma/schema.prisma](./prisma/schema.prisma):

- `Company` (entreprises)
- `Contact` (personnes)
- `Lead` (scoring + priorite + statut)

Enums couverts:

- `taille_effectif`: `1-9`, `10-49`, `50-249`, `250+`
- `ca_estime`: `<500k`, `500k-2M`, `2M-10M`, `>10M`
- `niveau_decision`: `decideur`, `prescripteur`, `utilisateur`
- `priorite`: `A`, `B`, `C`
- `statut_lead`: `nouveau`, `a_contacter`, `contacte`, `en_discussion`, `chaud`, `perdu`

## Scoring

Logique dans [lib/scoring.ts](./lib/scoring.ts):

- `scoreEntreprise` (0-60)
  - taille effectif
  - CA estime
  - secteur activite (keywords)
  - data maturity (0-3)
- `scoreContact` (0-40)
  - niveau decision
  - mots-cles poste
  - presence email + LinkedIn
- `scoreGlobal` = somme capee a 100
- priorite:
  - `A` >= 70
  - `B` entre 40 et 69
  - `C` < 40

Recalcul API:

- `POST /api/scoring/recompute`

Recalcul CLI:

```bash
npm run score
```

## Import / enrichissement CSV

### UI

1. Aller sur `/import`
1. Upload CSV
1. Cliquer `Previsualiser CSV`
1. Ajuster le mapping des colonnes si besoin
1. Cliquer `Recalculer preview mappee`
1. Cliquer `Importer + Enrichir + Scorer`
1. Telecharger le CSV enrichi

### CLI

```bash
npm run import-csv -- ./path/to/file.csv
```

Produit un fichier `*.enriched.csv` a cote du fichier source.

### Colonnes minimales recommandees

- `nom_entreprise`
- `ville`
- `nom_contact`
- `prenom`
- `poste`
- `email` (optionnel)

Delimiter supporte: `,` ou `;` (auto-detect)

### Points d'extension enrichissement

Fonctions placeholders dans [lib/enrichment.ts](./lib/enrichment.ts):

- `placeholderSearchWebsite`
- `placeholderSearchLinkedinCompany`

Tu peux y brancher plus tard des APIs tierces (email finder, LinkedIn, firmographic).

## Export CSV

Export leads filtres:

- depuis le bouton UI sur `/leads`
- ou endpoint direct:

```bash
GET /api/export/leads?minScore=60&priorite=A&region=Bretagne
```

Option delimiter:

- `?delimiter=;` pour export point-virgule

Export pour une entreprise donnee:

```bash
GET /api/export/leads?companyId=<uuid>
```

## Audit docs

- UI audit: `docs/UI_AUDIT_2026-03-05.md`
- CRM fit audit: `docs/CRM_AUDIT_2026-03-05.md`
- Bench CRM open-source 2026: `docs/OPEN_SOURCE_CRM_BENCH_2026.md`

## Pages principales

- `/leads`
  - tableau principal
  - filtres (score, priorite, statut, region, ville, secteur, recherche)
  - edition rapide du statut
  - notes par lead
  - pagination
- `/companies/[id]`
  - detail entreprise
  - contacts lies + score
- `/contacts/[id]`
  - detail contact
  - score/priorite/statut
- `/import`
  - upload CSV
  - preview 10 lignes
  - import + enrichissement + scoring

## API principale

- `GET /api/leads`
- `PATCH /api/leads/:id`
- `POST /api/scoring/recompute`
- `POST /api/import/preview`
- `POST /api/import/run`
- `GET /api/export/leads`
- `GET /api/companies`
- `POST /api/companies`
- `GET /api/contacts`
- `POST /api/contacts`

## Integrations futures

- dossier: [integrations/](./integrations)
- endpoint placeholder outreach: `POST /api/integrations/outreach`

Tu pourras y brancher:

- push automatique vers outil de cold email
- generation brouillons d'emails
- orchestration agents externes

## Arborescence

```txt
balise-ia-prospect/
  app/
    api/
    leads/
    import/
    companies/[id]/
    contacts/[id]/
  lib/
    db.ts
    scoring.ts
    enrichment.ts
    importer.ts
    csv.ts
    lead-filters.ts
  prisma/
    schema.prisma
    seed.ts
  scripts/
    recomputeScores.ts
    importCsv.ts
  integrations/
    README.md
```

## Apercus (description)

- Ecran Leads: table orientee prospection, filtres et edition rapide du cycle de lead.
- Ecran Import: preview CSV + bouton unique "Importer + Enrichir + Scorer".
- Ecran Entreprise: fiche entreprise + personnes liees + scores.
- Ecran Contact: fiche decisionnaire + acces direct email/LinkedIn.
