"use client";

import { Upload } from "lucide-react";
import { useMemo, useState } from "react";

import { IMPORT_CANONICAL_FIELDS } from "@/lib/import-mapping";

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
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);

  const canPreview = !!file && !loadingPreview;
  const canImport = !!file && !loadingImport;

  const previewColumns = useMemo(() => preview?.columns ?? [], [preview]);
  const canonicalFields = useMemo(
    () => preview?.canonicalFields ?? Array.from(IMPORT_CANONICAL_FIELDS),
    [preview],
  );

  const mappedPreviewColumns = useMemo(() => {
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
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleRunImport() {
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

  function handleMappingChange(field: string, sourceColumn: string) {
    setMapping((prev) => ({
      ...prev,
      [field]: sourceColumn,
    }));
  }

  function resetToSuggestedMapping() {
    if (!preview) return;
    setMapping(preview.suggestedMapping || {});
  }

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <p className="label">Import + Enrichissement + Scoring</p>
        <h2 className="mt-1 font-[var(--font-space)] text-2xl font-semibold">Pipeline CSV</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Upload un CSV (UTF-8, delimiter <strong>,</strong> ou <strong>;</strong>), mappe les colonnes, puis
          lance Importer + Enrichir + Scorer.
        </p>

        <div className="mt-4 grid gap-3 sm:flex sm:items-center">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview(null);
              setResult(null);
              setMapping({});
            }}
            className="input max-w-md"
          />
          <button className="btn-secondary" disabled={!canPreview} onClick={handlePreview}>
            <Upload className="mr-2 h-4 w-4" />
            {loadingPreview ? "Preview..." : "Previsualiser CSV"}
          </button>
          <button className="btn" disabled={!canImport} onClick={handleRunImport}>
            {loadingImport ? "Import..." : "Importer + Enrichir + Scorer"}
          </button>
        </div>
      </section>

      {preview && (
        <>
          <section className="card p-5">
            <h3 className="font-semibold">Preview source</h3>
            <p className="mt-1 text-sm text-slate-600">
              {preview.totalRows} lignes detectees • delimiter {preview.delimiter} • colonnes source:{" "}
              {previewColumns.join(", ")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={resetToSuggestedMapping}>
                Revenir au mapping recommande
              </button>
              <button className="btn-secondary" onClick={handlePreview}>
                Recalculer preview mappee
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {canonicalFields.map((field) => (
                <label key={field} className="block">
                  <span className="label mb-1 block">{field}</span>
                  <select
                    className="select"
                    value={mapping[field] || ""}
                    onChange={(e) => handleMappingChange(field, e.target.value)}
                  >
                    <option value="">Non mappe</option>
                    {previewColumns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <h3 className="font-semibold">Preview mappee (10 lignes)</h3>
            <p className="mt-1 text-sm text-slate-600">
              Affichage des champs canoniques utiles a l import enrichi.
            </p>

            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    {mappedPreviewColumns.map((column) => (
                      <th key={column} className="px-3 py-2">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, idx) => (
                    <tr key={idx} className="border-t border-slate-100">
                      {mappedPreviewColumns.map((column) => (
                        <td key={column} className="px-3 py-2 text-slate-600">
                          {row[column]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {preview && mappedPreviewColumns.length === 0 && (
        <section className="card p-5">
          <p className="text-sm text-amber-700">
            Aucun champ canonique detecte dans la preview mappee. Ajuste le mapping puis relance la preview.
          </p>
        </section>
      )}

      {result && (
        <section className="card p-5">
          <h3 className="font-semibold">Resultat import</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              Lignes: <strong>{result.summary.processedRows}</strong>
            </p>
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              Entreprises creees/maj: <strong>{result.summary.companiesCreated}</strong> /{" "}
              <strong>{result.summary.companiesUpdated}</strong>
            </p>
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              Contacts crees/maj: <strong>{result.summary.contactsCreated}</strong> /{" "}
              <strong>{result.summary.contactsUpdated}</strong>
            </p>
          </div>
          <div className="mt-4">
            <button className="btn-secondary" onClick={downloadEnrichedCsv}>
              Telecharger le CSV enrichi
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
