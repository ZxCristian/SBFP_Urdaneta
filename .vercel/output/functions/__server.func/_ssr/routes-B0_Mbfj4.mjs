import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B0_Mbfj4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DARK = {
	bg: "#080808",
	surface: "#111111",
	surface2: "#161616",
	surfaceDeep: "#0d0d0d",
	hover: "#161616",
	border: "#1e1e1e",
	text: "#e2e2e2",
	sub: "#888",
	dim: "#555",
	faint: "#2a2a2a",
	accent: "#00ff87",
	accentBg: "#00ff8720",
	accentText: "#000",
	danger: "#ff4b4b",
	warning: "#ff9f4b",
	grandBg: "#0a1a10",
	isDark: true
};
var LIGHT = {
	bg: "#f2f2ee",
	surface: "#ffffff",
	surface2: "#f0f0ec",
	surfaceDeep: "#e8e8e4",
	hover: "#ebebea",
	border: "#ddddd8",
	text: "#1a1a1a",
	sub: "#666",
	dim: "#999",
	faint: "#bbb",
	accent: "#00a855",
	accentBg: "#00a85515",
	accentText: "#fff",
	danger: "#cc3333",
	warning: "#cc6600",
	grandBg: "#e8f5ee",
	isDark: false
};
var ThemeCtx = (0, import_react.createContext)(DARK);
var useT = () => (0, import_react.useContext)(ThemeCtx);
var INIT_ES = [
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
	"Vicente Taaca Memorial School"
].map((name, i) => ({
	id: `es${String(i + 1).padStart(2, "0")}`,
	name,
	type: "Elementary"
}));
var INIT_HS = [
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
	"Urdaneta City National High School"
].map((name, i) => ({
	id: `hs${String(i + 1).padStart(2, "0")}`,
	name,
	type: "High School"
}));
var ES_GRADES = [
	"Kinder",
	"Grade 1",
	"Grade 2",
	"Grade 3",
	"Grade 4",
	"Grade 5",
	"Grade 6"
];
var ES_GRADES_WITH_SPED = [
	"Kinder",
	"Grade 1",
	"Grade 2",
	"Grade 3",
	"Grade 4",
	"Grade 5",
	"Grade 6",
	"SPED Kinder",
	"SPED Grade 1",
	"SPED Grade 2",
	"SPED Grade 3",
	"SPED Grade 4",
	"SPED Grade 5",
	"SPED Grade 6"
];
var HS_GRADES = [
	"Grade 7",
	"Grade 8",
	"Grade 9",
	"Grade 10",
	"Grade 11",
	"Grade 12"
];
var PERIODS = [
	"Baseline",
	"Midline",
	"Endline"
];
var PC = {
	Baseline: "#00c9ff",
	Midline: "#ff9f4b",
	Endline: "#00ff87"
};
var BMI_STATUSES = [
	"Severely Wasted",
	"Wasted",
	"Normal",
	"Overweight",
	"Obese"
];
var HFA_STATUSES = [
	"Severely Stunted",
	"Stunted",
	"Normal",
	"Tall"
];
var BMI_C = {
	"Severely Wasted": "#ff4b4b",
	"Wasted": "#ff9f4b",
	"Normal": "#00ff87",
	"Overweight": "#ffdd4b",
	"Obese": "#ff6b9d"
};
var HFA_C = {
	"Severely Stunted": "#ff4b4b",
	"Stunted": "#ff9f4b",
	"Normal": "#00ff87",
	"Tall": "#00c9ff"
};
var SPED_SCHOOL_NAME = "Urdaneta 1 Central School";
var GRADE_ORDER = [
	"Kinder",
	"Grade 1",
	"Grade 2",
	"Grade 3",
	"Grade 4",
	"Grade 5",
	"Grade 6",
	"SPED Kinder",
	"SPED Grade 1",
	"SPED Grade 2",
	"SPED Grade 3",
	"SPED Grade 4",
	"SPED Grade 5",
	"SPED Grade 6",
	"Grade 7",
	"Grade 8",
	"Grade 9",
	"Grade 10",
	"Grade 11",
	"Grade 12",
	"SPED"
];
var gradeRank = (g) => {
	const i = GRADE_ORDER.indexOf(g);
	return i < 0 ? 99 : i;
};
var periodRank = {
	Baseline: 0,
	Midline: 1,
	Endline: 2
};
function sortRecords(list) {
	return [...list].sort((a, b) => {
		const ga = gradeRank(a.gradeLevel);
		const gb = gradeRank(b.gradeLevel);
		if (ga !== gb) return ga - gb;
		const name = a.name.localeCompare(b.name);
		if (name !== 0) return name;
		return (periodRank[a.period] ?? 9) - (periodRank[b.period] ?? 9);
	});
}
var getGrades = (school) => {
	if (!school) return ES_GRADES;
	if (school.type === "High School") return HS_GRADES;
	if (school.name === SPED_SCHOOL_NAME) return ES_GRADES_WITH_SPED;
	return ES_GRADES;
};
/** Unique person key (same student across Baseline/Midline/Endline) */
var studentKey = (s) => `${s.schoolId ?? ""}|${s.name}|${s.dateOfBirth}|${s.sex}`;
/** Count unique students (not period records) */
var uniqueCount = (list) => new Set(list.map(studentKey)).size;
/** One record per student, preferring Endline → Midline → Baseline (for accurate counts) */
function uniqueStudents(list) {
	const order = {
		Endline: 0,
		Midline: 1,
		Baseline: 2
	};
	const map = /* @__PURE__ */ new Map();
	for (const s of list) {
		const k = studentKey(s);
		const existing = map.get(k);
		if (!existing || order[s.period] < order[existing.period]) map.set(k, s);
	}
	return Array.from(map.values());
}
/** Grades 2–12 used for Primary/Secondary beneficiary rules */
var BENEFICIARY_GRADES = [
	"Grade 2",
	"Grade 3",
	"Grade 4",
	"Grade 5",
	"Grade 6",
	"Grade 7",
	"Grade 8",
	"Grade 9",
	"Grade 10",
	"Grade 11",
	"Grade 12"
];
/** Auto-assign beneficiary class
*  - Kinder & Grade 1 → always Primary
*  - Grades 2–12: Primary = Severely Wasted, Secondary = Severely Stunted
*/
function classifyBeneficiary(grade, bmiStatus, hfaStatus) {
	if (grade === "Kinder" || grade === "Grade 1" || grade === "SPED Kinder" || grade === "SPED Grade 1") return "Primary";
	const normalized = grade.replace(/^SPED /, "");
	if (!BENEFICIARY_GRADES.includes(normalized) && !BENEFICIARY_GRADES.includes(grade)) return "";
	if (bmiStatus === "Severely Wasted") return "Primary";
	if (hfaStatus === "Severely Stunted") return "Secondary";
	return "";
}
/** Format date YYYY-MM-DD → MM/DD/YYYY for SBFP form */
function formatDateMDY(iso) {
	if (!iso) return "";
	const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (!m) return iso;
	return `${m[2]}/${m[3]}/${m[1]}`;
}
function strToUint8(s) {
	return new TextEncoder().encode(s);
}
/** CRC32 for ZIP */
var CRC_TABLE = (() => {
	const t = /* @__PURE__ */ new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
		t[n] = c;
	}
	return t;
})();
function crc32(data) {
	let c = 4294967295;
	for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 255] ^ c >>> 8;
	return (c ^ 4294967295) >>> 0;
}
/** Build an uncompressed ZIP from name→bytes map */
function buildZip(files) {
	const parts = [];
	const central = [];
	let offset = 0;
	const u16 = (n) => {
		const b = /* @__PURE__ */ new Uint8Array(2);
		new DataView(b.buffer).setUint16(0, n, true);
		return b;
	};
	const u32 = (n) => {
		const b = /* @__PURE__ */ new Uint8Array(4);
		new DataView(b.buffer).setUint32(0, n, true);
		return b;
	};
	const concat = (arrs) => {
		const len = arrs.reduce((a, b) => a + b.length, 0);
		const out = new Uint8Array(len);
		let o = 0;
		for (const a of arrs) {
			out.set(a, o);
			o += a.length;
		}
		return out;
	};
	for (const [name, data] of Object.entries(files)) {
		const nameBytes = strToUint8(name);
		const crc = crc32(data);
		const local = concat([
			u32(67324752),
			u16(20),
			u16(0),
			u16(0),
			u16(0),
			u16(0),
			u32(crc),
			u32(data.length),
			u32(data.length),
			u16(nameBytes.length),
			u16(0),
			nameBytes,
			data
		]);
		parts.push(local);
		const cen = concat([
			u32(33639248),
			u16(20),
			u16(20),
			u16(0),
			u16(0),
			u16(0),
			u16(0),
			u32(crc),
			u32(data.length),
			u32(data.length),
			u16(nameBytes.length),
			u16(0),
			u16(0),
			u16(0),
			u16(0),
			u32(0),
			u32(offset),
			nameBytes
		]);
		central.push(cen);
		offset += local.length;
	}
	const centralDir = concat(central);
	const end = concat([
		u32(101010256),
		u16(0),
		u16(0),
		u16(Object.keys(files).length),
		u16(Object.keys(files).length),
		u32(centralDir.length),
		u32(offset),
		u16(0)
	]);
	return new Blob([concat([
		...parts,
		centralDir,
		end
	])], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
function xmlEsc(s) {
	return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
/**
* Export SBFP Form 1A as .xlsx (no embedded images — add logos manually in Excel if needed)
* Page: 8.5" × 13" (Folio) landscape, L/R margin 0, T/B 0.5", center horizontal
*/
function exportStudentsToExcel(school, rows, periodLabel) {
	const titlePeriod = periodLabel === "All" ? "ALL PERIODS" : periodLabel.toUpperCase();
	const sorted = sortRecords(rows);
	const colsXml = [
		4,
		22,
		6,
		14,
		14,
		14,
		12,
		10,
		10,
		12,
		14,
		12,
		16,
		12,
		14,
		12,
		14,
		12,
		16
	].map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("");
	const merges = [
		"A12:A13",
		"B12:B13",
		"C12:C13",
		"D12:D13",
		"E12:E13",
		"F12:F13",
		"G12:G13",
		"H12:H13",
		"I12:I13",
		"J12:J13",
		"K12:L12",
		"M12:M13",
		"N12:N13",
		"O12:O13",
		"P12:P13",
		"Q12:Q13",
		"R12:R13",
		"S12:S13",
		"A3:S3",
		"A5:S5"
	];
	const mergeXml = merges.map((m) => `<mergeCell ref="${m}"/>`).join("");
	const cell = (ref, value, style = 0) => {
		if (value === "" || value === void 0 || value === null) return `<c r="${ref}" s="${style}"/>`;
		if (typeof value === "number" && !Number.isNaN(value)) return `<c r="${ref}" s="${style}" t="n"><v>${value}</v></c>`;
		return `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${xmlEsc(String(value))}</t></is></c>`;
	};
	const headersR12 = [
		["A12", "No."],
		["B12", "Name"],
		["C12", "Sex"],
		["D12", "Grade / Section"],
		["E12", "Date of Birth (MM/DD/YYYY)"],
		["F12", "Date of Weighing (MM/DD/YYYY)"],
		["G12", "Age in Years / Months"],
		["H12", "Weight (Kg)"],
		["I12", "Height (cm)"],
		["J12", "BMI for 6 y.o. and above"],
		["K12", "Nutritional Status (NS)"],
		["M12", "Classification of Beneficiary (Primary or Secondary)"],
		["N12", "Pregnant (Yes or No)"],
		["O12", "With 0-1 year old children (Yes or No)"],
		["P12", "Dewormed (Yes or No)"],
		["Q12", "Parent's consent for milk (Yes or No)"],
		["R12", "Participation in 4Ps (Yes or No)"],
		["S12", "Beneficiary of SBFP in previous years (Yes or No)"]
	];
	const headersR13 = [["K13", "BMI-A"], ["L13", "HFA"]];
	let sheetRows = "";
	sheetRows += `<row r="1" ht="18" customHeight="1">${cell("A1", "SBFP Form 1A (2026)", 1)}</row>`;
	sheetRows += `<row r="2" ht="8" customHeight="1"/>`;
	sheetRows += `<row r="3" ht="28" customHeight="1">${cell("A3", "Department of Education", 2)}</row>`;
	sheetRows += `<row r="4" ht="8" customHeight="1"/>`;
	sheetRows += `<row r="5" ht="20" customHeight="1">${cell("A5", `Master List of Beneficiaries for School-Based Feeding Program (SBFP) | SY 2025-2026 — ${titlePeriod}`, 2)}</row>`;
	sheetRows += `<row r="6" ht="8" customHeight="1"/>`;
	sheetRows += `<row r="7">${cell("A7", "Division: Urdaneta City", 3)}${cell("G7", "Name of Principal: _______________________________", 3)}</row>`;
	sheetRows += `<row r="8">${cell("A8", "City/Municipality/Barangay: _______________________", 3)}${cell("G8", "Name of Feeding Focal Person: ____________________", 3)}</row>`;
	sheetRows += `<row r="9">${cell("A9", `Name of School / School District : ${school.name}`, 3)}</row>`;
	sheetRows += `<row r="10">${cell("A10", `School Type: ${school.type}`, 3)}</row>`;
	sheetRows += `<row r="11">${cell("A11", "School ID Number: _______________", 3)}</row>`;
	sheetRows += `<row r="12" ht="30" customHeight="1">${headersR12.map(([r, v]) => cell(r, v, 4)).join("")}</row>`;
	sheetRows += `<row r="13" ht="22" customHeight="1">${headersR13.map(([r, v]) => cell(r, v, 4)).join("")}</row>`;
	sorted.forEach((s, i) => {
		const r = 14 + i;
		const age = s.ageYears || s.ageMonths ? `${s.ageYears || "0"}/${s.ageMonths || "0"}` : "";
		const vals = [
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
			s.sbfpPreviousYears || ""
		];
		const letters = "ABCDEFGHIJKLMNOPQRS";
		sheetRows += `<row r="${r}">${vals.map((v, ci) => cell(`${letters[ci]}${r}`, v, 5)).join("")}</row>`;
	});
	const lastData = 13 + sorted.length;
	const signRow = lastData + 2;
	sheetRows += `<row r="${lastData + 1}"/>`;
	sheetRows += `<row r="${signRow}">${cell(`B${signRow}`, "Approve by:", 3)}</row>`;
	sheetRows += `<row r="${signRow + 1}"/>`;
	sheetRows += `<row r="${signRow + 2}">${cell(`B${signRow + 2}`, "________________________", 1)}</row>`;
	sheetRows += `<row r="${signRow + 3}">${cell(`B${signRow + 3}`, "School Head", 1)}</row>`;
	const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <dimension ref="A1:S${signRow + 3}"/>
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>${colsXml}</cols>
  <sheetData>${sheetRows}</sheetData>
  <mergeCells count="${merges.length}">${mergeXml}</mergeCells>
  <pageMargins left="0" right="0" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
  <pageSetup paperSize="14" orientation="landscape" horizontalCentered="1" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
	const blob = buildZip({
		"[Content_Types].xml": strToUint8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`),
		"_rels/.rels": strToUint8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
		"xl/workbook.xml": strToUint8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="SBFP Master List" sheetId="1" r:id="rId1"/></sheets>
</workbook>`),
		"xl/_rels/workbook.xml.rels": strToUint8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
		"xl/worksheets/sheet1.xml": strToUint8(sheetXml),
		"xl/styles.xml": strToUint8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="5">
    <font><sz val="10"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="14"/><name val="Calibri"/></font>
    <font><sz val="10"/><name val="Calibri"/></font>
    <font><b/><sz val="8"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD9E1F2"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color auto="1"/></left>
      <right style="thin"><color auto="1"/></right>
      <top style="thin"><color auto="1"/></top>
      <bottom style="thin"><color auto="1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf/></cellStyleXfs>
  <cellXfs count="6">
    <xf fontId="0" fillId="0" borderId="0"/>
    <xf fontId="1" fillId="0" borderId="0"/>
    <xf fontId="2" fillId="0" borderId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf fontId="3" fillId="0" borderId="0"/>
    <xf fontId="4" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
  </cellXfs>
</styleSheet>`)
	});
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
var WHO_BMI_M = [
	[15.3, 1],
	[15.3, 1.1],
	[15.5, 1.2],
	[15.8, 1.4],
	[16.3, 1.6],
	[16.8, 1.9],
	[17.5, 2.2],
	[18.2, 2.5],
	[19, 2.8],
	[19.8, 3],
	[20.5, 3.1],
	[21.1, 3.2],
	[21.6, 3.3],
	[22, 3.4],
	[22.3, 3.4]
];
var WHO_BMI_F = [
	[15.3, 1],
	[15.3, 1.1],
	[15.5, 1.3],
	[16, 1.6],
	[16.6, 1.9],
	[17.3, 2.2],
	[18, 2.6],
	[18.7, 2.9],
	[19.4, 3.1],
	[19.9, 3.2],
	[20.4, 3.3],
	[20.8, 3.3],
	[21.1, 3.3],
	[21.3, 3.4],
	[21.4, 3.4]
];
var WHO_HFA_M = [
	[110, 4.3],
	[116, 4.5],
	[121.7, 4.8],
	[127.3, 5.1],
	[132.6, 5.4],
	[137.8, 5.8],
	[143.5, 6.4],
	[149.8, 7.2],
	[156.4, 7.8],
	[162.6, 7.8],
	[167, 7.3],
	[170, 6.9],
	[171.6, 6.7],
	[172.4, 6.6],
	[173, 6.6]
];
var WHO_HFA_F = [
	[109.4, 4.2],
	[115.1, 4.5],
	[120.8, 4.8],
	[126.3, 5.2],
	[131.5, 5.6],
	[136.8, 5.9],
	[142.5, 6],
	[147.6, 6],
	[151.4, 5.9],
	[153.7, 5.8],
	[154.9, 5.8],
	[155.6, 5.7],
	[156, 5.7],
	[156.3, 5.7],
	[156.4, 5.7]
];
function calcBMI(w, h) {
	const wn = parseFloat(w), hn = parseFloat(h) / 100;
	if (!wn || !hn || hn <= 0) return "";
	return (wn / (hn * hn)).toFixed(2);
}
function computeAge(dob) {
	if (!dob) return {
		years: "",
		months: ""
	};
	const birth = new Date(dob), today = /* @__PURE__ */ new Date();
	if (isNaN(birth.getTime()) || birth > today) return {
		years: "",
		months: ""
	};
	let years = today.getFullYear() - birth.getFullYear();
	let months = today.getMonth() - birth.getMonth();
	if (today.getDate() < birth.getDate()) months--;
	if (months < 0) {
		years--;
		months += 12;
	}
	return {
		years: String(years),
		months: String(months)
	};
}
function classifyBMI(bmi, ageYears, sex) {
	const b = parseFloat(bmi), age = parseInt(ageYears);
	if (!b || !age || age < 5 || age > 19 || sex !== "M" && sex !== "F") return "";
	const [med, sd] = (sex === "M" ? WHO_BMI_M : WHO_BMI_F)[Math.min(age - 5, 14)];
	const z = (b - med) / sd;
	if (z < -3) return "Severely Wasted";
	if (z < -2) return "Wasted";
	if (z <= 1) return "Normal";
	if (z <= 2) return "Overweight";
	return "Obese";
}
function classifyHFA(height, ageYears, sex) {
	const h = parseFloat(height), age = parseInt(ageYears);
	if (!h || !age || age < 5 || age > 19 || sex !== "M" && sex !== "F") return "";
	const [med, sd] = (sex === "M" ? WHO_HFA_M : WHO_HFA_F)[Math.min(age - 5, 14)];
	const z = (h - med) / sd;
	if (z < -3) return "Severely Stunted";
	if (z < -2) return "Stunted";
	if (z <= 2) return "Normal";
	return "Tall";
}
var EMPTY_STUDENT = (schoolId, period = "") => ({
	schoolId,
	period: period || "",
	sy: "2025-2026",
	name: "",
	sex: "",
	gradeLevel: "",
	dateOfBirth: "",
	dateOfWeighing: "",
	ageYears: "",
	ageMonths: "",
	weight: "",
	height: "",
	bmi: "",
	bmiStatus: "",
	hfaStatus: "",
	nutritionalStatus: "",
	classificationOfBeneficiary: "",
	pregnant: "",
	hasYoungChildren: "",
	dewormed: "",
	parentConsentMilk: "",
	fourPs: "",
	sbfpPreviousYears: ""
});
var FIRST_NAMES_M = [
	"Juan",
	"Pedro",
	"Miguel",
	"Jose",
	"Carlos",
	"Antonio",
	"Rafael",
	"Luis",
	"Gabriel",
	"Andres",
	"Mark",
	"John",
	"Daniel",
	"James",
	"Joshua",
	"Alden",
	"Coco",
	"Xian",
	"Enrique",
	"Matteo",
	"Diego",
	"Paolo",
	"Nico",
	"Marco",
	"Lorenzo",
	"Francis",
	"Christian",
	"Ryan",
	"Kevin",
	"Jared"
];
var FIRST_NAMES_F = [
	"Maria",
	"Ana",
	"Sofia",
	"Liza",
	"Chloe",
	"Bea",
	"Nadine",
	"Kathryn",
	"Angel",
	"Marian",
	"Julia",
	"Anne",
	"Kim",
	"Maine",
	"Sarah",
	"Isabella",
	"Camila",
	"Elena",
	"Andrea",
	"Patricia",
	"Angela",
	"Christine",
	"Nicole",
	"Bianca",
	"Katrina",
	"Jasmine",
	"Michelle",
	"Amanda",
	"Rosa",
	"Carmen"
];
var LAST_NAMES = [
	"Santos",
	"dela Cruz",
	"Reyes",
	"Bautista",
	"Garcia",
	"Cruz",
	"Mendoza",
	"Gonzales",
	"Villanueva",
	"Perez",
	"Alonzo",
	"Padilla",
	"Lustre",
	"Reid",
	"Bernardo",
	"Gil",
	"Locsin",
	"Dantes",
	"Rivera",
	"Martin",
	"Barretto",
	"Garcia",
	"Curtis",
	"Navarro",
	"Chiu",
	"Lim",
	"Mendoza",
	"Richards",
	"Geronimo",
	"Guidicelli",
	"Torres",
	"Ramos",
	"Flores",
	"Castillo",
	"Aquino",
	"Lopez",
	"Diaz",
	"Hernandez",
	"Morales",
	"Santiago"
];
function seededRandom(seed) {
	let s = seed;
	return () => {
		s = (s * 16807 + 0) % 2147483647;
		return (s - 1) / 2147483646;
	};
}
function pick(arr, rnd) {
	return arr[Math.floor(rnd() * arr.length)];
}
function generateSeed(schools) {
	const students = [];
	let idCounter = 1;
	const yesNo = (rnd, pYes = .7) => rnd() < pYes ? "Yes" : "No";
	const weighingDates = {
		Baseline: "2025-09-15",
		Midline: "2026-01-20",
		Endline: "2026-05-15"
	};
	for (const school of schools) {
		const grades = getGrades(school);
		const isHS = school.type === "High School";
		const cohortSize = 50 + Math.floor(seededRandom(school.id.charCodeAt(0) + school.id.charCodeAt(2))() * 11);
		const rnd = seededRandom(school.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
		for (let i = 0; i < cohortSize; i++) {
			const sex = rnd() < .5 ? "M" : "F";
			const grade = grades[Math.floor(rnd() * grades.length)];
			const name = `${sex === "M" ? pick(FIRST_NAMES_M, rnd) : pick(FIRST_NAMES_F, rnd)} ${pick(LAST_NAMES, rnd)}`;
			const gradeForAge = grade.replace(/^SPED /, "");
			const ageYearsBase = Math.max(5, Math.min(18, (isHS ? gradeForAge === "Grade 7" ? 12 : gradeForAge === "Grade 8" ? 13 : gradeForAge === "Grade 9" ? 14 : gradeForAge === "Grade 10" ? 15 : gradeForAge === "Grade 11" ? 16 : 17 : gradeForAge === "Kinder" ? 5 : gradeForAge === "Grade 1" ? 6 : gradeForAge === "Grade 2" ? 7 : gradeForAge === "Grade 3" ? 8 : gradeForAge === "Grade 4" ? 9 : gradeForAge === "Grade 5" ? 10 : gradeForAge === "Grade 6" ? 11 : 8) + Math.floor(rnd() * 3) - 1));
			const ageMonthsBase = Math.floor(rnd() * 12);
			const dateOfBirth = `${2025 - ageYearsBase - (ageMonthsBase > 8 ? 1 : 0)}-${String(Math.floor(rnd() * 12) + 1).padStart(2, "0")}-${String(Math.floor(rnd() * 28) + 1).padStart(2, "0")}`;
			const pregnant = sex === "F" && ageYearsBase >= 15 && rnd() < .05 ? "Yes" : "No";
			const hasYoungChildren = sex === "F" && ageYearsBase >= 16 && rnd() < .08 ? "Yes" : "No";
			const dewormed = yesNo(rnd, .82);
			const parentConsentMilk = yesNo(rnd, .88);
			const fourPs = yesNo(rnd, .55);
			const sbfpPreviousYears = yesNo(rnd, .48);
			const isGrade2to6 = [
				"Grade 2",
				"Grade 3",
				"Grade 4",
				"Grade 5",
				"Grade 6",
				"SPED Grade 2",
				"SPED Grade 3",
				"SPED Grade 4",
				"SPED Grade 5",
				"SPED Grade 6"
			].includes(grade);
			let zBmi;
			let zHfa;
			if (isGrade2to6) {
				const mode = rnd();
				if (mode < .4) {
					zBmi = -3.8 + rnd() * .75;
					zHfa = -1.5 + rnd() * 2.5;
				} else if (mode < .75) {
					zBmi = -1.2 + rnd() * 2;
					zHfa = -3.7 + rnd() * .65;
				} else {
					zBmi = -3.8 + rnd() * .75;
					zHfa = -3.7 + rnd() * .65;
				}
			} else {
				zBmi = rnd() < .14 ? -3.1 + rnd() * .9 : rnd() < .28 ? -2.4 + rnd() * .9 : rnd() < .72 ? -.4 + rnd() * 1.4 : .7 + rnd() * 1.6;
				zHfa = rnd() < .12 ? -3 + rnd() * .8 : rnd() < .25 ? -2.3 + rnd() * .8 : rnd() < .85 ? -.2 + rnd() * 1.5 : 1.1 + rnd() * 1.4;
			}
			const bmiImprove = isGrade2to6 ? rnd() < .5 ? .08 + rnd() * .2 : 0 : rnd() < .65 ? .25 + rnd() * .55 : rnd() < .85 ? 0 : -(.1 + rnd() * .3);
			const hfaImprove = isGrade2to6 ? rnd() < .45 ? .05 + rnd() * .15 : 0 : rnd() < .55 ? .15 + rnd() * .4 : rnd() < .8 ? 0 : -(.05 + rnd() * .2);
			PERIODS.forEach((period, pIdx) => {
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
				const nutritionalStatus = bmiStatus === "Normal" ? hfaStatus.includes("Stunted") ? hfaStatus : "Normal" : bmiStatus;
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
					sbfpPreviousYears
				});
			});
		}
	}
	return students;
}
var SEED = generateSeed([...INIT_ES, ...INIT_HS]);
function Pill({ label, color }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "text-[9px] px-1.5 py-0.5 rounded-sm",
		style: {
			background: color + "20",
			color,
			border: `1px solid ${color}40`
		},
		children: label
	});
}
function StatCard({ label, value, accent, t }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			border: `1px solid ${t.border}`,
			background: t.surface
		},
		className: "p-4 flex flex-col gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[9px] tracking-widest uppercase",
			style: { color: t.dim },
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-2xl font-semibold",
			style: {
				fontFamily: "'JetBrains Mono',monospace",
				color: accent ? t.accent : t.text
			},
			children: value
		})]
	});
}
function Bar({ val, max, color, t }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-0.5 rounded-full overflow-hidden",
		style: { background: t.border },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: {
				width: `${max > 0 ? val / max * 100 : 0}%`,
				background: color
			},
			className: "h-full"
		})
	});
}
function YesNoToggle({ value, onChange, t }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex gap-1",
		children: ["Yes", "No"].map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			onClick: () => onChange(v),
			className: "flex-1 py-2 text-xs rounded-sm cursor-pointer border transition-colors",
			style: value === v ? {
				background: v === "Yes" ? t.accentBg : "#cc333315",
				color: v === "Yes" ? t.accent : t.danger,
				borderColor: v === "Yes" ? t.accent + "40" : t.danger + "40"
			} : {
				background: t.surface2,
				color: t.dim,
				borderColor: t.border
			},
			children: v
		}, v))
	});
}
function Field({ label, children, span, t }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: span,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
			className: "block text-[9px] tracking-widest uppercase mb-1.5",
			style: { color: t.dim },
			children: label
		}), children]
	});
}
function Sidebar({ view, setView, selectedSchool, setSelectedSchool, themeMode, toggleTheme, schools }) {
	const t = useT();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		style: {
			borderRight: `1px solid ${t.border}`,
			background: t.surface
		},
		className: "w-56 flex-shrink-0 flex flex-col h-full",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 py-5",
				style: { borderBottom: `1px solid ${t.border}` },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2.5 mb-0.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-6 h-6 rounded-sm flex items-center justify-center",
						style: { background: t.accent },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[9px] font-bold",
							style: { color: t.accentText },
							children: "DEP"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-semibold",
						style: { color: t.text },
						children: "Health Monitor"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[10px] pl-8",
					style: { color: t.dim },
					children: "District Data System"
				})]
			}),
			selectedSchool && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-3 mt-3 p-3 rounded-sm",
				style: {
					border: `1px solid ${t.border}`,
					background: t.surface2
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[8px] tracking-widest uppercase mb-1",
						style: { color: t.dim },
						children: "Selected School"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] leading-snug font-medium",
						style: { color: t.text },
						children: selectedSchool.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5 mt-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							label: selectedSchool.type === "Elementary" ? "ES" : "HS",
							color: selectedSchool.type === "Elementary" ? "#00c9ff" : "#b8ff4f"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								setSelectedSchool(null);
								setView("schools");
							},
							className: "text-[9px] cursor-pointer ml-auto transition-colors",
							style: { color: t.dim },
							onMouseEnter: (e) => e.currentTarget.style.color = t.sub,
							onMouseLeave: (e) => e.currentTarget.style.color = t.dim,
							children: "✕ clear"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "flex-1 p-3 flex flex-col gap-0.5 mt-1",
				children: [
					{
						id: "district",
						label: "District Dashboard",
						icon: "◎"
					},
					{
						id: "schools",
						label: "All Schools",
						icon: "◉"
					},
					{
						id: "dashboard",
						label: "Dashboard",
						icon: "▦",
						requiresSchool: true
					},
					{
						id: "records",
						label: "Student Records",
						icon: "☰",
						requiresSchool: true
					},
					{
						id: "entry",
						label: "Data Entry",
						icon: "✎",
						requiresSchool: true
					},
					{
						id: "table",
						label: "Summary Table",
						icon: "≡",
						requiresSchool: true
					},
					{
						id: "analytics",
						label: "Analytics",
						icon: "↗",
						requiresSchool: true
					}
				].map((item) => {
					const disabled = !!(item.requiresSchool && !selectedSchool);
					const active = view === item.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => !disabled && setView(item.id),
						disabled,
						className: "w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left text-sm transition-all",
						style: {
							color: disabled ? t.faint : active ? t.accent : t.dim,
							background: active ? t.accentBg : "transparent",
							cursor: disabled ? "not-allowed" : "pointer"
						},
						onMouseEnter: (e) => {
							if (!disabled && !active) e.currentTarget.style.color = t.sub;
						},
						onMouseLeave: (e) => {
							if (!disabled && !active) e.currentTarget.style.color = t.dim;
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-4 text-center text-base",
							children: item.icon
						}), item.label]
					}, item.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-4",
				style: { borderTop: `1px solid ${t.border}` },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: toggleTheme,
					className: "w-full flex items-center gap-2 px-3 py-2 rounded-sm text-xs cursor-pointer transition-all mb-3",
					style: {
						border: `1px solid ${t.border}`,
						background: t.surface2,
						color: t.sub
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: themeMode === "dark" ? "☀" : "☾" }), themeMode === "dark" ? "Day Mode" : "Night Mode"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-[10px] leading-relaxed",
					style: { color: t.faint },
					children: [
						schools.filter((s) => s.type === "Elementary").length,
						" ES · ",
						schools.filter((s) => s.type === "High School").length,
						" HS",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						"SY 2025–2026"
					]
				})]
			})
		]
	});
}
function DistrictDashboard({ students, schools }) {
	const t = useT();
	const [tab, setTab] = (0, import_react.useState)("All");
	const esIds = (0, import_react.useMemo)(() => new Set(schools.filter((s) => s.type === "Elementary").map((s) => s.id)), [schools]);
	const hsIds = (0, import_react.useMemo)(() => new Set(schools.filter((s) => s.type === "High School").map((s) => s.id)), [schools]);
	const filtered = (0, import_react.useMemo)(() => tab === "All" ? students : students.filter((s) => tab === "Elementary" ? esIds.has(s.schoolId) : hsIds.has(s.schoolId)), [
		students,
		tab,
		esIds,
		hsIds
	]);
	const uniqueFiltered = (0, import_react.useMemo)(() => uniqueStudents(filtered), [filtered]);
	const bmiDist = BMI_STATUSES.map((st) => ({
		label: st,
		val: uniqueFiltered.filter((s) => s.bmiStatus === st).length,
		color: BMI_C[st]
	}));
	const hfaDist = HFA_STATUSES.map((st) => ({
		label: st,
		val: uniqueFiltered.filter((s) => s.hfaStatus === st).length,
		color: HFA_C[st]
	}));
	const maxBMI = Math.max(...bmiDist.map((x) => x.val), 1);
	const maxHFA = Math.max(...hfaDist.map((x) => x.val), 1);
	const periodCounts = PERIODS.map((p) => ({
		period: p,
		count: uniqueCount(filtered.filter((s) => s.period === p))
	}));
	const maxPeriod = Math.max(...periodCounts.map((x) => x.count), 1);
	const topSchools = schools.map((s) => {
		const uniq = uniqueStudents(students.filter((st) => st.schoolId === s.id));
		return {
			school: s,
			count: uniq.length,
			atRisk: uniq.filter((st) => st.bmiStatus === "Severely Wasted" || st.bmiStatus === "Wasted").length
		};
	}).filter((x) => x.count > 0).sort((a, b) => b.atRisk - a.atRisk).slice(0, 8);
	const esCount = uniqueCount(students.filter((s) => esIds.has(s.schoolId)));
	const hsCount = uniqueCount(students.filter((s) => hsIds.has(s.schoolId)));
	const esSchoolsWithData = schools.filter((s) => s.type === "Elementary" && students.some((st) => st.schoolId === s.id)).length;
	const hsSchoolsWithData = schools.filter((s) => s.type === "High School" && students.some((st) => st.schoolId === s.id)).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between flex-wrap gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-lg font-semibold",
					style: { color: t.text },
					children: "District Dashboard"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs mt-0.5",
					style: { color: t.dim },
					children: "All Schools · SY 2025–2026"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1.5",
					children: [
						"All",
						"Elementary",
						"High School"
					].map((tb) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setTab(tb),
						className: "px-3 py-1.5 text-xs rounded-sm cursor-pointer border transition-colors",
						style: tab === tb ? {
							background: t.accentBg,
							color: t.accent,
							borderColor: t.accent + "40"
						} : {
							background: t.surface,
							color: t.dim,
							borderColor: t.border
						},
						children: tb
					}, tb))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 md:grid-cols-4 gap-px",
				style: { background: t.border },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Total Students",
						value: uniqueFiltered.length,
						accent: true,
						t
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Schools with Data",
						value: tab === "All" ? `${esSchoolsWithData + hsSchoolsWithData}/${schools.length}` : tab === "Elementary" ? `${esSchoolsWithData}/${schools.filter((s) => s.type === "Elementary").length}` : `${hsSchoolsWithData}/${schools.filter((s) => s.type === "High School").length}`,
						t
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Elementary Students",
						value: esCount,
						t
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "High School Students",
						value: hsCount,
						t
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-3 gap-px",
				style: { background: t.border },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							border: `1px solid ${t.border}`,
							background: t.surface
						},
						className: "p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[9px] tracking-widest uppercase mb-4",
							style: { color: t.dim },
							children: "BMI Distribution"
						}), bmiDist.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between mb-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs",
									style: { color: t.sub },
									children: c.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px]",
									style: {
										fontFamily: "'JetBrains Mono',monospace",
										color: c.color
									},
									children: c.val
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								val: c.val,
								max: maxBMI,
								color: c.color,
								t
							})]
						}, c.label))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							border: `1px solid ${t.border}`,
							background: t.surface
						},
						className: "p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[9px] tracking-widest uppercase mb-4",
							style: { color: t.dim },
							children: "HFA Distribution"
						}), hfaDist.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between mb-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs",
									style: { color: t.sub },
									children: c.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px]",
									style: {
										fontFamily: "'JetBrains Mono',monospace",
										color: c.color
									},
									children: c.val
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								val: c.val,
								max: maxHFA,
								color: c.color,
								t
							})]
						}, c.label))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							border: `1px solid ${t.border}`,
							background: t.surface
						},
						className: "p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[9px] tracking-widest uppercase mb-4",
							style: { color: t.dim },
							children: "Students by Period"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-end gap-3 h-28",
							children: periodCounts.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 flex flex-col items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-semibold",
										style: {
											fontFamily: "'JetBrains Mono',monospace",
											color: PC[d.period]
										},
										children: d.count
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-full rounded-sm",
										style: {
											height: `${d.count / maxPeriod * 70}px`,
											minHeight: "2px",
											background: PC[d.period] + "70"
										}
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px]",
										style: { color: PC[d.period] },
										children: d.period
									})
								]
							}, d.period))
						})]
					})
				]
			}),
			topSchools.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					border: `1px solid ${t.border}`,
					background: t.surface
				},
				className: "p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[9px] tracking-widest uppercase mb-4",
					style: { color: t.dim },
					children: "Schools with Most At-Risk Students (Wasted/Severely Wasted)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-col gap-0",
					children: topSchools.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between py-2.5",
						style: { borderBottom: `1px solid ${t.border}` },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								label: x.school.type === "Elementary" ? "ES" : "HS",
								color: x.school.type === "Elementary" ? "#00c9ff" : "#b8ff4f"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm",
								style: { color: t.text },
								children: x.school.name
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs",
								style: { color: t.dim },
								children: [x.count, " students"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs font-semibold",
								style: {
									fontFamily: "'JetBrains Mono',monospace",
									color: x.atRisk > 0 ? t.danger : t.dim
								},
								children: [x.atRisk, " at-risk"]
							})]
						})]
					}, x.school.id))
				})]
			})
		]
	});
}
function SchoolsList({ students, schools, setSchools, setStudents, onSelect }) {
	const t = useT();
	const [search, setSearch] = (0, import_react.useState)("");
	const [typeFilter, setTypeFilter] = (0, import_react.useState)("All");
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [editingName, setEditingName] = (0, import_react.useState)("");
	const [showAdd, setShowAdd] = (0, import_react.useState)(false);
	const [newName, setNewName] = (0, import_react.useState)("");
	const [newType, setNewType] = (0, import_react.useState)("Elementary");
	const filtered = (0, import_react.useMemo)(() => schools.filter((s) => (typeFilter === "All" || s.type === typeFilter) && s.name.toLowerCase().includes(search.toLowerCase())), [
		schools,
		search,
		typeFilter
	]);
	const coverage = (id) => PERIODS.filter((p) => students.some((s) => s.schoolId === id && s.period === p));
	const count = (id) => uniqueCount(students.filter((s) => s.schoolId === id));
	const startEdit = (s) => {
		setEditingId(s.id);
		setEditingName(s.name);
	};
	const saveEdit = () => {
		if (editingName.trim()) setSchools(schools.map((s) => s.id === editingId ? {
			...s,
			name: editingName.trim()
		} : s));
		setEditingId(null);
	};
	const deleteSchool = (id) => {
		setSchools(schools.filter((s) => s.id !== id));
		setStudents(students.filter((s) => s.schoolId !== id));
	};
	const addSchool = () => {
		if (!newName.trim()) return;
		const id = `${newType === "Elementary" ? "es" : "hs"}${Date.now()}`;
		setSchools([...schools, {
			id,
			name: newName.trim(),
			type: newType
		}]);
		setNewName("");
		setShowAdd(false);
	};
	const inp = {
		background: t.surface2,
		color: t.text,
		border: `1px solid ${t.border}`
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between flex-wrap gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-lg font-semibold",
					style: { color: t.text },
					children: "All Schools"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs mt-0.5",
					style: { color: t.dim },
					children: [
						schools.filter((s) => s.type === "Elementary").length,
						" elementary · ",
						schools.filter((s) => s.type === "High School").length,
						" high school"
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 flex-wrap",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: search,
							onChange: (e) => setSearch(e.target.value),
							placeholder: "Search schools…",
							className: "text-sm px-3 py-1.5 rounded-sm outline-none w-48",
							style: {
								...inp,
								fontFamily: "'Outfit',sans-serif"
							}
						}),
						[
							"All",
							"Elementary",
							"High School"
						].map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setTypeFilter(type),
							className: "px-3 py-1.5 text-xs rounded-sm cursor-pointer border transition-colors",
							style: typeFilter === type ? {
								background: t.accentBg,
								color: t.accent,
								borderColor: t.accent + "40"
							} : {
								background: t.surface,
								color: t.dim,
								borderColor: t.border
							},
							children: type
						}, type)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setShowAdd(true),
							className: "px-3 py-1.5 text-xs rounded-sm cursor-pointer font-semibold transition-colors",
							style: {
								background: t.accent,
								color: t.accentText
							},
							children: "+ Add School"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-px",
				style: { background: t.border },
				children: PERIODS.map((p) => {
					const n = schools.filter((s) => students.some((st) => st.schoolId === s.id && st.period === p)).length;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							border: `1px solid ${t.border}`,
							background: t.surface
						},
						className: "p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[9px] tracking-widest uppercase mb-2",
								style: { color: PC[p] },
								children: p
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-xl font-semibold",
								style: {
									fontFamily: "'JetBrains Mono',monospace",
									color: t.text
								},
								children: [n, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-sm",
									style: { color: t.faint },
									children: ["/", schools.length]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] mt-1",
								style: { color: t.dim },
								children: "schools with data"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								val: n,
								max: schools.length,
								color: PC[p],
								t
							})
						]
					}, p);
				})
			}),
			showAdd && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					border: `1px solid ${t.accent}40`,
					background: t.accentBg
				},
				className: "p-4 rounded-sm flex items-center gap-3 flex-wrap",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: newName,
						onChange: (e) => setNewName(e.target.value),
						placeholder: "School name…",
						onKeyDown: (e) => e.key === "Enter" && addSchool(),
						className: "flex-1 min-w-[200px] text-sm px-3 py-2 rounded-sm outline-none",
						style: { ...inp }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-1.5",
						children: ["Elementary", "High School"].map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setNewType(type),
							className: "px-3 py-2 text-xs rounded-sm cursor-pointer border transition-colors",
							style: newType === type ? {
								background: t.accentBg,
								color: t.accent,
								borderColor: t.accent + "40"
							} : {
								background: t.surface2,
								color: t.dim,
								borderColor: t.border
							},
							children: type
						}, type))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: addSchool,
						className: "px-4 py-2 text-sm font-semibold rounded-sm cursor-pointer",
						style: {
							background: t.accent,
							color: t.accentText
						},
						children: "Save"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							setShowAdd(false);
							setNewName("");
						},
						className: "text-sm cursor-pointer",
						style: { color: t.dim },
						children: "Cancel"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					border: `1px solid ${t.border}`,
					background: t.surface
				},
				className: "overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						style: { borderBottom: `1px solid ${t.border}` },
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left px-4 py-3 text-[9px] tracking-widest uppercase",
								style: { color: t.dim },
								children: "School"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 text-[9px] tracking-widest uppercase text-center",
								style: { color: t.dim },
								children: "Type"
							}),
							PERIODS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 text-[9px] tracking-widest uppercase text-center",
								style: { color: PC[p] + "99" },
								children: p
							}, p)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 text-[9px] tracking-widest uppercase text-center",
								style: { color: t.dim },
								children: "Students"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-4 py-3 w-32" })
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: filtered.map((school) => {
						const cov = coverage(school.id);
						const n = count(school.id);
						const isEditing = editingId === school.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "group transition-colors",
							style: { borderBottom: `1px solid ${t.border}` },
							onMouseEnter: (e) => e.currentTarget.style.background = t.hover,
							onMouseLeave: (e) => e.currentTarget.style.background = "transparent",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-2.5 font-medium",
									children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: editingName,
										onChange: (e) => setEditingName(e.target.value),
										onKeyDown: (e) => {
											if (e.key === "Enter") saveEdit();
											if (e.key === "Escape") setEditingId(null);
										},
										autoFocus: true,
										className: "text-sm px-2 py-1 rounded-sm outline-none w-full",
										style: { ...inp }
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										style: { color: t.text },
										children: school.name
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-2.5 text-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
										label: school.type === "Elementary" ? "ES" : "HS",
										color: school.type === "Elementary" ? "#00c9ff" : "#b8ff4f"
									})
								}),
								PERIODS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-2.5 text-center",
									children: cov.includes(p) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										style: { color: PC[p] },
										children: "✓"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										style: { color: t.faint },
										children: "—"
									})
								}, p)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-2.5 text-center text-xs",
									style: {
										fontFamily: "'JetBrains Mono',monospace",
										color: n > 0 ? t.sub : t.faint
									},
									children: n
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-2.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity",
										children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: saveEdit,
											className: "text-xs cursor-pointer font-semibold",
											style: { color: t.accent },
											children: "Save"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => setEditingId(null),
											className: "text-xs cursor-pointer",
											style: { color: t.dim },
											children: "Cancel"
										})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => onSelect(school),
												className: "text-xs px-2 py-1 rounded-sm cursor-pointer border",
												style: {
													background: t.accentBg,
													color: t.accent,
													borderColor: t.accent + "30"
												},
												children: "Open →"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => startEdit(school),
												className: "text-xs cursor-pointer",
												style: { color: t.sub },
												children: "✏"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => deleteSchool(school.id),
												className: "text-xs cursor-pointer transition-colors",
												style: { color: t.dim },
												onMouseEnter: (e) => e.currentTarget.style.color = t.danger,
												onMouseLeave: (e) => e.currentTarget.style.color = t.dim,
												children: "✕"
											})
										] })
									})
								})
							]
						}, school.id);
					}) })]
				})
			})
		]
	});
}
function Dashboard({ students, school }) {
	const t = useT();
	const [period, setPeriod] = (0, import_react.useState)("All");
	const fRaw = period === "All" ? students : students.filter((s) => s.period === period);
	const f = period === "All" ? uniqueStudents(fRaw) : fRaw;
	const bmiDist = BMI_STATUSES.map((st) => ({
		label: st,
		val: f.filter((s) => s.bmiStatus === st).length,
		color: BMI_C[st]
	}));
	const hfaDist = HFA_STATUSES.map((st) => ({
		label: st,
		val: f.filter((s) => s.hfaStatus === st).length,
		color: HFA_C[st]
	}));
	const maxBMI = Math.max(...bmiDist.map((x) => x.val), 1);
	const maxHFA = Math.max(...hfaDist.map((x) => x.val), 1);
	const byGrade = getGrades(school).map((g) => ({
		grade: g,
		count: f.filter((s) => s.gradeLevel === g).length
	}));
	const maxG = Math.max(...byGrade.map((x) => x.count), 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between flex-wrap gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-lg font-semibold",
					style: { color: t.text },
					children: school.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs mt-0.5",
					style: { color: t.dim },
					children: [school.type, " · SY 2025–2026"]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1.5",
					children: ["All", ...PERIODS].map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setPeriod(p),
						className: "px-3 py-1.5 text-xs rounded-sm cursor-pointer border transition-colors",
						style: period === p ? p === "All" ? {
							background: t.accentBg,
							color: t.accent,
							borderColor: t.accent + "40"
						} : {
							background: PC[p] + "20",
							color: PC[p],
							borderColor: PC[p] + "40"
						} : {
							background: t.surface,
							color: t.dim,
							borderColor: t.border
						},
						children: p
					}, p))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 md:grid-cols-4 gap-px",
				style: { background: t.border },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Total Students",
						value: f.length,
						accent: true,
						t
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "4Ps Beneficiaries",
						value: f.filter((s) => s.fourPs === "Yes").length,
						t
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "SBFP Prev. Years",
						value: f.filter((s) => s.sbfpPreviousYears === "Yes").length,
						t
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Dewormed",
						value: f.filter((s) => s.dewormed === "Yes").length,
						t
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-2 gap-px",
				style: { background: t.border },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						border: `1px solid ${t.border}`,
						background: t.surface
					},
					className: "p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[9px] tracking-widest uppercase mb-4",
						style: { color: t.dim },
						children: "BMI Status"
					}), bmiDist.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between mb-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs",
								style: { color: t.sub },
								children: c.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px]",
								style: {
									fontFamily: "'JetBrains Mono',monospace",
									color: c.color
								},
								children: c.val
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							val: c.val,
							max: maxBMI,
							color: c.color,
							t
						})]
					}, c.label))]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						border: `1px solid ${t.border}`,
						background: t.surface
					},
					className: "p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[9px] tracking-widest uppercase mb-4",
						style: { color: t.dim },
						children: "HFA Status"
					}), hfaDist.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between mb-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs",
								style: { color: t.sub },
								children: c.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px]",
								style: {
									fontFamily: "'JetBrains Mono',monospace",
									color: c.color
								},
								children: c.val
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							val: c.val,
							max: maxHFA,
							color: c.color,
							t
						})]
					}, c.label))]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					border: `1px solid ${t.border}`,
					background: t.surface
				},
				className: "p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[9px] tracking-widest uppercase mb-4",
					style: { color: t.dim },
					children: "Students by Grade"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-end gap-2",
					children: byGrade.map(({ grade, count }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 flex flex-col items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-full rounded-sm",
							style: {
								height: `${count / maxG * 60}px`,
								minHeight: "2px",
								background: count > 0 ? t.accent : t.border
							}
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[8px]",
							style: {
								fontFamily: "'JetBrains Mono',monospace",
								color: t.faint
							},
							children: grade.replace("SPED ", "S").replace("Grade ", "G").replace("Kinder", "KG")
						})]
					}, grade))
				})]
			})
		]
	});
}
function DataEntry({ students, setStudents, school, setView, editingStudent, clearEditing }) {
	const t = useT();
	const [period, setPeriod] = (0, import_react.useState)(editingStudent?.period ?? null);
	const [form, setForm] = (0, import_react.useState)(() => editingStudent ? { ...editingStudent } : EMPTY_STUDENT(school.id, ""));
	const [saved, setSaved] = (0, import_react.useState)(false);
	const [periodError, setPeriodError] = (0, import_react.useState)(false);
	const periodRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (editingStudent) {
			setForm({ ...editingStudent });
			setPeriod(editingStudent.period);
			setPeriodError(false);
		}
	}, [editingStudent?.id]);
	const grades = getGrades(school);
	const inp = {
		background: t.surface2,
		color: t.text,
		border: `1px solid ${t.border}`,
		fontFamily: "'Outfit',sans-serif"
	};
	const inpMono = {
		...inp,
		fontFamily: "'JetBrains Mono',monospace"
	};
	const cls = "w-full text-sm px-3 py-2 rounded-sm outline-none";
	const set = (key, val) => {
		setForm((f) => {
			const next = {
				...f,
				[key]: val
			};
			if (key === "dateOfBirth") {
				const age = computeAge(val);
				next.ageYears = age.years;
				next.ageMonths = age.months;
			}
			const ageY = next.ageYears;
			const sex = next.sex;
			const weight = key === "weight" ? val : f.weight;
			const height = key === "height" ? val : f.height;
			const measuresChanged = key === "weight" || key === "height";
			if (measuresChanged) next.bmi = calcBMI(weight, height);
			if (measuresChanged || key === "dateOfBirth" || key === "sex" || key === "ageYears") next.bmiStatus = classifyBMI(next.bmi || calcBMI(weight, height), ageY, sex) || next.bmiStatus;
			if (key === "height" || key === "dateOfBirth" || key === "sex" || key === "ageYears") next.hfaStatus = classifyHFA(height, ageY, sex) || next.hfaStatus;
			next.nutritionalStatus = next.bmiStatus || next.nutritionalStatus;
			if (key !== "classificationOfBeneficiary") {
				const autoClass = classifyBeneficiary(next.gradeLevel, next.bmiStatus, next.hfaStatus);
				if (autoClass) next.classificationOfBeneficiary = autoClass;
			}
			return next;
		});
	};
	const handlePeriodChange = (p) => {
		setPeriod(p);
		setPeriodError(false);
		setForm((f) => ({
			...f,
			period: p
		}));
	};
	const handleSave = () => {
		if (!period) {
			setPeriodError(true);
			periodRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "center"
			});
			(periodRef.current?.querySelector("button"))?.focus();
			return;
		}
		if (!form.name.trim()) return;
		const id = editingStudent?.id ?? "s" + Date.now();
		const payload = {
			...form,
			period,
			id
		};
		if (editingStudent) setStudents(students.map((s) => s.id === editingStudent.id ? payload : s));
		else setStudents([...students, payload]);
		setSaved(true);
		setTimeout(() => setSaved(false), 2e3);
		if (editingStudent) {
			clearEditing();
			setView("records");
		} else {
			setPeriod(null);
			setPeriodError(false);
			setForm(EMPTY_STUDENT(school.id, ""));
		}
	};
	const handleCancel = () => {
		clearEditing();
		setView("records");
	};
	const ageYrs = parseInt(form.ageYears) || 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6 max-w-3xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between flex-wrap gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-lg font-semibold",
					style: { color: t.text },
					children: editingStudent ? "Edit Student" : "Data Entry"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs mt-0.5",
					style: { color: t.dim },
					children: school.name
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-end gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							ref: periodRef,
							className: "flex gap-1.5",
							tabIndex: -1,
							style: periodError ? {
								outline: `2px solid ${t.danger}`,
								outlineOffset: 2,
								borderRadius: 4,
								padding: 2
							} : void 0,
							children: PERIODS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => handlePeriodChange(p),
								className: "px-3 py-1.5 text-xs rounded-sm cursor-pointer border transition-colors",
								style: period === p ? {
									background: PC[p] + "20",
									color: PC[p],
									borderColor: PC[p] + "40"
								} : {
									background: t.surface,
									color: t.dim,
									borderColor: t.border
								},
								children: p
							}, p))
						}),
						periodError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px]",
							style: { color: t.danger },
							children: "Please select Baseline, Midline, or Endline"
						}),
						!period && !periodError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px]",
							style: { color: t.dim },
							children: "Select a period"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					border: `1px solid ${t.border}`,
					background: t.surface
				},
				className: "p-5 flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[9px] tracking-widest uppercase",
						style: { color: t.dim },
						children: "Student Information"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 md:grid-cols-3 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							t,
							label: "Full Name",
							span: "md:col-span-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: form.name,
								onChange: (e) => set("name", e.target.value),
								placeholder: "Last, First Middle",
								style: inp,
								className: cls
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							t,
							label: "Sex",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex gap-1.5 h-[38px]",
								children: ["M", "F"].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => set("sex", s),
									className: "flex-1 text-sm rounded-sm cursor-pointer border transition-colors",
									style: form.sex === s ? {
										background: t.accentBg,
										color: t.accent,
										borderColor: t.accent + "40"
									} : {
										background: t.surface2,
										color: t.dim,
										borderColor: t.border
									},
									children: s === "M" ? "Male" : "Female"
								}, s))
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 md:grid-cols-4 gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								t,
								label: "Grade Level",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									value: form.gradeLevel,
									onChange: (e) => set("gradeLevel", e.target.value),
									style: {
										...inp,
										cursor: "pointer"
									},
									className: cls,
									children: grades.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: g }, g))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								t,
								label: "Date of Birth",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "date",
									value: form.dateOfBirth,
									onChange: (e) => set("dateOfBirth", e.target.value),
									style: inp,
									className: cls
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								t,
								label: "Date of Weighing",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "date",
									value: form.dateOfWeighing,
									onChange: (e) => set("dateOfWeighing", e.target.value),
									style: inp,
									className: cls
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								t,
								label: "School Year",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: form.sy,
									onChange: (e) => set("sy", e.target.value),
									style: inp,
									className: cls
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							t,
							label: "Age — Years (auto)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								readOnly: true,
								value: form.ageYears,
								placeholder: "—",
								style: {
									...inpMono,
									opacity: form.ageYears ? 1 : .4,
									color: t.accent,
									cursor: "default"
								},
								className: cls
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							t,
							label: "Age — Months (auto)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								readOnly: true,
								value: form.ageMonths,
								placeholder: "—",
								style: {
									...inpMono,
									opacity: form.ageMonths ? 1 : .4,
									color: t.accent,
									cursor: "default"
								},
								className: cls
							})
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					border: `1px solid ${t.border}`,
					background: t.surface
				},
				className: "p-5 flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[9px] tracking-widest uppercase",
						style: { color: t.dim },
						children: "Anthropometric Measurements"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 md:grid-cols-3 gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								t,
								label: "Weight (kg)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									step: "0.1",
									min: 0,
									value: form.weight,
									onChange: (e) => set("weight", e.target.value),
									placeholder: "e.g. 24.5",
									style: inp,
									className: cls
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								t,
								label: "Height (cm)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									step: "0.1",
									min: 0,
									value: form.height,
									onChange: (e) => set("height", e.target.value),
									placeholder: "e.g. 118.0",
									style: inp,
									className: cls
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								t,
								label: `BMI ${ageYrs >= 6 ? "(auto)" : "(6 y.o.+)"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: form.bmi,
									readOnly: ageYrs >= 6,
									onChange: (e) => ageYrs < 6 && set("bmi", e.target.value),
									style: {
										...inpMono,
										color: form.bmi ? t.accent : t.dim,
										opacity: form.bmi ? 1 : .5,
										cursor: ageYrs >= 6 ? "default" : "text"
									},
									className: cls,
									placeholder: "—"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 md:grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							t,
							label: "BMI Status (WHO 2007 — auto, editable)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2 items-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: form.bmiStatus,
									onChange: (e) => set("bmiStatus", e.target.value),
									style: {
										...inp,
										cursor: "pointer",
										flex: 1,
										color: form.bmiStatus ? BMI_C[form.bmiStatus] : t.dim
									},
									className: cls,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "— Select —"
									}), BMI_STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: s,
										style: { color: BMI_C[s] },
										children: s
									}, s))]
								}), form.bmiStatus && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-2 h-2 rounded-full flex-shrink-0",
									style: { background: BMI_C[form.bmiStatus] }
								})]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							t,
							label: "HFA Status (WHO 2007 — auto, editable)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2 items-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: form.hfaStatus,
									onChange: (e) => set("hfaStatus", e.target.value),
									style: {
										...inp,
										cursor: "pointer",
										flex: 1,
										color: form.hfaStatus ? HFA_C[form.hfaStatus] : t.dim
									},
									className: cls,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "— Select —"
									}), HFA_STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: s,
										style: { color: HFA_C[s] },
										children: s
									}, s))]
								}), form.hfaStatus && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-2 h-2 rounded-full flex-shrink-0",
									style: { background: HFA_C[form.hfaStatus] }
								})]
							})
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					border: `1px solid ${t.border}`,
					background: t.surface
				},
				className: "p-5 flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[9px] tracking-widest uppercase",
						style: { color: t.dim },
						children: "Beneficiary Classification"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] -mt-2",
						style: { color: t.faint },
						children: "Kinder & Grade 1 = Primary · Grades 2–12: Primary = Severely Wasted · Secondary = Severely Stunted · auto, editable"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2",
						children: ["Primary", "Secondary"].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => set("classificationOfBeneficiary", c),
							className: "flex-1 py-2 text-sm rounded-sm cursor-pointer border transition-colors",
							style: form.classificationOfBeneficiary === c ? {
								background: t.accentBg,
								color: t.accent,
								borderColor: t.accent + "40"
							} : {
								background: t.surface2,
								color: t.dim,
								borderColor: t.border
							},
							children: c
						}, c))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					border: `1px solid ${t.border}`,
					background: t.surface
				},
				className: "p-5 flex flex-col gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[9px] tracking-widest uppercase",
					style: { color: t.dim },
					children: "Additional Information"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 md:grid-cols-2 gap-4",
					children: [
						["Pregnant?", "pregnant"],
						["With 0–1 Year Old Children?", "hasYoungChildren"],
						["Dewormed?", "dewormed"],
						["Parent's Consent for Milk?", "parentConsentMilk"],
						["Participation in 4Ps?", "fourPs"],
						["Beneficiary of SBFP in Previous Years?", "sbfpPreviousYears"]
					].map(([label, key]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-[9px] tracking-widest uppercase mb-1.5",
						style: { color: t.dim },
						children: label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YesNoToggle, {
						value: form[key],
						onChange: (v) => set(key, v),
						t
					})] }, key))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-3 items-center flex-wrap",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleSave,
						className: "px-6 py-2.5 text-sm font-semibold rounded-sm cursor-pointer transition-colors",
						style: {
							background: t.accent,
							color: t.accentText
						},
						children: saved ? "✓ Saved" : editingStudent ? "Update Student" : "Save Student"
					}),
					editingStudent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleCancel,
						className: "px-4 py-2.5 text-sm cursor-pointer rounded-sm border transition-colors",
						style: {
							borderColor: t.border,
							color: t.dim,
							background: t.surface
						},
						children: "Cancel"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							setPeriod(null);
							setPeriodError(false);
							setForm(EMPTY_STUDENT(school.id, ""));
						},
						className: "px-4 py-2.5 text-sm cursor-pointer rounded-sm border",
						style: {
							borderColor: t.border,
							color: t.dim
						},
						children: "Clear"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setView("records"),
						className: "text-xs ml-auto cursor-pointer",
						style: { color: t.dim },
						children: "View all records →"
					})
				]
			})
		]
	});
}
function StudentRecords({ students, setStudents, school, setView, onEdit }) {
	const t = useT();
	const [period, setPeriod] = (0, import_react.useState)("All");
	const [search, setSearch] = (0, import_react.useState)("");
	const uniqueStudentCount = (0, import_react.useMemo)(() => uniqueCount(students), [students]);
	const filtered = (0, import_react.useMemo)(() => {
		return sortRecords(students.filter((s) => (period === "All" || s.period === period) && (s.name.toLowerCase().includes(search.toLowerCase()) || s.gradeLevel.toLowerCase().includes(search.toLowerCase()))));
	}, [
		students,
		period,
		search
	]);
	const del = (id) => setStudents(students.filter((s) => s.id !== id));
	const th = {
		color: t.dim,
		borderRight: `1px solid ${t.border}`,
		borderBottom: `1px solid ${t.border}`,
		background: t.surfaceDeep,
		verticalAlign: "middle"
	};
	const td = (v, opts) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
		className: "px-1.5 py-2 text-center",
		style: {
			fontFamily: opts?.mono ? "'JetBrains Mono',monospace" : void 0,
			color: opts?.color ?? t.sub,
			borderRight: `1px solid ${t.surfaceDeep}`,
			whiteSpace: opts?.nowrap === false ? "normal" : "nowrap"
		},
		children: v === "" || v === void 0 ? "—" : v
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between flex-wrap gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-lg font-semibold",
					style: { color: t.text },
					children: "Student Records"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs mt-0.5",
					style: { color: t.dim },
					children: [
						school.name,
						" · SBFP Form 1A · sorted Kinder → Grade 6 · ",
						uniqueStudentCount,
						" students · ",
						students.length,
						" period records"
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => exportStudentsToExcel(school, filtered, period === "All" ? "All" : period),
						disabled: filtered.length === 0,
						className: "px-4 py-2 text-sm font-semibold rounded-sm cursor-pointer border transition-colors",
						style: {
							background: filtered.length === 0 ? t.surface2 : t.surface,
							color: filtered.length === 0 ? t.faint : t.accent,
							borderColor: filtered.length === 0 ? t.border : t.accent + "60",
							cursor: filtered.length === 0 ? "not-allowed" : "pointer"
						},
						children: "↓ Export Excel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setView("entry"),
						className: "px-4 py-2 text-sm font-semibold rounded-sm cursor-pointer",
						style: {
							background: t.accent,
							color: t.accentText
						},
						children: "+ Add Student"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 flex-wrap",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: search,
					onChange: (e) => setSearch(e.target.value),
					placeholder: "Search by name or grade…",
					className: "text-sm px-3 py-1.5 rounded-sm outline-none flex-1 min-w-[180px]",
					style: {
						background: t.surface,
						color: t.text,
						border: `1px solid ${t.border}`
					}
				}), ["All", ...PERIODS].map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setPeriod(p),
					className: "px-3 py-1.5 text-xs rounded-sm cursor-pointer border transition-colors",
					style: period === p ? p === "All" ? {
						background: t.accentBg,
						color: t.accent,
						borderColor: t.accent + "40"
					} : {
						background: PC[p] + "20",
						color: PC[p],
						borderColor: PC[p] + "40"
					} : {
						background: t.surface,
						color: t.dim,
						borderColor: t.border
					},
					children: p
				}, p))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					border: `1px solid ${t.border}`,
					background: t.surface
				},
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-[10px] min-w-[1480px] border-collapse",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("thead", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: th,
							children: "No."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-left text-[8px] tracking-widest uppercase",
							style: th,
							children: "Name"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: th,
							children: "Sex"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: th,
							children: "Grade / Section"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: th,
							children: [
								"Date of Birth",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"(MM/DD/YYYY)"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: th,
							children: [
								"Date of Weighing",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"(MM/DD/YYYY)"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: th,
							children: "Age in Years / Months"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: th,
							children: "Weight (Kg)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: th,
							children: "Height (cm)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: th,
							children: [
								"BMI for 6 y.o.",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"and above"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							colSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase text-center",
							style: th,
							children: "Nutritional Status (NS)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: th,
							children: [
								"Classification of",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"Beneficiary"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: th,
							children: [
								"Pregnant",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"(Yes or No)"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: th,
							children: [
								"With 0-1 year old",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"children"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: th,
							children: [
								"Dewormed",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"(Yes or No)"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: th,
							children: [
								"Parent's consent",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"for milk"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: th,
							children: [
								"Participation",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"in 4Ps"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: th,
							children: [
								"Beneficiary of SBFP",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"in previous years"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[8px] tracking-widest uppercase",
							style: {
								...th,
								borderRight: "none"
							},
							children: "Period / Actions"
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-2 py-1.5 text-[8px] tracking-widest uppercase text-center",
						style: th,
						children: "BMI-A"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-2 py-1.5 text-[8px] tracking-widest uppercase text-center",
						style: th,
						children: "HFA"
					})] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [filtered.map((s, idx) => {
						const prev = filtered[idx - 1];
						const gradeBreak = prev && prev.gradeLevel !== s.gradeLevel;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "group",
							style: {
								borderBottom: `1px solid ${t.surfaceDeep}`,
								background: gradeBreak ? t.surfaceDeep : "transparent"
							},
							onMouseEnter: (e) => e.currentTarget.style.background = t.hover,
							onMouseLeave: (e) => e.currentTarget.style.background = gradeBreak ? t.surfaceDeep : "transparent",
							children: [
								td(idx + 1, {
									mono: true,
									color: t.dim
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2 text-left font-medium",
									style: {
										color: t.text,
										borderRight: `1px solid ${t.surfaceDeep}`,
										whiteSpace: "nowrap"
									},
									children: s.name || "—"
								}),
								td(s.sex),
								td(s.gradeLevel),
								td(formatDateMDY(s.dateOfBirth), { mono: true }),
								td(formatDateMDY(s.dateOfWeighing), { mono: true }),
								td(`${s.ageYears || "0"}/${s.ageMonths || "0"}`, { mono: true }),
								td(s.weight || "", { mono: true }),
								td(s.height || "", { mono: true }),
								td(s.bmi || "", {
									mono: true,
									color: s.bmi ? t.accent : t.faint
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-1.5 py-2 text-center",
									style: { borderRight: `1px solid ${t.surfaceDeep}` },
									children: s.bmiStatus ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
										label: s.bmiStatus,
										color: BMI_C[s.bmiStatus]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										style: { color: t.faint },
										children: "—"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-1.5 py-2 text-center",
									style: { borderRight: `1px solid ${t.surfaceDeep}` },
									children: s.hfaStatus ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
										label: s.hfaStatus,
										color: HFA_C[s.hfaStatus]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										style: { color: t.faint },
										children: "—"
									})
								}),
								td(s.classificationOfBeneficiary || ""),
								td(s.pregnant || ""),
								td(s.hasYoungChildren || ""),
								td(s.dewormed || ""),
								td(s.parentConsentMilk || ""),
								td(s.fourPs || ""),
								td(s.sbfpPreviousYears || ""),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-2 py-2",
									style: { whiteSpace: "nowrap" },
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 justify-center",
										children: [
											s.period ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
												label: s.period,
												color: PC[s.period]
											}) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => {
													onEdit(s);
													setView("entry");
												},
												className: "text-[10px] opacity-0 group-hover:opacity-100",
												style: { color: t.dim },
												children: "Edit"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => del(s.id),
												className: "text-[10px] opacity-0 group-hover:opacity-100",
												style: { color: t.danger },
												children: "✕"
											})
										]
									})
								})
							]
						}, s.id);
					}), filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 21,
						className: "px-4 py-10 text-center text-sm",
						style: { color: t.faint },
						children: "No students found."
					}) })] })]
				})
			})
		]
	});
}
function SummaryTable({ students, school }) {
	const t = useT();
	const [period, setPeriod] = (0, import_react.useState)("Endline");
	const isSpedSchool = school.name === SPED_SCHOOL_NAME;
	const [cohort, setCohort] = (0, import_react.useState)("All");
	const isSpedGrade = (g) => g.startsWith("SPED");
	const allGrades = getGrades(school);
	const grades = !isSpedSchool || cohort === "All" ? allGrades : cohort === "SPED" ? allGrades.filter(isSpedGrade) : allGrades.filter((g) => !isSpedGrade(g));
	const f = students.filter((s) => s.period === period && (!isSpedSchool || cohort === "All" ? true : cohort === "SPED" ? isSpedGrade(s.gradeLevel) : !isSpedGrade(s.gradeLevel)));
	const cntBMI = (grade, sex, st) => f.filter((s) => (grade === null || s.gradeLevel === grade) && (sex === null || s.sex === sex) && s.bmiStatus === st).length;
	const cntHFA = (grade, sex, st) => f.filter((s) => (grade === null || s.gradeLevel === grade) && (sex === null || s.sex === sex) && s.hfaStatus === st).length;
	const cntFlag = (grade, sex, field, val) => f.filter((s) => (grade === null || s.gradeLevel === grade) && (sex === null || s.sex === sex) && s[field] === val).length;
	const N = (v, color) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
		className: "px-2 py-2 text-center text-xs",
		style: {
			fontFamily: "'JetBrains Mono',monospace",
			color: v === 0 ? t.faint : color ?? t.accent
		},
		children: v
	});
	const sx = (lbl) => lbl === "Total" ? null : lbl;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between flex-wrap gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				style: { color: t.text },
				children: "Summary Table"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs mt-0.5",
				style: { color: t.dim },
				children: [
					school.name,
					" — SY 2025–2026",
					isSpedSchool && cohort !== "All" ? ` · ${cohort} only` : ""
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-end gap-2",
				children: [isSpedSchool && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1.5",
					children: [
						"All",
						"Regular",
						"SPED"
					].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setCohort(c),
						className: "px-3 py-1.5 text-xs rounded-sm cursor-pointer border transition-colors",
						style: cohort === c ? {
							background: t.accentBg,
							color: t.accent,
							borderColor: t.accent + "40"
						} : {
							background: t.surface,
							color: t.dim,
							borderColor: t.border
						},
						children: c === "All" ? "All Students" : c === "Regular" ? "Regular" : "SPED"
					}, c))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1.5",
					children: PERIODS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setPeriod(p),
						className: "px-3 py-1.5 text-xs rounded-sm cursor-pointer border",
						style: period === p ? {
							background: PC[p] + "20",
							color: PC[p],
							borderColor: PC[p] + "40"
						} : {
							background: t.surface,
							color: t.dim,
							borderColor: t.border
						},
						children: p
					}, p))
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: {
				border: `1px solid ${t.border}`,
				background: t.surface
			},
			className: "overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "text-xs min-w-[860px] w-full border-collapse",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("thead", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					style: { borderBottom: `1px solid ${t.border}` },
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							rowSpan: 2,
							className: "px-3 py-2 text-left text-[9px] tracking-widest uppercase",
							style: {
								color: t.dim,
								borderRight: `1px solid ${t.border}`
							},
							children: "Grade"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							rowSpan: 2,
							className: "px-2 py-2 text-[9px] tracking-widest uppercase",
							style: {
								color: t.dim,
								borderRight: `1px solid ${t.border}`
							},
							children: "Sex"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							colSpan: 6,
							className: "px-2 py-2 text-[9px] tracking-widest uppercase text-center",
							style: {
								color: "#00c9ff",
								borderRight: `1px solid ${t.border}`
							},
							children: "Body Mass Index (BMI)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							colSpan: 5,
							className: "px-2 py-2 text-[9px] tracking-widest uppercase text-center",
							style: {
								color: "#b8ff4f",
								borderRight: `1px solid ${t.border}`
							},
							children: "Height-for-Age (HFA)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-2 py-2 text-[9px] tracking-widest uppercase text-center",
							style: {
								color: "#ff9f4b",
								borderRight: `1px solid ${t.border}`
							},
							children: "4P's"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-2 py-2 text-[9px] tracking-widest uppercase text-center",
							style: { color: "#ff9f4b" },
							children: "SBFP"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					style: { borderBottom: `1px solid ${t.border}` },
					children: [
						[
							"Sev. Wasted",
							"Wasted",
							"Normal",
							"Overweight",
							"Obese",
							"Total",
							"Sev. Stunted",
							"Stunted",
							"Normal",
							"Tall",
							"Total"
						].map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-2 py-1.5 text-[8px] tracking-widest uppercase text-center",
							style: {
								color: t.faint,
								borderRight: `1px solid ${i === 5 || i === 10 ? t.border : t.surfaceDeep}`
							},
							children: h
						}, `${h}${i}`)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { style: { borderRight: `1px solid ${t.border}` } }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [grades.map((grade, gi) => [
					"M",
					"F",
					"Total"
				].map((lbl, ri) => {
					const s = sx(lbl);
					const bmis = BMI_STATUSES.map((st) => cntBMI(grade, s, st));
					const hfas = HFA_STATUSES.map((st) => cntHFA(grade, s, st));
					const bT = bmis.reduce((a, b) => a + b, 0), hT = hfas.reduce((a, b) => a + b, 0);
					const fp = cntFlag(grade, s, "fourPs", "Yes"), sb = cntFlag(grade, s, "sbfpPreviousYears", "Yes");
					const isTotal = lbl === "Total";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						style: {
							borderBottom: `1px solid ${isTotal ? t.border : t.surfaceDeep}`,
							background: isTotal ? t.surfaceDeep : "transparent"
						},
						onMouseEnter: (e) => {
							if (!isTotal) e.currentTarget.style.background = t.hover;
						},
						onMouseLeave: (e) => {
							e.currentTarget.style.background = isTotal ? t.surfaceDeep : "transparent";
						},
						children: [
							ri === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								rowSpan: 3,
								className: "px-3 py-2 text-xs font-medium align-middle",
								style: {
									color: t.sub,
									borderRight: `1px solid ${t.border}`
								},
								children: grade
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-2 py-2 text-center text-xs",
								style: {
									color: isTotal ? t.danger : t.dim,
									fontWeight: isTotal ? 600 : 400,
									borderRight: `1px solid ${t.border}`
								},
								children: lbl
							}),
							bmis.map((v, i) => N(v)),
							N(bT, "#00c9ff"),
							hfas.map((v, i) => N(v)),
							N(hT, "#b8ff4f"),
							N(fp, "#ff9f4b"),
							N(sb, "#ff9f4b")
						]
					}, `${grade}-${ri}`);
				})), [
					"M",
					"F",
					"Total"
				].map((lbl) => {
					const s = sx(lbl);
					const bmis = BMI_STATUSES.map((st) => cntBMI(null, s, st));
					const hfas = HFA_STATUSES.map((st) => cntHFA(null, s, st));
					const bT = bmis.reduce((a, b) => a + b, 0), hT = hfas.reduce((a, b) => a + b, 0);
					const fp = cntFlag(null, s, "fourPs", "Yes"), sb = cntFlag(null, s, "sbfpPreviousYears", "Yes");
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						style: {
							borderBottom: `1px solid ${t.border}`,
							background: t.grandBg
						},
						children: [
							lbl === "M" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								rowSpan: 3,
								className: "px-3 py-2 text-xs font-semibold align-middle",
								style: {
									color: t.accent,
									borderRight: `1px solid ${t.border}`
								},
								children: "GRAND TOTAL"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-2 py-2 text-center text-xs font-semibold",
								style: {
									color: t.danger,
									borderRight: `1px solid ${t.border}`
								},
								children: lbl
							}),
							bmis.map((v, i) => N(v)),
							N(bT, "#00c9ff"),
							hfas.map((v, i) => N(v)),
							N(hT, "#b8ff4f"),
							N(fp, "#ff9f4b"),
							N(sb, "#ff9f4b")
						]
					}, `grand-${lbl}`);
				})] })]
			})
		})]
	});
}
function Analytics({ students, school }) {
	const t = useT();
	const isSpedSchool = school.name === SPED_SCHOOL_NAME;
	const [cohort, setCohort] = (0, import_react.useState)("All");
	const isSpedGrade = (g) => g.startsWith("SPED");
	const filtered = (0, import_react.useMemo)(() => {
		if (!isSpedSchool || cohort === "All") return students;
		return students.filter((s) => cohort === "SPED" ? isSpedGrade(s.gradeLevel) : !isSpedGrade(s.gradeLevel));
	}, [
		students,
		cohort,
		isSpedSchool
	]);
	const uniqAll = uniqueStudents(filtered);
	const periodData = PERIODS.map((p) => {
		const pe = filtered.filter((s) => s.period === p);
		return {
			period: p,
			total: uniqueCount(pe),
			bmi: BMI_STATUSES.map((st) => ({
				st,
				n: pe.filter((s) => s.bmiStatus === st).length,
				c: BMI_C[st]
			})),
			hfa: HFA_STATUSES.map((st) => ({
				st,
				n: pe.filter((s) => s.hfaStatus === st).length,
				c: HFA_C[st]
			}))
		};
	});
	const maxTotal = Math.max(...periodData.map((d) => d.total), 1);
	const allBMI = BMI_STATUSES.map((st) => ({
		label: st,
		val: uniqAll.filter((s) => s.bmiStatus === st).length,
		color: BMI_C[st]
	}));
	const allHFA = HFA_STATUSES.map((st) => ({
		label: st,
		val: uniqAll.filter((s) => s.hfaStatus === st).length,
		color: HFA_C[st]
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between flex-wrap gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-lg font-semibold",
					style: { color: t.text },
					children: "Analytics"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs mt-0.5",
					style: { color: t.dim },
					children: [
						school.name,
						" · ",
						uniqAll.length,
						" students · ",
						filtered.length,
						" period records",
						isSpedSchool && cohort !== "All" ? ` · ${cohort} only` : ""
					]
				})] }), isSpedSchool && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1.5",
					children: [
						"All",
						"Regular",
						"SPED"
					].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setCohort(c),
						className: "px-3 py-1.5 text-xs rounded-sm cursor-pointer border transition-colors",
						style: cohort === c ? {
							background: t.accentBg,
							color: t.accent,
							borderColor: t.accent + "40"
						} : {
							background: t.surface,
							color: t.dim,
							borderColor: t.border
						},
						children: c === "All" ? "All Students" : c === "Regular" ? "Regular" : "SPED"
					}, c))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					border: `1px solid ${t.border}`,
					background: t.surface
				},
				className: "p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[9px] tracking-widest uppercase mb-4",
					style: { color: t.dim },
					children: "Student Count by Period"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-end gap-6",
					children: periodData.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 flex flex-col items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-semibold",
								style: {
									fontFamily: "'JetBrains Mono',monospace",
									color: PC[d.period]
								},
								children: d.total
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-full rounded-sm",
								style: {
									height: `${d.total / maxTotal * 80}px`,
									minHeight: "2px",
									background: PC[d.period] + "60"
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px]",
								style: { color: PC[d.period] },
								children: d.period
							})
						]
					}, d.period))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 md:grid-cols-2 gap-px",
				style: { background: t.border },
				children: [{
					title: "BMI Distribution",
					cats: allBMI
				}, {
					title: "HFA Distribution",
					cats: allHFA
				}].map(({ title, cats }) => {
					const total = cats.reduce((s, c) => s + c.val, 0) || 1;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							border: `1px solid ${t.border}`,
							background: t.surface
						},
						className: "p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[9px] tracking-widest uppercase mb-4",
							style: { color: t.dim },
							children: title
						}), cats.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between mb-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs",
									style: { color: t.sub },
									children: c.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-[10px]",
									style: {
										fontFamily: "'JetBrains Mono',monospace",
										color: c.color
									},
									children: [
										c.val,
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											style: { color: t.faint },
											children: [
												"(",
												(c.val / total * 100).toFixed(0),
												"%)"
											]
										})
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								val: c.val,
								max: total,
								color: c.color,
								t
							})]
						}, c.label))]
					}, title);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 md:grid-cols-3 gap-px",
				style: { background: t.border },
				children: periodData.map((d) => {
					const total = d.total || 1;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							border: `1px solid ${t.border}`,
							background: t.surface
						},
						className: "p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-[9px] tracking-widest uppercase mb-3",
							style: { color: PC[d.period] },
							children: [d.period, " — BMI"]
						}), d.bmi.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 mb-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px] w-20 truncate",
									style: { color: t.dim },
									children: b.st
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex-1 h-0.5 rounded-full overflow-hidden",
									style: { background: t.border },
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										style: {
											width: `${b.n / total * 100}%`,
											background: b.c
										},
										className: "h-full"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px] w-4 text-right",
									style: {
										fontFamily: "'JetBrains Mono',monospace",
										color: t.dim
									},
									children: b.n
								})
							]
						}, b.st))]
					}, `bmi-${d.period}`);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 md:grid-cols-3 gap-px",
				style: { background: t.border },
				children: periodData.map((d) => {
					const total = d.total || 1;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							border: `1px solid ${t.border}`,
							background: t.surface
						},
						className: "p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-[9px] tracking-widest uppercase mb-3",
							style: { color: PC[d.period] },
							children: [d.period, " — HFA"]
						}), d.hfa.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 mb-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px] w-20 truncate",
									style: { color: t.dim },
									children: h.st
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex-1 h-0.5 rounded-full overflow-hidden",
									style: { background: t.border },
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										style: {
											width: `${h.n / total * 100}%`,
											background: h.c
										},
										className: "h-full"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px] w-4 text-right",
									style: {
										fontFamily: "'JetBrains Mono',monospace",
										color: t.dim
									},
									children: h.n
								})
							]
						}, h.st))]
					}, `hfa-${d.period}`);
				})
			})
		]
	});
}
function App() {
	const [themeMode, setThemeMode] = (0, import_react.useState)("dark");
	const t = themeMode === "dark" ? DARK : LIGHT;
	const [view, setView] = (0, import_react.useState)("district");
	const [selectedSchool, setSelectedSchool] = (0, import_react.useState)(null);
	const [students, setStudents] = (0, import_react.useState)(SEED);
	const [schools, setSchools] = (0, import_react.useState)([...INIT_ES, ...INIT_HS]);
	const [editingStudent, setEditingStudent] = (0, import_react.useState)(null);
	const schoolStudents = (0, import_react.useMemo)(() => selectedSchool ? students.filter((s) => s.schoolId === selectedSchool.id) : students, [students, selectedSchool]);
	const handleSelectSchool = (school) => {
		setSelectedSchool(school);
		setView("dashboard");
	};
	const handleEdit = (student) => {
		setEditingStudent(student);
		setView("entry");
	};
	const clearEditing = () => setEditingStudent(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeCtx.Provider, {
		value: t,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-screen min-h-0",
			style: {
				background: t.bg,
				color: t.text,
				fontFamily: "'Outfit',sans-serif"
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sidebar, {
				view,
				setView,
				selectedSchool,
				setSelectedSchool,
				themeMode,
				toggleTheme: () => setThemeMode((m) => m === "dark" ? "light" : "dark"),
				schools
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 overflow-y-auto p-8",
				children: [
					view === "district" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DistrictDashboard, {
						students,
						schools
					}),
					view === "schools" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SchoolsList, {
						students,
						schools,
						setSchools,
						setStudents,
						onSelect: handleSelectSchool
					}),
					view === "dashboard" && selectedSchool && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dashboard, {
						students: schoolStudents,
						school: selectedSchool
					}),
					view === "records" && selectedSchool && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudentRecords, {
						students: schoolStudents,
						setStudents: (ss) => setStudents([...students.filter((s) => s.schoolId !== selectedSchool.id), ...ss]),
						school: selectedSchool,
						setView,
						onEdit: handleEdit
					}),
					view === "entry" && selectedSchool && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataEntry, {
						students,
						setStudents,
						school: selectedSchool,
						setView,
						editingStudent,
						clearEditing
					}),
					view === "table" && selectedSchool && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryTable, {
						students: schoolStudents,
						school: selectedSchool
					}),
					view === "analytics" && selectedSchool && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Analytics, {
						students: schoolStudents,
						school: selectedSchool
					})
				]
			})]
		})
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(App, {});
}
//#endregion
export { Home as component };
