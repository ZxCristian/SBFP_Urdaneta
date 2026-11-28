# Operations runbook

The app is a TanStack Start server on Vercel with a Supabase Postgres database.
These are the production steps that are not obvious from the code.

## Deploys

**Production is deployed manually, on purpose.** The Vercel project is not
connected to GitHub auto-deploy: merging to `main` updates the repository and
runs CI, and the release is then published from Vercel (`vercel --prod` or
Dashboard → Deployments → Redeploy).

That means a push alone does not change the live site. Deploy only after CI
(`.github/workflows/ci.yml`) is green on the commit you intend to release, and
verify `/robots.txt` plus a signed-in page afterwards to confirm the new build
is the one serving traffic.

## Database migrations

Deploys never write to the database. Schema changes live in `migrations/*.sql`
and are applied by:

- **CI** (`.github/workflows/migrate.yml`) after a migration merges to `main`, or
  manually via _Actions → Migrate database → Run workflow_; or
- a machine with the connection string: `npm run db:migrate`.

The workflow needs a repository secret named `SUPABASE_DB_URL` (Settings →
Secrets and variables → Actions). Without it the job prints a notice and exits
successfully. `scripts/pg-connection.mjs` already trusts Supabase's bundled root
CAs, so no certificate env var is required.

## Removing the demo district

A database filled by `npm run seed` marks its learner rows with
`encoded_by = 'sample-data'`. To switch a production database from the demo to
real records without dropping schools or accounts:

```bash
npm run db:clear-sample                 # dry run: counts per school year
npm run db:clear-sample -- --confirm    # delete only the sample-marked rows
```

Take a Supabase backup first: the delete is permanent (the app's Trash only
covers soft-deleted rows).

## Error reporting

Server failures and browser crashes are written as one structured JSON line
(`[error] {...}`) to the function logs. Set `ERROR_WEBHOOK_URL` to a Slack or
Discord incoming webhook to also receive them there — the payload includes both
`text` (Slack) and `content` (Discord).

## Keep-alive

`/api/keep-alive` and `/api/keep-alive-daily` keep the free Supabase project from
being paused. They are open when `KEEPALIVE_SECRET` is unset. Set it in
production and call the routes with `?key=<secret>` from the external timer.
`/api/keep-alive-daily` is the one that proves a write reached the database.

## Access and data protection

- **Rotate the Division Office password** if it has ever been shared. Recovery
  mail is configured; use “Forgot password” on the console sign-in.
- There is **no second factor** on the Division Office account yet, and it can
  read every learner record. If that is a hard requirement, put the console
  behind an identity-aware proxy or add TOTP before wider rollout.
- Account and record changes are attributed (`encoded_by`, `deleted_by`,
  feedback author), but there is no separate admin audit log yet.
- Confirm Supabase **backups / point-in-time recovery** are enabled and test one
  restore. The database holds names, birth dates and measurements of minors.
- The portal is `Disallow: /` in `robots.txt`; keep it that way.
