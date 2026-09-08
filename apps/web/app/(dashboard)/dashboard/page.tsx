import type { Metadata } from "next";

import { ProjectsDashboard } from "@/components/dashboard/projects-dashboard";

export const metadata: Metadata = {
  title: "Projects",
};

/**
 * Local-first project management surface.
 */
export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight">Reactively Projects</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Projects are stored locally in your browser. Cloud sync arrives with accounts.
      </p>

      <ProjectsDashboard />
    </div>
  );
}
