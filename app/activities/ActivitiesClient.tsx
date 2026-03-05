"use client";

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
    contact: {
      prenom: string;
      nom: string;
      entreprise: {
        nom: string;
      };
    };
  };
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

export function ActivitiesClient() {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [showModal, setShowModal] = useState(false);
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
      const [activitiesResponse, leadsResponse] = await Promise.all([
        fetch("/api/activities"),
        fetch("/api/leads?page=1&pageSize=400"),
      ]);
      const activitiesPayload = await activitiesResponse.json();
      const leadsPayload = await leadsResponse.json();
      setActivities(activitiesPayload.items || []);
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
    return { overdue, today, done };
  }, [activities]);

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
      notifySuccess(`Activite "${activity.titre}" terminee.`);
      await fetchData();
    } catch (error) {
      console.error(error);
      notifyError("Erreur mise a jour activite.");
    }
  }

  async function deleteActivity(activity: ActivityRow) {
    try {
      await fetch(`/api/activities/${activity.id}`, { method: "DELETE" });
      notifySuccess(`Activite "${activity.titre}" supprimee.`);
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
          <p className="label">Activities</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#ededed]">Taches & interactions</h1>
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

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="card border border-red-500/20 bg-red-500/5 p-4">
          <p className="label">En retard</p>
          <p className="mt-2 text-3xl font-bold text-white">{indicators.overdue}</p>
        </article>
        <article className="card border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="label">Aujourd hui</p>
          <p className="mt-2 text-3xl font-bold text-white">{indicators.today}</p>
        </article>
        <article className="card border border-green-500/20 bg-green-500/5 p-4">
          <p className="label">Termine</p>
          <p className="mt-2 text-3xl font-bold text-white">{indicators.done}</p>
        </article>
      </section>

      <section className="card border border-[#2a2a2a] bg-[#111111]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-[#1a1a1a] text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-3">Activite</th>
                <th className="px-3 py-3">Lead</th>
                <th className="px-3 py-3">Echeance</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-3 py-3">Actions</th>
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
                  <tr key={activity.id} className="border-t border-zinc-800">
                    <td className="px-3 py-3">
                      <p className="text-sm font-medium text-zinc-100">{activity.titre}</p>
                      <p className="text-xs text-zinc-500">{activity.description}</p>
                    </td>
                    <td className="px-3 py-3 text-zinc-300">
                      {activity.lead.contact.prenom} {activity.lead.contact.nom}
                      <p className="text-xs text-zinc-500">{activity.lead.contact.entreprise.nom}</p>
                    </td>
                    <td className="px-3 py-3 text-zinc-300">
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
                    <td className="px-3 py-3">
                      <span className={`badge ${activity.statut === "termine" ? "status-badge-termine" : "status-badge-a_contacter"}`}>
                        {activity.statut}
                      </span>
                    </td>
                    <td className="px-3 py-3">
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
                <Select value={form.type} onValueChange={(value) => setForm((prev) => ({ ...prev, type: value as ActivityType }))}>
                  <SelectTrigger aria-label="Selectionner le type d activite">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPE_VALUES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <p className="label mb-1">Titre</p>
                <input
                  className="input"
                  value={form.titre}
                  aria-label="Titre de l activite"
                  onChange={(event) => setForm((prev) => ({ ...prev, titre: event.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <p className="label mb-1">Description</p>
                <textarea
                  className="input min-h-[90px]"
                  value={form.description}
                  aria-label="Description de l activite"
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              <div>
                <p className="label mb-1">Echeance</p>
                <input
                  className="input"
                  type="date"
                  value={form.dueDate}
                  aria-label="Date d echeance"
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
                data-action="save-activity"
                aria-label="Creer l activite"
                onClick={() => createActivity().catch(console.error)}
                disabled={!form.leadId || !form.titre.trim()}
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
