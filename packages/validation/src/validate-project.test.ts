import { createMinimalProjectFixture } from "@reactively/project-schema";
import { describe, expect, it } from "vitest";

import { validateProject } from "./validate-project.js";

const codesIn = (project: Parameters<typeof validateProject>[0]) =>
  validateProject(project).issues.map((issue) => issue.code);

describe("validateProject", () => {
  it("accepts the minimal valid project", () => {
    const result = validateProject(createMinimalProjectFixture());

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("detects a missing initial screen", () => {
    const project = createMinimalProjectFixture();
    project.initialScreenId = "screen_does_not_exist";

    const result = validateProject(project);
    expect(result.valid).toBe(false);
    expect(result.errors.map((issue) => issue.code)).toContain("missing-initial-screen");
  });

  it("detects a screen whose root node is missing", () => {
    const project = createMinimalProjectFixture();
    project.screens["screen_home"]!.rootNodeId = "node_missing";

    expect(codesIn(project)).toContain("missing-screen-root");
  });

  it("detects a node whose record key disagrees with its id", () => {
    const project = createMinimalProjectFixture();
    project.nodes["node_title"]!.id = "node_renamed";

    expect(codesIn(project)).toContain("inconsistent-node-id");
  });

  it("detects a node claimed as a child by two parents", () => {
    const project = createMinimalProjectFixture();
    project.nodes["node_cta"] = {
      ...project.nodes["node_cta"]!,
      type: "View",
      children: ["node_title"],
    };

    expect(codesIn(project)).toContain("duplicate-node-reference");
  });

  it("detects a missing parent", () => {
    const project = createMinimalProjectFixture();
    project.nodes["node_title"]!.parentId = "node_ghost";
    project.nodes["node_root"]!.children = ["node_cta"];

    expect(codesIn(project)).toContain("missing-parent");
  });

  it("detects parentId and children disagreeing", () => {
    const project = createMinimalProjectFixture();
    project.nodes["node_root"]!.children = ["node_cta"];

    expect(codesIn(project)).toContain("parent-child-mismatch");
  });

  it("detects a parent cycle", () => {
    const project = createMinimalProjectFixture();
    // node_root -> node_title -> node_root
    project.nodes["node_root"]!.parentId = "node_title";
    project.nodes["node_title"]!.children = ["node_root"];

    const result = validateProject(project);
    expect(result.valid).toBe(false);
    expect(result.errors.map((issue) => issue.code)).toContain("parent-cycle");
  });

  it("detects a node that is its own parent", () => {
    const project = createMinimalProjectFixture();
    project.nodes["node_title"]!.parentId = "node_title";
    project.nodes["node_title"]!.children = ["node_title"];

    expect(codesIn(project)).toContain("parent-cycle");
  });

  it("detects an unknown component type", () => {
    const project = createMinimalProjectFixture();
    project.nodes["node_title"]!.type = "FlatList";

    expect(codesIn(project)).toContain("unknown-component-type");
  });

  it("detects invalid semantic nesting", () => {
    const project = createMinimalProjectFixture();
    // Move the button inside the Text node, which cannot have children.
    project.nodes["node_root"]!.children = ["node_title"];
    project.nodes["node_title"]!.children = ["node_cta"];
    project.nodes["node_cta"]!.parentId = "node_title";

    expect(codesIn(project)).toContain("invalid-nesting");
  });

  it("rejects a Text node as a screen root", () => {
    const project = createMinimalProjectFixture();
    project.screens["screen_home"]!.rootNodeId = "node_title";

    expect(codesIn(project)).toContain("invalid-screen-root");
  });

  it("detects two screens sharing a route", () => {
    const project = createMinimalProjectFixture();
    project.screens["screen_second"] = {
      id: "screen_second",
      name: "Duplicate",
      route: "/",
      rootNodeId: "node_root",
      options: { safeArea: true, scrollBehavior: "none" },
    };

    expect(codesIn(project)).toContain("duplicate-route");
  });

  it("warns about a node that is neither parented nor a screen root", () => {
    const project = createMinimalProjectFixture();
    project.nodes["node_orphan"] = {
      id: "node_orphan",
      type: "View",
      name: "Orphan",
      parentId: null,
      children: [],
      props: {},
      style: {},
      events: [],
    };

    const result = validateProject(project);
    expect(result.warnings.map((issue) => issue.code)).toContain("orphaned-node");
    // Warnings alone do not invalidate a project.
    expect(result.valid).toBe(true);
  });
});
