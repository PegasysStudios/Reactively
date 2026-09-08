import { createProject, type StoredProjectSummary } from "@reactively/editor-engine";
import type { ProjectId, ReactivelyProject } from "@reactively/project-schema";

import { getProjectPersistence } from "@/lib/persistence";
import { useProjectStore } from "@/lib/state/project-store";

/** Creates a valid project, places it in memory, then commits it to IndexedDB. */
export async function createLocalProject(name: string): Promise<ReactivelyProject> {
  const project = createProject({ name });
  const store = useProjectStore.getState();

  store.createProject(project);
  await saveCurrentProjectLocally();

  return project;
}

/** Persists the current Zustand document through the browser persistence boundary. */
export async function saveCurrentProjectLocally(): Promise<ReactivelyProject> {
  const project = useProjectStore.getState().project;
  if (!project) {
    throw new Error("There is no current project to save.");
  }

  await getProjectPersistence().saveLocal(project);

  // A newer immutable document may have replaced this snapshot while IndexedDB was
  // writing. Only clear dirty state when the saved snapshot is still current.
  if (useProjectStore.getState().project === project) {
    useProjectStore.getState().markSaved();
  }

  return project;
}

/** Loads a project from IndexedDB and makes it the current Zustand document. */
export async function loadLocalProject(projectId: ProjectId): Promise<ReactivelyProject | null> {
  useProjectStore.getState().clearProject();

  const project = await getProjectPersistence().loadLocal(projectId);
  if (project) {
    useProjectStore.getState().loadProject(project);
  }

  return project;
}

/** Lists locally persisted projects without hydrating their complete documents. */
export function listLocalProjects(): Promise<readonly StoredProjectSummary[]> {
  return getProjectPersistence().listLocal();
}
