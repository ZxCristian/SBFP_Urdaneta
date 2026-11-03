import { createFileRoute } from "@tanstack/react-router";
import TeacherApp from "@/teacher-app";

/**
 * `?reset=<token>` is the address the School Portal password-reset email
 * carries. Keeping it on `/teacher` means a school account gets its own warm
 * portal theme instead of the Division Office's console sign-in page.
 */
export interface TeacherSearch {
  reset?: string;
}

export const Route = createFileRoute("/teacher")({
  component: TeacherPortal,
  validateSearch: (search: Record<string, unknown>): TeacherSearch =>
    typeof search.reset === "string" && search.reset ? { reset: search.reset } : {},
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
  const { reset } = Route.useSearch();
  return <TeacherApp resetToken={reset} />;
}
