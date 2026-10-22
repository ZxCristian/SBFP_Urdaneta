/**
 * The seam between the two SBFP websites.
 *
 * `/` (the Division Office console) and `/teacher` (a school's own site) are one
 * app in two products, and this module is the shared, **server-backed** state
 * they both read:
 *
 *  - `account`   — who the signed-in visitor is: the Division Office, or one
 *                  school's teacher (the account the Division Office issued).
 *  - `profiles`  — every school's SBFP form header the caller may see, keyed by
 *                  school, with the teacher who holds the account.
 *  - `records`   — learner records encoded through the Teacher Portal.
 *  - `feedbacks` — what a school sent up, with the Division Office's reply on the
 *                  same row so the school sees the answer.
 *
 * Nothing here decides who may read or write what: the server functions in
 * `@/lib/sbfp-api` verify the session and scope every row (see
 * `@/lib/sbfp-accounts`). This module keeps a synchronous mirror of what the
 * server returned, so the screens stay simple — reads are plain values, and each
 * action applies locally first and then writes through, surfacing `syncError`
 * when the write did not land.
 *
 * SSR note: state is only read on the client. Module init touches no storage,
 * `getServerSnapshot` returns a frozen empty state, and `syncWorkspace()` loads
 * from the server from an effect, so server HTML and client HTML never disagree.
 */
import { useSyncExternalStore } from "react";
import {
  fetchWorkspace,
  removeLearnerRecord,
  replyToFeedback,
  saveLearnerRecord,
  saveSchoolHeader,
  sendSchoolFeedback,
} from "./sbfp-api";
// Type-only, so this import is erased and sbfp-app.tsx -> sbfp-store.ts stays
// a one-way runtime edge (no import cycle).
import type { SchoolFeedback, SchoolFormDetails, Student } from "@/sbfp-app";

/** The pre-accounts store's key; read once to carry a school's work forward. */
const LEGACY_STORAGE_KEY = "sbfp.teachers.v1";

export type AccountRole = "admin" | "teacher";

/** The caller's own account, as issued by the Division Office. */
export interface SbfpAccount {
  email: string;
  role: AccountRole;
  fullName: string;
  position: string;
  contact: string;
  schoolId: string | null;
  status: "active" | "disabled";
  /** True while the password is still the one the Division Office generated. */
  tempPassword: boolean;
  /** ISO timestamps from `sbfp_accounts`. */
  createdAt: string;
  updatedAt: string;
  /** The school's SBFP form header. */
  profile: SchoolFormDetails;
  recordCount?: number;
  feedbackCount?: number;
}

/** A school's SBFP form header plus the teacher holding the account for it. */
export interface TeacherProfile extends SchoolFormDetails {
  /** The `School.id` this account is for — exactly one account per school. */
  schoolId: string;
  /** The teacher herself: name, position, how the district reaches her. */
  teacherName: string;
  position: string;
  contact: string;
  /** ISO timestamp of the last save, shown as "last updated". */
  updatedAt: string;
  /** The account this profile belongs to. */
  email: string;
  status: "active" | "disabled";
  tempPassword: boolean;
  recordCount: number;
  feedbackCount: number;
}

/** The four fields the school must supply — the rest are optional extras. */
export const REQUIRED_PROFILE_FIELDS: [keyof TeacherProfile, string][] = [
  ["principal", "Name of Principal"],
  ["focalPerson", "Name of Feeding Focal Person"],
  ["schoolIdNumber", "School ID Number"],
  ["cityMunicipalityBarangay", "City/Municipality/Barangay"],
];

export interface TeacherStoreState {
  /** False until the first server read has come back — the sites show a boot screen until then. */
  hydrated: boolean;
  /** The email of the account the workspace was loaded for, or null. */
  email: string | null;
  /** The caller's own account, or null when no account has been issued for it. */
  account: SbfpAccount | null;
  /** Every school's header the caller may see, keyed by school id. */
  profiles: Record<string, TeacherProfile>;
  /** The same rows as a list — the Division Office's accounts table. */
  accounts: TeacherProfile[];
  /** The school the signed-in teacher is working on, or null. */
  activeSchoolId: string | null;
  /** Learner records encoded through the Teacher Portal. */
  records: Student[];
  /** Feedback the schools sent up, with the Division Office's reply merged in. */
  feedbacks: SchoolFeedback[];
  /** Why the last server write failed, if it did. */
  syncError: string | null;
  /** True while a workspace read is in flight. */
  syncing: boolean;
}

const EMPTY: TeacherStoreState = Object.freeze({
  hydrated: false,
  email: null,
  account: null,
  profiles: {},
  accounts: [],
  activeSchoolId: null,
  records: [],
  feedbacks: [],
  syncError: null,
  syncing: false,
});

let state: TeacherStoreState = EMPTY;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => EMPTY;

function set(patch: Partial<TeacherStoreState>) {
  state = { ...state, ...patch };
  for (const listener of Array.from(listeners)) listener();
}

/** Subscribe a component to everything the schools have sent up. */
export function useTeacherStore(): TeacherStoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** The current rows, for readers outside React (scripts, tests). */
export function teacherStoreSnapshot(): TeacherStoreState {
  return state;
}

/** The school signed in on this device, or null. */
export function activeProfile(s: TeacherStoreState): TeacherProfile | null {
  return s.activeSchoolId ? (s.profiles[s.activeSchoolId] ?? null) : null;
}

/** How much of the required school information is filled in. */
export function profileStatus(profile: TeacherProfile | null) {
  const done = profile
    ? REQUIRED_PROFILE_FIELDS.filter(([key]) => String(profile[key] ?? "").trim().length > 0)
    : [];
  const missing = REQUIRED_PROFILE_FIELDS.filter(([key]) => !done.some(([k]) => k === key));
  return { done: done.length, total: REQUIRED_PROFILE_FIELDS.length, missing, complete: done.length === REQUIRED_PROFILE_FIELDS.length };
}

/** Short unique ids; the prefixes let the two sides tell rows apart. */
const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
export const newRecordId = () => uid("tr");
export const newFeedbackId = () => uid("tf");

/** Is this row one the teacher website owns? */
export const isTeacherRecord = (s: { id: string }) => s.id.startsWith("tr_");
export const isTeacherFeedback = (f: { id: string }) => f.id.startsWith("tf_");

// ── Loading from the server ───────────────────────────────────────────────────

/**
 * One read per resolved session, shared by both sites: the district console and
 * the teacher portal both call `syncWorkspace()`, and they must not race two
 * reads on the same email.
 */
let inFlight: Promise<void> | null = null;
let loadedFor: string | null = null;

function profileOf(account: SbfpAccount): TeacherProfile | null {
  if (!account.schoolId) return null;
  return {
    ...account.profile,
    schoolId: account.schoolId,
    teacherName: account.fullName,
    position: account.position,
    contact: account.contact,
    updatedAt: account.updatedAt ?? "",
    email: account.email,
    status: account.status,
    tempPassword: account.tempPassword,
    recordCount: account.recordCount ?? 0,
    feedbackCount: account.feedbackCount ?? 0,
  };
}

/** Fold the accounts the server returned into the by-school map both sites use. */
function profilesOf(accounts: SbfpAccount[]): Record<string, TeacherProfile> {
  const profiles: Record<string, TeacherProfile> = {};
  for (const account of accounts) {
    const profile = profileOf(account);
    if (profile) profiles[profile.schoolId] = profile;
  }
  return profiles;
}

/**
 * Read this visitor's workspace, for the identity `expectedEmail`.
 *
 * Safe to call repeatedly — the same read is shared and an already-loaded
 * identity is skipped — and safe to call from both sites, which both do. A
 * different identity clears the previous one's rows first, so a switched session
 * never flashes the other person's school.
 */
export function syncWorkspace(expectedEmail?: string | null, force = false): Promise<void> {
  const target = (expectedEmail ?? state.email)?.toLowerCase() ?? null;
  if (target && state.email && state.email !== target) {
    loadedFor = null;
    state = { ...EMPTY };
  }
  if (inFlight) return inFlight;
  if (!force && loadedFor && loadedFor === target) return Promise.resolve();
  loadedFor = target;
  // The identity is claimed up front: a read that fails must not leave the site
  // spinning on "loading" forever, and `syncError` carries the reason.
  set({ syncing: true, email: target, hydrated: state.hydrated });
  inFlight = fetchWorkspace()
    .then(async (workspace) => {
      const accounts = (workspace.accounts ?? []) as SbfpAccount[];
      const profiles = profilesOf(accounts);
      const account = (workspace.account ?? null) as SbfpAccount | null;
      const loadedEmail = workspace.email?.toLowerCase() ?? target;
      loadedFor = loadedEmail;
      set({
        hydrated: true,
        syncing: false,
        syncError: null,
        email: loadedEmail,
        account,
        accounts: accounts.filter((a) => a.schoolId).map((a) => profiles[a.schoolId as string]).filter(Boolean),
        profiles,
        activeSchoolId: account?.role === "teacher" ? account.schoolId : null,
        records: (workspace.records ?? []) as Student[],
        feedbacks: (workspace.feedbacks ?? []) as SchoolFeedback[],
      });
      await carryLegacyWorkForward();
    })
    .catch((err: unknown) => {
      // Signed out is not an error: the sites ask for a session first and only
      // then for the workspace.
      const message = err instanceof Error ? err.message : String(err);
      const signedOut = /unauthor/i.test(message);
      set({
        hydrated: true,
        syncing: false,
        account: null,
        accounts: [],
        profiles: {},
        activeSchoolId: null,
        records: [],
        feedbacks: [],
        syncError: signedOut ? null : `Could not reach the division server: ${message}`,
      });
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Forget everything (sign-out). */
export function resetWorkspace() {
  loadedFor = null;
  state = { ...EMPTY, hydrated: true };
  for (const listener of Array.from(listeners)) listener();
}

/**
 * Carry work encoded through the pre-accounts portal into the account that now
 * owns the school, then drop the old local copy — the rows would otherwise be
 * stranded in this browser with nothing left to show them.
 *
 * Deliberately conservative: only for a school the caller can write, only when
 * the server has no rows for it yet, and the school header is only taken over
 * when the server has none.
 */
async function carryLegacyWorkForward() {
  const account = state.account;
  if (!account || typeof window === "undefined") return;
  const schoolId = account.schoolId;
  if (!schoolId) return;
  let legacy: { profiles?: Record<string, SchoolFormDetails>; records?: Student[]; feedbacks?: SchoolFeedback[] };
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return;
    legacy = JSON.parse(raw) as typeof legacy;
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    return;
  }
  const mine = (legacy.records ?? []).filter((r) => r && r.schoolId === schoolId);
  const alreadyHere = state.records.some((r) => r.schoolId === schoolId);
  if (mine.length > 0 && !alreadyHere) {
    for (const record of mine) {
      addRecord({ ...record, schoolId });
    }
  }
  const legacyProfile = legacy.profiles?.[schoolId];
  const serverHeaderEmpty = !Object.values(account.profile).some((value) => String(value ?? "").trim());
  if (legacyProfile && serverHeaderEmpty) {
    const patch: Partial<SchoolFormDetails> = {};
    for (const key of [
      "division",
      "cityMunicipalityBarangay",
      "schoolIdNumber",
      "principal",
      "focalPerson",
      "dateStartFeeding",
      "lastMileSchool",
    ] as (keyof SchoolFormDetails)[]) {
      const value = legacyProfile[key];
      if (String(value ?? "").trim()) patch[key] = value as never;
    }
    if (Object.keys(patch).length > 0) saveProfile(schoolId, patch);
  }
}

// ── Writing back ──────────────────────────────────────────────────────────────

/** Keep a failed write visible instead of pretending it was saved. */
function reportFailure(err: unknown, what: string) {
  const message = err instanceof Error ? err.message : String(err);
  set({ syncError: `${what} was not saved to the division server: ${message}` });
}

function ok() {
  if (state.syncError) set({ syncError: null });
}

function patchProfile(schoolId: string, patch: Partial<TeacherProfile>) {
  const existing = state.profiles[schoolId];
  if (!existing) return;
  const next: TeacherProfile = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  set({
    profiles: { ...state.profiles, [schoolId]: next },
    accounts: state.accounts.map((a) => (a.schoolId === schoolId ? next : a)),
  });
}

/** Save profile edits (the school information block on the SBFP forms). */
export function saveProfile(schoolId: string, patch: Partial<TeacherProfile>) {
  if (!state.profiles[schoolId] && !state.account?.schoolId) return;
  const target = schoolId;
  patchProfile(target, patch);
  if (state.account?.schoolId === target) {
    set({
      account: {
        ...state.account,
        profile: { ...state.account.profile, ...patch } as SchoolFormDetails,
        ...(patch.teacherName === undefined ? {} : { fullName: patch.teacherName }),
        ...(patch.position === undefined ? {} : { position: patch.position }),
        ...(patch.contact === undefined ? {} : { contact: patch.contact }),
      },
    });
  }
  const header: Partial<SchoolFormDetails> = {};
  for (const key of [
    "division",
    "cityMunicipalityBarangay",
    "schoolIdNumber",
    "principal",
    "focalPerson",
    "dateStartFeeding",
    "lastMileSchool",
  ] as (keyof SchoolFormDetails)[]) {
    if (patch[key] !== undefined) header[key] = patch[key] as never;
  }
  if (Object.keys(header).length === 0) return;
  void saveSchoolHeader({ data: { schoolId: target, patch: header } })
    .then(ok)
    .catch((err) => reportFailure(err, "The school information"));
}

export function addRecord(record: Student) {
  set({ records: [record, ...state.records] });
  void saveLearnerRecord({ data: { schoolId: record.schoolId, record } })
    .then(ok)
    .catch((err) => reportFailure(err, "The learner record"));
}

export function updateRecord(id: string, patch: Partial<Student>) {
  const next = state.records.map((r) => (r.id === id ? { ...r, ...patch } : r));
  set({ records: next });
  const record = next.find((r) => r.id === id);
  if (!record) return;
  void saveLearnerRecord({ data: { schoolId: record.schoolId, record } })
    .then(ok)
    .catch((err) => reportFailure(err, "The learner record"));
}

export function removeRecord(id: string) {
  const record = state.records.find((r) => r.id === id);
  set({ records: state.records.filter((r) => r.id !== id) });
  if (!record) return;
  void removeLearnerRecord({ data: { id } })
    .then(ok)
    .catch((err) => reportFailure(err, "The learner record"));
}

export function sendFeedback(entry: SchoolFeedback) {
  set({ feedbacks: [entry, ...state.feedbacks] });
  void sendSchoolFeedback({ data: { schoolId: entry.schoolId, entry } })
    .then(ok)
    .catch((err) => reportFailure(err, "The feedback"));
}

/** The Division Office's side of the loop: acknowledge / resolve and reply. */
export function updateTeacherFeedback(
  id: string,
  patch: Partial<Pick<SchoolFeedback, "status" | "response">>,
) {
  set({
    feedbacks: state.feedbacks.map((f) => (f.id === id ? { ...f, ...patch } : f)),
  });
  void replyToFeedback({ data: { id, ...patch } })
    .then(ok)
    .catch((err) => reportFailure(err, "The reply"));
}

/** Test/QA hook: drop everything, as if the browser were new. */
export function resetTeacherStore() {
  resetWorkspace();
}
