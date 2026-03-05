"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { notifyError, notifySuccess } from "@/lib/feedback";

type Props = {
  className?: string;
  onCreated?: () => Promise<void> | void;
};

export function QuickAddLead({ className = "", onCreated }: Props) {
  const [form, setForm] = useState({
    entreprise: "",
    contact: "",
    email: "",
    ville: "Lorient",
    secteur: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          poste: "Dirigeant",
          notes: "",
        }),
      });
      if (!response.ok) {
        throw new Error("Erreur creation lead");
      }

      setForm({
        entreprise: "",
        contact: "",
        email: "",
        ville: "Lorient",
        secteur: "",
      });
      notifySuccess(`Lead "${form.contact}" ajoute avec succes.`);
      await onCreated?.();
    } catch (error) {
      console.error(error);
      notifyError("Impossible d ajouter le lead.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`grid gap-2 md:grid-cols-6 ${className}`}>
      <input
        className="input md:col-span-1"
        aria-label="Nom de l entreprise"
        placeholder="Entreprise"
        value={form.entreprise}
        onChange={(event) => setForm((prev) => ({ ...prev, entreprise: event.target.value }))}
      />
      <input
        className="input md:col-span-1"
        aria-label="Prenom et nom du contact"
        placeholder="Prenom Nom"
        value={form.contact}
        onChange={(event) => setForm((prev) => ({ ...prev, contact: event.target.value }))}
      />
      <input
        className="input md:col-span-1"
        aria-label="Email du contact"
        placeholder="email@entreprise.fr"
        value={form.email}
        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
      />
      <input
        className="input md:col-span-1"
        aria-label="Ville de l entreprise"
        placeholder="Ville"
        value={form.ville}
        onChange={(event) => setForm((prev) => ({ ...prev, ville: event.target.value }))}
      />
      <input
        className="input md:col-span-1"
        aria-label="Secteur de l entreprise"
        placeholder="Secteur"
        value={form.secteur}
        onChange={(event) => setForm((prev) => ({ ...prev, secteur: event.target.value }))}
      />
      <Button
        type="submit"
        variant="primary"
        disabled={submitting}
        data-action="quick-add-lead"
        aria-label="Ajouter un lead rapidement"
      >
        <Plus className="mr-1 h-4 w-4" />
        {submitting ? "Ajout..." : "Ajouter"}
      </Button>
    </form>
  );
}
