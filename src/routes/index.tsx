import { createFileRoute } from "@tanstack/react-router";
import SbfpApp from "@/sbfp-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <SbfpApp />;
}
