import { NextRequest, NextResponse } from "next/server";

import { parseCsvText } from "@/lib/csv";
import {
  applyColumnMapping,
  ColumnMapping,
  IMPORT_CANONICAL_FIELDS,
  suggestColumnMapping,
} from "@/lib/import-mapping";

function parseColumnMapping(raw: FormDataEntryValue | null): ColumnMapping | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const mapping: ColumnMapping = {};
    for (const field of IMPORT_CANONICAL_FIELDS) {
      const value = parsed[field];
      if (typeof value === "string" && value.trim()) {
        mapping[field] = value.trim();
      }
    }
    return Object.keys(mapping).length > 0 ? mapping : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");
  const mappingInput = form.get("mapping");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier CSV fourni." }, { status: 400 });
  }

  const csvText = await file.text();
  const { rows, delimiter } = parseCsvText(csvText);
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const suggestedMapping = suggestColumnMapping(columns);
  const parsedMapping = parseColumnMapping(mappingInput) || suggestedMapping;
  const mappedRows = applyColumnMapping(rows, parsedMapping);

  const preview = mappedRows.slice(0, 10);

  return NextResponse.json({
    delimiter,
    totalRows: rows.length,
    columns,
    canonicalFields: IMPORT_CANONICAL_FIELDS,
    suggestedMapping,
    mappingUsed: parsedMapping,
    preview,
  });
}
