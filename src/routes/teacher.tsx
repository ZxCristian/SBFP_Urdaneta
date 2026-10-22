import { createFileRoute } from "@tanstack/react-router";
import TeacherApp from "@/teacher-app";

/**
 * The teacher website — one school's own desk for the SBFP (a teacher registers
 * her school, keeps its profile, encodes learner records and sends feedback up
 * to the district office). The district console lives at `/`.
 */
export const Route = createFileRoute("/teacher")({
  component: TeacherPortal,
  head: () => ({
    meta: [
      { title: "SBFP Teacher Portal · Urdaneta City Schools" },
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
