import type { Command, HistoryEntry, HistorySnapshot } from "./command.js";

export interface HistoryManagerOptions {
  /**
   * Maximum number of undoable commands retained.
   *
   * Bounded because a long editing session would otherwise pin every intermediate
   * project state in memory. Oldest entries are dropped first.
   */
  readonly limit?: number;
}

const DEFAULT_LIMIT = 200;

/**
 * Undo/redo stack for a single editing session.
 *
 * The manager owns the command stacks but not the state itself: callers pass the current
 * state in and store what comes back. That keeps it usable from a Zustand store, a
 * headless test, or a future cloud worker without any of them owning each other.
 *
 * Deliberately minimal for now — no command coalescing (e.g. merging consecutive
 * keystrokes into one undo step) and no transactions. Both are additive later.
 */
export class HistoryManager<TState> {
  readonly #limit: number;
  #undoStack: HistoryEntry<TState>[] = [];
  #redoStack: HistoryEntry<TState>[] = [];

  constructor(options: HistoryManagerOptions = {}) {
    this.#limit = options.limit ?? DEFAULT_LIMIT;
  }

  /** Runs a command and records it. Executing invalidates the redo stack. */
  execute(state: TState, command: Command<TState>): TState {
    const next = command.execute(state);

    this.#undoStack.push({ command, executedAt: Date.now() });
    if (this.#undoStack.length > this.#limit) {
      this.#undoStack.shift();
    }
    this.#redoStack = [];

    return next;
  }

  /** Reverts the most recent command. Returns the state unchanged when there is none. */
  undo(state: TState): TState {
    const entry = this.#undoStack.pop();
    if (!entry) {
      return state;
    }

    this.#redoStack.push(entry);
    return entry.command.undo(state);
  }

  /** Re-applies the most recently undone command. */
  redo(state: TState): TState {
    const entry = this.#redoStack.pop();
    if (!entry) {
      return state;
    }

    this.#undoStack.push(entry);
    return entry.command.execute(state);
  }

  get canUndo(): boolean {
    return this.#undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.#redoStack.length > 0;
  }

  /** Snapshot for rendering undo/redo menu items. */
  snapshot(): HistorySnapshot {
    return {
      canUndo: this.canUndo,
      canRedo: this.canRedo,
      undoLabel: this.#undoStack.at(-1)?.command.label,
      redoLabel: this.#redoStack.at(-1)?.command.label,
      undoDepth: this.#undoStack.length,
      redoDepth: this.#redoStack.length,
    };
  }

  /** Drops all history. Used when switching projects. */
  clear(): void {
    this.#undoStack = [];
    this.#redoStack = [];
  }
}
