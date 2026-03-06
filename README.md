# Balise-IA Prospect Studio V2

CRM local de prospection B2B pour Balise-IA (Lorient, Bretagne), orienté solo founder + agents IA.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Prisma + SQLite
- DnD: `@dnd-kit/core`
- Email: `resend`
- UI feedback: `sonner`

## Installation

```bash
git clone https://github.com/simsam56/balise-ia-prospect
cd balise-ia-prospect
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Application locale: [http://127.0.0.1:3000](http://127.0.0.1:3000)

## Variables d environnement

```env
DATABASE_URL="file:./dev.db"
CRM_AUTOMATIONS_ENABLED="true"
RESEND_API_KEY=""
CRON_SECRET="change-me"
```

`RESEND_API_KEY` absent en dev => envoi email mock (`status: mocked`).

## Scripts utiles

```bash
npm run dev
npm run build
npm run lint
npm run db:migrate
npm run db:seed
npm run score
npm run import-csv -- ./data/leads.csv
```

## Routes UI

- `/` Dashboard cockpit (KPI + prochaines actions + quick add lead)
- `/leads` Table leads (filtres, score bar, séquences, menu actions)
- `/pipeline` Kanban drag-and-drop (dnd-kit)
- `/activities` Complétude base (contact/email/LinkedIn) + tâches
- `/emails` Générateur + envoi immédiat
- `/sequences` Séquence unique 14 jours (enrollment/pause/reprise/stop + simulate cron en dev)
- `/import` Import CSV (mapping + preview + docs format)
- `/api-docs` Documentation API lisible

## AI-native

- Manifest agents:
  - `GET /api/ai`
  - `GET /ai`
  - `GET /ai.txt`
- Feedback global action:
  - `<div id="action-feedback" aria-live="polite" aria-atomic="true">`
- Attributs sur actions critiques:
  - `data-action`
  - `data-lead-id`
  - `data-sequence-id`
  - `data-activity-id`

## API principales

- Leads:
  - `GET /api/leads`
  - `POST /api/leads`
  - `PATCH /api/leads/:id`
  - `DELETE /api/leads/:id`
- Activities:
  - `GET /api/activities`
  - `POST /api/activities`
  - `PATCH /api/activities/:id`
  - `DELETE /api/activities/:id`
- Sequences:
  - `GET /api/sequences`
  - `POST /api/sequences/enroll`
  - `PATCH /api/sequences/enrollment/:id`
  - `POST /api/sequences/simulate` (dev)
  - `GET /api/cron/sequences` (cron protégé par `CRON_SECRET`)
- Emails:
  - `POST /api/emails/send`
- Import/Export:
  - `POST /api/import/preview`
  - `POST /api/import/run`
  - `GET /api/export/leads`

## Données Prisma (V2)

- `Company`
  - inclut `descriptionActivite` + `motsCles` auto-générés
- `Contact`
- `Lead`
- `Activity`
- `SequenceEnrollment`
- `EmailLog`

## Cron

`vercel.json` contient:

```json
{
  "crons": [
    { "path": "/api/cron/sequences", "schedule": "0 * * * *" }
  ]
}
```
