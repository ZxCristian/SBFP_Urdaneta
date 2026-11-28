/**
 * The Division Office console — `/Admin`.
 *
 * The Division Office's own product, and the only page that issues School
 * Portal accounts, so it is closed: a signed-out visitor is sent to the sign-in
 * form, and a teacher is sent to the main School Portal instead of being shown
 * a console she has no account for.
 *
 * The sign-in form is the FIRST paint for a signed-out visitor. A signed-in
 * administrator used to get that same form for the moment before the client
 * store resolved, because the session cookie is HttpOnly and the first render
 * could not see it. The loader asks the server for a session presence hint, so
 * an administrator gets a neutral "opening the console" shell instead — same
 * first-paint speed for the public page, without showing the wrong page to the
 * person already signed in.
 */
import { useEffect } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import SbfpApp from "@/sbfp-app";
import { fetchSessionPresence } from "@/lib/sbfp-api";
import { useAccess } from "@/lib/use-access";
import { prewarmExcelExport } from "@/lib/prewarm-export";
import { LoginScreen } from "./login";

export const Route = createFileRoute("/Admin")({
  // Server-side on the first request; one small call on a client navigation.
  loader: () => fetchSessionPresence(),
  component: Admin,
  head: () => ({
    meta: [
      { title: "SBFP Division Console · Urdaneta City Schools" },
      {
        name: "description",
        content:
          "Division Office desk for the School-Based Feeding Program: the master list, Summary Tables, analytics, school accounts and feedback.",
      },
    ],
  }),
});

function Admin() {
  const { signedIn } = Route.useLoaderData();
  const access = useAccess();

  if (access.status === "admin") return <WarmedSbfpApp />;
  if (access.status === "teacher") return <Navigate to="/" />;
  if (access.status === "loading" && signedIn) return <ConsoleBoot />;
  return <LoginScreen access={access} />;
}

/** The console, with the Excel-export chunk warmed for the first export. */
function WarmedSbfpApp() {
  useEffect(prewarmExcelExport, []);
  return <SbfpApp />;
}

/**
 * Shown only while a known session is still resolving. Deliberately quiet: the
 * console replaces it in well under a second, and it must not look like an
 * error or a second login screen.
 */
function ConsoleBoot() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        background: "#080808",
        color: "#e2e2e2",
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      <img src="/school-health-wheel.svg" alt="" width={40} height={40} />
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: "2px solid #2a2a2a",
          borderTopColor: "#00ff87",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ fontSize: 13, color: "#b3b3b3", margin: 0 }}>
        Opening the Division Console…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { main > div { animation: none !important; } }`}</style>
    </main>
  );
}
