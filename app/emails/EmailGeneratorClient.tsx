"use client";

import { Copy, Mail, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  buildProspectionBody,
  buildProspectionSubject,
  EmailLength,
  EmailTone,
} from "@/lib/email-templates";
import { notifyError, notifySuccess } from "@/lib/feedback";

type LeadOption = {
  id: string;
  priorite: "A" | "B" | "C";
  scoreGlobal: number;
  contact: {
    prenom: string;
    nom: string;
    poste: string;
    emailPro: string;
    entreprise: {
      nom: string;
      secteurActivite: string;
      ville: string;
    };
  };
};

export function EmailGeneratorClient() {
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [leadId, setLeadId] = useState("");
  const [tone, setTone] = useState<EmailTone>("consulting");
  const [length, setLength] = useState<EmailLength>("moyen");

  useEffect(() => {
    fetch("/api/leads?page=1&pageSize=400")
      .then((response) => response.json())
      .then((payload) => {
        setLeads(payload.items || []);
        setLeadId(payload.items?.[0]?.id ?? "");
      })
      .catch(console.error);
  }, []);

  const lead = useMemo(() => leads.find((item) => item.id === leadId), [leads, leadId]);

  const subject = useMemo(() => {
    if (!lead) return "";
    return buildProspectionSubject(lead.priorite, lead.contact.entreprise.nom);
  }, [lead]);

  const body = useMemo(() => {
    if (!lead) return "";
    return buildProspectionBody({
      lead: {
        prenom: lead.contact.prenom,
        nom: lead.contact.nom,
        poste: lead.contact.poste,
        entreprise: lead.contact.entreprise.nom,
        secteur: lead.contact.entreprise.secteurActivite,
        ville: lead.contact.entreprise.ville,
        priorite: lead.priorite,
      },
      tone,
      length,
    });
  }, [lead, tone, length]);

  const mailto = useMemo(() => {
    if (!lead) return "#";
    return `mailto:${lead.contact.emailPro}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [lead, subject, body]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(`Objet: ${subject}\n\n${body}`);
      notifySuccess("Email copie dans le presse-papiers.");
    } catch (error) {
      console.error(error);
      notifyError("Impossible de copier l email.");
    }
  }

  async function sendNow() {
    if (!lead) return;
    try {
      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          subject,
          body,
          ton: tone,
          longueur: length,
        }),
      });
      if (!response.ok) throw new Error("Erreur envoi");
      notifySuccess(`Email envoye a ${lead.contact.prenom} ${lead.contact.nom}.`);
    } catch (error) {
      console.error(error);
      notifyError("Erreur lors de l envoi de l email.");
    }
  }

  return (
    <div className="space-y-5">
      <section>
        <p className="label">Emails</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#ededed]">
          Generateur & envoi
        </h1>
      </section>

      <section className="card border border-[#2a2a2a] bg-[#111111] p-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <div>
            <p className="label mb-1">Lead</p>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger aria-label="Selectionner le lead">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leads.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.contact.prenom} {item.contact.nom} • {item.contact.entreprise.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="label mb-1">Ton</p>
            <Select value={tone} onValueChange={(value) => setTone(value as EmailTone)}>
              <SelectTrigger aria-label="Choisir le ton de l email">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professionnel">professionnel</SelectItem>
                <SelectItem value="amical">amical</SelectItem>
                <SelectItem value="technique">technique</SelectItem>
                <SelectItem value="consulting">consulting</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="label mb-1">Longueur</p>
            <Select value={length} onValueChange={(value) => setLength(value as EmailLength)}>
              <SelectTrigger aria-label="Choisir la longueur de l email">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="court">court</SelectItem>
                <SelectItem value="moyen">moyen</SelectItem>
                <SelectItem value="long">long</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="card border border-[#2a2a2a] bg-[#111111] p-4">
        <p className="label">Objet</p>
        <p className="mt-1 text-base font-semibold text-zinc-100">{subject || "Selectionne un lead"}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            data-action="copy-email"
            data-lead-id={lead?.id}
            aria-label={`Copier l email pour ${lead?.contact.prenom || "ce lead"}`}
            onClick={() => copyEmail().catch(console.error)}
          >
            <Copy className="mr-1 h-4 w-4" />
            Copier l email
          </Button>
          <a
            className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-700"
            href={mailto}
            data-action="open-mail-client"
            data-lead-id={lead?.id}
            aria-label={`Ouvrir le client mail pour ${lead?.contact.prenom || "ce lead"}`}
          >
            <Mail className="mr-1 h-4 w-4" />
            Ouvrir dans le client mail
          </a>
          <Button
            variant="primary"
            data-action="send-email"
            data-lead-id={lead?.id}
            aria-label={`Envoyer email de prospection a ${lead?.contact.prenom || "ce lead"}`}
            onClick={() => sendNow().catch(console.error)}
          >
            <Send className="mr-1 h-4 w-4" />
            Envoyer maintenant
          </Button>
        </div>
        <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-zinc-800 bg-[#1a1a1a] p-4 text-sm text-zinc-200">
          {body}
        </pre>
      </section>
    </div>
  );
}
