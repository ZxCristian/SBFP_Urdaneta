/**
 * The SBFP domain layer, shared by the district console (`/`) and the teacher
 * website (`/teacher`).
 *
 * Both sites work on the same things — the 58 Urdaneta City schools, the SBFP
 * form header, learner records with WHO 2007 BMI/HFA classification, and the
 * feedback a school sends up — so the definitions stay in one place
 * (`src/sbfp-app.tsx`, which the district console grew out of) and are
 * re-exported here rather than copied. Typecheck keeps the two sites in step:
 * changing a `Student` field, a school name, or the BMI maths breaks both.
 */
export {
  INIT_ES,
  INIT_HS,
  PERIODS,
  SPED_SCHOOL_NAME,
  BMI_STATUSES,
  HFA_STATUSES,
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  EMPTY_FORM_DETAILS,
  FORM_DETAIL_FIELDS,
  EMPTY_STUDENT,
  getGrades,
  studentKey,
  uniqueCount,
  uniqueStudents,
  sortRecords,
  classifyBeneficiary,
  classifyBMI,
  classifyHFA,
  calcBMI,
  computeAge,
  formatDateMDY,
  shortDate,
  ageLabel,
} from "@/sbfp-app";

export type {
  BMIStatus,
  FeedbackCategory,
  FeedbackStatus,
  GradeLevel,
  HFAStatus,
  Period,
  School,
  SchoolFeedback,
  SchoolFormDetails,
  SchoolType,
  Sex,
  Student,
  YesNo,
} from "@/sbfp-app";
