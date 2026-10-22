/**
 * SBFP accounts and the data the schools send up — the server-side half.
 *
 * Everything here is a plain function over the shared `Sql` client (see
 * `@/lib/db`), with no framework in sight: the server functions in
 * `@/lib/sbfp-api` are a thin translation of a **verified session** into the
 * `SbfpAccess` these functions take, and nothing else is allowed to decide who
 * may read or write a school's rows. That keeps the authorization rules in one
 * place — and lets the PGlite-backed test in `sbfp-accounts.test.ts` exercise
 * them for real, against the same SQL the app runs.
 *
 * Who owns what:
 *  - `sbfp_accounts`        — the Division Office's own account, plus one
 *                             account per school (the email and role), issued
 *                             from `/`. This is the only authorization source.
 *  - `sbfp_school_profiles` — the school information block the SBFP forms print,
 *                             owned by the school so it survives a change of
 *                             teacher or of account.
 *  - `sbfp_records`         — learner records encoded through the Teacher Portal.
 *  - `sbfp_feedback`        — what a school sent up, with the Division Office's
 *                             reply stored on the same row.
 *
 * A teacher may only ever touch her own school; the Division Office may touch
 * any. Neither is decided by anything the browser sends — see `SbfpAccess`.
 */
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { Sql } from "./db.ts";
import {
  isValidEmail,
  normalizeEmail,
  passwordProblem,
} from "./sbfp-credentials.ts";
import type {
  FeedbackCategory,
  FeedbackStatus,
  SchoolFeedback,
  SchoolFormDetails,
  Student,
} from "@/lib/sbfp-shared";

export type AccountRole = "admin" | "teacher";
export type AccountStatus = "active" | "disabled";

/** A row of `sbfp_accounts` joined with the school's form header. */
export interface AccountRow {
  email: string;
  role: AccountRole;
  fullName: string;
  position: string;
  contact: string;
  /** The school this teacher account is for; null for the Division Office. */
  schoolId: string | null;
  status: AccountStatus;
  /** True while the password is still the one the Division Office generated. */
  tempPassword: boolean;
  createdAt: string;
  updatedAt: string;
  /** The school's SBFP form header (empty strings until someone fills it in). */
  profile: SchoolFormDetails;
}

/** A learner record may hold nothing the form fields cannot: all strings. */
export type RecordInput = Omit<Student, "schoolId">;

export type AccountErrorCode =
  | "invalid_email"
  | "weak_password"
  | "email_taken"
  | "school_taken"
  | "not_found"
  | "last_admin"
  | "reset_token_invalid"
  | "forbidden";

/** A refusal the UI can explain. Never carries SQL or a stack. */
export class AccountError extends Error {
  readonly code: AccountErrorCode;
  constructor(code: AccountErrorCode, message: string) {
    super(message);
    this.name = "AccountError";
    this.code = code;
  }
}

// ── Access ────────────────────────────────────────────────────────────────────

/**
 * What a verified session may do. Built ONLY from the server-resolved session
 * email (`@/lib/auth/verify.server`) — never from a client-supplied id.
 */
export interface SbfpAccess {
  email: string;
  account: AccountRow;
  /** `"all"` for the Division Office, otherwise the caller's one school. */
  scope: "all" | string[];
}

export function isAdmin(access: SbfpAccess): boolean {
  return access.account.role === "admin";
}

/** Every school id this caller may read or write. */
export function scopeIds(access: SbfpAccess): string[] {
  return access.scope === "all" ? [] : access.scope;
}

/** Throw unless the caller may write `schoolId`. */
export function assertCanWriteSchool(access: SbfpAccess, schoolId: string): void {
  if (access.scope === "all") return;
  if (!access.scope.includes(schoolId)) {
    throw new AccountError(
      "forbidden",
      "That school is not on your account. Ask the Division Office for access.",
    );
  }
}

/** Throw unless the caller may write `id`, resolving the row's real school. */
export async function assertCanWriteRecord(
  sql: Sql,
  access: SbfpAccess,
  id: string,
): Promise<void> {
  if (access.scope === "all") return;
  const rows = await sql<{ school_id: string }>`
    select school_id from sbfp_records where id = ${id}
  `;
  const schoolId = rows[0]?.school_id;
  if (schoolId) assertCanWriteSchool(access, schoolId);
}

export async function assertCanWriteFeedback(
  sql: Sql,
  access: SbfpAccess,
  id: string,
): Promise<void> {
  if (access.scope === "all") return;
  const rows = await sql<{ school_id: string }>`
    select school_id from sbfp_feedback where id = ${id}
  `;
  const schoolId = rows[0]?.school_id;
  if (schoolId) assertCanWriteSchool(access, schoolId);
}

// ── Row mapping ───────────────────────────────────────────────────────────────

interface AccountDbRow {
  email: string;
  role: string;
  full_name: string;
  position: string;
  contact: string;
  school_id: string | null;
  status: string;
  temp_password: boolean;
  created_at: string | Date;
  updated_at: string | Date;
  division: string | null;
  city_municipality_barangay: string | null;
  school_id_number: string | null;
  principal: string | null;
  focal_person: string | null;
  date_start_feeding: string | null;
  last_mile_school: string | null;
  record_count?: number | string | null;
  feedback_count?: number | string | null;
}

export interface AccountListRow extends AccountRow {
  recordCount: number;
  feedbackCount: number;
}

/** timestamptz arrives as a Date on pg and as an ISO string on PGLite. */
function isoOf(value: string | Date | null | undefined): string {
  if (!value) return "";
  return value instanceof Date ? value.toISOString() : String(value);
}

function textOf(value: string | null | undefined): string {
  return value ?? "";
}

function toAccount(row: AccountDbRow): AccountRow {
  return {
    email: row.email,
    role: row.role === "admin" ? "admin" : "teacher",
    fullName: textOf(row.full_name),
    position: textOf(row.position),
    contact: textOf(row.contact),
    schoolId: row.school_id ?? null,
    status: row.status === "disabled" ? "disabled" : "active",
    tempPassword: Boolean(row.temp_password),
    createdAt: isoOf(row.created_at),
    updatedAt: isoOf(row.updated_at),
    profile: {
      division: textOf(row.division) || "Urdaneta City",
      cityMunicipalityBarangay: textOf(row.city_municipality_barangay),
      schoolIdNumber: textOf(row.school_id_number),
      principal: textOf(row.principal),
      focalPerson: textOf(row.focal_person),
      dateStartFeeding: textOf(row.date_start_feeding),
      lastMileSchool: textOf(row.last_mile_school) as SchoolFormDetails["lastMileSchool"],
    },
  };
}

/**
 * The one SELECT shape for an account: the row, its school's form header, and
 * how much the school has sent up (the accounts panel shows both counts).
 */
const ACCOUNT_SELECT = `
  select a.email, a.role, a.full_name, a.position, a.contact, a.school_id,
         a.status, a.temp_password, a.created_at, a.updated_at,
         p.division, p.city_municipality_barangay, p.school_id_number,
         p.principal, p.focal_person, p.date_start_feeding, p.last_mile_school,
         (select count(*) from sbfp_records r where r.school_id = a.school_id) as record_count,
         (select count(*) from sbfp_feedback f where f.school_id = a.school_id) as feedback_count
  from sbfp_accounts a
  left join sbfp_school_profiles p on p.school_id = a.school_id
`;

// ── Reading accounts ──────────────────────────────────────────────────────────

/** The account an email holds, or null. Matching is case-insensitive. */
export async function findAccountByEmail(
  sql: Sql,
  email: string,
): Promise<AccountRow | null> {
  const rows = await sql.query<AccountDbRow>(
    `${ACCOUNT_SELECT} where lower(a.email) = $1`,
    [normalizeEmail(email)],
  );
  return rows[0] ? toAccount(rows[0]) : null;
}

/** Every account, newest first — the Division Office's accounts panel. */
export async function listAccounts(sql: Sql): Promise<AccountListRow[]> {
  const rows = await sql.query<AccountDbRow>(
    `${ACCOUNT_SELECT} order by a.role desc, a.school_id nulls first, a.email`,
  );
  return rows.map((row) => {
    const account = toAccount(row);
    return {
      ...account,
      recordCount: Number(row.record_count ?? 0),
      feedbackCount: Number(row.feedback_count ?? 0),
    };
  });
}

/** True once the Division Office has claimed its own account. */
export async function hasAdminAccount(sql: Sql): Promise<boolean> {
  const rows = await sql<{ n: number | string }>`
    select count(*) as n from sbfp_accounts where role = 'admin'
  `;
  return Number(rows[0]?.n ?? 0) > 0;
}

export async function countAdmins(sql: Sql): Promise<number> {
  const rows = await sql<{ n: number | string }>`
    select count(*) as n from sbfp_accounts where role = 'admin' and status = 'active'
  `;
  return Number(rows[0]?.n ?? 0);
}

/** The fixed Division Office sign-in the live preview is seeded with. */
export const DEMO_ADMIN_EMAIL = "test@gmail.com";
export const DEMO_ADMIN_PASSWORD = "qwertyuiop";

/**
 * Seed the preview's Division Office sign-in.
 *
 * The preview runs on the embedded PGLite database, which lives in memory and
 * is wiped with the process — so an account created by hand through the
 * first-run setup card is gone after every restart. On a fresh preview an empty
 * `sbfp_accounts` therefore means "the door has just opened", and the fixed
 * login above is created so the console can be entered by typing two known
 * values.
 *
 * **Only the preview.** A deployed database keeps the first-run card, where the
 * Division Office chooses its own email and password. Those two values are in
 * the source, and this account can read every school's learner records and
 * issue or remove any school's sign-in — a published password for it on a public
 * site would hand the whole district's data to anyone who read the repository.
 *
 * Idempotent, and never overwrites an account that already exists: a preview
 * where the Division Office created its own account keeps it.
 */
export async function ensureDemoAdmin(
  sql: Sql,
  options: { preview: boolean },
): Promise<boolean> {
  if (!options.preview) return false;
  if (await hasAdminAccount(sql)) return false;
  await createAccount(sql, {
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_ADMIN_PASSWORD,
    role: "admin",
    fullName: "Division SBFP Coordinator",
    tempPassword: false,
  });
  return true;
}

/**
 * The caller's access, resolved from the verified session email. A signed-in
 * visitor whose email holds no account gets `null` — read as "no access yet",
 * never as "the Division Office".
 *
 * A disabled account still resolves (so the UI can say the account was put on
 * hold) but its scope is empty: every read and write of school data is refused.
 */
export async function resolveAccess(
  sql: Sql,
  email: string,
): Promise<SbfpAccess | null> {
  const account = await findAccountByEmail(sql, email);
  if (!account) return null;
  if (account.status !== "active") {
    return { email: account.email, account, scope: [] };
  }
  if (account.role === "admin") {
    return { email: account.email, account, scope: "all" };
  }
  if (!account.schoolId) {
    return { email: account.email, account, scope: [] };
  }
  return { email: account.email, account, scope: [account.schoolId] };
}

// ── Writing accounts ──────────────────────────────────────────────────────────

export interface CreateAccountInput {
  email: string;
  password: string;
  role: AccountRole;
  fullName?: string;
  position?: string;
  contact?: string;
  schoolId?: string | null;
  /** The Division Office's own account is not a temporary password. */
  tempPassword?: boolean;
}

/**
 * Create the identity (a Better Auth email/password user) and the authorization
 * row together.
 *
 * The credentials are written directly rather than through Better Auth's
 * sign-up endpoint: that endpoint also signs the *current* request in as the new
 * user, which would swap the Division Office's own session for the teacher's the
 * moment she issues an account. The hash is Better Auth's own
 * (`better-auth/crypto`), so the account signs in through `/api/auth/sign-in/email`
 * exactly like any other.
 */
export async function createAccount(
  sql: Sql,
  input: CreateAccountInput,
): Promise<AccountRow> {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    throw new AccountError("invalid_email", "That does not look like an email address.");
  }
  const problem = passwordProblem(input.password);
  if (problem) throw new AccountError("weak_password", problem);

  const schoolId = input.role === "teacher" ? (input.schoolId ?? "").trim() : null;
  if (input.role === "teacher" && !schoolId) {
    throw new AccountError("not_found", "Choose the school this account is for.");
  }

  const existing = await findAccountByEmail(sql, email);
  if (existing) {
    throw new AccountError("email_taken", `${email} already has an account.`);
  }
  if (schoolId) {
    const taken = await sql<{ email: string }>`
      select email from sbfp_accounts where school_id = ${schoolId} and role = 'teacher'
    `;
    if (taken[0]) {
      throw new AccountError(
        "school_taken",
        `That school already has an account (${taken[0].email}). Edit or remove it first.`,
      );
    }
  }

  const password = await hashPassword(input.password);
  const userId = randomUUID();
  const name = input.fullName?.trim() || email;
  await sql`
    insert into "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
    values (${userId}, ${name}, ${email}, true, now(), now())
  `;
  try {
    await sql`
      insert into "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
      values (${randomUUID()}, ${userId}, 'credential', ${userId}, ${password}, now(), now())
    `;
    await sql`
      insert into sbfp_accounts
        (email, role, full_name, position, contact, school_id, status, temp_password, created_at, updated_at)
      values (
        ${email}, ${input.role}, ${input.fullName?.trim() ?? ""}, ${input.position?.trim() ?? ""},
        ${input.contact?.trim() ?? ""}, ${schoolId},
        'active', ${input.tempPassword ?? input.role === "teacher"}, now(), now()
      )
    `;
  } catch (err) {
    // Never leave an identity behind that nothing can authorize.
    await sql`delete from "user" where "id" = ${userId}`.catch(() => undefined);
    throw err;
  }

  const created = await findAccountByEmail(sql, email);
  if (!created) throw new AccountError("not_found", "The account could not be created.");
  return created;
}

export interface AccountPatch {
  fullName?: string;
  position?: string;
  contact?: string;
  schoolId?: string | null;
  status?: AccountStatus;
}

/** Edit a teacher account: who holds it, which school, and whether it is live. */
export async function updateAccount(
  sql: Sql,
  email: string,
  patch: AccountPatch,
): Promise<AccountRow> {
  const current = await findAccountByEmail(sql, email);
  if (!current) throw new AccountError("not_found", "That account no longer exists.");

  const schoolId =
    patch.schoolId === undefined ? current.schoolId : (patch.schoolId ?? null);
  if (schoolId && schoolId !== current.schoolId) {
    const taken = await sql<{ email: string }>`
      select email from sbfp_accounts where school_id = ${schoolId} and role = 'teacher'
    `;
    if (taken[0]) {
      throw new AccountError(
        "school_taken",
        `That school already has an account (${taken[0].email}).`,
      );
    }
  }
  if (patch.status === "disabled" && current.role === "admin") {
    if ((await countAdmins(sql)) <= 1) {
      throw new AccountError(
        "last_admin",
        "This is the only Division Office account — create another before disabling it.",
      );
    }
  }

  await sql`
    update sbfp_accounts set
      full_name = ${patch.fullName === undefined ? current.fullName : patch.fullName.trim()},
      position = ${patch.position === undefined ? current.position : patch.position.trim()},
      contact = ${patch.contact === undefined ? current.contact : patch.contact.trim()},
      school_id = ${schoolId},
      status = ${patch.status ?? current.status},
      updated_at = now()
    where lower(email) = ${normalizeEmail(email)}
  `;
  const updated = await findAccountByEmail(sql, email);
  if (!updated) throw new AccountError("not_found", "That account no longer exists.");
  return updated;
}

/**
 * The credential behind an email: the password hash to verify against, and
 * whether there is one at all. `null` means the email holds no identity AND no
 * SBFP account.
 *
 * An account can legitimately exist without a password — one issued to a visitor
 * who already signs in through the Grok gate never needs one until the Division
 * Office (or the holder) sets it.
 */
export async function credentialState(
  sql: Sql,
  email: string,
): Promise<{ hasPassword: boolean; hash: string; userId: string | null } | null> {
  const normalized = normalizeEmail(email);
  const users = await sql<{ id: string; password: string | null }>`
    select u."id" as id, ac."password" as password
    from "user" u
    left join "account" ac on ac."userId" = u."id" and ac."providerId" = 'credential'
    where lower(u."email") = ${normalized}
  `;
  const user = users[0];
  if (user) {
    const hash = textOf(user.password);
    return { hasPassword: hash.length > 0, hash, userId: user.id };
  }
  const account = await findAccountByEmail(sql, normalized);
  return account ? { hasPassword: false, hash: "", userId: null } : null;
}

/**
 * Whether changing one's own password must prove the current one.
 *
 * The portal asks for the current password only when the holder is not still on
 * the temporary one the Division Office handed out (`needsCurrent` in
 * `teacher-app.tsx`). This is the same rule on the server, encoded once so the
 * two sides cannot drift apart.
 *
 * It matters because a temporary password *is* a password: a rule that demanded
 * proof whenever `hasPassword` is true reads correctly but refuses the one
 * action a newly-issued account is told to take.
 */
export function needsCurrentPassword(state: {
  hasPassword: boolean;
  tempPassword: boolean;
}): boolean {
  return state.hasPassword && !state.tempPassword;
}

/**
 * Set a new password for an account (the "Reset password" action) and flag it as
 * temporary, so the portal prompts the teacher to choose her own.
 *
 * The identity and the credential are created when they are missing — that is
 * what lets an account that only ever arrived through the Grok gate be given a
 * password as well.
 */
export async function resetPassword(
  sql: Sql,
  email: string,
  password: string,
): Promise<AccountRow> {
  const problem = passwordProblem(password);
  if (problem) throw new AccountError("weak_password", problem);
  const account = await findAccountByEmail(sql, email);
  if (!account) throw new AccountError("not_found", "That account no longer exists.");

  const state = await credentialState(sql, email);
  let userId = state?.userId ?? null;
  if (!userId) {
    userId = randomUUID();
    await sql`
      insert into "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
      values (${userId}, ${account.fullName || account.email}, ${account.email}, true, now(), now())
    `;
  }
  const hash = await hashPassword(password);
  await sql`
    update "account" set "password" = ${hash}, "updatedAt" = now()
    where "userId" = ${userId} and "providerId" = 'credential'
  `;
  const hasCredential = await sql<{ id: string }>`
    select "id" from "account" where "userId" = ${userId} and "providerId" = 'credential'
  `;
  if (!hasCredential[0]) {
    await sql`
      insert into "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
      values (${randomUUID()}, ${userId}, 'credential', ${userId}, ${hash}, now(), now())
    `;
  }
  await sql`
    update sbfp_accounts set temp_password = true, updated_at = now()
    where lower(email) = ${normalizeEmail(email)}
  `;
  const after = await findAccountByEmail(sql, email);
  if (!after) throw new AccountError("not_found", "That account no longer exists.");
  return after;
}

/** Change one's own password (the portal's Account card). */
export async function changeOwnPassword(
  sql: Sql,
  email: string,
  password: string,
): Promise<void> {
  const problem = passwordProblem(password);
  if (problem) throw new AccountError("weak_password", problem);
  await resetPassword(sql, email, password);
  await sql`
    update sbfp_accounts set temp_password = false where lower(email) = ${normalizeEmail(email)}
  `;
}

// ── Emailed password reset for the Division Office account ───────────────────

/** How long an emailed reset link stays usable. */
export const RESET_LINK_MINUTES = 30;

/** One request per minute: repeat clicks must not send a pile of email. */
const RESET_COOLDOWN_SECONDS = 60;

/**
 * Hash of the token that goes in the email. The token is 256 bits from the OS
 * CSPRNG, so a fast hash is enough — and the token itself never reaches the
 * database, so a database read cannot mint a link.
 */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Mint a reset token for the Division Office account, or null when the address
 * is not an active admin or a link was requested less than a minute ago.
 *
 * Null is deliberately the same answer for "no such account" and "too soon" —
 * the sign-in screen shows the same "if that address has the account" message
 * either way, so this endpoint cannot be used to discover the admin's email.
 * Asking again replaces the previous token, which invalidates the older link.
 */
export async function createPasswordReset(
  sql: Sql,
  email: string,
): Promise<{ email: string; token: string; expiresAt: string } | null> {
  const normalized = normalizeEmail(email);
  const admins = await sql<{ email: string }>`
    select email from sbfp_accounts
    where lower(email) = ${normalized} and role = 'admin' and status = 'active'
  `;
  const account = admins[0];
  if (!account) return null;

  const recent = await sql<{ recent: boolean }>`
    select (requested_at > now() - interval '60 seconds') as recent
    from sbfp_admin_password_resets
    where lower(email) = ${normalized}
  `;
  if (recent[0]?.recent) return null;

  // Expired rows are dead weight; clear them as we go.
  await sql`delete from sbfp_admin_password_resets where expires_at < now()`;

  const token = randomBytes(32).toString("base64url");
  const rows = await sql<{ expires_at: string | Date }>`
    insert into sbfp_admin_password_resets (email, token_hash, expires_at, requested_at)
    values (${account.email}, ${hashResetToken(token)}, now() + interval '30 minutes', now())
    on conflict (email) do update set
      token_hash = excluded.token_hash,
      expires_at = excluded.expires_at,
      requested_at = now()
    returning expires_at
  `;
  return { email: account.email, token, expiresAt: isoOf(rows[0]?.expires_at) };
}

/**
 * Set a new Division Office password from an emailed token. No session is
 * involved — this is the locked-out door.
 *
 * The password is validated before the token is consumed, the row is deleted as
 * it is read (so the link cannot be replayed), and the same refusal covers a
 * malformed, expired and already-used token.
 */
export async function resetPasswordWithToken(
  sql: Sql,
  token: string,
  password: string,
): Promise<string> {
  const problem = passwordProblem(password);
  if (problem) throw new AccountError("weak_password", problem);

  const consumed = await sql<{ email: string }>`
    delete from sbfp_admin_password_resets
    where token_hash = ${hashResetToken(token)} and expires_at > now()
    returning email
  `;
  const email = consumed[0]?.email;
  if (!email) {
    throw new AccountError(
      "reset_token_invalid",
      "That reset link is invalid or has expired. Request a new one.",
    );
  }

  const account = await findAccountByEmail(sql, email);
  if (!account || account.role !== "admin" || account.status !== "active") {
    throw new AccountError(
      "reset_token_invalid",
      "That reset link is invalid or has expired. Request a new one.",
    );
  }

  await resetPassword(sql, email, password);
  await sql`
    update sbfp_accounts set temp_password = false where lower(email) = ${normalizeEmail(email)}
  `;
  return email;
}

/**
 * First-run setup: make a signed-in visitor's own email the Division Office
 * account. Used behind the Grok gate, where the platform has already verified
 * that identity — so no password is typed, and none is needed until they choose
 * to set one.
 */
export async function claimAdminAccountForEmail(
  sql: Sql,
  email: string,
  fullName: string,
): Promise<AccountRow> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new AccountError("invalid_email", "That does not look like an email address.");
  }
  if (await hasAdminAccount(sql)) {
    throw new AccountError(
      "forbidden",
      "The Division Office account already exists. Sign in with it.",
    );
  }
  const existing = await findAccountByEmail(sql, normalized);
  if (existing) {
    throw new AccountError("email_taken", `${normalized} already has an account.`);
  }
  await sql`
    insert into sbfp_accounts
      (email, role, full_name, position, contact, school_id, status, temp_password, created_at, updated_at)
    values (${normalized}, 'admin', ${fullName.trim()}, '', '', null, 'active', false, now(), now())
  `;
  const created = await findAccountByEmail(sql, normalized);
  if (!created) throw new AccountError("not_found", "The account could not be created.");
  return created;
}

/**
 * Remove an account. The school's own work — its form header, learner records and
 * feedback — is deliberately kept, so a replacement account for the same school
 * picks the work up where it was left.
 */
export async function deleteAccount(sql: Sql, email: string): Promise<void> {
  const account = await findAccountByEmail(sql, email);
  if (!account) throw new AccountError("not_found", "That account no longer exists.");
  if (account.role === "admin" && (await countAdmins(sql)) <= 1) {
    throw new AccountError(
      "last_admin",
      "This is the only Division Office account — create another before removing it.",
    );
  }
  // Sessions and linked identities cascade with the identity row.
  await sql`delete from "user" where lower("email") = ${normalizeEmail(email)}`;
  await sql`delete from sbfp_accounts where lower(email) = ${normalizeEmail(email)}`;
}

// ── School form headers ───────────────────────────────────────────────────────

export async function getSchoolProfile(
  sql: Sql,
  schoolId: string,
): Promise<SchoolFormDetails | null> {
  const rows = await sql<{
    division: string;
    city_municipality_barangay: string;
    school_id_number: string;
    principal: string;
    focal_person: string;
    date_start_feeding: string;
    last_mile_school: string;
  }>`select * from sbfp_school_profiles where school_id = ${schoolId}`;
  const row = rows[0];
  if (!row) return null;
  return {
    division: row.division || "Urdaneta City",
    cityMunicipalityBarangay: row.city_municipality_barangay ?? "",
    schoolIdNumber: row.school_id_number ?? "",
    principal: row.principal ?? "",
    focalPerson: row.focal_person ?? "",
    dateStartFeeding: row.date_start_feeding ?? "",
    lastMileSchool: (row.last_mile_school ?? "") as SchoolFormDetails["lastMileSchool"],
  };
}

/** Upsert the school information block (either side of the app may edit it). */
export async function saveSchoolProfile(
  sql: Sql,
  schoolId: string,
  patch: Partial<SchoolFormDetails>,
  updatedBy?: string,
): Promise<void> {
  if (!schoolId) return;
  const current = await getSchoolProfile(sql, schoolId);
  const next: SchoolFormDetails = {
    division: patch.division ?? current?.division ?? "Urdaneta City",
    cityMunicipalityBarangay: patch.cityMunicipalityBarangay ?? current?.cityMunicipalityBarangay ?? "",
    schoolIdNumber: patch.schoolIdNumber ?? current?.schoolIdNumber ?? "",
    principal: patch.principal ?? current?.principal ?? "",
    focalPerson: patch.focalPerson ?? current?.focalPerson ?? "",
    dateStartFeeding: patch.dateStartFeeding ?? current?.dateStartFeeding ?? "",
    lastMileSchool: patch.lastMileSchool ?? current?.lastMileSchool ?? "",
  };
  await sql`
    insert into sbfp_school_profiles
      (school_id, division, city_municipality_barangay, school_id_number, principal,
       focal_person, date_start_feeding, last_mile_school, updated_at, updated_by)
    values (
      ${schoolId}, ${next.division}, ${next.cityMunicipalityBarangay}, ${next.schoolIdNumber},
      ${next.principal}, ${next.focalPerson}, ${next.dateStartFeeding}, ${next.lastMileSchool},
      now(), ${updatedBy ?? null}
    )
    on conflict (school_id) do update set
      division = excluded.division,
      city_municipality_barangay = excluded.city_municipality_barangay,
      school_id_number = excluded.school_id_number,
      principal = excluded.principal,
      focal_person = excluded.focal_person,
      date_start_feeding = excluded.date_start_feeding,
      last_mile_school = excluded.last_mile_school,
      updated_at = now(),
      updated_by = excluded.updated_by
  `;
}

// ── Learner records ───────────────────────────────────────────────────────────

interface RecordDbRow {
  id: string;
  school_id: string;
  period: string;
  sy: string;
  name: string;
  sex: string;
  grade_level: string;
  date_of_birth: string;
  date_of_weighing: string;
  age_years: string;
  age_months: string;
  weight: string;
  height: string;
  bmi: string;
  bmi_status: string;
  hfa_status: string;
  nutritional_status: string;
  classification_of_beneficiary: string;
  pregnant: string;
  has_young_children: string;
  dewormed: string;
  parent_consent_milk: string;
  four_ps: string;
  sbfp_previous_years: string;
}

const RECORD_COLUMNS = `
  id, school_id, period, sy, name, sex, grade_level, date_of_birth, date_of_weighing,
  age_years, age_months, weight, height, bmi, bmi_status, hfa_status, nutritional_status,
  classification_of_beneficiary, pregnant, has_young_children, dewormed,
  parent_consent_milk, four_ps, sbfp_previous_years
`;

function toStudent(row: RecordDbRow): Student {
  return {
    id: row.id,
    schoolId: row.school_id,
    period: row.period as Student["period"],
    sy: row.sy,
    name: row.name,
    sex: row.sex as Student["sex"],
    gradeLevel: row.grade_level as Student["gradeLevel"],
    dateOfBirth: row.date_of_birth,
    dateOfWeighing: row.date_of_weighing,
    ageYears: row.age_years,
    ageMonths: row.age_months,
    weight: row.weight,
    height: row.height,
    bmi: row.bmi,
    bmiStatus: row.bmi_status as Student["bmiStatus"],
    hfaStatus: row.hfa_status as Student["hfaStatus"],
    nutritionalStatus: row.nutritional_status,
    classificationOfBeneficiary:
      row.classification_of_beneficiary as Student["classificationOfBeneficiary"],
    pregnant: row.pregnant as Student["pregnant"],
    hasYoungChildren: row.has_young_children as Student["hasYoungChildren"],
    dewormed: row.dewormed as Student["dewormed"],
    parentConsentMilk: row.parent_consent_milk as Student["parentConsentMilk"],
    fourPs: row.four_ps as Student["fourPs"],
    sbfpPreviousYears: row.sbfp_previous_years as Student["sbfpPreviousYears"],
  };
}

/** Add or update one learner record for `schoolId` (already authorized). */
export async function upsertRecord(
  sql: Sql,
  schoolId: string,
  record: RecordInput,
  encodedBy?: string,
): Promise<void> {
  await sql`
    insert into sbfp_records (
      id, school_id, period, sy, name, sex, grade_level, date_of_birth, date_of_weighing,
      age_years, age_months, weight, height, bmi, bmi_status, hfa_status, nutritional_status,
      classification_of_beneficiary, pregnant, has_young_children, dewormed,
      parent_consent_milk, four_ps, sbfp_previous_years, encoded_by, created_at, updated_at)
    values (
      ${record.id}, ${schoolId}, ${record.period}, ${record.sy}, ${record.name}, ${record.sex},
      ${record.gradeLevel}, ${record.dateOfBirth}, ${record.dateOfWeighing}, ${record.ageYears},
      ${record.ageMonths}, ${record.weight}, ${record.height}, ${record.bmi},
      ${record.bmiStatus}, ${record.hfaStatus}, ${record.nutritionalStatus},
      ${record.classificationOfBeneficiary}, ${record.pregnant}, ${record.hasYoungChildren},
      ${record.dewormed}, ${record.parentConsentMilk}, ${record.fourPs},
      ${record.sbfpPreviousYears}, ${encodedBy ?? null}, now(), now()
    )
    on conflict (id) do update set
      period = excluded.period,
      sy = excluded.sy,
      name = excluded.name,
      sex = excluded.sex,
      grade_level = excluded.grade_level,
      date_of_birth = excluded.date_of_birth,
      date_of_weighing = excluded.date_of_weighing,
      age_years = excluded.age_years,
      age_months = excluded.age_months,
      weight = excluded.weight,
      height = excluded.height,
      bmi = excluded.bmi,
      bmi_status = excluded.bmi_status,
      hfa_status = excluded.hfa_status,
      nutritional_status = excluded.nutritional_status,
      classification_of_beneficiary = excluded.classification_of_beneficiary,
      pregnant = excluded.pregnant,
      has_young_children = excluded.has_young_children,
      dewormed = excluded.dewormed,
      parent_consent_milk = excluded.parent_consent_milk,
      four_ps = excluded.four_ps,
      sbfp_previous_years = excluded.sbfp_previous_years,
      updated_at = now()
    where sbfp_records.school_id = excluded.school_id
  `;
}

/** Remove one learner record. Refuses to cross schools. */
export async function deleteRecord(
  sql: Sql,
  id: string,
  schoolId?: string,
): Promise<void> {
  if (schoolId === undefined) {
    await sql`delete from sbfp_records where id = ${id}`;
    return;
  }
  await sql`delete from sbfp_records where id = ${id} and school_id = ${schoolId}`;
}

// ── Feedback ──────────────────────────────────────────────────────────────────

interface FeedbackDbRow {
  id: string;
  school_id: string;
  author: string;
  role: string;
  category: string;
  rating: number | string;
  message: string;
  created_at: string | Date;
  status: string;
  response: string;
  origin: string | null;
}

function toFeedback(row: FeedbackDbRow): SchoolFeedback {
  const response = textOf(row.response);
  return {
    id: row.id,
    schoolId: row.school_id,
    author: row.author,
    role: row.role,
    category: row.category as FeedbackCategory,
    rating: Number(row.rating ?? 0),
    message: row.message,
    createdAt: isoOf(row.created_at).slice(0, 10),
    status: row.status as FeedbackStatus,
    ...(response ? { response } : {}),
    ...(row.origin ? { origin: "Teacher Portal" as const } : {}),
  };
}

export async function insertFeedback(
  sql: Sql,
  schoolId: string,
  entry: Omit<SchoolFeedback, "schoolId">,
  sentBy?: string,
): Promise<void> {
  await sql`
    insert into sbfp_feedback
      (id, school_id, author, role, category, rating, message, created_at, status, response, origin, sent_by, updated_at)
    values (
      ${entry.id}, ${schoolId}, ${entry.author}, ${entry.role}, ${entry.category},
      ${entry.rating}, ${entry.message}, ${entry.createdAt}, ${entry.status},
      ${entry.response ?? ""}, ${entry.origin ?? null}, ${sentBy ?? null}, now()
    )
    on conflict (id) do update set
      status = excluded.status,
      response = excluded.response,
      updated_at = now()
  `;
}

/** The Division Office's side of the loop: acknowledge / resolve and reply. */
export async function updateFeedback(
  sql: Sql,
  id: string,
  patch: { status?: FeedbackStatus; response?: string },
): Promise<void> {
  // `coalesce` keeps whichever half the caller did not send: the feed updates a
  // status on its own, and the reply form writes only the response.
  await sql`
    update sbfp_feedback set
      status = coalesce(${patch.status ?? null}::text, status),
      response = coalesce(${patch.response ?? null}::text, response),
      updated_at = now()
    where id = ${id}
  `;
}

// ── Pull ──────────────────────────────────────────────────────────────────────

/** Everything a signed-in caller may read, in one round trip. */
export interface SbfpPayload {
  accounts: AccountListRow[];
  records: Student[];
  feedbacks: SchoolFeedback[];
}

/**
 * Read every account and school row the caller may see. The Division Office gets
 * the whole division; a teacher gets her own school and nothing else.
 */
export async function pullData(sql: Sql, access: SbfpAccess): Promise<SbfpPayload> {
  const ids = scopeIds(access);
  const all = access.scope === "all";

  const accounts = (await listAccounts(sql)).filter(
    (account) => all || (account.schoolId && ids.includes(account.schoolId)),
  );

  const placeholders = ids.map((_, index) => `$${index + 1}`).join(", ");
  const records = all
    ? await sql.query<RecordDbRow>(`select ${RECORD_COLUMNS} from sbfp_records order by created_at desc`)
    : ids.length === 0
      ? []
      : await sql.query<RecordDbRow>(
          `select ${RECORD_COLUMNS} from sbfp_records where school_id in (${placeholders}) order by created_at desc`,
          ids,
        );

  const feedbacks = all
    ? await sql.query<FeedbackDbRow>(
        "select id, school_id, author, role, category, rating, message, created_at, status, response, origin from sbfp_feedback order by created_at desc",
      )
    : ids.length === 0
      ? []
      : await sql.query<FeedbackDbRow>(
          `select id, school_id, author, role, category, rating, message, created_at, status, response, origin
           from sbfp_feedback where school_id in (${placeholders}) order by created_at desc`,
          ids,
        );

  return {
    accounts,
    records: records.map(toStudent),
    feedbacks: feedbacks.map(toFeedback),
  };
}
