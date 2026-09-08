import type { ProjectId, ReactivelyProject } from "@reactively/project-schema";

/**
 * Local project persistence port.
 *
 * Reactively is local-first: a mutation lands in memory immediately, is written to local
 * storage shortly after, and only then syncs to the cloud.
 *
 *     project mutation -> memory -> local persistence -> (later) debounced cloud sync
 *
 * The contract lives here, in a host-independent package, while implementations live with
 * their host: IndexedDB/Dexie in `apps/web`, the filesystem in the future Electron shell,
 * object storage in cloud workers. Nothing in this package knows which one it got.
 */

/** Enough information to list projects without loading their documents. */
export interface StoredProjectSummary {
  readonly id: ProjectId;
  readonly name: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
}

export interface ProjectPersistence {
  /** Returns the stored project, or `null` when it does not exist. */
  loadLocal(projectId: ProjectId): Promise<ReactivelyProject | null>;
  /** Writes the project, overwriting any previous copy. */
  saveLocal(project: ReactivelyProject): Promise<void>;
  deleteLocal(projectId: ProjectId): Promise<void>;
  listLocal(): Promise<readonly StoredProjectSummary[]>;
}
