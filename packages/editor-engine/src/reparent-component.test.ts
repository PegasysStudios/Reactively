import {
  ReactivelyProjectSchema,
  createMinimalProjectFixture,
  points,
  type ComponentNode,
  type ReactivelyProject,
} from "@reactively/project-schema";
import { deepClone, unwrap } from "@reactively/shared";
import { describe, expect, it } from "vitest";

import type { EditorCommandContext } from "./context.js";
import { reparentComponent } from "./operations.js";
import { getValidParentCandidates } from "./parent-candidates.js";

const context: EditorCommandContext = {
  createId: () => "node_unused",
  now: () => "2026-09-09T12:00:00.000Z",
  canAcceptChild: (parentType, childType) =>
    parentType === "View" && ["View", "Text", "Button"].includes(childType),
  canBeScreenRoot: (type) => type === "View",
  supportsContainerLayout: (type) => type === "View",
  defaultsFor: () => undefined,
};

function node(
  id: string,
  type: "View" | "Text" | "Button",
  parentId: string | null,
  children: string[] = [],
  overrides: Partial<ComponentNode> = {},
): ComponentNode {
  return {
    id,
    type,
    name: type,
    parentId,
    children,
    props: type === "Text" ? { content: id } : type === "Button" ? { label: id } : {},
    style: {},
    events: [],
    ...overrides,
  };
}

function createHierarchyProject(): ReactivelyProject {
  const project = createMinimalProjectFixture();
  project.nodes = {
    node_root: node("node_root", "View", null, ["view_a", "view_b", "loose_text", "loose_button"], {
      name: "Screen Root",
    }),
    view_a: node("view_a", "View", "node_root", ["nested_view"]),
    nested_view: node("nested_view", "View", "view_a", ["nested_text", "nested_button"]),
    nested_text: node("nested_text", "Text", "nested_view", [], {
      props: { content: "Nested content", testMarker: 42 },
      style: {
        position: "absolute",
        left: points(12),
        top: points(24),
        width: points(160),
        flexGrow: 1,
        margin: { top: 8 },
      },
    }),
    nested_button: node("nested_button", "Button", "nested_view"),
    view_b: node("view_b", "View", "node_root", ["existing_text", "existing_button"]),
    existing_text: node("existing_text", "Text", "view_b"),
    existing_button: node("existing_button", "Button", "view_b"),
    loose_text: node("loose_text", "Text", "node_root"),
    loose_button: node("loose_button", "Button", "node_root"),
  };
  return project;
}

function move(project: ReactivelyProject, nodeId: string, newParentId: string): ReactivelyProject {
  return unwrap(
    reparentComponent(project, context, {
      screenId: "screen_home",
      nodeId,
      newParentId,
    }),
  );
}

describe("reparentComponent hierarchy changes", () => {
  it.each([
    ["loose_text", "Text"],
    ["loose_button", "Button"],
    ["view_a", "View"],
  ])("moves a root-level %s into a View", (nodeId) => {
    const project = createHierarchyProject();
    const next = move(project, nodeId, "view_b");

    expect(next.nodes[nodeId]?.parentId).toBe("view_b");
    expect(next.nodes.node_root?.children).not.toContain(nodeId);
    expect(next.nodes.view_b?.children.at(-1)).toBe(nodeId);
    expect(next.nodes.view_b?.children.filter((childId) => childId === nodeId)).toHaveLength(1);
  });

  it("moves a component from a View back to the Screen root", () => {
    const next = move(createHierarchyProject(), "nested_button", "node_root");

    expect(next.nodes.nested_view?.children).toEqual(["nested_text"]);
    expect(next.nodes.node_root?.children).toEqual([
      "view_a",
      "view_b",
      "loose_text",
      "loose_button",
      "nested_button",
    ]);
    expect(next.nodes.nested_button?.parentId).toBe("node_root");
  });

  it("moves a component and a nested View between sibling Views", () => {
    const withTextMoved = move(createHierarchyProject(), "nested_text", "view_b");
    const withViewMoved = move(withTextMoved, "nested_view", "view_b");

    expect(withViewMoved.nodes.view_a?.children).toEqual([]);
    expect(withViewMoved.nodes.view_b?.children).toEqual([
      "existing_text",
      "existing_button",
      "nested_text",
      "nested_view",
    ]);
    expect(withViewMoved.nodes.nested_view?.children).toEqual(["nested_button"]);
  });

  it("preserves the moved node, descendant identities, props, styles, and child order", () => {
    const project = createHierarchyProject();
    const beforeSubtree = deepClone(project.nodes.nested_view);
    const beforeText = deepClone(project.nodes.nested_text);
    const beforeButton = deepClone(project.nodes.nested_button);
    const next = move(project, "nested_view", "view_b");

    expect(next.nodes.nested_view).toEqual({ ...beforeSubtree, parentId: "view_b" });
    expect(next.nodes.nested_text).toEqual(beforeText);
    expect(next.nodes.nested_button).toEqual(beforeButton);
    expect(next.nodes.nested_view?.children).toEqual(["nested_text", "nested_button"]);
    expect(next.nodes.nested_text?.id).toBe("nested_text");
    expect(next.nodes.nested_text?.style).toMatchObject({
      position: "absolute",
      left: points(12),
      top: points(24),
      flexGrow: 1,
    });
  });

  it("keeps unrelated order and appends exactly once without mutating the input", () => {
    const project = createHierarchyProject();
    const original = deepClone(project);
    const next = move(project, "loose_text", "view_b");

    expect(next.nodes.node_root?.children).toEqual(["view_a", "view_b", "loose_button"]);
    expect(next.nodes.view_b?.children).toEqual(["existing_text", "existing_button", "loose_text"]);
    expect(project).toEqual(original);
  });

  it("returns the original project for the current parent without reordering or touching metadata", () => {
    const project = createHierarchyProject();
    const result = move(project, "existing_text", "view_b");

    expect(result).toBe(project);
    expect(result.nodes.view_b?.children).toEqual(["existing_text", "existing_button"]);
    expect(result.metadata.updatedAt).toBe(project.metadata.updatedAt);
  });

  it("produces a schema-valid project that survives JSON serialization", () => {
    const next = move(createHierarchyProject(), "nested_view", "view_b");
    const parsed = ReactivelyProjectSchema.parse(JSON.parse(JSON.stringify(next)));

    expect(parsed).toEqual(next);
    expect(parsed.nodes.nested_view?.children).toEqual(["nested_text", "nested_button"]);
    expect(parsed.nodes.nested_text?.parentId).toBe("nested_view");
  });
});

describe("reparentComponent rejection", () => {
  it("rejects self-parenting and direct or deep descendant cycles", () => {
    const project = createHierarchyProject();

    expect(
      reparentComponent(project, context, {
        screenId: "screen_home",
        nodeId: "view_a",
        newParentId: "view_a",
      }),
    ).toMatchObject({ ok: false, error: { code: "would-create-cycle" } });
    expect(
      reparentComponent(project, context, {
        screenId: "screen_home",
        nodeId: "view_a",
        newParentId: "nested_view",
      }),
    ).toMatchObject({ ok: false, error: { code: "would-create-cycle" } });
    expect(
      reparentComponent(project, context, {
        screenId: "screen_home",
        nodeId: "view_a",
        newParentId: "nested_text",
      }),
    ).toMatchObject({ ok: false, error: { code: "would-create-cycle" } });
  });

  it.each(["nested_text", "nested_button"])("rejects leaf parent %s", (newParentId) => {
    const result = reparentComponent(createHierarchyProject(), context, {
      screenId: "screen_home",
      nodeId: "loose_text",
      newParentId,
    });

    expect(result).toMatchObject({ ok: false, error: { code: "invalid-nesting" } });
  });

  it("fails safely for missing screens, components, and parents", () => {
    const project = createHierarchyProject();

    expect(
      reparentComponent(project, context, {
        screenId: "screen_missing",
        nodeId: "loose_text",
        newParentId: "view_b",
      }),
    ).toMatchObject({ ok: false, error: { code: "screen-not-found" } });
    expect(
      reparentComponent(project, context, {
        screenId: "screen_home",
        nodeId: "node_missing",
        newParentId: "view_b",
      }),
    ).toMatchObject({ ok: false, error: { code: "node-not-found" } });
    expect(
      reparentComponent(project, context, {
        screenId: "screen_home",
        nodeId: "loose_text",
        newParentId: "node_missing",
      }),
    ).toMatchObject({ ok: false, error: { code: "parent-not-found" } });
  });

  it("rejects parents and components belonging to another screen", () => {
    const project = createHierarchyProject();
    project.screens.screen_second = {
      id: "screen_second",
      name: "Second",
      route: "/second",
      rootNodeId: "second_root",
      options: { safeArea: true, scrollBehavior: "none" },
    };
    project.nodes.second_root = node("second_root", "View", null, ["second_view"]);
    project.nodes.second_view = node("second_view", "View", "second_root", ["second_text"]);
    project.nodes.second_text = node("second_text", "Text", "second_view");

    expect(
      reparentComponent(project, context, {
        screenId: "screen_home",
        nodeId: "loose_text",
        newParentId: "second_view",
      }),
    ).toMatchObject({ ok: false, error: { code: "parent-outside-screen" } });
    expect(
      reparentComponent(project, context, {
        screenId: "screen_home",
        nodeId: "second_text",
        newParentId: "view_b",
      }),
    ).toMatchObject({ ok: false, error: { code: "node-outside-screen" } });
  });

  it("rejects malformed two-way hierarchy without changing the project", () => {
    const project = createHierarchyProject();
    project.nodes.view_a = { ...project.nodes.view_a!, children: [] };
    const original = deepClone(project);

    const result = reparentComponent(project, context, {
      screenId: "screen_home",
      nodeId: "nested_view",
      newParentId: "view_b",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "invalid-hierarchy" } });
    expect(project).toEqual(original);
  });
});

describe("getValidParentCandidates", () => {
  it("includes the Screen and valid Views with deterministic duplicate labels", () => {
    const candidates = getValidParentCandidates(createHierarchyProject(), context, {
      screenId: "screen_home",
      nodeId: "loose_text",
    });

    expect(candidates).toEqual([
      { parentId: "node_root", kind: "screen", label: "Home (Screen)" },
      { parentId: "view_a", kind: "component", label: "View" },
      { parentId: "nested_view", kind: "component", label: "View · 2" },
      { parentId: "view_b", kind: "component", label: "View · 3" },
    ]);
  });

  it("excludes the selected View, all descendants, Text, Button, and other screens", () => {
    const project = createHierarchyProject();
    project.screens.screen_second = {
      id: "screen_second",
      name: "Second",
      route: "/second",
      rootNodeId: "second_root",
      options: { safeArea: true, scrollBehavior: "none" },
    };
    project.nodes.second_root = node("second_root", "View", null, ["second_view"]);
    project.nodes.second_view = node("second_view", "View", "second_root");

    const candidateIds = getValidParentCandidates(project, context, {
      screenId: "screen_home",
      nodeId: "view_a",
    }).map((candidate) => candidate.parentId);

    expect(candidateIds).toEqual(["node_root", "view_b"]);
    expect(candidateIds).not.toEqual(
      expect.arrayContaining([
        "view_a",
        "nested_view",
        "nested_text",
        "nested_button",
        "loose_text",
        "loose_button",
        "second_view",
      ]),
    );
  });

  it("fails closed for a screen root, missing node, cross-screen node, or malformed path", () => {
    const project = createHierarchyProject();
    project.screens.screen_second = {
      id: "screen_second",
      name: "Second",
      route: "/second",
      rootNodeId: "second_root",
      options: { safeArea: true, scrollBehavior: "none" },
    };
    project.nodes.second_root = node("second_root", "View", null, ["second_text"]);
    project.nodes.second_text = node("second_text", "Text", "second_root");

    expect(
      getValidParentCandidates(project, context, {
        screenId: "screen_home",
        nodeId: "node_root",
      }),
    ).toEqual([]);
    expect(
      getValidParentCandidates(project, context, {
        screenId: "screen_home",
        nodeId: "node_missing",
      }),
    ).toEqual([]);
    expect(
      getValidParentCandidates(project, context, {
        screenId: "screen_home",
        nodeId: "second_text",
      }),
    ).toEqual([]);

    project.nodes.view_a = { ...project.nodes.view_a!, children: [] };
    expect(
      getValidParentCandidates(project, context, {
        screenId: "screen_home",
        nodeId: "nested_view",
      }),
    ).toEqual([]);
  });
});
