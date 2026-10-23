/**
 * The app's server functions — the only way the browser talks to the database.
 *
 * Two things matter in this file, and nothing else does:
 *
 *  1. **The caller's identity is verified here.** `authMiddleware` resolves the
 *     same-origin session (cookie when deployed, bearer token in the live
 *     preview) and throws `UnauthorizedError` when nobody is signed in. The
 *     session email is then matched against `sbfp_accounts` to decide the role.
 *     No client-supplied id, email or role is ever trusted.
 *  2. **The caller's school is decided here, not sent by the browser.** A teacher
 *     call carries no usable `schoolId` — hers is read from her own account row,
 *     so an altered request cannot reach another school's learners. The Division
 *     Office may name any school, because its account is checked to be the
 *     Division Office.
 *
 * Endpoints the Division Office fills in answer with a **result** rather than an
 * exception (`{ ok: false, code, message }`), because "that school already has an
 * account" is a normal answer to show in the form, not a crash. Genuine bugs
 * still throw.
 *
 * Server-only modules (`@/lib/db`, the accounts service, `verify.server`) are
 * imported **inside** the handlers, so none of them reach the browser bundle.
 */
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import type { FeedbackStatus, SchoolFormDetails, Student } from "@/lib/sbfp-shared";

/** The `context` shape `authMiddleware` hands a handler, plus the preview token. */
interface AuthedContext {
  userId: string;
  bearerToken?: string;
}

/** A refusal the UI explains. `code` is `AccountErrorCode` from the service. */
export interface ApiFailure {
  ok: false;
  code: string;
  message: string;
}

export type ApiResult<T> = (T & { ok: true }) | ApiFailure;

/** Run an account operation, turning a service refusal into a return value. */
async function settle<T>(run: () => Promise<T>): Promise<ApiResult<T>> {
  try {
    return { ok: true, ...(await run()) };
  } catch (err) {
    const { AccountError } = await import("./sbfp-accounts");
    if (err instanceof AccountError) {
      return { ok: false, code: err.code, message: err.message };
    }
    throw err;
  }
}

/**
 * The verified session email, or null. `null` means nobody is signed in — a
 * caller with a session but no email cannot hold an account.
 */
async function sessionEmail(context: unknown): Promise<string | null> {
  const { bearerToken } = (context ?? {}) as AuthedContext;
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const user = await getSessionUser(bearerToken);
  return user?.email ?? null;
}

/**
 * The caller's access, or a refusal. Built from the verified session email only
 * (see `resolveAccess`); an account on hold resolves but can do nothing.
 */
async function requireAccess(email: string | null) {
  const { resolveAccess, AccountError } = await import("./sbfp-accounts");
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const access = email ? await resolveAccess(sql, email) : null;
  if (!access) {
    throw new AccountError(
      "forbidden",
      "No SBFP account has been issued for your email address.",
    );
  }
  if (access.account.status !== "active") {
    throw new AccountError(
      "forbidden",
      "This account is on hold. Please contact the Division Office.",
    );
  }
  return { sql, access };
}

/** The same, for the operations only the Division Office may perform. */
async function requireAdmin(email: string | null) {
  const { sql, access } = await requireAccess(email);
  const { AccountError } = await import("./sbfp-accounts");
  if (access.account.role !== "admin") {
    throw new AccountError(
      "forbidden",
      "Only the Division Office account can issue or change accounts.",
    );
  }
  return { sql, access };
}

/**
 * Everything a signed-in visitor needs to know about themselves: their account
 * (role, school, status) and whether the Division Office account exists yet.
 *
 * Never throws for an account-less visitor — the sign-in screens are built on
 * this, and "signed in but not issued an account yet" is a normal state.
 */
export const fetchAccountState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const email = await sessionEmail(context);
    const { getSql } = await import("@/lib/db");
    const { findAccountByEmail, hasAdminAccount } = await import("./sbfp-accounts");
    const sql = await getSql();
    const [account, hasAdmin] = await Promise.all([
      email ? findAccountByEmail(sql, email) : Promise.resolve(null),
      hasAdminAccount(sql),
    ]);
    return { email, account, hasAdmin };
  });

/**
 * The whole workspace for the caller: her account, plus the accounts, learner
 * records and feedback she may read. The Division Office gets the division; a
 * teacher gets her own school; an account on hold gets nothing.
 */
export const fetchWorkspace = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const email = await sessionEmail(context);
    const { getSql } = await import("@/lib/db");
    const { resolveAccess, pullData } = await import("./sbfp-accounts");
    const sql = await getSql();
    const access = email ? await resolveAccess(sql, email) : null;
    if (!access) {
      return { email, account: null, accounts: [], records: [], feedbacks: [] };
    }
    const payload = await pullData(sql, access);
    return { email, account: access.account, ...payload };
  });

/**
 * Does the Division Office account exist yet? (Asked by the sign-in screen.)
 *
 * The preview's database is in-memory, so this is also where the fixed preview
 * sign-in is seeded: the door asks this question on every visit, and an empty
 * database at that moment means the preview has just started. `ensureDemoAdmin`
 * is idempotent and refuses to touch a database that already has an account, so
 * the write happens at most once. On a real Postgres (`dbSource` "postgres") it
 * is a no-op and the first-run card stays the only way in.
 */
export const fetchBootstrapState = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getSql, dbSource } = await import("@/lib/db");
    const { hasAdminAccount, countAdmins, ensureDemoAdmin } = await import(
      "./sbfp-accounts"
    );
    const sql = await getSql();
    await ensureDemoAdmin(sql, { preview: dbSource === "pglite" });
    return { hasAdmin: await hasAdminAccount(sql), admins: await countAdmins(sql) };
  },
);

export interface AdminBootstrapInput {
  fullName: string;
  email: string;
  password: string;
}

/**
 * First-run setup: create the Division Office account. Refused the moment one
 * exists, so it is a one-time door and not a back way in.
 */
export const bootstrapAdminAccount = createServerFn({ method: "POST" })
  .validator((input: AdminBootstrapInput) => input)
  .handler(async ({ data }) =>
    settle(async () => {
      const { getSql } = await import("@/lib/db");
      const { createAccount, hasAdminAccount, AccountError } = await import(
        "./sbfp-accounts"
      );
      const sql = await getSql();
      if (await hasAdminAccount(sql)) {
        throw new AccountError(
          "forbidden",
          "The Division Office account already exists. Sign in with it.",
        );
      }
      const account = await createAccount(sql, {
        email: data.email,
        password: data.password,
        role: "admin",
        fullName: data.fullName,
        tempPassword: false,
      });
      return { account };
    }),
  );

export interface ClaimAdminInput {
  fullName: string;
}

/**
 * First-run setup for a visitor who is already signed in: behind the Grok gate
 * that identity was verified by the platform, so no password is typed. Makes the
 * signed-in email the Division Office account.
 */
export const claimAdminAccount = createServerFn({ method: "POST" })
  .validator((input: ClaimAdminInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) =>
    settle(async () => {
      const email = await sessionEmail(context);
      const { isValidEmail } = await import("./sbfp-credentials");
      const { AccountError } = await import("./sbfp-accounts");
      if (!email || !isValidEmail(email)) {
        throw new AccountError(
          "invalid_email",
          "Your session has no email address, so an account cannot be issued for it.",
        );
      }
      const { getSql } = await import("@/lib/db");
      const { claimAdminAccountForEmail } = await import("./sbfp-accounts");
      const sql = await getSql();
      const account = await claimAdminAccountForEmail(sql, email, data.fullName);
      return { account };
    }),
  );

export interface NewTeacherAccountInput {
  email: string;
  password: string;
  fullName: string;
  position: string;
  contact: string;
  schoolId: string;
}

/** Issue a Teacher Portal account for one school (Division Office only). */
export const createTeacherAccount = createServerFn({ method: "POST" })
  .validator((input: NewTeacherAccountInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) =>
    settle(async () => {
      const { sql } = await requireAdmin(await sessionEmail(context));
      const { createAccount } = await import("./sbfp-accounts");
      const account = await createAccount(sql, {
        email: data.email,
        password: data.password,
        role: "teacher",
        fullName: data.fullName,
        position: data.position,
        contact: data.contact,
        schoolId: data.schoolId,
      });
      return { account };
    }),
  );

export interface TeacherAccountPatch {
  email: string;
  fullName?: string;
  position?: string;
  contact?: string;
  schoolId?: string | null;
  status?: "active" | "disabled";
}

/** Edit an issued account: who holds it, which school, on hold or live. */
export const updateTeacherAccount = createServerFn({ method: "POST" })
  .validator((input: TeacherAccountPatch) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) =>
    settle(async () => {
      const { sql } = await requireAdmin(await sessionEmail(context));
      const { updateAccount } = await import("./sbfp-accounts");
      const { email: target, ...patch } = data;
      const account = await updateAccount(sql, target, patch);
      return { account };
    }),
  );

export interface ResetPasswordInput {
  email: string;
  password: string;
}

/** Hand a school a fresh temporary password (Division Office only). */
export const resetAccountPassword = createServerFn({ method: "POST" })
  .validator((input: ResetPasswordInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) =>
    settle(async () => {
      const { sql } = await requireAdmin(await sessionEmail(context));
      const { resetPassword } = await import("./sbfp-accounts");
      const account = await resetPassword(sql, data.email, data.password);
      return { account };
    }),
  );

export interface ChangePasswordInput {
  currentPassword?: string;
  newPassword: string;
}

/**
 * The signed-in account changes its own password — the teacher replacing the
 * temporary one she was handed.
 *
 * The current password is proved only once the holder has settled on one of her
 * own. An account still carrying the temporary password the Division Office
 * handed over is not asked for it — that hand-over is exactly when she is meant
 * to choose her own, and the portal does not even offer the field — and one that
 * only ever arrived through the Grok gate has no password at all, so the
 * session itself is the proof.
 *
 * This rule has to match the portal's `needsCurrent` exactly. Requiring proof
 * whenever *any* password exists reads correctly but locks every teacher out of
 * the one action she is told to take: her temporary password is a password, so
 * the change was refused with "your current password is not correct" and she
 * could never set one of her own.
 */
export const changeOwnPassword = createServerFn({ method: "POST" })
  .validator((input: ChangePasswordInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) =>
    settle(async () => {
      const email = await sessionEmail(context);
      const { getSql } = await import("@/lib/db");
      const {
        changeOwnPassword: apply,
        credentialState,
        findAccountByEmail,
        needsCurrentPassword,
        AccountError,
      } = await import("./sbfp-accounts");
      if (!email) throw new AccountError("forbidden", "You are not signed in.");
      const sql = await getSql();
      const [credential, account] = await Promise.all([
        credentialState(sql, email),
        findAccountByEmail(sql, email),
      ]);
      if (!credential) {
        throw new AccountError("not_found", "That account no longer exists.");
      }
      if (
        needsCurrentPassword({
          hasPassword: credential.hasPassword,
          tempPassword: account?.tempPassword === true,
        })
      ) {
        const { verifyPassword } = await import("better-auth/crypto");
        const ok =
          data.currentPassword !== undefined &&
          (await verifyPassword({ hash: credential.hash, password: data.currentPassword }));
        if (!ok) {
          throw new AccountError("forbidden", "Your current password is not correct.");
        }
      }
      await apply(sql, email, data.newPassword);
      return {};
    }),
  );

// ── Emailed password reset for the Division Office account ────────────────────

export interface RequestResetInput {
  email: string;
}

/**
 * Ask for a reset link to be emailed to the Division Office address.
 *
 * Deliberately open (no session): the person using it cannot sign in. The answer
 * is the same whether or not the address holds the admin account — the UI shows
 * a neutral "if that address holds the account…" confirmation either way, so
 * this cannot be used to find out which address it is.
 *
 * `previewUrl` exists only on the in-memory preview database, where no mail key
 * is configured: it lets the flow be completed while building the app. A
 * deployed database never returns it.
 */
export const requestAdminPasswordReset = createServerFn({ method: "POST" })
  .validator((input: RequestResetInput) => input)
  .handler(async ({ data }) => {
    const { getSql, dbSource } = await import("@/lib/db");
    const { createPasswordReset, RESET_LINK_MINUTES } = await import("./sbfp-accounts");
    const { buildResetUrl, emailConfigured, sendPasswordResetEmail } = await import(
      "./email.server"
    );
    const sql = await getSql();
    const reset = await createPasswordReset(sql, data.email);
    const configured = emailConfigured();

    if (!reset) {
      return { ok: true as const, configured, delivered: false, previewUrl: null };
    }

    const url = buildResetUrl(reset.token);
    const delivered = await sendPasswordResetEmail({
      to: reset.email,
      url,
      expiresMinutes: RESET_LINK_MINUTES,
    });
    const previewUrl = dbSource === "pglite" ? url : null;
    return { ok: true as const, configured, delivered, previewUrl };
  });

export interface ResetPasswordWithTokenInput {
  token: string;
  password: string;
}

/**
 * Set the new Division Office password from the emailed token. Also open: the
 * token itself is the proof. It is single-use and expires (see
 * `resetPasswordWithToken`).
 */
export const resetAdminPasswordWithToken = createServerFn({ method: "POST" })
  .validator((input: ResetPasswordWithTokenInput) => input)
  .handler(async ({ data }) =>
    settle(async () => {
      const { getSql } = await import("@/lib/db");
      const { resetPasswordWithToken } = await import("./sbfp-accounts");
      const sql = await getSql();
      const email = await resetPasswordWithToken(sql, data.token, data.password);
      return { email };
    }),
  );

/** Remove an account. The school keeps its form header, learners and feedback. */
export const removeTeacherAccount = createServerFn({ method: "POST" })
  .validator((input: { email: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) =>
    settle(async () => {
      const { sql } = await requireAdmin(await sessionEmail(context));
      const { deleteAccount } = await import("./sbfp-accounts");
      await deleteAccount(sql, data.email);
      return {};
    }),
  );

// ── School data (either side of the app) ──────────────────────────────────────

/** Save the school information block printed on the SBFP forms. */
export const saveSchoolHeader = createServerFn({ method: "POST" })
  .validator((input: { schoolId: string; patch: Partial<SchoolFormDetails> }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { sql, access } = await requireAccess(await sessionEmail(context));
    const { saveSchoolProfile, AccountError } = await import("./sbfp-accounts");
    // A teacher's school comes from her account, never from the request.
    const schoolId = access.scope === "all" ? data.schoolId : (access.scope[0] ?? "");
    if (!schoolId) throw new AccountError("not_found", "No school is set for this account.");
    await saveSchoolProfile(sql, schoolId, data.patch, access.email);
    return { ok: true as const };
  });

export interface LearnerRecordInput {
  schoolId?: string;
  /** Shaped like the form's `Student`; re-checked at runtime below. */
  record: Student;
}

/** Add or update one learner record. */
export const saveLearnerRecord = createServerFn({ method: "POST" })
  .validator((input: LearnerRecordInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { sql, access } = await requireAccess(await sessionEmail(context));
    const { upsertRecord, assertCanWriteRecord, AccountError } = await import(
      "./sbfp-accounts"
    );
    const record = data.record as unknown as { id?: unknown } | null;
    if (typeof record?.id !== "string" || !record.id) {
      throw new AccountError("not_found", "That learner record has no id.");
    }
    const schoolId = access.scope === "all" ? (data.schoolId ?? "") : (access.scope[0] ?? "");
    if (!schoolId) throw new AccountError("not_found", "No school is set for this account.");
    // An edit of an existing row is checked against the row's own school, so a
    // teacher cannot rewrite another school's record by reusing its id.
    await assertCanWriteRecord(sql, access, record.id);
    await upsertRecord(sql, schoolId, data.record, access.email);
    return { ok: true as const };
  });

/** Delete one learner record the caller may write. */
export const removeLearnerRecord = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { sql, access } = await requireAccess(await sessionEmail(context));
    const { deleteRecord, AccountError } = await import("./sbfp-accounts");
    if (access.scope === "all") {
      await deleteRecord(sql, data.id);
    } else {
      const schoolId = access.scope[0];
      if (!schoolId) throw new AccountError("forbidden", "No school is set for this account.");
      await deleteRecord(sql, data.id, schoolId);
    }
    return { ok: true as const };
  });

export interface FeedbackInput {
  schoolId?: string;
  entry: {
    id: string;
    author: string;
    role: string;
    category: string;
    rating: number;
    message: string;
    createdAt: string;
    status?: FeedbackStatus;
    response?: string;
    origin?: "Teacher Portal";
  };
}

/** Send feedback up from a school. */
export const sendSchoolFeedback = createServerFn({ method: "POST" })
  .validator((input: FeedbackInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { sql, access } = await requireAccess(await sessionEmail(context));
    const { insertFeedback, AccountError } = await import("./sbfp-accounts");
    const schoolId = access.scope === "all" ? (data.schoolId ?? "") : (access.scope[0] ?? "");
    if (!schoolId) throw new AccountError("not_found", "No school is set for this account.");
    await insertFeedback(sql, schoolId, data.entry as never, access.email);
    return { ok: true as const };
  });

export interface FeedbackReplyInput {
  id: string;
  status?: FeedbackStatus;
  response?: string;
}

/** Acknowledge, resolve, or reply — the Division Office's side of the loop. */
export const replyToFeedback = createServerFn({ method: "POST" })
  .validator((input: FeedbackReplyInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { sql, access } = await requireAccess(await sessionEmail(context));
    const { updateFeedback, assertCanWriteFeedback } = await import("./sbfp-accounts");
    await assertCanWriteFeedback(sql, access, data.id);
    await updateFeedback(sql, data.id, { status: data.status, response: data.response });
    return { ok: true as const };
  });
