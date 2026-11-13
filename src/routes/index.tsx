import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/fs/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "FireScope — 3D Global Fire Activity" },
    { name: "description", content: "Explore satellite-detected fire activity on an interactive day/night 3D Earth." },
    { property: "og:title", content: "FireScope — 3D Global Fire Activity" },
    { property: "og:description", content: "Explore satellite-detected fire activity on an interactive day/night 3D Earth." },
  ] }),
  component: Dashboard,
});
