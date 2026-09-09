import {
  ReactivelyProjectSchema,
  createMinimalProjectFixture,
  type ComponentStyle,
  type ReactivelyProject,
} from "@reactively/project-schema";
import { createSequentialIdFactory, unwrap } from "@reactively/shared";
import { beforeEach, describe, expect, it } from "vitest";

import type { EditorCommandContext } from "./context.js";
import {
  addNode,
  deleteNode,
  renameProject,
  reparentComponent,
  updateNodeProps,
  updateNodeStyle,
} from "./operations.js";

describe("renameProject", () => {
  it("trims and updates the canonical project name", () => {
    const project = createMinimalProjectFixture();
    const next = unwrap(renameProject(project, createTestContext(), { name: "  Renamed App  " }));

    expect(next.name).toBe("Renamed App");
    expect(next.settings.displayName).toBe(project.settings.displayName);
    expect(next.metadata.updatedAt).toBe("2026-02-01T00:00:00.000Z");
    expect(project.name).toBe("Fixture App");
  });

  it("rejects an empty project name", () => {
    const result = renameProject(createMinimalProjectFixture(), createTestContext(), {
      name: "   ",
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "invalid-project-name", message: "Project name must not be empty." },
    });
  });
});

/**
 * A stand-in for the component registry.
 *
 * This package does not depend on @reactively/component-registry, so tests supply the
 * same rules by hand. That is the point of injecting the context: the mutation layer can
 * be exercised without the registry, and custom components will plug into it identically.
 */
function createTestContext(): EditorCommandContext {
  const nextId = createSequentialIdFactory("node");

  return {
    createId: nextId,
    now: () => "2026-02-01T00:00:00.000Z",
    canAcceptChild: (parentType) => parentType === "View",
    canBeScreenRoot: (type) => type === "View",
    supportsContainerLayout: (type) => type === "View",
    defaultsFor: (type) =>
      type === "View" || type === "Text" || type === "Button"
        ? { name: type, props: {}, style: {} }
        : undefined,
  };
}

describe("addNode", () => {
  let project: ReactivelyProject;
  let context: EditorCommandContext;

  beforeEach(() => {
    project = createMinimalProjectFixture();
    context = createTestContext();
  });

  it("appends a new node to its parent", () => {
    const next = unwrap(
      addNode(project, context, {
        screenId: "screen_home",
        parentId: "node_root",
        type: "Text",
      }),
    );

    expect(next.nodes["node_1"]).toMatchObject({ type: "Text", parentId: "node_root" });
    expect(next.nodes["node_root"]?.children).toEqual(["node_title", "node_cta", "node_1"]);
  });

  it("inserts at a requested index", () => {
    const next = unwrap(
      addNode(project, context, {
        screenId: "screen_home",
        parentId: "node_root",
        type: "Text",
        index: 0,
      }),
    );

    expect(next.nodes["node_root"]?.children).toEqual(["node_1", "node_title", "node_cta"]);
  });

  it("does not mutate the original project", () => {
    addNode(project, context, {
      screenId: "screen_home",
      parentId: "node_root",
      type: "Text",
    });

    expect(project.nodes["node_root"]?.children).toEqual(["node_title", "node_cta"]);
    expect(project.nodes["node_1"]).toBeUndefined();
  });

  it("stamps updatedAt", () => {
    const next = unwrap(
      addNode(project, context, {
        screenId: "screen_home",
        parentId: "node_root",
        type: "Text",
      }),
    );

    expect(next.metadata.updatedAt).toBe("2026-02-01T00:00:00.000Z");
    expect(next.metadata.createdAt).toBe(project.metadata.createdAt);
  });

  it("rejects an unknown component type", () => {
    const result = addNode(project, context, {
      screenId: "screen_home",
      parentId: "node_root",
      type: "FlatList",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "unknown-component-type" } });
  });

  it("rejects a parent that cannot have children", () => {
    const result = addNode(project, context, {
      screenId: "screen_home",
      parentId: "node_title",
      type: "Text",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "invalid-nesting" } });
  });

  it("rejects a parent that does not exist", () => {
    const result = addNode(project, context, {
      screenId: "screen_home",
      parentId: "node_ghost",
      type: "Text",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "parent-not-found" } });
  });

  it("rejects a screen that does not exist", () => {
    const result = addNode(project, context, {
      screenId: "screen_ghost",
      parentId: "node_root",
      type: "Text",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "screen-not-found" } });
  });

  it("rejects a parent outside the requested screen tree", () => {
    project.screens["screen_second"] = {
      id: "screen_second",
      name: "Second",
      route: "/second",
      rootNodeId: "node_second_root",
      options: { safeArea: true, scrollBehavior: "none" },
    };
    project.nodes["node_second_root"] = {
      id: "node_second_root",
      type: "View",
      name: "Second Screen Root",
      parentId: null,
      children: [],
      props: {},
      style: {},
      events: [],
    };

    const result = addNode(project, context, {
      screenId: "screen_home",
      parentId: "node_second_root",
      type: "Text",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "parent-outside-screen" } });
  });

  it("rejects a generated ID that already belongs to a project node", () => {
    const result = addNode(
      project,
      { ...context, createId: () => "node_title" },
      { screenId: "screen_home", parentId: "node_root", type: "Text" },
    );

    expect(result).toMatchObject({ ok: false, error: { code: "duplicate-node-id" } });
    expect(project.nodes["node_root"]?.children).toEqual(["node_title", "node_cta"]);
  });

  it("updates both hierarchy references and preserves unrelated node identity", () => {
    const next = unwrap(
      addNode(project, context, {
        screenId: "screen_home",
        parentId: "node_root",
        type: "View",
      }),
    );

    expect(next.nodes["node_root"]?.children).toContain("node_1");
    expect(next.nodes["node_1"]?.parentId).toBe("node_root");
    expect(next.nodes["node_title"]).toBe(project.nodes["node_title"]);
    expect(next.nodes["node_cta"]).toBe(project.nodes["node_cta"]);
    expect(ReactivelyProjectSchema.safeParse(next).success).toBe(true);
  });
});

describe("deleteNode", () => {
  let project: ReactivelyProject;
  let context: EditorCommandContext;

  beforeEach(() => {
    project = createMinimalProjectFixture();
    context = createTestContext();
  });

  it("removes the node and detaches it from its parent", () => {
    const next = unwrap(deleteNode(project, context, { nodeId: "node_title" }));

    expect(next.nodes["node_title"]).toBeUndefined();
    expect(next.nodes["node_root"]?.children).toEqual(["node_cta"]);
  });

  it("removes the whole subtree", () => {
    const withGroup = unwrap(
      addNode(project, context, {
        screenId: "screen_home",
        parentId: "node_root",
        type: "View",
      }),
    );
    const withChild = unwrap(
      addNode(withGroup, context, {
        screenId: "screen_home",
        parentId: "node_1",
        type: "Text",
      }),
    );

    const next = unwrap(deleteNode(withChild, context, { nodeId: "node_1" }));

    expect(next.nodes["node_1"]).toBeUndefined();
    expect(next.nodes["node_2"]).toBeUndefined();
  });

  it("refuses to delete a screen root", () => {
    const result = deleteNode(project, context, { nodeId: "node_root" });

    expect(result).toMatchObject({ ok: false, error: { code: "cannot-delete-screen-root" } });
  });

  it("rejects an unknown node", () => {
    const result = deleteNode(project, context, { nodeId: "node_ghost" });

    expect(result).toMatchObject({ ok: false, error: { code: "node-not-found" } });
  });
});

describe("reparentComponent", () => {
  let project: ReactivelyProject;
  let context: EditorCommandContext;

  beforeEach(() => {
    project = createMinimalProjectFixture();
    context = createTestContext();
  });

  it("moves a node into a new parent", () => {
    const withGroup = unwrap(
      addNode(project, context, {
        screenId: "screen_home",
        parentId: "node_root",
        type: "View",
      }),
    );

    const next = unwrap(
      reparentComponent(withGroup, context, {
        screenId: "screen_home",
        nodeId: "node_title",
        newParentId: "node_1",
      }),
    );

    expect(next.nodes["node_title"]?.parentId).toBe("node_1");
    expect(next.nodes["node_1"]?.children).toEqual(["node_title"]);
    expect(next.nodes["node_root"]?.children).toEqual(["node_cta", "node_1"]);
  });

  it("treats the existing parent as a no-op", () => {
    const next = unwrap(
      reparentComponent(project, context, {
        screenId: "screen_home",
        nodeId: "node_cta",
        newParentId: "node_root",
      }),
    );

    expect(next).toBe(project);
    expect(next.nodes["node_root"]?.children).toEqual(["node_title", "node_cta"]);
  });

  it("refuses to move a node into its own descendant", () => {
    const withGroup = unwrap(
      addNode(project, context, {
        screenId: "screen_home",
        parentId: "node_root",
        type: "View",
      }),
    );
    const withNested = unwrap(
      addNode(withGroup, context, {
        screenId: "screen_home",
        parentId: "node_1",
        type: "View",
      }),
    );

    const result = reparentComponent(withNested, context, {
      screenId: "screen_home",
      nodeId: "node_1",
      newParentId: "node_2",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "would-create-cycle" } });
  });

  it("refuses to make a node its own parent", () => {
    const result = reparentComponent(project, context, {
      screenId: "screen_home",
      nodeId: "node_title",
      newParentId: "node_title",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "would-create-cycle" } });
  });

  it("refuses to move a screen root", () => {
    const withGroup = unwrap(
      addNode(project, context, {
        screenId: "screen_home",
        parentId: "node_root",
        type: "View",
      }),
    );

    const result = reparentComponent(withGroup, context, {
      screenId: "screen_home",
      nodeId: "node_root",
      newParentId: "node_1",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "cannot-reparent-screen-root" } });
  });

  it("refuses a semantically invalid parent", () => {
    const result = reparentComponent(project, context, {
      screenId: "screen_home",
      nodeId: "node_cta",
      newParentId: "node_title",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "invalid-nesting" } });
  });
});

describe("updateNodeProps and updateNodeStyle", () => {
  let project: ReactivelyProject;
  let context: EditorCommandContext;

  beforeEach(() => {
    project = createMinimalProjectFixture();
    context = createTestContext();
  });

  it("merges props", () => {
    const next = unwrap(
      updateNodeProps(project, context, {
        nodeId: "node_cta",
        props: { label: "Continue" },
      }),
    );

    expect(next.nodes["node_cta"]?.props).toEqual({
      label: "Continue",
      variant: "primary",
      disabled: false,
    });
    expect(next.nodes["node_title"]).toBe(project.nodes["node_title"]);
    expect(project.nodes["node_cta"]?.props.label).toBe("Get started");
    expect(ReactivelyProjectSchema.safeParse(next).success).toBe(true);
  });

  it("merges style", () => {
    const next = unwrap(
      updateNodeStyle(project, context, {
        nodeId: "node_title",
        style: { fontSize: 32 },
      }),
    );

    expect(next.nodes["node_title"]?.style).toMatchObject({ fontSize: 32, fontWeight: "600" });
  });

  it("merges React Native layout fields without affecting other nodes", () => {
    const next = unwrap(
      updateNodeStyle(project, context, {
        nodeId: "node_cta",
        style: {
          position: "absolute",
          left: { type: "points", value: 20 },
          top: { type: "points", value: 40 },
          width: { type: "points", value: 200 },
          height: { type: "points", value: 56 },
        },
      }),
    );

    expect(next.nodes["node_cta"]?.style).toMatchObject({
      position: "absolute",
      left: { type: "points", value: 20 },
      top: { type: "points", value: 40 },
      width: { type: "points", value: 200 },
      height: { type: "points", value: 56 },
    });
    expect(next.nodes["node_cta"]?.props).toEqual(project.nodes["node_cta"]?.props);
    expect(next.nodes["node_title"]).toBe(project.nodes["node_title"]);
    expect(ReactivelyProjectSchema.safeParse(next).success).toBe(true);
  });

  it("merges Flexbox item fields without affecting other nodes", () => {
    const next = unwrap(
      updateNodeStyle(project, context, {
        nodeId: "node_cta",
        style: {
          flexGrow: 1,
          flexShrink: 0,
          alignSelf: "center",
        },
      }),
    );

    expect(next.nodes["node_cta"]?.style).toMatchObject({
      flexGrow: 1,
      flexShrink: 0,
      alignSelf: "center",
    });
    expect(next.nodes["node_cta"]?.style.width).toEqual(project.nodes["node_cta"]?.style.width);
    expect(next.nodes["node_title"]).toBe(project.nodes["node_title"]);
    expect(ReactivelyProjectSchema.safeParse(next).success).toBe(true);
  });

  it.each([
    ["flexDirection", { flexDirection: "row" }, "flexDirection", "row"],
    ["justifyContent", { justifyContent: "space-between" }, "justifyContent", "space-between"],
    ["alignItems", { alignItems: "center" }, "alignItems", "center"],
    ["gap", { gap: 16 }, "gap", 16],
  ] as const)("updates View %s without changing another node", (_name, style, key, value) => {
    const next = unwrap(
      updateNodeStyle(project, context, {
        nodeId: "node_root",
        style: style as ComponentStyle,
      }),
    );

    expect(next.nodes["node_root"]?.style[key]).toBe(value);
    expect(next.nodes["node_title"]).toBe(project.nodes["node_title"]);
    expect(next.nodes["node_cta"]).toBe(project.nodes["node_cta"]);
    expect(ReactivelyProjectSchema.safeParse(next).success).toBe(true);
  });

  it("updates a nested View independently of its parent and children", () => {
    const withNestedView = unwrap(
      addNode(project, context, {
        screenId: "screen_home",
        parentId: "node_root",
        type: "View",
      }),
    );
    const parentStyle = withNestedView.nodes["node_root"]?.style;
    const titleNode = withNestedView.nodes["node_title"];

    const next = unwrap(
      updateNodeStyle(withNestedView, context, {
        nodeId: "node_1",
        style: { flexDirection: "row", gap: 8 },
      }),
    );

    expect(next.nodes["node_1"]?.style).toMatchObject({ flexDirection: "row", gap: 8 });
    expect(next.nodes["node_root"]?.style).toEqual(parentStyle);
    expect(next.nodes["node_title"]).toBe(titleNode);
    expect(next.nodes["node_1"]?.parentId).toBe("node_root");
  });

  it.each(["row-reverse", "column-reverse"] as const)(
    "keeps hierarchy and child order unchanged for %s",
    (flexDirection) => {
      const nodeIds = Object.keys(project.nodes);
      const childOrder = [...(project.nodes["node_root"]?.children ?? [])];
      const childParents = childOrder.map((childId) => project.nodes[childId]?.parentId);

      const next = unwrap(
        updateNodeStyle(project, context, {
          nodeId: "node_root",
          style: { flexDirection },
        }),
      );

      expect(Object.keys(next.nodes)).toEqual(nodeIds);
      expect(next.nodes["node_root"]?.children).toEqual(childOrder);
      expect(childOrder.map((childId) => next.nodes[childId]?.parentId)).toEqual(childParents);
    },
  );

  it("preserves existing item, position, margin and padding styles", () => {
    const root = project.nodes["node_root"];
    if (!root) {
      throw new Error("Fixture is missing its root View.");
    }

    project.nodes["node_root"] = {
      ...root,
      style: {
        ...root.style,
        position: "relative",
        flexGrow: 1,
        flexShrink: 0,
        alignSelf: "center",
        margin: { top: 4 },
        padding: { all: 24 },
      },
    };

    const next = unwrap(
      updateNodeStyle(project, context, { nodeId: "node_root", style: { gap: 16 } }),
    );

    expect(next.nodes["node_root"]?.style).toMatchObject({
      position: "relative",
      flexGrow: 1,
      flexShrink: 0,
      alignSelf: "center",
      margin: { top: 4 },
      padding: { all: 24 },
      gap: 16,
    });
  });

  it.each([-1, Number.NaN])("rejects invalid gap %s before it enters project state", (gap) => {
    const result = updateNodeStyle(project, context, {
      nodeId: "node_root",
      style: { gap },
    });

    expect(result).toMatchObject({ ok: false, error: { code: "invalid-component-style" } });
    expect(project.nodes["node_root"]?.style.gap).toBe(12);
  });

  it.each(["Text", "Button"])("rejects container styles on %s", (type) => {
    const nodeId = type === "Text" ? "node_title" : "node_cta";
    const result = updateNodeStyle(project, context, {
      nodeId,
      style: { flexDirection: "row" },
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "unsupported-container-layout", nodeId },
    });
  });

  it("drops properties cleared with undefined instead of serializing them", () => {
    const next = unwrap(
      updateNodeStyle(project, context, {
        nodeId: "node_title",
        style: { fontWeight: undefined },
      }),
    );

    expect(next.nodes["node_title"]?.style).not.toHaveProperty("fontWeight");
  });

  it("rejects an unknown node", () => {
    expect(updateNodeProps(project, context, { nodeId: "ghost", props: {} })).toMatchObject({
      ok: false,
      error: { code: "node-not-found" },
    });
    expect(updateNodeStyle(project, context, { nodeId: "ghost", style: {} })).toMatchObject({
      ok: false,
      error: { code: "node-not-found" },
    });
  });
});
