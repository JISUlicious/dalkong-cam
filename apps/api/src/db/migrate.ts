import path from "node:path";
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { config } from "../config.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(here, "migrations");

async function main() {
  const sql = postgres(config.DATABASE_URL, { max: 1 });
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder });
  await sql.end();
  // eslint-disable-next-line no-console
  console.log("Migrations applied from", migrationsFolder);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
