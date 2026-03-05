"use client";

import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { LeadStatus } from "@/lib/domain";
import { notifyError, notifySuccess } from "@/lib/feedback";

type LeadRow = {
  id: string;
  scoreGlobal: number;
  priorite: string;
  statutLead: LeadStatus;
  contact: {
    prenom: string;
    nom: string;
    poste: string;
    entreprise: {
      nom: string;
    };
  };
};

const columns: Array<{ status: LeadStatus; label: string; emoji: string }> = [
  { status: "nouveau", label: "Nouveau", emoji: "🆕" },
  { status: "a_contacter", label: "A contacter", emoji: "📞" },
  { status: "contacte", label: "Contacte", emoji: "✉️" },
  { status: "en_discussion", label: "En discussion", emoji: "💬" },
  { status: "chaud", label: "Chaud", emoji: "🔥" },
];

function LeadCard({ lead }: { lead: LeadRow }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: {
      leadId: lead.id,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab rounded-lg border border-zinc-800 bg-[#111111] p-2 transition hover:border-zinc-600"
      data-lead-id={lead.id}
    >
      <p className="text-sm font-medium text-zinc-100">
        {lead.contact.prenom} {lead.contact.nom}
      </p>
      <p className="text-xs text-zinc-400">{lead.contact.entreprise.nom}</p>
      <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
        <span>{lead.contact.poste}</span>
        <span>Score {lead.scoreGlobal}</span>
      </div>
    </article>
  );
}

function DropColumn({
  status,
  label,
  emoji,
  leads,
}: {
  status: LeadStatus;
  label: string;
  emoji: string;
  leads: LeadRow[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  return (
    <section
      ref={setNodeRef}
      className={`rounded-xl border p-3 ${isOver ? "border-zinc-500 bg-zinc-900/60" : "border-zinc-800 bg-[#111111]"}`}
    >
      <header className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">
          <span className="mr-1">{emoji}</span>
          {label}
        </h3>
        <span className="badge border border-zinc-700 bg-zinc-900 text-zinc-300">{leads.length}</span>
      </header>
      <div className="space-y-2">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </section>
  );
}

export function PipelineClient() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/leads?page=1&pageSize=500");
      const payload = await response.json();
      setLeads(payload.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads().catch(console.error);
  }, [fetchLeads]);

  const grouped = useMemo(() => {
    return Object.fromEntries(
      columns.map((column) => [column.status, leads.filter((lead) => lead.statutLead === column.status)]),
    ) as Record<LeadStatus, LeadRow[]>;
  }, [leads]);

  async function onDragEnd(event: DragEndEvent) {
    const leadId = event.active.id as string;
    const nextStatus = event.over?.id as LeadStatus | undefined;
    if (!leadId || !nextStatus) return;

    const lead = leads.find((candidate) => candidate.id === leadId);
    if (!lead || lead.statutLead === nextStatus) return;

    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: nextStatus }),
      });
      notifySuccess(`Lead ${lead.contact.prenom} ${lead.contact.nom} deplace vers ${nextStatus}.`);
      await fetchLeads();
    } catch (error) {
      console.error(error);
      notifyError("Impossible de deplacer ce lead.");
    }
  }

  return (
    <div className="space-y-4">
      <section className="flex items-center justify-between">
        <div>
          <p className="label">Pipeline</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#ededed]">Kanban prospection</h1>
        </div>
        <Button variant="secondary" onClick={() => fetchLeads().catch(console.error)}>
          Rafraichir
        </Button>
      </section>

      {loading ? <p className="text-sm text-zinc-500">Chargement...</p> : null}

      <DndContext onDragEnd={onDragEnd}>
        <div className="grid gap-3 xl:grid-cols-5">
          {columns.map((column) => (
            <DropColumn
              key={column.status}
              status={column.status}
              label={column.label}
              emoji={column.emoji}
              leads={grouped[column.status] || []}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
