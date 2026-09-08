import type { Platform } from "@reactively/platform";
import type { ReactivelyProject } from "@reactively/project-schema";
import type { ValidationIssue } from "@reactively/validation";

import { compileProjectToAppIR } from "./compile.js";
import type { AppIR } from "./ir.js";

/**
 * Generation contracts.
 *
 * The generator returns files as data rather than writing them. That keeps this package
 * free of filesystem APIs, so the same code runs in the browser (download a zip), in
 * Electron (write to a project folder) and in a cloud build worker.
 */

export interface GenerationOptions {
  /** Platforms the generated project should be configured for. */
  readonly targetPlatforms: readonly Platform[];
  /** Overwrite Reactively-owned files only. `custom/` is never touched. */
  readonly preserveCustomCode: boolean;
  /** Run Prettier over generated source before returning it. */
  readonly format: boolean;
}

export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  targetPlatforms: ["ios", "android", "web"],
  preserveCustomCode: true,
  format: true,
};

/** Who owns a generated file. Reactively may overwrite `reactively`, never `user`. */
export type FileOwnership = "reactively" | "user";

export interface GeneratedFile {
  /** Path relative to the generated project root, e.g. `app/index.tsx`. */
  readonly path: string;
  readonly contents: string;
  readonly ownership: FileOwnership;
}

/** Stages of the pipeline described in docs/GENERATED_RUNTIME.md. */
export type GenerationStage =
  | "validate"
  | "normalize"
  | "build-ir"
  | "resolve-dependencies"
  | "materialize-template"
  | "generate-routes"
  | "generate-screens"
  | "copy-assets"
  | "generate-config"
  | "format";

/**
 * Result of a generation run.
 *
 * `incomplete` is a real, honest state rather than a stub that pretends to succeed: the
 * front half of the pipeline runs and returns a usable IR, and the stages that have not
 * been built yet are named explicitly.
 */
export type GenerationResult =
  | { readonly status: "invalid-project"; readonly issues: readonly ValidationIssue[] }
  | {
      readonly status: "incomplete";
      readonly appIr: AppIR;
      readonly completedStages: readonly GenerationStage[];
      readonly pendingStages: readonly GenerationStage[];
      readonly files: readonly GeneratedFile[];
    }
  | {
      readonly status: "generated";
      readonly appIr: AppIR;
      readonly files: readonly GeneratedFile[];
    };

const IMPLEMENTED_STAGES: readonly GenerationStage[] = [
  "validate",
  "normalize",
  "build-ir",
  "resolve-dependencies",
];

const PENDING_STAGES: readonly GenerationStage[] = [
  "materialize-template",
  "generate-routes",
  "generate-screens",
  "copy-assets",
  "generate-config",
  "format",
];

/**
 * Compiles a project towards an Expo application.
 *
 * Currently runs validation, normalization and IR construction. File emission is
 * deliberately not implemented: it depends on templates/expo-app being exercised by a
 * real build first, and shipping a half-correct emitter would make generated projects
 * look supported when they are not.
 */
export function generateProject(
  project: ReactivelyProject,
  options: GenerationOptions = DEFAULT_GENERATION_OPTIONS,
): GenerationResult {
  void options;

  const compiled = compileProjectToAppIR(project);
  if (compiled.status === "invalid-project") {
    return { status: "invalid-project", issues: compiled.issues };
  }

  return {
    status: "incomplete",
    appIr: compiled.appIr,
    completedStages: IMPLEMENTED_STAGES,
    pendingStages: PENDING_STAGES,
    files: [],
  };
}
