import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const { Client } = pg;

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  try {
    const envPath = join(process.cwd(), '.env.local');
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('DATABASE_URL=')) {
        return trimmed.slice('DATABASE_URL='.length).trim();
      }
    }
  } catch {
    /* fall through */
  }

  throw new Error('DATABASE_URL not found. Set it in .env.local or the environment.');
}

async function runFile(client, relativePath) {
  const path = join(process.cwd(), relativePath);
  const sql = readFileSync(path, 'utf8');
  console.log(`→ ${relativePath}`);
  await client.query(sql);
}

async function main() {
  const connectionString = loadDatabaseUrl();
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: true } });
  await client.connect();
  console.log('Connected to Postgres');

  try {
    await runFile(client, 'db/postgres/001_schema.sql');
    await runFile(client, 'db/postgres/003_triggers.sql');
    await runFile(client, 'db/postgres/002_indexes.sql');

    const tables = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    console.log(`\nDone. ${tables.rows.length} tables:`);
    for (const row of tables.rows) console.log(`  • ${row.tablename}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
