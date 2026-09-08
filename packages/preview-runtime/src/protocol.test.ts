import { describe, expect, it } from "vitest";

import { createEnvelope, isPreviewEnvelope } from "./protocol.js";
import { buildPreviewPath, isPreviewInteractive } from "./session.js";

describe("preview message envelope", () => {
  it("accepts its own messages", () => {
    const envelope = createEnvelope("project_1", { type: "preview:reload" });

    expect(isPreviewEnvelope(envelope, "project_1")).toBe(true);
  });

  it("rejects messages from another project or another sender", () => {
    const envelope = createEnvelope("project_1", { type: "preview:reload" });

    expect(isPreviewEnvelope(envelope, "project_2")).toBe(false);
    expect(isPreviewEnvelope({ source: "some-extension" }, "project_1")).toBe(false);
  });

  it("survives arbitrary untrusted values", () => {
    for (const value of [null, undefined, 42, "reactively-preview", []]) {
      expect(isPreviewEnvelope(value, "project_1")).toBe(false);
    }
  });
});

describe("buildPreviewPath", () => {
  it("builds the isolated preview route", () => {
    expect(buildPreviewPath("project_1")).toBe("/preview/project_1");
    expect(buildPreviewPath("project_1", "screen_home")).toBe(
      "/preview/project_1?screen=screen_home",
    );
  });

  it("escapes identifiers", () => {
    expect(buildPreviewPath("a/b")).toBe("/preview/a%2Fb");
  });
});

describe("isPreviewInteractive", () => {
  it("is true only once the preview has something rendered", () => {
    expect(isPreviewInteractive("ready")).toBe(true);
    expect(isPreviewInteractive("refreshing")).toBe(true);
    expect(isPreviewInteractive("preparing")).toBe(false);
    expect(isPreviewInteractive("failed")).toBe(false);
  });
});
