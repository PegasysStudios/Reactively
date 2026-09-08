import { percent, points } from "@reactively/project-schema";
import { describe, expect, it } from "vitest";

import {
  componentPaddingToEditorCss,
  componentStyleToEditorCss,
} from "@/lib/editor/layout-style-css";

describe("componentStyleToEditorCss", () => {
  it("maps numeric width and height to CSS dimensions", () => {
    expect(
      componentStyleToEditorCss({
        width: points(200),
        height: points(56),
      }),
    ).toEqual({ width: 200, height: 56 });
  });

  it("maps Fill width to 100%", () => {
    expect(componentStyleToEditorCss({ width: percent(100) })).toEqual({ width: "100%" });
  });

  it("applies left and top only for absolute position", () => {
    expect(
      componentStyleToEditorCss({
        left: points(20),
        top: points(30),
      }),
    ).toEqual({});

    expect(
      componentStyleToEditorCss({
        position: "absolute",
        left: points(20),
        top: points(30),
      }),
    ).toEqual({
      position: "absolute",
      left: 20,
      top: 30,
    });
  });

  it("maps margin edges to outer CSS spacing", () => {
    expect(
      componentStyleToEditorCss({
        margin: { top: 16, right: 16, bottom: 0, left: 16 },
      }),
    ).toEqual({
      marginTop: 16,
      marginRight: 16,
      marginBottom: 0,
      marginLeft: 16,
    });
  });

  it("maps padding edges separately from the outer box", () => {
    expect(
      componentPaddingToEditorCss({
        padding: { top: 12, right: 24, bottom: 12, left: 24 },
      }),
    ).toEqual({
      paddingTop: 12,
      paddingRight: 24,
      paddingBottom: 12,
      paddingLeft: 24,
    });

    expect(
      componentStyleToEditorCss({
        padding: { left: 24, right: 24 },
        margin: { top: 20 },
      }),
    ).toEqual({
      marginTop: 20,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
    });
  });

  it("maps Flexbox item values through to the editor representation", () => {
    expect(
      componentStyleToEditorCss({
        flexGrow: 1,
        flexShrink: 0,
        alignSelf: "center",
      }),
    ).toEqual({
      flexGrow: 1,
      flexShrink: 0,
      alignSelf: "center",
    });
  });

  it("does not invent Flexbox CSS when those fields are absent", () => {
    expect(componentStyleToEditorCss({ width: points(200) })).toEqual({ width: 200 });
  });
});
