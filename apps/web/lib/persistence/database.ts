import type { ReactivelyProject } from "@reactively/project-schema";
import Dexie, { type EntityTable } from "dexie";

/**
 * Local IndexedDB schema.
 *
 * Reactively is local-first: an edit lands in memory immediately, is written here shortly
 * after, and only then syncs to the cloud. That ordering means a dropped connection or a
 * closed tab never costs work.
 *
 *     project mutation -> memory -> IndexedDB -> (later) debounced cloud sync
 */

/**
 * A stored project row.
 *
 * `name`, `updatedAt` and `schemaVersion` are duplicated out of the document so the
 * dashboard can list projects without deserializing every document. They are indexed;
 * `document` is not.
 */
export interface StoredProjectRow {
  id: string;
  name: string;
  updatedAt: string;
  schemaVersion: number;
  document: ReactivelyProject;
}

export type ReactivelyDatabase = Dexie & {
  projects: EntityTable<StoredProjectRow, "id">;
};

/** Bumped whenever the table/index layout changes; Dexie runs the upgrade path. */
const DATABASE_VERSION = 1;

let database: ReactivelyDatabase | null = null;

export function createDatabase(name = "reactively"): ReactivelyDatabase {
  const instance = new Dexie(name) as ReactivelyDatabase;
  instance.version(DATABASE_VERSION).stores({
    projects: "id, name, updatedAt",
  });

  return instance;
}

/**
 * Opens the database lazily.
 *
 * IndexedDB does not exist during server rendering, so the connection is created on first
 * use from the browser rather than at module load.
 */
export function getDatabase(): ReactivelyDatabase {
  if (database) {
    return database;
  }

  database = createDatabase();
  return database;
}

/** True when local persistence is available. False during SSR and in older browsers. */
export function isLocalPersistenceAvailable(): boolean {
  return typeof globalThis.indexedDB !== "undefined";
}
