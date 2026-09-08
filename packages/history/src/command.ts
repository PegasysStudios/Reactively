/**
 * Command contract.
 *
 * Every persistent project mutation flows through a command so that undo/redo, autosave,
 * audit history and future collaboration all hang off one pipeline instead of being
 * retrofitted onto scattered setState calls. See docs/ARCHITECTURE.md.
 *
 * Commands are pure state transitions rather than mutators: `execute` returns the next
 * state and `undo` returns the previous one. That makes them trivially testable, keeps
 * Zustand's reference-equality change detection working, and means an undo entry cannot
 * be corrupted by a later mutation of shared objects.
 */
export interface Command<TState> {
  /** Stable machine-readable discriminator, e.g. `addNode`. */
  readonly type: string;
  /** Human-readable label for the history panel, e.g. "Add Button". */
  readonly label: string;
  execute(state: TState): TState;
  undo(state: TState): TState;
}

/** A command paired with when it ran. */
export interface HistoryEntry<TState> {
  readonly command: Command<TState>;
  readonly executedAt: number;
}

/** Read-only view of the history stack, for rendering undo/redo affordances. */
export interface HistorySnapshot {
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly undoLabel: string | undefined;
  readonly redoLabel: string | undefined;
  readonly undoDepth: number;
  readonly redoDepth: number;
}

/** Builds a command from plain functions, for call sites that do not need a class. */
export function createCommand<TState>(definition: Command<TState>): Command<TState> {
  return definition;
}
