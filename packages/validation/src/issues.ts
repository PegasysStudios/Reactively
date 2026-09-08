import type { NodeId, ScreenId } from "@reactively/project-schema";

/**
 * Validation sits above schema parsing.
 *
 * Zod answers "is this shaped like a project?". This package answers "is this project
 * coherent?" — the invariants a type system cannot express: hierarchy consistency,
 * reachability, semantic nesting, and eventually publishing readiness.
 */

/**
 * `error` blocks generation and publishing. `warning` is worth surfacing but does not
 * block. `info` is advisory.
 */
export type ValidationSeverity = "error" | "warning" | "info";

/** Stable codes so the editor can link an issue to a fix without matching on prose. */
export type ValidationCode =
  | "missing-initial-screen"
  | "missing-screen-root"
  | "inconsistent-node-id"
  | "duplicate-node-reference"
  | "missing-parent"
  | "missing-child"
  | "parent-child-mismatch"
  | "parent-cycle"
  | "unknown-component-type"
  | "invalid-nesting"
  | "invalid-screen-root"
  | "orphaned-node"
  | "duplicate-route";

export interface ValidationIssue {
  readonly code: ValidationCode;
  readonly severity: ValidationSeverity;
  readonly message: string;
  /** Node the issue points at, so the editor can select and reveal it. */
  readonly nodeId?: NodeId;
  readonly screenId?: ScreenId;
}

export interface ProjectValidationResult {
  /** True when there are no `error` issues. Warnings do not make a project invalid. */
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
}

/** Buckets issues and derives the overall verdict. */
export function summarizeIssues(issues: readonly ValidationIssue[]): ProjectValidationResult {
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  return { valid: errors.length === 0, issues, errors, warnings };
}
