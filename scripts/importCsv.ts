import fs from "node:fs/promises";
import path from "node:path";

import { prisma } from "../lib/db";
import { importAndEnrichCsv } from "../lib/importer";
import { ColumnMapping } from "../lib/import-mapping";

function parseArgs(argv: string[]): { inputPath?: string; mappingPath?: string } {
  const args = [...argv];
  let inputPath: string | undefined;
  let mappingPath: string | undefined;

  while (args.length > 0) {
    const arg = args.shift();
    if (!arg) break;

    if (arg === "--mapping") {
      mappingPath = args.shift();
      continue;
    }

    if (!inputPath) {
      inputPath = arg;
    }
  }

  return { inputPath, mappingPath };
}

async function main() {
  const { inputPath, mappingPath } = parseArgs(process.argv.slice(2));

  if (!inputPath) {
    console.error("Usage: npm run import-csv -- ./path/to/file.csv [--mapping ./path/to/mapping.json]");
    process.exit(1);
  }

  const absoluteInputPath = path.resolve(process.cwd(), inputPath);
  const csvContent = await fs.readFile(absoluteInputPath, "utf-8");

  let mapping: ColumnMapping | undefined;
  if (mappingPath) {
    const absoluteMappingPath = path.resolve(process.cwd(), mappingPath);
    const content = await fs.readFile(absoluteMappingPath, "utf-8");
    mapping = JSON.parse(content) as ColumnMapping;
  }

  const result = await importAndEnrichCsv(prisma, csvContent, mapping);

  const outputPath = absoluteInputPath.replace(/\.csv$/i, "") + ".enriched.csv";
  await fs.writeFile(outputPath, result.enrichedCsv, "utf-8");

  console.log("[import-csv] Termine.");
  console.log(result);
  console.log(`[import-csv] CSV enrichi ecrit: ${outputPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
