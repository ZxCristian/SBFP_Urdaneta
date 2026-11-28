/**
 * Lightweight keep-alive endpoint for the Supabase database.
 *
 * A tiny DB touch so the project is not scored as inactive by Supabase's
 * free-plan auto-pause. It runs one `select 1` — no writes, no side effects, no
 * discovery of which emails hold accounts — and reports the backend it used.
 *
 * There is no scheduled background task here: Vercel-serverless plus TanStack
 * Start have no long-lived cron. The app is the "something that touches the
 * DB" Supabase expects, so the Division Console poll (`fetchDataVersion`) and
 * the School Portal's same poll already count as activity once real users are
 * signed in. This endpoint exists for an external keep-alive monitor or an
 * operator to run on a timer when the app has no signed-in users.
 *
 * `/api/keep-alive-daily` is the stronger variant: it also records a timestamp
 * in `sbfp_keepalive`, which proves a write reached the database.
 */
import { createFileRoute } from '@tanstack/react-router';
import { dbSource, getSql } from '@/lib/db';
import { keepAliveAuthorized } from '@/lib/sbfp-keepalive';

export const Route = createFileRoute('/api/keep-alive')({
  server: {
    handlers: {
      GET: async ({ request }) => handleKeepAlive(request),
      POST: async ({ request }) => handleKeepAlive(request),
    },
  },
});

async function handleKeepAlive(request: Request) {
  // Never gate these routes with `auth.handler`: it only knows Better Auth's
  // own `/api/auth/*` paths and answers 404 for everything else.
  if (!keepAliveAuthorized(request)) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  try {
    const sql = await getSql();
    const rows = await sql<{ one: number }>`select 1 as one`;
    return new Response(JSON.stringify({
      ok: true,
      touched: rows[0]?.one === 1 ? new Date().toISOString() : null,
      backend: dbSource,
      ts: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  } catch (err) {
    console.error('[keep-alive] db touch failed:', err);
    return new Response(JSON.stringify({
      ok: false,
      error:
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'db touch failed',
    }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
}
