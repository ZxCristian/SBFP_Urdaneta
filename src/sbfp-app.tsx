import { useState, useMemo, createContext, useContext, useEffect, useRef, Fragment, type CSSProperties } from "react";
// Type-only: erased at build time, so ExcelJS stays out of the initial bundle.
import type { SummaryMatrixRow } from "@/lib/sbfp-export";
// What the schools sent up through the teacher website (`/teacher`).
import {
  removeRecord,
  saveProfile,
  updateRecord,
  updateTeacherFeedback,
  useTeacherStore,
} from "@/lib/sbfp-store";
import { UserButton } from "@/lib/auth/gates";
import { useAccess } from "@/lib/use-access";
import AccountsPanel from "@/components/accounts-panel";
import { ConfirmDialog, type ConfirmPalette } from "@/components/confirm-dialog";

// ── Types ──────────────────────────────────────────────────────────────────────
export type GradeLevel =
  |"Kinder"|"Grade 1"|"Grade 2"|"Grade 3"|"Grade 4"|"Grade 5"|"Grade 6"
  |"Grade 7"|"Grade 8"|"Grade 9"|"Grade 10"|"Grade 11"|"Grade 12"
  |"SPED"|"SPED Kinder"|"SPED Grade 1"|"SPED Grade 2"|"SPED Grade 3"|"SPED Grade 4"|"SPED Grade 5"|"SPED Grade 6";
export type Sex = "M"|"F";
export type Period = "Baseline"|"Midline"|"Endline";
export type SchoolType = "Elementary"|"High School";
export type BMIStatus = "Severely Wasted"|"Wasted"|"Normal"|"Overweight"|"Obese"|"";
export type HFAStatus = "Severely Stunted"|"Stunted"|"Normal"|"Tall"|"";
export type YesNo = "Yes"|"No"|"";
type View = "district"|"feedback"|"schools"|"accounts"|"dashboard"|"records"|"entry"|"table"|"analytics";

export interface School {
  id: string; name: string; type: SchoolType;
  /** SBFP form header block (Form 1A export, and Form 2's field block) */
  division: string;
  cityMunicipalityBarangay: string;
  schoolIdNumber: string;
  principal: string;
  focalPerson: string;
  /** Form 2 only: ISO date the feeding starts. */
  dateStartFeeding: string;
  /** Form 2 only: Last Mile School, printed as ___Y ___N. */
  lastMileSchool: YesNo;
}
/** The editable form header fields, minus identity. */
export type SchoolFormDetails = Pick<School, "division"|"cityMunicipalityBarangay"|"schoolIdNumber"|"principal"|"focalPerson"|"dateStartFeeding"|"lastMileSchool">;
export const EMPTY_FORM_DETAILS: SchoolFormDetails = {
  division: "Urdaneta City", cityMunicipalityBarangay: "", schoolIdNumber: "", principal: "", focalPerson: "",
  dateStartFeeding: "", lastMileSchool: "",
};
/** The school-list columns a teacher's profile owns — see the sync in `App`. */
const SCHOOL_HEADER_KEYS = [
  "division", "cityMunicipalityBarangay", "schoolIdNumber", "principal", "focalPerson",
  "dateStartFeeding", "lastMileSchool",
] as const;

export const FORM_DETAIL_FIELDS: [keyof SchoolFormDetails, string][] = [
  ["division", "Division"],
  ["cityMunicipalityBarangay", "City/Municipality/Barangay"],
  ["schoolIdNumber", "School ID Number"],
  ["principal", "Name of Principal"],
  ["focalPerson", "Name of Feeding Focal Person"],
  ["dateStartFeeding", "Date of Start of Feeding"],
  ["lastMileSchool", "Last Mile School"],
];
export interface Student {
  id: string; schoolId: string; period: Period; sy: string;
  name: string; sex: Sex|""; gradeLevel: GradeLevel|"";
  dateOfBirth: string; dateOfWeighing: string;
  ageYears: string; ageMonths: string;
  weight: string; height: string; bmi: string;
  bmiStatus: BMIStatus; hfaStatus: HFAStatus; nutritionalStatus: string;
  classificationOfBeneficiary: "Primary"|"Secondary"|"";
  pregnant: YesNo; hasYoungChildren: YesNo; dewormed: YesNo;
  parentConsentMilk: YesNo; fourPs: YesNo; sbfpPreviousYears: YesNo;
}

// ── School feedback — what the schools send up, aggregated district-wide ───────
export type FeedbackCategory =
  |"Feeding Implementation"|"Nutrition Data"|"Supplies & Logistics"
  |"Learner Concerns"|"System / Forms"|"Other";
export type FeedbackStatus = "New"|"Acknowledged"|"Resolved";
export interface SchoolFeedback {
  id: string;
  /** The school that sent it — the Feedbacks page shows every school together. */
  schoolId: string;
  author: string;
  /** e.g. "SBFP Focal", "School Head", "Grade 6 Adviser" */
  role: string;
  category: FeedbackCategory;
  /** 1–5: how the feeding program is running at that school. */
  rating: number;
  message: string;
  /** ISO date the school sent it. */
  createdAt: string;
  status: FeedbackStatus;
  /** The district's answer back to the school, once written. */
  response?: string;
  /**
   * Set when the entry came in through the teacher website rather than the
   * district's own Feedbacks form — the feed shows a "Teacher Portal" tag so
   * the district can tell a school's submission from its own records.
   */
  origin?: "Teacher Portal";
}
export const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  "Feeding Implementation","Nutrition Data","Supplies & Logistics",
  "Learner Concerns","System / Forms","Other",
];
export const FEEDBACK_STATUSES: FeedbackStatus[] = ["New","Acknowledged","Resolved"];

// ── Theme ──────────────────────────────────────────────────────────────────────
export interface TC {
  bg: string; surface: string; surface2: string; surfaceDeep: string;
  hover: string; border: string; text: string; sub: string; dim: string; faint: string;
  accent: string; accentBg: string; accentText: string;
  danger: string; warning: string; grandBg: string; isDark: boolean;
  /**
   * Data colours (measurement periods, BMI/HFA statuses, BMI/HFA/4P's/SBFP
   * columns and school pills). Dark mode keeps the phosphor neon set; day mode
   * uses deeper tones of the same hue so numbers and labels stay readable
   * against a white surface instead of washing out.
   */
  blue: string; lime: string; orange: string;
  period: Record<string,string>;
  bmi: Record<string,string>;
  hfa: Record<string,string>;
}
const DARK: TC = {
  bg:"#080808", surface:"#111111", surface2:"#161616", surfaceDeep:"#0d0d0d",
  hover:"#161616", border:"#1e1e1e", text:"#e2e2e2", sub:"#888", dim:"#555", faint:"#2a2a2a",
  accent:"#00ff87", accentBg:"#00ff8720", accentText:"#000", danger:"#ff4b4b", warning:"#ff9f4b",
  grandBg:"#0a1a10", isDark:true,
  blue:"#00c9ff", lime:"#b8ff4f", orange:"#ff9f4b",
  period:{ Baseline:"#00c9ff", Midline:"#ff9f4b", Endline:"#00ff87" },
  bmi:{ "Severely Wasted":"#ff4b4b", Wasted:"#ff9f4b", Normal:"#00ff87", Overweight:"#ffdd4b", Obese:"#ff6b9d" },
  hfa:{ "Severely Stunted":"#ff4b4b", Stunted:"#ff9f4b", Normal:"#00ff87", Tall:"#00c9ff" },
};
const LIGHT: TC = {
  bg:"#f1f1ed", surface:"#ffffff", surface2:"#f7f7f3", surfaceDeep:"#e6e6e0",
  hover:"#eaeae6", border:"#d3d3ca", text:"#1b1b17", sub:"#4d4d46", dim:"#6d6d64", faint:"#8e8e85",
  accent:"#0b7a41", accentBg:"#0b7a4118", accentText:"#ffffff", danger:"#bc2f2f", warning:"#9d5200",
  grandBg:"#e4f1e8", isDark:false,
  blue:"#0f6f91", lime:"#557a12", orange:"#a25a09",
  period:{ Baseline:"#0f6f91", Midline:"#a25a09", Endline:"#0e7a41" },
  bmi:{ "Severely Wasted":"#c22b2b", Wasted:"#a25a09", Normal:"#0e7a41", Overweight:"#8a6a00", Obese:"#b3316a" },
  hfa:{ "Severely Stunted":"#c22b2b", Stunted:"#a25a09", Normal:"#0e7a41", Tall:"#0f6f91" },
};
const ThemeCtx = createContext<TC>(DARK);
const useT = () => useContext(ThemeCtx);

// ── Schools (initial constants) ────────────────────────────────────────────────
export const INIT_ES: School[] = [
  "Anonas East Elementary School",
  "Anonas Elementary School",
  "Bactad East Elementary School",
  "Bactad Community School",
  "Badipa Elementary School",
  "Bolaoen Elementary School",
  "Cabaruan Elementary School",
  "Cabuloan Elementary School",
  "Calegu Integrated School",
  "Camanang Elementary School",
  "Camantiles Elementary School",
  "Casabula Elementary School",
  "Catablan Integrated School",
  "Cayambanan Elementary School",
  "Consolacion Elementary School",
  "DAFSIS",
  "DAPSMECS East",
  "DAPSMECS Main",
  "DAPSMECS West",
  "Don A. Maiquez Memorial Elementary School",
  "Don C. Blanco Elementary School",
  "DF Maramba Elementary School",
  "Don V. Ordoñez Memorial School",
  "F. B. Goce Community School",
  "Labit East Elementary School",
  "Labit West Elementary School",
  "Lananpin Elementary School",
  "Lazaga Elementary School",
  "Manan Elementary School",
  "Nanbacuran Elementary School",
  "Nancalobasaan Elementary School",
  "Nancalobasaan RIS",
  "Nancayasan Elementary School",
  "Oltama Elementary School",
  "Palina East Elementary School",
  "Pinmaludpod Elementary School",
  "San Jose Elementary School",
  "San Jose Leet Integrated School",
  "Sta. Lucia Elementary School",
  "Tabuyoc Elementary School",
  "Tiposu Elementary School",
  "Trinidad S. Perez Elementary School",
  "Tulong Integrated School",
  "Urdaneta 1 Central School",
  "Vicente Taaca Memorial School",
].map((name, i) => ({ id:`es${String(i+1).padStart(2,"0")}`, name, type:"Elementary" as SchoolType, ...EMPTY_FORM_DETAILS }));

export const INIT_HS: School[] = [
  "Anonas National High School",
  "Bactad East National High School",
  "Badipa National High School",
  "Cabaruan National High School",
  "Cabuloan National High School",
  "Camantiles National High School",
  "Catablan Integrated School",
  "Labit National High School",
  "Lananpin National High School",
  "MQ Umipig National High School",
  "Palina East National High School",
  "PT Orata National High School",
  "Urdaneta City National High School",
].map((name, i) => ({ id:`hs${String(i+1).padStart(2,"0")}`, name, type:"High School" as SchoolType, ...EMPTY_FORM_DETAILS }));

// ── Constants ──────────────────────────────────────────────────────────────────
const ES_GRADES: GradeLevel[] = ["Kinder","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6"];
const ES_GRADES_WITH_SPED: GradeLevel[] = [
  "Kinder","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6",
  "SPED Kinder","SPED Grade 1","SPED Grade 2","SPED Grade 3","SPED Grade 4","SPED Grade 5","SPED Grade 6",
];
const HS_GRADES: GradeLevel[] = ["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
export const PERIODS: Period[] = ["Baseline","Midline","Endline"];
export const BMI_STATUSES: BMIStatus[] = ["Severely Wasted","Wasted","Normal","Overweight","Obese"];
export const HFA_STATUSES: HFAStatus[] = ["Severely Stunted","Stunted","Normal","Tall"];
// Period / BMI / HFA data colours now come from the theme (t.period, t.bmi, t.hfa)
// so day mode can use readable tones instead of the neon dark-mode set.

const getSchool = (schools: School[], id: string) => schools.find(s => s.id === id);
export const SPED_SCHOOL_NAME = "Urdaneta 1 Central School";
const GRADE_ORDER: GradeLevel[] = [
  "Kinder","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6",
  "SPED Kinder","SPED Grade 1","SPED Grade 2","SPED Grade 3","SPED Grade 4","SPED Grade 5","SPED Grade 6",
  "Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12","SPED",
];
const gradeRank = (g: string) => {
  const i = GRADE_ORDER.indexOf(g as GradeLevel);
  return i < 0 ? 99 : i;
};
const periodRank: Record<Period, number> = { Baseline: 0, Midline: 1, Endline: 2 };
export function sortRecords(list: Student[]): Student[] {
  return [...list].sort((a, b) => {
    const ga = gradeRank(a.gradeLevel);
    const gb = gradeRank(b.gradeLevel);
    if (ga !== gb) return ga - gb;
    const name = a.name.localeCompare(b.name);
    if (name !== 0) return name;
    return (periodRank[a.period] ?? 9) - (periodRank[b.period] ?? 9);
  });
}
export const getGrades = (school: School|undefined): GradeLevel[] => {
  if (!school) return ES_GRADES;
  if (school.type === "High School") return HS_GRADES;
  // Only Urdaneta 1 Central School offers SPED Kinder–Grade 6
  if (school.name === SPED_SCHOOL_NAME) return ES_GRADES_WITH_SPED;
  return ES_GRADES;
};

/** Unique person key (same student across Baseline/Midline/Endline) */
export const studentKey = (s: { name: string; dateOfBirth: string; sex: string; schoolId?: string }) =>
  `${s.schoolId ?? ""}|${s.name}|${s.dateOfBirth}|${s.sex}`;

/** Count unique students (not period records) */
export const uniqueCount = (list: Student[]) => new Set(list.map(studentKey)).size;

/** One record per student, preferring Endline → Midline → Baseline (for accurate counts) */
export function uniqueStudents(list: Student[]): Student[] {
  const order: Record<Period, number> = { Endline: 0, Midline: 1, Baseline: 2 };
  const map = new Map<string, Student>();
  for (const s of list) {
    const k = studentKey(s);
    const existing = map.get(k);
    if (!existing || order[s.period] < order[existing.period]) map.set(k, s);
  }
  return Array.from(map.values());
}

/** Grades 2–12 used for Primary/Secondary beneficiary rules */
const BENEFICIARY_GRADES: GradeLevel[] = ["Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];

/** Auto-assign beneficiary class
 *  - Kinder & Grade 1 → always Primary
 *  - Grades 2–12: Primary = Severely Wasted, Secondary = Severely Stunted
 */
export function classifyBeneficiary(grade: string, bmiStatus: string, hfaStatus: string): "Primary"|"Secondary"|"" {
  // Kinder / Grade 1 (regular or SPED) → always Primary
  if (grade === "Kinder" || grade === "Grade 1" || grade === "SPED Kinder" || grade === "SPED Grade 1") return "Primary";
  // SPED Grade 2–6 follow same severe rules as regular G2–6
  const normalized = grade.replace(/^SPED /, "") as GradeLevel;
  if (!BENEFICIARY_GRADES.includes(normalized) && !BENEFICIARY_GRADES.includes(grade as GradeLevel)) return "";
  if (bmiStatus === "Severely Wasted") return "Primary";
  if (hfaStatus === "Severely Stunted") return "Secondary";
  return "";
}

/** Format date YYYY-MM-DD → MM/DD/YYYY for SBFP form */
export function formatDateMDY(iso: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[2]}/${m[3]}/${m[1]}`;
}

// ── WHO 2007 Reference Tables ──────────────────────────────────────────────────
// BMI-for-age [median, SD] age 5–19 (index 0 = age 5)
const WHO_BMI_M: [number,number][] = [[15.3,1.0],[15.3,1.1],[15.5,1.2],[15.8,1.4],[16.3,1.6],[16.8,1.9],[17.5,2.2],[18.2,2.5],[19.0,2.8],[19.8,3.0],[20.5,3.1],[21.1,3.2],[21.6,3.3],[22.0,3.4],[22.3,3.4]];
const WHO_BMI_F: [number,number][] = [[15.3,1.0],[15.3,1.1],[15.5,1.3],[16.0,1.6],[16.6,1.9],[17.3,2.2],[18.0,2.6],[18.7,2.9],[19.4,3.1],[19.9,3.2],[20.4,3.3],[20.8,3.3],[21.1,3.3],[21.3,3.4],[21.4,3.4]];
// HFA [median cm, SD] age 5–19
const WHO_HFA_M: [number,number][] = [[110.0,4.3],[116.0,4.5],[121.7,4.8],[127.3,5.1],[132.6,5.4],[137.8,5.8],[143.5,6.4],[149.8,7.2],[156.4,7.8],[162.6,7.8],[167.0,7.3],[170.0,6.9],[171.6,6.7],[172.4,6.6],[173.0,6.6]];
const WHO_HFA_F: [number,number][] = [[109.4,4.2],[115.1,4.5],[120.8,4.8],[126.3,5.2],[131.5,5.6],[136.8,5.9],[142.5,6.0],[147.6,6.0],[151.4,5.9],[153.7,5.8],[154.9,5.8],[155.6,5.7],[156.0,5.7],[156.3,5.7],[156.4,5.7]];

// ── Helper Functions ───────────────────────────────────────────────────────────
export function calcBMI(w: string, h: string): string {
  const wn = parseFloat(w), hn = parseFloat(h) / 100;
  if (!wn || !hn || hn <= 0) return "";
  return (wn / (hn * hn)).toFixed(2);
}
export function computeAge(dob: string): { years: string; months: string } {
  if (!dob) return { years:"", months:"" };
  const birth = new Date(dob), today = new Date();
  if (isNaN(birth.getTime()) || birth > today) return { years:"", months:"" };
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months--;
  if (months < 0) { years--; months += 12; }
  return { years: String(years), months: String(months) };
}
export function classifyBMI(bmi: string, ageYears: string, sex: string): BMIStatus {
  const b = parseFloat(bmi), age = parseInt(ageYears);
  if (!b || !age || age < 5 || age > 19 || (sex !== "M" && sex !== "F")) return "";
  const [med, sd] = (sex === "M" ? WHO_BMI_M : WHO_BMI_F)[Math.min(age - 5, 14)];
  const z = (b - med) / sd;
  if (z < -3) return "Severely Wasted";
  if (z < -2) return "Wasted";
  if (z <= 1) return "Normal";
  if (z <= 2) return "Overweight";
  return "Obese";
}
export function classifyHFA(height: string, ageYears: string, sex: string): HFAStatus {
  const h = parseFloat(height), age = parseInt(ageYears);
  if (!h || !age || age < 5 || age > 19 || (sex !== "M" && sex !== "F")) return "";
  const [med, sd] = (sex === "M" ? WHO_HFA_M : WHO_HFA_F)[Math.min(age - 5, 14)];
  const z = (h - med) / sd;
  if (z < -3) return "Severely Stunted";
  if (z < -2) return "Stunted";
  if (z <= 2) return "Normal";
  return "Tall";
}

// ── Seed Data ──────────────────────────────────────────────────────────────────
export const EMPTY_STUDENT = (schoolId: string, period: Period|"" = ""): Omit<Student,"id"> => ({
  schoolId, period: (period || "") as Period, sy:"2025-2026", name:"", sex:"", gradeLevel: "",
  dateOfBirth:"", dateOfWeighing:"", ageYears:"", ageMonths:"",
  weight:"", height:"", bmi:"", bmiStatus:"", hfaStatus:"",
  nutritionalStatus:"", classificationOfBeneficiary:"",
  pregnant:"", hasYoungChildren:"", dewormed:"", parentConsentMilk:"", fourPs:"", sbfpPreviousYears:"",
});
const FIRST_NAMES_M = ["Juan","Pedro","Miguel","Jose","Carlos","Antonio","Rafael","Luis","Gabriel","Andres","Mark","John","Daniel","James","Joshua","Alden","Coco","Xian","Enrique","Matteo","Diego","Paolo","Nico","Marco","Lorenzo","Francis","Christian","Ryan","Kevin","Jared"];
const FIRST_NAMES_F = ["Maria","Ana","Sofia","Liza","Chloe","Bea","Nadine","Kathryn","Angel","Marian","Julia","Anne","Kim","Maine","Sarah","Isabella","Camila","Elena","Andrea","Patricia","Angela","Christine","Nicole","Bianca","Katrina","Jasmine","Michelle","Amanda","Rosa","Carmen"];
const LAST_NAMES = ["Santos","dela Cruz","Reyes","Bautista","Garcia","Cruz","Mendoza","Gonzales","Villanueva","Perez","Alonzo","Padilla","Lustre","Reid","Bernardo","Gil","Locsin","Dantes","Rivera","Martin","Barretto","Garcia","Curtis","Navarro","Chiu","Lim","Mendoza","Richards","Geronimo","Guidicelli","Torres","Ramos","Flores","Castillo","Aquino","Lopez","Diaz","Hernandez","Morales","Santiago"];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function generateSeed(schools: School[]): Student[] {
  const students: Student[] = [];
  let idCounter = 1;
  const yesNo = (rnd: () => number, pYes = 0.7): YesNo => (rnd() < pYes ? "Yes" : "No");

  // Weighing dates per period (same school year)
  const weighingDates: Record<Period, string> = {
    Baseline: "2025-09-15",
    Midline: "2026-01-20",
    Endline: "2026-05-15",
  };

  for (const school of schools) {
    const grades = getGrades(school);
    const isHS = school.type === "High School";
    // 50–60 unique students per school (each appears in all 3 periods → 150–180 records)
    const cohortSize = 50 + Math.floor(seededRandom(school.id.charCodeAt(0) + school.id.charCodeAt(2))() * 11);
    const rnd = seededRandom(school.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0));

    for (let i = 0; i < cohortSize; i++) {
      const sex: Sex = rnd() < 0.5 ? "M" : "F";
      const grade = grades[Math.floor(rnd() * grades.length)];
      const first = sex === "M" ? pick(FIRST_NAMES_M, rnd) : pick(FIRST_NAMES_F, rnd);
      const last = pick(LAST_NAMES, rnd);
      const name = `${first} ${last}`;

      // Age roughly matching grade (at Baseline); SPED maps to same ages as regular grades
      const gradeForAge = grade.replace(/^SPED /, "");
      const baseAge = isHS
        ? (gradeForAge === "Grade 7" ? 12 : gradeForAge === "Grade 8" ? 13 : gradeForAge === "Grade 9" ? 14 : gradeForAge === "Grade 10" ? 15 : gradeForAge === "Grade 11" ? 16 : 17)
        : (gradeForAge === "Kinder" ? 5 : gradeForAge === "Grade 1" ? 6 : gradeForAge === "Grade 2" ? 7 : gradeForAge === "Grade 3" ? 8 : gradeForAge === "Grade 4" ? 9 : gradeForAge === "Grade 5" ? 10 : gradeForAge === "Grade 6" ? 11 : 8);
      const ageYearsBase = Math.max(5, Math.min(18, baseAge + Math.floor(rnd() * 3) - 1));
      const ageMonthsBase = Math.floor(rnd() * 12);

      const dobYear = 2025 - ageYearsBase - (ageMonthsBase > 8 ? 1 : 0);
      const dobMonth = String(Math.floor(rnd() * 12) + 1).padStart(2, "0");
      const dobDay = String(Math.floor(rnd() * 28) + 1).padStart(2, "0");
      const dateOfBirth = `${dobYear}-${dobMonth}-${dobDay}`;

      const pregnant: YesNo = sex === "F" && ageYearsBase >= 15 && rnd() < 0.05 ? "Yes" : "No";
      const hasYoungChildren: YesNo = sex === "F" && ageYearsBase >= 16 && rnd() < 0.08 ? "Yes" : "No";
      const dewormed = yesNo(rnd, 0.82);
      const parentConsentMilk = yesNo(rnd, 0.88);
      const fourPs = yesNo(rnd, 0.55);
      const sbfpPreviousYears = yesNo(rnd, 0.48);

      // Baseline z-scores
      // Grade 2–6: only Severely Wasted and/or Severely Stunted (program focus)
      const isGrade2to6 = ["Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "SPED Grade 2", "SPED Grade 3", "SPED Grade 4", "SPED Grade 5", "SPED Grade 6"].includes(grade);
      let zBmi: number;
      let zHfa: number;
      if (isGrade2to6) {
        // Force severe undernutrition: Severely Wasted, Severely Stunted, or both
        const mode = rnd();
        if (mode < 0.4) {
          // Severely Wasted only
          zBmi = -3.8 + rnd() * 0.75; // z < -3
          zHfa = -1.5 + rnd() * 2.5;
        } else if (mode < 0.75) {
          // Severely Stunted only
          zBmi = -1.2 + rnd() * 2.0;
          zHfa = -3.7 + rnd() * 0.65; // z < -3
        } else {
          // Both severe
          zBmi = -3.8 + rnd() * 0.75;
          zHfa = -3.7 + rnd() * 0.65;
        }
      } else {
        // Other grades: mixed distribution
        zBmi = rnd() < 0.14 ? -3.1 + rnd() * 0.9 : rnd() < 0.28 ? -2.4 + rnd() * 0.9 : rnd() < 0.72 ? -0.4 + rnd() * 1.4 : 0.7 + rnd() * 1.6;
        zHfa = rnd() < 0.12 ? -3.0 + rnd() * 0.8 : rnd() < 0.25 ? -2.3 + rnd() * 0.8 : rnd() < 0.85 ? -0.2 + rnd() * 1.5 : 1.1 + rnd() * 1.4;
      }

      // Trajectory: Grade 2–6 improve slowly (often remain severe); others improve more
      const bmiImprove = isGrade2to6
        ? (rnd() < 0.5 ? 0.08 + rnd() * 0.2 : 0)
        : (rnd() < 0.65 ? 0.25 + rnd() * 0.55 : rnd() < 0.85 ? 0 : -(0.1 + rnd() * 0.3));
      const hfaImprove = isGrade2to6
        ? (rnd() < 0.45 ? 0.05 + rnd() * 0.15 : 0)
        : (rnd() < 0.55 ? 0.15 + rnd() * 0.4 : rnd() < 0.8 ? 0 : -(0.05 + rnd() * 0.2));

      PERIODS.forEach((period, pIdx) => {
        // Age increases slightly across periods within the same SY
        const ageYears = Math.min(19, ageYearsBase + (pIdx === 2 ? 1 : 0));
        const ageMonths = pIdx === 0 ? ageMonthsBase : pIdx === 1 ? Math.min(11, ageMonthsBase + 4) : Math.min(11, ageMonthsBase + 8);

        const zB = zBmi + bmiImprove * pIdx;
        const zH = zHfa + hfaImprove * pIdx;
        const [medBmi, sdBmi] = (sex === "M" ? WHO_BMI_M : WHO_BMI_F)[Math.min(ageYears - 5, 14)] || [16, 2];
        const [medHfa, sdHfa] = (sex === "M" ? WHO_HFA_M : WHO_HFA_F)[Math.min(ageYears - 5, 14)] || [130, 6];
        const bmiVal = medBmi + zB * sdBmi;
        const heightVal = medHfa + zH * sdHfa;
        const weightVal = bmiVal * (heightVal / 100) ** 2;

        const bmi = Math.max(10, bmiVal).toFixed(2);
        const height = Math.max(90, heightVal).toFixed(1);
        const weight = Math.max(12, weightVal).toFixed(1);
        const bmiStatus = classifyBMI(bmi, String(ageYears), sex) || "Normal";
        const hfaStatus = classifyHFA(height, String(ageYears), sex) || "Normal";
        const nutritionalStatus = bmiStatus === "Normal"
          ? (hfaStatus.includes("Stunted") ? hfaStatus : "Normal")
          : bmiStatus;
        // Primary = Severely Wasted, Secondary = Severely Stunted (Grades 2–12)
        const classificationOfBeneficiary = classifyBeneficiary(grade, bmiStatus, hfaStatus);

        students.push({
          id: `s${String(idCounter++).padStart(5, "0")}`,
          schoolId: school.id,
          period,
          sy: "2025-2026",
          name,
          sex,
          gradeLevel: grade,
          dateOfBirth,
          dateOfWeighing: weighingDates[period],
          ageYears: String(ageYears),
          ageMonths: String(ageMonths),
          weight,
          height,
          bmi,
          bmiStatus,
          hfaStatus,
          nutritionalStatus,
          classificationOfBeneficiary,
          pregnant,
          hasYoungChildren,
          dewormed,
          parentConsentMilk,
          fourPs,
          sbfpPreviousYears,
        });
      });
    }
  }
  return students;
}

const SEED: Student[] = generateSeed([...INIT_ES, ...INIT_HS]);

// ── Feedbacks sent up by the schools ──────────────────────────────────────────
// Seeded with one voice per school so the district page opens with a real
// cross-section of the field instead of an empty list.
const schoolIdOf = (name: string) =>
  INIT_ES.find(s => s.name === name)?.id ?? INIT_HS.find(s => s.name === name)?.id ?? "";

type FeedbackSeed = Omit<SchoolFeedback, "id"|"schoolId"> & { school: string };

const FEEDBACK_ROWS: FeedbackSeed[] = [
  { school:"Urdaneta 1 Central School", author:"Josefa Ramos", role:"SBFP Focal", category:"Feeding Implementation", rating:5, createdAt:"2026-07-08", status:"Resolved",
    message:"Feeding started on July 6 as scheduled. 118 of our 124 target learners were present on Day 1; the six absentees were followed up by their advisers the same week.",
    response:"Noted and appreciated. Please keep the daily attendance sheet for the midyear validation." },
  { school:"Badipa Elementary School", author:"Aileen Marie Dela Cruz", role:"Feeding Coordinator", category:"Supplies & Logistics", rating:3, createdAt:"2026-07-17", status:"Resolved",
    message:"We received 30 kilos of rice but only 24 litres of milk for the first cycle. Grades 1 and 2 are short for the last two weeks of the cycle.",
    response:"Validated with the division supply unit; the balance of 12 litres goes out with the next batch." },
  { school:"Catablan Integrated School", author:"Rolando Bautista", role:"School Head", category:"Supplies & Logistics", rating:2, createdAt:"2026-07-23", status:"Resolved",
    message:"The weighing scale assigned to Grade 3 gives inconsistent readings — three learners weighed twice differed by as much as 1.5 kilos. Requesting a replacement or calibration.",
    response:"Two replacement scales from division stock were released on July 28. Please re-weigh the affected learners and update the baseline." },
  { school:"Anonas Elementary School", author:"Marilou Aquino", role:"School Nurse", category:"Nutrition Data", rating:4, createdAt:"2026-08-04", status:"Acknowledged",
    message:"Baseline BMI and HFA for Kinder to Grade 6 are complete and encoded. Grade 6 Endline is still pending — we weigh after the final feeding day on October 20.",
    response:"Received. Kindly submit the Endline records within three days of the final weighing day." },
  { school:"Palina East Elementary School", author:"Elmer Soriano", role:"SBFP Focal", category:"Learner Concerns", rating:5, createdAt:"2026-08-12", status:"Resolved",
    message:"Six learners flagged Wasted at baseline moved to Normal at the midline. Their parents are asking whether the milk component can continue until the end of the school year." },
  { school:"Cayambanan Elementary School", author:"Girlie Punzalan", role:"Grade 6 Adviser", category:"System / Forms", rating:4, createdAt:"2026-08-20", status:"Acknowledged",
    message:"The Form 2 export now comes out the same as the printed template, thank you. Requesting the same auto-total for the last column of Form 1A if possible." },
  { school:"Don A. Maiquez Memorial Elementary School", author:"Norberto Villamor", role:"School Head", category:"Feeding Implementation", rating:4, createdAt:"2026-08-27", status:"Resolved",
    message:"We feed 96 learners in two shifts because the canteen only seats 50 at a time. Sessions run at 7:00 and 9:30 AM so no class time is lost." },
  { school:"Urdaneta City National High School", author:"Rosalie Andrada", role:"Feeding Coordinator", category:"Nutrition Data", rating:3, createdAt:"2026-09-02", status:"Acknowledged",
    message:"Twelve Grade 7 learners have no height on record for the baseline — their Form 1A entries were submitted with the height column blank.",
    response:"Please re-measure and re-upload. That is why the Form 2 HEIGHT columns read zero for Grade 7." },
  { school:"Sta. Lucia Elementary School", author:"Teodoro Espino", role:"SBFP Focal", category:"Learner Concerns", rating:3, createdAt:"2026-09-08", status:"Acknowledged",
    message:"Two learners with Severe Wasting were referred to the Rural Health Unit for check-up. We are holding them on the regular menu until the results come back.",
    response:"Log the referral with the school nurse; a modified menu can be requested through the SDO if the RHU advises it." },
  { school:"Camantiles National High School", author:"Bernadette Lagasca", role:"School Nurse", category:"Feeding Implementation", rating:5, createdAt:"2026-09-11", status:"Resolved",
    message:"All 84 target learners finished the deworming on schedule and the feeding line runs in 15 minutes with parent volunteers helping." },
  { school:"Tulong Integrated School", author:"Armando Ferrer", role:"School Head", category:"Supplies & Logistics", rating:4, createdAt:"2026-09-15", status:"New",
    message:"Requesting additional milk for three transferee learners who were added after the master list was finalized last August." },
  { school:"San Jose Elementary School", author:"Jennifer Manaois", role:"SBFP Focal", category:"Feeding Implementation", rating:5, createdAt:"2026-09-18", status:"Acknowledged",
    message:"Midline feeding completed. Attendance in the feeding area is at 98% over the last four weeks." },
  { school:"Manan Elementary School", author:"Crisanto Bacani", role:"Grade 3 Adviser", category:"Other", rating:4, createdAt:"2026-09-22", status:"New",
    message:"Our washing station has no roof. Requesting help with a tarpaulin or a small repair before the rainy months." },
  { school:"Nancayasan Elementary School", author:"Lorna Dizon", role:"SBFP Focal", category:"Nutrition Data", rating:3, createdAt:"2026-09-24", status:"Acknowledged",
    message:"We re-weighed the 14 learners whose baseline came out Overweight: ten are now Normal, four are still Overweight and will be monitored monthly." },
  { school:"DAPSMECS Main", author:"Fidel Agustin", role:"School Head", category:"System / Forms", rating:3, createdAt:"2026-09-29", status:"New",
    message:"We cannot find where to record learners who transfer in the middle of the feeding cycle. They appear in the master list but not in Form 2." },
  { school:"Vicente Taaca Memorial School", author:"Michelle Bautista", role:"Feeding Coordinator", category:"Feeding Implementation", rating:4, createdAt:"2026-10-02", status:"Acknowledged",
    message:"Kinder and Grade 1 are fed before recess so the learners eat inside the feeding area. Endline weighing is scheduled for October 19–20." },
  { school:"Cabaruan Elementary School", author:"Rodelio Marquez", role:"SBFP Focal", category:"Supplies & Logistics", rating:2, createdAt:"2026-10-06", status:"New",
    message:"Our plates and spoons are only enough for one section at a time, so we borrow from the EPP kitchen. Requesting a set for the second feeding area." },
  { school:"Anonas National High School", author:"Percival Bautista", role:"School Head", category:"Learner Concerns", rating:4, createdAt:"2026-10-07", status:"New",
    message:"Two Grade 9 learners flagged Wasted at baseline improved to Normal at the midline. Their parents are requesting a continuation form for next school year." },
];

const FEEDBACK_SEED: SchoolFeedback[] = FEEDBACK_ROWS
  .map(({ school, ...f }, i) => ({ ...f, id:`fb${String(i+1).padStart(2,"0")}`, schoolId: schoolIdOf(school) }))
  .filter(f => f.schoolId);

// ── Feedback helpers ──────────────────────────────────────────────────────────
const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** ISO date → "Oct 02, 2026" */
export function shortDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${MONTH_ABBR[Number(m[2]) - 1] ?? m[2]} ${m[3]}, ${m[1]}`;
}

/** ISO date → "today" / "6 days ago"; anything older stays an absolute date. */
export function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - Date.parse(`${iso}T00:00:00`)) / 86400000);
  if (!Number.isFinite(days) || days < 0) return shortDate(iso);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return shortDate(iso);
}

/** One hue per kind of feedback (6-digit hex — Pill appends alpha to it). */
function categoryColor(c: FeedbackCategory, t: TC): string {
  switch (c) {
    case "Feeding Implementation": return t.accent;
    case "Nutrition Data": return t.blue;
    case "Supplies & Logistics": return t.orange;
    case "Learner Concerns": return t.lime;
    case "System / Forms": return t.isDark ? "#c9a4ff" : "#6b3fa0";
    default: return t.isDark ? "#9a9a9a" : "#57574f";
  }
}

/** Status pill colour — amber while new, blue once acknowledged, green when closed. */
function statusColor(s: FeedbackStatus, t: TC): string {
  return s === "New" ? t.orange : s === "Acknowledged" ? t.blue : t.accent;
}

function Stars({ rating, color, size = 11 }: { rating: number; color: string; size?: number }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span title={`${rating} of 5`} style={{ fontFamily:"'JetBrains Mono',monospace", color, fontSize:`${size}px`, letterSpacing:"1px" }}>
      {"★".repeat(full)}{"☆".repeat(5 - full)}
    </span>
  );
}

// ── Shared UI Primitives ───────────────────────────────────────────────────────
/** The delete-warning dialog, in the console's theme. */
const confirmPalette = (t: TC): ConfirmPalette => ({
  surface: t.surface,
  surface2: t.surfaceDeep,
  border: t.border,
  text: t.text,
  sub: t.sub,
  danger: t.danger,
  dangerSoft: t.isDark ? "#ff4b4b22" : "#bc2f2f16",
  dangerText: t.isDark ? "#100505" : "#ffffff",
  font: "'Outfit',sans-serif",
});

function Pill({ label, color }: { label: string; color: string }) {
  return <span className="text-[9px] px-1.5 py-0.5 rounded-sm" style={{ background:color+"20", color, border:`1px solid ${color}40` }}>{label}</span>;
}

function StatCard({ label, value, accent, t }: { label:string; value:string|number; accent?:boolean; t:TC }) {
  return (
    <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-4 flex flex-col gap-2">
      <div className="text-[9px] tracking-widest uppercase" style={{ color:t.dim }}>{label}</div>
      <div className="text-2xl font-semibold" style={{ fontFamily:"'JetBrains Mono',monospace", color: accent ? t.accent : t.text }}>{value}</div>
    </div>
  );
}

function Bar({ val, max, color, t }: { val:number; max:number; color:string; t:TC }) {
  return (
    <div className="h-0.5 rounded-full overflow-hidden" style={{ background:t.border }}>
      <div style={{ width:`${max>0?(val/max)*100:0}%`, background:color }} className="h-full" />
    </div>
  );
}

function YesNoToggle({ value, onChange, t }: { value:YesNo; onChange:(v:YesNo)=>void; t:TC }) {
  return (
    <div className="flex gap-1">
      {(["Yes","No"] as YesNo[]).map(v => (
        <button key={v} onClick={() => onChange(v)} className="flex-1 h-[38px] text-xs rounded-sm cursor-pointer border transition-colors"
          style={value===v ? { background:v==="Yes"?t.accentBg:t.danger+"15", color:v==="Yes"?t.accent:t.danger, borderColor:v==="Yes"?t.accent+"40":t.danger+"40" } : { background:t.surface2, color:t.dim, borderColor:t.border }}>
          {v}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children, span, t }: { label: string; children: React.ReactNode; span?: string; t: TC }) {
  return (
    <div className={span}>
      <label className="block text-[9px] tracking-widest uppercase mb-1.5" style={{ color: t.dim }}>{label}</label>
      {children}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ view, setView, selectedSchool, setSelectedSchool, themeMode, toggleTheme, schools, registeredSchools, mobileOpen, onNavigate }: {
  view:View; setView:(v:View)=>void; selectedSchool:School|null; setSelectedSchool:(s:School|null)=>void;
  themeMode:"dark"|"light"; toggleTheme:()=>void; schools:School[];
  /** How many schools hold a Teacher Portal account issued from this console. */
  registeredSchools:number;
  /** Narrow screens: the same panel slides in over the content as a drawer. */
  mobileOpen:boolean; onNavigate:()=>void;
}) {
  const t = useT();
  const nav: { id:View; label:string; icon:string; requiresSchool?:boolean }[] = [
    { id:"district", label:"District Dashboard", icon:"◎" },
    { id:"feedback", label:"Feedbacks", icon:"✉" },
    { id:"schools", label:"All Schools", icon:"◉" },
    { id:"accounts", label:"Teacher Accounts", icon:"⚙" },
    { id:"dashboard", label:"Dashboard", icon:"▦", requiresSchool:true },
    { id:"records", label:"Student Records", icon:"☰", requiresSchool:true },
    { id:"entry", label:"Data Entry", icon:"✎", requiresSchool:true },
    { id:"table", label:"Summary Table", icon:"≡", requiresSchool:true },
    { id:"analytics", label:"Analytics", icon:"↗", requiresSchool:true },
  ];
  return (
    <aside style={{ borderRight:`1px solid ${t.border}`, background:t.surface }}
      className={`w-56 max-w-[85vw] flex-shrink-0 flex flex-col h-full fixed md:static inset-y-0 left-0 z-40 transition-transform duration-200 ${mobileOpen ? "translate-x-0 shadow-2xl md:shadow-none" : "-translate-x-full"} md:translate-x-0`}>
      <div className="px-5 py-4" style={{ borderBottom:`1px solid ${t.border}` }}>
        <div className="flex items-center gap-3">
          <img src="/school-health-wheel.svg" alt="Coordinated School Health" width={44} height={44} className="w-11 h-11 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight" style={{ color:t.text }}>Health Monitor</div>
            <div className="text-[10px] leading-tight mt-1" style={{ color:t.dim }}>Urdaneta City Schools</div>
          </div>
        </div>
      </div>

      {selectedSchool && (
        <div className="mx-3 mt-3 p-3 rounded-sm" style={{ border:`1px solid ${t.border}`, background:t.surface2 }}>
          <div className="text-[8px] tracking-widest uppercase mb-1" style={{ color:t.dim }}>Selected School</div>
          <div className="text-[11px] leading-snug font-medium" style={{ color:t.text }}>{selectedSchool.name}</div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Pill label={selectedSchool.type==="Elementary"?"ES":"HS"} color={selectedSchool.type==="Elementary"?t.blue:t.lime} />
            <button onClick={() => { setSelectedSchool(null); setView("schools"); onNavigate(); }} className="text-[9px] cursor-pointer ml-auto transition-colors" style={{ color:t.dim }}
              onMouseEnter={e=>(e.currentTarget.style.color=t.sub)} onMouseLeave={e=>(e.currentTarget.style.color=t.dim)}>✕ clear</button>
          </div>
        </div>
      )}

      <nav className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-0.5 mt-1">
        {nav.map(item => {
          const disabled = !!(item.requiresSchool && !selectedSchool);
          const active = view === item.id;
          return (
            <button key={item.id} onClick={() => { if (disabled) return; setView(item.id); onNavigate(); }} disabled={disabled}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left text-sm transition-all"
              style={{ color: disabled ? t.faint : active ? t.accent : t.dim, background: active ? t.accentBg : "transparent", cursor: disabled ? "not-allowed" : "pointer" }}
              onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.color = t.sub; }}
              onMouseLeave={e => { if (!disabled && !active) e.currentTarget.style.color = t.dim; }}>
              <span className="w-4 text-center text-base">{item.icon}</span>{item.label}
            </button>
          );
        })}
      </nav>

      <div className="side-safe p-4 flex flex-col gap-3" style={{ borderTop:`1px solid ${t.border}` }}>
        <div style={{ color:t.sub }} className="flex flex-col gap-1">
          <span className="text-[9px] tracking-widest uppercase" style={{ color:t.dim }}>Signed in</span>
          <UserButton />
        </div>
        <a href="/teacher" title="The website each school's teacher signs in to"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-sm text-xs transition-all"
          style={{ border:`1px solid ${t.border}`, background:t.surface2, color:t.sub, textDecoration:"none" }}>
          <span>⇱</span>
          <span className="flex-1">Teacher Portal</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", color: registeredSchools ? t.accent : t.dim }}>
            {registeredSchools}/{schools.length}
          </span>
        </a>
        <button onClick={toggleTheme} className="w-full flex items-center gap-2 px-3 py-2 rounded-sm text-xs cursor-pointer transition-all"
          style={{ border:`1px solid ${t.border}`, background:t.surface2, color:t.sub }}>
          <span>{themeMode === "dark" ? "☀" : "☾"}</span>
          {themeMode === "dark" ? "Day Mode" : "Night Mode"}
        </button>
        <div className="text-[10px] leading-relaxed" style={{ color:t.faint }}>
          {schools.filter(s=>s.type==="Elementary").length} ES · {schools.filter(s=>s.type==="High School").length} HS<br />SY 2025–2026
        </div>
      </div>
    </aside>
  );
}

// ── District Dashboard ────────────────────────────────────────────────────────
function DistrictDashboard({ students, schools, feedbacks, onOpenFeedbacks }: {
  students:Student[]; schools:School[]; feedbacks:SchoolFeedback[]; onOpenFeedbacks:()=>void;
}) {
  const t = useT();
  const [tab, setTab] = useState<"All"|"Elementary"|"High School">("All");

  const esIds = useMemo(() => new Set(schools.filter(s=>s.type==="Elementary").map(s=>s.id)), [schools]);
  const hsIds = useMemo(() => new Set(schools.filter(s=>s.type==="High School").map(s=>s.id)), [schools]);

  const filtered = useMemo(() => tab==="All" ? students : students.filter(s => tab==="Elementary" ? esIds.has(s.schoolId) : hsIds.has(s.schoolId)), [students, tab, esIds, hsIds]);
  // One row per student (prefer Endline) so totals are not tripled by period records
  const uniqueFiltered = useMemo(() => uniqueStudents(filtered), [filtered]);

  const bmiDist = BMI_STATUSES.map(st => ({ label:st, val:uniqueFiltered.filter(s=>s.bmiStatus===st).length, color:t.bmi[st] }));
  const hfaDist = HFA_STATUSES.map(st => ({ label:st, val:uniqueFiltered.filter(s=>s.hfaStatus===st).length, color:t.hfa[st] }));
  const maxBMI = Math.max(...bmiDist.map(x=>x.val), 1);
  const maxHFA = Math.max(...hfaDist.map(x=>x.val), 1);

  const periodCounts = PERIODS.map(p => ({ period:p, count:uniqueCount(filtered.filter(s=>s.period===p)) }));
  const maxPeriod = Math.max(...periodCounts.map(x=>x.count), 1);

  const topSchools = schools.map(s => {
    const schoolRecs = students.filter(st=>st.schoolId===s.id);
    const uniq = uniqueStudents(schoolRecs);
    return {
      school: s,
      count: uniq.length,
      atRisk: uniq.filter(st=>st.bmiStatus==="Severely Wasted"||st.bmiStatus==="Wasted").length,
    };
  }).filter(x=>x.count>0).sort((a,b)=>b.atRisk-a.atRisk).slice(0,8);

  const esCount = uniqueCount(students.filter(s=>esIds.has(s.schoolId)));
  const hsCount = uniqueCount(students.filter(s=>hsIds.has(s.schoolId)));
  const esSchoolsWithData = schools.filter(s=>s.type==="Elementary"&&students.some(st=>st.schoolId===s.id)).length;
  const hsSchoolsWithData = schools.filter(s=>s.type==="High School"&&students.some(st=>st.schoolId===s.id)).length;

  // Feedbacks from every school, newest first — the Feedbacks page shows the rest.
  const latestFeedback = useMemo(
    () => [...feedbacks].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
    [feedbacks]
  );
  const openFeedback = feedbacks.filter(f=>f.status!=="Resolved").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold" style={{ color:t.text }}>District Dashboard</h1>
          <p className="text-xs mt-0.5" style={{ color:t.dim }}>All Schools · SY 2025–2026</p>
        </div>
        <div className="flex gap-1.5">
          {(["All","Elementary","High School"] as const).map(tb => (
            <button key={tb} onClick={() => setTab(tb)} className="px-3 py-1.5 text-xs rounded-sm cursor-pointer border transition-colors"
              style={tab===tb ? { background:t.accentBg, color:t.accent, borderColor:t.accent+"40" } : { background:t.surface, color:t.dim, borderColor:t.border }}>
              {tb}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background:t.border }}>
        <StatCard label="Total Students" value={uniqueFiltered.length} accent t={t} />
        <StatCard label="Schools with Data" value={tab==="All"?`${esSchoolsWithData+hsSchoolsWithData}/${schools.length}`:tab==="Elementary"?`${esSchoolsWithData}/${schools.filter(s=>s.type==="Elementary").length}`:`${hsSchoolsWithData}/${schools.filter(s=>s.type==="High School").length}`} t={t} />
        <StatCard label="Elementary Students" value={esCount} t={t} />
        <StatCard label="High School Students" value={hsCount} t={t} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background:t.border }}>
        <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-5">
          <div className="text-[9px] tracking-widest uppercase mb-4" style={{ color:t.dim }}>BMI Distribution</div>
          {bmiDist.map(c => (
            <div key={c.label} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-xs" style={{ color:t.sub }}>{c.label}</span>
                <span className="text-[10px]" style={{ fontFamily:"'JetBrains Mono',monospace", color:c.color }}>{c.val}</span>
              </div>
              <Bar val={c.val} max={maxBMI} color={c.color} t={t} />
            </div>
          ))}
        </div>
        <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-5">
          <div className="text-[9px] tracking-widest uppercase mb-4" style={{ color:t.dim }}>HFA Distribution</div>
          {hfaDist.map(c => (
            <div key={c.label} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-xs" style={{ color:t.sub }}>{c.label}</span>
                <span className="text-[10px]" style={{ fontFamily:"'JetBrains Mono',monospace", color:c.color }}>{c.val}</span>
              </div>
              <Bar val={c.val} max={maxHFA} color={c.color} t={t} />
            </div>
          ))}
        </div>
        <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-5">
          <div className="text-[9px] tracking-widest uppercase mb-4" style={{ color:t.dim }}>Students by Period</div>
          <div className="flex items-end gap-3 h-28">
            {periodCounts.map(d => (
              <div key={d.period} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-sm font-semibold" style={{ fontFamily:"'JetBrains Mono',monospace", color:t.period[d.period] }}>{d.count}</span>
                <div className="w-full rounded-sm" style={{ height:`${(d.count/maxPeriod)*70}px`, minHeight:"2px", background:t.period[d.period]+"70" }} />
                <span className="text-[9px]" style={{ color:t.period[d.period] }}>{d.period}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {topSchools.length > 0 && (
        <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-5">
          <div className="text-[9px] tracking-widest uppercase mb-4" style={{ color:t.dim }}>Schools with Most At-Risk Students (Wasted/Severely Wasted)</div>
          <div className="flex flex-col gap-0">
            {topSchools.map(x => (
              <div key={x.school.id} className="flex items-center justify-between py-2.5" style={{ borderBottom:`1px solid ${t.border}` }}>
                <div className="flex items-center gap-2">
                  <Pill label={x.school.type==="Elementary"?"ES":"HS"} color={x.school.type==="Elementary"?t.blue:t.lime} />
                  <span className="text-sm" style={{ color:t.text }}>{x.school.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs" style={{ color:t.dim }}>{x.count} students</span>
                  <span className="text-xs font-semibold" style={{ fontFamily:"'JetBrains Mono',monospace", color:x.atRisk>0?t.danger:t.dim }}>{x.atRisk} at-risk</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedbacks — every school's submissions, newest first */}
      <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[9px] tracking-widest uppercase" style={{ color:t.dim }}>Feedbacks — from all schools</span>
            {openFeedback > 0 && <Pill label={`${openFeedback} open`} color={t.orange} />}
          </div>
          <button onClick={onOpenFeedbacks} className="text-[11px] px-3 py-1.5 rounded-sm cursor-pointer border transition-colors"
            style={{ background:t.accentBg, color:t.accent, borderColor:t.accent+"40" }}>
            View all {feedbacks.length} feedbacks →
          </button>
        </div>
        {latestFeedback.length === 0 ? (
          <p className="text-xs" style={{ color:t.dim }}>No school has sent feedback yet.</p>
        ) : (
          <div className="flex flex-col gap-0">
            {latestFeedback.map(f => {
              const school = schools.find(s=>s.id===f.schoolId);
              return (
                <div key={f.id} className="flex items-start justify-between gap-4 py-3" style={{ borderBottom:`1px solid ${t.border}` }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium" style={{ color:t.text }}>{school?.name ?? "Unknown school"}</span>
                      <Pill label={f.category} color={categoryColor(f.category, t)} />
                    </div>
                    <p className="text-[11px] mt-1 leading-relaxed line-clamp-2" style={{ color:t.sub }}>{f.message}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Pill label={f.status} color={statusColor(f.status, t)} />
                    <span className="text-[9px]" style={{ color:t.faint }}>{ageLabel(f.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Feedbacks — one district feed fed by every school ─────────────────────────
function Feedbacks({ feedbacks, setFeedbacks, schools, defaultSchool }: {
  feedbacks:SchoolFeedback[]; setFeedbacks:(f:SchoolFeedback[])=>void;
  schools:School[]; defaultSchool:School|null;
}) {
  const t = useT();
  const [tab, setTab] = useState<"All"|SchoolType>("All");
  const [status, setStatus] = useState<FeedbackStatus|"All">("All");
  const [category, setCategory] = useState<FeedbackCategory|"All">("All");
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [openReply, setOpenReply] = useState<string|null>(null);
  const [replyText, setReplyText] = useState("");
  // Record-feedback form
  const [fSchool, setFSchool] = useState(defaultSchool?.id ?? "");
  const [fAuthor, setFAuthor] = useState("");
  const [fRole, setFRole] = useState("SBFP Focal");
  const [fCategory, setFCategory] = useState<FeedbackCategory>("Feeding Implementation");
  const [fRating, setFRating] = useState(5);
  const [fMessage, setFMessage] = useState("");

  const byId = useMemo(() => new Map(schools.map(s => [s.id, s])), [schools]);

  const filtered = useMemo(() => feedbacks
    .filter(f => {
      const school = byId.get(f.schoolId);
      if (tab !== "All" && school?.type !== tab) return false;
      if (status !== "All" && f.status !== status) return false;
      if (category !== "All" && f.category !== category) return false;
      const needle = q.trim().toLowerCase();
      if (needle) {
        const hay = `${f.message} ${f.author} ${f.role} ${f.response ?? ""} ${school?.name ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)),
  [feedbacks, byId, tab, status, category, q]);

  const newCount = feedbacks.filter(f => f.status === "New").length;
  const openCount = feedbacks.filter(f => f.status !== "Resolved").length;
  const schoolsReporting = new Set(feedbacks.map(f => f.schoolId)).size;
  const rated = feedbacks.filter(f => f.rating > 0);
  const avgRating = rated.length ? rated.reduce((s, f) => s + f.rating, 0) / rated.length : 0;

  const setStatusOf = (id: string, next: FeedbackStatus) =>
    setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status: next } : f));

  const saveResponse = (id: string) => {
    const text = replyText.trim();
    if (!text) return;
    setFeedbacks(feedbacks.map(f => f.id === id
      ? { ...f, response: text, status: f.status === "New" ? "Acknowledged" : f.status }
      : f));
    setReplyText("");
    setOpenReply(null);
  };

  const submit = () => {
    if (!fSchool || !fMessage.trim()) return;
    const entry: SchoolFeedback = {
      id: `fb-${Date.now()}`,
      schoolId: fSchool,
      author: fAuthor.trim() || "Unspecified",
      role: fRole.trim() || "School staff",
      category: fCategory,
      rating: fRating,
      message: fMessage.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      status: "New",
    };
    setFeedbacks([entry, ...feedbacks]);
    // Clear the filters too, so what was just recorded is on screen.
    setTab("All"); setStatus("All"); setCategory("All"); setQ("");
    setFMessage(""); setFAuthor(""); setFRating(5); setShowForm(false);
  };

  const inp = { background:t.surface2, color:t.text, border:`1px solid ${t.border}` } as CSSProperties;
  const chip = (active: boolean) => active
    ? { background:t.accentBg, color:t.accent, borderColor:t.accent+"40" }
    : { background:t.surface, color:t.dim, borderColor:t.border };
  const canSubmit = !!fSchool && !!fMessage.trim();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold" style={{ color:t.text }}>Feedbacks</h1>
          <p className="text-xs mt-0.5" style={{ color:t.dim }}>
            Every school's feedback in one district feed · {schoolsReporting} of {schools.length} schools have sent in
          </p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="px-3 py-1.5 text-xs rounded-sm cursor-pointer font-semibold border transition-colors"
          style={showForm ? { background:t.surface2, color:t.sub, borderColor:t.border } : { background:t.accent, color:t.accentText, borderColor:t.accent }}>
          {showForm ? "Cancel" : "＋ Record Feedback"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background:t.border }}>
        <StatCard label="Total Feedback" value={feedbacks.length} accent t={t} />
        <StatCard label="New" value={newCount} t={t} />
        <StatCard label="Still Open" value={openCount} t={t} />
        <StatCard label="Resolved" value={feedbacks.length - openCount} t={t} />
      </div>

      <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div className="text-[9px] tracking-widest uppercase" style={{ color:t.dim }}>Schools Reporting</div>
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color:t.dim }}>Average rating</span>
            <span className="text-sm font-semibold" style={{ fontFamily:"'JetBrains Mono',monospace", color:t.text }}>{avgRating ? avgRating.toFixed(1) : "—"}</span>
            <Stars rating={avgRating} color={t.orange} size={12} />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-xl font-semibold" style={{ fontFamily:"'JetBrains Mono',monospace", color:t.accent }}>{schoolsReporting}</span>
          <span className="text-[11px]" style={{ color:t.dim }}>of {schools.length} schools</span>
        </div>
        <Bar val={schoolsReporting} max={Math.max(schools.length, 1)} color={t.accent} t={t} />
      </div>

      {showForm && (
        <div style={{ border:`1px solid ${t.accent}40`, background:t.surface }} className="p-5 flex flex-col gap-4">
          <div className="text-[9px] tracking-widest uppercase" style={{ color:t.accent }}>Record feedback from a school</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="School" span="md:col-span-2" t={t}>
              <select value={fSchool} onChange={e => setFSchool(e.target.value)} className="w-full text-sm px-3 py-2 rounded-sm outline-none" style={{ ...inp, cursor:"pointer" }}>
                <option value="">— Select a school —</option>
                {schools.filter(s => s.type === "Elementary").map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                {schools.filter(s => s.type === "High School").map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Submitted by" t={t}>
              <input value={fAuthor} onChange={e => setFAuthor(e.target.value)} placeholder="Name of sender"
                className="w-full text-sm px-3 py-2 rounded-sm outline-none" style={{ ...inp, fontFamily:"'Outfit',sans-serif" }} />
            </Field>
            <Field label="Role" t={t}>
              <input value={fRole} onChange={e => setFRole(e.target.value)} placeholder="SBFP Focal"
                className="w-full text-sm px-3 py-2 rounded-sm outline-none" style={{ ...inp, fontFamily:"'Outfit',sans-serif" }} />
            </Field>
            <Field label="Category" t={t}>
              <select value={fCategory} onChange={e => setFCategory(e.target.value as FeedbackCategory)} className="w-full text-sm px-3 py-2 rounded-sm outline-none" style={{ ...inp, cursor:"pointer" }}>
                {FEEDBACK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Rating — how is feeding going?" span="md:col-span-3" t={t}>
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setFRating(n)} className="cursor-pointer leading-none"
                    title={`${n} of 5`} style={{ color:n <= fRating ? t.orange : t.faint, fontSize:"20px" }}>★</button>
                ))}
                <span className="text-[10px] ml-1" style={{ color:t.dim }}>{fRating} of 5</span>
              </div>
            </Field>
            <Field label="Feedback" span="md:col-span-4" t={t}>
              <textarea rows={3} value={fMessage} onChange={e => setFMessage(e.target.value)} placeholder="What is the school reporting?"
                className="w-full text-sm px-3 py-2 rounded-sm outline-none resize-y" style={{ ...inp, fontFamily:"'Outfit',sans-serif" }} />
            </Field>
          </div>
          <div className="flex justify-end">
            <button onClick={submit} disabled={!canSubmit} className="px-4 py-2 text-xs rounded-sm font-semibold border transition-colors"
              style={{ background:canSubmit ? t.accent : t.surface2, color:canSubmit ? t.accentText : t.faint, borderColor:t.border, cursor:canSubmit ? "pointer" : "not-allowed" }}>
              Submit feedback
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {(["All","Elementary","High School"] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className="px-3 py-1.5 text-xs rounded-sm cursor-pointer border transition-colors" style={chip(tab===tb)}>
            {tb === "All" ? "All Schools" : tb}
          </button>
        ))}
        <span className="w-px h-5 mx-1" style={{ background:t.border }} />
        {(["All", ...FEEDBACK_STATUSES] as const).map(s => {
          const n = s === "All" ? feedbacks.length : feedbacks.filter(f => f.status === s).length;
          return (
            <button key={s} onClick={() => setStatus(s)} className="px-3 py-1.5 text-xs rounded-sm cursor-pointer border transition-colors" style={chip(status===s)}>
              {s} <span style={{ color: status===s ? t.accent : t.faint }}>{n}</span>
            </button>
          );
        })}
        <select value={category} onChange={e => setCategory(e.target.value as FeedbackCategory|"All")}
          className="text-xs px-2 py-1.5 rounded-sm outline-none cursor-pointer" style={inp}>
          <option value="All">All categories</option>
          {FEEDBACK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search feedback…"
          className="text-xs px-3 py-1.5 rounded-sm outline-none w-44 md:ml-auto" style={{ ...inp, fontFamily:"'Outfit',sans-serif" }} />
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div style={{ border:`1px dashed ${t.border}`, background:t.surface }} className="p-8 text-center">
            <p className="text-sm" style={{ color:t.sub }}>No feedback matches these filters.</p>
            <p className="text-xs mt-1" style={{ color:t.dim }}>Try another status, category or school type.</p>
          </div>
        )}
        {filtered.map(f => {
          const school = byId.get(f.schoolId);
          const isOpen = openReply === f.id;
          const canSend = !!replyText.trim();
          return (
            <div key={f.id} style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  {school && <Pill label={school.type === "Elementary" ? "ES" : "HS"} color={school.type === "Elementary" ? t.blue : t.lime} />}
                  <span className="text-sm font-medium" style={{ color:t.text }}>{school?.name ?? "Unknown school"}</span>
                  <Pill label={f.category} color={categoryColor(f.category, t)} />
                  {f.origin === "Teacher Portal" && (
                    <span title="The school sent this from the Teacher Portal"
                      className="text-[9px] px-1.5 py-0.5 rounded-sm" style={{ border:`1px solid ${t.border}`, color:t.sub, background:t.surface2 }}>
                      ⇱ Teacher Portal
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Stars rating={f.rating} color={t.orange} />
                  <Pill label={f.status} color={statusColor(f.status, t)} />
                </div>
              </div>

              <p className="text-sm mt-3 leading-relaxed" style={{ color:t.text }}>{f.message}</p>

              <div className="flex items-center gap-2 mt-3 flex-wrap text-[10px]" style={{ color:t.dim }}>
                <span>{f.author} · {f.role}</span>
                <span style={{ color:t.faint }}>•</span>
                <span style={{ color:t.faint }}>{shortDate(f.createdAt)} · {ageLabel(f.createdAt)}</span>
              </div>

              {f.response && (
                <div className="mt-3 pl-3 py-2" style={{ borderLeft:`2px solid ${t.accent}`, background:t.accentBg }}>
                  <div className="text-[9px] tracking-widest uppercase mb-1" style={{ color:t.accent }}>District response</div>
                  <p className="text-xs leading-relaxed" style={{ color:t.sub }}>{f.response}</p>
                </div>
              )}

              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {f.status === "New" && (
                  <button onClick={() => setStatusOf(f.id, "Acknowledged")} className="px-2.5 py-1 text-[10px] rounded-sm cursor-pointer border"
                    style={{ color:t.blue, borderColor:t.blue+"40", background:t.blue+"15" }}>Acknowledge</button>
                )}
                {f.status !== "Resolved" ? (
                  <button onClick={() => setStatusOf(f.id, "Resolved")} className="px-2.5 py-1 text-[10px] rounded-sm cursor-pointer border"
                    style={{ color:t.accent, borderColor:t.accent+"40", background:t.accentBg }}>Mark resolved</button>
                ) : (
                  <button onClick={() => setStatusOf(f.id, "Acknowledged")} className="px-2.5 py-1 text-[10px] rounded-sm cursor-pointer border"
                    style={{ color:t.dim, borderColor:t.border, background:t.surface2 }}>Reopen</button>
                )}
                <button onClick={() => { setOpenReply(isOpen ? null : f.id); setReplyText(f.response ?? ""); }}
                  className="px-2.5 py-1 text-[10px] rounded-sm cursor-pointer border"
                  style={{ color:t.dim, borderColor:t.border, background:t.surface2 }}>
                  {f.response ? "Edit response" : "Respond"}
                </button>
              </div>

              {isOpen && (
                <div className="mt-3 flex flex-col gap-2">
                  <textarea rows={2} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write the district's answer back to this school…"
                    className="w-full text-sm px-3 py-2 rounded-sm outline-none resize-y" style={{ ...inp, fontFamily:"'Outfit',sans-serif" }} />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setOpenReply(null); setReplyText(""); }} className="px-3 py-1.5 text-[10px] rounded-sm cursor-pointer border"
                      style={{ color:t.dim, borderColor:t.border, background:t.surface2 }}>Cancel</button>
                    <button onClick={() => saveResponse(f.id)} disabled={!canSend} className="px-3 py-1.5 text-[10px] rounded-sm font-semibold border"
                      style={{ background:canSend ? t.accent : t.surface2, color:canSend ? t.accentText : t.faint, borderColor:t.border, cursor:canSend ? "pointer" : "not-allowed" }}>
                      Send response
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Schools List ──────────────────────────────────────────────────────────────
function SchoolsList({ students, schools, setSchools, setStudents, onSelect }: {
  students:Student[]; schools:School[]; setSchools:(s:School[])=>void;
  setStudents:(s:Student[])=>void; onSelect:(s:School)=>void;
}) {
  const t = useT();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SchoolType|"All">("All");
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editingName, setEditingName] = useState("");
  /** Form 1A header fields of the school being edited (Excel export header block) */
  const [editingDetails, setEditingDetails] = useState<SchoolFormDetails>(EMPTY_FORM_DETAILS);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<SchoolType>("Elementary");
  /** Deleting a school deletes its learner records too — warn before that. */
  const [pendingDelete, setPendingDelete] = useState<School | null>(null);

  const filtered = useMemo(() => schools.filter(
    s => (typeFilter==="All"||s.type===typeFilter) && s.name.toLowerCase().includes(search.toLowerCase())
  ), [schools, search, typeFilter]);

  const coverage = (id: string) => PERIODS.filter(p => students.some(s=>s.schoolId===id&&s.period===p));
  const count = (id: string) => uniqueCount(students.filter(s=>s.schoolId===id));

  const startEdit = (s: School) => {
    setEditingId(s.id);
    setEditingName(s.name);
    setEditingDetails({
      division: s.division, cityMunicipalityBarangay: s.cityMunicipalityBarangay, schoolIdNumber: s.schoolIdNumber,
      principal: s.principal, focalPerson: s.focalPerson,
      dateStartFeeding: s.dateStartFeeding, lastMileSchool: s.lastMileSchool,
    });
  };
  const saveEdit = () => {
    if (editingName.trim()) {
      setSchools(schools.map(s => s.id===editingId ? { ...s, name:editingName.trim(), ...editingDetails } : s));
    }
    setEditingId(null);
  };
  const deleteSchool = (id: string) => {
    setSchools(schools.filter(s=>s.id!==id));
    setStudents(students.filter(s=>s.schoolId!==id));
  };
  const addSchool = () => {
    if (!newName.trim()) return;
    const id = `${newType==="Elementary"?"es":"hs"}${Date.now()}`;
    setSchools([...schools, { id, name:newName.trim(), type:newType, ...EMPTY_FORM_DETAILS }]);
    setNewName(""); setShowAdd(false);
  };

  const inp = { background:t.surface2, color:t.text, border:`1px solid ${t.border}` } as CSSProperties;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold" style={{ color:t.text }}>All Schools</h1>
          <p className="text-xs mt-0.5" style={{ color:t.dim }}>{schools.filter(s=>s.type==="Elementary").length} elementary · {schools.filter(s=>s.type==="High School").length} high school</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search schools…"
            className="text-sm px-3 py-1.5 rounded-sm outline-none w-48" style={{ ...inp, fontFamily:"'Outfit',sans-serif" }} />
          {(["All","Elementary","High School"] as const).map(type => (
            <button key={type} onClick={() => setTypeFilter(type)} className="px-3 py-1.5 text-xs rounded-sm cursor-pointer border transition-colors"
              style={typeFilter===type ? { background:t.accentBg, color:t.accent, borderColor:t.accent+"40" } : { background:t.surface, color:t.dim, borderColor:t.border }}>
              {type}
            </button>
          ))}
          <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 text-xs rounded-sm cursor-pointer font-semibold transition-colors"
            style={{ background:t.accent, color:t.accentText }}>
            + Add School
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px" style={{ background:t.border }}>
        {PERIODS.map(p => {
          const n = schools.filter(s=>students.some(st=>st.schoolId===s.id&&st.period===p)).length;
          return (
            <div key={p} style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-4">
              <div className="text-[9px] tracking-widest uppercase mb-2" style={{ color:t.period[p] }}>{p}</div>
              <div className="text-xl font-semibold" style={{ fontFamily:"'JetBrains Mono',monospace", color:t.text }}>{n}<span className="text-sm" style={{ color:t.faint }}>/{schools.length}</span></div>
              <div className="text-[10px] mt-1" style={{ color:t.dim }}>schools with data</div>
              <Bar val={n} max={schools.length} color={t.period[p]} t={t} />
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div style={{ border:`1px solid ${t.accent}40`, background:t.accentBg }} className="p-4 rounded-sm flex items-center gap-3 flex-wrap">
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="School name…" onKeyDown={e=>e.key==="Enter"&&addSchool()}
            className="flex-1 min-w-[200px] text-sm px-3 py-2 rounded-sm outline-none" style={{ ...inp }} />
          <div className="flex gap-1.5">
            {(["Elementary","High School"] as SchoolType[]).map(type => (
              <button key={type} onClick={() => setNewType(type)} className="px-3 py-2 text-xs rounded-sm cursor-pointer border transition-colors"
                style={newType===type ? { background:t.accentBg, color:t.accent, borderColor:t.accent+"40" } : { background:t.surface2, color:t.dim, borderColor:t.border }}>
                {type}
              </button>
            ))}
          </div>
          <button onClick={addSchool} className="px-4 py-2 text-sm font-semibold rounded-sm cursor-pointer" style={{ background:t.accent, color:t.accentText }}>Save</button>
          <button onClick={() => { setShowAdd(false); setNewName(""); }} className="text-sm cursor-pointer" style={{ color:t.dim }}>Cancel</button>
        </div>
      )}

      <p className="text-[10px] md:hidden -mb-2" style={{ color: t.dim }}>
        Swipe the table sideways for the period columns and actions →
      </p>
      <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr style={{ borderBottom:`1px solid ${t.border}` }}>
              <th className="text-left px-4 py-3 text-[9px] tracking-widest uppercase" style={{ color:t.dim }}>School</th>
              <th className="px-4 py-3 text-[9px] tracking-widest uppercase text-center" style={{ color:t.dim }}>Type</th>
              {PERIODS.map(p => <th key={p} className="px-4 py-3 text-[9px] tracking-widest uppercase text-center" style={{ color:t.period[p]+"99" }}>{p}</th>)}
              <th className="px-4 py-3 text-[9px] tracking-widest uppercase text-center" style={{ color:t.dim }}>Students</th>
              <th className="px-4 py-3 w-56 text-right text-[9px] tracking-widest uppercase" style={{ color:t.dim }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(school => {
              const cov = coverage(school.id);
              const n = count(school.id);
              const isEditing = editingId === school.id;
              return (
                <Fragment key={school.id}>
                <tr className="group transition-colors" style={{ borderBottom:`1px solid ${t.border}` }}
                  onMouseEnter={e=>(e.currentTarget.style.background=t.hover)} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <td className="px-4 py-2.5 font-medium">
                    {/* The row's own Open button sits at the far right, which on a
                        phone is a sideways scroll away. Tapping the school's own
                        name opens it too, right where the eye already is. */}
                    <button type="button" onClick={() => onSelect(school)} title={`Open ${school.name}`}
                      className="text-left transition-colors"
                      style={{ color: isEditing ? t.accent : t.text, background:"none", border:"none", padding:0, font:"inherit", cursor:"pointer" }}
                      onMouseEnter={e=>{ e.currentTarget.style.textDecoration="underline"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.textDecoration="none"; }}>{school.name}</button>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Pill label={school.type==="Elementary"?"ES":"HS"} color={school.type==="Elementary"?t.blue:t.lime} />
                  </td>
                  {PERIODS.map(p => (
                    <td key={p} className="px-4 py-2.5 text-center">
                      {cov.includes(p) ? <span style={{ color:t.period[p] }}>✓</span> : <span style={{ color:t.faint }}>—</span>}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-center text-xs" style={{ fontFamily:"'JetBrains Mono',monospace", color:n>0?t.sub:t.faint }}>{n}</td>
                  <td className="px-4 py-2.5">
                    {/* Revealed on row hover / keyboard focus (see `.row-actions` in
                        styles.css); a row being edited keeps Save / Cancel in view. */}
                    <div
                      className={
                        isEditing
                          ? "flex items-center gap-1.5 justify-end whitespace-nowrap"
                          : "row-actions flex items-center gap-1.5 justify-end whitespace-nowrap"
                      }
                    >
                      {isEditing
                        ? <>
                            <button onClick={saveEdit} className="text-xs px-3 py-1.5 rounded-sm cursor-pointer border font-semibold" style={{ background:t.accentBg, color:t.accent, borderColor:t.accent+"55" }}>Save</button>
                            <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1.5 rounded-sm cursor-pointer border" style={{ background:t.surface2, color:t.sub, borderColor:t.border }}>Cancel</button>
                          </>
                        : <>
                            <button aria-label={`Open ${school.name}`} onClick={() => onSelect(school)}
                              className="text-xs px-3 py-1.5 rounded-sm cursor-pointer border font-medium transition-colors"
                              style={{ background:t.accentBg, color:t.accent, borderColor:t.accent+"55" }}
                              onMouseEnter={e=>{ e.currentTarget.style.background=t.accent; e.currentTarget.style.color=t.accentText; }}
                              onMouseLeave={e=>{ e.currentTarget.style.background=t.accentBg; e.currentTarget.style.color=t.accent; }}>Open</button>
                            <button aria-label={`Edit ${school.name}`} onClick={() => startEdit(school)}
                              className="text-xs px-3 py-1.5 rounded-sm cursor-pointer border transition-colors"
                              style={{ background:t.surface2, color:t.sub, borderColor:t.border }}
                              onMouseEnter={e=>{ e.currentTarget.style.color=t.text; e.currentTarget.style.borderColor=t.dim; }}
                              onMouseLeave={e=>{ e.currentTarget.style.color=t.sub; e.currentTarget.style.borderColor=t.border; }}>Edit</button>
                            <button aria-label={`Delete ${school.name}`} onClick={() => setPendingDelete(school)}
                              className="text-xs px-3 py-1.5 rounded-sm cursor-pointer border transition-colors"
                              style={{ background:"transparent", color:t.danger, borderColor:t.danger+"55" }}
                              onMouseEnter={e=>{ e.currentTarget.style.background=t.danger; e.currentTarget.style.color=t.isDark ? "#100505" : "#ffffff"; }}
                              onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color=t.danger; }}>Delete</button>
                          </>}
                    </div>
                  </td>
                </tr>
                {isEditing && (
                  <tr>
                    <td colSpan={8} className="px-4 py-4" style={{ background: t.surfaceDeep }}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] tracking-widest uppercase" style={{ color: t.dim }}>Edit School — SBFP Form Details</span>
                          <span className="text-[9px]" style={{ color: t.faint }}>(printed in the Excel export header)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] tracking-widest uppercase mb-1.5" style={{ color: t.dim }}>School Name</label>
                            <input value={editingName} onChange={e=>setEditingName(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter")saveEdit(); if(e.key==="Escape")setEditingId(null); }}
                              autoFocus className="text-sm px-3 py-2 rounded-sm outline-none w-full" style={{ ...inp }} />
                          </div>
                          {FORM_DETAIL_FIELDS.map(([key, label]) => (
                            <div key={key}>
                              <label className="block text-[9px] tracking-widest uppercase mb-1.5" style={{ color: t.dim }}>{label}</label>
                              {key === "lastMileSchool" ? (
                                <div className="flex gap-1.5">
                                  {(["Yes","No"] as YesNo[]).map(v => (
                                    <button key={v} type="button"
                                      onClick={() => setEditingDetails(d => ({ ...d, lastMileSchool: d.lastMileSchool === v ? "" : v }))}
                                      className="px-4 py-2 text-xs font-semibold rounded-sm cursor-pointer border transition-colors"
                                      style={editingDetails.lastMileSchool === v
                                        ? { background:t.accentBg, color:t.accent, borderColor:t.accent+"40" }
                                        : { ...inp, color:t.dim }}>
                                      {v}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <input value={editingDetails[key]} type={key === "dateStartFeeding" ? "date" : "text"}
                                  onChange={e=>setEditingDetails(d=>({ ...d, [key]: e.target.value }))}
                                  onKeyDown={e=>{ if(e.key==="Enter")saveEdit(); if(e.key==="Escape")setEditingId(null); }}
                                  className="text-sm px-3 py-2 rounded-sm outline-none w-full"
                                  style={{ ...inp, colorScheme: t.isDark ? "dark" : "light" }} />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={saveEdit} className="px-4 py-2 text-xs font-semibold rounded-sm cursor-pointer" style={{ background: t.accent, color: t.accentText }}>Save Details</button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-2 text-xs cursor-pointer rounded-sm border" style={{ borderColor: t.border, color: t.dim }}>Cancel</button>
                          <span className="text-[10px]" style={{ color: t.faint }}>Tip: press Enter to save · Esc to cancel</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name ?? "this school"}?`}
        confirmLabel="Delete school"
        cancelLabel="Keep school"
        palette={confirmPalette(t)}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteSchool(pendingDelete.id);
          setPendingDelete(null);
        }}
      >
        {(() => {
          const count = pendingDelete
            ? students.filter(s => s.schoolId === pendingDelete.id).length
            : 0;
          return (
            <>
              The school is removed from the district list
              {count > 0
                ? " and its " + count + (count === 1 ? " learner record is" : " learner records are") + " deleted with it"
                : ""}
              , including the records the school encoded from the Teacher Portal.{" "}
              <strong style={{ color: t.text }}>This cannot be undone.</strong>
            </>
          );
        })()}
      </ConfirmDialog>
    </div>
  );
}

// ── Per-School Dashboard ──────────────────────────────────────────────────────
function Dashboard({ students, school }: { students:Student[]; school:School }) {
  const t = useT();
  const [period, setPeriod] = useState<Period|"All">("All");
  const fRaw = period==="All" ? students : students.filter(s=>s.period===period);
  // Deduplicate so one student is counted once (prefer Endline when period=All)
  const f = period==="All" ? uniqueStudents(fRaw) : fRaw;
  const bmiDist = BMI_STATUSES.map(st=>({ label:st, val:f.filter(s=>s.bmiStatus===st).length, color:t.bmi[st] }));
  const hfaDist = HFA_STATUSES.map(st=>({ label:st, val:f.filter(s=>s.hfaStatus===st).length, color:t.hfa[st] }));
  const maxBMI = Math.max(...bmiDist.map(x=>x.val),1);
  const maxHFA = Math.max(...hfaDist.map(x=>x.val),1);
  const grades = getGrades(school);
  const byGrade = grades.map(g=>({ grade:g, count:f.filter(s=>s.gradeLevel===g).length }));
  const maxG = Math.max(...byGrade.map(x=>x.count),1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold" style={{ color:t.text }}>{school.name}</h1>
          <p className="text-xs mt-0.5" style={{ color:t.dim }}>{school.type} · SY 2025–2026</p>
        </div>
        <div className="flex gap-1.5">
          {(["All",...PERIODS] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className="px-3 py-1.5 text-xs rounded-sm cursor-pointer border transition-colors"
              style={period===p
                ? p==="All" ? { background:t.accentBg, color:t.accent, borderColor:t.accent+"40" } : { background:t.period[p as Period]+"20", color:t.period[p as Period], borderColor:t.period[p as Period]+"40" }
                : { background:t.surface, color:t.dim, borderColor:t.border }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background:t.border }}>
        <StatCard label="Total Students" value={f.length} accent t={t} />
        <StatCard label="4Ps Beneficiaries" value={f.filter(s=>s.fourPs==="Yes").length} t={t} />
        <StatCard label="SBFP Prev. Years" value={f.filter(s=>s.sbfpPreviousYears==="Yes").length} t={t} />
        <StatCard label="Dewormed" value={f.filter(s=>s.dewormed==="Yes").length} t={t} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background:t.border }}>
        <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-5">
          <div className="text-[9px] tracking-widest uppercase mb-4" style={{ color:t.dim }}>BMI Status</div>
          {bmiDist.map(c=>(
            <div key={c.label} className="mb-3">
              <div className="flex justify-between mb-1"><span className="text-xs" style={{ color:t.sub }}>{c.label}</span>
                <span className="text-[10px]" style={{ fontFamily:"'JetBrains Mono',monospace", color:c.color }}>{c.val}</span></div>
              <Bar val={c.val} max={maxBMI} color={c.color} t={t} />
            </div>
          ))}
        </div>
        <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-5">
          <div className="text-[9px] tracking-widest uppercase mb-4" style={{ color:t.dim }}>HFA Status</div>
          {hfaDist.map(c=>(
            <div key={c.label} className="mb-3">
              <div className="flex justify-between mb-1"><span className="text-xs" style={{ color:t.sub }}>{c.label}</span>
                <span className="text-[10px]" style={{ fontFamily:"'JetBrains Mono',monospace", color:c.color }}>{c.val}</span></div>
              <Bar val={c.val} max={maxHFA} color={c.color} t={t} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-5">
        <div className="text-[9px] tracking-widest uppercase mb-4" style={{ color:t.dim }}>Students by Grade</div>
        <div className="flex items-end gap-2">
          {byGrade.map(({grade,count}) => (
            <div key={grade} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full rounded-sm" style={{ height:`${(count/maxG)*60}px`, minHeight:"2px", background:count>0?t.accent:t.border }} />
              <span className="text-[8px]" style={{ fontFamily:"'JetBrains Mono',monospace", color:t.faint }}>{grade.replace("SPED ","S").replace("Grade ","G").replace("Kinder","KG")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Data Entry ────────────────────────────────────────────────────────────────
function DataEntry({ students, setStudents, school, setView, editingStudent, clearEditing }: {
  students:Student[]; setStudents:(s:Student[])=>void; school:School;
  setView:(v:View)=>void; editingStudent:Student|null; clearEditing:()=>void;
}) {
  const t = useT();
  const [period, setPeriod] = useState<Period|null>(editingStudent?.period ?? null);
  const [form, setForm] = useState<Omit<Student,"id">>(() =>
    editingStudent ? { ...editingStudent } : EMPTY_STUDENT(school.id, "")
  );
  const [saved, setSaved] = useState(false);
  const [periodError, setPeriodError] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);
  /**
   * A status the user picked by hand outranks the WHO auto-classification for
   * this record. Without this, recalculating on every measurement would silently
   * throw the override away; with it, clearing the measurements still clears a
   * status that was only ever computed.
   */
  const manualStatus = useRef({ bmi: false, hfa: false });
  const resetManualStatus = () => { manualStatus.current = { bmi: false, hfa: false }; };

  // Populate form when editingStudent changes
  useEffect(() => {
    resetManualStatus();
    if (editingStudent) {
      setForm({ ...editingStudent });
      setPeriod(editingStudent.period);
      setPeriodError(false);
    }
  }, [editingStudent?.id]);

  const grades = getGrades(school);
  const inp: CSSProperties = { background:t.surface2, color:t.text, border:`1px solid ${t.border}`, fontFamily:"'Outfit',sans-serif" };
  const inpMono: CSSProperties = { ...inp, fontFamily:"'JetBrains Mono',monospace" };
  const cls = "w-full text-sm px-3 py-2 rounded-sm outline-none";

  const set = (key: keyof Omit<Student,"id">, val: string) => {
    if (key === "bmiStatus") manualStatus.current.bmi = true;
    if (key === "hfaStatus") manualStatus.current.hfa = true;
    setForm(f => {
      const next = { ...f, [key]: val };
      if (key === "dateOfBirth") {
        const age = computeAge(val);
        next.ageYears = age.years;
        next.ageMonths = age.months;
      }

      const ageY = next.ageYears;
      const sex = next.sex;
      const weight = key === "weight" ? val : f.weight;
      const height = key === "height" ? val : f.height;

      // Only recalculate BMI number when weight or height changes
      const measuresChanged = key === "weight" || key === "height";
      if (measuresChanged) {
        next.bmi = calcBMI(weight, height);
      }

      // Auto-classify BMI only when measurements / age / sex change — NOT when editing HFA status.
      // The computed value (even an empty one) replaces the old status, so a
      // cleared weight can never leave a confident "Normal" behind.
      const bmiInputsChanged = measuresChanged || key === "dateOfBirth" || key === "sex" || key === "ageYears";
      if (bmiInputsChanged && !manualStatus.current.bmi) {
        next.bmiStatus = classifyBMI(next.bmi || calcBMI(weight, height), ageY, sex);
      }

      // Auto-classify HFA only when height / age / sex change — NOT when editing BMI status
      const hfaInputsChanged = key === "height" || key === "dateOfBirth" || key === "sex" || key === "ageYears";
      if (hfaInputsChanged && !manualStatus.current.hfa) {
        next.hfaStatus = classifyHFA(height, ageY, sex);
      }

      // Keep nutritionalStatus in sync with BMI status (an auto field, not a separate one)
      next.nutritionalStatus = next.bmiStatus;

      // Beneficiary class (Kinder/G1 = Primary; G2–12 from severe status) — still editable
      if (key !== "classificationOfBeneficiary") {
        const autoClass = classifyBeneficiary(next.gradeLevel, next.bmiStatus, next.hfaStatus);
        if (autoClass) next.classificationOfBeneficiary = autoClass;
      }
      return next;
    });
  };

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    setPeriodError(false);
    setForm(f => ({ ...f, period: p }));
  };

  const handleSave = () => {
    if (!period) {
      setPeriodError(true);
      periodRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const firstBtn = periodRef.current?.querySelector("button") as HTMLButtonElement | null;
      firstBtn?.focus();
      return;
    }
    if (!form.name.trim()) return;
    const id = editingStudent?.id ?? "s" + Date.now();
    const payload = { ...form, period, id };
    if (editingStudent) {
      setStudents(students.map(s => s.id === editingStudent.id ? payload : s));
    } else {
      setStudents([...students, payload]);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (editingStudent) { clearEditing(); setView("records"); }
    else {
      setPeriod(null);
      setPeriodError(false);
      resetManualStatus();
      setForm(EMPTY_STUDENT(school.id, ""));
    }
  };

  const handleCancel = () => { clearEditing(); setView("records"); };

  const ageYrs = parseInt(form.ageYears) || 0;

  /** Why the WHO auto-status cannot be worked out yet, or null when it can. */
  const autoHint = (() => {
    if (!form.weight || !form.height) return null;
    if (!form.sex) return "Auto status needs the learner's sex — the WHO 2007 tables differ for boys and girls.";
    if (!form.dateOfBirth) return "Auto status needs the date of birth — the WHO 2007 tables start at age 5.";
    if (ageYrs < 5 || ageYrs > 19) return `Age ${ageYrs} is outside the WHO 2007 tables (ages 5–19), so set BMI and HFA status by hand.`;
    return null;
  })();

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold" style={{ color:t.text }}>{editingStudent ? "Edit Student" : "Data Entry"}</h1>
          <p className="text-xs mt-0.5" style={{ color:t.dim }}>{school.name}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div ref={periodRef} className="flex gap-1.5" tabIndex={-1}
            style={periodError ? { outline: `2px solid ${t.danger}`, outlineOffset: 2, borderRadius: 4, padding: 2 } : undefined}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => handlePeriodChange(p)} className="px-3 py-1.5 text-xs rounded-sm cursor-pointer border transition-colors"
                style={period===p ? { background:t.period[p]+"20", color:t.period[p], borderColor:t.period[p]+"40" } : { background:t.surface, color:t.dim, borderColor:t.border }}>
                {p}
              </button>
            ))}
          </div>
          {periodError && (
            <span className="text-[10px]" style={{ color: t.danger }}>Please select Baseline, Midline, or Endline</span>
          )}
          {!period && !periodError && (
            <span className="text-[10px]" style={{ color: t.dim }}>Select a period</span>
          )}
        </div>
      </div>

      {/* Two columns on a wide screen: the learner + her measurements on the
          left, the classification and yes/no block on the right, instead of a
          narrow form with a wide empty margin beside it. */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-5 items-start">
      <div className="flex flex-col gap-5">

      {/* Identity */}
      <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-5 flex flex-col gap-4">
        <div className="text-[9px] tracking-widest uppercase" style={{ color:t.dim }}>Student Information</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field t={t} label="Full Name" span="md:col-span-2">
            <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Last, First Middle" style={inp} className={cls} />
          </Field>
          <Field t={t} label="Sex">
            <div className="flex gap-1.5 h-[38px]">
              {(["M","F"] as Sex[]).map(s => (
                <button key={s} onClick={() => set("sex",s)} className="flex-1 text-sm rounded-sm cursor-pointer border transition-colors"
                  style={form.sex===s ? { background:t.accentBg, color:t.accent, borderColor:t.accent+"40" } : { background:t.surface2, color:t.dim, borderColor:t.border }}>
                  {s==="M"?"Male":"Female"}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field t={t} label="Grade Level">
            <select value={form.gradeLevel} onChange={e=>set("gradeLevel",e.target.value)} style={{ ...inp, cursor:"pointer" }} className={cls}>
              {grades.map(g=><option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field t={t} label="Date of Birth">
            <input type="date" value={form.dateOfBirth} onChange={e=>set("dateOfBirth",e.target.value)} style={inp} className={cls} />
          </Field>
          <Field t={t} label="Date of Weighing">
            <input type="date" value={form.dateOfWeighing} onChange={e=>set("dateOfWeighing",e.target.value)} style={inp} className={cls} />
          </Field>
          <Field t={t} label="School Year">
            <input value={form.sy} onChange={e=>set("sy",e.target.value)} style={inp} className={cls} />
          </Field>
        </div>
        {/* Age follows the same 4-column rhythm as the row above, so the computed
            fields sit under the dates instead of stretching across the form. */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field t={t} label="Age — Years (auto)">
            <input readOnly value={form.ageYears} placeholder="—" style={{ ...inpMono, opacity:form.ageYears?1:0.4, color:t.accent, cursor:"default" }} className={cls} />
          </Field>
          <Field t={t} label="Age — Months (auto)">
            <input readOnly value={form.ageMonths} placeholder="—" style={{ ...inpMono, opacity:form.ageMonths?1:0.4, color:t.accent, cursor:"default" }} className={cls} />
          </Field>
        </div>
      </div>

      {/* Measurements */}
      <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-5 flex flex-col gap-4">
        <div className="text-[9px] tracking-widest uppercase" style={{ color:t.dim }}>Anthropometric Measurements</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field t={t} label="Weight (kg)">
            <input type="number" step="0.1" min={0} value={form.weight} onChange={e=>set("weight",e.target.value)} placeholder="e.g. 24.5" style={inp} className={cls} />
          </Field>
          <Field t={t} label="Height (cm)">
            <input type="number" step="0.1" min={0} value={form.height} onChange={e=>set("height",e.target.value)} placeholder="e.g. 118.0" style={inp} className={cls} />
          </Field>
          <Field t={t} label={`BMI ${ageYrs>=6?"(auto)":"(6 y.o.+)"}`}>
            <input value={form.bmi} readOnly={ageYrs>=6} onChange={e=>ageYrs<6&&set("bmi",e.target.value)}
              style={{ ...inpMono, color:form.bmi?t.accent:t.dim, opacity:form.bmi?1:0.5, cursor:ageYrs>=6?"default":"text" }} className={cls} placeholder="—" />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field t={t} label="BMI Status (WHO 2007 — auto, editable)">
            <div className="flex gap-2 items-center">
              <select value={form.bmiStatus} onChange={e=>set("bmiStatus",e.target.value as BMIStatus)} style={{ ...inp, cursor:"pointer", flex:1, color: form.bmiStatus ? t.bmi[form.bmiStatus] : t.dim }} className={cls}>
                <option value="">— Select —</option>
                {BMI_STATUSES.map(s=><option key={s} value={s} style={{ color:t.bmi[s] }}>{s}</option>)}
              </select>
              {form.bmiStatus && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:t.bmi[form.bmiStatus] }} />}
            </div>
          </Field>
          <Field t={t} label="HFA Status (WHO 2007 — auto, editable)">
            <div className="flex gap-2 items-center">
              <select value={form.hfaStatus} onChange={e=>set("hfaStatus",e.target.value as HFAStatus)} style={{ ...inp, cursor:"pointer", flex:1, color: form.hfaStatus ? t.hfa[form.hfaStatus] : t.dim }} className={cls}>
                <option value="">— Select —</option>
                {HFA_STATUSES.map(s=><option key={s} value={s} style={{ color:t.hfa[s] }}>{s}</option>)}
              </select>
              {form.hfaStatus && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:t.hfa[form.hfaStatus] }} />}
            </div>
          </Field>
        </div>
        {autoHint && (!form.bmiStatus || !form.hfaStatus) && (
          <p className="text-[10px] -mt-1" style={{ color:t.warning, lineHeight:1.5 }}>{autoHint}</p>
        )}
      </div>

      </div>

      <div className="flex flex-col gap-5">

      {/* Classification */}
      <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-5 flex flex-col gap-4">
        <div className="text-[9px] tracking-widest uppercase" style={{ color:t.dim }}>Beneficiary Classification</div>
        <p className="text-[10px] -mt-2" style={{ color:t.faint }}>Kinder &amp; Grade 1 = Primary · Grades 2–12: Primary = Severely Wasted · Secondary = Severely Stunted · auto, editable</p>
        <div className="flex gap-2" style={{ maxWidth: 420 }}>
          {(["Primary","Secondary"] as const).map(c => (
            <button key={c} onClick={() => set("classificationOfBeneficiary",c)} className="flex-1 py-2 text-sm rounded-sm cursor-pointer border transition-colors"
              style={form.classificationOfBeneficiary===c ? { background:t.accentBg, color:t.accent, borderColor:t.accent+"40" } : { background:t.surface2, color:t.dim, borderColor:t.border }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Yes/No */}
      <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-5 flex flex-col gap-4">
        <div className="text-[9px] tracking-widest uppercase" style={{ color:t.dim }}>Additional Information</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            ["Pregnant?","pregnant"], ["With 0–1 Year Old Children?","hasYoungChildren"],
            ["Dewormed?","dewormed"], ["Parent's Consent for Milk?","parentConsentMilk"],
            ["Participation in 4Ps?","fourPs"], ["Beneficiary of SBFP in Previous Years?","sbfpPreviousYears"],
          ] as [string, keyof Omit<Student,"id">][]).map(([label,key]) => (
            <div key={key as string}>
              <label className="block text-[9px] tracking-widest uppercase mb-1.5" style={{ color:t.dim }}>{label}</label>
              <YesNoToggle value={form[key] as YesNo} onChange={v=>set(key,v)} t={t} />
            </div>
          ))}
        </div>
      </div>
      </div>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <button onClick={handleSave} className="px-6 py-2.5 text-sm font-semibold rounded-sm cursor-pointer transition-colors"
          style={{ background:t.accent, color:t.accentText }}>
          {saved ? "✓ Saved" : editingStudent ? "Update Student" : "Save Student"}
        </button>
        {editingStudent
          ? <button onClick={handleCancel} className="px-4 py-2.5 text-sm cursor-pointer rounded-sm border transition-colors" style={{ borderColor:t.border, color:t.dim, background:t.surface }}>Cancel</button>
          : <button onClick={() => { setPeriod(null); setPeriodError(false); resetManualStatus(); setForm(EMPTY_STUDENT(school.id, "")); }} className="px-4 py-2.5 text-sm cursor-pointer rounded-sm border" style={{ borderColor:t.border, color:t.dim }}>Clear</button>}
        <button onClick={() => setView("records")} className="text-xs ml-auto cursor-pointer" style={{ color:t.dim }}>View all records →</button>
      </div>
    </div>
  );
}

// ── Student Records ────────────────────────────────────────────────────────────
function StudentRecords({ students, setStudents, school, setView, onEdit }: {
  students:Student[]; setStudents:(s:Student[])=>void; school:School;
  setView:(v:View)=>void; onEdit:(s:Student)=>void;
}) {
  const t = useT();
  const [period, setPeriod] = useState<Period|"All">("All");
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  /** The learner whose ✕ was clicked — nothing is removed until this is confirmed. */
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);

  const uniqueStudentCount = useMemo(() => uniqueCount(students), [students]);

  const filtered = useMemo(() => {
    const list = students.filter(
      s => (period === "All" || s.period === period) &&
        (s.name.toLowerCase().includes(search.toLowerCase()) || s.gradeLevel.toLowerCase().includes(search.toLowerCase()))
    );
    return sortRecords(list);
  }, [students, period, search]);

  const del = (id: string) => setStudents(students.filter(s => s.id !== id));
  const th: CSSProperties = {
    color: t.dim, borderRight: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`,
    background: t.surfaceDeep, verticalAlign: "middle",
  };
  const td = (v: string | number, opts?: { mono?: boolean; color?: string; nowrap?: boolean }) => (
    <td className="px-1.5 py-2 text-center" style={{
      fontFamily: opts?.mono ? "'JetBrains Mono',monospace" : undefined,
      color: opts?.color ?? t.sub,
      borderRight: `1px solid ${t.surfaceDeep}`,
      whiteSpace: opts?.nowrap === false ? "normal" : "nowrap",
    }}>{v === "" || v === undefined ? "—" : v}</td>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: t.text }}>Student Records</h1>
          <p className="text-xs mt-0.5" style={{ color: t.dim }}>
            {school.name} · SBFP Form 1A · sorted Kinder → Grade 6 · {uniqueStudentCount} students · {students.length} period records
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => { setExporting(true); try { const { exportStudentsToExcel } = await import("@/lib/sbfp-export"); await exportStudentsToExcel(school, filtered, period === "All" ? "All" : period); } finally { setExporting(false); } }}
            disabled={filtered.length === 0}
            className="px-4 py-2 text-sm font-semibold rounded-sm cursor-pointer border transition-colors"
            style={{
              background: filtered.length === 0 ? t.surface2 : t.surface,
              color: filtered.length === 0 ? t.faint : t.accent,
              borderColor: filtered.length === 0 ? t.border : t.accent + "60",
              cursor: filtered.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            {exporting ? "Exporting…" : "↓ Export Excel"}
          </button>
          <button onClick={() => setView("entry")} className="px-4 py-2 text-sm font-semibold rounded-sm cursor-pointer" style={{ background: t.accent, color: t.accentText }}>+ Add Student</button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or grade…"
          className="text-sm px-3 py-1.5 rounded-sm outline-none flex-1 min-w-[180px]"
          style={{ background: t.surface, color: t.text, border: `1px solid ${t.border}` }} />
        {(["All", ...PERIODS] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className="px-3 py-1.5 text-xs rounded-sm cursor-pointer border transition-colors"
            style={period === p
              ? p === "All" ? { background: t.accentBg, color: t.accent, borderColor: t.accent + "40" } : { background: t.period[p as Period] + "20", color: t.period[p as Period], borderColor: t.period[p as Period] + "40" }
              : { background: t.surface, color: t.dim, borderColor: t.border }}>
            {p}
          </button>
        ))}
      </div>
      <p className="text-[10px] md:hidden -mb-2" style={{ color: t.dim }}>
        Swipe the table sideways to see every column →
      </p>
      <div style={{ border: `1px solid ${t.border}`, background: t.surface }} className="overflow-x-auto">
        <table className="w-full text-[10px] min-w-[1480px] border-collapse">
          <thead>
            <tr>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={th}>No.</th>
              <th rowSpan={2} className="px-2 py-2 text-left text-[8px] tracking-widest uppercase" style={th}>Name</th>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={th}>Sex</th>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={th}>Grade / Section</th>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={th}>Date of Birth<br/>(MM/DD/YYYY)</th>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={th}>Date of Weighing<br/>(MM/DD/YYYY)</th>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={th}>Age in Years / Months</th>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={th}>Weight (Kg)</th>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={th}>Height (cm)</th>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={th}>BMI for 6 y.o.<br/>and above</th>
              <th colSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase text-center" style={th}>Nutritional Status (NS)</th>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={th}>Classification of<br/>Beneficiary</th>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={th}>Pregnant<br/>(Yes or No)</th>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={th}>With 0-1 year old<br/>children</th>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={th}>Dewormed<br/>(Yes or No)</th>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={th}>Parent's consent<br/>for milk</th>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={th}>Participation<br/>in 4Ps</th>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={th}>Beneficiary of SBFP<br/>in previous years</th>
              <th rowSpan={2} className="px-2 py-2 text-[8px] tracking-widest uppercase" style={{ ...th, borderRight: "none" }}>Period / Actions</th>
            </tr>
            <tr>
              <th className="px-2 py-1.5 text-[8px] tracking-widest uppercase text-center" style={th}>BMI-A</th>
              <th className="px-2 py-1.5 text-[8px] tracking-widest uppercase text-center" style={th}>HFA</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, idx) => {
              const prev = filtered[idx - 1];
              const gradeBreak = prev && prev.gradeLevel !== s.gradeLevel;
              return (
                <tr key={s.id} className="group"
                  style={{
                    borderBottom: `1px solid ${t.surfaceDeep}`,
                    background: gradeBreak ? t.surfaceDeep : "transparent",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = t.hover)}
                  onMouseLeave={e => (e.currentTarget.style.background = gradeBreak ? t.surfaceDeep : "transparent")}>
                  {td(idx + 1, { mono: true, color: t.dim })}
                  <td className="px-2 py-2 text-left font-medium" style={{ color: t.text, borderRight: `1px solid ${t.surfaceDeep}`, whiteSpace: "nowrap" }}>{s.name || "—"}</td>
                  {td(s.sex)}
                  {td(s.gradeLevel)}
                  {td(formatDateMDY(s.dateOfBirth), { mono: true })}
                  {td(formatDateMDY(s.dateOfWeighing), { mono: true })}
                  {td(`${s.ageYears || "0"}/${s.ageMonths || "0"}`, { mono: true })}
                  {td(s.weight || "", { mono: true })}
                  {td(s.height || "", { mono: true })}
                  {td(s.bmi || "", { mono: true, color: s.bmi ? t.accent : t.faint })}
                  <td className="px-1.5 py-2 text-center" style={{ borderRight: `1px solid ${t.surfaceDeep}` }}>
                    {s.bmiStatus ? <Pill label={s.bmiStatus} color={t.bmi[s.bmiStatus]} /> : <span style={{ color: t.faint }}>—</span>}
                  </td>
                  <td className="px-1.5 py-2 text-center" style={{ borderRight: `1px solid ${t.surfaceDeep}` }}>
                    {s.hfaStatus ? <Pill label={s.hfaStatus} color={t.hfa[s.hfaStatus]} /> : <span style={{ color: t.faint }}>—</span>}
                  </td>
                  {td(s.classificationOfBeneficiary || "")}
                  {td(s.pregnant || "")}
                  {td(s.hasYoungChildren || "")}
                  {td(s.dewormed || "")}
                  {td(s.parentConsentMilk || "")}
                  {td(s.fourPs || "")}
                  {td(s.sbfpPreviousYears || "")}
                  <td className="px-2 py-2" style={{ whiteSpace: "nowrap" }}>
                    <div className="flex items-center gap-2 justify-center">
                      {s.period ? <Pill label={s.period} color={t.period[s.period]} /> : null}
                      {/* Row actions: hover / keyboard focus reveals them, touch keeps them. */}
                      <span className="row-actions flex items-center gap-1.5">
                        <button aria-label={`Edit ${s.name || "this learner"}'s record`}
                          onClick={() => { onEdit(s); setView("entry"); }}
                          className="text-[11px] px-2.5 py-1 rounded-sm cursor-pointer border transition-colors"
                          style={{ background:t.surface2, color:t.sub, borderColor:t.border }}
                          onMouseEnter={e=>{ e.currentTarget.style.color=t.text; e.currentTarget.style.borderColor=t.dim; }}
                          onMouseLeave={e=>{ e.currentTarget.style.color=t.sub; e.currentTarget.style.borderColor=t.border; }}>Edit</button>
                        <button aria-label={`Delete ${s.name || "this learner"}'s record`}
                          onClick={() => setPendingDelete(s)}
                          className="text-[11px] px-2.5 py-1 rounded-sm cursor-pointer border transition-colors"
                          style={{ background:"transparent", color:t.danger, borderColor:t.danger+"55" }}
                          onMouseEnter={e=>{ e.currentTarget.style.background=t.danger; e.currentTarget.style.color=t.isDark ? "#100505" : "#ffffff"; }}
                          onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color=t.danger; }}>Delete</button>
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={21} className="px-4 py-10 text-center text-sm" style={{ color: t.faint }}>No students found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name || "this learner"}'s record?`}
        confirmLabel="Delete record"
        cancelLabel="Keep record"
        palette={confirmPalette(t)}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) del(pendingDelete.id);
          setPendingDelete(null);
        }}
      >
        <strong style={{ color: t.text }}>
          {pendingDelete?.name || "This learner"}
          {pendingDelete?.gradeLevel ? ` · ${pendingDelete.gradeLevel}` : ""}
          {pendingDelete?.period ? ` · ${pendingDelete.period}` : ""}
        </strong>
        <br />
        The measurements, nutritional status and beneficiary details on this record are deleted from {" "}
        {school.name}'s student records — and, for a record the school encoded from the Teacher Portal, from the
        division's records server as well. <strong style={{ color: t.text }}>This cannot be undone.</strong>
      </ConfirmDialog>
    </div>
  );
}

// ── Summary Table ─────────────────────────────────────────────────────────────
function SummaryTable({ students, school }: { students:Student[]; school:School }) {
  const t = useT();
  const [period, setPeriod] = useState<Period>("Endline");
  const isSpedSchool = school.name === SPED_SCHOOL_NAME;
  const [cohort, setCohort] = useState<"All"|"Regular"|"SPED">("All");
  const [exporting, setExporting] = useState(false);

  const isSpedGrade = (g: string) => g.startsWith("SPED");
  const allGrades = getGrades(school);
  // In "All Students" the SPED school counts each SPED grade together with its
  // regular grade (Kinder + SPED Kinder, Grade 1 + SPED Grade 1, …), so the table
  // shows one row per grade level; the Regular / SPED filters keep rows separate.
  const mergeSped = isSpedSchool && cohort === "All";
  const grades = !isSpedSchool || cohort === "All"
    ? (mergeSped ? allGrades.filter(g => !isSpedGrade(g)) : allGrades)
    : cohort === "SPED"
      ? allGrades.filter(isSpedGrade)
      : allGrades.filter(g => !isSpedGrade(g));

  const f = students.filter(s =>
    s.period === period &&
    (!isSpedSchool || cohort === "All"
      ? true
      : cohort === "SPED" ? isSpedGrade(s.gradeLevel) : !isSpedGrade(s.gradeLevel))
  );

  /** Whether a student's grade belongs in this row — merged rows also take the SPED grade. */
  const inGrade = (g: string, grade: GradeLevel) =>
    mergeSped ? g.replace(/^SPED /, "") === grade : g === grade;
  const cntBMI = (grade:GradeLevel|null, sex:Sex|null, st:BMIStatus) =>
    f.filter(s=>(grade===null||inGrade(s.gradeLevel,grade))&&(sex===null||s.sex===sex)&&s.bmiStatus===st).length;
  const cntHFA = (grade:GradeLevel|null, sex:Sex|null, st:HFAStatus) =>
    f.filter(s=>(grade===null||inGrade(s.gradeLevel,grade))&&(sex===null||s.sex===sex)&&s.hfaStatus===st).length;
  const cntFlag = (grade:GradeLevel|null, sex:Sex|null, field:keyof Student, val:string) =>
    f.filter(s=>(grade===null||inGrade(s.gradeLevel,grade))&&(sex===null||s.sex===sex)&&s[field]===val).length;
  /** Learners in this row with any of these Yes/No fields answered "Yes". */
  const cntAny = (grade:GradeLevel|null, sex:Sex|null, fields:(keyof Student)[]) =>
    f.filter(s=>(grade===null||inGrade(s.gradeLevel,grade))&&(sex===null||s.sex===sex)&&fields.some(k=>s[k]==="Yes")).length;
  const N = (v:number, color?:string) => (
    <td className="px-2 py-2 text-center text-xs" style={{ fontFamily:"'JetBrains Mono',monospace", color:v===0?t.faint:(color??t.accent) }}>{v}</td>
  );
  const sx = (lbl:"M"|"F"|"Total"): Sex|null => lbl==="Total"?null:lbl;

  /**
   * The rows shown below, flattened for the Excel export. Built from the same
   * cnt* helpers as the table, so the file always matches what is on screen —
   * including which grade levels the SPED cohort merge folds together.
   */
  const summaryMatrix = (): SummaryMatrixRow[] => {
    const perGrade = (grade: GradeLevel|null, label: string): SummaryMatrixRow[] =>
      (["M","F","Total"] as const).map(lbl => {
        const s = sx(lbl);
        return {
          grade: label,
          sex: lbl,
          bmi: BMI_STATUSES.map(st=>cntBMI(grade,s,st)),
          hfa: HFA_STATUSES.map(st=>cntHFA(grade,s,st)),
          pregnantYoung: cntAny(grade,s,["pregnant","hasYoungChildren"]),
          dewormed: cntFlag(grade,s,"dewormed","Yes"),
          fourPs: cntFlag(grade,s,"fourPs","Yes"),
          sbfp: cntFlag(grade,s,"sbfpPreviousYears","Yes"),
        };
      });
    return [...grades.flatMap(g => perGrade(g, g)), ...perGrade(null, "GRAND TOTAL")];
  };

  /** School year printed on the Form 2 export — the one most of these records use. */
  const syForExport = () => {
    const tally = new Map<string, number>();
    for (const s of f) if (s.sy) tally.set(s.sy, (tally.get(s.sy) ?? 0) + 1);
    let best = "2025-2026", n = 0;
    for (const [sy, c] of tally) if (c > n) { best = sy; n = c; }
    return best;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold" style={{ color:t.text }}>Summary Table</h1>
          <p className="text-xs mt-0.5" style={{ color:t.dim }}>
            {school.name} — SY 2025–2026
            {isSpedSchool && (cohort === "All" ? " · SPED merged into grade levels" : ` · ${cohort} only`)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isSpedSchool && (
            <div className="flex gap-1.5">
              {(["All","Regular","SPED"] as const).map(c => (
                <button key={c} onClick={() => setCohort(c)} className="px-3 py-1.5 text-xs rounded-sm cursor-pointer border transition-colors"
                  style={cohort===c
                    ? { background:t.accentBg, color:t.accent, borderColor:t.accent+"40" }
                    : { background:t.surface, color:t.dim, borderColor:t.border }}>
                  {c === "All" ? "All Students" : c === "Regular" ? "Regular" : "SPED"}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} className="px-3 py-1.5 text-xs rounded-sm cursor-pointer border"
                style={period===p ? { background:t.period[p]+"20", color:t.period[p], borderColor:t.period[p]+"40" } : { background:t.surface, color:t.dim, borderColor:t.border }}>
                {p}
              </button>
            ))}
            <button
              title="SBFP Form 2 — Summary of Beneficiaries & Start of Feeding"
              onClick={async () => {
                setExporting(true);
                try {
                  const { exportSummaryToExcel } = await import("@/lib/sbfp-export");
                  await exportSummaryToExcel({
                    school, period, cohort, sy: syForExport(),
                    bmiStatuses: BMI_STATUSES,
                    hfaStatuses: HFA_STATUSES,
                    rows: summaryMatrix(),
                  });
                } finally { setExporting(false); }
              }}
              disabled={f.length === 0}
              className="px-3 py-1.5 text-xs font-semibold rounded-sm border transition-colors"
              style={{
                background: f.length === 0 ? t.surface2 : t.surface,
                color: f.length === 0 ? t.faint : t.accent,
                borderColor: f.length === 0 ? t.border : t.accent + "60",
                cursor: f.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              {exporting ? "Exporting…" : "↓ Export Form 2"}
            </button>
          </div>
        </div>
      </div>

      <p className="text-[10px] md:hidden -mb-2" style={{ color: t.dim }}>
        Swipe the table sideways to see every column →
      </p>
      <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="overflow-x-auto">
        <table className="text-xs min-w-[860px] w-full border-collapse">
          <thead>
            <tr style={{ borderBottom:`1px solid ${t.border}` }}>
              <th rowSpan={2} className="px-3 py-2 text-left text-[9px] tracking-widest uppercase" style={{ color:t.dim, borderRight:`1px solid ${t.border}` }}>Grade</th>
              <th rowSpan={2} className="px-2 py-2 text-[9px] tracking-widest uppercase" style={{ color:t.dim, borderRight:`1px solid ${t.border}` }}>Sex</th>
              <th colSpan={6} className="px-2 py-2 text-[9px] tracking-widest uppercase text-center" style={{ color:t.blue, borderRight:`1px solid ${t.border}` }}>Body Mass Index (BMI)</th>
              <th colSpan={5} className="px-2 py-2 text-[9px] tracking-widest uppercase text-center" style={{ color:t.lime, borderRight:`1px solid ${t.border}` }}>Height-for-Age (HFA)</th>
              <th className="px-2 py-2 text-[9px] tracking-widest uppercase text-center" style={{ color:t.orange, borderRight:`1px solid ${t.border}` }}>4P's</th>
              <th className="px-2 py-2 text-[9px] tracking-widest uppercase text-center" style={{ color:t.orange }}>SBFP</th>
            </tr>
            <tr style={{ borderBottom:`1px solid ${t.border}` }}>
              {["Sev. Wasted","Wasted","Normal","Overweight","Obese","Total","Sev. Stunted","Stunted","Normal","Tall","Total"].map((h,i) => (
                <th key={`${h}${i}`} className="px-2 py-1.5 text-[8px] tracking-widest uppercase text-center" style={{ color:t.dim, borderRight:`1px solid ${i===5||i===10?t.border:t.surfaceDeep}` }}>{h}</th>
              ))}
              <th style={{ borderRight:`1px solid ${t.border}` }} />
              <th />
            </tr>
          </thead>
          <tbody>
            {grades.map((grade,gi) =>
              (["M","F","Total"] as const).map((lbl,ri) => {
                const s = sx(lbl);
                const bmis = BMI_STATUSES.map(st=>cntBMI(grade,s,st));
                const hfas = HFA_STATUSES.map(st=>cntHFA(grade,s,st));
                const bT = bmis.reduce((a,b)=>a+b,0), hT = hfas.reduce((a,b)=>a+b,0);
                const fp = cntFlag(grade,s,"fourPs","Yes"), sb = cntFlag(grade,s,"sbfpPreviousYears","Yes");
                const isTotal = lbl==="Total";
                return (
                  <tr key={`${grade}-${ri}`} style={{ borderBottom:`1px solid ${isTotal?t.border:t.surfaceDeep}`, background:isTotal?t.surfaceDeep:"transparent" }}
                    onMouseEnter={e=>{ if(!isTotal) e.currentTarget.style.background=t.hover; }} onMouseLeave={e=>{ e.currentTarget.style.background=isTotal?t.surfaceDeep:"transparent"; }}>
                    {ri===0 && <td rowSpan={3} className="px-3 py-2 text-xs font-medium align-middle" style={{ color:t.sub, borderRight:`1px solid ${t.border}` }}>{grade}</td>}
                    <td className="px-2 py-2 text-center text-xs" style={{ color:isTotal?t.danger:t.dim, fontWeight:isTotal?600:400, borderRight:`1px solid ${t.border}` }}>{lbl}</td>
                    {bmis.map((v,i)=>N(v))}{N(bT,t.blue)}
                    {hfas.map((v,i)=>N(v))}{N(hT,t.lime)}
                    {N(fp,t.orange)}{N(sb,t.orange)}
                  </tr>
                );
              })
            )}
            {(["M","F","Total"] as const).map(lbl => {
              const s = sx(lbl);
              const bmis = BMI_STATUSES.map(st=>cntBMI(null,s,st));
              const hfas = HFA_STATUSES.map(st=>cntHFA(null,s,st));
              const bT = bmis.reduce((a,b)=>a+b,0), hT = hfas.reduce((a,b)=>a+b,0);
              const fp = cntFlag(null,s,"fourPs","Yes"), sb = cntFlag(null,s,"sbfpPreviousYears","Yes");
              return (
                <tr key={`grand-${lbl}`} style={{ borderBottom:`1px solid ${t.border}`, background:t.grandBg }}>
                  {lbl==="M" && <td rowSpan={3} className="px-3 py-2 text-xs font-semibold align-middle" style={{ color:t.accent, borderRight:`1px solid ${t.border}` }}>GRAND TOTAL</td>}
                  <td className="px-2 py-2 text-center text-xs font-semibold" style={{ color:t.danger, borderRight:`1px solid ${t.border}` }}>{lbl}</td>
                  {bmis.map((v,i)=>N(v))}{N(bT,t.blue)}
                  {hfas.map((v,i)=>N(v))}{N(hT,t.lime)}
                  {N(fp,t.orange)}{N(sb,t.orange)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Analytics ─────────────────────────────────────────────────────────────────
function Analytics({ students, school }: { students:Student[]; school:School }) {
  const t = useT();
  const isSpedSchool = school.name === SPED_SCHOOL_NAME;
  const [cohort, setCohort] = useState<"All"|"Regular"|"SPED">("All");
  const isSpedGrade = (g: string) => g.startsWith("SPED");

  const filtered = useMemo(() => {
    if (!isSpedSchool || cohort === "All") return students;
    return students.filter(s =>
      cohort === "SPED" ? isSpedGrade(s.gradeLevel) : !isSpedGrade(s.gradeLevel)
    );
  }, [students, cohort, isSpedSchool]);

  const uniqAll = uniqueStudents(filtered);
  const periodData = PERIODS.map(p => {
    const pe = filtered.filter(s=>s.period===p);
    return {
      period: p,
      total: uniqueCount(pe),
      bmi: BMI_STATUSES.map(st => ({ st, n: pe.filter(s => s.bmiStatus === st).length, c: t.bmi[st] })),
      hfa: HFA_STATUSES.map(st => ({ st, n: pe.filter(s => s.hfaStatus === st).length, c: t.hfa[st] })),
    };
  });
  const maxTotal = Math.max(...periodData.map(d=>d.total),1);
  const allBMI = BMI_STATUSES.map(st=>({ label:st, val:uniqAll.filter(s=>s.bmiStatus===st).length, color:t.bmi[st] }));
  const allHFA = HFA_STATUSES.map(st=>({ label:st, val:uniqAll.filter(s=>s.hfaStatus===st).length, color:t.hfa[st] }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold" style={{ color:t.text }}>Analytics</h1>
          <p className="text-xs mt-0.5" style={{ color:t.dim }}>
            {school.name} · {uniqAll.length} students · {filtered.length} period records
            {isSpedSchool && cohort !== "All" ? ` · ${cohort} only` : ""}
          </p>
        </div>
        {isSpedSchool && (
          <div className="flex gap-1.5">
            {(["All","Regular","SPED"] as const).map(c => (
              <button key={c} onClick={() => setCohort(c)} className="px-3 py-1.5 text-xs rounded-sm cursor-pointer border transition-colors"
                style={cohort===c
                  ? { background:t.accentBg, color:t.accent, borderColor:t.accent+"40" }
                  : { background:t.surface, color:t.dim, borderColor:t.border }}>
                {c === "All" ? "All Students" : c === "Regular" ? "Regular" : "SPED"}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-5">
        <div className="text-[9px] tracking-widest uppercase mb-4" style={{ color:t.dim }}>Student Count by Period</div>
        <div className="flex items-end gap-6">
          {periodData.map(d=>(
            <div key={d.period} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-sm font-semibold" style={{ fontFamily:"'JetBrains Mono',monospace", color:t.period[d.period] }}>{d.total}</span>
              <div className="w-full rounded-sm" style={{ height:`${(d.total/maxTotal)*80}px`, minHeight:"2px", background:t.period[d.period]+"60" }} />
              <span className="text-[10px]" style={{ color:t.period[d.period] }}>{d.period}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background:t.border }}>
        {[{title:"BMI Distribution",cats:allBMI},{title:"HFA Distribution",cats:allHFA}].map(({title,cats})=>{
          const total = cats.reduce((s,c)=>s+c.val,0)||1;
          return (
            <div key={title} style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-5">
              <div className="text-[9px] tracking-widest uppercase mb-4" style={{ color:t.dim }}>{title}</div>
              {cats.map(c=>(
                <div key={c.label} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color:t.sub }}>{c.label}</span>
                    <span className="text-[10px]" style={{ fontFamily:"'JetBrains Mono',monospace", color:c.color }}>{c.val} <span style={{ color:t.faint }}>({((c.val/total)*100).toFixed(0)}%)</span></span>
                  </div>
                  <Bar val={c.val} max={total} color={c.color} t={t} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background:t.border }}>
        {periodData.map(d=>{
          const total = d.total||1;
          return (
            <div key={`bmi-${d.period}`} style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-4">
              <div className="text-[9px] tracking-widest uppercase mb-3" style={{ color:t.period[d.period] }}>{d.period} — BMI</div>
              {d.bmi.map(b=>(
                <div key={b.st} className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] w-20 truncate" style={{ color:t.dim }}>{b.st}</span>
                  <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background:t.border }}>
                    <div style={{ width:`${(b.n/total)*100}%`, background:b.c }} className="h-full" />
                  </div>
                  <span className="text-[9px] w-4 text-right" style={{ fontFamily:"'JetBrains Mono',monospace", color:t.dim }}>{b.n}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background:t.border }}>
        {periodData.map(d=>{
          const total = d.total||1;
          return (
            <div key={`hfa-${d.period}`} style={{ border:`1px solid ${t.border}`, background:t.surface }} className="p-4">
              <div className="text-[9px] tracking-widest uppercase mb-3" style={{ color:t.period[d.period] }}>{d.period} — HFA</div>
              {d.hfa.map(h=>(
                <div key={h.st} className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] w-20 truncate" style={{ color:t.dim }}>{h.st}</span>
                  <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background:t.border }}>
                    <div style={{ width:`${(h.n/total)*100}%`, background:h.c }} className="h-full" />
                  </div>
                  <span className="text-[9px] w-4 text-right" style={{ fontFamily:"'JetBrains Mono',monospace", color:t.dim }}>{h.n}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [themeMode, setThemeMode] = useState<"dark"|"light">("dark");
  const t = themeMode === "dark" ? DARK : LIGHT;
  const [view, setView] = useState<View>("district");
  const [selectedSchool, setSelectedSchool] = useState<School|null>(null);
  const [students, setStudents] = useState<Student[]>(SEED);
  const [schools, setSchools] = useState<School[]>([...INIT_ES, ...INIT_HS]);
  const [feedbacks, setFeedbacks] = useState<SchoolFeedback[]>(FEEDBACK_SEED);
  const [editingStudent, setEditingStudent] = useState<Student|null>(null);

  // ── The teacher website's side of the loop ──────────────────────────────────
  // Which Division Office account is signed in, and the school rows the server
  // handed it. The console is only rendered once an admin session is resolved
  // (see `src/routes/index.tsx`), so this is the division-wide view.
  const access = useAccess();
  const teacherData = access.store;

  // A teacher's profile IS her school's SBFP form header, so what she saves on
  // `/teacher` is folded into the district's school list here.
  useEffect(() => {
    const profiles = teacherData.profiles;
    if (Object.keys(profiles).length === 0) return;
    setSchools(prev => prev.map(s => {
      const p = profiles[s.id];
      if (!p) return s;
      const next: School = {
        ...s,
        division: p.division,
        cityMunicipalityBarangay: p.cityMunicipalityBarangay,
        schoolIdNumber: p.schoolIdNumber,
        principal: p.principal,
        focalPerson: p.focalPerson,
        dateStartFeeding: p.dateStartFeeding,
        lastMileSchool: p.lastMileSchool,
      };
      return SCHOOL_HEADER_KEYS.every(key => next[key] === s[key]) ? s : next;
    }));
  }, [teacherData.profiles]);

  const teacherRecords = teacherData.records;
  const teacherFeedbacks = teacherData.feedbacks;

  /**
   * School-list writes. A school that a teacher has registered keeps its form
   * header on `/teacher`, so when the district edits those fields they are
   * written through to her profile too — otherwise the next profile sync would
   * put her values back and silently undo the district's edit.
   */
  const saveSchools = (next: School[]) => {
    for (const school of next) {
      const profile = teacherData.profiles[school.id];
      if (!profile || !SCHOOL_HEADER_KEYS.some(key => school[key] !== profile[key])) continue;
      saveProfile(school.id, {
        division: school.division,
        cityMunicipalityBarangay: school.cityMunicipalityBarangay,
        schoolIdNumber: school.schoolIdNumber,
        principal: school.principal,
        focalPerson: school.focalPerson,
        dateStartFeeding: school.dateStartFeeding,
        lastMileSchool: school.lastMileSchool,
      });
    }
    setSchools(next);
  };

  /** The district's own rows plus everything the schools encoded on `/teacher`. */
  const allStudents = useMemo(() => {
    const seen = new Set(students.map(s => s.id));
    return [...students, ...teacherRecords.filter(r => !seen.has(r.id))];
  }, [students, teacherRecords]);

  const allFeedbacks = useMemo(() => {
    const seen = new Set(feedbacks.map(f => f.id));
    return [...feedbacks, ...teacherFeedbacks.filter(f => !seen.has(f.id))];
  }, [feedbacks, teacherFeedbacks]);

  /**
   * Writes go to whichever side owns the row: learner records and feedback
   * entered on the teacher website live in the shared store (that is how the
   * school sees the district's edit and the district's reply), everything else
   * stays in this component's state.
   */
  const saveStudents = (next: Student[]) => {
    const byId = new Map(next.map(s => [s.id, s]));
    for (const owned of teacherRecords) {
      const edited = byId.get(owned.id);
      if (!edited) removeRecord(owned.id);
      else if (edited !== owned) updateRecord(owned.id, edited);
    }
    const ownedIds = new Set(teacherRecords.map(r => r.id));
    setStudents(next.filter(s => !ownedIds.has(s.id)));
  };

  const saveFeedbacks = (next: SchoolFeedback[]) => {
    const byId = new Map(next.map(f => [f.id, f]));
    for (const owned of teacherFeedbacks) {
      const edited = byId.get(owned.id);
      if (edited && (edited.status !== owned.status || edited.response !== owned.response)) {
        updateTeacherFeedback(owned.id, { status: edited.status, response: edited.response });
      }
    }
    const ownedIds = new Set(teacherFeedbacks.map(f => f.id));
    setFeedbacks(next.filter(f => !ownedIds.has(f.id)));
  };

  const schoolStudents = useMemo(
    () => selectedSchool ? allStudents.filter(s=>s.schoolId===selectedSchool.id) : allStudents,
    [allStudents, selectedSchool]
  );

  /** Narrow-screen navigation drawer — closed by default, and by any choice in it. */
  const [navOpen, setNavOpen] = useState(false);

  // Escape closes the drawer, the same way it closes the delete dialog.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const handleSelectSchool = (school: School) => { setSelectedSchool(school); setView("dashboard"); setNavOpen(false); };
  const handleEdit = (student: Student) => { setEditingStudent(student); setView("entry"); };
  const clearEditing = () => setEditingStudent(null);

  return (
    <ThemeCtx.Provider value={t}>
      <div className="flex min-h-0" style={{ height:"100dvh", background:t.bg, color:t.text, fontFamily:"'Outfit',sans-serif" }}>
        {navOpen && (
          <div aria-hidden="true" onClick={() => setNavOpen(false)}
            className="fixed inset-0 z-30 md:hidden" style={{ background:"rgba(0,0,0,0.5)" }} />
        )}
        <Sidebar view={view} setView={setView} selectedSchool={selectedSchool} setSelectedSchool={setSelectedSchool}
          themeMode={themeMode} toggleTheme={() => setThemeMode(m=>m==="dark"?"light":"dark")} schools={schools}
          registeredSchools={Object.keys(teacherData.profiles).length}
          mobileOpen={navOpen} onNavigate={() => setNavOpen(false)} />
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {/* The sidebar is off-canvas below md, so the console keeps a way in. */}
          <header className="app-topbar md:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ borderBottom:`1px solid ${t.border}`, background:t.surface }}>
            <button aria-label="Open navigation" aria-expanded={navOpen} onClick={() => setNavOpen(true)}
              className="min-h-10 min-w-10 px-2.5 py-1.5 rounded-sm cursor-pointer border text-sm"
              style={{ borderColor:t.border, color:t.text, background:t.surface2 }}>☰</button>
            <img src="/school-health-wheel.svg" alt="" width={28} height={28} />
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold truncate" style={{ color:t.text }}>Health Monitor</div>
              <div className="text-[10px] truncate" style={{ color:t.dim }}>{selectedSchool?.name ?? "Urdaneta City Schools"}</div>
            </div>
            <div className="ml-auto flex-shrink-0"><UserButton compact /></div>
          </header>
        <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8">
          {view==="district" && <DistrictDashboard students={allStudents} schools={schools}
            feedbacks={allFeedbacks} onOpenFeedbacks={()=>setView("feedback")} />}
          {view==="feedback" && <Feedbacks feedbacks={allFeedbacks} setFeedbacks={saveFeedbacks}
            schools={schools} defaultSchool={selectedSchool} />}
          {view==="schools" && <SchoolsList students={allStudents} schools={schools} setSchools={saveSchools}
            setStudents={saveStudents} onSelect={handleSelectSchool} />}
          {view==="accounts" && <AccountsPanel theme={t} schools={schools} accounts={teacherData.accounts}
            onChanged={() => access.reload()} />}
          {view==="dashboard" && selectedSchool && <Dashboard students={schoolStudents} school={selectedSchool} />}
          {view==="records" && selectedSchool && <StudentRecords students={schoolStudents}
            setStudents={ss => saveStudents([...allStudents.filter(s=>s.schoolId!==selectedSchool.id),...ss])}
            school={selectedSchool} setView={setView} onEdit={handleEdit} />}
          {view==="entry" && selectedSchool && <DataEntry students={allStudents} setStudents={saveStudents}
            school={selectedSchool} setView={setView} editingStudent={editingStudent} clearEditing={clearEditing} />}
          {view==="table" && selectedSchool && <SummaryTable students={schoolStudents} school={selectedSchool} />}
          {view==="analytics" && selectedSchool && <Analytics students={schoolStudents} school={selectedSchool} />}
        </main>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
