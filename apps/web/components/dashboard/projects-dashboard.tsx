"use client";

import type { StoredProjectSummary } from "@reactively/editor-engine";
import { FolderOpen, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { createLocalProject, listLocalProjects } from "@/lib/projects/local-project-lifecycle";

export function ProjectsDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<readonly StoredProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    void listLocalProjects()
      .then((localProjects) => {
        if (isActive) {
          setProjects(localProjects);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (isActive) {
          setError(cause instanceof Error ? cause.message : "Local projects could not be loaded.");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function handleCreateProject() {
    setIsCreating(true);
    setError(null);

    try {
      const project = await createLocalProject("Untitled Project");
      router.push(`/editor/${project.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The project could not be created.");
      setIsCreating(false);
    }
  }

  return (
    <section className="mt-8" aria-labelledby="local-projects-heading">
      <div className="flex items-center justify-between gap-4">
        <h2 id="local-projects-heading" className="text-sm font-semibold">
          Projects
        </h2>
        <Button onClick={handleCreateProject} disabled={isCreating}>
          <Plus className="size-4" aria-hidden />
          {isCreating ? "Creating…" : "New Project"}
        </Button>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-lg border border-danger/30 p-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-6 text-sm text-foreground-muted">Loading local projects…</p>
      ) : projects.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm font-medium">No projects yet</p>
          <p className="mt-2 text-sm text-foreground-muted">
            Create a blank project to open the editor.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/editor/${project.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-muted"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-surface-muted text-primary">
                  <FolderOpen className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 truncate text-sm font-medium">{project.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
