/**
 * Invisible daily keep-alive writer for the Supabase database.
 *
 * One authenticated DB write per day that records a timestamp so the project is
 * less likely to be scored as inactive by Supabase's free-plan auto-pause. It
 * writes to a small app table (`sbfp_keepalive`) that is part of the migration
 * schema, never rendered in the app, and never read by the School Portal or
 * Division Console UI.
 *
 * There is no in-app scheduler here: TanStack Start + Vercel serverless have no
 * long-lived cron. This module exists so an external timer (Vercel Cron, a
 * worker, or a one-line curl loop) can call it once a day.
 */

import type { Sql } from "./db.ts";

/**
 * Touch the shared row for today's keep-alive. Idempotent: one row per kind.
 *
 * `getSql` is imported lazily so the writer can be unit-tested with an injected
 * client without pulling in `db.ts`'s server bootstrap (which uses Vite-only
 * `import.meta.glob`).
 */
export async function keepAliveWrite(sql?: Sql): Promise<boolean> {
  const db = sql ?? (await (await import("./db.ts")).getSql());
  // The table name is a constant, so it is written inline: interpolating it
  // would make the driver send it as a bound parameter (`insert into $1`).
  await db`
    insert into sbfp_keepalive (kind, ts)
    values ('daily', now())
    on conflict (kind) do update
    set ts = now()
  `;
  return true;
}

/**
 * Optional shared-secret gate for the keep-alive endpoints.
 *
 * When `KEEPALIVE_SECRET` is set, callers must present it as `?key=` or
 * `x-keepalive-key`; when it is unset the endpoints are open, because all an
 * anonymous caller can do is re-stamp one row or re-read a version string.
 *
 * Do not gate these routes with Better Auth's `auth.handler`: that router only
 * knows its own `/api/auth/*` paths and answers 404 for anything else, so the
 * handler would never run.
 */
export function keepAliveAuthorized(request: Request): boolean {
  const expected = process.env.KEEPALIVE_SECRET?.trim();
  if (!expected) return true;
  const presented =
    request.headers.get("x-keepalive-key") ??
    new URL(request.url).searchParams.get("key") ??
    "";
  return presented === expected;
}

/** Read the last written timestamp (used by tests; no app surface reads it). */
export async function lastKeepAlive(sql: Sql): Promise<string | null> {
  const rows = await sql<{ ts: string | null }>`
    select ts from sbfp_keepalive where kind = 'daily'
  `;
  return rows[0]?.ts ?? null;
}
