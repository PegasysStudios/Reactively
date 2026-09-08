import { render, screen } from "@testing-library/react";
import {
  createMinimalProjectFixture,
  points,
  type ComponentNode,
} from "@reactively/project-schema";
import { describe, expect, it, vi } from "vitest";

import { EditorCanvas } from "@/components/editor/editor-canvas";
import { EditorComponentRenderer } from "@/components/editor/editor-component-renderer";

function buttonWithStyle(style: ComponentNode["style"]): ComponentNode {
  const project = createMinimalProjectFixture();
  const button = project.nodes["node_cta"];
  if (!button) {
    throw new Error("Fixture is missing the button node.");
  }

  return { ...button, style };
}

describe("editor layout rendering", () => {
  it("applies numeric width and height to the editor representation", () => {
    render(
      <EditorComponentRenderer
        node={buttonWithStyle({ width: points(200), height: points(56) })}
        isSelected={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Select Primary Action" })).toHaveStyle({
      width: "200px",
      height: "56px",
    });
  });

  it("places absolutely positioned nodes with left and top", () => {
    const node = buttonWithStyle({
      position: "absolute",
      left: points(20),
      top: points(30),
      width: points(200),
    });

    render(
      <EditorCanvas projectId="project_fixture" screenName="Home" components={[node]} />,
    );

    expect(screen.getByRole("button", { name: "Select Primary Action" })).toHaveStyle({
      position: "absolute",
      left: "20px",
      top: "30px",
      width: "200px",
    });
  });

  it("keeps relatively positioned nodes in normal flow", () => {
    render(
      <EditorComponentRenderer
        node={buttonWithStyle({ left: points(20), top: points(30), width: points(120) })}
        isSelected
        onSelect={vi.fn()}
      />,
    );

    const rendered = screen.getByRole("button", { name: "Select Primary Action" });
    expect(rendered).toHaveStyle({ width: "120px" });
    expect(rendered).not.toHaveStyle({ position: "absolute" });
  });

  it("applies margin as outer spacing on the editor node", () => {
    render(
      <EditorComponentRenderer
        node={buttonWithStyle({ margin: { top: 20, right: 8, bottom: 0, left: 8 } })}
        isSelected={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Select Primary Action" })).toHaveStyle({
      marginTop: "20px",
      marginRight: "8px",
      marginBottom: "0px",
      marginLeft: "8px",
    });
  });

  it("applies padding as inner spacing on the visual surface", () => {
    render(
      <EditorComponentRenderer
        node={buttonWithStyle({ padding: { top: 12, right: 24, bottom: 12, left: 24 } })}
        isSelected={false}
        onSelect={vi.fn()}
      />,
    );

    const rendered = screen.getByRole("button", { name: "Select Primary Action" });
    expect(rendered).not.toHaveStyle({ paddingLeft: "24px" });
    expect(rendered.firstElementChild).toHaveStyle({
      paddingTop: "12px",
      paddingRight: "24px",
      paddingBottom: "12px",
      paddingLeft: "24px",
    });
  });

  it("maps alignSelf to the editor representation", () => {
    render(
      <EditorComponentRenderer
        node={buttonWithStyle({ alignSelf: "center", width: points(200) })}
        isSelected={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Select Primary Action" })).toHaveStyle({
      alignSelf: "center",
      width: "200px",
    });
  });

  it("passes flexGrow and flexShrink through to the editor representation", () => {
    render(
      <EditorComponentRenderer
        node={buttonWithStyle({ flexGrow: 1, flexShrink: 0, width: points(200) })}
        isSelected={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Select Primary Action" })).toHaveStyle({
      flexGrow: "1",
      flexShrink: "0",
      width: "200px",
    });
  });
});
