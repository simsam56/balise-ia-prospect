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
  const migrationsDir = path.resolve(process.cwd(), "prisma", "migrations");

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);

  try {
    db.pragma("foreign_keys = ON");
    db.exec(`
      CREATE TABLE IF NOT EXISTS "_Migrations" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const appliedRows = db.prepare(`SELECT id FROM "_Migrations"`).all() as Array<{ id: string }>;
    const applied = new Set(appliedRows.map((row) => row.id));

    const migrationIds = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    for (const migrationId of migrationIds) {
      if (applied.has(migrationId)) continue;

      const sqlPath = path.join(migrationsDir, migrationId, "migration.sql");
      if (!fs.existsSync(sqlPath)) continue;

      const sql = fs.readFileSync(sqlPath, "utf-8");
      db.exec("BEGIN");
      try {
        db.exec(sql);
        db.prepare(`INSERT INTO "_Migrations" ("id") VALUES (?)`).run(migrationId);
        db.exec("COMMIT");
        console.log(`[db:migrate] Applied ${migrationId}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("duplicate column name")) {
          db.exec("ROLLBACK");
          db.prepare(`INSERT INTO "_Migrations" ("id") VALUES (?)`).run(migrationId);
          console.log(`[db:migrate] Marked ${migrationId} as already applied (${message})`);
        } else {
          db.exec("ROLLBACK");
          throw error;
        }
      }
    }

    console.log(`[db:migrate] Schema synced on ${dbPath}`);
  } finally {
    db.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
