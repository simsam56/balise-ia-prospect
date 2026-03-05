import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyEmailButton } from "./CopyEmailButton";
import { prisma } from "@/lib/db";

export default async function ContactDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      entreprise: true,
      lead: true,
    },
  });

  if (!contact) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <p className="label">Contact</p>
        <h2 className="mt-1 font-[var(--font-space)] text-2xl font-semibold text-slate-100">
          {contact.prenom} {contact.nom}
        </h2>
        <p className="mt-2 text-sm text-slate-300">{contact.poste}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="label">Entreprise</p>
            <Link className="text-sm font-medium text-cyan-300" href={`/companies/${contact.entrepriseId}`}>
              {contact.entreprise.nom}
            </Link>
          </div>
          <div>
            <p className="label">Score global</p>
            <p className="text-sm text-slate-200">{contact.lead?.scoreGlobal ?? "-"}</p>
          </div>
          <div>
            <p className="label">Priorite</p>
            <p className="text-sm text-slate-200">{contact.lead?.priorite ?? "-"}</p>
          </div>
          <div>
            <p className="label">Statut lead</p>
            <p className="text-sm text-slate-200">{contact.lead?.statutLead ?? "-"}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-sm text-slate-300">
          <p>
            <span className="font-semibold">Email:</span> {contact.emailPro || "n/a"}
          </p>
          <div className="flex flex-wrap gap-2">
            {contact.emailPro ? (
              <a className="btn-secondary" href={`mailto:${contact.emailPro}`}>
                Ecrire un email
              </a>
            ) : null}
            <CopyEmailButton email={contact.emailPro} />
          </div>
          <p>
            <span className="font-semibold">LinkedIn:</span>{" "}
            {contact.linkedinProfil ? (
              <a className="text-cyan-300 underline" href={contact.linkedinProfil} target="_blank" rel="noreferrer">
                Ouvrir profil
              </a>
            ) : (
              "n/a"
            )}
          </p>
          <p>
            <span className="font-semibold">Telephone:</span> {contact.telephone || "n/a"}
          </p>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="font-semibold text-slate-100">Notes</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{contact.notes || "Aucune note"}</p>
      </section>
    </div>
  );
}
