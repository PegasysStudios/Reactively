import { ReactivelyProjectSchema } from "@reactively/project-schema";
import { describe, expect, it } from "vitest";

import { createProject, type ProjectCreationContext } from "./create-project.js";

function createTestContext(): ProjectCreationContext {
  const counters = { project: 0, screen: 0, node: 0 };

  return {
    createId: (prefix) => {
      counters[prefix] += 1;
      return `${prefix}_${counters[prefix]}`;
    },
    now: () => "2026-09-08T12:00:00.000Z",
  };
}

describe("createProject", () => {
  it("creates a project that passes the canonical schema", () => {
    const project = createProject({ name: "  My First App  " }, createTestContext());

    expect(ReactivelyProjectSchema.safeParse(project).success).toBe(true);
    expect(project).toMatchObject({
      id: "project_1",
      name: "My First App",
      initialScreenId: "screen_1",
      metadata: {
        createdAt: "2026-09-08T12:00:00.000Z",
        updatedAt: "2026-09-08T12:00:00.000Z",
      },
      settings: { displayName: "My First App", slug: "my-first-app" },
    });
  });

  it("contains exactly one initial screen and only its required root node", () => {
    const project = createProject({ name: "Untitled Project" }, createTestContext());
    const screens = Object.values(project.screens);
    const nodes = Object.values(project.nodes);

    expect(screens).toHaveLength(1);
    expect(screens[0]).toMatchObject({
      id: "screen_1",
      name: "Home",
      route: "/",
      rootNodeId: "node_1",
    });
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      id: "node_1",
      type: "View",
      parentId: null,
      children: [],
    });
  });
});
