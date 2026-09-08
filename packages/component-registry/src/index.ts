export type {
  ComponentCapabilities,
  ComponentDefinition,
  ComponentGeneration,
  ComponentPropertyDefinition,
  ComponentPropertyOption,
  PropertyTarget,
  PropertyValueType,
} from "./contracts.js";

export { buttonDefinition } from "./definitions/button.js";
export { textDefinition } from "./definitions/text.js";
export { viewDefinition } from "./definitions/view.js";

export {
  SCREEN_PARENT_TYPE,
  canBeScreenRoot,
  canHaveChildren,
  canNest,
  checkNesting,
  type NestingCheck,
  type NestingRejectionReason,
} from "./nesting.js";

export {
  getComponentDefinition,
  isKnownComponentType,
  listCategories,
  listComponentDefinitions,
  requireComponentDefinition,
} from "./registry.js";
