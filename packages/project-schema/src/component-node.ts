import { z } from "zod";

import { IdSchema } from "./ids.js";
import { ComponentStyleSchema } from "./style.js";

/**
 * Event wiring placeholder.
 *
 * Events reference action IDs rather than inline handlers so that renaming or editing an
 * action never rewrites every node that uses it. The action system itself is not part of
 * the MVP; this establishes the shape it will hang off.
 */
export const EventBindingSchema = z.object({
  event: z.string().min(1),
  actionIds: z.array(IdSchema),
});

export type EventBinding = z.infer<typeof EventBindingSchema>;

/**
 * A single node in a screen's component tree.
 *
 * `type` is an open string rather than an enum: the built-in set lives in
 * @reactively/component-registry, and user-defined custom components will register
 * additional types later. @reactively/validation is what checks a node's type against
 * the registry.
 *
 * Hierarchy is stored twice on purpose — `parentId` for O(1) upward walks and `children`
 * for ordering — and the two must always agree. That invariant is enforced by validation,
 * not by the schema.
 */
export const ComponentNodeSchema = z.object({
  id: IdSchema,
  type: z.string().min(1),
  name: z.string().min(1),

  parentId: IdSchema.nullable(),
  children: z.array(IdSchema),

  props: z.record(z.string(), z.unknown()),
  style: ComponentStyleSchema,

  events: z.array(EventBindingSchema),
});

export type ComponentNode = z.infer<typeof ComponentNodeSchema>;
