import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  ReactivelyProjectSchema,
  createMinimalProjectFixture,
  type ReactivelyProject,
} from "@reactively/project-schema";
import { beforeEach, describe, expect, it } from "vitest";

import { EditorCanvas } from "@/components/editor/editor-canvas";
import { EditorInspector } from "@/components/editor/editor-inspector";
import { LayersPanel } from "@/components/editor/layers/layers-panel";
import { useEditorStore } from "@/lib/state/editor-store";
import { useProjectStore } from "@/lib/state/project-store";

beforeEach(() => {
  useEditorStore.getState().reset();
  useProjectStore.getState().clearProject();
});

function createEmptyScreenFixture(): ReactivelyProject {
  const project = createMinimalProjectFixture();
  project.nodes["node_root"] = { ...project.nodes["node_root"]!, children: [] };
  delete project.nodes["node_title"];
  delete project.nodes["node_cta"];
  return project;
}

function createNestedLayersFixture(): ReactivelyProject {
  const project = createMinimalProjectFixture();
  project.nodes["node_outer"] = {
    id: "node_outer",
    type: "View",
    name: "Outer View",
    parentId: "node_root",
    children: ["node_title", "node_cta", "node_inner"],
    props: {},
    style: {},
    events: [],
  };
  project.nodes["node_inner"] = {
    id: "node_inner",
    type: "View",
    name: "Inner View",
    parentId: "node_outer",
    children: ["node_deep_text"],
    props: {},
    style: {},
    events: [],
  };
  project.nodes["node_deep_text"] = {
    id: "node_deep_text",
    type: "Text",
    name: "Deep Text",
    parentId: "node_inner",
    children: [],
    props: { content: "Nested" },
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
    parentId: "node_outer",
  };
  return project;
}

function renderLayers(project: ReactivelyProject = createNestedLayersFixture()) {
  return render(<LayersPanel project={project} screenId={project.initialScreenId} />);
}

function getLayerRow(nodeId: string): HTMLElement {
  const row = document.querySelector<HTMLElement>(`[data-layer-node-id="${nodeId}"]`);
  if (!row) {
    throw new Error(`Layer row ${nodeId} was not rendered.`);
  }
  return row;
}

describe("LayersPanel hierarchy", () => {
  it("renders the screen root and an empty state without exposing the synthetic root node", () => {
    renderLayers(createEmptyScreenFixture());

    expect(screen.getByRole("tree", { name: "Home layers" })).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: "Home (Screen)" })).toBeInTheDocument();
    expect(screen.getByText("No components")).toBeInTheDocument();
    expect(screen.queryByText("Screen Root")).not.toBeInTheDocument();
  });

  it("renders root View, Text and Button nodes from registry labels", () => {
    const project = createMinimalProjectFixture();
    project.nodes["node_root"] = {
      ...project.nodes["node_root"]!,
      children: ["node_added_view", "node_title", "node_cta"],
    };
    project.nodes["node_added_view"] = {
      id: "node_added_view",
      type: "View",
      name: "Custom container name",
      parentId: "node_root",
      children: [],
      props: {},
      style: {},
      events: [],
    };

    renderLayers(project);

    expect(
      screen.getByRole("button", { name: "Select Custom container name layer" }),
    ).toHaveTextContent("View");
    expect(screen.getByRole("button", { name: "Select Title layer" })).toHaveTextContent("Text");
    expect(screen.getByRole("button", { name: "Select Primary Action layer" })).toHaveTextContent(
      "Button",
    );
  });

  it("renders ordered children recursively with deterministic hierarchy depth", () => {
    renderLayers();

    expect(getLayerRow("node_outer")).toHaveAttribute("data-layer-depth", "0");
    expect(getLayerRow("node_title")).toHaveAttribute("data-layer-depth", "1");
    expect(getLayerRow("node_cta")).toHaveAttribute("data-layer-depth", "1");
    expect(getLayerRow("node_inner")).toHaveAttribute("data-layer-depth", "1");
    expect(getLayerRow("node_deep_text")).toHaveAttribute("data-layer-depth", "2");
    expect(getLayerRow("node_outer")).toHaveAttribute("aria-level", "2");
    expect(getLayerRow("node_deep_text")).toHaveAttribute("aria-level", "4");
  });

  it("gives only registry containers an expand affordance", () => {
    renderLayers();

    expect(screen.getAllByRole("button", { name: "Collapse View layer" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Collapse Text layer" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Collapse Button layer" })).not.toBeInTheDocument();
  });

  it("collapses and expands descendants without changing the project document", () => {
    const project = createNestedLayersFixture();
    const beforeDisclosure = structuredClone(project);
    renderLayers(project);

    fireEvent.click(screen.getAllByRole("button", { name: "Collapse View layer" })[0]!);
    expect(screen.queryByRole("button", { name: "Select Title layer" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Select Deep Text layer" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand View layer" }));
    expect(screen.getByRole("button", { name: "Select Title layer" })).toBeInTheDocument();
    expect(project).toEqual(beforeDisclosure);
    expect(ReactivelyProjectSchema.safeParse(project).success).toBe(true);
  });
});

describe("LayersPanel selection synchronization", () => {
  it("selects a layer through the shared editor selection action and replaces it", () => {
    renderLayers();

    fireEvent.click(screen.getByRole("button", { name: "Select Title layer" }));
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_title");
    expect(getLayerRow("node_title")).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("button", { name: "Select Primary Action layer" }));
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");
    expect(getLayerRow("node_title")).toHaveAttribute("aria-selected", "false");
    expect(getLayerRow("node_cta")).toHaveAttribute("aria-selected", "true");
  });

  it("synchronizes Layers, canvas and Inspector through the same selection state", () => {
    const project = createNestedLayersFixture();
    useProjectStore.getState().loadProject(project);
    render(
      <>
        <LayersPanel project={project} screenId={project.initialScreenId} />
        <EditorCanvas project={project} screenId={project.initialScreenId} screenName="Home" />
        <EditorInspector />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Select Deep Text layer" }));
    expect(screen.getByRole("button", { name: "Select Deep Text" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("heading", { name: "Text" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Select Primary Action" }));
    expect(getLayerRow("node_cta")).toHaveAttribute("aria-selected", "true");
    expect(getLayerRow("node_deep_text")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("heading", { name: "Button" })).toBeInTheDocument();
  });

  it("automatically expands collapsed ancestors when the canvas selects a descendant", () => {
    const project = createNestedLayersFixture();
    render(
      <>
        <LayersPanel project={project} screenId={project.initialScreenId} />
        <EditorCanvas project={project} screenId={project.initialScreenId} screenName="Home" />
      </>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Collapse View layer" })[0]!);
    expect(
      screen.queryByRole("button", { name: "Select Deep Text layer" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Select Deep Text" }));
    expect(screen.getByRole("button", { name: "Select Deep Text layer" })).toBeInTheDocument();
    expect(getLayerRow("node_deep_text")).toHaveAttribute("aria-selected", "true");
  });
});

describe("LayersPanel canonical project updates", () => {
  it("reflects a newly added canonical node without maintaining a second hierarchy", () => {
    const initialProject = createEmptyScreenFixture();
    useProjectStore.getState().loadProject(initialProject);

    function StoreBackedLayers() {
      const project = useProjectStore((state) => state.project);
      return project ? <LayersPanel project={project} screenId={project.initialScreenId} /> : null;
    }

    render(<StoreBackedLayers />);
    expect(
      screen.queryByRole("button", { name: "Select Added Text layer" }),
    ).not.toBeInTheDocument();

    act(() => {
      useProjectStore.getState().applyMutation("Add test node", (project) => ({
        ok: true,
        value: {
          ...project,
          nodes: {
            ...project.nodes,
            node_root: { ...project.nodes["node_root"]!, children: ["node_added"] },
            node_added: {
              id: "node_added",
              type: "Text",
              name: "Added Text",
              parentId: "node_root",
              children: [],
              props: { content: "Added" },
              style: {},
              events: [],
            },
          },
        },
      }));
    });

    expect(screen.getByRole("button", { name: "Select Added Text layer" })).toHaveTextContent(
      "Text",
    );
  });
});
