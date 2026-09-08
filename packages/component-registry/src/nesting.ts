import { getComponentDefinition } from "./registry.js";

/**
 * Semantic nesting rules.
 *
 * The editor derives every "can I drop this here?" answer from these functions rather
 * than hard-coding checks in drag handlers, so the canvas, the layers tree and validation
 * can never disagree.
 */

/**
 * Pseudo-type representing a screen rather than a component.
 *
 * A screen is not a node, but it does own a root node, and "what may sit at the top of a
 * screen" is the same kind of question as "what may sit inside a View". Modelling it as a
 * parent type keeps one code path instead of two.
 */
export const SCREEN_PARENT_TYPE = "Screen";

/** Why a nesting attempt was refused. Surfaced in the editor as drop feedback. */
export type NestingRejectionReason =
  | "unknown-parent-type"
  | "unknown-child-type"
  | "parent-cannot-have-children"
  | "child-not-allowed-in-parent"
  | "parent-not-allowed-for-child"
  | "not-allowed-as-screen-root";

export type NestingCheck =
  { readonly allowed: true } | { readonly allowed: false; readonly reason: NestingRejectionReason };

/** True when the component type may contain arbitrary Reactively children. */
export function canHaveChildren(type: string): boolean {
  return getComponentDefinition(type)?.capabilities.canHaveChildren ?? false;
}

/** True when the component type may be the root node of a screen. */
export function canBeScreenRoot(type: string): boolean {
  return getComponentDefinition(type)?.capabilities.canBeScreenRoot ?? false;
}

/**
 * Checks whether `childType` may be placed inside `parentType`.
 *
 * Pass {@link SCREEN_PARENT_TYPE} as the parent to ask whether the child may be a
 * screen's root node.
 */
export function checkNesting(parentType: string, childType: string): NestingCheck {
  const childDefinition = getComponentDefinition(childType);
  if (!childDefinition) {
    return { allowed: false, reason: "unknown-child-type" };
  }

  if (parentType === SCREEN_PARENT_TYPE) {
    return childDefinition.capabilities.canBeScreenRoot
      ? { allowed: true }
      : { allowed: false, reason: "not-allowed-as-screen-root" };
  }

  const parentDefinition = getComponentDefinition(parentType);
  if (!parentDefinition) {
    return { allowed: false, reason: "unknown-parent-type" };
  }

  if (!parentDefinition.capabilities.canHaveChildren) {
    return { allowed: false, reason: "parent-cannot-have-children" };
  }

  const { allowedChildTypes } = parentDefinition.capabilities;
  if (allowedChildTypes && !allowedChildTypes.includes(childType)) {
    return { allowed: false, reason: "child-not-allowed-in-parent" };
  }

  const { allowedParentTypes } = childDefinition.capabilities;
  if (allowedParentTypes && !allowedParentTypes.includes(parentType)) {
    return { allowed: false, reason: "parent-not-allowed-for-child" };
  }

  return { allowed: true };
}

/** Boolean convenience wrapper around {@link checkNesting}. */
export function canNest(parentType: string, childType: string): boolean {
  return checkNesting(parentType, childType).allowed;
}
