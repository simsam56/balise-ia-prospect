"use client";

import { Upload } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { IMPORT_CANONICAL_FIELDS } from "@/lib/import-mapping";
import { notifyError, notifySuccess } from "@/lib/feedback";

type ColumnMapping = Record<string, string>;

type PreviewResponse = {
  delimiter: "," | ";";
  totalRows: number;
  columns: string[];
  canonicalFields: string[];
  suggestedMapping: ColumnMapping;
  mappingUsed: ColumnMapping;
  preview: Array<Record<string, string>>;
};

type RunResponse = {
  summary: {
    processedRows: number;
    companiesCreated: number;
    companiesUpdated: number;
    contactsCreated: number;
    contactsUpdated: number;
    leadsUpdated: number;
    delimiter: "," | ";";
  };
  enrichedCsv: string;
};

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [showDocs, setShowDocs] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);

  const previewColumns = useMemo(() => preview?.columns ?? [], [preview]);
  const canonicalFields = useMemo(
    () => preview?.canonicalFields ?? Array.from(IMPORT_CANONICAL_FIELDS),
    [preview],
  );

  const mappedColumns = useMemo(() => {
    if (!preview) return [];
    return canonicalFields.filter((field) =>
      preview.preview.some((row) => (row[field] || "").trim() !== ""),
    );
  }, [canonicalFields, preview]);

  async function handlePreview() {
    if (!file) return;
    setLoadingPreview(true);
    try {
      const form = new FormData();
      form.set("file", file);
      if (Object.keys(mapping).length > 0) {
        form.set("mapping", JSON.stringify(mapping));
      }
      const response = await fetch("/api/import/preview", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as PreviewResponse;
      setPreview(payload);
      setMapping(payload.mappingUsed || payload.suggestedMapping || {});
    } catch (error) {
      console.error(error);
      notifyError("Erreur preview CSV.");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function runImport() {
    if (!file) return;
    setLoadingImport(true);
    try {
      const form = new FormData();
      form.set("file", file);
      if (Object.keys(mapping).length > 0) {
        form.set("mapping", JSON.stringify(mapping));
      }
      const response = await fetch("/api/import/run", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as RunResponse;
      setResult(payload);
      notifySuccess("Import + enrichissement termine.");
    } catch (error) {
      console.error(error);
      notifyError("Erreur import CSV.");
    } finally {
      setLoadingImport(false);
    }
  }

  function downloadEnrichedCsv() {
    if (!result?.enrichedCsv) return;
    const blob = new Blob([result.enrichedCsv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "balise-ia-enriched.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <section className="card border border-[#2a2a2a] bg-[#111111] p-4">
        <p className="label">Import CSV</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#ededed]">
          Pipeline import & enrichissement
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Charge un CSV, mappe les colonnes puis importe en base avec scoring.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="file"
            className="input max-w-md"
            accept=".csv,text/csv"
            aria-label="Importer un fichier CSV"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setPreview(null);
              setResult(null);
              setMapping({});
            }}
          />
          <Button
            variant="secondary"
            data-action="preview-csv"
            aria-label="Previsualiser le fichier CSV"
            onClick={() => handlePreview().catch(console.error)}
            disabled={!file || loadingPreview}
          >
            <Upload className="mr-1 h-4 w-4" />
            {loadingPreview ? "Preview..." : "Previsualiser CSV"}
          </Button>
          <Button
            variant="primary"
            data-action="run-import-csv"
            aria-label="Importer et enrichir le fichier CSV"
            onClick={() => runImport().catch(console.error)}
            disabled={!file || loadingImport}
          >
            {loadingImport ? "Import..." : "Importer + Enrichir + Scorer"}
          </Button>
          <Button
            variant="ghost"
            data-action="open-csv-docs"
            aria-label="Ouvrir la documentation du format CSV"
            onClick={() => setShowDocs(true)}
          >
            Voir la documentation du format CSV attendu
          </Button>
        </div>
      </section>

      {preview ? (
        <section className="card border border-[#2a2a2a] bg-[#111111] p-4">
          <p className="text-sm text-zinc-400">
            {preview.totalRows} lignes detectees • delimiter {preview.delimiter}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {canonicalFields.map((field) => (
              <div key={field}>
                <p className="label mb-1">{field}</p>
                <Select
                  value={mapping[field] || "none"}
                  onValueChange={(value) =>
                    setMapping((prev) => ({
                      ...prev,
                      [field]: value === "none" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger aria-label={`Mapper la colonne ${field}`}>
                    <SelectValue placeholder="Non mappe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non mappe</SelectItem>
                    {previewColumns.map((column) => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-[#1a1a1a] text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  {mappedColumns.map((column) => (
                    <th key={column} className="px-2 py-2">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.preview.map((row, index) => (
                  <tr key={index} className="border-t border-zinc-800">
                    {mappedColumns.map((column) => (
                      <td key={column} className="px-2 py-2 text-zinc-300">
                        {row[column]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {result ? (
        <section className="card border border-[#2a2a2a] bg-[#111111] p-4">
          <h2 className="text-lg font-semibold text-zinc-100">Resultat import</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <p className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-3 text-sm text-zinc-300">
              Lignes: <strong>{result.summary.processedRows}</strong>
            </p>
            <p className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-3 text-sm text-zinc-300">
              Entreprises creees/maj: <strong>{result.summary.companiesCreated}</strong> /{" "}
              <strong>{result.summary.companiesUpdated}</strong>
            </p>
            <p className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-3 text-sm text-zinc-300">
              Contacts crees/maj: <strong>{result.summary.contactsCreated}</strong> /{" "}
              <strong>{result.summary.contactsUpdated}</strong>
            </p>
          </div>
          <div className="mt-4">
            <Button variant="secondary" onClick={downloadEnrichedCsv}>
              Telecharger le CSV enrichi
            </Button>
          </div>
        </section>
      ) : null}

      {showDocs ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-3xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
            <h3 className="text-lg font-semibold text-zinc-100">Format CSV accepte</h3>
            <p className="mt-1 text-sm text-zinc-400">Separateur supporte: `,` ou `;`.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-2 py-2">Champ canonique</th>
                    <th className="px-2 py-2">Exemples colonnes source</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["nom_entreprise", "entreprise, company"],
                    ["prenom", "prenom, first_name"],
                    ["nom_contact", "nom_contact, last_name"],
                    ["poste", "poste, title"],
                    ["email", "email, email_pro"],
                    ["ville", "ville, city"],
                    ["secteur_activite", "secteur, industry"],
                  ].map(([field, aliases]) => (
                    <tr key={field} className="border-t border-zinc-800">
                      <td className="px-2 py-2 text-zinc-200">{field}</td>
                      <td className="px-2 py-2 text-zinc-400">{aliases}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setShowDocs(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
