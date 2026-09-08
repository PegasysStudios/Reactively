import { z } from "zod";

import { ComponentNodeSchema } from "./component-node.js";
import { IdSchema } from "./ids.js";
import { ScreenDefinitionSchema } from "./screen.js";
import { CURRENT_SCHEMA_VERSION } from "./versions.js";

/**
 * Descriptive information about the project. Never affects generated output.
 */
export const ProjectMetadataSchema = z.object({
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  description: z.string().optional(),
});

export type ProjectMetadata = z.infer<typeof ProjectMetadataSchema>;

/**
 * Settings that shape the generated application rather than the editing experience.
 *
 * Bundle identifiers are optional because a project must be creatable and editable long
 * before the user decides to ship it.
 */
export const ProjectSettingsSchema = z.object({
  displayName: z.string().min(1),
  /** URL/CLI-safe name used for the Expo slug and generated directory name. */
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  version: z.string().min(1),

  iosBundleIdentifier: z.string().optional(),
  androidPackageName: z.string().optional(),
  webBasePath: z.string().optional(),

  /** Platforms this project intends to ship to. Drives validation and warnings. */
  targetPlatforms: z.array(z.enum(["ios", "android", "web"])).min(1),
});

export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;

/**
 * The canonical Reactively project document.
 *
 * This is the single source of truth. Generated React Native source is derived output
 * and is never read back. Screens and nodes are ID-keyed records for O(1) lookup;
 * ordering lives in explicit arrays such as `ComponentNode.children`.
 *
 * Ephemeral editor state (selection, hover, zoom, drag) must never appear here.
 */
export const ReactivelyProjectSchema = z.object({
  schemaVersion: z.number().int().positive(),
  id: IdSchema,
  name: z.string().min(1),

  /** Version of @reactively/generated-runtime the generated app should use. */
  runtimeVersion: z.string().min(1),
  /** Expo SDK the generated app targets. */
  expoSdkVersion: z.string().min(1),

  metadata: ProjectMetadataSchema,
  settings: ProjectSettingsSchema,

  /** Screen shown when the generated app launches. */
  initialScreenId: IdSchema,
  screens: z.record(IdSchema, ScreenDefinitionSchema),
  nodes: z.record(IdSchema, ComponentNodeSchema),
});

export type ReactivelyProject = z.infer<typeof ReactivelyProjectSchema>;

/**
 * Parses an untrusted value (file contents, IndexedDB record, network response) into a
 * project document. Returns Zod's discriminated result rather than throwing.
 */
export function parseProject(value: unknown) {
  return ReactivelyProjectSchema.safeParse(value);
}

/** Parses an untrusted value, throwing on failure. Intended for tests and fixtures. */
export function parseProjectOrThrow(value: unknown): ReactivelyProject {
  return ReactivelyProjectSchema.parse(value);
}

/**
 * True when this build of Reactively can safely write the document.
 *
 * Documents from a future schema version must be treated as read-only rather than
 * downgraded in place.
 */
export function isWritableSchemaVersion(schemaVersion: number): boolean {
  return schemaVersion <= CURRENT_SCHEMA_VERSION;
}
