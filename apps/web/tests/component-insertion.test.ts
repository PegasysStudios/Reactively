import { getComponentDefinition } from "@reactively/component-registry";
import { addNode, createProject } from "@reactively/editor-engine";
import { ReactivelyProjectSchema, type ReactivelyProject } from "@reactively/project-schema";
import { unwrap } from "@reactively/shared";
import { describe, expect, it } from "vitest";

import { createEditorCommandContext } from "@/lib/editor/command-context";

function createBlankProject(): ReactivelyProject {
  return createProject({ name: "Component Test" });
}

function getRootId(project: ReactivelyProject): string {
  const screen = project.screens[project.initialScreenId];
  if (!screen) {
    throw new Error("Test project is missing its initial screen.");
  }
  return screen.rootNodeId;
}

function addComponent(
  project: ReactivelyProject,
  type: string,
  parentId = getRootId(project),
): ReactivelyProject {
  return unwrap(
    addNode(project, createEditorCommandContext(), {
      screenId: project.initialScreenId,
      parentId,
      type,
    }),
  );
}

describe("component insertion with the built-in registry", () => {
  it.each(["View", "Text", "Button"])("creates a %s node attached to Home", (type) => {
    const project = createBlankProject();
    const rootId = getRootId(project);
    const next = addComponent(project, type);
    const createdId = next.nodes[rootId]?.children[0];
    const created = createdId ? next.nodes[createdId] : undefined;

    expect(created).toMatchObject({ type, parentId: rootId, children: [] });
  });

  it.each(["View", "Text", "Button"])("applies the registry defaults for %s", (type) => {
    const project = createBlankProject();
    const next = addComponent(project, type);
    const createdId = next.nodes[getRootId(next)]?.children[0];
    const created = createdId ? next.nodes[createdId] : undefined;
    const definition = getComponentDefinition(type);

    expect(created?.props).toEqual(definition?.defaultProps);
    expect(created?.style).toEqual(definition?.defaultStyle);
  });

  it.each(["View", "Text", "Button"])("lets View contain %s", (type) => {
    const project = createBlankProject();
    const withView = addComponent(project, "View");
    const viewId = withView.nodes[getRootId(withView)]?.children[0];
    if (!viewId) {
      throw new Error("Test project is missing its inserted View.");
    }

    const next = addComponent(withView, type, viewId);
    const childId = next.nodes[viewId]?.children[0];

    expect(next.nodes[viewId]?.children).toEqual([childId]);
    expect(childId ? next.nodes[childId] : undefined).toMatchObject({
      type,
      parentId: viewId,
      children: [],
    });
  });

  it.each(["Text", "Button"])("rejects child insertion into %s", (parentType) => {
    const project = createBlankProject();
    const withLeaf = addComponent(project, parentType);
    const leafId = withLeaf.nodes[getRootId(withLeaf)]?.children[0];
    if (!leafId) {
      throw new Error(`Test project is missing its inserted ${parentType}.`);
    }

    const result = addNode(withLeaf, createEditorCommandContext(), {
      screenId: withLeaf.initialScreenId,
      parentId: leafId,
      type: "Text",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "invalid-nesting" } });
  });

  it("adds children to the selected View without replacing its existing siblings", () => {
    const project = createBlankProject();
    const withView = addComponent(project, "View");
    const viewId = withView.nodes[getRootId(withView)]?.children[0];
    if (!viewId) {
      throw new Error("Test project is missing its inserted View.");
    }

    const withText = addComponent(withView, "Text", viewId);
    const withButton = addComponent(withText, "Button", viewId);
    const childIds = withButton.nodes[viewId]?.children ?? [];

    expect(childIds).toHaveLength(2);
    expect(withButton.nodes[childIds[0] ?? ""]?.type).toBe("Text");
    expect(withButton.nodes[childIds[1] ?? ""]?.type).toBe("Button");
    expect(childIds.every((id) => withButton.nodes[id]?.parentId === viewId)).toBe(true);
  });

  it("creates unique stable node IDs without replacing earlier nodes", () => {
    const project = createBlankProject();
    const rootId = getRootId(project);
    const withText = addComponent(project, "Text");
    const withButton = addComponent(withText, "Button");
    const childIds = withButton.nodes[rootId]?.children ?? [];

    expect(childIds).toHaveLength(2);
    expect(new Set(childIds).size).toBe(2);
    expect(childIds.every((id) => id.startsWith("node_"))).toBe(true);
    expect(withButton.nodes[childIds[0] ?? ""]?.type).toBe("Text");
    expect(withButton.nodes[childIds[1] ?? ""]?.type).toBe("Button");
  });

  it("keeps a nested project valid according to the canonical schema", () => {
    const withOuterView = addComponent(createBlankProject(), "View");
    const outerViewId = withOuterView.nodes[getRootId(withOuterView)]?.children[0];
    if (!outerViewId) {
      throw new Error("Test project is missing its outer View.");
    }
    const withNestedView = addComponent(withOuterView, "View", outerViewId);
    const nestedViewId = withNestedView.nodes[outerViewId]?.children[0];
    if (!nestedViewId) {
      throw new Error("Test project is missing its nested View.");
    }
    const project = addComponent(withNestedView, "Text", nestedViewId);

    expect(ReactivelyProjectSchema.safeParse(project).success).toBe(true);
  });

  it("rejects an unsupported component type safely", () => {
    const project = createBlankProject();
    const result = addNode(project, createEditorCommandContext(), {
      screenId: project.initialScreenId,
      parentId: getRootId(project),
      type: "FlatList",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "unknown-component-type" } });
  });

  it("does not mutate existing project nodes", () => {
    const project = createBlankProject();
    const before = structuredClone(project);

    addComponent(project, "Text");

    expect(project).toEqual(before);
  });
});
