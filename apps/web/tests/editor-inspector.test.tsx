import "fake-indexeddb/auto";

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  ReactivelyProjectSchema,
  createMinimalProjectFixture,
  percent,
  points,
  type ReactivelyProject,
} from "@reactively/project-schema";
import { beforeEach, describe, expect, it } from "vitest";

import { EditorInspector } from "@/components/editor/editor-inspector";
import { useEditorStore } from "@/lib/state/editor-store";
import { selectProjectNode, useProjectStore } from "@/lib/state/project-store";

function renderInspector(project: ReactivelyProject = createMinimalProjectFixture()) {
  useProjectStore.getState().loadProject(project);
  return render(
    <div className="flex h-[800px]">
      <EditorInspector />
    </div>,
  );
}

async function chooseInspectorOption(label: string, option: string) {
  fireEvent.click(screen.getByRole("combobox", { name: label }));
  fireEvent.click(await screen.findByRole("option", { name: option }));
}

beforeEach(() => {
  useEditorStore.getState().reset();
  useProjectStore.getState().clearProject();
});

describe("selected project node lookup", () => {
  it("resolves the selected ID from the canonical project document", () => {
    const project = createMinimalProjectFixture();
    useProjectStore.getState().loadProject(project);

    expect(selectProjectNode(useProjectStore.getState(), "node_title")).toBe(
      project.nodes["node_title"],
    );
    expect(selectProjectNode(useProjectStore.getState(), null)).toBeNull();
    expect(selectProjectNode(useProjectStore.getState(), "node_missing")).toBeNull();
  });
});

describe("editor inspector", () => {
  it("shows the empty state when no component is selected", () => {
    renderInspector();

    expect(screen.getByRole("heading", { name: "Inspector" })).toBeInTheDocument();
    expect(screen.getByText("No component selected")).toBeInTheDocument();
  });

  it.each([
    ["node_root", "View"],
    ["node_title", "Text"],
    ["node_cta", "Button"],
  ])("shows %s as %s using registry metadata", (nodeId, label) => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode(nodeId));

    expect(screen.getByRole("heading", { name: label })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Properties" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Style" })).toBeInTheDocument();
  });

  it("shows Text Properties and edits the canonical content without changing other nodes", async () => {
    const project = createMinimalProjectFixture();
    const originalButton = project.nodes["node_cta"];
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_title"));

    expect(screen.getByRole("heading", { name: "Text Properties" })).toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: "Text" });
    expect(input).toHaveValue("Hello from Reactively");

    fireEvent.click(input);
    fireEvent.change(input, { target: { value: "Hello Reactively" } });

    const updatedProject = useProjectStore.getState().project;
    expect(updatedProject?.nodes["node_title"]?.props.content).toBe("Hello Reactively");
    expect(updatedProject?.nodes["node_cta"]).toBe(originalButton);
    expect(project.nodes["node_title"]?.props.content).toBe("Hello from Reactively");
    expect(ReactivelyProjectSchema.safeParse(updatedProject).success).toBe(true);
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_title");
    expect(input).toHaveValue("Hello Reactively");

    await waitFor(() => expect(useProjectStore.getState().isDirty).toBe(false));
  });

  it("shows Button Properties and edits its canonical label", async () => {
    renderInspector(createMinimalProjectFixture());

    act(() => useEditorStore.getState().selectNode("node_cta"));

    expect(screen.getByRole("heading", { name: "Button Properties" })).toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: "Title" });
    expect(input).toHaveValue("Get started");

    fireEvent.change(input, { target: { value: "Get Started" } });

    expect(useProjectStore.getState().project?.nodes["node_cta"]?.props.label).toBe("Get Started");
    expect(useProjectStore.getState().project?.nodes["node_title"]?.props.content).toBe(
      "Hello from Reactively",
    );
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");

    await waitFor(() => expect(useProjectStore.getState().isDirty).toBe(false));
  });

  it("keeps View clean without Text or Button controls", () => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode("node_root"));

    expect(screen.getByRole("heading", { name: "Component" })).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Text Properties" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Button Properties" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Text" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Title" })).not.toBeInTheDocument();
  });

  it("derives the direct parent from the screen hierarchy", () => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode("node_title"));

    expect(screen.getByRole("textbox", { name: "Parent Component" })).toHaveTextContent(
      "Home (Screen)",
    );
  });

  it("switches tabs in editor state without modifying the project document", () => {
    const project = createMinimalProjectFixture();
    const beforeTabChange = structuredClone(project);
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_title"));
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Style" }), {
      button: 0,
      ctrlKey: false,
    });

    expect(useEditorStore.getState().activeInspectorPanel).toBe("style");
    expect(screen.getByText("Style editing will be added in a future milestone.")).toBeVisible();
    expect(useProjectStore.getState().project).toEqual(beforeTabChange);
  });

  it("updates with selection changes, clears cleanly, and handles missing IDs", () => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode("node_title"));
    expect(screen.getByRole("heading", { name: "Text Properties" })).toBeInTheDocument();

    act(() => useEditorStore.getState().selectNode("node_cta"));
    expect(screen.getByRole("heading", { name: "Button Properties" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Text Properties" })).not.toBeInTheDocument();

    act(() => useEditorStore.getState().selectNode("node_missing"));
    expect(screen.getByRole("heading", { name: "Inspector" })).toBeInTheDocument();
    expect(screen.getByText("No component selected")).toBeInTheDocument();

    act(() => useEditorStore.getState().clearSelection());
    expect(screen.getByText("No component selected")).toBeInTheDocument();
  });
});

describe("position and layout inspector", () => {
  it.each([
    ["node_root", "View"],
    ["node_title", "Text"],
    ["node_cta", "Button"],
  ])("shows Position & Layout for %s", (nodeId, label) => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode(nodeId));

    expect(screen.getByRole("heading", { name: label })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Position & Layout" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Position" })).toHaveAttribute(
      "data-value",
      "relative",
    );
  });

  it("stores Absolute as position and Relative by omitting the default", async () => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode("node_cta"));
    await chooseInspectorOption("Position", "Absolute");

    expect(useProjectStore.getState().project?.nodes["node_cta"]?.style.position).toBe("absolute");
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");

    await chooseInspectorOption("Position", "Relative");

    expect(useProjectStore.getState().project?.nodes["node_cta"]?.style.position).toBeUndefined();
    expect(ReactivelyProjectSchema.safeParse(useProjectStore.getState().project).success).toBe(
      true,
    );

    await waitFor(() => expect(useProjectStore.getState().isDirty).toBe(false));
  });

  it("updates X as left and Y as top on the selected node only", async () => {
    const project = createMinimalProjectFixture();
    const originalTitle = project.nodes["node_title"];
    const originalButtonProps = project.nodes["node_cta"]?.props;
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_cta"));
    await chooseInspectorOption("Position", "Absolute");

    fireEvent.change(screen.getByRole("textbox", { name: "X" }), { target: { value: "20" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Y" }), { target: { value: "40" } });

    const updated = useProjectStore.getState().project?.nodes["node_cta"];
    expect(updated?.style.left).toEqual(points(20));
    expect(updated?.style.top).toEqual(points(40));
    expect(updated?.style.position).toBe("absolute");
    expect(updated?.props).toEqual(originalButtonProps);
    expect(useProjectStore.getState().project?.nodes["node_title"]).toBe(originalTitle);
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");
    expect(ReactivelyProjectSchema.safeParse(useProjectStore.getState().project).success).toBe(
      true,
    );

    await waitFor(() => expect(useProjectStore.getState().isDirty).toBe(false));
  });

  it("hides X and Y while the selected node is relatively positioned", () => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode("node_title"));

    expect(screen.getByRole("combobox", { name: "Position" })).toHaveAttribute(
      "data-value",
      "relative",
    );
    expect(screen.queryByRole("textbox", { name: "X" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Y" })).not.toBeInTheDocument();
  });

  it("updates width and height on the selected node only", async () => {
    const project = createMinimalProjectFixture();
    const originalTitleStyle = project.nodes["node_title"]?.style;
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_title"));
    await chooseInspectorOption("Width", "Fixed");
    fireEvent.change(screen.getByRole("textbox", { name: "Width value" }), {
      target: { value: "120" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Height" }), {
      target: { value: "56" },
    });

    expect(useProjectStore.getState().project?.nodes["node_title"]?.style.width).toEqual(
      points(120),
    );
    expect(useProjectStore.getState().project?.nodes["node_title"]?.style.height).toEqual(
      points(56),
    );
    expect(useProjectStore.getState().project?.nodes["node_title"]?.style.fontSize).toBe(
      originalTitleStyle?.fontSize,
    );
    expect(useProjectStore.getState().project?.nodes["node_cta"]?.style.width).toEqual(points(200));
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_title");

    await waitFor(() => expect(useProjectStore.getState().isDirty).toBe(false));
  });

  it("stores Fill width as 100 percent", async () => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode("node_cta"));
    await chooseInspectorOption("Width", "Fill");

    expect(useProjectStore.getState().project?.nodes["node_cta"]?.style.width).toEqual(
      percent(100),
    );
    expect(useProjectStore.getState().project?.nodes["node_cta"]?.props.label).toBe("Get started");

    await waitFor(() => expect(useProjectStore.getState().isDirty).toBe(false));
  });

  it("does not write NaN when numeric layout input is invalid", () => {
    const project = createMinimalProjectFixture();
    const beforeStyle = project.nodes["node_cta"]?.style;
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_cta"));
    fireEvent.change(screen.getByRole("textbox", { name: "Width value" }), {
      target: { value: "nope" },
    });
    fireEvent.blur(screen.getByRole("textbox", { name: "Width value" }));

    const width = useProjectStore.getState().project?.nodes["node_cta"]?.style.width;
    expect(width).toEqual(beforeStyle?.width);
    expect(width).toEqual(points(200));
    expect(width && width.type === "points" ? Number.isNaN(width.value) : false).toBe(false);
    expect(useProjectStore.getState().project?.nodes["node_cta"]?.style).toEqual(beforeStyle);
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");
  });

  it("does not mutate the project when Position & Layout mounts", () => {
    const project = createMinimalProjectFixture();
    const beforeMount = structuredClone(project);
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_cta"));

    expect(useProjectStore.getState().project).toEqual(beforeMount);
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");
  });

  it("places the Fixed width input beside the Width dropdown", () => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode("node_cta"));

    const widthControl = screen.getByRole("combobox", { name: "Width" });
    const widthValue = screen.getByRole("textbox", { name: "Width value" });
    const sharedRow = widthControl.parentElement?.parentElement;

    expect(sharedRow).toContainElement(widthValue);
    expect(sharedRow).not.toContainElement(screen.getByRole("textbox", { name: "Height" }));
  });

  it("points the dropdown caret up while the menu is open", async () => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode("node_cta"));
    const position = screen.getByRole("combobox", { name: "Position" });
    expect(position).toHaveAttribute("data-state", "closed");

    fireEvent.click(position);

    const absolute = await screen.findByRole("option", { name: "Absolute" });
    expect(absolute).toBeInTheDocument();
    expect(absolute.closest(".editor-theme")).not.toBeNull();
    expect(position).toHaveAttribute("data-state", "open");
  });
});

describe("margin and padding inspector", () => {
  const spacingFields = [
    "Margin top",
    "Margin right",
    "Margin bottom",
    "Margin left",
    "Padding top",
    "Padding right",
    "Padding bottom",
    "Padding left",
  ] as const;

  it.each([
    ["node_root", "View"],
    ["node_title", "Text"],
    ["node_cta", "Button"],
  ])("shows Margin and Padding side fields for %s", (nodeId, label) => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode(nodeId));

    expect(screen.getByRole("heading", { name: label })).toBeInTheDocument();
    expect(screen.getByText("Margin")).toBeInTheDocument();
    expect(screen.getByText("Padding")).toBeInTheDocument();

    for (const name of spacingFields) {
      expect(screen.getByRole("textbox", { name })).toBeInTheDocument();
    }
  });

  it("places Margin and Padding in adjacent 2x2 grids with in-field labels", () => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode("node_cta"));

    const marginTop = screen.getByRole("textbox", { name: "Margin top" });
    const marginGrid = marginTop.parentElement?.parentElement;
    expect(marginGrid).toContainElement(screen.getByRole("textbox", { name: "Margin right" }));
    expect(marginGrid).toContainElement(screen.getByRole("textbox", { name: "Margin bottom" }));
    expect(marginGrid).toContainElement(screen.getByRole("textbox", { name: "Margin left" }));
    expect(marginGrid).not.toContainElement(screen.getByRole("textbox", { name: "Padding top" }));
    expect(marginTop.parentElement).toHaveTextContent("T");

    const paddingGrid = screen.getByRole("textbox", { name: "Padding top" }).parentElement?.parentElement;
    expect(paddingGrid).toContainElement(screen.getByRole("textbox", { name: "Padding left" }));
    expect(paddingGrid).not.toContainElement(screen.getByRole("textbox", { name: "Margin top" }));

    const pairedSections = screen.getByText("Margin").parentElement?.parentElement;
    expect(pairedSections).toContainElement(screen.getByText("Padding"));
    expect(pairedSections).toContainElement(marginTop);
    expect(pairedSections).toContainElement(screen.getByRole("textbox", { name: "Padding left" }));
  });

  it.each([
    ["top", "Margin top", { top: 16 }],
    ["right", "Margin right", { right: 20 }],
    ["bottom", "Margin bottom", { bottom: 8 }],
    ["left", "Margin left", { left: 16 }],
  ] as const)("updates only margin %s on the selected node", async (_edge, field, expected) => {
    const project = createMinimalProjectFixture();
    const originalTitle = project.nodes["node_title"];
    const originalButtonProps = project.nodes["node_cta"]?.props;
    const originalWidth = project.nodes["node_cta"]?.style.width;
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_cta"));
    fireEvent.change(screen.getByRole("textbox", { name: field }), {
      target: { value: String(Object.values(expected)[0]) },
    });

    const updated = useProjectStore.getState().project?.nodes["node_cta"];
    expect(updated?.style.margin).toEqual(expected);
    expect(updated?.style.padding).toBeUndefined();
    expect(updated?.style.width).toEqual(originalWidth);
    expect(updated?.props).toEqual(originalButtonProps);
    expect(useProjectStore.getState().project?.nodes["node_title"]).toBe(originalTitle);
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");
    expect(ReactivelyProjectSchema.safeParse(useProjectStore.getState().project).success).toBe(
      true,
    );

    await waitFor(() => expect(useProjectStore.getState().isDirty).toBe(false));
  });

  it.each([
    ["top", "Padding top", { top: 12 }],
    ["right", "Padding right", { right: 24 }],
    ["bottom", "Padding bottom", { bottom: 12 }],
    ["left", "Padding left", { left: 24 }],
  ] as const)("updates only padding %s on the selected node", async (_edge, field, expected) => {
    const project = createMinimalProjectFixture();
    const originalTitle = project.nodes["node_title"];
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_cta"));
    fireEvent.change(screen.getByRole("textbox", { name: field }), {
      target: { value: String(Object.values(expected)[0]) },
    });

    const updated = useProjectStore.getState().project?.nodes["node_cta"];
    expect(updated?.style.padding).toEqual(expected);
    expect(updated?.style.margin).toBeUndefined();
    expect(updated?.style.width).toEqual(points(200));
    expect(useProjectStore.getState().project?.nodes["node_title"]).toBe(originalTitle);
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");
    expect(ReactivelyProjectSchema.safeParse(useProjectStore.getState().project).success).toBe(
      true,
    );

    await waitFor(() => expect(useProjectStore.getState().isDirty).toBe(false));
  });

  it("preserves existing style values when one spacing side changes", async () => {
    const project = createMinimalProjectFixture();
    const button = project.nodes["node_cta"];
    if (!button) {
      throw new Error("Fixture is missing the button node.");
    }

    project.nodes["node_cta"] = {
      ...button,
      style: {
        width: points(200),
        height: points(56),
        margin: { top: 16, right: 16, bottom: 0, left: 16 },
        padding: { top: 12, right: 20, bottom: 12, left: 20 },
      },
    };
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_cta"));
    fireEvent.change(screen.getByRole("textbox", { name: "Padding left" }), {
      target: { value: "24" },
    });

    expect(useProjectStore.getState().project?.nodes["node_cta"]?.style).toEqual({
      width: points(200),
      height: points(56),
      margin: { top: 16, right: 16, bottom: 0, left: 16 },
      padding: { top: 12, right: 20, bottom: 12, left: 24 },
    });
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");

    await waitFor(() => expect(useProjectStore.getState().isDirty).toBe(false));
  });

  it("does not write NaN when spacing input is invalid", () => {
    const project = createMinimalProjectFixture();
    const beforeStyle = project.nodes["node_cta"]?.style;
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_cta"));
    fireEvent.change(screen.getByRole("textbox", { name: "Margin top" }), {
      target: { value: "nope" },
    });
    fireEvent.blur(screen.getByRole("textbox", { name: "Margin top" }));

    const margin = useProjectStore.getState().project?.nodes["node_cta"]?.style.margin;
    expect(margin).toBeUndefined();
    expect(useProjectStore.getState().project?.nodes["node_cta"]?.style).toEqual(beforeStyle);
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");
  });

  it("keeps selection stable while editing spacing", async () => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode("node_title"));
    fireEvent.click(screen.getByRole("textbox", { name: "Padding right" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Padding right" }), {
      target: { value: "24" },
    });

    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_title");
    expect(screen.getByRole("heading", { name: "Text" })).toBeInTheDocument();

    await waitFor(() => expect(useProjectStore.getState().isDirty).toBe(false));
  });

  it("does not mutate the project when spacing controls mount", () => {
    const project = createMinimalProjectFixture();
    const beforeMount = structuredClone(project);
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_root"));

    expect(useProjectStore.getState().project).toEqual(beforeMount);
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_root");
  });
});

describe("flexbox inspector", () => {
  it.each([
    ["node_root", "View"],
    ["node_title", "Text"],
    ["node_cta", "Button"],
  ])("shows Flexbox for %s", (nodeId, label) => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode(nodeId));

    expect(screen.getByRole("heading", { name: label })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Flexbox" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Flex Grow" })).toHaveValue("0");
    expect(screen.getByRole("textbox", { name: "Flex Shrink" })).toHaveValue("0");
    expect(screen.getByRole("combobox", { name: "Align Self" })).toHaveAttribute("data-value", "auto");
  });

  it("places Flexbox between Position & Layout and component-specific properties", () => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode("node_cta"));

    const headings = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(headings).toEqual(["Position & Layout", "Flexbox", "Button Properties"]);
  });

  it("updates flexGrow on the selected node only", async () => {
    const project = createMinimalProjectFixture();
    const originalTitle = project.nodes["node_title"];
    const originalButtonProps = project.nodes["node_cta"]?.props;
    const originalWidth = project.nodes["node_cta"]?.style.width;
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_cta"));
    fireEvent.change(screen.getByRole("textbox", { name: "Flex Grow" }), {
      target: { value: "1" },
    });

    const updated = useProjectStore.getState().project?.nodes["node_cta"];
    expect(updated?.style.flexGrow).toBe(1);
    expect(updated?.style.flexShrink).toBeUndefined();
    expect(updated?.style.alignSelf).toBeUndefined();
    expect(updated?.style.width).toEqual(originalWidth);
    expect(updated?.props).toEqual(originalButtonProps);
    expect(useProjectStore.getState().project?.nodes["node_title"]).toBe(originalTitle);
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");
    expect(ReactivelyProjectSchema.safeParse(useProjectStore.getState().project).success).toBe(
      true,
    );

    await waitFor(() => expect(useProjectStore.getState().isDirty).toBe(false));
  });

  it("updates flexShrink on the selected node only", async () => {
    const project = createMinimalProjectFixture();
    const originalTitle = project.nodes["node_title"];
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_cta"));
    fireEvent.change(screen.getByRole("textbox", { name: "Flex Shrink" }), {
      target: { value: "1" },
    });

    expect(useProjectStore.getState().project?.nodes["node_cta"]?.style.flexShrink).toBe(1);
    expect(useProjectStore.getState().project?.nodes["node_cta"]?.style.flexGrow).toBeUndefined();
    expect(useProjectStore.getState().project?.nodes["node_title"]).toBe(originalTitle);
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");
    expect(ReactivelyProjectSchema.safeParse(useProjectStore.getState().project).success).toBe(
      true,
    );

    await waitFor(() => expect(useProjectStore.getState().isDirty).toBe(false));
  });

  it("updates alignSelf to a supported canonical value", async () => {
    const project = createMinimalProjectFixture();
    const originalTitle = project.nodes["node_title"];
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_cta"));
    await chooseInspectorOption("Align Self", "Center");

    expect(useProjectStore.getState().project?.nodes["node_cta"]?.style.alignSelf).toBe("center");
    expect(useProjectStore.getState().project?.nodes["node_title"]).toBe(originalTitle);
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");
    expect(ReactivelyProjectSchema.safeParse(useProjectStore.getState().project).success).toBe(
      true,
    );

    await waitFor(() => expect(useProjectStore.getState().isDirty).toBe(false));
  });

  it("exposes only supported Align Self values", async () => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode("node_title"));
    fireEvent.click(screen.getByRole("combobox", { name: "Align Self" }));

    expect(await screen.findByRole("option", { name: "Auto" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Flex Start" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Flex End" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Center" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Stretch" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Baseline" })).not.toBeInTheDocument();
  });

  it("preserves existing style values when one Flexbox property changes", async () => {
    const project = createMinimalProjectFixture();
    const button = project.nodes["node_cta"];
    if (!button) {
      throw new Error("Fixture is missing the button node.");
    }

    project.nodes["node_cta"] = {
      ...button,
      style: {
        width: points(200),
        height: points(56),
        flexGrow: 1,
        flexShrink: 0,
        alignSelf: "stretch",
        margin: { top: 16 },
      },
    };
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_cta"));
    await chooseInspectorOption("Align Self", "Center");

    expect(useProjectStore.getState().project?.nodes["node_cta"]?.style).toEqual({
      width: points(200),
      height: points(56),
      flexGrow: 1,
      flexShrink: 0,
      alignSelf: "center",
      margin: { top: 16 },
    });
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");

    await waitFor(() => expect(useProjectStore.getState().isDirty).toBe(false));
  });

  it("does not write NaN when Flexbox numeric input is invalid", () => {
    const project = createMinimalProjectFixture();
    const beforeStyle = project.nodes["node_cta"]?.style;
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_cta"));
    fireEvent.change(screen.getByRole("textbox", { name: "Flex Grow" }), {
      target: { value: "nope" },
    });
    fireEvent.blur(screen.getByRole("textbox", { name: "Flex Grow" }));

    const flexGrow = useProjectStore.getState().project?.nodes["node_cta"]?.style.flexGrow;
    expect(flexGrow).toBeUndefined();
    expect(Number.isNaN(flexGrow)).toBe(false);
    expect(useProjectStore.getState().project?.nodes["node_cta"]?.style).toEqual(beforeStyle);
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");
  });

  it("keeps selection stable while editing Flexbox values", async () => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode("node_title"));
    fireEvent.click(screen.getByRole("textbox", { name: "Flex Grow" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Flex Grow" }), {
      target: { value: "1" },
    });
    await chooseInspectorOption("Align Self", "Center");

    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_title");
    expect(screen.getByRole("heading", { name: "Text" })).toBeInTheDocument();

    await waitFor(() => expect(useProjectStore.getState().isDirty).toBe(false));
  });

  it("does not mutate the project when Flexbox mounts", () => {
    const project = createMinimalProjectFixture();
    const beforeMount = structuredClone(project);
    renderInspector(project);

    act(() => useEditorStore.getState().selectNode("node_cta"));

    expect(useProjectStore.getState().project).toEqual(beforeMount);
    expect(useProjectStore.getState().project?.nodes["node_cta"]?.style.flexGrow).toBeUndefined();
    expect(useProjectStore.getState().project?.nodes["node_cta"]?.style.flexShrink).toBeUndefined();
    expect(useProjectStore.getState().project?.nodes["node_cta"]?.style.alignSelf).toBeUndefined();
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");
  });

  it("still updates Position and spacing after Flexbox is present", async () => {
    renderInspector();

    act(() => useEditorStore.getState().selectNode("node_cta"));
    await chooseInspectorOption("Position", "Absolute");
    fireEvent.change(screen.getByRole("textbox", { name: "X" }), { target: { value: "20" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Margin top" }), {
      target: { value: "16" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Flex Grow" }), {
      target: { value: "1" },
    });

    const updated = useProjectStore.getState().project?.nodes["node_cta"]?.style;
    expect(updated?.position).toBe("absolute");
    expect(updated?.left).toEqual(points(20));
    expect(updated?.margin).toEqual({ top: 16 });
    expect(updated?.flexGrow).toBe(1);
    expect(useEditorStore.getState().selection.primaryNodeId).toBe("node_cta");

    await waitFor(() => expect(useProjectStore.getState().isDirty).toBe(false));
  });
});
