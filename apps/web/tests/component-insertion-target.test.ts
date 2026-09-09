import { createMinimalProjectFixture, type ReactivelyProject } from "@reactively/project-schema";
import { describe, expect, it } from "vitest";

import { resolveComponentInsertionParent } from "@/lib/editor/component-insertion-target";

function createProjectWithNestedView(): ReactivelyProject {
  const project = createMinimalProjectFixture();
  project.nodes["node_view"] = {
    id: "node_view",
    type: "View",
    name: "View",
    parentId: "node_root",
    children: [],
    props: {},
    style: {},
    events: [],
  };
  project.nodes["node_root"] = {
    ...project.nodes["node_root"]!,
    children: [...project.nodes["node_root"]!.children, "node_view"],
  };
  return project;
}

describe("component insertion target", () => {
  it("uses a selected View that can contain the requested component", () => {
    const project = createProjectWithNestedView();

    expect(
      resolveComponentInsertionParent({
        project,
        screenId: project.initialScreenId,
        selectedNodeId: "node_view",
        componentType: "Text",
      }),
    ).toBe("node_view");
  });

  it.each(["node_title", "node_cta", null])(
    "falls back to the screen root for selection %s",
    (selectedNodeId) => {
      const project = createProjectWithNestedView();

      expect(
        resolveComponentInsertionParent({
          project,
          screenId: project.initialScreenId,
          selectedNodeId,
          componentType: "View",
        }),
      ).toBe("node_root");
    },
  );

  it("does not target a selected View from another screen", () => {
    const project = createProjectWithNestedView();
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
      name: "Second Root",
      parentId: null,
      children: [],
      props: {},
      style: {},
      events: [],
    };

    expect(
      resolveComponentInsertionParent({
        project,
        screenId: project.initialScreenId,
        selectedNodeId: "node_second_root",
        componentType: "Text",
      }),
    ).toBe("node_root");
  });
});
