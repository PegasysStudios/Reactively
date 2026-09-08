import { createMinimalProjectFixture } from "@reactively/project-schema";
import { describe, expect, it } from "vitest";

import { compileProjectToAppIR } from "./compile.js";
import { generateProject } from "./generate.js";
import { routeToExpoRouterPath, screenComponentName } from "./routes.js";

describe("routeToExpoRouterPath", () => {
  it("maps application routes onto Expo Router files", () => {
    expect(routeToExpoRouterPath("/")).toBe("app/index.tsx");
    expect(routeToExpoRouterPath("/settings")).toBe("app/settings.tsx");
    expect(routeToExpoRouterPath("/profile/[userId]")).toBe("app/profile/[userId].tsx");
  });
});

describe("screenComponentName", () => {
  it("produces valid React component names", () => {
    expect(screenComponentName("Home")).toBe("HomeScreen");
    expect(screenComponentName("user profile")).toBe("UserProfileScreen");
    expect(screenComponentName("Settings Screen")).toBe("SettingsScreen");
    expect(screenComponentName("404")).toBe("Screen404Screen");
    expect(screenComponentName("")).toBe("UntitledScreen");
  });
});

describe("compileProjectToAppIR", () => {
  it("builds an IR from a valid project", () => {
    const result = compileProjectToAppIR(createMinimalProjectFixture());

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;

    expect(result.appIr.app.slug).toBe("fixture-app");
    expect(result.appIr.routes).toEqual([
      { screenId: "screen_home", route: "/", filePath: "app/index.tsx", isInitial: true },
    ]);
    expect(result.appIr.screens[0]?.componentName).toBe("HomeScreen");
  });

  it("maps nodes onto their runtime wrappers", () => {
    const result = compileProjectToAppIR(createMinimalProjectFixture());
    if (result.status !== "ok") throw new Error("expected a valid compile");

    const root = result.appIr.screens[0]?.root;
    expect(root?.runtimeComponent).toBe("VNView");
    expect(root?.children.map((child) => child.runtimeComponent)).toEqual(["VNText", "VNButton"]);
  });

  it("resolves safe-area support as an earned dependency", () => {
    const result = compileProjectToAppIR(createMinimalProjectFixture());
    if (result.status !== "ok") throw new Error("expected a valid compile");

    expect(result.appIr.dependencies.map((dependency) => dependency.name)).toContain(
      "react-native-safe-area-context",
    );
  });

  it("narrows platform support to the weakest component in the tree", () => {
    const result = compileProjectToAppIR(createMinimalProjectFixture());
    if (result.status !== "ok") throw new Error("expected a valid compile");

    // Button is `adapted` on web because hover/focus states have no native equivalent.
    expect(result.appIr.platformSupport).toEqual({
      ios: "full",
      android: "full",
      web: "adapted",
    });
  });

  it("is deterministic", () => {
    const first = compileProjectToAppIR(createMinimalProjectFixture());
    const second = compileProjectToAppIR(createMinimalProjectFixture());

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("refuses to compile an invalid project", () => {
    const project = createMinimalProjectFixture();
    project.initialScreenId = "screen_missing";

    const result = compileProjectToAppIR(project);
    expect(result.status).toBe("invalid-project");
  });
});

describe("generateProject", () => {
  it("reports which pipeline stages are not implemented yet", () => {
    const result = generateProject(createMinimalProjectFixture());

    expect(result.status).toBe("incomplete");
    if (result.status !== "incomplete") return;

    expect(result.completedStages).toContain("build-ir");
    expect(result.pendingStages).toContain("generate-screens");
    expect(result.files).toEqual([]);
  });

  it("surfaces validation errors instead of generating", () => {
    const project = createMinimalProjectFixture();
    project.nodes["node_title"]!.type = "FlatList";

    const result = generateProject(project);
    expect(result.status).toBe("invalid-project");
  });
});
