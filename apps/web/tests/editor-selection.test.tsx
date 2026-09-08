import { act, fireEvent, render, screen } from "@testing-library/react";
import "fake-indexeddb/auto";
import {
  ReactivelyProjectSchema,
  createMinimalProjectFixture,
  type ComponentNode,
} from "@reactively/project-schema";
import { beforeEach, describe, expect, it } from "vitest";

import { EditorCanvas } from "@/components/editor/editor-canvas";
import { EditorInspector } from "@/components/editor/editor-inspector";
import { useEditorStore } from "@/lib/state/editor-store";
import { useProjectStore } from "@/lib/state/project-store";

function getRenderedComponents(): readonly ComponentNode[] {
  const project = createMinimalProjectFixture();
  const screen = project.screens[project.initialScreenId];
  if (!screen) {
    throw new Error("Test project is missing its initial screen.");
  }

  const root = project.nodes[screen.rootNodeId];
  if (!root) {
    throw new Error("Test project is missing its screen root.");
  }

  return root.children.flatMap((nodeId) => {
    const node = project.nodes[nodeId];
    return node ? [node] : [];
  });
}

beforeEach(() => {
  useEditorStore.getState().reset();
  useProjectStore.getState().clearProject();
});

describe("editor selection state", () => {
  it("starts without a selected component", () => {
    expect(useEditorStore.getState().selection.primaryNodeId).toBeNull();
    expect(useEditorStore.getState().selection.selectedNodeIds).toEqual([]);
  });

  it("stores one selected component and replaces it with the next selection", () => {
    useEditorStore.getState().selectNode("node_title");

    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_title");
    expect(useEditorStore.getState().selection.selectedNodeIds).toEqual(["node_title"]);

    useEditorStore.getState().selectNode("node_cta");

    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");
    expect(useEditorStore.getState().selection.selectedNodeIds).toEqual(["node_cta"]);
  });

  it("clears the selected component", () => {
    useEditorStore.getState().selectNode("node_title");
    useEditorStore.getState().clearSelection();

    expect(useEditorStore.getState().selection.primaryNodeId).toBeNull();
    expect(useEditorStore.getState().selection.selectedNodeIds).toEqual([]);
  });

  it("does not modify or invalidate the canonical project document", () => {
    const project = createMinimalProjectFixture();
    useProjectStore.getState().loadProject(project);
    const beforeSelection = structuredClone(useProjectStore.getState().project);

    useEditorStore.getState().selectNode("node_title");
    useEditorStore.getState().clearSelection();

    const projectAfterSelection = useProjectStore.getState().project;
    expect(projectAfterSelection).toEqual(beforeSelection);
    expect(ReactivelyProjectSchema.safeParse(projectAfterSelection).success).toBe(true);
  });
});

describe("editor component selection", () => {
  it("selects rendered components, moves the marker, and clears from the canvas", () => {
    render(
      <EditorCanvas
        projectId="project_fixture"
        screenName="Home"
        components={getRenderedComponents()}
      />,
    );

    const text = screen.getByRole("button", { name: "Select Title" });
    const button = screen.getByRole("button", { name: "Select Primary Action" });
    const canvas = screen.getByRole("main", { name: "Home canvas for project project_fixture" });

    expect(text).toHaveAttribute("aria-pressed", "false");
    expect(text).toHaveAttribute("data-selected", "false");

    fireEvent.click(text);

    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_title");
    expect(text).toHaveAttribute("aria-pressed", "true");
    expect(text).toHaveAttribute("data-selected", "true");

    fireEvent.click(button);

    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");
    expect(text).toHaveAttribute("aria-pressed", "false");
    expect(button).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(canvas);

    expect(useEditorStore.getState().selection.primaryNodeId).toBeNull();
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("does not clear selection when a canvas click dismisses an inspector dropdown", async () => {
    const project = createMinimalProjectFixture();
    useProjectStore.getState().loadProject(project);
    act(() => useEditorStore.getState().selectNode("node_cta"));

    render(
      <>
        <EditorCanvas
          projectId="project_fixture"
          screenName="Home"
          components={getRenderedComponents()}
        />
        <EditorInspector />
      </>,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Position" }));
    expect(await screen.findByRole("option", { name: "Absolute" })).toBeInTheDocument();

    const canvas = screen.getByRole("main", {
      name: "Home canvas for project project_fixture",
      hidden: true,
    });
    fireEvent.pointerDown(canvas);
    fireEvent.click(canvas);

    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");
  });

  it("clears a selection that is not rendered on the current screen", async () => {
    useEditorStore.getState().selectNode("node_missing");

    render(
      <EditorCanvas
        projectId="project_fixture"
        screenName="Home"
        components={getRenderedComponents()}
      />,
    );

    expect(useEditorStore.getState().selection.primaryNodeId).toBeNull();
  });
});
