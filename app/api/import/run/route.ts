import { NextRequest, NextResponse } from "next/server";

import { importAndEnrichCsv } from "@/lib/importer";
import { ColumnMapping, IMPORT_CANONICAL_FIELDS } from "@/lib/import-mapping";
import { prisma } from "@/lib/db";

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
  const mapping = parseColumnMapping(mappingInput);
  const result = await importAndEnrichCsv(prisma, csvText, mapping);

  return NextResponse.json({
    summary: {
      processedRows: result.processedRows,
      companiesCreated: result.companiesCreated,
      companiesUpdated: result.companiesUpdated,
      contactsCreated: result.contactsCreated,
      contactsUpdated: result.contactsUpdated,
      leadsUpdated: result.leadsUpdated,
      delimiter: result.delimiter,
    },
    enrichedCsv: result.enrichedCsv,
  });
}
