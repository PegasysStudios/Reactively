import { act, fireEvent, render, screen } from "@testing-library/react";
import "fake-indexeddb/auto";
import {
  ReactivelyProjectSchema,
  createMinimalProjectFixture,
  type ReactivelyProject,
} from "@reactively/project-schema";
import { beforeEach, describe, expect, it } from "vitest";

import { EditorCanvas } from "@/components/editor/editor-canvas";
import { EditorInspector } from "@/components/editor/editor-inspector";
import { useEditorStore } from "@/lib/state/editor-store";
import { useProjectStore } from "@/lib/state/project-store";

beforeEach(() => {
  useEditorStore.getState().reset();
  useProjectStore.getState().clearProject();
});

function createNestedProjectFixture(): ReactivelyProject {
  const project = createMinimalProjectFixture();
  project.nodes["node_outer"] = {
    id: "node_outer",
    type: "View",
    name: "Outer View",
    parentId: "node_root",
    children: ["node_title", "node_nested"],
    props: {},
    style: {},
    events: [],
  };
  project.nodes["node_nested"] = {
    id: "node_nested",
    type: "View",
    name: "Nested View",
    parentId: "node_outer",
    children: ["node_cta"],
    props: {},
    style: {},
    events: [],
  };
  project.nodes["node_root"] = {
    ...project.nodes["node_root"]!,
    children: ["node_outer"],
  };
  project.nodes["node_title"] = {
    ...project.nodes["node_title"]!,
    parentId: "node_outer",
  };
  project.nodes["node_cta"] = {
    ...project.nodes["node_cta"]!,
    parentId: "node_nested",
  };
  return project;
}

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
  it("renders Text inside its View and nested Views recursively", () => {
    const project = createNestedProjectFixture();
    render(<EditorCanvas project={project} screenId={project.initialScreenId} screenName="Home" />);

    const outerView = screen.getByRole("button", { name: "Select Outer View" });
    const nestedView = screen.getByRole("button", { name: "Select Nested View" });
    const text = screen.getByRole("button", { name: "Select Title" });
    const button = screen.getByRole("button", { name: "Select Primary Action" });

    expect(outerView).toContainElement(text);
    expect(outerView).toContainElement(nestedView);
    expect(nestedView).toContainElement(button);
  });

  it("selects a nested child without also selecting its parent", () => {
    const project = createNestedProjectFixture();
    render(<EditorCanvas project={project} screenId={project.initialScreenId} screenName="Home" />);

    const outerView = screen.getByRole("button", { name: "Select Outer View" });
    const text = screen.getByRole("button", { name: "Select Title" });

    fireEvent.click(text);

    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_title");
    expect(text).toHaveAttribute("aria-pressed", "true");
    expect(outerView).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(outerView);

    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_outer");
    expect(outerView).toHaveAttribute("aria-pressed", "true");
    expect(text).toHaveAttribute("aria-pressed", "false");
  });

  it("selects rendered components, moves the marker, and clears from the canvas", () => {
    const project = createMinimalProjectFixture();
    render(<EditorCanvas project={project} screenId={project.initialScreenId} screenName="Home" />);

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
        <EditorCanvas project={project} screenId={project.initialScreenId} screenName="Home" />
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
    const project = createMinimalProjectFixture();
    useEditorStore.getState().selectNode("node_missing");

    render(<EditorCanvas project={project} screenId={project.initialScreenId} screenName="Home" />);

    expect(useEditorStore.getState().selection.primaryNodeId).toBeNull();
  });
});
