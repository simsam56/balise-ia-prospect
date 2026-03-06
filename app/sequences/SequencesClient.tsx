"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { notifyError, notifySuccess } from "@/lib/feedback";

type Sequence = {
  id: string;
  nom: string;
  description: string;
  steps: Array<{ dayOffset: number; type: string; label: string }>;
};

type Enrollment = {
  id: string;
  leadId: string;
  sequenceId: string;
  currentStep: number;
  nextSendDate: string;
  status: "active" | "paused" | "completed" | "stopped";
  lead: {
    contact: {
      prenom: string;
      nom: string;
      entreprise: { nom: string };
    };
  };
};

type LeadOption = {
  id: string;
  contact: {
    prenom: string;
    nom: string;
    entreprise: { nom: string };
  };
};

const stepTypeClass: Record<string, string> = {
  COLD: "bg-zinc-500",
  FOLLOW_UP: "bg-zinc-300",
  VALUE: "bg-green-500",
  OFFER: "bg-amber-500",
  BREAKUP: "bg-red-500",
};

export function SequencesClient() {
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");

  const fetchData = useCallback(async () => {
    const [sequencesResponse, leadsResponse] = await Promise.all([
      fetch("/api/sequences"),
      fetch("/api/leads?page=1&pageSize=400"),
    ]);
    const sequencesPayload = await sequencesResponse.json();
    const leadsPayload = await leadsResponse.json();

    const firstSequence = (sequencesPayload.sequences || [])[0] || null;
    setSequence(firstSequence);
    setEnrollments(sequencesPayload.enrollments || []);
    setLeads(leadsPayload.items || []);
    setSelectedLeadId((prev) => prev || leadsPayload.items?.[0]?.id || "");
  }, []);

  useEffect(() => {
    fetchData().catch(console.error);
  }, [fetchData]);

  const activeEnrollments = useMemo(
    () => enrollments.filter((enrollment) => ["active", "paused"].includes(enrollment.status)),
    [enrollments],
  );

  async function enrollLead() {
    if (!selectedLeadId) return;
    try {
      await fetch("/api/sequences/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLeadId,
          sequenceId: sequence?.id,
        }),
      });
      notifySuccess("Lead enrolle dans la sequence unique.");
      setOpenModal(false);
      await fetchData();
    } catch (error) {
      console.error(error);
      notifyError("Erreur enrollment.");
    }
  }

  async function updateEnrollmentStatus(
    enrollmentId: string,
    status: "active" | "paused" | "stopped",
  ) {
    try {
      await fetch(`/api/sequences/enrollment/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      notifySuccess(`Enrollment passe en ${status}.`);
      await fetchData();
    } catch (error) {
      console.error(error);
      notifyError("Erreur update enrollment.");
    }
  }

  async function simulateCron() {
    try {
      const response = await fetch("/api/sequences/simulate", { method: "POST" });
      if (!response.ok) throw new Error("Simulation cron impossible");
      notifySuccess("Cron sequences simule.");
      await fetchData();
    } catch (error) {
      console.error(error);
      notifyError("Erreur simulation cron.");
    }
  }

  if (!sequence) {
    return (
      <div className="card border border-[#2a2a2a] bg-[#111111] p-6 text-zinc-400">
        Aucune sequence configuree.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="flex items-center justify-between">
        <div>
          <p className="label">Sequence unique</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#ededed]">Cadence automatique 14 jours</h1>
          <p className="mt-1 text-sm text-zinc-500">Une seule sequence maintenue pour garder un process simple.</p>
        </div>
        <div className="flex items-center gap-2">
          {process.env.NODE_ENV === "development" ? (
            <Button variant="secondary" onClick={() => simulateCron().catch(console.error)}>
              Simuler cron
            </Button>
          ) : null}
          <Button
            variant="primary"
            data-action="enroll-sequence"
            data-sequence-id={sequence.id}
            aria-label={`Enroller un lead dans la sequence ${sequence.nom}`}
            onClick={() => setOpenModal(true)}
          >
            Enroller un lead
          </Button>
        </div>
      </section>

      <section className="card border border-[#2a2a2a] bg-[#111111] p-4">
        <h3 className="text-lg font-semibold text-zinc-100">{sequence.nom}</h3>
        <p className="mt-1 text-sm text-zinc-400">{sequence.description}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {sequence.steps.map((step, index) => (
            <div key={`${step.label}-${index}`} className="flex items-center gap-2">
              <div className="rounded-lg border border-zinc-700 bg-[#1a1a1a] px-3 py-2">
                <div className="mb-1 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${stepTypeClass[step.type] || "bg-zinc-500"}`} />
                  <p className="text-xs font-medium text-zinc-200">{step.type}</p>
                </div>
                <p className="text-xs text-zinc-400">
                  J+{step.dayOffset} · {step.label}
                </p>
              </div>
              {index < sequence.steps.length - 1 ? <span className="text-zinc-600">→</span> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="card border border-[#2a2a2a] bg-[#111111] p-4">
        <h2 className="text-lg font-semibold text-zinc-100">Enrollments actifs</h2>
        {activeEnrollments.length === 0 ? (
          <div className="mt-4 rounded-lg border border-zinc-800 bg-[#1a1a1a] p-6 text-center">
            <p className="text-sm text-zinc-400">Aucun enrollment actif.</p>
            <p className="mt-2 text-sm text-zinc-500">Enroller votre premier lead.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-[#1a1a1a] text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Lead</th>
                  <th className="px-3 py-2">Etape actuelle</th>
                  <th className="px-3 py-2">Prochain envoi</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="border-t border-zinc-800">
                    <td className="px-3 py-3 text-zinc-200">
                      {enrollment.lead.contact.prenom} {enrollment.lead.contact.nom}
                      <p className="text-xs text-zinc-500">{enrollment.lead.contact.entreprise.nom}</p>
                    </td>
                    <td className="px-3 py-3 text-zinc-300">J+{sequence.steps[enrollment.currentStep]?.dayOffset ?? 14}</td>
                    <td className="px-3 py-3 text-zinc-300">
                      {new Date(enrollment.nextSendDate).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-3 py-3 text-zinc-300">{enrollment.status}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {enrollment.status === "active" ? (
                          <Button
                            variant="secondary"
                            data-action="pause-sequence"
                            data-sequence-id={enrollment.id}
                            aria-label={`Pause enrollment ${enrollment.id}`}
                            onClick={() => updateEnrollmentStatus(enrollment.id, "paused").catch(console.error)}
                          >
                            Pause
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            data-action="resume-sequence"
                            data-sequence-id={enrollment.id}
                            aria-label={`Reprendre enrollment ${enrollment.id}`}
                            onClick={() => updateEnrollmentStatus(enrollment.id, "active").catch(console.error)}
                          >
                            Reprendre
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          data-action="stop-sequence"
                          data-sequence-id={enrollment.id}
                          aria-label={`Arreter enrollment ${enrollment.id}`}
                          onClick={() => updateEnrollmentStatus(enrollment.id, "stopped").catch(console.error)}
                        >
                          Arreter
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {openModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
            <h3 className="text-lg font-semibold text-zinc-100">Enroller un lead</h3>
            <p className="mt-1 text-sm text-zinc-400">{sequence.nom}</p>

            <div className="mt-4">
              <p className="label mb-1">Lead</p>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger aria-label="Selectionner le lead a enroller">
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

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpenModal(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                data-action="confirm-enroll-sequence"
                data-sequence-id={sequence.id}
                data-lead-id={selectedLeadId}
                aria-label="Confirmer enrollment sequence"
                onClick={() => enrollLead().catch(console.error)}
                disabled={!selectedLeadId}
              >
                Enroller
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
