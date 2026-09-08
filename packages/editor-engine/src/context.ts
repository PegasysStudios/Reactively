import type { ComponentStyle } from "@reactively/project-schema";

/**
 * Everything a mutation needs from the outside world.
 *
 * This package deliberately does not depend on @reactively/component-registry. Nesting
 * rules and component defaults are injected instead, which keeps the mutation layer
 * testable without the registry and leaves room for user-defined custom components to
 * participate in exactly the same checks. `apps/web` wires the real registry in.
 */
export interface ComponentDefaults {
  readonly name: string;
  readonly props: Readonly<Record<string, unknown>>;
  readonly style: ComponentStyle;
}

export interface EditorCommandContext {
  /** Generates a new stable node ID. */
  createId(): string;
  /** Current time as an ISO 8601 string, for `metadata.updatedAt`. */
  now(): string;
  /** Semantic nesting check, normally backed by the component registry. */
  canAcceptChild(parentType: string, childType: string): boolean;
  /** Whether a component type may be a screen's root node. */
  canBeScreenRoot(type: string): boolean;
  /** Initial name, props and style for a newly inserted component. */
  defaultsFor(type: string): ComponentDefaults | undefined;
}
