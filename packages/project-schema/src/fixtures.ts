import type { ComponentNode } from "./component-node.js";
import type { ReactivelyProject } from "./project.js";
import type { ScreenDefinition } from "./screen.js";
import { points } from "./style.js";
import {
  CURRENT_EXPO_SDK_VERSION,
  CURRENT_RUNTIME_VERSION,
  CURRENT_SCHEMA_VERSION,
} from "./versions.js";

/**
 * Fixtures use fixed IDs and timestamps on purpose.
 *
 * Deterministic fixtures keep tests and generator snapshots stable, and they let this
 * package stay dependency-free — no ID generator, no clock.
 */

const FIXTURE_TIMESTAMP = "2026-01-01T00:00:00.000Z";

export const FIXTURE_SCREEN_ID = "screen_home";
export const FIXTURE_ROOT_NODE_ID = "node_root";
export const FIXTURE_TEXT_NODE_ID = "node_title";
export const FIXTURE_BUTTON_NODE_ID = "node_cta";

const rootNode: ComponentNode = {
  id: FIXTURE_ROOT_NODE_ID,
  type: "View",
  name: "Screen Root",
  parentId: null,
  children: [FIXTURE_TEXT_NODE_ID, FIXTURE_BUTTON_NODE_ID],
  props: {},
  style: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    flex: 1,
    padding: { all: 24 },
    backgroundColor: "#ffffff",
  },
  events: [],
};

const textNode: ComponentNode = {
  id: FIXTURE_TEXT_NODE_ID,
  type: "Text",
  name: "Title",
  parentId: FIXTURE_ROOT_NODE_ID,
  children: [],
  props: { content: "Hello from Reactively" },
  style: { fontSize: 20, fontWeight: "600", color: "#0b0d12" },
  events: [],
};

const buttonNode: ComponentNode = {
  id: FIXTURE_BUTTON_NODE_ID,
  type: "Button",
  name: "Primary Action",
  parentId: FIXTURE_ROOT_NODE_ID,
  children: [],
  props: { label: "Get started", variant: "primary", disabled: false },
  style: { width: points(200) },
  events: [{ event: "onPress", actionIds: [] }],
};

const homeScreen: ScreenDefinition = {
  id: FIXTURE_SCREEN_ID,
  name: "Home",
  route: "/",
  rootNodeId: FIXTURE_ROOT_NODE_ID,
  options: { safeArea: true, scrollBehavior: "none" },
};

/**
 * The smallest project that exercises every contract: a screen, a container, a text node
 * and a button node in a valid parent/child hierarchy.
 */
export const MINIMAL_VALID_PROJECT: ReactivelyProject = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  id: "project_fixture",
  name: "Fixture App",
  runtimeVersion: CURRENT_RUNTIME_VERSION,
  expoSdkVersion: CURRENT_EXPO_SDK_VERSION,
  metadata: {
    createdAt: FIXTURE_TIMESTAMP,
    updatedAt: FIXTURE_TIMESTAMP,
    description: "Deterministic fixture used by Reactively tests.",
  },
  settings: {
    displayName: "Fixture App",
    slug: "fixture-app",
    version: "1.0.0",
    targetPlatforms: ["ios", "android", "web"],
  },
  initialScreenId: FIXTURE_SCREEN_ID,
  screens: { [FIXTURE_SCREEN_ID]: homeScreen },
  nodes: {
    [FIXTURE_ROOT_NODE_ID]: rootNode,
    [FIXTURE_TEXT_NODE_ID]: textNode,
    [FIXTURE_BUTTON_NODE_ID]: buttonNode,
  },
};

/** Returns an independent deep copy so tests can mutate freely. */
export function createMinimalProjectFixture(): ReactivelyProject {
  return structuredClone(MINIMAL_VALID_PROJECT);
}

/**
 * Builds a brand-new empty project: one screen, one root View, nothing else.
 *
 * IDs and the timestamp are injected rather than generated so the caller owns
 * determinism. `apps/web` passes `createId()` from @reactively/shared.
 */
export function createEmptyProject(options: {
  projectId: string;
  name: string;
  slug: string;
  screenId: string;
  rootNodeId: string;
  createdAt: string;
}): ReactivelyProject {
  const { projectId, name, slug, screenId, rootNodeId, createdAt } = options;

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: projectId,
    name,
    runtimeVersion: CURRENT_RUNTIME_VERSION,
    expoSdkVersion: CURRENT_EXPO_SDK_VERSION,
    metadata: { createdAt, updatedAt: createdAt },
    settings: {
      displayName: name,
      slug,
      version: "1.0.0",
      targetPlatforms: ["ios", "android", "web"],
    },
    initialScreenId: screenId,
    screens: {
      [screenId]: {
        id: screenId,
        name: "Home",
        route: "/",
        rootNodeId,
        options: { safeArea: true, scrollBehavior: "none" },
      },
    },
    nodes: {
      [rootNodeId]: {
        id: rootNodeId,
        type: "View",
        name: "Screen Root",
        parentId: null,
        children: [],
        props: {},
        style: { flex: 1, backgroundColor: "#ffffff" },
        events: [],
      },
    },
  };
}
