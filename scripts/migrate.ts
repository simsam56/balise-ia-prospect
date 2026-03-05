import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

function resolveDbPath(databaseUrl: string): string {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Only sqlite file: URLs are supported in this local setup.");
  }
  const relative = databaseUrl.replace(/^file:/, "");
  return path.resolve(process.cwd(), relative.replace(/^\.\//, ""));
}

async function main() {
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
  const dbPath = resolveDbPath(dbUrl);
  const sqlPath = path.resolve(process.cwd(), "prisma", "migrations", "0001_init", "migration.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);

  try {
    db.pragma("foreign_keys = ON");
    db.exec(sql);
    console.log(`[db:migrate] Schema applied on ${dbPath}`);
  } finally {
    db.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
