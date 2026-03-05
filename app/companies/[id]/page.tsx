import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";

export default async function CompanyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: {
        include: {
          lead: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <p className="label">Entreprise</p>
        <h2 className="mt-1 font-[var(--font-space)] text-2xl font-semibold text-slate-100">{company.nom}</h2>
        <p className="mt-2 text-sm text-slate-300">
          {company.ville}, {company.region} ({company.pays})
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="label">Secteur</p>
            <p className="text-sm text-slate-200">{company.secteurActivite}</p>
          </div>
          <div>
            <p className="label">Taille</p>
            <p className="text-sm text-slate-200">{company.tailleEffectif}</p>
          </div>
          <div>
            <p className="label">CA estime</p>
            <p className="text-sm text-slate-200">{company.caEstime}</p>
          </div>
          <div>
            <p className="label">Data maturity</p>
            <p className="text-sm text-slate-200">{company.indicateurDataMaturity}/3</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {company.siteWeb && (
            <a className="btn-secondary" href={company.siteWeb} target="_blank" rel="noreferrer">
              Site web
            </a>
          )}
          {company.lienLinkedinEntreprise && (
            <a className="btn-secondary" href={company.lienLinkedinEntreprise} target="_blank" rel="noreferrer">
              LinkedIn entreprise
            </a>
          )}
          <a className="btn-secondary" href={`/api/export/leads?companyId=${company.id}`}>
            Export CSV entreprise
          </a>
          <Link className="btn-secondary" href="/leads">
            Retour leads
          </Link>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-800 px-5 py-3">
          <h3 className="font-semibold text-slate-100">Contacts lies</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Poste</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Priorite</th>
                <th className="px-3 py-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {company.contacts.map((contact) => (
                <tr key={contact.id} className="border-t border-slate-800">
                  <td className="px-3 py-2">
                    <Link className="font-medium text-slate-200 hover:text-cyan-300" href={`/contacts/${contact.id}`}>
                      {contact.prenom} {contact.nom}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-300">{contact.poste}</td>
                  <td className="px-3 py-2 text-slate-300">{contact.lead?.scoreGlobal ?? "-"}</td>
                  <td className="px-3 py-2 text-slate-300">{contact.lead?.priorite ?? "-"}</td>
                  <td className="px-3 py-2 text-slate-300">{contact.lead?.statutLead ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
