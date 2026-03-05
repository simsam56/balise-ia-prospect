import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

export function detectDelimiter(csvText: string): "," | ";" {
  const firstLine = csvText.split(/\r?\n/, 1)[0] ?? "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

export function parseCsvText(csvText: string): { rows: Array<Record<string, string>>; delimiter: "," | ";" } {
  const delimiter = detectDelimiter(csvText);
  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    delimiter,
    bom: true,
    trim: true,
  }) as Array<Record<string, string>>;

  return { rows, delimiter };
}

export function toCsv(rows: Array<Record<string, string | number | null | undefined>>, delimiter: "," | ";" = ","): string {
  return stringify(rows, {
    header: true,
    delimiter,
    quoted: true,
  });
}
