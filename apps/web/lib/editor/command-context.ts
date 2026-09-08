import { canNest, getComponentDefinition } from "@reactively/component-registry";
import type { ComponentDefaults, EditorCommandContext } from "@reactively/editor-engine";
import { createId } from "@reactively/shared";

/**
 * Wires the component registry into the host-independent mutation layer.
 *
 * @reactively/editor-engine does not depend on the registry; it asks for nesting rules,
 * defaults, IDs and the clock through this context. This is the single place where those
 * come from the real registry, and it is what a test replaces to run mutations against a
 * fake component set.
 */
export function createEditorCommandContext(): EditorCommandContext {
  return {
    createId: () => createId("node"),
    now: () => new Date().toISOString(),
    canAcceptChild: (parentType, childType) => canNest(parentType, childType),
    canBeScreenRoot: (type) => getComponentDefinition(type)?.capabilities.canBeScreenRoot ?? false,
    defaultsFor: (type): ComponentDefaults | undefined => {
      const definition = getComponentDefinition(type);
      if (!definition) {
        return undefined;
      }

      return {
        name: definition.label,
        props: definition.defaultProps,
        style: definition.defaultStyle,
      };
    },
  };
}
