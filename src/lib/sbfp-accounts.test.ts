/**
 * The accounts service, against a real database.
 *
 * These run on the app's own embedded PGlite with the SAME migration files the
 * deployed database applies (`migrations/0001_auth.sql` is Better Auth's schema,
 * `0002_sbfp.sql` is ours), so what is asserted here is the SQL the app actually
 * runs — not a mock of it. The password assertions use Better Auth's own hasher,
 * which is the point: an account issued from the Division Console has to be able
 * to sign in through `/api/auth/sign-in/email` like any other.
 *
 * Run with: `node --experimental-strip-types --test src/lib/sbfp-accounts.test.ts`
 * (wired into `npm test`).
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { after, before, describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { verifyPassword } from "better-auth/crypto";
import {
  AccountError,
  assertCanWriteRecord,
  assertCanWriteSchool,
  changeOwnPassword,
  claimAdminAccountForEmail,
  countAdmins,
  createAccount,
  createPasswordReset,
  credentialState,
  deleteAccount,
  deleteRecord,
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  ensureDemoAdmin,
  findAccountByEmail,
  hasAdminAccount,
  hashResetToken,
  insertFeedback,
  listAccounts,
  needsCurrentPassword,
  pullData,
  resetPassword,
  resetPasswordWithToken,
  resolveAccess,
  saveSchoolProfile,
  updateAccount,
  updateFeedback,
  upsertRecord,
} from "./sbfp-accounts.ts";
import type { Sql } from "./db.ts";
import type { Student } from "@/lib/sbfp-shared";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ADMIN = "division@depedurdaneta.gov.ph";
const TEACHER_A = "teacher.a@depedurdaneta.gov.ph";
const SCHOOL_A = "es-001";
const SCHOOL_B = "es-002";
const SCHOOL_C = "hs-001";
const SCHOOL_E = "es-009";

/** The `Sql` surface `@/lib/db` hands the service, over a PGlite instance. */
function toSql(pg: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return (await pg.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = async <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    (await pg.query(text, params)).rows as T[];
  return sql;
}

let pg: PGlite;
let sql: Sql;

type RecordRow = Omit<Student, "schoolId">;

/** A learner record with everything the school's Data Entry form fills in. */
function record(id: string, name: string, overrides: Partial<RecordRow> = {}): RecordRow {
  return {
    id,
    period: "Baseline",
    sy: "2025-2026",
    name,
    sex: "F",
    gradeLevel: "Grade 3",
    dateOfBirth: "2016-04-02",
    dateOfWeighing: "2026-07-10",
    ageYears: "10",
    ageMonths: "3",
    weight: "22.4",
    height: "118",
    bmi: "16.09",
    bmiStatus: "Normal",
    hfaStatus: "Normal",
    nutritionalStatus: "Normal",
    classificationOfBeneficiary: "Secondary",
    pregnant: "",
    hasYoungChildren: "",
    dewormed: "Yes",
    parentConsentMilk: "Yes",
    fourPs: "Yes",
    sbfpPreviousYears: "No",
    ...overrides,
  };
}

/** Wait for a refusal of a specific kind, and hand back its code. */
async function refusal(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (err) {
    assert.ok(err instanceof AccountError, `expected AccountError, got ${String(err)}`);
    return err.code;
  }
  throw new Error("expected the call to be refused, but it succeeded");
}

/**
 * A pristine database with the app's migrations applied — the state a preview
 * starts in, and the only state in which the demo seed has anything to do. The
 * shared `pg` above has accounts in it from the first test onwards, so it can
 * never show what happens on an empty one.
 */
async function emptyDb(): Promise<PGlite> {
  const fresh = new PGlite();
  await fresh.waitReady;
  for (const file of ["0001_auth.sql", "0002_sbfp.sql", "0003_password_reset.sql"]) {
    await fresh.exec(await readFile(join(ROOT, "migrations", file), "utf8"));
  }
  return fresh;
}

before(async () => {
  pg = new PGlite();
  await pg.waitReady;
  for (const file of ["0001_auth.sql", "0002_sbfp.sql", "0003_password_reset.sql"]) {
    await pg.exec(await readFile(join(ROOT, "migrations", file), "utf8"));
  }
  sql = toSql(pg);
});

after(async () => {
  await pg.close();
});

describe("issuing an account", () => {
  it("creates an identity that verifies with Better Auth's own hasher", async () => {
    const account = await createAccount(sql, {
      email: "  TEACHER.A@DepEdUrdaneta.gov.ph ",
      password: "sbpf-ay2k9",
      role: "teacher",
      fullName: "Dela Cruz, Maria",
      position: "SBFP Feeding Focal Person",
      contact: "0917 000 1111",
      schoolId: SCHOOL_A,
    });

    assert.equal(account.email, TEACHER_A, "the email is normalized");
    assert.equal(account.role, "teacher");
    assert.equal(account.schoolId, SCHOOL_A);
    assert.equal(account.status, "active");
    assert.equal(account.tempPassword, true, "an issued password is temporary");

    const credential = await credentialState(sql, account.email);
    assert.ok(credential?.hasPassword, "a password credential was written");
    assert.equal(await verifyPassword({ hash: credential.hash, password: "sbpf-ay2k9" }), true);
    assert.equal(await verifyPassword({ hash: credential.hash, password: "not-the-password" }), false);

    // The credential row must be shaped exactly as Better Auth's sign-in route
    // looks for it: providerId 'credential' keyed on the user's own id.
    const rows = await sql.query<{ accountId: string; userId: string; providerId: string }>(
      'select "accountId", "userId", "providerId" from "account" where "userId" = $1',
      [credential.userId],
    );
    assert.deepEqual(rows, [
      { accountId: credential.userId, userId: credential.userId, providerId: "credential" },
    ]);
    const identity = await sql.query<{ email: string; emailVerified: boolean }>(
      'select "email", "emailVerified" from "user" where "id" = $1',
      [credential.userId],
    );
    assert.equal(identity[0].email, TEACHER_A);
    assert.equal(identity[0].emailVerified, true, "the Division Office vouches for the address");
  });

  it("refuses a second account for the same school, and for the same email", async () => {
    assert.equal(
      await refusal(() =>
        createAccount(sql, {
          email: "other@depedurdaneta.gov.ph",
          password: "sbpf-1234",
          role: "teacher",
          schoolId: SCHOOL_A,
        }),
      ),
      "school_taken",
    );
    assert.equal(
      await refusal(() =>
        createAccount(sql, {
          email: TEACHER_A,
          password: "sbpf-1234",
          role: "teacher",
          schoolId: SCHOOL_C,
        }),
      ),
      "email_taken",
    );
  });

  it("refuses weak passwords, malformed emails and a missing school", async () => {
    assert.equal(
      await refusal(() =>
        createAccount(sql, { email: "short@deped.gov.ph", password: "abc", role: "teacher", schoolId: SCHOOL_B }),
      ),
      "weak_password",
    );
    assert.equal(
      await refusal(() =>
        createAccount(sql, { email: "not-an-email", password: "sbpf-1234", role: "teacher", schoolId: SCHOOL_B }),
      ),
      "invalid_email",
    );
    assert.equal(
      await refusal(() =>
        createAccount(sql, { email: "school-less@deped.gov.ph", password: "sbpf-1234", role: "teacher" }),
      ),
      "not_found",
    );
    // A refusal must never leave a half-made identity behind.
    const leftovers = await sql.query<{ n: number | string }>(
      'select count(*) as n from "user" where lower("email") in ($1, $2, $3)',
      ["short@deped.gov.ph", "not-an-email", "school-less@deped.gov.ph"],
    );
    assert.equal(Number(leftovers[0].n), 0);
  });
});

describe("the Division Office account", () => {
  it("is claimed once, and blocks a second claim", async () => {
    assert.equal(await hasAdminAccount(sql), false);
    const admin = await claimAdminAccountForEmail(sql, ADMIN, "Division SBFP Coordinator");
    assert.equal(admin.role, "admin");
    assert.equal(admin.schoolId, null);
    assert.equal(await hasAdminAccount(sql), true);
    assert.equal(await countAdmins(sql), 1);

    assert.equal(
      await refusal(() => claimAdminAccountForEmail(sql, "someone.else@deped.gov.ph", "Impostor")),
      "forbidden",
    );
    assert.equal(
      await refusal(() => claimAdminAccountForEmail(sql, "another@deped.gov.ph", "Another")),
      "forbidden",
    );
  });

  it("still lets teacher accounts be issued, and sees the whole division", async () => {
    await createAccount(sql, {
      email: "teacher.b@depedurdaneta.gov.ph",
      password: "sbpf-bbbb",
      role: "teacher",
      fullName: "Ramos, Josefa",
      schoolId: SCHOOL_B,
    });
    await upsertRecord(sql, SCHOOL_A, record("tr_a1", "Learner A"), TEACHER_A);
    await upsertRecord(sql, SCHOOL_B, record("tr_b1", "Learner B"), "teacher.b@depedurdaneta.gov.ph");
    await insertFeedback(
      sql,
      SCHOOL_A,
      {
        id: "tf_a1",
        author: "Dela Cruz, Maria",
        role: "SBFP Focal",
        category: "Nutrition Data",
        rating: 4,
        message: "Baseline complete.",
        createdAt: "2026-08-01",
        status: "New",
        origin: "Teacher Portal",
      },
      TEACHER_A,
    );

    const adminAccess = await resolveAccess(sql, ADMIN);
    assert.ok(adminAccess);
    assert.equal(adminAccess.scope, "all");
    const division = await pullData(sql, adminAccess);
    assert.equal(division.accounts.filter((a) => a.schoolId).length, 2);
    assert.deepEqual(division.records.map((r) => r.id).sort(), ["tr_a1", "tr_b1"]);
    assert.equal(division.feedbacks.length, 1);
  });

  it("sees only her own school as a teacher", async () => {
    const access = await resolveAccess(sql, TEACHER_A);
    assert.ok(access);
    assert.deepEqual(access.scope, [SCHOOL_A]);
    const mine = await pullData(sql, access);
    assert.deepEqual(mine.accounts.map((a) => a.schoolId), [SCHOOL_A]);
    assert.deepEqual(mine.records.map((r) => r.id), ["tr_a1"]);
    assert.deepEqual(mine.feedbacks.map((f) => f.id), ["tf_a1"]);
    // ... and rows come back in the shape the screens use.
    assert.equal(mine.records[0].schoolId, SCHOOL_A);
    assert.equal(mine.records[0].gradeLevel, "Grade 3");
    assert.equal(mine.records[0].bmi, "16.09");
    assert.equal(mine.feedbacks[0].origin, "Teacher Portal");
    assert.equal(mine.feedbacks[0].createdAt, "2026-08-01");
    assert.equal(mine.accounts[0].recordCount, 1);
    assert.equal(mine.accounts[0].feedbackCount, 1);
  });

  it("cannot be removed or put on hold while it is the only one", async () => {
    assert.equal(await refusal(() => deleteAccount(sql, ADMIN)), "last_admin");
    assert.equal(await refusal(() => updateAccount(sql, ADMIN, { status: "disabled" })), "last_admin");

    const second = await createAccount(sql, {
      email: "coordinator@depedurdaneta.gov.ph",
      password: "sbpf-coord",
      role: "admin",
      fullName: "Second Coordinator",
    });
    assert.equal(await countAdmins(sql), 2);
    await updateAccount(sql, ADMIN, { status: "disabled" });
    assert.equal((await findAccountByEmail(sql, ADMIN))?.status, "disabled");
    await updateAccount(sql, ADMIN, { status: "active" });
    await deleteAccount(sql, second.email);
    assert.equal(await countAdmins(sql), 1);
  });

  it("reads a school the Division Office itself has no account for", async () => {
    await createAccount(sql, {
      email: "teacher.c@depedurdaneta.gov.ph",
      password: "sbpf-cccc",
      role: "teacher",
      fullName: "Bautista, Rolando",
      schoolId: SCHOOL_C,
    });
    await updateAccount(sql, "teacher.c@depedurdaneta.gov.ph", { status: "disabled" });

    const onHold = await resolveAccess(sql, "teacher.c@depedurdaneta.gov.ph");
    assert.ok(onHold);
    assert.deepEqual(onHold.scope, [], "an account on hold may reach no school");
    assert.deepEqual((await pullData(sql, onHold)).records, []);
    assert.equal(await refusal(() => Promise.resolve(assertCanWriteSchool(onHold, SCHOOL_C))), "forbidden");

    const admin = await resolveAccess(sql, ADMIN);
    assert.ok(admin);
    assert.ok((await pullData(sql, admin)).accounts.some((a) => a.schoolId === SCHOOL_C));

    await updateAccount(sql, "teacher.c@depedurdaneta.gov.ph", { status: "active" });
    const back = await resolveAccess(sql, "teacher.c@depedurdaneta.gov.ph");
    assert.ok(back);
    assert.deepEqual(back.scope, [SCHOOL_C]);
  });

  it("knows nothing about an email that holds no account", async () => {
    assert.equal(await resolveAccess(sql, "stranger@deped.gov.ph"), null);
    assert.equal(await findAccountByEmail(sql, "stranger@deped.gov.ph"), null);
  });
});

describe("a teacher can only reach her own school", () => {
  it("refuses a write to another school's rows", async () => {
    const access = await resolveAccess(sql, TEACHER_A);
    assert.ok(access);
    assert.equal(await refusal(() => Promise.resolve(assertCanWriteSchool(access, SCHOOL_B))), "forbidden");
    assertCanWriteSchool(access, SCHOOL_A); // her own school is fine

    assert.equal(await refusal(() => assertCanWriteRecord(sql, access, "tr_b1")), "forbidden");
    await assertCanWriteRecord(sql, access, "tr_a1");
  });

  it("cannot overwrite another school's record by reusing its id", async () => {
    // The service's own guard: an upsert whose school does not match the stored
    // row updates nothing, so a forged id cannot rewrite the other school's data.
    await upsertRecord(sql, SCHOOL_A, record("tr_b1", "Hijacked"), TEACHER_A);
    const stored = await sql.query<{ name: string; school_id: string }>(
      "select name, school_id from sbfp_records where id = $1",
      ["tr_b1"],
    );
    assert.equal(stored[0].name, "Learner B");
    assert.equal(stored[0].school_id, SCHOOL_B);
  });

  it("keeps deletes inside the school", async () => {
    await deleteRecord(sql, "tr_b1", SCHOOL_A); // someone else's row → no-op
    const still = await sql.query<{ id: string }>("select id from sbfp_records where id = $1", ["tr_b1"]);
    assert.equal(still.length, 1);
    await deleteRecord(sql, "tr_a1", SCHOOL_A);
    const gone = await sql.query<{ id: string }>("select id from sbfp_records where id = $1", ["tr_a1"]);
    assert.equal(gone.length, 0);
    await upsertRecord(sql, SCHOOL_A, record("tr_a1", "Learner A"), TEACHER_A);
  });
});

describe("passwords", () => {
  it("resets to a working password and flags it as temporary", async () => {
    const before = await credentialState(sql, TEACHER_A);
    assert.ok(before);
    const account = await resetPassword(sql, TEACHER_A, "new-pass-99");
    assert.equal(account.tempPassword, true);

    const after = await credentialState(sql, TEACHER_A);
    assert.ok(after);
    assert.equal(await verifyPassword({ hash: after.hash, password: "sbpf-ay2k9" }), false, "the old password stops working");
    assert.equal(await verifyPassword({ hash: after.hash, password: "new-pass-99" }), true);
    assert.equal(after.userId, before.userId, "the identity is reused, only the hash changes");
    assert.equal(await refusal(() => resetPassword(sql, TEACHER_A, "short")), "weak_password");
  });

  it("only demands the current password once the holder has settled on one", () => {
    assert.equal(
      needsCurrentPassword({ hasPassword: true, tempPassword: true }),
      false,
      "a temporary password is the thing being replaced — asking for it refuses the change",
    );
    assert.equal(
      needsCurrentPassword({ hasPassword: false, tempPassword: true }),
      false,
      "an account with no password proves itself with the session",
    );
    assert.equal(
      needsCurrentPassword({ hasPassword: true, tempPassword: false }),
      true,
      "a password the holder chose must be proved",
    );
    assert.equal(needsCurrentPassword({ hasPassword: false, tempPassword: false }), false);
  });

  it("lets the holder choose her own password, clearing the temporary flag", async () => {
    await changeOwnPassword(sql, TEACHER_A, "maria-chose-this");
    assert.equal((await findAccountByEmail(sql, TEACHER_A))?.tempPassword, false);
    const credential = await credentialState(sql, TEACHER_A);
    assert.ok(credential);
    assert.equal(await verifyPassword({ hash: credential.hash, password: "maria-chose-this" }), true);
  });

  it("gives a password to an account whose identity arrived with no credential", async () => {
    // An identity as the Grok gate creates it: a user row, no credential.
    await pg.query(
      'insert into "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt") values ($1, $2, $3, true, now(), now())',
      ["gate-user-1", "Grok user", "gated@depedurdaneta.gov.ph"],
    );
    await pg.query(
      "insert into sbfp_accounts (email, role, full_name, school_id, status, temp_password) values ($1, 'teacher', $2, $3, 'active', false)",
      ["gated@depedurdaneta.gov.ph", "Gated Teacher", "es-003"],
    );
    assert.equal((await credentialState(sql, "gated@depedurdaneta.gov.ph"))?.hasPassword, false);

    await resetPassword(sql, "gated@depedurdaneta.gov.ph", "from-the-office");
    const credential = await credentialState(sql, "gated@depedurdaneta.gov.ph");
    assert.ok(credential);
    assert.equal(credential.userId, "gate-user-1", "the existing identity is reused");
    assert.equal(await verifyPassword({ hash: credential.hash, password: "from-the-office" }), true);
  });

  it("mints a reset link for the Division Office account only, stored as a hash", async () => {
    // A teacher's address gets no link: the reset door belongs to the one account
    // that cannot be re-issued by anyone else.
    assert.equal(await createPasswordReset(sql, TEACHER_A), null);
    assert.equal(await createPasswordReset(sql, "nobody@deped.gov.ph"), null);

    const reset = await createPasswordReset(sql, ADMIN.toUpperCase());
    assert.ok(reset, "the Division Office account gets a link");
    assert.equal(reset.email, ADMIN, "the address is normalized to the account's own");
    assert.ok(reset.token.length >= 32, "the token is long enough to guess-proof it");
    assert.ok(reset.expiresAt);

    const stored = await sql.query<{ token_hash: string }>(
      "select token_hash from sbfp_admin_password_resets where lower(email) = $1",
      [ADMIN],
    );
    assert.equal(stored.length, 1, "one live link per account");
    assert.equal(stored[0].token_hash, hashResetToken(reset.token));
    assert.notEqual(stored[0].token_hash, reset.token, "the token in the email is never stored");

    // Repeat clicks inside the minute are swallowed, so nobody can flood a mailbox.
    assert.equal(await createPasswordReset(sql, ADMIN), null);
  });

  it("issues a new link after the cooldown, replacing the old one", async () => {
    await sql`update sbfp_admin_password_resets set requested_at = now() - interval '2 minutes'`;
    const first = await createPasswordReset(sql, ADMIN);
    assert.ok(first);

    await sql`update sbfp_admin_password_resets set requested_at = now() - interval '2 minutes'`;
    const second = await createPasswordReset(sql, ADMIN);
    assert.ok(second);
    assert.notEqual(second.token, first.token);

    const rows = await sql.query<{ n: number | string }>(
      "select count(*) as n from sbfp_admin_password_resets",
    );
    assert.equal(Number(rows[0].n), 1, "the earlier link is replaced, not added");

    // The replaced link is dead.
    assert.equal(
      await refusal(() => resetPasswordWithToken(sql, first.token, "admin-pass-2026")),
      "reset_token_invalid",
    );
  });

  it("sets a new Division Office password with the emailed link — once", async () => {
    await sql`update sbfp_admin_password_resets set requested_at = now() - interval '2 minutes'`;
    const reset = await createPasswordReset(sql, ADMIN);
    assert.ok(reset);

    // A rejected password must not consume the link.
    assert.equal(
      await refusal(() => resetPasswordWithToken(sql, reset.token, "short")),
      "weak_password",
    );

    const email = await resetPasswordWithToken(sql, reset.token, "admin-pass-2026");
    assert.equal(email, ADMIN);
    const credential = await credentialState(sql, ADMIN);
    assert.ok(credential?.hasPassword);
    assert.equal(await verifyPassword({ hash: credential.hash, password: "admin-pass-2026" }), true);
    assert.equal(
      (await findAccountByEmail(sql, ADMIN))?.tempPassword,
      false,
      "the new password is the holder's own, not temporary",
    );

    // The same link cannot be replayed.
    assert.equal(
      await refusal(() => resetPasswordWithToken(sql, reset.token, "another-pass-77")),
      "reset_token_invalid",
    );
    assert.equal(
      await refusal(() => resetPasswordWithToken(sql, "not-a-real-token", "another-pass-77")),
      "reset_token_invalid",
    );
  });

  it("refuses a link that has expired", async () => {
    await sql`update sbfp_admin_password_resets set requested_at = now() - interval '2 minutes'`;
    const reset = await createPasswordReset(sql, ADMIN);
    assert.ok(reset);
    await sql`update sbfp_admin_password_resets set expires_at = now() - interval '1 minute'`;

    assert.equal(
      await refusal(() => resetPasswordWithToken(sql, reset.token, "admin-pass-2027")),
      "reset_token_invalid",
    );
  });
});

describe("school data", () => {
  it("merges a header instead of blanking the fields a patch omits", async () => {
    await saveSchoolProfile(sql, SCHOOL_A, { principal: "Mr. Reyes", schoolIdNumber: "100123" }, TEACHER_A);
    assert.equal((await findAccountByEmail(sql, TEACHER_A))?.profile.principal, "Mr. Reyes");

    // The Division Office fills in one more field of the same school.
    await saveSchoolProfile(sql, SCHOOL_A, { cityMunicipalityBarangay: "Urdaneta City, Barangay Anonas" }, ADMIN);
    const profile = (await findAccountByEmail(sql, TEACHER_A))?.profile;
    assert.equal(profile?.principal, "Mr. Reyes", "the earlier fields survive");
    assert.equal(profile?.cityMunicipalityBarangay, "Urdaneta City, Barangay Anonas");
    assert.equal(profile?.division, "Urdaneta City");
  });

  it("updates a reply and a status independently", async () => {
    await updateFeedback(sql, "tf_a1", { response: "Received — thank you." });
    let row = await sql.query<{ status: string; response: string }>(
      "select status, response from sbfp_feedback where id = $1",
      ["tf_a1"],
    );
    assert.equal(row[0].status, "New", "the status is left alone");
    assert.equal(row[0].response, "Received — thank you.");

    await updateFeedback(sql, "tf_a1", { status: "Acknowledged" });
    row = await sql.query<{ status: string; response: string }>(
      "select status, response from sbfp_feedback where id = $1",
      ["tf_a1"],
    );
    assert.equal(row[0].status, "Acknowledged");
    assert.equal(row[0].response, "Received — thank you.", "and the reply is left alone");

    const access = await resolveAccess(sql, TEACHER_A);
    assert.ok(access);
    const mine = await pullData(sql, access);
    assert.equal(mine.feedbacks[0].status, "Acknowledged");
    assert.equal(mine.feedbacks[0].response, "Received — thank you.");
  });

  it("keeps a school's work when its account is removed", async () => {
    const account = await createAccount(sql, {
      email: "teacher.d@depedurdaneta.gov.ph",
      password: "sbpf-dddd",
      role: "teacher",
      fullName: "Aquino, Marilou",
      schoolId: SCHOOL_E,
    });
    await upsertRecord(sql, SCHOOL_E, record("tr_d1", "Learner D"), account.email);
    await saveSchoolProfile(sql, SCHOOL_E, { principal: "Mrs. Santos" }, account.email);
    await deleteAccount(sql, account.email);

    assert.equal(await findAccountByEmail(sql, account.email), null);
    const rows = await sql.query<{ id: string }>("select id from sbfp_records where school_id = $1", [SCHOOL_E]);
    assert.deepEqual(rows.map((r) => r.id), ["tr_d1"], "the learner records stay with the school");
    const headers = await sql.query<{ principal: string }>(
      "select principal from sbfp_school_profiles where school_id = $1",
      [SCHOOL_E],
    );
    assert.equal(headers[0].principal, "Mrs. Santos");

    // ... and a replacement account for the same school picks the work up.
    const replacement = await createAccount(sql, {
      email: "teacher.d2@depedurdaneta.gov.ph",
      password: "sbpf-dddd2",
      role: "teacher",
      fullName: "Bautista, Rina",
      schoolId: SCHOOL_E,
    });
    const access = await resolveAccess(sql, replacement.email);
    assert.ok(access);
    assert.deepEqual((await pullData(sql, access)).records.map((r) => r.id), ["tr_d1"]);
  });

  it("can move an account to another school, but not onto a taken one", async () => {
    const moved = await updateAccount(sql, "teacher.b@depedurdaneta.gov.ph", { schoolId: "hs-002" });
    assert.equal(moved.schoolId, "hs-002");
    assert.equal(
      await refusal(() => updateAccount(sql, "teacher.b@depedurdaneta.gov.ph", { schoolId: SCHOOL_A })),
      "school_taken",
    );
    await updateAccount(sql, "teacher.b@depedurdaneta.gov.ph", { schoolId: SCHOOL_B });
  });

  it("lists every account with the counts the panel shows", async () => {
    const all = await listAccounts(sql);
    const division = all.find((a) => a.email === ADMIN);
    assert.ok(division);
    assert.equal(division.role, "admin");
    assert.equal(division.schoolId, null);

    const teacherA = all.find((a) => a.email === TEACHER_A);
    assert.ok(teacherA);
    assert.equal(teacherA.recordCount, 1);
    assert.equal(teacherA.feedbackCount, 1);
    assert.equal(teacherA.email, TEACHER_A);
    assert.equal(all.filter((a) => a.role === "admin").length, 1, "the second admin was removed again");
  });
});

describe("the live preview's Division Office sign-in", () => {
  let fresh: PGlite;
  let freshSql: Sql;

  before(async () => {
    fresh = await emptyDb();
    freshSql = toSql(fresh);
  });

  after(async () => {
    await fresh.close();
  });

  it("never seeds a deployed database", async () => {
    assert.equal(await ensureDemoAdmin(freshSql, { preview: false }), false);
    assert.equal(await hasAdminAccount(freshSql), false, "the first-run card stays the only way in");
  });

  it("seeds the fixed login on a fresh preview, and leaves it alone afterwards", async () => {
    assert.equal(await ensureDemoAdmin(freshSql, { preview: true }), true);

    const account = await findAccountByEmail(freshSql, DEMO_ADMIN_EMAIL);
    assert.ok(account, `${DEMO_ADMIN_EMAIL} holds the Division Office account`);
    assert.equal(account.role, "admin");
    assert.equal(account.status, "active");
    assert.equal(account.tempPassword, false, "the preview login is not a temporary password");

    // The whole point: it signs in through the real route, with the real hasher.
    const credential = await credentialState(freshSql, DEMO_ADMIN_EMAIL);
    assert.ok(credential?.hasPassword);
    assert.equal(
      await verifyPassword({ hash: credential.hash, password: DEMO_ADMIN_PASSWORD }),
      true,
      `${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD} is the preview's way in`,
    );
    assert.equal(await verifyPassword({ hash: credential.hash, password: "qwertyuiop1" }), false);

    // Idempotent, and it must never clobber an account that already exists —
    // including one the Division Office made for itself at first-run setup.
    assert.equal(await ensureDemoAdmin(freshSql, { preview: true }), false);
    assert.equal((await listAccounts(freshSql)).filter((a) => a.role === "admin").length, 1);
  });
});
