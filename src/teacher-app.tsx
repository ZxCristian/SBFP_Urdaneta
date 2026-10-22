/**
 * The teacher website — `/teacher`.
 *
 * The school's side of the SBFP, deliberately a different product from the
 * district console: one school signs in (one teacher per school), keeps the
 * school information the district prints on the SBFP forms, encodes learner
 * records, and sends feedback up to the district office.
 *
 * Everything it writes goes through `src/lib/sbfp-store.ts`, which the district
 * console reads back — a record encoded here shows up in the district's Student
 * Records and Summary Table, the profile here is the school's form header, and
 * feedback sent here lands in the district's Feedbacks feed with the district's
 * reply coming back onto the same card.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  BMI_STATUSES,
  EMPTY_STUDENT,
  FEEDBACK_CATEGORIES,
  HFA_STATUSES,
  INIT_ES,
  INIT_HS,
  PERIODS,
  SPED_SCHOOL_NAME,
  calcBMI,
  classifyBMI,
  classifyBeneficiary,
  classifyHFA,
  computeAge,
  getGrades,
  shortDate,
  sortRecords,
  uniqueCount,
} from "@/lib/sbfp-shared";
// Type-only: erased at build time, so ExcelJS stays out of the initial bundle.
import type { SummaryMatrixRow } from "@/lib/sbfp-export";
import type {
  BMIStatus,
  FeedbackCategory,
  GradeLevel,
  HFAStatus,
  Period,
  School,
  SchoolFeedback,
  SchoolFormDetails,
  Sex,
  Student,
  YesNo,
} from "@/lib/sbfp-shared";
import {
  REQUIRED_PROFILE_FIELDS,
  activeProfile,
  addRecord,
  newFeedbackId,
  newRecordId,
  profileStatus,
  removeRecord,
  saveProfile,
  sendFeedback,
  updateRecord,
  useTeacherStore,
} from "@/lib/sbfp-store";
import type { TeacherProfile } from "@/lib/sbfp-store";
import { syncWorkspace } from "@/lib/sbfp-store";
import { useAccess } from "@/lib/use-access";
import type { Access } from "@/lib/use-access";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { UserButton } from "@/lib/auth/gates";
import { authClient } from "@/lib/auth/client";
import { signInErrorMessage } from "@/lib/auth/sign-in-error";
import { changeOwnPassword } from "@/lib/sbfp-api";
import { MIN_PASSWORD_LENGTH } from "@/lib/sbfp-credentials";

/** The 58 Urdaneta City schools, by name, exactly as the district console lists them. */
const SCHOOLS: School[] = [...INIT_ES, ...INIT_HS].sort((a, b) => a.name.localeCompare(b.name));
const SCHOOL_BY_ID = new Map(SCHOOLS.map(s => [s.id, s]));

// ── Look: the school's own site — warm paper, DepEd navy and gold, soft cards ──
const C = {
  bg: "#f3f1eb",
  surface: "#ffffff",
  surface2: "#f8f6f0",
  border: "#e0dccf",
  border2: "#cfc9b8",
  text: "#1b2430",
  sub: "#5a6472",
  dim: "#8a939f",
  navy: "#123a6b",
  navySoft: "#e7edf6",
  gold: "#a9761a",
  goldSoft: "#fbf3e2",
  good: "#1c7a4a",
  goodSoft: "#e6f3ec",
  warn: "#a2580a",
  danger: "#b3261e",
  dangerSoft: "#fbecea",
  radius: 14,
};

const font = "'Outfit', system-ui, sans-serif";
const mono = "'JetBrains Mono', monospace";

const label: CSSProperties = {
  display: "block",
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: C.dim,
  marginBottom: 6,
  fontWeight: 600,
};

const control: CSSProperties = {
  width: "100%",
  fontSize: 14,
  padding: "10px 12px",
  borderRadius: 9,
  border: `1px solid ${C.border2}`,
  background: C.surface,
  color: C.text,
  fontFamily: font,
  outline: "none",
};

type Tab = "overview" | "profile" | "entry" | "records" | "summary" | "feedback";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "profile", label: "My Profile", icon: "◉" },
  { id: "entry", label: "Data Entry", icon: "✎" },
  { id: "records", label: "My Records", icon: "☰" },
  { id: "summary", label: "Summary Table", icon: "≡" },
  { id: "feedback", label: "Feedback", icon: "✉" },
];

// ── Small building blocks ─────────────────────────────────────────────────────

function Card({
  children,
  title,
  subtitle,
  action,
  pad = 22,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  pad?: number;
}) {
  return (
    <section
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: C.radius,
        padding: pad,
        boxShadow: "0 1px 2px rgba(27,36,48,0.04)",
      }}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            {title && <h2 style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{title}</h2>}
            {subtitle && <p style={{ fontSize: 12, color: C.sub, marginTop: 3, maxWidth: 620 }}>{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

function Field({
  text,
  required,
  hint,
  children,
}: {
  text: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span style={label}>
        {text}
        {required && <span style={{ color: C.danger }}> *</span>}
      </span>
      {children}
      {hint && (
        <span style={{ display: "block", fontSize: 11, color: C.dim, marginTop: 5 }}>{hint}</span>
      )}
    </label>
  );
}

function Pill({ text, tone = "navy" }: { text: string; tone?: "navy" | "gold" | "good" | "warn" | "danger" | "muted" }) {
  const palette: Record<string, { bg: string; fg: string }> = {
    navy: { bg: C.navySoft, fg: C.navy },
    gold: { bg: C.goldSoft, fg: C.gold },
    good: { bg: C.goodSoft, fg: C.good },
    warn: { bg: "#fdf1e3", fg: C.warn },
    danger: { bg: C.dangerSoft, fg: C.danger },
    muted: { bg: C.surface2, fg: C.sub },
  };
  const p = palette[tone];
  return (
    <span
      style={{
        background: p.bg,
        color: p.fg,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "3px 8px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function Stat({ text, value, hint, accent }: { text: string; value: string | number; hint?: string; accent?: boolean }) {
  return (
    <div
      style={{
        background: accent ? C.navy : C.surface,
        border: `1px solid ${accent ? C.navy : C.border}`,
        borderRadius: C.radius,
        padding: "16px 18px",
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: accent ? "#b9c9e0" : C.dim, fontWeight: 600 }}>
        {text}
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, fontFamily: mono, color: accent ? "#fff" : C.text, marginTop: 6, lineHeight: 1.1 }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: 11, color: accent ? "#c9d6e8" : C.dim, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Bar({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{ background: C.surface2, borderRadius: 999, height: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
      <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? C.good : C.navy, transition: "width .3s ease" }} />
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          title={`${n} of 5`}
          aria-label={`${n} of 5`}
          style={{ background: "none", border: "none", padding: 0, fontSize: 24, lineHeight: 1, color: n <= value ? C.gold : C.border2, cursor: "pointer" }}
        >
          ★
        </button>
      ))}
      <span style={{ fontSize: 12, color: C.sub, marginLeft: 6 }}>{value} of 5</span>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span style={{ color: C.gold, fontSize: 13, letterSpacing: 1 }} title={`${value} of 5`}>
      {"★".repeat(Math.round(value))}
      <span style={{ color: C.border2 }}>{"★".repeat(Math.max(0, 5 - Math.round(value)))}</span>
    </span>
  );
}

function YesNoToggle({ value, onChange }: { value: YesNo; onChange: (v: YesNo) => void }) {
  return (
    <div className="flex gap-2">
      {(["Yes", "No"] as YesNo[]).map(v => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(value === v ? "" : v)}
          className="flex-1"
          style={{
            padding: "7px 0",
            fontSize: 13,
            borderRadius: 8,
            border: `1px solid ${value === v ? C.navy : C.border2}`,
            background: value === v ? C.navySoft : C.surface,
            color: value === v ? C.navy : C.sub,
            fontWeight: value === v ? 600 : 400,
            cursor: "pointer",
          }}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function Button({
  children,
  onClick,
  tone = "primary",
  disabled,
  small,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "primary" | "ghost" | "gold" | "danger";
  disabled?: boolean;
  small?: boolean;
  type?: "button" | "submit";
}) {
  const tones: Record<string, CSSProperties> = {
    primary: { background: C.navy, color: "#fff", borderColor: C.navy },
    gold: { background: C.gold, color: "#fff", borderColor: C.gold },
    ghost: { background: C.surface, color: C.sub, borderColor: C.border2 },
    danger: { background: C.dangerSoft, color: C.danger, borderColor: "#efcfcb" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...tones[tone],
        border: `1px solid ${tones[tone].borderColor as string}`,
        borderRadius: 9,
        padding: small ? "6px 11px" : "10px 18px",
        fontSize: small ? 12 : 13,
        fontWeight: 600,
        fontFamily: font,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

/** The two status colours, shared by the records list and the feedback list. */
const bmiTone = (s: string): "good" | "warn" | "danger" | "gold" | "muted" =>
  s === "Normal" ? "good" : s === "Severely Wasted" ? "danger" : s === "Wasted" ? "warn" : s ? "gold" : "muted";

// ── Boot ──────────────────────────────────────────────────────────────────────
// Shown for the one tick before the saved school is read back, so a reload
// never flashes the sign-in screen at a teacher who is already registered.
function Boot() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font, color: C.text, display: "grid", placeItems: "center" }}>
      <div className="text-center">
        <img src="/school-health-wheel.svg" alt="" width={42} height={42} style={{ margin: "0 auto", opacity: 0.45 }} />
        <p style={{ fontSize: 13, color: C.dim, marginTop: 14 }}>Opening your school…</p>
      </div>
    </div>
  );
}

// ── Sign in ───────────────────────────────────────────────────────────────────
// Accounts are issued by the Division Office, so there is nothing to register
// here: a teacher signs in with the email and the temporary password she was
// handed, and lands on her own school.

function TeacherSignIn({ access, notice }: { access: Access; notice?: ReactNode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Enter the email and password the Division Office gave you.");
      return;
    }
    setBusy(true);
    try {
      const { error: authError } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (authError) {
        const message = signInErrorMessage(authError);
        setError(
          message === "That email and password do not match an account."
            ? `${message} Ask the Division Office for a new temporary password.`
            : message,
        );
        return;
      }
      void syncWorkspace(email.trim().toLowerCase(), true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto px-5 py-8 md:py-12" style={{ maxWidth: 1080 }}>
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 items-start">
        {/* On a phone the sign-in card comes first, so a teacher who already has
            her account does not scroll past the introduction to reach it. */}
        <div className="order-2 lg:order-1">
          <div className="flex items-center gap-3">
            <img src="/school-health-wheel.svg" alt="" width={46} height={46} />
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>
                Department of Education
              </div>
              <div style={{ fontSize: 13, color: C.sub }}>Urdaneta City Schools Division Office</div>
            </div>
          </div>
          <h1 style={{ fontSize: "clamp(26px, 7vw, 34px)", lineHeight: 1.15, fontWeight: 600, marginTop: 22, color: C.text }}>
            SBFP Teacher Portal
          </h1>
          <p style={{ fontSize: 15, color: C.sub, marginTop: 12, maxWidth: 520, lineHeight: 1.65 }}>
            Your school's own desk for the School-Based Feeding Program: the school information the division prints on
            the SBFP forms, the learner records you encode, and the feedback the district office answers.
          </p>

          <div className="flex flex-col gap-3 mt-7">
            {[
              ["1", "Sign in with your school's account", "The Division Office issues one account per school — the email and temporary password they gave you."],
              ["2", "Fill in the school information", "Principal, feeding focal person, School ID, city/municipality/barangay — printed on Form 1A and Form 2."],
              ["3", "Encode learners and report", "Weights and heights with automatic WHO classification, plus feedback straight to the district."],
            ].map(([n, title, body]) => (
              <div key={n} className="flex gap-3 items-start">
                <span
                  style={{
                    width: 26,
                    height: 26,
                    flex: "0 0 26px",
                    borderRadius: 999,
                    background: C.navySoft,
                    color: C.navy,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {n}
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</div>
                  <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2, lineHeight: 1.5 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-7"
            style={{ fontSize: 12.5, color: C.sub, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", maxWidth: 520, lineHeight: 1.6 }}
          >
            <strong style={{ color: C.text }}>No account yet?</strong> Accounts are issued by the Division Office — ask
            the SBFP coordinator for your school's sign-in email and temporary password.
          </div>

          <div style={{ fontSize: 12, color: C.dim, marginTop: 18 }}>
            {SCHOOLS.length} schools in the division · one account per school
          </div>
        </div>

        <div className="flex flex-col gap-4 order-1 lg:order-2">
          {notice}

          <Card
            title="Sign in to your school"
            subtitle="Use the email and temporary password the Division Office issued."
          >
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <Field text="Email">
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="teacher@depedurdaneta.gov.ph"
                  style={control}
                />
              </Field>
              <Field text="Password">
                <div className="flex gap-2">
                  <input
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••"
                    style={control}
                  />
                  <Button small tone="ghost" type="button" onClick={() => setShow((v) => !v)}>
                    {show ? "Hide" : "Show"}
                  </Button>
                </div>
              </Field>
              {error && (
                <p style={{ fontSize: 12.5, color: C.danger, background: C.dangerSoft, border: `1px solid #f0d3d0`, borderRadius: 9, padding: "9px 11px", lineHeight: 1.5 }}>
                  {error}
                </p>
              )}
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
                <span style={{ fontSize: 11.5, color: C.dim }}>
                  First sign-in? Change the password in My Profile → Account.
                </span>
              </div>
            </form>
          </Card>

          <p style={{ fontSize: 11.5, color: C.dim, lineHeight: 1.6 }}>
            Everything you encode here is saved to the division's records server, so the district office reads the same
            figures you do — on any device you sign in from.
          </p>
        </div>
      </div>
    </div>
  );
}

/** A signed-in account that has been put on hold by the Division Office. */
function AccountOnHold({ access }: { access: Access }) {
  return (
    <div className="mx-auto px-5 py-10" style={{ maxWidth: 720 }}>
      <Card title="This account is on hold">
        <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.65 }}>
          The Division Office has put <strong style={{ color: C.text }}>{access.email}</strong> on hold, so this school's
          records are read-only for now. Nothing has been deleted — ask the SBFP coordinator to lift the hold and your
          work will be back.
        </p>
        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <UserButton />
        </div>
      </Card>
    </div>
  );
}

/** Shown above the sign-in card when the session holds no school's account. */
function NoAccountNotice({ access }: { access: Access }) {
  return (
    <Card title={access.status === "admin" ? "You're signed in as the Division Office" : "This session has no school account"}>
      <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.65 }}>
        {access.status === "admin" ? (
          <>
            <strong style={{ color: C.text }}>{access.email}</strong> holds the Division Office account, not a school's.
            Issue each school its account from the Division Console's Teacher Accounts — or sign in below with a
            school's own account to work on that school.
          </>
        ) : (
          <>
            You are signed in as <strong style={{ color: C.text }}>{access.email}</strong>, but no Teacher Portal account
            has been issued for that email address. Sign in below with the account the Division Office gave your school.
          </>
        )}
      </p>
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <a href="/" style={{ textDecoration: "none" }}>
          <Button small>Division Console →</Button>
        </a>
        <UserButton />
      </div>
    </Card>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────

function Overview({ profile, school, go }: { profile: TeacherProfile; school: School; go: (t: Tab) => void }) {
  const store = useTeacherStore();
  const status = profileStatus(profile);
  const mine = useMemo(
    () => store.records.filter(r => r.schoolId === school.id),
    [store.records, school.id],
  );
  const myFeedback = useMemo(
    () => store.feedbacks.filter(f => f.schoolId === school.id),
    [store.feedbacks, school.id],
  );

  const learners = uniqueCount(mine);
  const perPeriod = PERIODS.map(p => ({ p, n: mine.filter(r => r.period === p).length }));
  const replied = myFeedback.filter(f => f.response).length;
  const open = myFeedback.filter(f => f.status !== "Resolved").length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile.teacherName.split(",")[1]?.trim().split(" ")[0] || profile.teacherName.split(" ")[0];

  const peakPeriod = Math.max(1, ...perPeriod.map(p => p.n));
  const todos: { done: boolean; text: string; hint: string; tab: Tab }[] = [
    {
      done: status.complete,
      text: "Complete the school profile",
      hint: status.complete ? "All four required fields are filled in" : `Missing: ${status.missing.map(([, l]) => l).join(", ")}`,
      tab: "profile",
    },
    {
      done: learners > 0,
      text: "Encode learner records",
      hint: learners > 0 ? `${learners} learner${learners === 1 ? "" : "s"} encoded` : "Start with the Baseline measurements",
      tab: "entry",
    },
    {
      done: myFeedback.length > 0,
      text: "Send feedback to the district",
      hint: myFeedback.length > 0 ? `${myFeedback.length} sent` : "Tell the district how feeding is going",
      tab: "feedback",
    },
    {
      done: replied > 0,
      text: "Read the district's reply",
      hint: replied > 0 ? `${replied} repl${replied === 1 ? "y" : "ies"} waiting` : "No reply yet",
      tab: "feedback",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Card pad={24}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>
              {greeting}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 600, marginTop: 6, color: C.text }}>{firstName}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span style={{ fontSize: 14, color: C.sub }}>{school.name}</span>
              <Pill text={school.type === "Elementary" ? "Elementary" : "High School"} tone={school.type === "Elementary" ? "navy" : "gold"} />
            </div>
          </div>
          <div style={{ minWidth: 220, flex: "1 1 220px", maxWidth: 320 }}>
            <div className="flex items-baseline justify-between mb-2">
              <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.dim, fontWeight: 600 }}>
                School profile
              </span>
              <span style={{ fontSize: 13, fontFamily: mono, color: status.complete ? C.good : C.warn }}>
                {status.done}/{status.total}
              </span>
            </div>
            <Bar done={status.done} total={status.total} />
            {!status.complete && (
              <button
                onClick={() => go("profile")}
                style={{ marginTop: 10, fontSize: 12.5, color: C.navy, fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                Finish my profile →
              </button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat text="Learners encoded" value={learners} hint="unique learners" accent />
        <Stat text="Records" value={mine.length} hint="across all periods" />
        <Stat text="Feedback sent" value={myFeedback.length} hint={open ? `${open} still open` : "all closed"} />
        <Stat text="District replies" value={replied} hint={replied ? "read them below" : "none yet"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-5">
        <Card title="What to do next">
          <div className="flex flex-col">
            {todos.map((td, i) => (
              <button
                key={td.text}
                onClick={() => go(td.tab)}
                className="flex items-start gap-3 text-left py-3"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}`, background: "none", cursor: "pointer" }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    flex: "0 0 20px",
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    background: td.done ? C.goodSoft : C.surface2,
                    color: td.done ? C.good : C.dim,
                    border: `1px solid ${td.done ? "#c6e2d3" : C.border2}`,
                  }}
                >
                  {td.done ? "✓" : i + 1}
                </span>
                <span className="min-w-0">
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 500, color: td.done ? C.sub : C.text, textDecoration: td.done ? "none" : "none" }}>
                    {td.text}
                  </span>
                  <span style={{ display: "block", fontSize: 11.5, color: C.dim, marginTop: 2 }}>{td.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Measurements on file" subtitle="What the district's Summary Table pulls for this school.">
          <div className="flex flex-col gap-3">
            {perPeriod.map(({ p, n }) => (
              <div key={p}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span style={{ fontSize: 12.5, color: C.text, fontWeight: 500 }}>{p}</span>
                  <span style={{ fontSize: 12, fontFamily: mono, color: n ? C.navy : C.dim }}>{n}</span>
                </div>
                <Bar done={n} total={peakPeriod} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 11.5, color: C.dim }}>Latest weighing on file</span>
              <span style={{ fontSize: 12, fontFamily: mono, color: C.text }}>
                {sortRecords(mine)[0]?.dateOfWeighing || "—"}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card title="School information on the SBFP forms" subtitle="These are printed on Form 1A and Form 2 by the district office." action={<Button small tone="ghost" onClick={() => go("profile")}>Edit</Button>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {REQUIRED_PROFILE_FIELDS.map(([key, text]) => {
            const value = String(profile[key] ?? "").trim();
            return (
              <div key={key}>
                <div style={{ ...label, marginBottom: 3 }}>{text}</div>
                <div style={{ fontSize: 14, color: value ? C.text : C.dim, fontWeight: value ? 500 : 400 }}>
                  {value || "Not filled in yet"}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────

function ProfileScreen({ profile, school }: { profile: TeacherProfile; school: School }) {
  const [form, setForm] = useState<TeacherProfile>(profile);
  const [saved, setSaved] = useState(false);

  const status = profileStatus(form);
  const set = <K extends keyof TeacherProfile>(key: K, value: TeacherProfile[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const save = () => {
    const { schoolId: _id, ...patch } = form;
    saveProfile(school.id, patch);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const detailFields: [keyof SchoolFormDetails, string, string][] = [
    ["principal", "Name of Principal", "Printed on both SBFP forms."],
    ["focalPerson", "Name of Feeding Focal Person", "The signatory on the printed forms."],
    ["schoolIdNumber", "School ID Number", "The DepEd school ID of this school."],
    ["cityMunicipalityBarangay", "City/Municipality/Barangay", "e.g. Urdaneta City, Barangay San Vicente East."],
    ["division", "Division", "Schools Division Office."],
    ["dateStartFeeding", "Date of Start of Feeding", "Form 2 field."],
  ];

  return (
    <div className="flex flex-col gap-5">
      <Card
        title="My Profile"
        subtitle={`Registered to ${school.name}. Saving here updates the school information the district prints on the SBFP forms.`}
        action={
          <div className="flex items-center gap-3">
            {saved && <span style={{ fontSize: 12, color: C.good, fontWeight: 600 }}>✓ Saved</span>}
            <Button onClick={save} disabled={!status.complete && !form.teacherName.trim()}>Save profile</Button>
          </div>
        }
      >
        <div className="flex items-center gap-3 flex-wrap">
          <Pill text={school.type === "Elementary" ? "Elementary" : "High School"} tone={school.type === "Elementary" ? "navy" : "gold"} />
          <Pill text={`${status.done}/${status.total} required fields`} tone={status.complete ? "good" : "warn"} />
          {profile.updatedAt && (
            <span style={{ fontSize: 11.5, color: C.dim }}>Last updated {shortDate(profile.updatedAt.slice(0, 10))}</span>
          )}
        </div>
        {!status.complete && (
          <p style={{ fontSize: 12.5, color: C.warn, marginTop: 12 }}>
            Still needed: {status.missing.map(([, l]) => l).join(" · ")}
          </p>
        )}
      </Card>

      <Card title="Teacher" subtitle="Who handles SBFP for this school — one teacher per school.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field text="Your name" required>
            <input value={form.teacherName} onChange={e => set("teacherName", e.target.value)} style={control} />
          </Field>
          <Field text="Position / designation">
            <input value={form.position} onChange={e => set("position", e.target.value)} style={control} />
          </Field>
          <Field text="Contact number or email">
            <input value={form.contact} onChange={e => set("contact", e.target.value)} style={control} />
          </Field>
        </div>
      </Card>

      <Card title="School information" subtitle="The header block of the SBFP forms. The four marked fields are required by the district.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {detailFields.map(([key, text, hint], i) => {
            const required = i < 4;
            if (key === "dateStartFeeding") {
              return (
                <Field key={key} text={text} hint={hint}>
                  <input type="date" value={form.dateStartFeeding} onChange={e => set("dateStartFeeding", e.target.value)} style={control} />
                </Field>
              );
            }
            return (
              <Field key={key} text={text} required={required} hint={hint}>
                <input value={String(form[key] ?? "")} onChange={e => set(key, e.target.value)} style={control} />
              </Field>
            );
          })}
          <Field text="Last Mile School" hint="Form 2 field — printed as ___Y ___N.">
            <YesNoToggle value={form.lastMileSchool} onChange={v => set("lastMileSchool", v)} />
          </Field>
        </div>
        <div className="flex items-center gap-3 mt-6 flex-wrap">
          <Button onClick={save}>Save profile</Button>
          {saved && <span style={{ fontSize: 12, color: C.good, fontWeight: 600 }}>✓ Saved — the district office sees this now</span>}
        </div>
      </Card>

      <AccountCard profile={profile} />
    </div>
  );
}

/**
 * The school's sign-in account: who it is for, and the password change a teacher
 * should make after her first sign-in with the temporary one the Division Office
 * handed her.
 */
function AccountCard({ profile }: { profile: TeacherProfile }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const needsCurrent = !profile.tempPassword;

  const submit = async () => {
    setError("");
    if (next.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (next !== again) {
      setError("The two new passwords do not match.");
      return;
    }
    setBusy(true);
    const result = await changeOwnPassword({
      data: { currentPassword: needsCurrent ? current : undefined, newPassword: next },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setCurrent("");
    setNext("");
    setAgain("");
    setDone(true);
    void syncWorkspace(profile.email, true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <Card
      title="Account"
      subtitle="Issued by the Division Office — one account per school. This is what you sign in with on any device."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <span style={label}>Sign-in email</span>
          <div style={{ fontFamily: mono, fontSize: 13, color: C.text, wordBreak: "break-all" }}>{profile.email}</div>
        </div>
        <div>
          <span style={label}>School on this account</span>
          <div style={{ fontSize: 13.5, color: C.text }}>{profile.schoolId.toUpperCase()}</div>
        </div>
        <div>
          <span style={label}>Status</span>
          <div className="flex items-center gap-2">
            <Pill text={profile.status === "active" ? "Active" : "On hold"} tone={profile.status === "active" ? "good" : "warn"} />
            {profile.tempPassword && <Pill text="Temporary password" tone="gold" />}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>Change your password</div>
        <p style={{ fontSize: 12, color: C.dim, marginTop: 4, lineHeight: 1.55 }}>
          {needsCurrent
            ? "Choose something only you know. If you forget it, the Division Office can issue a new temporary one."
            : "You are still using the temporary password the Division Office gave you — replace it with your own."}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {needsCurrent && (
            <Field text="Current password">
              <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} style={control} />
            </Field>
          )}
          <Field text="New password">
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} style={control} />
          </Field>
          <Field text="Repeat new password">
            <input type="password" value={again} onChange={(e) => setAgain(e.target.value)} style={control} />
          </Field>
        </div>
        {error && <p style={{ fontSize: 12.5, color: C.danger, marginTop: 12 }}>{error}</p>}
        <div className="flex items-center gap-3 mt-5 flex-wrap">
          <Button onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Change password"}
          </Button>
          {done && <span style={{ fontSize: 12, color: C.good, fontWeight: 600 }}>✓ Password changed</span>}
          <span style={{ fontSize: 11.5, color: C.dim }}>
            A different teacher taking over this school gets the account changed from the Division Office.
          </span>
        </div>
      </div>
    </Card>
  );
}

// ── Data entry ────────────────────────────────────────────────────────────────

function DataEntry({
  school,
  editing,
  clearEditing,
  goRecords,
}: {
  school: School;
  editing: Student | null;
  clearEditing: () => void;
  goRecords: () => void;
}) {
  const [period, setPeriod] = useState<Period | null>(editing?.period ?? null);
  const [form, setForm] = useState<Omit<Student, "id">>(() =>
    editing ? { ...editing } : EMPTY_STUDENT(school.id, ""),
  );
  const [saved, setSaved] = useState(false);
  const [periodError, setPeriodError] = useState(false);
  const [nameError, setNameError] = useState(false);
  /**
   * A status the teacher picked by hand outranks the WHO auto-classification for
   * this record, while a status that was only ever computed is cleared when the
   * measurements no longer support it.
   */
  const manualStatus = useRef({ bmi: false, hfa: false });
  const resetManualStatus = () => { manualStatus.current = { bmi: false, hfa: false }; };

  // Opening a row for editing from My Records repopulates the form with it.
  useEffect(() => {
    resetManualStatus();
    if (editing) {
      setForm({ ...editing });
      setPeriod(editing.period);
      setPeriodError(false);
      setNameError(false);
    }
  }, [editing?.id]);

  const grades = getGrades(school);

  /**
   * Same rules as the district console's Data Entry: ages from the date of
   * birth, BMI from weight and height, WHO 2007 BMI/HFA status and the
   * primary/secondary beneficiary class all follow the measurements, and any of
   * them can still be overridden by hand.
   */
  const set = (key: keyof Omit<Student, "id">, value: string) => {
    setNameError(false);
    if (key === "bmiStatus") manualStatus.current.bmi = true;
    if (key === "hfaStatus") manualStatus.current.hfa = true;
    setForm(f => {
      const next = { ...f, [key]: value };
      if (key === "dateOfBirth") {
        const age = computeAge(value);
        next.ageYears = age.years;
        next.ageMonths = age.months;
      }
      const weight = key === "weight" ? value : f.weight;
      const height = key === "height" ? value : f.height;
      const measuresChanged = key === "weight" || key === "height";
      if (measuresChanged) next.bmi = calcBMI(weight, height);
      // The computed value (even an empty one) replaces the old status, so a
      // cleared weight or an out-of-range age cannot leave a stale "Normal".
      if ((measuresChanged || key === "dateOfBirth" || key === "sex" || key === "ageYears") && !manualStatus.current.bmi) {
        next.bmiStatus = classifyBMI(next.bmi || calcBMI(weight, height), next.ageYears, next.sex);
      }
      if ((key === "height" || key === "dateOfBirth" || key === "sex" || key === "ageYears") && !manualStatus.current.hfa) {
        next.hfaStatus = classifyHFA(height, next.ageYears, next.sex);
      }
      next.nutritionalStatus = next.bmiStatus;
      if (key !== "classificationOfBeneficiary") {
        const auto = classifyBeneficiary(next.gradeLevel, next.bmiStatus, next.hfaStatus);
        if (auto) next.classificationOfBeneficiary = auto;
      }
      return next;
    });
  };

  const choosePeriod = (p: Period) => {
    setPeriod(p);
    setPeriodError(false);
    setForm(f => ({ ...f, period: p }));
  };

  const save = () => {
    if (!period) {
      setPeriodError(true);
      return;
    }
    if (!form.name.trim()) {
      setNameError(true);
      return;
    }
    if (editing) {
      updateRecord(editing.id, { ...form, period });
      clearEditing();
      goRecords();
      return;
    }
    addRecord({ ...form, period, id: newRecordId() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setPeriod(null);
    resetManualStatus();
    setForm(EMPTY_STUDENT(school.id, ""));
  };

  const clear = () => {
    setPeriod(null);
    setPeriodError(false);
    setNameError(false);
    resetManualStatus();
    setForm(EMPTY_STUDENT(school.id, ""));
  };

  const ageYears = parseInt(form.ageYears) || 0;

  /** Why the WHO auto-status cannot be worked out yet, or null when it can. */
  const autoHint = (() => {
    if (!form.weight || !form.height) return null;
    if (!form.sex) return "Auto status needs the learner's sex — the WHO 2007 tables differ for boys and girls.";
    if (!form.dateOfBirth) return "Auto status needs the date of birth — the WHO 2007 tables start at age 5.";
    if (ageYears < 5 || ageYears > 19) return `Age ${ageYears} is outside the WHO 2007 tables (ages 5–19), so set BMI and HFA status by hand.`;
    return null;
  })();

  return (
    <div className="flex flex-col gap-5">
      <Card
        title={editing ? "Edit learner record" : "Data Entry"}
        subtitle={school.name}
        action={
          <div className="flex items-center gap-3">
            {saved && <span style={{ fontSize: 12, color: C.good, fontWeight: 600 }}>✓ Saved — encode another</span>}
            <Button tone="ghost" small onClick={goRecords}>Go to My Records →</Button>
          </div>
        }
      >
        <div>
          <span style={label}>Measurement period <span style={{ color: C.danger }}>*</span></span>
          <div className="flex gap-2 flex-wrap">
            {PERIODS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => choosePeriod(p)}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  borderRadius: 9,
                  border: `1px solid ${period === p ? C.navy : C.border2}`,
                  background: period === p ? C.navy : C.surface,
                  color: period === p ? "#fff" : C.sub,
                  fontWeight: period === p ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
          </div>
          {periodError && <p style={{ fontSize: 12, color: C.danger, marginTop: 8 }}>Choose Baseline, Midline or Endline first.</p>}
        </div>
      </Card>

      <Card title="Learner information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Field text="Full name" required hint={nameError ? "The learner's name is required." : "Last name, First name Middle name"}>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="dela Cruz, Juan M." style={control} />
            </Field>
          </div>
          <Field text="Sex">
            <div className="flex gap-2">
              {(["M", "F"] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("sex", s)}
                  className="flex-1"
                  style={{
                    padding: "9px 0",
                    fontSize: 13,
                    borderRadius: 9,
                    border: `1px solid ${form.sex === s ? C.navy : C.border2}`,
                    background: form.sex === s ? C.navySoft : C.surface,
                    color: form.sex === s ? C.navy : C.sub,
                    fontWeight: form.sex === s ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {s === "M" ? "Male" : "Female"}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Field text="Grade level">
            <select value={form.gradeLevel} onChange={e => set("gradeLevel", e.target.value)} style={{ ...control, cursor: "pointer" }}>
              <option value="">— Select —</option>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field text="Date of birth">
            <input type="date" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} style={control} />
          </Field>
          <Field text="Date of weighing">
            <input type="date" value={form.dateOfWeighing} onChange={e => set("dateOfWeighing", e.target.value)} style={control} />
          </Field>
          <Field text="School year">
            <input value={form.sy} onChange={e => set("sy", e.target.value)} style={control} />
          </Field>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Field text="Age — years (auto)">
            <input readOnly value={form.ageYears} placeholder="—" style={{ ...control, fontFamily: mono, background: C.surface2, color: C.navy }} />
          </Field>
          <Field text="Age — months (auto)">
            <input readOnly value={form.ageMonths} placeholder="—" style={{ ...control, fontFamily: mono, background: C.surface2, color: C.navy }} />
          </Field>
        </div>
      </Card>

      <Card title="Measurements" subtitle="BMI and the WHO 2007 statuses are computed for you — override them if the school's own measurement says otherwise.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field text="Weight (kg)">
            <input type="number" step="0.1" min={0} value={form.weight} onChange={e => set("weight", e.target.value)} placeholder="e.g. 24.5" style={control} />
          </Field>
          <Field text="Height (cm)">
            <input type="number" step="0.1" min={0} value={form.height} onChange={e => set("height", e.target.value)} placeholder="e.g. 118.0" style={control} />
          </Field>
          <Field text={`BMI ${ageYears >= 6 ? "(auto)" : "(6 y.o.+)"}`}>
            <input
              value={form.bmi}
              readOnly={ageYears >= 6}
              onChange={e => ageYears < 6 && set("bmi", e.target.value)}
              placeholder="—"
              style={{ ...control, fontFamily: mono, background: ageYears >= 6 ? C.surface2 : C.surface }}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field text="BMI status (WHO 2007)">
            <select value={form.bmiStatus} onChange={e => set("bmiStatus", e.target.value as BMIStatus)} style={{ ...control, cursor: "pointer" }}>
              <option value="">— Select —</option>
              {BMI_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field text="Height-for-age status (WHO 2007)">
            <select value={form.hfaStatus} onChange={e => set("hfaStatus", e.target.value as HFAStatus)} style={{ ...control, cursor: "pointer" }}>
              <option value="">— Select —</option>
              {HFA_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        {autoHint && (!form.bmiStatus || !form.hfaStatus) && (
          <p style={{ fontSize: 11.5, color: C.warn, marginTop: 10, lineHeight: 1.5 }}>{autoHint}</p>
        )}
        <div className="mt-4">
          <span style={label}>Beneficiary classification</span>
          <div className="flex gap-2" style={{ maxWidth: 420 }}>
            {(["Primary", "Secondary"] as const).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => set("classificationOfBeneficiary", c)}
                className="flex-1"
                style={{
                  padding: "9px 0",
                  fontSize: 13,
                  borderRadius: 9,
                  border: `1px solid ${form.classificationOfBeneficiary === c ? C.navy : C.border2}`,
                  background: form.classificationOfBeneficiary === c ? C.navySoft : C.surface,
                  color: form.classificationOfBeneficiary === c ? C.navy : C.sub,
                  fontWeight: form.classificationOfBeneficiary === c ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: C.dim, marginTop: 7 }}>
            Kinder and Grade 1 are Primary. From Grade 2, only Severely Wasted is Primary and Severely Stunted is Secondary.
          </p>
        </div>
      </Card>

      <Card title="Additional information">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {([
            ["Pregnant?", "pregnant"],
            ["With 0–1 year-old child/ren?", "hasYoungChildren"],
            ["Dewormed?", "dewormed"],
            ["Parent's consent for milk?", "parentConsentMilk"],
            ["Participation in 4Ps?", "fourPs"],
            ["SBFP beneficiary in previous years?", "sbfpPreviousYears"],
          ] as [string, keyof Omit<Student, "id">][]).map(([text, key]) => (
            <div key={key as string}>
              <span style={label}>{text}</span>
              <YesNoToggle value={form[key] as YesNo} onChange={v => set(key, v)} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-6 flex-wrap">
          <Button onClick={save}>{editing ? "Update record" : "Save learner record"}</Button>
          {editing ? (
            <Button tone="ghost" onClick={() => { clearEditing(); goRecords(); }}>Cancel</Button>
          ) : (
            <Button tone="ghost" onClick={clear}>Clear form</Button>
          )}
          {saved && <span style={{ fontSize: 12, color: C.good, fontWeight: 600 }}>✓ Saved</span>}
        </div>
      </Card>
    </div>
  );
}

// ── My records ────────────────────────────────────────────────────────────────

function MyRecords({
  school,
  onEdit,
  goEntry,
}: {
  school: School;
  onEdit: (s: Student) => void;
  goEntry: () => void;
}) {
  const store = useTeacherStore();
  const [period, setPeriod] = useState<Period | "All">("All");
  const [q, setQ] = useState("");
  /** The record the teacher asked to delete — nothing is removed until she confirms. */
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);

  const mine = useMemo(
    () => sortRecords(store.records.filter(r => r.schoolId === school.id)),
    [store.records, school.id],
  );
  const needle = q.trim().toLowerCase();
  const visible = mine.filter(r =>
    (period === "All" || r.period === period) &&
    (!needle || `${r.name} ${r.gradeLevel} ${r.bmiStatus} ${r.hfaStatus}`.toLowerCase().includes(needle)),
  );

  return (
    <div className="flex flex-col gap-5">
      <Card
        title="My Records"
        subtitle={`${mine.length} record${mine.length === 1 ? "" : "s"} encoded for ${school.name} · ${uniqueCount(mine)} unique learner${uniqueCount(mine) === 1 ? "" : "s"}`}
        action={<Button small onClick={goEntry}>＋ New learner record</Button>}
      >
        <div className="flex flex-wrap items-center gap-3">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search learner, grade or status…" style={{ ...control, maxWidth: 320 }} />
          <div className="flex gap-2">
            {(["All", ...PERIODS] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p as Period | "All")}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  borderRadius: 999,
                  border: `1px solid ${period === p ? C.navy : C.border2}`,
                  background: period === p ? C.navySoft : C.surface,
                  color: period === p ? C.navy : C.sub,
                  fontWeight: period === p ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {visible.length === 0 ? (
        <Card>
          <p style={{ fontSize: 13.5, color: C.sub }}>
            {mine.length === 0
              ? "No learner records yet. Encode the Baseline measurements first — the district's Summary Table and Analytics read them."
              : "No record matches those filters."}
          </p>
          {mine.length === 0 && <div className="mt-4"><Button onClick={goEntry}>Start Data Entry</Button></div>}
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map(r => (
            <div
              key={r.id}
              className="flex flex-col md:flex-row md:items-center gap-3"
              style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", background: C.surface }}
            >
              <div className="min-w-0 flex-1">
                <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{r.name || "Unnamed learner"}</div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Pill text={r.period} tone={r.period === "Baseline" ? "navy" : r.period === "Midline" ? "warn" : "good"} />
                  {r.bmiStatus && <Pill text={r.bmiStatus} tone={bmiTone(r.bmiStatus)} />}
                  {r.hfaStatus && <Pill text={r.hfaStatus} tone={bmiTone(r.hfaStatus)} />}
                </div>
                <div style={{ fontSize: 11.5, color: C.dim, marginTop: 7 }}>
                  {r.sex === "M" ? "Male" : r.sex === "F" ? "Female" : "Sex not set"} · {r.gradeLevel || "Grade not set"}
                  {r.weight ? ` · ${r.weight} kg` : ""}{r.height ? ` · ${r.height} cm` : ""}
                  {r.dateOfWeighing ? ` · weighed ${r.dateOfWeighing}` : ""}
                  {r.classificationOfBeneficiary ? ` · ${r.classificationOfBeneficiary}` : ""}
                </div>
              </div>
              <div className="flex gap-2 md:justify-end">
                <Button small tone="ghost" onClick={() => onEdit(r)}>Edit</Button>
                <Button small tone="ghost" onClick={() => setPendingDelete(r)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name || "this learner"}'s record?`}
        confirmLabel="Delete record"
        cancelLabel="Keep record"
        palette={{
          surface: C.surface,
          surface2: C.dangerSoft,
          border: C.border2,
          text: C.text,
          sub: C.sub,
          danger: C.danger,
          dangerSoft: C.dangerSoft,
          font,
        }}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeRecord(pendingDelete.id);
          setPendingDelete(null);
        }}
      >
        <strong style={{ color: C.text }}>
          {pendingDelete?.name || "This learner"}
          {pendingDelete?.gradeLevel ? ` · ${pendingDelete.gradeLevel}` : ""}
          {pendingDelete?.period ? ` · ${pendingDelete.period}` : ""}
        </strong>
        <br />
        The measurements, nutritional status and beneficiary details on this record are deleted from {school.name}'s
        records and from the division's records server. <strong style={{ color: C.text }}>This cannot be undone</strong> —
        to keep the learner on file, choose “Keep record” instead.
      </ConfirmDialog>
    </div>
  );
}

// ── Feedback to the district ──────────────────────────────────────────────────

function FeedbackScreen({ profile, school }: { profile: TeacherProfile; school: School }) {
  const store = useTeacherStore();
  const [category, setCategory] = useState<FeedbackCategory>("Feeding Implementation");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [filter, setFilter] = useState<"All" | "New" | "Acknowledged" | "Resolved">("All");

  const mine = useMemo(
    () => store.feedbacks.filter(f => f.schoolId === school.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [store.feedbacks, school.id],
  );
  const visible = filter === "All" ? mine : mine.filter(f => f.status === filter);
  const replies = mine.filter(f => f.response).length;

  const submit = () => {
    if (!message.trim()) return;
    const entry: SchoolFeedback = {
      id: newFeedbackId(),
      schoolId: school.id,
      author: profile.teacherName,
      role: profile.position || "SBFP Feeding Focal Person",
      category,
      rating,
      message: message.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      status: "New",
      origin: "Teacher Portal",
    };
    sendFeedback(entry);
    setMessage("");
    setRating(5);
    setFilter("All");
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  };

  return (
    <div className="flex flex-col gap-5">
      <Card
        title="Feedback to the district office"
        subtitle={`Sent as ${profile.teacherName}${profile.position ? ` · ${profile.position}` : ""} · it appears in the district's Feedbacks feed and their reply comes back here.`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field text="What is this about?">
            <select value={category} onChange={e => setCategory(e.target.value as FeedbackCategory)} style={{ ...control, cursor: "pointer" }}>
              {FEEDBACK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field text="How is feeding going at your school?">
            <StarPicker value={rating} onChange={setRating} />
          </Field>
        </div>
        <div className="mt-4">
          <Field text="Message" hint="Be specific — delivery counts, learners referred, supplies, anything the district needs to act on.">
            <textarea
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="e.g. The Grade 4 milk delivery for week 3 was short by two cartons."
              style={{ ...control, resize: "vertical" }}
            />
          </Field>
        </div>
        <div className="flex items-center gap-3 mt-5 flex-wrap">
          <Button onClick={submit} disabled={!message.trim()}>Send to district office</Button>
          {sent && <span style={{ fontSize: 12, color: C.good, fontWeight: 600 }}>✓ Sent — the district office has it now</span>}
        </div>
      </Card>

      <Card
        title="What I have sent"
        subtitle={`${mine.length} sent · ${replies} replied to`}
        action={
          <div className="flex gap-2 flex-wrap">
            {(["All", "New", "Acknowledged", "Resolved"] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 11px",
                  fontSize: 12,
                  borderRadius: 999,
                  border: `1px solid ${filter === f ? C.navy : C.border2}`,
                  background: filter === f ? C.navySoft : C.surface,
                  color: filter === f ? C.navy : C.sub,
                  fontWeight: filter === f ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        }
      >
        {visible.length === 0 ? (
          <p style={{ fontSize: 13.5, color: C.sub }}>
            {mine.length === 0 ? "Nothing sent yet. Tell the district office how the feeding program is going." : `No ${filter.toLowerCase()} feedback.`}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map(f => (
              <div key={f.id} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, background: C.surface2 }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Pill text={f.category} tone="navy" />
                  <Pill
                    text={f.status}
                    tone={f.status === "Resolved" ? "good" : f.status === "Acknowledged" ? "warn" : "gold"}
                  />
                  <Stars value={f.rating} />
                  <span style={{ fontSize: 11.5, color: C.dim, marginLeft: "auto" }}>{shortDate(f.createdAt)}</span>
                </div>
                <p style={{ fontSize: 13.5, color: C.text, marginTop: 10, lineHeight: 1.55 }}>{f.message}</p>
                {f.response ? (
                  <div style={{ marginTop: 12, paddingLeft: 13, borderLeft: `3px solid ${C.navy}`, background: C.navySoft, borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.navy, fontWeight: 700 }}>
                      District response
                    </div>
                    <p style={{ fontSize: 13, color: C.text, marginTop: 5, lineHeight: 1.5 }}>{f.response}</p>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: C.dim, marginTop: 10 }}>Waiting for the district office's reply.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── The site ──────────────────────────────────────────────────────────────────

// ── Summary Table — the school's SBFP numbers, and Form 2 ──────────────────

/** Status colours that stay readable on paper (the district's day-mode tones). */
const BMI_COLOR: Record<string, string> = {
  "Severely Wasted": "#b3261e", Wasted: "#a2580a", Normal: "#1c7a4a", Overweight: "#8a6a00", Obese: "#b3316a",
};
const HFA_COLOR: Record<string, string> = {
  "Severely Stunted": "#b3261e", Stunted: "#a2580a", Normal: "#1c7a4a", Tall: "#0f6f91",
};

function SummaryTable({ school, onEntry }: { school: School; onEntry: () => void }) {
  const store = useTeacherStore();
  const [cohort, setCohort] = useState<"All" | "Regular" | "SPED">("All");
  const [exporting, setExporting] = useState(false);
  // Open on the period the school actually has records in: a teacher who has
  // just encoded Baseline should not land on an empty Endline table.
  const [chosenPeriod, setPeriod] = useState<Period | null>(null);

  const isSpedSchool = school.name === SPED_SCHOOL_NAME;
  const isSpedGrade = (g: string) => g.startsWith("SPED");
  const allGrades = getGrades(school);
  // Urdaneta 1 Central is the division's SPED school: "All Students" folds SPED
  // Kinder into Kinder, exactly as the district's own Summary Table does, so a
  // school's figures and the district's agree for the same records.
  const mergeSped = isSpedSchool && cohort === "All";
  const grades = !isSpedSchool || cohort === "All"
    ? (mergeSped ? allGrades.filter(g => !isSpedGrade(g)) : allGrades)
    : cohort === "SPED"
      ? allGrades.filter(isSpedGrade)
      : allGrades.filter(g => !isSpedGrade(g));

  const mine = useMemo(() => store.records.filter(r => r.schoolId === school.id), [store.records, school.id]);
  const period: Period = chosenPeriod ?? PERIODS.find(p => mine.some(r => r.period === p)) ?? "Baseline";
  const shown = mine.filter(s =>
    s.period === period &&
    (!isSpedSchool || cohort === "All" ? true : cohort === "SPED" ? isSpedGrade(s.gradeLevel) : !isSpedGrade(s.gradeLevel)),
  );
  const perPeriod = PERIODS.map(p => ({ p, n: mine.filter(r => r.period === p).length }));

  /** A learner's grade belongs in this row — merged rows also take the SPED grade. */
  const inGrade = (g: string, grade: GradeLevel) => (mergeSped ? g.replace(/^SPED /, "") === grade : g === grade);
  const cntBMI = (grade: GradeLevel | null, sex: Sex | null, st: BMIStatus) =>
    shown.filter(s => (grade === null || inGrade(s.gradeLevel, grade)) && (sex === null || s.sex === sex) && s.bmiStatus === st).length;
  const cntHFA = (grade: GradeLevel | null, sex: Sex | null, st: HFAStatus) =>
    shown.filter(s => (grade === null || inGrade(s.gradeLevel, grade)) && (sex === null || s.sex === sex) && s.hfaStatus === st).length;
  const cntFlag = (grade: GradeLevel | null, sex: Sex | null, field: keyof Student, val: string) =>
    shown.filter(s => (grade === null || inGrade(s.gradeLevel, grade)) && (sex === null || s.sex === sex) && s[field] === val).length;
  const cntYoung = (grade: GradeLevel | null, sex: Sex | null) =>
    shown.filter(s =>
      (grade === null || inGrade(s.gradeLevel, grade)) && (sex === null || s.sex === sex) &&
      (s.pregnant === "Yes" || s.hasYoungChildren === "Yes"),
    ).length;
  const sx = (lbl: "M" | "F" | "Total"): Sex | null => (lbl === "Total" ? null : lbl);
  const bmiColor = (st: string) => BMI_COLOR[st] ?? C.text;
  const hfaColor = (st: string) => HFA_COLOR[st] ?? C.text;

  /**
   * The rows below, flattened for the Form 2 export — built from the same
   * counters as the table, so the .xlsx cannot drift from the screen.
   */
  const summaryMatrix = (): SummaryMatrixRow[] => {
    const perGrade = (grade: GradeLevel | null, text: string): SummaryMatrixRow[] =>
      (["M", "F", "Total"] as const).map(lbl => {
        const s = sx(lbl);
        return {
          grade: text,
          sex: lbl,
          bmi: BMI_STATUSES.map(st => cntBMI(grade, s, st)),
          hfa: HFA_STATUSES.map(st => cntHFA(grade, s, st)),
          pregnantYoung: cntYoung(grade, s),
          dewormed: cntFlag(grade, s, "dewormed", "Yes"),
          fourPs: cntFlag(grade, s, "fourPs", "Yes"),
          sbfp: cntFlag(grade, s, "sbfpPreviousYears", "Yes"),
        };
      });
    return [...grades.flatMap(g => perGrade(g, g)), ...perGrade(null, "GRAND TOTAL")];
  };

  /** The school year most of these records use — what the printed form carries. */
  const syForExport = () => {
    const tally = new Map<string, number>();
    for (const s of shown) if (s.sy) tally.set(s.sy, (tally.get(s.sy) ?? 0) + 1);
    let best = "2025-2026", n = 0;
    for (const [sy, c] of tally) if (c > n) { best = sy; n = c; }
    return best;
  };

  const exportForm2 = async () => {
    setExporting(true);
    try {
      const { exportSummaryToExcel } = await import("@/lib/sbfp-export");
      await exportSummaryToExcel({
        school,
        period,
        cohort,
        sy: syForExport(),
        bmiStatuses: BMI_STATUSES,
        hfaStatuses: HFA_STATUSES,
        rows: summaryMatrix(),
      });
    } finally {
      setExporting(false);
    }
  };

  const males = shown.filter(s => s.sex === "M").length;
  const wasted = cntBMI(null, null, "Severely Wasted") + cntBMI(null, null, "Wasted");
  const stunted = cntHFA(null, null, "Severely Stunted") + cntHFA(null, null, "Stunted");

  const num = (key: string, v: number, color?: string) => (
    <td key={key} className="px-2 py-2 text-center" style={{ fontFamily: mono, fontSize: 12, color: v === 0 ? C.border2 : (color ?? C.text) }}>
      {v}
    </td>
  );

  if (mine.length === 0) {
    return (
      <Card title="Summary Table" subtitle={`${school.name} — the SBFP Form 2 figures per grade and sex.`}>
        <p style={{ fontSize: 13.5, color: C.sub, maxWidth: 620 }}>
          Nothing to summarise yet. Encode the school's learners — Baseline, Midline and Endline — and this table fills in
          per grade and sex, ready to export as SBFP Form 2.
        </p>
        <div className="mt-4">
          <Button onClick={onEntry}>Go to Data Entry</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Card
        title="Summary Table"
        subtitle={`${school.name} · ${period}${isSpedSchool && cohort !== "All" ? ` · ${cohort} only` : ""}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {isSpedSchool && (["All", "Regular", "SPED"] as const).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCohort(c)}
                style={{
                  padding: "6px 12px", fontSize: 12, borderRadius: 999,
                  border: `1px solid ${cohort === c ? C.navy : C.border2}`,
                  background: cohort === c ? C.navySoft : C.surface,
                  color: cohort === c ? C.navy : C.sub,
                  fontWeight: cohort === c ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {c === "All" ? "All Students" : c}
              </button>
            ))}
            <Button onClick={exportForm2} disabled={shown.length === 0 || exporting}>
              {exporting ? "Exporting…" : "↓ Export Form 2"}
            </Button>
          </div>
        }
      >
        <div className="flex gap-2 flex-wrap items-center">
          <span style={{ ...label, marginBottom: 0 }}>Period</span>
          {perPeriod.map(({ p, n }) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              title={`${n} record${n === 1 ? "" : "s"} encoded`}
              style={{
                padding: "6px 12px", fontSize: 12, borderRadius: 999,
                border: `1px solid ${period === p ? C.navy : C.border2}`,
                background: period === p ? C.navy : C.surface,
                color: period === p ? "#fff" : n ? C.sub : C.dim,
                fontWeight: period === p ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {p} · {n}
            </button>
          ))}
        </div>
      </Card>

      {shown.length === 0 ? (
        <Card>
          <p style={{ fontSize: 13.5, color: C.sub }}>
            No {period} records yet{isSpedSchool && cohort !== "All" ? ` for the ${cohort} cohort` : ""}. Encode them and
            this table fills in.
          </p>
          <div className="mt-4"><Button onClick={onEntry}>Encode {period} records</Button></div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat text={`${period} learners`} value={shown.length} hint={`${males} M · ${shown.length - males} F`} accent />
            <Stat text="Wasted" value={wasted} hint="severely wasted + wasted" />
            <Stat text="Stunted" value={stunted} hint="severely stunted + stunted" />
            <Stat text="Dewormed" value={cntFlag(null, null, "dewormed", "Yes")} hint={`4P's: ${cntFlag(null, null, "fourPs", "Yes")}`} />
          </div>

          <div style={{ border: `1px solid ${C.border}`, borderRadius: C.radius, overflow: "hidden", background: C.surface }}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: 900, fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    <th rowSpan={2} className="px-3 py-2 text-left" style={{ ...label, marginBottom: 0, borderRight: `1px solid ${C.border}` }}>Grade</th>
                    <th rowSpan={2} className="px-2 py-2 text-center" style={{ ...label, marginBottom: 0, borderRight: `1px solid ${C.border}` }}>Sex</th>
                    <th colSpan={6} className="px-2 py-2 text-center" style={{ ...label, marginBottom: 0, color: C.navy, borderRight: `1px solid ${C.border}` }}>Body Mass Index (BMI)</th>
                    <th colSpan={5} className="px-2 py-2 text-center" style={{ ...label, marginBottom: 0, color: C.good, borderRight: `1px solid ${C.border}` }}>Height-for-Age (HFA)</th>
                    <th className="px-2 py-2 text-center" style={{ ...label, marginBottom: 0, color: C.gold, borderRight: `1px solid ${C.border}` }}>4P's</th>
                    <th className="px-2 py-2 text-center" style={{ ...label, marginBottom: 0, color: C.gold }}>SBFP</th>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.surface2 }}>
                    {["Sev. Wasted", "Wasted", "Normal", "Overweight", "Obese", "Total", "Sev. Stunted", "Stunted", "Normal", "Tall", "Total"].map((h, i) => (
                      <th key={`${h}${i}`} className="px-2 py-1.5 text-center"
                        style={{ fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: C.dim, borderRight: `1px solid ${i === 5 || i === 10 ? C.border : C.surface2}` }}>
                        {h}
                      </th>
                    ))}
                    <th style={{ borderRight: `1px solid ${C.border}` }} />
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {grades.map(grade =>
                    (["M", "F", "Total"] as const).map((lbl, ri) => {
                      const s = sx(lbl);
                      const bmis = BMI_STATUSES.map(st => ({ st, n: cntBMI(grade, s, st) }));
                      const hfas = HFA_STATUSES.map(st => ({ st, n: cntHFA(grade, s, st) }));
                      const bT = bmis.reduce((a, b) => a + b.n, 0);
                      const hT = hfas.reduce((a, b) => a + b.n, 0);
                      const isTotal = lbl === "Total";
                      return (
                        <tr key={`${grade}-${ri}`} style={{ borderBottom: `1px solid ${isTotal ? C.border : C.surface2}`, background: isTotal ? C.surface2 : C.surface }}>
                          {ri === 0 && (
                            <td rowSpan={3} className="px-3 py-2 align-middle" style={{ fontSize: 12.5, fontWeight: 500, color: C.text, borderRight: `1px solid ${C.border}` }}>
                              {grade}
                            </td>
                          )}
                          <td className="px-2 py-2 text-center" style={{ fontFamily: mono, fontSize: 12, fontWeight: isTotal ? 600 : 400, color: isTotal ? C.navy : C.sub, borderRight: `1px solid ${C.border}` }}>{lbl}</td>
                          {bmis.map(b => num(`b-${b.st}`, b.n, isTotal ? undefined : bmiColor(b.st)))}
                          {num("b-total", bT, C.navy)}
                          {hfas.map(h => num(`h-${h.st}`, h.n, isTotal ? undefined : hfaColor(h.st)))}
                          {num("h-total", hT, C.good)}
                          {num("4ps", cntFlag(grade, s, "fourPs", "Yes"), C.gold)}
                          {num("sbfp", cntFlag(grade, s, "sbfpPreviousYears", "Yes"), C.gold)}
                        </tr>
                      );
                    }),
                  )}
                  {(["M", "F", "Total"] as const).map(lbl => {
                    const s = sx(lbl);
                    const bmis = BMI_STATUSES.map(st => ({ st, n: cntBMI(null, s, st) }));
                    const hfas = HFA_STATUSES.map(st => ({ st, n: cntHFA(null, s, st) }));
                    return (
                      <tr key={`grand-${lbl}`} style={{ background: C.navySoft, borderTop: `1px solid ${C.navy}` }}>
                        {lbl === "M" && (
                          <td rowSpan={3} className="px-3 py-2 align-middle" style={{ fontSize: 12, fontWeight: 700, color: C.navy, borderRight: `1px solid ${C.border}` }}>GRAND TOTAL</td>
                        )}
                        <td className="px-2 py-2 text-center" style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: C.navy, borderRight: `1px solid ${C.border}` }}>{lbl}</td>
                        {bmis.map(b => num(`gb-${b.st}`, b.n, C.navy))}
                        {num("gb-total", bmis.reduce((a, b) => a + b.n, 0), C.navy)}
                        {hfas.map(h => num(`gh-${h.st}`, h.n, C.good))}
                        {num("gh-total", hfas.reduce((a, b) => a + b.n, 0), C.good)}
                        {num("g4ps", cntFlag(null, s, "fourPs", "Yes"), C.gold)}
                        {num("gsbfp", cntFlag(null, s, "sbfpPreviousYears", "Yes"), C.gold)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Card>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <p style={{ fontSize: 12.5, color: C.sub, maxWidth: 640, lineHeight: 1.6 }}>
                This table covers the {mine.length} learner record{mine.length === 1 ? "" : "s"} this school has encoded
                from the portal. The district office keeps the school's full master list in its own Summary Table, and both
                use the same per-grade, per-sex figures and the same Form 2 layout — so what you export here is the same
                printed form, filled from the school's own encoding.
              </p>
              <Button tone="ghost" small onClick={onEntry}>＋ Encode more records</Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ── The site ──────────────────────────────────────────────────────────────

export default function TeacherApp() {
  // The signed-in account and the rows the server handed it. Which one of the
  // screens below shows is decided by that account — not by anything stored in
  // this browser — so a teacher on a borrowed laptop sees exactly her school.
  const access = useAccess();
  const store = access.store;
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState<Student | null>(null);

  // Signing in always opens on the Overview rather than wherever the last
  // teacher left the tab.
  const activeSchoolId = store.activeSchoolId;
  useEffect(() => {
    setTab("overview");
    setEditing(null);
  }, [activeSchoolId]);

  const profile = activeProfile(store);
  // The profile IS the school's SBFP form header, so what the teacher saved is
  // what this site shows — and what the Form 2 export prints on the form.
  const school = useMemo(() => {
    if (!profile) return null;
    const base = SCHOOL_BY_ID.get(profile.schoolId);
    if (!base) return null;
    return {
      ...base,
      division: profile.division,
      cityMunicipalityBarangay: profile.cityMunicipalityBarangay,
      schoolIdNumber: profile.schoolIdNumber,
      principal: profile.principal,
      focalPerson: profile.focalPerson,
      dateStartFeeding: profile.dateStartFeeding,
      lastMileSchool: profile.lastMileSchool,
    };
  }, [profile]);

  const signedIn = access.status === "teacher" && Boolean(school && profile);

  if (access.status === "loading") return <Boot />;
  if (access.status === "disabled") return <AccountOnHold access={access} />;

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, color: C.text, fontFamily: font }}>
      <header className="app-topbar" style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 10 }}>
        <div className="mx-auto px-5" style={{ maxWidth: 1080 }}>
          <div className="flex items-center gap-3 py-3 flex-wrap">
            <a href="/teacher" className="flex items-center gap-3" style={{ textDecoration: "none" }}>
              <img src="/school-health-wheel.svg" alt="" width={36} height={36} />
              <span>
                <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: C.text }}>SBFP Teacher Portal</span>
                <span style={{ display: "block", fontSize: 11, color: C.dim }}>Urdaneta City Schools Division</span>
              </span>
            </a>
            <div className="flex items-center gap-3 ml-auto" style={{ color: C.sub }}>
              {signedIn && profile && school && (
                <>
                  <div className="text-right hidden sm:block">
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{profile.teacherName}</div>
                    <div style={{ fontSize: 11, color: C.dim }}>{school.name}</div>
                  </div>
                  <UserButton />
                </>
              )}
            </div>
          </div>

          {signedIn && (
            <nav className="flex gap-1 pb-2 overflow-x-auto">
              {TABS.map(item => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setTab(item.id);
                      if (item.id !== "entry") setEditing(null);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      fontSize: 13,
                      whiteSpace: "nowrap",
                      borderRadius: 999,
                      border: `1px solid ${active ? C.navy : "transparent"}`,
                      background: active ? C.navySoft : "transparent",
                      color: active ? C.navy : C.sub,
                      fontWeight: active ? 600 : 400,
                      cursor: "pointer",
                    }}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {store.syncError && (
        <div
          className="mx-auto px-5"
          style={{ maxWidth: 1080, marginTop: 14, background: C.dangerSoft, border: "1px solid #f0d3d0", color: C.danger, borderRadius: 10, padding: "10px 12px", fontSize: 12.5 }}
        >
          {store.syncError}
        </div>
      )}

      {!signedIn ? (
        <TeacherSignIn
          access={access}
          notice={
            access.status === "no-account" || access.status === "admin"
              ? <NoAccountNotice access={access} />
              : undefined
          }
        />
      ) : !school || !profile ? (
        <div className="mx-auto px-5 py-10" style={{ maxWidth: 720 }}>
          <Card title="This account's school is not in the division list">
            <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.65 }}>
              The account <strong style={{ color: C.text }}>{access.email}</strong> is set to a school the division
              console no longer has on file. Ask the Division Office to point your account at the right school from
              Teacher Accounts.
            </p>
          </Card>
        </div>
      ) : (
        <main className="mx-auto px-5 py-6" style={{ maxWidth: 1080 }}>
          {tab === "overview" && <Overview profile={profile} school={school} go={setTab} />}
          {tab === "profile" && <ProfileScreen profile={profile} school={school} />}
          {tab === "entry" && (
            <DataEntry
              school={school}
              editing={editing}
              clearEditing={() => setEditing(null)}
              goRecords={() => setTab("records")}
            />
          )}
          {tab === "records" && (
            <MyRecords
              school={school}
              onEdit={s => { setEditing(s); setTab("entry"); }}
              goEntry={() => { setEditing(null); setTab("entry"); }}
            />
          )}
          {tab === "summary" && <SummaryTable school={school} onEntry={() => { setEditing(null); setTab("entry"); }} />}
          {tab === "feedback" && <FeedbackScreen profile={profile} school={school} />}

          <footer className="flex items-center justify-between gap-3 flex-wrap" style={{ marginTop: 34, paddingTop: 16, borderTop: `1px solid ${C.border}`, fontSize: 11.5, color: C.dim }}>
            <span>
              SBFP Teacher Portal · one account per school · saved to the division's records server
            </span>
          </footer>
        </main>
      )}
    </div>
  );
}
