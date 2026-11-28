#!/usr/bin/env node
/**
 * Remove the demo district from a configured Postgres database.
 *
 * `npm run seed` marks every row it creates with `encoded_by = 'sample-data'`
 * (see `SAMPLE_ENCODED_BY` in `src/lib/sbfp-seed.ts`). This script deletes only
 * those rows — never a row encoded by a school account — so a live division
 * database can be switched from the demo district to real records without
 * dropping the schema, schools or accounts.
 *
 * Safe by default: with no flag it prints what it would delete and changes
 * nothing. Pass `--confirm` to actually delete:
 *
 *   npm run db:clear-sample            # dry run
 *   npm run db:clear-sample -- --confirm
 *
 * Take a database backup first. Deleting is permanent (the app's Trash keeps
 * records that are soft-deleted, not rows removed here).
 *
 * With no `SUPABASE_DB_URL` / `DATABASE_URL` (the in-memory preview) there is
 * nothing to do; the preview's sample data disappears when it restarts.
 */
import pg from "pg";
import { databaseUrlFromEnv, pgPoolOptions } from "./pg-connection.mjs";

const SAMPLE_ENCODED_BY = "sample-data";
const confirm = process.argv.includes("--confirm");

const databaseUrl = databaseUrlFromEnv(process.env);
if (!databaseUrl) {
  console.log("[clear-sample] No Postgres database is configured; nothing to do.");
  console.log("[clear-sample] The live preview uses the embedded database and resets on restart.");
  process.exit(0);
}

const pool = new pg.Pool(pgPoolOptions(databaseUrl, { max: 1 }));
try {
  const summary = await pool.query(
    `select sy,
            count(*)::int as total,
            count(*) filter (where encoded_by = $1)::int as sample
       from sbfp_records
      group by sy
      order by sy`,
    [SAMPLE_ENCODED_BY],
  );
  if (summary.rows.length === 0) {
    console.log("[clear-sample] No learner records exist; nothing to do.");
    process.exit(0);
  }

  const total = summary.rows.reduce((n, row) => n + row.total, 0);
  const sample = summary.rows.reduce((n, row) => n + row.sample, 0);
  const real = total - sample;
  for (const row of summary.rows) {
    console.log(
      `[clear-sample] ${row.sy}: ${row.sample} sample, ${row.total - row.sample} other`,
    );
  }
  console.log(`[clear-sample] ${sample} sample rows of ${total} total.`);

  if (sample === 0) {
    console.log("[clear-sample] No rows carry the sample marker; nothing to delete.");
    process.exit(0);
  }
  if (!confirm) {
    console.log("[clear-sample] Dry run only. Re-run with -- --confirm to delete the sample rows.");
    process.exit(0);
  }
  if (real > 0) {
    console.log(
      `[clear-sample] Keeping ${real} row(s) encoded outside the demo seed.`,
    );
  }

  const deleted = await pool.query(
    `delete from sbfp_records where encoded_by = $1 returning id`,
    [SAMPLE_ENCODED_BY],
  );
  console.log(`[clear-sample] Deleted ${deleted.rowCount} sample learner row(s).`);
  console.log("[clear-sample] Real records, schools, accounts and feedback were untouched.");
} finally {
  await pool.end();
}
