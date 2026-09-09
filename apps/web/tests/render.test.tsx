import { fireEvent, render, screen } from "@testing-library/react";
import { createMinimalProjectFixture } from "@reactively/project-schema";
import { Tooltip as RadixTooltip } from "radix-ui";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { EditorInspector } from "@/components/editor/editor-inspector";
import { EditorPreview } from "@/components/editor/editor-preview";
import { EditorSidebar } from "@/components/editor/editor-sidebar";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { Hero } from "@/components/marketing/hero";
import { Button } from "@/components/ui/button";

describe("marketing landing page", () => {
  it("renders the product name, tagline and call to action", () => {
    render(<Hero />);

    expect(screen.getByRole("heading", { name: "Reactively" })).toBeInTheDocument();
    expect(screen.getByText("React Native, visually.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Reactively" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});

describe("editor shell regions", () => {
  it("renders the editor rail and component insertion controls", () => {
    const project = createMinimalProjectFixture();
    render(
      <EditorSidebar
        project={project}
        screenId="screen_home"
        screenName="Home"
        rootNodeId="node_root"
      />,
    );

    expect(screen.getByRole("heading", { name: "Pages" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Layers" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Component Library" })).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Home (Screen)")).toBeInTheDocument();
    expect(screen.queryByText("Screen Root")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add View" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Add Text" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Button" })).toBeInTheDocument();
  });

  it("filters the component library by component label", () => {
    const project = createMinimalProjectFixture();
    render(
      <EditorSidebar
        project={project}
        screenId="screen_home"
        screenName="Home"
        rootNodeId="node_root"
      />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Search components" }), {
      target: { value: "button" },
    });

    expect(screen.getByRole("button", { name: "Add Button" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Text" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add View" })).not.toBeInTheDocument();
  });

  it("renders the inspector region", () => {
    render(<EditorInspector />);

    expect(screen.getByRole("heading", { name: "Inspector" })).toBeInTheDocument();
    expect(screen.getByText("No component selected")).toBeInTheDocument();
  });

  it("keeps project context static and switches editor layouts through tabs", () => {
    const onSelectSection = vi.fn();

    render(
      <RadixTooltip.Provider>
        <EditorToolbar
          projectName="Untitled Project"
          activeSection="design"
          onSelectSection={onSelectSection}
          onRenameProject={vi.fn().mockResolvedValue(true)}
        />
      </RadixTooltip.Provider>,
    );

    expect(screen.getByRole("button", { name: "Untitled Project" })).toHaveClass(
      "hover:bg-primary-soft",
    );
    expect(screen.getByRole("button", { name: "Save project" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Design" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("link", { name: "Preview" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Preview" }));
    expect(onSelectSection).toHaveBeenCalledWith("preview");
  });

  it("renames the project inline when Enter is pressed", async () => {
    function ToolbarHarness() {
      const [projectName, setProjectName] = useState("Untitled Project");

      return (
        <RadixTooltip.Provider>
          <EditorToolbar
            projectName={projectName}
            activeSection="design"
            onSelectSection={vi.fn()}
            onRenameProject={async (name) => {
              setProjectName(name);
              return true;
            }}
          />
        </RadixTooltip.Provider>
      );
    }

    render(<ToolbarHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Untitled Project" }));
    const nameInput = screen.getByRole("textbox", { name: "Project name" });
    expect(nameInput).toHaveFocus();
    expect(nameInput.parentElement).toHaveClass("w-auto", "max-w-44", "transition-[width]");

    fireEvent.change(nameInput, { target: { value: "Renamed Project" } });
    fireEvent.keyDown(nameInput, { key: "Enter" });

    expect(await screen.findByRole("button", { name: "Renamed Project" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Project name" })).not.toBeInTheDocument();
  });

  it("saves the inline project name when focus moves outside the input", async () => {
    const renameProject = vi.fn().mockResolvedValue(true);

    render(
      <RadixTooltip.Provider>
        <EditorToolbar
          projectName="Untitled Project"
          activeSection="design"
          onSelectSection={vi.fn()}
          onRenameProject={renameProject}
        />
      </RadixTooltip.Provider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Untitled Project" }));
    const nameInput = screen.getByRole("textbox", { name: "Project name" });
    fireEvent.change(nameInput, { target: { value: "Saved On Blur" } });
    fireEvent.blur(nameInput);

    expect(renameProject).toHaveBeenCalledWith("Saved On Blur");
    expect(await screen.findByRole("button", { name: "Untitled Project" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Project name" })).not.toBeInTheDocument();
  });

  it("embeds the isolated preview route inside the editor preview layout", () => {
    render(<EditorPreview projectId="project_1" />);

    expect(screen.getByTitle("Application preview")).toHaveAttribute("src", "/preview/project_1");
  });
});

describe("ui primitives", () => {
  it("renders a button and supports rendering as a child element", () => {
    render(
      <Button asChild>
        <a href="/dashboard">Open Reactively</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Open Reactively" });
    expect(link).toBeInTheDocument();
    // `asChild` must not leak a button-only attribute onto the anchor.
    expect(link).not.toHaveAttribute("type");
  });
});
