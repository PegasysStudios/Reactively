import type { ComponentDefinition } from "./contracts.js";
import { buttonDefinition } from "./definitions/button.js";
import { textDefinition } from "./definitions/text.js";
import { viewDefinition } from "./definitions/view.js";

/**
 * The built-in component registry.
 *
 * MVP scope is deliberately three primitives. Image, TextInput, ScrollView and
 * SafeAreaView follow once View/Text/Button render identically in the editor, the React
 * Native Web preview, iOS and Android.
 */
const definitions: readonly ComponentDefinition[] = [
  viewDefinition,
  textDefinition,
  buttonDefinition,
];

const definitionsByType: ReadonlyMap<string, ComponentDefinition> = new Map(
  definitions.map((definition) => [definition.type, definition]),
);

/** Every built-in component, in component-library display order. */
export function listComponentDefinitions(): readonly ComponentDefinition[] {
  return definitions;
}

export function getComponentDefinition(type: string): ComponentDefinition | undefined {
  return definitionsByType.get(type);
}

/** Throws for unknown types. Use where an unknown component is a programming error. */
export function requireComponentDefinition(type: string): ComponentDefinition {
  const definition = definitionsByType.get(type);
  if (!definition) {
    throw new Error(`Unknown component type: ${type}`);
  }
  return definition;
}

export function isKnownComponentType(type: string): boolean {
  return definitionsByType.has(type);
}

/** Component types grouped by their library category. */
export function listCategories(): readonly string[] {
  return [...new Set(definitions.map((definition) => definition.category))];
}
