import type { Command } from "@reactively/history";
import type { ReactivelyProject } from "@reactively/project-schema";

/**
 * Bridges pure mutations onto the history stack.
 *
 * Undo is snapshot-based: the command captures the project before and after the
 * mutation. Project documents are plain JSON of modest size and mutations are already
 * structurally shared (unchanged nodes keep their identity), so snapshots cost little and
 * are impossible to get wrong. If large projects ever make that untrue, individual
 * inverse-operation commands can replace snapshots behind this same interface.
 */
export function createProjectCommand(options: {
  type: string;
  label: string;
  before: ReactivelyProject;
  after: ReactivelyProject;
}): Command<ReactivelyProject> {
  const { type, label, before, after } = options;

  return {
    type,
    label,
    execute: () => after,
    undo: () => before,
  };
}
