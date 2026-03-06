"use client";

import Link from "next/link";
import { CalendarClock, CheckCircle2, CircleAlert, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { ACTIVITY_TYPE_VALUES, ActivityType } from "@/lib/domain";
import { notifyError, notifySuccess } from "@/lib/feedback";

type ActivityRow = {
  id: string;
  leadId: string;
  titre: string;
  description: string;
  type: ActivityType;
  statut: "a_faire" | "termine";
  dueDate: string;
  lead: {
    id: string;
    contact: {
      prenom: string;
      nom: string;
      entreprise: {
        id: string;
        nom: string;
      };
    };
  };
};

type CompanyRow = {
  id: string;
  nom: string;
  ville: string;
  secteurActivite: string;
  tailleEffectif: string;
  caEstime: string;
  indicateurDataMaturity: number;
};

type ContactRow = {
  id: string;
  prenom: string;
  nom: string;
  poste: string;
  emailPro: string;
  linkedinProfil: string;
  entreprise: {
    id: string;
    nom: string;
    ville: string;
    secteurActivite: string;
  };
  lead: {
    id: string;
    scoreGlobal: number;
    priorite: "A" | "B" | "C";
  } | null;
};

type LeadOption = {
  id: string;
  contact: {
    prenom: string;
    nom: string;
    entreprise: {
      nom: string;
    };
  };
};

type CompletenessRow = {
  key: string;
  companyId: string;
  companyName: string;
  ville: string;
  secteur: string;
  score: number;
  contactId: string | null;
  contactName: string;
  hasContact: boolean;
  hasEmail: boolean;
  hasLinkedin: boolean;
  missingFields: Array<"contact" | "email" | "linkedin">;
};

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isOverdue(dateString: string): boolean {
  const now = new Date();
  const date = new Date(dateString);
  return date.getTime() < now.getTime() && !isToday(dateString);
}

function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function recommendedAction(row: CompletenessRow): string {
  if (!row.hasContact) return "Ajouter un contact decisionnaire";
  if (!row.hasEmail && !row.hasLinkedin) return "Trouver email ou LinkedIn";
  if (!row.hasEmail) return "Completer email pro";
  if (!row.hasLinkedin) return "Completer LinkedIn";
  return "Complet";
}

function computeCompanyPotential(company: CompanyRow): number {
  const sizePoints: Record<string, number> = {
    "1-9": 6,
    "10-49": 15,
    "50-249": 18,
    "250+": 10,
  };
  const revenuePoints: Record<string, number> = {
    "<500k": 4,
    "500k-2M": 14,
    "2M-10M": 16,
    ">10M": 10,
  };

  let score = (sizePoints[company.tailleEffectif] ?? 12) + (revenuePoints[company.caEstime] ?? 12);

  if (/(e[- ]?commerce|retail)/i.test(company.secteurActivite)) score += 12;
  else if (/(saas|logiciel|software)/i.test(company.secteurActivite)) score += 11;
  else if (/(services|b2b|conseil)/i.test(company.secteurActivite)) score += 10;
  else if (/(industrie|manufacturing|production)/i.test(company.secteurActivite)) score += 9;

  const maturity = Math.max(0, Math.min(3, company.indicateurDataMaturity || 0));
  score += maturity * 7;
  return Math.max(0, Math.min(60, score));
}

export function ActivitiesClient() {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    leadId: "",
    type: "appel" as ActivityType,
    titre: "",
    description: "",
    dueDate: toInputDate(new Date()),
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [activitiesResponse, companiesResponse, contactsResponse, leadsResponse] = await Promise.all([
        fetch("/api/activities"),
        fetch("/api/companies"),
        fetch("/api/contacts"),
        fetch("/api/leads?page=1&pageSize=400"),
      ]);

      const activitiesPayload = await activitiesResponse.json();
      const companiesPayload = await companiesResponse.json();
      const contactsPayload = await contactsResponse.json();
      const leadsPayload = await leadsResponse.json();

      setActivities(activitiesPayload.items || []);
      setCompanies(companiesPayload.items || []);
      setContacts(contactsPayload.items || []);
      setLeads(leadsPayload.items || []);
      setForm((prev) => ({
        ...prev,
        leadId: prev.leadId || leadsPayload.items?.[0]?.id || "",
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData().catch(console.error);
  }, [fetchData]);

  const indicators = useMemo(() => {
    const overdue = activities.filter((a) => a.statut === "a_faire" && isOverdue(a.dueDate)).length;
    const today = activities.filter((a) => a.statut === "a_faire" && isToday(a.dueDate)).length;
    const done = activities.filter((a) => a.statut === "termine").length;

    const entreprisesSansContact = companies.filter(
      (company) => !contacts.some((contact) => contact.entreprise.id === company.id),
    ).length;

    const contactsSansEmail = contacts.filter((contact) => !contact.emailPro.trim()).length;
    const contactsSansLinkedin = contacts.filter((contact) => !contact.linkedinProfil.trim()).length;

    return {
      overdue,
      today,
      done,
      entreprisesSansContact,
      contactsSansEmail,
      contactsSansLinkedin,
    };
  }, [activities, companies, contacts]);

  const completenessRows = useMemo(() => {
    const rows: CompletenessRow[] = [];

    for (const company of companies) {
      const companyContacts = contacts.filter((contact) => contact.entreprise.id === company.id);
      if (companyContacts.length === 0) {
        rows.push({
          key: `company-${company.id}`,
          companyId: company.id,
          companyName: company.nom,
          ville: company.ville,
          secteur: company.secteurActivite,
          score: computeCompanyPotential(company),
          contactId: null,
          contactName: "Aucun contact",
          hasContact: false,
          hasEmail: false,
          hasLinkedin: false,
          missingFields: ["contact", "email", "linkedin"],
        });
        continue;
      }

      for (const contact of companyContacts) {
        const hasEmail = Boolean(contact.emailPro.trim());
        const hasLinkedin = Boolean(contact.linkedinProfil.trim());
        const missingFields: CompletenessRow["missingFields"] = [];
        if (!hasEmail) missingFields.push("email");
        if (!hasLinkedin) missingFields.push("linkedin");

        rows.push({
          key: `contact-${contact.id}`,
          companyId: company.id,
          companyName: company.nom,
          ville: company.ville,
          secteur: company.secteurActivite,
          score: contact.lead?.scoreGlobal ?? computeCompanyPotential(company),
          contactId: contact.id,
          contactName: `${contact.prenom} ${contact.nom}`.trim(),
          hasContact: true,
          hasEmail,
          hasLinkedin,
          missingFields,
        });
      }
    }

    return rows
      .filter((row) => (showOnlyIncomplete ? row.missingFields.length > 0 : true))
      .sort((a, b) => {
        if (b.missingFields.length !== a.missingFields.length) {
          return b.missingFields.length - a.missingFields.length;
        }
        if (b.score !== a.score) return b.score - a.score;
        return a.companyName.localeCompare(b.companyName, "fr");
      });
  }, [companies, contacts, showOnlyIncomplete]);

  async function createActivity() {
    try {
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: form.leadId,
          type: form.type,
          titre: form.titre,
          description: form.description,
          dueDate: new Date(`${form.dueDate}T09:00:00`).toISOString(),
        }),
      });
      notifySuccess("Activite creee.");
      setShowModal(false);
      await fetchData();
    } catch (error) {
      console.error(error);
      notifyError("Erreur creation activite.");
    }
  }

  async function markDone(activity: ActivityRow) {
    try {
      await fetch(`/api/activities/${activity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "termine" }),
      });
      notifySuccess(`Activite \"${activity.titre}\" terminee.`);
      await fetchData();
    } catch (error) {
      console.error(error);
      notifyError("Erreur mise a jour activite.");
    }
  }

  async function deleteActivity(activity: ActivityRow) {
    try {
      await fetch(`/api/activities/${activity.id}`, { method: "DELETE" });
      notifySuccess(`Activite \"${activity.titre}\" supprimee.`);
      await fetchData();
    } catch (error) {
      console.error(error);
      notifyError("Erreur suppression activite.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex items-center justify-between">
        <div>
          <p className="label">Completeness</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#ededed]">Suivi des informations a completer</h1>
        </div>
        <Button
          variant="primary"
          data-action="create-activity"
          aria-label="Ouvrir le formulaire de creation d activite"
          onClick={() => setShowModal(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Nouvelle activite
        </Button>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="card border border-red-500/20 bg-red-500/5 p-4">
          <p className="label">Entreprises sans contact</p>
          <p className="mt-2 text-3xl font-bold text-white">{indicators.entreprisesSansContact}</p>
        </article>
        <article className="card border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="label">Contacts sans email</p>
          <p className="mt-2 text-3xl font-bold text-white">{indicators.contactsSansEmail}</p>
        </article>
        <article className="card border border-zinc-700/70 bg-zinc-900/60 p-4">
          <p className="label">Contacts sans LinkedIn</p>
          <p className="mt-2 text-3xl font-bold text-white">{indicators.contactsSansLinkedin}</p>
        </article>
        <article className="card border border-red-500/20 bg-red-500/5 p-4">
          <p className="label">Activites en retard</p>
          <p className="mt-2 text-3xl font-bold text-white">{indicators.overdue}</p>
        </article>
      </section>

      <section className="card border border-[#2a2a2a] bg-[#111111] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="label">Tableau de completude</p>
            <p className="text-sm text-zinc-500">Repere rapidement les lignes a enrichir dans la base.</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowOnlyIncomplete((prev) => !prev)}
            aria-label="Activer ou desactiver le filtre des lignes incompletes"
          >
            {showOnlyIncomplete ? "Voir tout" : "Voir uniquement incomplet"}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-[#1a1a1a] text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2">Entreprise</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">LinkedIn</th>
                <th className="px-3 py-2">Manques</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-zinc-500">
                    Chargement...
                  </td>
                </tr>
              ) : completenessRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-zinc-500">
                    Base complete sur les criteres affiches.
                  </td>
                </tr>
              ) : (
                completenessRows.map((row) => (
                  <tr key={row.key} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                    <td className="px-3 py-2 text-zinc-100">
                      <Link href={`/companies/${row.companyId}`} className="hover:underline">
                        {row.companyName}
                      </Link>
                      <p className="text-xs text-zinc-500">
                        {row.ville} · {row.secteur}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-zinc-200">
                      {row.score}
                      {!row.hasContact ? <span className="ml-1 text-xs text-zinc-500">(potentiel)</span> : null}
                    </td>
                    <td className="px-3 py-2 text-zinc-300">
                      {row.contactId ? (
                        <Link href={`/contacts/${row.contactId}`} className="hover:underline">
                          {row.contactName}
                        </Link>
                      ) : (
                        <span className="text-amber-400">Aucun contact</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={row.hasEmail ? "text-green-400" : "text-amber-400"}>
                        {row.hasEmail ? "OK" : "Manquant"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={row.hasLinkedin ? "text-green-400" : "text-amber-400"}>
                        {row.hasLinkedin ? "OK" : "Manquant"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-400">
                      {row.missingFields.length > 0 ? row.missingFields.join(", ") : "Aucun"}
                    </td>
                    <td className="px-3 py-2 text-zinc-200">{recommendedAction(row)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card border border-[#2a2a2a] bg-[#111111] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="label">Taches</p>
            <p className="text-sm text-zinc-500">Planification automatique + suivi manuel.</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <span className="inline-flex items-center">
              <CircleAlert className="mr-1 h-4 w-4 text-red-400" /> {indicators.overdue} en retard
            </span>
            <span className="inline-flex items-center">
              <CalendarClock className="mr-1 h-4 w-4 text-amber-400" /> {indicators.today} aujourd hui
            </span>
            <span className="inline-flex items-center">
              <CheckCircle2 className="mr-1 h-4 w-4 text-green-400" /> {indicators.done} termine
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-[#1a1a1a] text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2">Activite</th>
                <th className="px-3 py-2">Lead</th>
                <th className="px-3 py-2">Echeance</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-zinc-500">
                    Chargement...
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity.id} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                    <td className="px-3 py-2">
                      <p className="text-sm font-medium text-zinc-100">{activity.titre}</p>
                      <p className="text-xs text-zinc-500">{activity.description}</p>
                    </td>
                    <td className="px-3 py-2 text-zinc-300">
                      {activity.lead.contact.prenom} {activity.lead.contact.nom}
                      <p className="text-xs text-zinc-500">{activity.lead.contact.entreprise.nom}</p>
                    </td>
                    <td className="px-3 py-2 text-zinc-300">
                      {new Date(activity.dueDate).toLocaleDateString("fr-FR")}
                      {activity.statut === "a_faire" && isOverdue(activity.dueDate) ? (
                        <span className="ml-2 inline-flex items-center text-xs text-red-400">
                          <CircleAlert className="mr-1 h-3.5 w-3.5" /> Retard
                        </span>
                      ) : activity.statut === "a_faire" && isToday(activity.dueDate) ? (
                        <span className="ml-2 inline-flex items-center text-xs text-amber-400">
                          <CalendarClock className="mr-1 h-3.5 w-3.5" /> Aujourd hui
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`badge ${activity.statut === "termine" ? "status-badge-termine" : "status-badge-a_contacter"}`}
                      >
                        {activity.statut}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {activity.statut !== "termine" ? (
                          <Button
                            variant="ghost"
                            data-action="mark-done"
                            data-activity-id={activity.id}
                            aria-label={`Marquer l activite ${activity.titre} comme terminee`}
                            onClick={() => markDone(activity).catch(console.error)}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Terminer
                          </Button>
                        ) : null}
                        <Button
                          variant="danger"
                          data-action="delete-activity"
                          data-activity-id={activity.id}
                          aria-label={`Supprimer l activite ${activity.titre}`}
                          onClick={() => deleteActivity(activity).catch(console.error)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
            <h2 className="text-xl font-semibold text-[#ededed]">Nouvelle activite</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <p className="label mb-1">Lead associe</p>
                <Select value={form.leadId} onValueChange={(value) => setForm((prev) => ({ ...prev, leadId: value }))}>
                  <SelectTrigger aria-label="Selectionner le lead associe">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.contact.prenom} {lead.contact.nom} • {lead.contact.entreprise.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="label mb-1">Type</p>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, type: value as ActivityType }))}
                >
                  <SelectTrigger aria-label="Selectionner le type d activite">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPE_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <p className="label mb-1">Titre</p>
                <input
                  className="input"
                  placeholder="Titre"
                  value={form.titre}
                  onChange={(event) => setForm((prev) => ({ ...prev, titre: event.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <p className="label mb-1">Description</p>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="Description"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>

              <div>
                <p className="label mb-1">Echeance</p>
                <input
                  className="input"
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                data-action="confirm-create-activity"
                data-lead-id={form.leadId}
                aria-label="Confirmer la creation d activite"
                onClick={() => createActivity().catch(console.error)}
                disabled={!form.leadId}
              >
                Creer
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
