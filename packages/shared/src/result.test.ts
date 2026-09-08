import { describe, expect, it } from "vitest";

import { createSequentialIdFactory } from "./ids.js";
import { err, isErr, isOk, ok, unwrap } from "./result.js";

describe("Result", () => {
  it("narrows success values", () => {
    const result = ok(42);
    expect(isOk(result)).toBe(true);
    expect(unwrap(result)).toBe(42);
  });

  it("narrows failure values", () => {
    const result = err("boom");
    expect(isErr(result)).toBe(true);
    expect(() => unwrap(result)).toThrow(/Attempted to unwrap/);
  });
});

describe("createSequentialIdFactory", () => {
  it("produces stable, ordered identifiers", () => {
    const nextId = createSequentialIdFactory("node");
    expect([nextId(), nextId(), nextId()]).toEqual(["node_1", "node_2", "node_3"]);
  });
});
