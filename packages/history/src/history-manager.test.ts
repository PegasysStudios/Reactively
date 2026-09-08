import { describe, expect, it } from "vitest";

import { createCommand } from "./command.js";
import { HistoryManager } from "./history-manager.js";

interface Counter {
  readonly value: number;
}

const increment = (by: number) =>
  createCommand<Counter>({
    type: "increment",
    label: `Add ${by}`,
    execute: (state) => ({ value: state.value + by }),
    undo: (state) => ({ value: state.value - by }),
  });

describe("HistoryManager", () => {
  it("executes commands and reports undo availability", () => {
    const history = new HistoryManager<Counter>();
    let state: Counter = { value: 0 };

    expect(history.canUndo).toBe(false);
    state = history.execute(state, increment(5));

    expect(state.value).toBe(5);
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
  });

  it("undoes and redoes in order", () => {
    const history = new HistoryManager<Counter>();
    let state: Counter = { value: 0 };

    state = history.execute(state, increment(5));
    state = history.execute(state, increment(3));
    expect(state.value).toBe(8);

    state = history.undo(state);
    expect(state.value).toBe(5);
    state = history.undo(state);
    expect(state.value).toBe(0);
    expect(history.canUndo).toBe(false);

    state = history.redo(state);
    expect(state.value).toBe(5);
    state = history.redo(state);
    expect(state.value).toBe(8);
  });

  it("is a no-op when there is nothing to undo or redo", () => {
    const history = new HistoryManager<Counter>();
    const state: Counter = { value: 7 };

    expect(history.undo(state)).toBe(state);
    expect(history.redo(state)).toBe(state);
  });

  it("clears the redo stack once a new command is executed", () => {
    const history = new HistoryManager<Counter>();
    let state: Counter = { value: 0 };

    state = history.execute(state, increment(1));
    state = history.undo(state);
    expect(history.canRedo).toBe(true);

    state = history.execute(state, increment(10));
    expect(history.canRedo).toBe(false);
    expect(state.value).toBe(10);
  });

  it("drops the oldest entries beyond the configured limit", () => {
    const history = new HistoryManager<Counter>({ limit: 2 });
    let state: Counter = { value: 0 };

    for (let index = 0; index < 3; index += 1) {
      state = history.execute(state, increment(1));
    }

    expect(state.value).toBe(3);
    expect(history.snapshot().undoDepth).toBe(2);
  });

  it("exposes labels for undo/redo affordances", () => {
    const history = new HistoryManager<Counter>();
    let state: Counter = { value: 0 };

    state = history.execute(state, increment(4));
    expect(history.snapshot().undoLabel).toBe("Add 4");

    history.undo(state);
    expect(history.snapshot().redoLabel).toBe("Add 4");
  });

  it("forgets everything on clear", () => {
    const history = new HistoryManager<Counter>();
    history.execute({ value: 0 }, increment(1));

    history.clear();
    expect(history.snapshot()).toMatchObject({ canUndo: false, canRedo: false });
  });
});
