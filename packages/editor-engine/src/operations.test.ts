import {
  ReactivelyProjectSchema,
  createMinimalProjectFixture,
  type ReactivelyProject,
} from "@reactively/project-schema";
import { createSequentialIdFactory, unwrap } from "@reactively/shared";
import { beforeEach, describe, expect, it } from "vitest";

import type { EditorCommandContext } from "./context.js";
import {
  addNode,
  deleteNode,
  renameProject,
  reparentNode,
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
    const next = unwrap(addNode(project, context, { parentId: "node_root", type: "Text" }));

    expect(next.nodes["node_1"]).toMatchObject({ type: "Text", parentId: "node_root" });
    expect(next.nodes["node_root"]?.children).toEqual(["node_title", "node_cta", "node_1"]);
  });

  it("inserts at a requested index", () => {
    const next = unwrap(
      addNode(project, context, { parentId: "node_root", type: "Text", index: 0 }),
    );

    expect(next.nodes["node_root"]?.children).toEqual(["node_1", "node_title", "node_cta"]);
  });

  it("does not mutate the original project", () => {
    addNode(project, context, { parentId: "node_root", type: "Text" });

    expect(project.nodes["node_root"]?.children).toEqual(["node_title", "node_cta"]);
    expect(project.nodes["node_1"]).toBeUndefined();
  });

  it("stamps updatedAt", () => {
    const next = unwrap(addNode(project, context, { parentId: "node_root", type: "Text" }));

    expect(next.metadata.updatedAt).toBe("2026-02-01T00:00:00.000Z");
    expect(next.metadata.createdAt).toBe(project.metadata.createdAt);
  });

  it("rejects an unknown component type", () => {
    const result = addNode(project, context, { parentId: "node_root", type: "FlatList" });

    expect(result).toMatchObject({ ok: false, error: { code: "unknown-component-type" } });
  });

  it("rejects a parent that cannot have children", () => {
    const result = addNode(project, context, { parentId: "node_title", type: "Text" });

    expect(result).toMatchObject({ ok: false, error: { code: "invalid-nesting" } });
  });

  it("rejects a parent that does not exist", () => {
    const result = addNode(project, context, { parentId: "node_ghost", type: "Text" });

    expect(result).toMatchObject({ ok: false, error: { code: "parent-not-found" } });
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
    const withGroup = unwrap(addNode(project, context, { parentId: "node_root", type: "View" }));
    const withChild = unwrap(addNode(withGroup, context, { parentId: "node_1", type: "Text" }));

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

describe("reparentNode", () => {
  let project: ReactivelyProject;
  let context: EditorCommandContext;

  beforeEach(() => {
    project = createMinimalProjectFixture();
    context = createTestContext();
  });

  it("moves a node into a new parent", () => {
    const withGroup = unwrap(addNode(project, context, { parentId: "node_root", type: "View" }));

    const next = unwrap(
      reparentNode(withGroup, context, { nodeId: "node_title", newParentId: "node_1" }),
    );

    expect(next.nodes["node_title"]?.parentId).toBe("node_1");
    expect(next.nodes["node_1"]?.children).toEqual(["node_title"]);
    expect(next.nodes["node_root"]?.children).toEqual(["node_cta", "node_1"]);
  });

  it("reorders within the same parent", () => {
    const next = unwrap(
      reparentNode(project, context, {
        nodeId: "node_cta",
        newParentId: "node_root",
        index: 0,
      }),
    );

    expect(next.nodes["node_root"]?.children).toEqual(["node_cta", "node_title"]);
  });

  it("refuses to move a node into its own descendant", () => {
    const withGroup = unwrap(addNode(project, context, { parentId: "node_root", type: "View" }));
    const withNested = unwrap(addNode(withGroup, context, { parentId: "node_1", type: "View" }));

    const result = reparentNode(withNested, context, {
      nodeId: "node_1",
      newParentId: "node_2",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "would-create-cycle" } });
  });

  it("refuses to make a node its own parent", () => {
    const result = reparentNode(project, context, {
      nodeId: "node_title",
      newParentId: "node_title",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "would-create-cycle" } });
  });

  it("refuses to move a screen root", () => {
    const withGroup = unwrap(addNode(project, context, { parentId: "node_root", type: "View" }));

    const result = reparentNode(withGroup, context, {
      nodeId: "node_root",
      newParentId: "node_1",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "cannot-reparent-screen-root" } });
  });

  it("refuses a semantically invalid parent", () => {
    const result = reparentNode(project, context, {
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
