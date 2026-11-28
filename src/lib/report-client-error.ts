/**
 * Fire-and-forget browser crash beacon.
 *
 * `keepalive` lets the request outlive the error screen (a reload or a
 * redirect does not cancel it). Reporting is silent: a failed beacon must never
 * become a second visible error.
 */
export function reportClientError(error: unknown): void {
  if (typeof window === "undefined") return;

  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Client error";
  const stack = error instanceof Error ? error.stack : undefined;

  try {
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        message,
        stack,
        url: window.location.href,
      }),
    }).catch(() => undefined);
  } catch {
    /* reporting must never throw */
  }
}
