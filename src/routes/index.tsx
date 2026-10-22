/**
 * The district console — `/`.
 *
 * The Division Office's own product, and the only page that issues Teacher
 * Portal accounts, so it is closed: a signed-out visitor is sent to the sign-in
 * page, and a teacher is sent to her own site instead of being shown a console
 * she has no account for.
 *
 * The session is reported as `loading` until it has actually resolved, so a
 * reload never bounces a signed-in administrator to the sign-in page.
 */
import { createFileRoute, Navigate } from "@tanstack/react-router";
import SbfpApp from "@/sbfp-app";
import { useAccess } from "@/lib/use-access";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const access = useAccess();

  if (access.status === "loading") return <ConsoleSplash />;
  if (access.status === "admin") return <SbfpApp />;
  if (access.status === "teacher") return <Navigate to="/teacher" />;
  return <Navigate to="/login" />;
}

function ConsoleSplash() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080808",
        color: "#6a6a6a",
        fontFamily: "'Outfit', system-ui, sans-serif",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div className="text-center">
        <img
          src="/school-health-wheel.svg"
          alt=""
          width={40}
          height={40}
          style={{ margin: "0 auto", opacity: 0.45 }}
        />
        <p style={{ fontSize: 13, marginTop: 14 }}>Opening the Division Console…</p>
      </div>
    </div>
  );
}
