"use client";

import Link from "next/link";
import { AlertTriangle, MoreHorizontal, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { QuickAddLead } from "@/app/components/quick-add-lead";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  LEAD_PRIORITY_VALUES,
  LEAD_STATUS_VALUES,
  LeadPriority,
  LeadStatus,
} from "@/lib/domain";
import { notifyError, notifySuccess } from "@/lib/feedback";

type LeadRow = {
  id: string;
  scoreGlobal: number;
  priorite: LeadPriority;
  statutLead: LeadStatus;
  notes: string;
  contact: {
    id: string;
    nom: string;
    prenom: string;
    poste: string;
    emailPro: string;
    linkedinProfil: string;
    entreprise: {
      id: string;
      nom: string;
      ville: string;
      secteurActivite: string;
    };
  };
  sequenceEnrollments?: Array<{
    id: string;
    sequenceId: string;
    currentStep: number;
    status: string;
  }>;
};

type LeadsResponse = {
  items: LeadRow[];
  total: number;
};

type Filters = {
  search: string;
  minScore: number;
  priorite: "" | LeadPriority;
  statutLead: "" | LeadStatus;
  region: string;
  ville: string;
  secteur: string;
  page: number;
  pageSize: number;
};

function scoreBarColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-zinc-500";
}

const leadStatusFlow: LeadStatus[] = [
  "nouveau",
  "a_contacter",
  "contacte",
  "en_discussion",
  "chaud",
  "perdu",
];

function getNextStatus(status: LeadStatus): LeadStatus {
  const index = leadStatusFlow.indexOf(status);
  if (index === -1 || index === leadStatusFlow.length - 1) return status;
  return leadStatusFlow[index + 1];
}

export function LeadsPageClient() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    minScore: 0,
    priorite: "",
    statutLead: "",
    region: "",
    ville: "",
    secteur: "",
    page: 1,
    pageSize: 30,
  });
  const [data, setData] = useState<LeadsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.minScore > 0) params.set("minScore", String(filters.minScore));
    if (filters.priorite) params.set("priorite", filters.priorite);
    if (filters.statutLead) params.set("statutLead", filters.statutLead);
    if (filters.region) params.set("region", filters.region);
    if (filters.ville) params.set("ville", filters.ville);
    if (filters.secteur) params.set("secteur", filters.secteur);
    params.set("page", String(filters.page));
    params.set("pageSize", String(filters.pageSize));
    return params.toString();
  }, [filters]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leads?${query}`);
      const payload = (await response.json()) as LeadsResponse;
      setData(payload);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchRows().catch(console.error);
  }, [fetchRows]);

  async function updateStatus(leadId: string, status: LeadStatus, contactLabel: string) {
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: status }),
      });
      notifySuccess(`Statut mis a jour pour ${contactLabel}.`);
      await fetchRows();
    } catch (error) {
      console.error(error);
      notifyError("Impossible de mettre a jour le statut.");
    }
  }

  async function deleteLead(lead: LeadRow) {
    try {
      await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      notifySuccess(`Lead \"${lead.contact.prenom} ${lead.contact.nom}\" supprime avec succes.`);
      await fetchRows();
    } catch (error) {
      console.error(error);
      notifyError("Erreur lors de la suppression du lead.");
    }
  }

  async function sendEmailNow(lead: LeadRow) {
    try {
      await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, ton: "consulting", longueur: "moyen" }),
      });
      notifySuccess(`Email J0 envoye a ${lead.contact.prenom} ${lead.contact.nom}.`);
    } catch (error) {
      console.error(error);
      notifyError("Erreur envoi email.");
    }
  }

  async function enrollSequence(lead: LeadRow) {
    try {
      await fetch("/api/sequences/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      notifySuccess(`Sequence lancee pour ${lead.contact.prenom} ${lead.contact.nom}.`);
      await fetchRows();
    } catch (error) {
      console.error(error);
      notifyError("Erreur enrollment sequence.");
    }
  }

  return (
    <div className="space-y-4">
      <section className="card border border-[#2a2a2a] bg-[#111111] p-4">
        <p className="label">Base brute</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#ededed]">Tableau de suivi</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Vue compacte type tableur pour qualifier, filtrer et completer rapidement.
        </p>
      </section>

      <section className="card border border-[#2a2a2a] bg-[#111111] p-4">
        <QuickAddLead onCreated={fetchRows} />
      </section>

      <section className="card border border-[#2a2a2a] bg-[#111111] p-4">
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-7">
          <input
            className="input"
            placeholder="Recherche entreprise/contact"
            aria-label="Recherche texte sur les lignes"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value, page: 1 }))}
          />
          <Select
            value={filters.priorite || "all"}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                priorite: value === "all" ? "" : (value as LeadPriority),
                page: 1,
              }))
            }
          >
            <SelectTrigger aria-label="Filtrer par priorite">
              <SelectValue placeholder="Priorite" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorites</SelectItem>
              {LEAD_PRIORITY_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.statutLead || "all"}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                statutLead: value === "all" ? "" : (value as LeadStatus),
                page: 1,
              }))
            }
          >
            <SelectTrigger aria-label="Filtrer par statut">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {LEAD_STATUS_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            className="input"
            type="number"
            min={0}
            max={100}
            value={filters.minScore}
            aria-label="Score minimum"
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, minScore: Number(event.target.value || 0), page: 1 }))
            }
            placeholder="Score min"
          />
          <input
            className="input"
            placeholder="Region"
            aria-label="Filtrer par region"
            value={filters.region}
            onChange={(event) => setFilters((prev) => ({ ...prev, region: event.target.value, page: 1 }))}
          />
          <input
            className="input"
            placeholder="Ville"
            aria-label="Filtrer par ville"
            value={filters.ville}
            onChange={(event) => setFilters((prev) => ({ ...prev, ville: event.target.value, page: 1 }))}
          />
          <input
            className="input"
            placeholder="Secteur"
            aria-label="Filtrer par secteur"
            value={filters.secteur}
            onChange={(event) => setFilters((prev) => ({ ...prev, secteur: event.target.value, page: 1 }))}
          />
        </div>
      </section>

      <section className="card border border-[#2a2a2a] bg-[#111111]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-[#1a1a1a] text-[11px] uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2">Entreprise</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Poste</th>
                <th className="px-3 py-2">Ville</th>
                <th className="px-3 py-2">Secteur</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Priorite</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2">Canaux</th>
                <th className="px-3 py-2">Sequence</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-zinc-500">
                    Chargement...
                  </td>
                </tr>
              ) : (
                data?.items?.map((lead) => {
                  const contactLabel = `${lead.contact.prenom} ${lead.contact.nom}`;
                  const sequence = lead.sequenceEnrollments?.[0];
                  const hasSeedNote = (lead.notes || "").toLowerCase().includes("seed generated");
                  const hasEmail = Boolean(lead.contact.emailPro?.trim());
                  const hasLinkedin = Boolean(lead.contact.linkedinProfil?.trim());

                  return (
                    <tr key={lead.id} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                      <td className="px-3 py-2 text-zinc-100">
                        <Link href={`/companies/${lead.contact.entreprise.id}`} className="hover:underline">
                          {lead.contact.entreprise.nom}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-zinc-300">
                        {contactLabel}
                        {hasSeedNote ? (
                          <span className="ml-1.5 inline-flex items-center text-amber-400" title="Note seed detectee">
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-zinc-300">{lead.contact.poste}</td>
                      <td className="px-3 py-2 text-zinc-300">{lead.contact.entreprise.ville}</td>
                      <td className="px-3 py-2 text-zinc-300">{lead.contact.entreprise.secteurActivite}</td>
                      <td className="px-3 py-2">
                        <p className="font-semibold text-zinc-100">{lead.scoreGlobal}</p>
                        <div className="mt-1 h-1.5 w-20 rounded-full bg-zinc-800">
                          <div
                            className={`h-1.5 rounded-full ${scoreBarColor(lead.scoreGlobal)}`}
                            style={{ width: `${lead.scoreGlobal}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="badge border border-zinc-700 bg-zinc-900 text-zinc-200">{lead.priorite}</span>
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={lead.statutLead}
                          onValueChange={(value) =>
                            updateStatus(lead.id, value as LeadStatus, contactLabel).catch(console.error)
                          }
                        >
                          <SelectTrigger
                            aria-label={`Changer le statut du lead ${contactLabel}`}
                            data-action="change-lead-status"
                            data-lead-id={lead.id}
                            className="h-8"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUS_VALUES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-400">
                        <div className="flex flex-col gap-1">
                          <span className={hasEmail ? "text-green-400" : "text-amber-400"}>
                            {hasEmail ? "email OK" : "email manquant"}
                          </span>
                          <span className={hasLinkedin ? "text-green-400" : "text-amber-400"}>
                            {hasLinkedin ? "linkedin OK" : "linkedin manquant"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-zinc-300">
                        {sequence ? (
                          <div>
                            <p className="text-xs text-zinc-100">{sequence.sequenceId}</p>
                            <p className="text-xs text-zinc-500">J{sequence.currentStep}</p>
                          </div>
                        ) : (
                          <span className="text-zinc-500">Aucune</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <details className="relative">
                          <summary
                            className="inline-flex cursor-pointer list-none items-center rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-300"
                            aria-label={`Actions pour ${contactLabel}`}
                            data-action="open-lead-actions"
                            data-lead-id={lead.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </summary>
                          <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-zinc-700 bg-[#1a1a1a] p-1 shadow-lg">
                            <button
                              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                              data-action="view-lead-detail"
                              data-lead-id={lead.id}
                              aria-label={`Voir le detail du lead ${contactLabel}`}
                              onClick={() => (window.location.href = `/contacts/${lead.contact.id}`)}
                            >
                              Voir detail
                            </button>
                            <button
                              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                              data-action="send-email"
                              data-lead-id={lead.id}
                              aria-label={`Envoyer email de prospection a ${contactLabel}`}
                              onClick={() => sendEmailNow(lead).catch(console.error)}
                            >
                              Envoyer email J0
                            </button>
                            <button
                              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                              data-action="enroll-sequence"
                              data-lead-id={lead.id}
                              aria-label={`Enroller ${contactLabel} dans une sequence`}
                              onClick={() => enrollSequence(lead).catch(console.error)}
                            >
                              Lancer sequence
                            </button>
                            <button
                              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                              data-action="change-lead-status"
                              data-lead-id={lead.id}
                              aria-label={`Changer le statut de ${contactLabel}`}
                              onClick={() =>
                                updateStatus(lead.id, getNextStatus(lead.statutLead), contactLabel).catch(
                                  console.error,
                                )
                              }
                            >
                              Changer statut
                            </button>
                            <button
                              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800"
                              data-action="delete-lead"
                              data-lead-id={lead.id}
                              aria-label={`Supprimer le lead ${contactLabel} - ${lead.contact.entreprise.nom}`}
                              onClick={() => deleteLead(lead).catch(console.error)}
                            >
                              <Trash2 className="mr-1 inline h-4 w-4" />
                              Supprimer
                            </button>
                          </div>
                        </details>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          disabled={filters.page <= 1}
        >
          Precedent
        </Button>
        <p className="text-sm text-zinc-500">Page {filters.page}</p>
        <Button
          variant="secondary"
          onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
          disabled={(data?.items?.length ?? 0) < filters.pageSize}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
