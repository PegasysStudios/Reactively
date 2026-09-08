import {
  createEmptyProject,
  parseProjectOrThrow,
  type ReactivelyProject,
} from "@reactively/project-schema";
import { createId } from "@reactively/shared";

export interface CreateProjectOptions {
  readonly name: string;
}

export interface ProjectCreationContext {
  createId(prefix: "project" | "screen" | "node"): string;
  now(): string;
}

const defaultCreationContext: ProjectCreationContext = {
  createId,
  now: () => new Date().toISOString(),
};

/** Converts a project name into the canonical Expo-compatible slug format. */
function createProjectSlug(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "untitled-project";
}

/**
 * Creates the smallest editable Reactively project.
 *
 * The canonical schema requires every screen to reference a root node, so a blank
 * project contains one Home screen and its empty root View. No user-authored components
 * are inserted. IDs and time can be injected to keep domain tests deterministic.
 */
export function createProject(
  options: CreateProjectOptions,
  context: ProjectCreationContext = defaultCreationContext,
): ReactivelyProject {
  const name = options.name.trim();
  if (!name) {
    throw new Error("Project name must not be empty.");
  }

  const createdAt = context.now();
  const project = createEmptyProject({
    projectId: context.createId("project"),
    name,
    slug: createProjectSlug(name),
    screenId: context.createId("screen"),
    rootNodeId: context.createId("node"),
    createdAt,
  });

  // Creation is a trusted domain operation, but parsing here makes schema conformance a
  // hard guarantee for every host that consumes this public factory.
  return parseProjectOrThrow(project);
}
