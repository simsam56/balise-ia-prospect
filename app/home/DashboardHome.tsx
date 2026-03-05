"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { QuickAddLead } from "@/app/components/quick-add-lead";
import { notifyError, notifySuccess } from "@/lib/feedback";

type DashboardPayload = {
  kpis: {
    todayCount: number;
    overdueCount: number;
    leadsTotal: number;
    leadsInSequence: number;
  };
  upcomingActivities: Array<{
    id: string;
    titre: string;
    dueDate: string;
    type: string;
    lead: {
      contact: {
        prenom: string;
        nom: string;
        entreprise: {
          nom: string;
        };
      };
    };
  }>;
};

export function DashboardHome() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard");
      const payload = (await response.json()) as DashboardPayload;
      setData(payload);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard().catch(console.error);
  }, [fetchDashboard]);

  async function markDone(activityId: string, title: string) {
    try {
      await fetch(`/api/activities/${activityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "termine" }),
      });
      notifySuccess(`Activite "${title}" terminee.`);
      await fetchDashboard();
    } catch (error) {
      console.error(error);
      notifyError("Impossible de terminer cette activite.");
    }
  }

  const kpis = data?.kpis ?? {
    todayCount: 0,
    overdueCount: 0,
    leadsTotal: 0,
    leadsInSequence: 0,
  };

  return (
    <div className="space-y-6">
      <section>
        <p className="label">Cockpit prospect studio</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#ededed]">
          Dashboard
        </h1>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <article className="card rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
            <p className="label">A faire aujourd hui</p>
            <p className="mt-2 text-3xl font-bold text-white">{kpis.todayCount}</p>
            <Link className="mt-2 inline-block text-sm text-zinc-300 underline" href="/activities">
              Aller sur activities
            </Link>
          </article>
          <article
            className={`card rounded-xl border p-4 ${
              kpis.overdueCount > 0
                ? "border-red-500/30 bg-red-500/10"
                : "border-[#2a2a2a] bg-[#111111]"
            }`}
          >
            <p className="label">En retard</p>
            <p className="mt-2 text-3xl font-bold text-white">{kpis.overdueCount}</p>
            <Link className="mt-2 inline-block text-sm text-zinc-300 underline" href="/activities">
              Voir les retards
            </Link>
          </article>
          <article className="card rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
            <p className="label">Leads actifs</p>
            <p className="mt-2 text-3xl font-bold text-white">{kpis.leadsTotal}</p>
            <Link className="mt-2 inline-block text-sm text-zinc-300 underline" href="/leads">
              Ouvrir leads
            </Link>
          </article>
          <article className="card rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
            <p className="label">En sequence</p>
            <p className="mt-2 text-3xl font-bold text-white">{kpis.leadsInSequence}</p>
            <Link className="mt-2 inline-block text-sm text-zinc-300 underline" href="/sequences">
              Ouvrir sequences
            </Link>
          </article>
        </div>

        <div className="card rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="label">Prochaines actions</p>
              <p className="text-sm text-zinc-400">Top 5 activites a venir</p>
            </div>
            <Button variant="secondary" onClick={() => fetchDashboard().catch(console.error)}>
              Rafraichir
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-zinc-400">Chargement...</p>
          ) : data?.upcomingActivities?.length ? (
            <div className="space-y-2">
              {data.upcomingActivities.map((activity) => (
                <div key={activity.id} className="rounded-lg border border-zinc-800 bg-[#0f0f0f] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{activity.titre}</p>
                      <p className="text-xs text-zinc-500">
                        {activity.lead.contact.prenom} {activity.lead.contact.nom} •{" "}
                        {activity.lead.contact.entreprise.nom}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {new Date(activity.dueDate).toLocaleDateString("fr-FR")} • {activity.type}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      data-action="mark-done"
                      data-activity-id={activity.id}
                      aria-label={`Marquer l activite ${activity.titre} comme terminee`}
                      onClick={() => markDone(activity.id, activity.titre).catch(console.error)}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Terminer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-[#0f0f0f] p-6 text-center text-sm text-zinc-500">
              Aucune activite a venir. Cree une nouvelle tache depuis Activities.
            </div>
          )}
        </div>
      </section>

      <section className="card rounded-xl border border-[#2a2a2a] bg-[#111111] p-4">
        <p className="label">Quick add lead</p>
        <p className="mb-3 text-sm text-zinc-400">Ajout rapide en une ligne.</p>
        <QuickAddLead onCreated={fetchDashboard} />
      </section>
    </div>
  );
}
