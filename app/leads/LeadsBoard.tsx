"use client";

import Link from "next/link";
import {
  Building2,
  Copy,
  Download,
  ExternalLink,
  RefreshCcw,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  LEAD_PRIORITY_VALUES,
  LEAD_STATUS_VALUES,
  LeadPriority,
  LeadStatus,
} from "@/lib/domain";

type LeadRow = {
  id: string;
  scoreEntreprise: number;
  scoreContact: number;
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
      region: string;
      ville: string;
      secteurActivite: string;
    };
  };
};

type LeadApiResponse = {
  items: LeadRow[];
  total: number;
  page: number;
  pageSize: number;
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

function badgeClassForPriority(priority: LeadPriority): string {
  if (priority === "A") return "badge border border-emerald-200 bg-emerald-50 text-emerald-700";
  if (priority === "B") return "badge border border-amber-200 bg-amber-50 text-amber-700";
  return "badge border border-slate-200 bg-slate-100 text-slate-700";
}

export function LeadsBoard() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    minScore: 0,
    priorite: "",
    statutLead: "",
    region: "",
    ville: "",
    secteur: "",
    page: 1,
    pageSize: 20,
  });
  const [loading, setLoading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [data, setData] = useState<LeadApiResponse>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const queryString = useMemo(() => {
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

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leads?${queryString}`);
      const payload = (await response.json()) as LeadApiResponse;
      setData(payload);
      setNotesDraft(
        Object.fromEntries(payload.items.map((lead) => [lead.id, lead.notes || ""])),
      );
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchLeads().catch((err) => {
      console.error(err);
    });
  }, [fetchLeads]);

  async function patchLead(id: string, partial: Partial<Pick<LeadRow, "statutLead" | "notes">>) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    await fetchLeads();
  }

  async function recomputeScores() {
    setRecomputing(true);
    try {
      await fetch("/api/scoring/recompute", { method: "POST" });
      await fetchLeads();
    } finally {
      setRecomputing(false);
    }
  }

  function resetFilters() {
    setFilters((prev) => ({
      ...prev,
      search: "",
      minScore: 0,
      priorite: "",
      statutLead: "",
      region: "",
      ville: "",
      secteur: "",
      page: 1,
    }));
  }

  async function copyEmail(value: string) {
    if (!value?.trim()) return;
    await navigator.clipboard.writeText(value.trim());
  }

  const pageCount = Math.max(1, Math.ceil((data.total || 0) / filters.pageSize));

  const dashboardMetrics = useMemo(() => {
    const totalVisible = data.items.length;
    const priorityA = data.items.filter((lead) => lead.priorite === "A").length;
    const hot = data.items.filter((lead) =>
      ["en_discussion", "chaud"].includes(lead.statutLead),
    ).length;
    const averageScore =
      totalVisible === 0
        ? 0
        : Math.round(
            data.items.reduce((sum, lead) => sum + lead.scoreGlobal, 0) / totalVisible,
          );

    return {
      totalVisible,
      priorityA,
      hot,
      averageScore,
    };
  }, [data.items]);

  return (
    <div className="space-y-5">
      <section className="card overflow-hidden">
        <div className="grid gap-4 border-b border-slate-200/80 bg-[linear-gradient(120deg,rgba(2,132,199,0.08),rgba(15,118,110,0.08),rgba(251,191,36,0.08))] p-5 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="label">Prospection Balise-IA</p>
            <h2 className="mt-2 font-[var(--font-space)] text-3xl font-semibold text-slate-900">
              Cockpit Leads B2B
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Priorise les PME de Bretagne avec un scoring transparent et un suivi rapide du cycle de lead.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button className="btn-secondary" onClick={recomputeScores} disabled={recomputing}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {recomputing ? "Recalcul..." : "Recalculer scores"}
            </button>
            <a className="btn-secondary" href={`/api/export/leads?${queryString}`}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </a>
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="label">Leads filtres</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{data.total}</p>
            <p className="mt-1 text-xs text-slate-500">{dashboardMetrics.totalVisible} visibles sur la page</p>
          </article>
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <p className="label text-emerald-700">Priorite A</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">{dashboardMetrics.priorityA}</p>
            <p className="mt-1 text-xs text-emerald-700/90">Leads top cible immediatement</p>
          </article>
          <article className="rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4">
            <p className="label text-cyan-700">Chaud / discussion</p>
            <p className="mt-2 text-3xl font-semibold text-cyan-700">{dashboardMetrics.hot}</p>
            <p className="mt-1 text-xs text-cyan-700/90">Opportunites a pousser</p>
          </article>
          <article className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="label text-amber-700">Score moyen</p>
            <p className="mt-2 text-3xl font-semibold text-amber-700">{dashboardMetrics.averageScore}</p>
            <p className="mt-1 text-xs text-amber-700/90">Qualite moyenne des leads visibles</p>
          </article>
        </div>
      </section>

      <section className="card p-5">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <div className="xl:col-span-2">
            <label className="label mb-1 block">Recherche</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                className="input pl-9"
                placeholder="Entreprise, contact, poste..."
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
              />
            </div>
          </div>
          <div>
            <label className="label mb-1 block">Score min</label>
            <input
              className="input"
              type="number"
              min={0}
              max={100}
              value={filters.minScore}
              onChange={(e) =>
                setFilters((p) => ({ ...p, minScore: Number(e.target.value || 0), page: 1 }))
              }
            />
          </div>
          <div>
            <label className="label mb-1 block">Priorite</label>
            <select
              className="select"
              value={filters.priorite}
              onChange={(e) =>
                setFilters((p) => ({ ...p, priorite: e.target.value as Filters["priorite"], page: 1 }))
              }
            >
              <option value="">Toutes</option>
              {LEAD_PRIORITY_VALUES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label mb-1 block">Statut</label>
            <select
              className="select"
              value={filters.statutLead}
              onChange={(e) =>
                setFilters((p) => ({
                  ...p,
                  statutLead: e.target.value as Filters["statutLead"],
                  page: 1,
                }))
              }
            >
              <option value="">Tous</option>
              {LEAD_STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label mb-1 block">Region</label>
            <input
              className="input"
              placeholder="Bretagne"
              value={filters.region}
              onChange={(e) => setFilters((p) => ({ ...p, region: e.target.value, page: 1 }))}
            />
          </div>
          <div>
            <label className="label mb-1 block">Ville</label>
            <input
              className="input"
              placeholder="Lorient"
              value={filters.ville}
              onChange={(e) => setFilters((p) => ({ ...p, ville: e.target.value, page: 1 }))}
            />
          </div>
          <div>
            <label className="label mb-1 block">Secteur</label>
            <input
              className="input"
              placeholder="Services, industrie..."
              value={filters.secteur}
              onChange={(e) => setFilters((p) => ({ ...p, secteur: e.target.value, page: 1 }))}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <span>
            {data.total} lead(s) • page {data.page} / {pageCount}
          </span>
          <div className="flex items-center gap-2">
            <label className="label">Lignes/page</label>
            <select
              className="select w-24"
              value={filters.pageSize}
              onChange={(e) => setFilters((p) => ({ ...p, pageSize: Number(e.target.value), page: 1 }))}
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <button className="btn-secondary" onClick={resetFilters}>
              Reset filtres
            </button>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Entreprise</th>
                <th className="px-3 py-3">Contact</th>
                <th className="px-3 py-3">Score</th>
                <th className="px-3 py-3">Priorite</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-3 py-3">Notes / Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-8 text-center text-slate-500" colSpan={6}>
                    Chargement...
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td className="px-3 py-8 text-center text-slate-500" colSpan={6}>
                    Aucun lead sur ces filtres.
                  </td>
                </tr>
              ) : (
                data.items.map((lead) => (
                  <tr key={lead.id} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 rounded-lg bg-slate-100 p-1.5 text-slate-500">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <Link
                            className="font-medium text-slate-900 hover:text-sky-700 hover:underline"
                            href={`/companies/${lead.contact.entreprise.id}`}
                          >
                            {lead.contact.entreprise.nom}
                          </Link>
                          <p className="mt-1 text-xs text-slate-500">
                            {lead.contact.entreprise.ville} • {lead.contact.entreprise.region}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{lead.contact.entreprise.secteurActivite}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 rounded-lg bg-slate-100 p-1.5 text-slate-500">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <div>
                          <Link
                            className="font-medium text-slate-900 hover:text-sky-700 hover:underline"
                            href={`/contacts/${lead.contact.id}`}
                          >
                            {lead.contact.prenom} {lead.contact.nom}
                          </Link>
                          <p className="mt-1 text-xs text-slate-500">{lead.contact.poste}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <button
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600 hover:bg-slate-50"
                              onClick={() => copyEmail(lead.contact.emailPro).catch(console.error)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {lead.contact.emailPro ? "Copier email" : "Email n/a"}
                            </button>
                            {lead.contact.linkedinProfil ? (
                              <a
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600 hover:bg-slate-50"
                                href={lead.contact.linkedinProfil}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                LinkedIn
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="inline-flex min-w-[84px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <Sparkles className="h-4 w-4 text-slate-500" />
                        <span className="text-lg font-semibold text-slate-900">{lead.scoreGlobal}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Ent {lead.scoreEntreprise} • Ct {lead.scoreContact}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={badgeClassForPriority(lead.priorite)}>{lead.priorite}</span>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        className="select min-w-[156px]"
                        value={lead.statutLead}
                        onChange={(e) =>
                          patchLead(lead.id, { statutLead: e.target.value as LeadStatus }).catch(console.error)
                        }
                      >
                        {LEAD_STATUS_VALUES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="w-80 px-3 py-3">
                      <textarea
                        className="input min-h-[88px]"
                        placeholder="Ajouter contexte, objections, prochaine action..."
                        value={notesDraft[lead.id] ?? ""}
                        onChange={(e) =>
                          setNotesDraft((prev) => ({
                            ...prev,
                            [lead.id]: e.target.value,
                          }))
                        }
                      />
                      <button
                        className="btn mt-2 w-full"
                        onClick={() =>
                          patchLead(lead.id, { notes: notesDraft[lead.id] ?? "" }).catch(console.error)
                        }
                      >
                        Sauver note
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex items-center justify-between">
        <button
          className="btn-secondary"
          disabled={filters.page <= 1}
          onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
        >
          Page precedente
        </button>
        <p className="text-sm text-slate-600">
          Page {filters.page} / {pageCount}
        </p>
        <button
          className="btn-secondary"
          disabled={filters.page >= pageCount}
          onClick={() => setFilters((p) => ({ ...p, page: Math.min(pageCount, p.page + 1) }))}
        >
          Page suivante
        </button>
      </section>
    </div>
  );
}
