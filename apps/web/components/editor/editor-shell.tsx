"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { projectCommands } from "@/lib/state/project-commands";

import { EditorInspector } from "./editor-inspector";
import { EditorPreview } from "./editor-preview";
import { EditorSidebar } from "./editor-sidebar";
import { EditorToolbar, type EditorSection } from "./editor-toolbar";
import { useLoadProject } from "./use-load-project";

/**
 * The editor workspace: toolbar, left sidebar, centre canvas, right inspector.
 *
 * The canvas is loaded lazily. Today it is a placeholder, but it is where the layout
 * solver, hit testing, selection overlays, snapping and the preview iframe will live —
 * by far the heaviest part of the application. Splitting it now means the surrounding
 * chrome stays interactive while it loads, and the boundary does not have to be
 * retrofitted later.
 */
const EditorCanvas = dynamic(
  () => import("./editor-canvas").then((module) => module.EditorCanvas),
  {
    loading: () => (
      <div className="flex flex-1 items-center justify-center bg-surface-muted text-sm text-foreground-muted">
        Loading canvas…
      </div>
    ),
  },
);

export function EditorShell({ projectId }: { projectId: string }) {
  const loadState = useLoadProject(projectId);
  const [activeSection, setActiveSection] = useState<EditorSection>("design");

  if (loadState.status === "loading") {
    return <EditorMessage>Loading project…</EditorMessage>;
  }

  if (loadState.status === "not-found") {
    return <EditorMessage>Project not found.</EditorMessage>;
  }

  if (loadState.status === "error") {
    return <EditorMessage>{loadState.error}</EditorMessage>;
  }

  const { project } = loadState;
  const initialScreen = project.screens[project.initialScreenId];
  if (!initialScreen) {
    return <EditorMessage>The project does not contain a valid initial screen.</EditorMessage>;
  }

  const rootNode = project.nodes[initialScreen.rootNodeId];
  if (!rootNode) {
    return <EditorMessage>The initial screen does not contain a valid root node.</EditorMessage>;
  }

  return (
    <>
      <EditorToolbar
        projectName={project.name}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onRenameProject={projectCommands.renameProject}
      />

      {activeSection === "design" ? (
        <div className="flex min-h-0 flex-1 bg-editor-workspace">
          <EditorSidebar
            project={project}
            screenId={initialScreen.id}
            screenName={initialScreen.name}
            rootNodeId={rootNode.id}
          />
          <EditorCanvas
            project={project}
            screenId={initialScreen.id}
            screenName={initialScreen.name}
          />
          <EditorInspector />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 bg-editor-workspace">
          <EditorPreview projectId={projectId} />
        </div>
      )}
    </>
  );
}

function EditorMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center bg-surface-muted p-8">
      <p className="rounded-xl border border-border bg-background px-6 py-4 text-sm text-foreground-muted">
        {children}
      </p>
    </main>
  );
}
