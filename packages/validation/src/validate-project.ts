import {
  SCREEN_PARENT_TYPE,
  checkNesting,
  isKnownComponentType,
} from "@reactively/component-registry";
import type { ComponentNode, NodeId, ReactivelyProject } from "@reactively/project-schema";

import { summarizeIssues, type ProjectValidationResult, type ValidationIssue } from "./issues.js";

/**
 * Validates a project's structure and semantics.
 *
 * Assumes the document already parsed against `ReactivelyProjectSchema`; this is the
 * layer above. Every check collects issues rather than throwing so the editor can show
 * the full list at once.
 */
export function validateProject(project: ReactivelyProject): ProjectValidationResult {
  const issues: ValidationIssue[] = [
    ...validateInitialScreen(project),
    ...validateScreens(project),
    ...validateNodeIdentity(project),
    ...validateHierarchy(project),
    ...validateComponentSemantics(project),
  ];

  return summarizeIssues(issues);
}

/** The project must point at a screen that exists. */
function validateInitialScreen(project: ReactivelyProject): ValidationIssue[] {
  if (!project.initialScreenId) {
    return [
      {
        code: "missing-initial-screen",
        severity: "error",
        message: "The project does not declare an initial screen.",
      },
    ];
  }

  if (!project.screens[project.initialScreenId]) {
    return [
      {
        code: "missing-initial-screen",
        severity: "error",
        message: `Initial screen "${project.initialScreenId}" does not exist.`,
        screenId: project.initialScreenId,
      },
    ];
  }

  return [];
}

/** Every screen needs a root node that exists, and routes must be unique. */
function validateScreens(project: ReactivelyProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const routes = new Map<string, string>();

  for (const [screenKey, screen] of Object.entries(project.screens)) {
    if (screen.id !== screenKey) {
      issues.push({
        code: "inconsistent-node-id",
        severity: "error",
        message: `Screen stored under key "${screenKey}" declares id "${screen.id}".`,
        screenId: screenKey,
      });
    }

    if (!project.nodes[screen.rootNodeId]) {
      issues.push({
        code: "missing-screen-root",
        severity: "error",
        message: `Screen "${screen.name}" references a root node that does not exist.`,
        screenId: screen.id,
        nodeId: screen.rootNodeId,
      });
    }

    const existingScreenId = routes.get(screen.route);
    if (existingScreenId) {
      issues.push({
        code: "duplicate-route",
        severity: "error",
        message: `Route "${screen.route}" is used by more than one screen.`,
        screenId: screen.id,
      });
    } else {
      routes.set(screen.route, screen.id);
    }
  }

  return issues;
}

/** Record keys and node IDs must agree, and no node may be claimed by two parents. */
function validateNodeIdentity(project: ReactivelyProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const claimedBy = new Map<NodeId, NodeId>();

  for (const [nodeKey, node] of Object.entries(project.nodes)) {
    if (node.id !== nodeKey) {
      issues.push({
        code: "inconsistent-node-id",
        severity: "error",
        message: `Node stored under key "${nodeKey}" declares id "${node.id}".`,
        nodeId: nodeKey,
      });
    }

    for (const childId of node.children) {
      const previousParentId = claimedBy.get(childId);
      if (previousParentId) {
        issues.push({
          code: "duplicate-node-reference",
          severity: "error",
          message: `Node "${childId}" appears in the children of both "${previousParentId}" and "${node.id}".`,
          nodeId: childId,
        });
      } else {
        claimedBy.set(childId, node.id);
      }
    }
  }

  return issues;
}

/**
 * Checks the tree invariants: every referenced node exists, `parentId` and `children`
 * agree, and no node is its own ancestor.
 */
function validateHierarchy(project: ReactivelyProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const screenRootIds = new Set(Object.values(project.screens).map((screen) => screen.rootNodeId));

  for (const node of Object.values(project.nodes)) {
    for (const childId of node.children) {
      const child = project.nodes[childId];
      if (!child) {
        issues.push({
          code: "missing-child",
          severity: "error",
          message: `Node "${node.name}" references a child "${childId}" that does not exist.`,
          nodeId: node.id,
        });
        continue;
      }

      if (child.parentId !== node.id) {
        issues.push({
          code: "parent-child-mismatch",
          severity: "error",
          message: `Node "${child.id}" is listed as a child of "${node.id}" but its parentId is "${child.parentId ?? "null"}".`,
          nodeId: child.id,
        });
      }
    }

    if (node.parentId === null) {
      if (!screenRootIds.has(node.id)) {
        issues.push({
          code: "orphaned-node",
          severity: "warning",
          message: `Node "${node.name}" has no parent and is not the root of any screen.`,
          nodeId: node.id,
        });
      }
      continue;
    }

    const parent = project.nodes[node.parentId];
    if (!parent) {
      issues.push({
        code: "missing-parent",
        severity: "error",
        message: `Node "${node.name}" references a parent "${node.parentId}" that does not exist.`,
        nodeId: node.id,
      });
      continue;
    }

    if (!parent.children.includes(node.id)) {
      issues.push({
        code: "parent-child-mismatch",
        severity: "error",
        message: `Node "${node.id}" claims parent "${parent.id}", which does not list it as a child.`,
        nodeId: node.id,
      });
    }
  }

  issues.push(...detectParentCycles(project));

  return issues;
}

/**
 * Detects `parentId` cycles.
 *
 * Walks upward from every node with a visited set. A cycle is reported once per node
 * involved, which is what lets the editor highlight the whole loop.
 */
function detectParentCycles(project: ReactivelyProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const node of Object.values(project.nodes)) {
    const seen = new Set<NodeId>([node.id]);
    let current: ComponentNode | undefined = node;

    while (current?.parentId) {
      if (seen.has(current.parentId)) {
        issues.push({
          code: "parent-cycle",
          severity: "error",
          message: `Node "${node.name}" is part of a parent cycle through "${current.parentId}".`,
          nodeId: node.id,
        });
        break;
      }

      seen.add(current.parentId);
      current = project.nodes[current.parentId];
    }
  }

  return issues;
}

/** Checks node types against the registry and enforces semantic nesting rules. */
function validateComponentSemantics(project: ReactivelyProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const screenRootIds = new Set(Object.values(project.screens).map((screen) => screen.rootNodeId));

  for (const node of Object.values(project.nodes)) {
    if (!isKnownComponentType(node.type)) {
      issues.push({
        code: "unknown-component-type",
        severity: "error",
        message: `Node "${node.name}" uses unknown component type "${node.type}".`,
        nodeId: node.id,
      });
      continue;
    }

    if (screenRootIds.has(node.id)) {
      const rootCheck = checkNesting(SCREEN_PARENT_TYPE, node.type);
      if (!rootCheck.allowed) {
        issues.push({
          code: "invalid-screen-root",
          severity: "error",
          message: `"${node.type}" cannot be the root of a screen (${rootCheck.reason}).`,
          nodeId: node.id,
        });
      }
    }

    const parent = node.parentId ? project.nodes[node.parentId] : undefined;
    if (!parent || !isKnownComponentType(parent.type)) {
      continue;
    }

    const check = checkNesting(parent.type, node.type);
    if (!check.allowed) {
      issues.push({
        code: "invalid-nesting",
        severity: "error",
        message: `"${node.type}" cannot be placed inside "${parent.type}" (${check.reason}).`,
        nodeId: node.id,
      });
    }
  }

  return issues;
}
