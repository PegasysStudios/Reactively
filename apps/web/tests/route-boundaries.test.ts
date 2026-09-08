// @vitest-environment node
//
// This suite inspects source files on disk rather than rendering anything, so it runs in
// Node. jsdom would also rewrite `import.meta.url` into a non-file URL.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Route separation and bundle boundaries.
 *
 * Marketing, dashboard, editor and preview are separate surfaces with separate audiences
 * and wildly different weight. The editor will become the largest part of Reactively, and
 * a landing page that imports it would ship the whole builder to every visitor.
 *
 * This test walks the real import graph of each route rather than trusting convention,
 * because a single stray `import { useProjectStore }` in a shared component is enough to
 * pull the editor into the marketing bundle, and nothing else would catch it.
 */

const appRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));
const appDir = join(appRoot, "app");

const routes = {
  marketing: join(appDir, "(marketing)", "page.tsx"),
  marketingLayout: join(appDir, "(marketing)", "layout.tsx"),
  dashboard: join(appDir, "(dashboard)", "dashboard", "page.tsx"),
  dashboardLayout: join(appDir, "(dashboard)", "layout.tsx"),
  editor: join(appDir, "editor", "[projectId]", "page.tsx"),
  editorLayout: join(appDir, "editor", "[projectId]", "layout.tsx"),
  preview: join(appDir, "preview", "[projectId]", "page.tsx"),
  previewLayout: join(appDir, "preview", "[projectId]", "layout.tsx"),
};

const IMPORT_PATTERN =
  /(?:import|export)[\s\S]*?from\s+["']([^"']+)["']|import\(["']([^"']+)["']\)/g;

function readImports(filePath: string): string[] {
  const source = readFileSync(filePath, "utf8");
  const specifiers: string[] = [];

  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const specifier = match[1] ?? match[2];
    if (specifier) {
      specifiers.push(specifier);
    }
  }

  return specifiers;
}

/** Resolves an in-app import specifier to a file on disk, or null for a package. */
function resolveLocalModule(specifier: string, importerPath: string): string | null {
  const base = specifier.startsWith("@/")
    ? join(appRoot, specifier.slice(2))
    : specifier.startsWith(".")
      ? resolve(dirname(importerPath), specifier)
      : null;

  if (!base) {
    return null;
  }

  for (const candidate of [
    `${base}.tsx`,
    `${base}.ts`,
    join(base, "index.tsx"),
    join(base, "index.ts"),
  ]) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/** Every module specifier reachable from an entry file, following local imports. */
function collectTransitiveImports(entryPath: string): Set<string> {
  const seenFiles = new Set<string>();
  const specifiers = new Set<string>();
  const queue = [entryPath];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || seenFiles.has(current)) {
      continue;
    }
    seenFiles.add(current);

    for (const specifier of readImports(current)) {
      specifiers.add(specifier);

      const localPath = resolveLocalModule(specifier, current);
      if (localPath) {
        queue.push(localPath);
      }
    }
  }

  return specifiers;
}

describe("route structure", () => {
  it("keeps marketing, dashboard, editor and preview as distinct route segments", () => {
    for (const [name, path] of Object.entries(routes)) {
      expect(existsSync(path), `${name} route file is missing: ${path}`).toBe(true);
    }
  });

  it("gives each surface its own layout instead of sharing one shell", () => {
    const layouts = [
      routes.marketingLayout,
      routes.dashboardLayout,
      routes.editorLayout,
      routes.previewLayout,
    ].map((path) => readFileSync(path, "utf8"));

    expect(new Set(layouts).size).toBe(layouts.length);
  });

  it("declares html and body exactly once, in the root layout", () => {
    const rootLayout = readFileSync(join(appDir, "layout.tsx"), "utf8");
    expect(rootLayout).toContain("<html");
    expect(rootLayout).toContain("<body");

    for (const path of [routes.marketingLayout, routes.editorLayout, routes.previewLayout]) {
      expect(readFileSync(path, "utf8")).not.toContain("<html");
    }
  });
});

describe("bundle boundaries", () => {
  /** Modules that make a route "the editor". None may reach the public landing page. */
  const editorOnlyModules = [
    "@/components/editor/",
    "@/lib/state/",
    "@/lib/editor/",
    "@/lib/persistence",
    "@reactively/editor-engine",
    "@reactively/history",
    "@reactively/layout-engine",
    "@reactively/generator",
    "@dnd-kit/core",
    "@dnd-kit/sortable",
    "dexie",
  ];

  it("keeps editor code out of the marketing route", () => {
    const imports = [
      ...collectTransitiveImports(routes.marketing),
      ...collectTransitiveImports(routes.marketingLayout),
    ];

    for (const forbidden of editorOnlyModules) {
      expect(
        imports.some((specifier) => specifier.startsWith(forbidden)),
        `Marketing route must not import ${forbidden}`,
      ).toBe(false);
    }
  });

  it("keeps editor code out of the dashboard route", () => {
    const imports = [
      ...collectTransitiveImports(routes.dashboard),
      ...collectTransitiveImports(routes.dashboardLayout),
    ];

    for (const forbidden of ["@/components/editor/", "@reactively/generator", "@dnd-kit/core"]) {
      expect(
        imports.some((specifier) => specifier.startsWith(forbidden)),
        `Dashboard route must not import ${forbidden}`,
      ).toBe(false);
    }
  });

  it("keeps the preview route independent of editor components and state", () => {
    const imports = [
      ...collectTransitiveImports(routes.preview),
      ...collectTransitiveImports(routes.previewLayout),
    ];

    for (const forbidden of ["@/components/editor/", "@/lib/state/", "@reactively/editor-engine"]) {
      expect(
        imports.some((specifier) => specifier.startsWith(forbidden)),
        `Preview route must not import ${forbidden}`,
      ).toBe(false);
    }
  });

  it("loads the canvas lazily so editor chrome is not blocked by it", () => {
    const shell = readFileSync(join(appRoot, "components", "editor", "editor-shell.tsx"), "utf8");

    expect(shell).toContain("next/dynamic");
    expect(shell).toContain("./editor-canvas");
  });
});
