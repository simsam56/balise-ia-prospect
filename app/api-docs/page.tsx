const docs = [
  {
    method: "GET",
    route: "/api/leads",
    description: "Lister les leads avec filtres.",
    curl: `curl -X GET "http://127.0.0.1:3000/api/leads?priorite=A&minScore=60"`,
    response: `{ "leads": [{ "id": "...", "entreprise": "Armor Process Industrie" }] }`,
  },
  {
    method: "POST",
    route: "/api/leads",
    description: "Ajouter un lead rapide.",
    curl: `curl -X POST http://127.0.0.1:3000/api/leads -H "Content-Type: application/json" -d '{"entreprise":"ACME","contact":"Jean Dupont","poste":"CEO","ville":"Lorient","secteur":"services","email":"jean@acme.fr"}'`,
    response: `{ "lead": { "id": "...", "scoreGlobal": 72, "priorite": "A" } }`,
  },
  {
    method: "PATCH",
    route: "/api/leads/:id",
    description: "Mettre a jour statut/notes/score.",
    curl: `curl -X PATCH http://127.0.0.1:3000/api/leads/<id> -H "Content-Type: application/json" -d '{"statut":"contacte"}'`,
    response: `{ "lead": { "id": "...", "statutLead": "contacte" } }`,
  },
  {
    method: "DELETE",
    route: "/api/leads/:id",
    description: "Supprimer un lead.",
    curl: `curl -X DELETE http://127.0.0.1:3000/api/leads/<id>`,
    response: `{ "success": true }`,
  },
  {
    method: "POST",
    route: "/api/emails/send",
    description: "Envoyer un email avec Resend.",
    curl: `curl -X POST http://127.0.0.1:3000/api/emails/send -H "Content-Type: application/json" -d '{"leadId":"<uuid>","ton":"consulting","longueur":"moyen"}'`,
    response: `{ "success": true, "messageId": "re_xxx" }`,
  },
  {
    method: "POST",
    route: "/api/sequences/enroll",
    description: "Enroller un lead dans une sequence.",
    curl: `curl -X POST http://127.0.0.1:3000/api/sequences/enroll -H "Content-Type: application/json" -d '{"leadId":"<uuid>","sequenceId":"sequence-classique-14j"}'`,
    response: `{ "enrollment": { "id":"...", "nextSendDate":"...", "currentStep":0 } }`,
  },
  {
    method: "PATCH",
    route: "/api/sequences/enrollment/:id",
    description: "Pause/reprise/arret enrollment.",
    curl: `curl -X PATCH http://127.0.0.1:3000/api/sequences/enrollment/<id> -H "Content-Type: application/json" -d '{"status":"paused"}'`,
    response: `{ "enrollment": { "id":"...", "status":"paused" } }`,
  },
  {
    method: "GET",
    route: "/api/activities",
    description: "Lister les activites.",
    curl: `curl -X GET "http://127.0.0.1:3000/api/activities?statut=a_faire"`,
    response: `{ "items": [{ "id":"...", "titre":"Relance J+3" }] }`,
  },
];

export default function ApiDocsPage() {
  return (
    <div className="space-y-4">
      <section>
        <p className="label">Developers</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#ededed]">API Docs</h1>
      </section>

      {docs.map((doc) => (
        <article key={`${doc.method}-${doc.route}`} className="card rounded-xl border border-zinc-800 bg-[#111111] p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="badge border border-zinc-700 bg-zinc-900 text-zinc-200">{doc.method}</span>
            <code className="text-sm text-zinc-300">{doc.route}</code>
          </div>
          <p className="text-sm text-zinc-400">{doc.description}</p>
          <div className="mt-3 space-y-2">
            <div>
              <p className="label">Curl</p>
              <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-[#0a0a0a] p-3 text-xs text-zinc-300">{doc.curl}</pre>
            </div>
            <div>
              <p className="label">Response</p>
              <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-[#0a0a0a] p-3 text-xs text-zinc-300">{doc.response}</pre>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
