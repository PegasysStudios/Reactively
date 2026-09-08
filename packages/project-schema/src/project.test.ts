import { describe, expect, it } from "vitest";

import { MINIMAL_VALID_PROJECT, createEmptyProject } from "./fixtures.js";
import { ReactivelyProjectSchema, isWritableSchemaVersion, parseProject } from "./project.js";
import { CURRENT_SCHEMA_VERSION } from "./versions.js";

describe("ReactivelyProjectSchema", () => {
  it("accepts a valid minimal project", () => {
    const result = parseProject(MINIMAL_VALID_PROJECT);

    expect(result.success).toBe(true);
    expect(result.data?.initialScreenId).toBe("screen_home");
    expect(Object.keys(result.data?.nodes ?? {})).toHaveLength(3);
  });

  it("accepts a freshly created empty project", () => {
    const project = createEmptyProject({
      projectId: "project_1",
      name: "My App",
      slug: "my-app",
      screenId: "screen_1",
      rootNodeId: "node_1",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    expect(ReactivelyProjectSchema.safeParse(project).success).toBe(true);
  });

  it("rejects a value that is not an object", () => {
    expect(parseProject("not a project").success).toBe(false);
    expect(parseProject(null).success).toBe(false);
    expect(parseProject(42).success).toBe(false);
  });

  it("rejects a project missing required fields", () => {
    const result = parseProject({ schemaVersion: 1, name: "Broken" });

    expect(result.success).toBe(false);
    const issuePaths = result.error?.issues.map((issue) => issue.path.join(".")) ?? [];
    expect(issuePaths).toContain("id");
    expect(issuePaths).toContain("screens");
  });

  it("rejects an empty node identifier", () => {
    const invalid = structuredClone(MINIMAL_VALID_PROJECT);
    invalid.nodes["node_root"] = { ...invalid.nodes["node_root"]!, id: "" };

    expect(parseProject(invalid).success).toBe(false);
  });

  it("rejects a route that is not an application path", () => {
    const invalid = structuredClone(MINIMAL_VALID_PROJECT);
    invalid.screens["screen_home"] = {
      ...invalid.screens["screen_home"]!,
      route: "home",
    };

    expect(parseProject(invalid).success).toBe(false);
  });

  it("rejects unsupported CSS units in layout values", () => {
    const invalid = structuredClone(MINIMAL_VALID_PROJECT) as unknown as {
      nodes: Record<string, { style: Record<string, unknown> }>;
    };
    invalid.nodes["node_cta"]!.style["width"] = "200px";

    expect(parseProject(invalid).success).toBe(false);
  });

  it("rejects a slug that is not kebab-case", () => {
    const invalid = structuredClone(MINIMAL_VALID_PROJECT);
    invalid.settings.slug = "Not A Slug";

    expect(parseProject(invalid).success).toBe(false);
  });
});

describe("schema version guarding", () => {
  it("allows writing documents at or below the current version", () => {
    expect(isWritableSchemaVersion(CURRENT_SCHEMA_VERSION)).toBe(true);
  });

  it("treats documents from a future Reactively as read-only", () => {
    expect(isWritableSchemaVersion(CURRENT_SCHEMA_VERSION + 1)).toBe(false);
  });
});
