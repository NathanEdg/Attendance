import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: PostgresJsDatabase<typeof schema> | null = null;

function getDb(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Ensure it's provided at runtime (CI/hosting) or via a .env file locally."
    );
  }

  const client = postgres(connectionString);
  _db = drizzle(client, { schema });
  return _db;
}

// Preserve the same API shape: `db.select()...` etc., while deferring init until first use.
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, _receiver) {
    const real = getDb() as any;
    return Reflect.get(real, prop);
  },
}) as PostgresJsDatabase<typeof schema>;

export * from "./schema";
