import { createFileRoute } from "@tanstack/react-router";
import TeacherApp from "@/teacher-app";

/**
 * The School Portal — one school's own desk for the SBFP (school personnel keep
 * the school profile, encode learner records and send feedback up to the
 * district office). The district console lives at `/`.
 */
export const Route = createFileRoute("/teacher")({
  component: TeacherPortal,
  head: () => ({
    meta: [
      { title: "SBFP School Portal · Urdaneta City Schools" },
      {
        name: "description",
        content:
          "School desk for the School-Based Feeding Program: register your school, keep its SBFP profile, encode learner measurements, and send feedback to the district office.",
      },
    ],
  }),
});

function TeacherPortal() {
  return <TeacherApp />;
}
