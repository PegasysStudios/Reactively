import "fake-indexeddb/auto";

import {
  addNode,
  createProject,
  renameProject,
  reparentComponent,
  updateNodeProps,
  updateNodeStyle,
} from "@reactively/editor-engine";
import {
  createMinimalProjectFixture,
  points,
  type ReactivelyProject,
} from "@reactively/project-schema";
import { unwrap } from "@reactively/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabase, type ReactivelyDatabase } from "@/lib/persistence/database";
import {
  createDexieProjectPersistence,
  InvalidPersistedProjectError,
} from "@/lib/persistence/dexie-project-persistence";
import { createEditorCommandContext } from "@/lib/editor/command-context";

let database: ReactivelyDatabase;

beforeEach(() => {
  database = createDatabase(`reactively-test-${crypto.randomUUID()}`);
});

afterEach(async () => {
  await database.delete();
});

describe("Dexie project persistence", () => {
  it("saves, loads, and lists a canonical project", async () => {
    const repository = createDexieProjectPersistence(database);
    const project = createMinimalProjectFixture();

    await repository.saveLocal(project);

    await expect(repository.loadLocal(project.id)).resolves.toEqual(project);
    await expect(repository.listLocal()).resolves.toEqual([
      {
        id: project.id,
        name: project.name,
        updatedAt: project.metadata.updatedAt,
        schemaVersion: project.schemaVersion,
      },
    ]);
  });

  it("rejects malformed persisted project data", async () => {
    const repository = createDexieProjectPersistence(database);

    await database.projects.put({
      id: "project_broken",
      name: "Broken",
      updatedAt: "2026-09-08T12:00:00.000Z",
      schemaVersion: 1,
      document: { id: "project_broken", name: "Broken" } as unknown as ReactivelyProject,
    });

    await expect(repository.loadLocal("project_broken")).rejects.toBeInstanceOf(
      InvalidPersistedProjectError,
    );
  });

  it("preserves inserted component nodes and their IDs across save and load", async () => {
    const repository = createDexieProjectPersistence(database);
    const blankProject = createProject({ name: "Persisted Components" });
    const screen = blankProject.screens[blankProject.initialScreenId];
    if (!screen) {
      throw new Error("Test project is missing its initial screen.");
    }

    const project = unwrap(
      addNode(blankProject, createEditorCommandContext(), {
        screenId: blankProject.initialScreenId,
        parentId: screen.rootNodeId,
        type: "Text",
      }),
    );
    const insertedId = project.nodes[screen.rootNodeId]?.children[0];

    await repository.saveLocal(project);
    const restored = await repository.loadLocal(project.id);

    expect(restored).toEqual(project);
    expect(restored?.nodes[screen.rootNodeId]?.children).toEqual([insertedId]);
    expect(insertedId ? restored?.nodes[insertedId] : undefined).toMatchObject({
      id: insertedId,
      type: "Text",
      props: { content: "Text" },
    });
  });

  it("preserves a nested View hierarchy and stable IDs across save and load", async () => {
    const repository = createDexieProjectPersistence(database);
    const blankProject = createProject({ name: "Nested Components" });
    const screen = blankProject.screens[blankProject.initialScreenId];
    if (!screen) {
      throw new Error("Test project is missing its initial screen.");
    }

    const withView = unwrap(
      addNode(blankProject, createEditorCommandContext(), {
        screenId: screen.id,
        parentId: screen.rootNodeId,
        type: "View",
      }),
    );
    const viewId = withView.nodes[screen.rootNodeId]?.children[0];
    if (!viewId) {
      throw new Error("Test project is missing its inserted View.");
    }
    const nested = unwrap(
      addNode(withView, createEditorCommandContext(), {
        screenId: screen.id,
        parentId: viewId,
        type: "Text",
      }),
    );
    const textId = nested.nodes[viewId]?.children[0];

    await repository.saveLocal(nested);
    const restored = await repository.loadLocal(nested.id);

    expect(restored).toEqual(nested);
    expect(restored?.nodes[screen.rootNodeId]?.children).toEqual([viewId]);
    expect(restored?.nodes[viewId]?.children).toEqual([textId]);
    expect(textId ? restored?.nodes[textId]?.parentId : undefined).toBe(viewId);
  });

  it("preserves a reparented hierarchy across save and load", async () => {
    const repository = createDexieProjectPersistence(database);
    const context = createEditorCommandContext();
    const project = createMinimalProjectFixture();
    project.nodes.view_a = {
      id: "view_a",
      type: "View",
      name: "View A",
      parentId: "node_root",
      children: ["node_title"],
      props: {},
      style: {},
      events: [],
    };
    project.nodes.view_b = {
      id: "view_b",
      type: "View",
      name: "View B",
      parentId: "node_root",
      children: [],
      props: {},
      style: {},
      events: [],
    };
    project.nodes.node_root = {
      ...project.nodes.node_root!,
      children: ["view_a", "node_cta", "view_b"],
    };
    project.nodes.node_title = { ...project.nodes.node_title!, parentId: "view_a" };

    const reparented = unwrap(
      reparentComponent(project, context, {
        screenId: "screen_home",
        nodeId: "node_title",
        newParentId: "view_b",
      }),
    );
    await repository.saveLocal(reparented);
    const restored = await repository.loadLocal(reparented.id);

    expect(restored?.nodes.view_a?.children).toEqual([]);
    expect(restored?.nodes.view_b?.children).toEqual(["node_title"]);
    expect(restored?.nodes.node_title?.parentId).toBe("view_b");
    expect(restored?.nodes.node_title?.id).toBe("node_title");
  });

  it("continues to load an existing flat root-child project", async () => {
    const repository = createDexieProjectPersistence(database);
    const flatProject = createMinimalProjectFixture();

    await repository.saveLocal(flatProject);
    const restored = await repository.loadLocal(flatProject.id);

    expect(restored?.nodes["node_root"]?.children).toEqual(["node_title", "node_cta"]);
    expect(restored?.nodes["node_title"]?.parentId).toBe("node_root");
    expect(restored?.nodes["node_cta"]?.parentId).toBe("node_root");
  });

  it("persists a renamed project and its updated dashboard summary", async () => {
    const repository = createDexieProjectPersistence(database);
    const project = unwrap(
      renameProject(createMinimalProjectFixture(), createEditorCommandContext(), {
        name: "Renamed Project",
      }),
    );

    await repository.saveLocal(project);

    await expect(repository.loadLocal(project.id)).resolves.toMatchObject({
      name: "Renamed Project",
    });
    await expect(repository.listLocal()).resolves.toEqual([
      expect.objectContaining({ id: project.id, name: "Renamed Project" }),
    ]);
  });

  it("preserves edited Text and Button props across save and load", async () => {
    const repository = createDexieProjectPersistence(database);
    const context = createEditorCommandContext();
    const withText = unwrap(
      updateNodeProps(createMinimalProjectFixture(), context, {
        nodeId: "node_title",
        props: { content: "Hello Reactively" },
      }),
    );
    const edited = unwrap(
      updateNodeProps(withText, context, {
        nodeId: "node_cta",
        props: { label: "Get Started" },
      }),
    );

    await repository.saveLocal(edited);
    const restored = await repository.loadLocal(edited.id);

    expect(restored?.nodes["node_title"]?.props.content).toBe("Hello Reactively");
    expect(restored?.nodes["node_cta"]?.props.label).toBe("Get Started");
  });

  it("preserves layout style values across save and load", async () => {
    const repository = createDexieProjectPersistence(database);
    const edited = unwrap(
      updateNodeStyle(createMinimalProjectFixture(), createEditorCommandContext(), {
        nodeId: "node_cta",
        style: {
          position: "absolute",
          left: points(24),
          top: points(40),
          width: points(200),
          height: points(56),
        },
      }),
    );

    await repository.saveLocal(edited);
    const restored = await repository.loadLocal(edited.id);

    expect(restored?.nodes["node_cta"]?.style).toMatchObject({
      position: "absolute",
      left: points(24),
      top: points(40),
      width: points(200),
      height: points(56),
    });
  });

  it("preserves margin and padding edge values across save and load", async () => {
    const repository = createDexieProjectPersistence(database);
    const edited = unwrap(
      updateNodeStyle(createMinimalProjectFixture(), createEditorCommandContext(), {
        nodeId: "node_cta",
        style: {
          margin: { top: 16, right: 16, bottom: 12, left: 16 },
          padding: { top: 12, right: 24, bottom: 12, left: 24 },
        },
      }),
    );

    await repository.saveLocal(edited);
    const restored = await repository.loadLocal(edited.id);

    expect(restored?.nodes["node_cta"]?.style.margin).toEqual({
      top: 16,
      right: 16,
      bottom: 12,
      left: 16,
    });
    expect(restored?.nodes["node_cta"]?.style.padding).toEqual({
      top: 12,
      right: 24,
      bottom: 12,
      left: 24,
    });
    expect(restored?.nodes["node_title"]?.style).toEqual(edited.nodes["node_title"]?.style);
  });

  it("preserves Flexbox style values across save and load", async () => {
    const repository = createDexieProjectPersistence(database);
    const edited = unwrap(
      updateNodeStyle(createMinimalProjectFixture(), createEditorCommandContext(), {
        nodeId: "node_cta",
        style: {
          flexGrow: 1,
          flexShrink: 0,
          alignSelf: "center",
        },
      }),
    );

    await repository.saveLocal(edited);
    const restored = await repository.loadLocal(edited.id);

    expect(restored?.nodes["node_cta"]?.style.flexGrow).toBe(1);
    expect(restored?.nodes["node_cta"]?.style.flexShrink).toBe(0);
    expect(restored?.nodes["node_cta"]?.style.alignSelf).toBe("center");
    expect(restored?.nodes["node_title"]?.style).toEqual(edited.nodes["node_title"]?.style);
  });

  it("preserves View container Flexbox values across save and load", async () => {
    const repository = createDexieProjectPersistence(database);
    const edited = unwrap(
      updateNodeStyle(createMinimalProjectFixture(), createEditorCommandContext(), {
        nodeId: "node_root",
        style: {
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        },
      }),
    );
    const childOrder = edited.nodes["node_root"]?.children;

    await repository.saveLocal(edited);
    const restored = await repository.loadLocal(edited.id);

    expect(restored?.nodes["node_root"]?.style).toMatchObject({
      flexDirection: "row-reverse",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16,
    });
    expect(restored?.nodes["node_root"]?.children).toEqual(childOrder);
  });
});
