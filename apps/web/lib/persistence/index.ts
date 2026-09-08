import type { ProjectPersistence } from "@reactively/editor-engine";

import { isLocalPersistenceAvailable } from "./database";
import { createDexieProjectPersistence } from "./dexie-project-persistence";

export { isLocalPersistenceAvailable } from "./database";
export type { StoredProjectRow } from "./database";
export { InvalidPersistedProjectError } from "./dexie-project-persistence";

let instance: ProjectPersistence | null = null;

/**
 * Returns the browser's local project store.
 *
 * Throws when called during server rendering: persistence is a browser capability and
 * silently returning a no-op implementation would hide save failures.
 */
export function getProjectPersistence(): ProjectPersistence {
  if (!isLocalPersistenceAvailable()) {
    throw new Error("Local project persistence requires IndexedDB and is browser-only.");
  }

  instance ??= createDexieProjectPersistence();
  return instance;
}
