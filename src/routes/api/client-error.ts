/**
 * Browser-side crash reports.
 *
 * The router's error boundary (`AppErrorComponent`) posts here so a client
 * crash is visible in the hosting logs (and the optional `ERROR_WEBHOOK_URL`),
 * instead of being confined to one visitor's console. This endpoint stores
 * nothing and touches no database; it only formats and forwards the report.
 */
import { createFileRoute } from "@tanstack/react-router";
import { reportServerError } from "@/lib/report-error.server";

const MAX_BODY_BYTES = 8_000;

export const Route = createFileRoute("/api/client-error")({
  server: {
    handlers: {
      POST: async ({ request }) => handleClientError(request),
    },
  },
});

async function handleClientError(request: Request): Promise<Response> {
  const body = await request.text().catch(() => "");
  if (!body || body.length > MAX_BODY_BYTES) {
    return new Response(null, { status: 204 });
  }

  let report: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(body) as unknown;
    if (parsed && typeof parsed === "object") report = parsed as Record<string, unknown>;
  } catch {
    report = { message: body.slice(0, 500) };
  }

  const message = typeof report.message === "string" ? report.message : "Client error";
  const error = new Error(message.slice(0, 500));
  if (typeof report.stack === "string") error.stack = report.stack.slice(0, 2000);

  reportServerError("client", error, {
    url: typeof report.url === "string" ? report.url.slice(0, 500) : undefined,
    source: "AppErrorComponent",
  });

  return new Response(null, { status: 204 });
}
