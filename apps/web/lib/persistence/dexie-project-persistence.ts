import type { ProjectPersistence, StoredProjectSummary } from "@reactively/editor-engine";
import { parseProject, type ProjectId, type ReactivelyProject } from "@reactively/project-schema";

import { getDatabase, type ReactivelyDatabase } from "./database";

export class InvalidPersistedProjectError extends Error {
  constructor(projectId: ProjectId) {
    super(`Stored project "${projectId}" does not match the current schema and cannot be opened.`);
    this.name = "InvalidPersistedProjectError";
  }
}

/**
 * Browser implementation of the {@link ProjectPersistence} port.
 *
 * The port itself lives in @reactively/editor-engine so the editor never learns which
 * storage it got: IndexedDB here, the filesystem in the future Electron shell, object
 * storage in a cloud worker.
 */
export function createDexieProjectPersistence(
  database: ReactivelyDatabase = getDatabase(),
): ProjectPersistence {
  return {
    async loadLocal(projectId: ProjectId): Promise<ReactivelyProject | null> {
      const row = await database.projects.get(projectId);
      if (!row) {
        return null;
      }

      // Stored documents are untrusted input: they may have been written by an older
      // build, hand-edited through devtools, or corrupted mid-write. Parse, never cast.
      const parsed = parseProject(row.document);
      if (!parsed.success) {
        throw new InvalidPersistedProjectError(projectId);
      }

      return parsed.data;
    },

    async saveLocal(project: ReactivelyProject): Promise<void> {
      const parsed = parseProject(project);
      if (!parsed.success) {
        throw new InvalidPersistedProjectError(project.id);
      }

      await database.projects.put({
        id: parsed.data.id,
        name: parsed.data.name,
        updatedAt: parsed.data.metadata.updatedAt,
        schemaVersion: parsed.data.schemaVersion,
        document: parsed.data,
      });
    },

    async deleteLocal(projectId: ProjectId): Promise<void> {
      await database.projects.delete(projectId);
    },

    async listLocal(): Promise<readonly StoredProjectSummary[]> {
      const rows = await database.projects.orderBy("updatedAt").reverse().toArray();

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        updatedAt: row.updatedAt,
        schemaVersion: row.schemaVersion,
      }));
    },
  };
}
