// SBFP Form 1A (.xlsx) export built on ExcelJS — real merges, styles and
// embedded logo images (DepEd left, OK sa DepEd right), matching the printed form.
import { Workbook, type Worksheet, type Cell } from "exceljs";

// ── Shared form types (mirrors src/sbfp-app.tsx) ───────────────────────────────
export type GradeLevel =
  |"Kinder"|"Grade 1"|"Grade 2"|"Grade 3"|"Grade 4"|"Grade 5"|"Grade 6"
  |"Grade 7"|"Grade 8"|"Grade 9"|"Grade 10"|"Grade 11"|"Grade 12"
  |"SPED"|"SPED Kinder"|"SPED Grade 1"|"SPED Grade 2"|"SPED Grade 3"|"SPED Grade 4"|"SPED Grade 5"|"SPED Grade 6";
export type Sex = "M"|"F";
export type Period = "Baseline"|"Midline"|"Endline";
export type BMIStatus = "Severely Wasted"|"Wasted"|"Normal"|"Overweight"|"Obese"|"";
export type HFAStatus = "Severely Stunted"|"Stunted"|"Normal"|"Tall"|"";
export type YesNo = "Yes"|"No"|"";

export interface SchoolFormInfo {
  name: string;
  type: string;
  division: string;
  cityMunicipalityBarangay: string;
  schoolIdNumber: string;
  principal: string;
  focalPerson: string;
}

export interface StudentRecord {
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

// ── Sorting (Kinder → Grade 6, then name, then Baseline → Endline) ────────────
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

function sortRecords(list: StudentRecord[]): StudentRecord[] {
  return [...list].sort((a, b) => {
    const ga = gradeRank(a.gradeLevel);
    const gb = gradeRank(b.gradeLevel);
    if (ga !== gb) return ga - gb;
    const name = a.name.localeCompare(b.name);
    if (name !== 0) return name;
    return (periodRank[a.period] ?? 9) - (periodRank[b.period] ?? 9);
  });
}

/** Format date YYYY-MM-DD → MM/DD/YYYY for the SBFP form */
function formatDateMDY(iso: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[2]}/${m[3]}/${m[1]}`;
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const HEADER_FILL = "FFD9E1F2"; // light blue like the printed form
const FONT = "Calibri";

function setColWidths(ws: Worksheet) {
  // A–S (19 columns)
  const widths = [4, 22, 6, 14, 14, 14, 12, 10, 10, 12, 14, 12, 16, 12, 14, 12, 14, 12, 16];
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
}

function styleHeaderCell(cell: Cell) {
  cell.font = { name: FONT, size: 8, bold: true };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
}

function borderCell(cell: Cell) {
  cell.border = {
    top: { style: "thin" }, left: { style: "thin" },
    bottom: { style: "thin" }, right: { style: "thin" },
  };
}

// ── Workbook builder ───────────────────────────────────────────────────────────
/**
 * Build the SBFP Form 1A workbook. `logoLeft` / `logoRight` are base64 data URLs
 * (no prefix) or undefined to skip the image.
 */
export async function buildSbfpWorkbook(
  school: SchoolFormInfo,
  rows: StudentRecord[],
  periodLabel: string,
  logoLeft?: string,
  logoRight?: string,
): Promise<ArrayBuffer> {
  const titlePeriod = periodLabel === "All" ? "ALL PERIODS" : periodLabel.toUpperCase();
  const sorted = sortRecords(rows);

  const workbook = new Workbook();
  const ws = workbook.addWorksheet("SBFP Master List", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "landscape",
      horizontalCentered: true,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.2, right: 0.2, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
    },
  });
  setColWidths(ws);

  // Logos — left over A2:B5, right anchored at S1 (same spots as the printed form)
  if (logoLeft) {
    const id = workbook.addImage({ base64: logoLeft, extension: "png" });
    ws.addImage(id, { tl: { col: 0, row: 1 }, ext: { width: 80, height: 80 } });
  }
  if (logoRight) {
    const id = workbook.addImage({ base64: logoRight, extension: "png" });
    ws.addImage(id, { tl: { col: 18, row: 1 }, ext: { width: 80, height: 80 } });
  }

  // Title block
  ws.getCell("A1").value = "SBFP Form 1A (2026)";
  ws.getCell("A1").font = { name: FONT, size: 11, bold: true };
  ws.getRow(3).height = 26;
  ws.mergeCells("A3:S3");
  ws.getCell("A3").value = "Department of Education";
  ws.getCell("A3").font = { name: FONT, size: 14, bold: true };
  ws.getCell("A3").alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(5).height = 20;
  ws.mergeCells("A5:S5");
  ws.getCell("A5").value =
    `Master List of Beneficiaries for School-Based Feeding Program (SBFP) | SY 2025-2026 — ${titlePeriod}`;
  ws.getCell("A5").font = { name: FONT, size: 12, bold: true };
  ws.getCell("A5").alignment = { horizontal: "center", vertical: "middle" };

  // Form details — bold label + value in adjacent cells (rows 7–11)
  const details: [string, string, string][] = [
    ["A7", "Division:", school.division || ""],
    ["H7", "Name of Principal:", school.principal || ""],
    ["A8", "City/Municipality/Barangay:", school.cityMunicipalityBarangay || ""],
    ["H8", "Name of Feeding Focal Person:", school.focalPerson || ""],
    ["A9", "Name of School / School District :", school.name || ""],
    ["A10", "School Type:", school.type || ""],
    ["A11", "School ID Number:", school.schoolIdNumber || ""],
  ];
  for (const [labelRef, label, value] of details) {
    const valueRef = labelRef.replace(/^[A-Z]+/, "C").replace(/^H(\d+)/, "K$1");
    ws.getCell(labelRef).value = label;
    ws.getCell(labelRef).font = { name: FONT, size: 10, bold: true };
    ws.getCell(valueRef).value = value;
    ws.getCell(valueRef).font = { name: FONT, size: 10 };
  }

  // Table headers (rows 12–13)
  const headerRows: [string, string][] = [
    ["A12", "No."], ["B12", "Name"], ["C12", "Sex"], ["D12", "Grade / Section"],
    ["E12", "Date of Birth (MM/DD/YYYY)"], ["F12", "Date of Weighing (MM/DD/YYYY)"],
    ["G12", "Age in Years / Months"], ["H12", "Weight (Kg)"], ["I12", "Height (cm)"],
    ["J12", "BMI for 6 y.o. and above"], ["K12", "Nutritional Status (NS)"],
    ["M12", "Classification of Beneficiary (Primary or Secondary)"],
    ["N12", "Pregnant (Yes or No)"], ["O12", "With 0-1 year old children (Yes or No)"],
    ["P12", "Dewormed (Yes or No)"], ["Q12", "Parent's consent for milk (Yes or No)"],
    ["R12", "Participation in 4Ps (Yes or No)"],
    ["S12", "Beneficiary of SBFP in previous years (Yes or No)"],
  ];
  ws.getRow(12).height = 30;
  ws.getRow(13).height = 22;
  for (const [ref, text] of headerRows) {
    if (ref === "K12") {
      ws.mergeCells("K12:L12");
    } else if (ref !== "K12" && ref.startsWith("K")) continue;
    ws.getCell(ref).value = text;
  }
  ws.getCell("K13").value = "BMI-A";
  ws.getCell("L13").value = "HFA";
  for (let c = 1; c <= 19; c++) {
    if (c !== 11 && c !== 12) ws.mergeCells(`${ws.getCell(12, c).address}:${ws.getCell(13, c).address}`); // K/L: group header K12:L12 with sub-headers in row 13
    styleHeaderCell(ws.getCell(12, c));
    styleHeaderCell(ws.getCell(13, c));
    borderCell(ws.getCell(12, c));
    borderCell(ws.getCell(13, c));
  }

  // Student rows (from row 14)
  sorted.forEach((s, i) => {
    const r = 14 + i;
    const age = s.ageYears || s.ageMonths ? `${s.ageYears || "0"}/${s.ageMonths || "0"}` : "";
    const row = ws.getRow(r);
    const vals: (string | number)[] = [
      i + 1,
      s.name || "",
      s.sex || "",
      s.gradeLevel || "",
      formatDateMDY(s.dateOfBirth),
      formatDateMDY(s.dateOfWeighing),
      age,
      s.weight ? parseFloat(s.weight) : "",
      s.height ? parseFloat(s.height) : "",
      s.bmi ? parseFloat(s.bmi) : "",
      s.bmiStatus || s.nutritionalStatus || "",
      s.hfaStatus || "",
      s.classificationOfBeneficiary || "",
      s.pregnant || "",
      s.hasYoungChildren || "",
      s.dewormed || "",
      s.parentConsentMilk || "",
      s.fourPs || "",
      s.sbfpPreviousYears || "",
    ];
    vals.forEach((v, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = v === "" ? null : v;
      cell.font = { name: FONT, size: 9 };
      cell.alignment = { vertical: "middle", wrapText: ci !== 1 };
      borderCell(cell);
    });
  });

  // Signature block
  const lastData = 13 + sorted.length;
  const signRow = lastData + 2;
  ws.getCell(`B${signRow}`).value = "Approve by:";
  ws.getCell(`B${signRow}`).font = { name: FONT, size: 10, bold: true };
  ws.getCell(`B${signRow + 2}`).value = "________________________";
  ws.getCell(`B${signRow + 2}`).font = { name: FONT, size: 11, bold: true };
  ws.getCell(`B${signRow + 3}`).value = "School Head";
  ws.getCell(`B${signRow + 3}`).font = { name: FONT, size: 11, bold: true };

  return (await workbook.xlsx.writeBuffer()) as unknown as ArrayBuffer;
}

/**
 * Fetch the two DepEd logos from /public and return them as base64 payloads
 * (without the data: prefix — that is what ExcelJS.addImage expects).
 * Missing logos resolve to undefined so the export still works without them.
 */
async function fetchLogoBase64(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    if (!blob.type.includes("png") && !url.endsWith(".png")) return undefined;
    const buf = await blob.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch {
    return undefined;
  }
}

/** Build the workbook and trigger a browser download of the .xlsx file. */
export async function exportStudentsToExcel(
  school: SchoolFormInfo,
  rows: StudentRecord[],
  periodLabel: string,
) {
  const [logoLeft, logoRight] = await Promise.all([
    fetchLogoBase64("/deped-logo.png"),
    fetchLogoBase64("/ok-sa-deped.png"),
  ]);

  const buffer = await buildSbfpWorkbook(school, rows, periodLabel, logoLeft, logoRight);
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = school.name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
  const safePeriod = periodLabel.replace(/\s+/g, "_");
  a.href = url;
  a.download = `SBFP_Form_1A_${safeName}_${safePeriod}_SY2025-2026.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
