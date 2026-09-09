"use client";

import type { ReactivelyProject } from "@reactively/project-schema";
import { useEffect, useState } from "react";

import { loadLocalProject } from "@/lib/projects/local-project-lifecycle";
import { useEditorStore } from "@/lib/state/editor-store";
import { useProjectStore } from "@/lib/state/project-store";

type ProjectLoadState =
  | { status: "loading"; project: null; error: null }
  | { status: "ready"; project: ReactivelyProject; error: null }
  | { status: "not-found"; project: null; error: null }
  | { status: "error"; project: null; error: string };

export function useLoadProject(projectId: string): ProjectLoadState {
  const project = useProjectStore((state) => state.project);
  const [status, setStatus] = useState<ProjectLoadState["status"]>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    useEditorStore.getState().reset();
    setStatus("loading");
    setError(null);

    void loadLocalProject(projectId)
      .then((loadedProject) => {
        if (isActive) {
          if (loadedProject) {
            useEditorStore.getState().openScreen(loadedProject.initialScreenId);
          }
          setStatus(loadedProject ? "ready" : "not-found");
        }
      })
      .catch((cause: unknown) => {
        if (isActive) {
          setError(cause instanceof Error ? cause.message : "The project could not be opened.");
          setStatus("error");
        }
      });

    return () => {
      isActive = false;
    };
  }, [projectId]);

  if (status === "ready" && project?.id === projectId) {
    return { status, project, error: null };
  }

  if (status === "error") {
    return { status, project: null, error: error ?? "The project could not be opened." };
  }

  return { status: status === "ready" ? "loading" : status, project: null, error: null };
}
