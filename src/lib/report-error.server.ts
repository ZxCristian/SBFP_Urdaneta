/**
 * Structured error reporting for the server (and for client crashes forwarded
 * through `/api/client-error`).
 *
 * A production 500 used to reach the caller as a bare `HTTPError` with no
 * trace anywhere the operator could see. This writes one JSON line per failure
 * — searchable in the hosting logs — and, when `ERROR_WEBHOOK_URL` is set,
 * posts the same summary to a Slack/Discord-style webhook.
 *
 * Reporting is best effort: it must never turn one failure into two, so every
 * network and formatting step is guarded.
 */

type ErrorLike = {
  name?: string;
  message?: string;
  stack?: string;
};

function describe(err: unknown): ErrorLike {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message || "(no message)",
      // A few frames are enough to locate the failure; full stacks can be
      // hundreds of lines and are truncated by most log drains anyway.
      stack: err.stack?.split("\n").slice(0, 8).join("\n"),
    };
  }
  if (typeof err === "string") return { message: err };
  try {
    return { message: JSON.stringify(err) };
  } catch {
    return { message: String(err) };
  }
}

export interface ServerErrorReport extends ErrorLike {
  scope: string;
  at: string;
  [key: string]: unknown;
}

/** Log one failure and (optionally) forward it to `ERROR_WEBHOOK_URL`. */
export function reportServerError(
  scope: string,
  err: unknown,
  extra: Record<string, unknown> = {},
): void {
  const report: ServerErrorReport = {
    scope,
    at: new Date().toISOString(),
    ...describe(err),
    ...extra,
  };

  try {
    console.error("[error]", JSON.stringify(report));
  } catch {
    console.error("[error]", scope, err);
  }

  const url = process.env.ERROR_WEBHOOK_URL?.trim();
  if (!url) return;
  // Slack incoming webhooks require `text`; Discord uses `content`. Sending
  // both keeps one configuration working for either without a second setting.
  const summary = `[SBFP] ${scope}: ${report.message ?? "unknown error"}`;
  void fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: summary, content: summary, report }),
    signal: AbortSignal.timeout(4000),
  }).catch((hookErr) => {
    console.error("[error] webhook delivery failed:", describe(hookErr).message);
  });
}
