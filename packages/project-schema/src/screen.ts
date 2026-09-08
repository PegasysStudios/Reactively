import { z } from "zod";

import { IdSchema } from "./ids.js";

/**
 * A screen is a user-facing application route, not a filesystem path.
 *
 * The generator turns `route` into Expo Router files. Route IDs stay separate from route
 * names so renaming a screen does not break internal references.
 */
export const ScreenOptionsSchema = z.object({
  /** Wrap the screen in a safe-area boundary. Defaults on: notches are the common case. */
  safeArea: z.boolean(),
  scrollBehavior: z.enum(["none", "vertical", "horizontal"]),
  presentation: z.enum(["default", "modal"]).optional(),
});

export type ScreenOptions = z.infer<typeof ScreenOptionsSchema>;

export const ScreenDefinitionSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  /** Application route such as `/`, `/settings` or `/profile/[userId]`. */
  route: z.string().startsWith("/", "Routes must start with '/'"),
  rootNodeId: IdSchema,
  options: ScreenOptionsSchema,
});

export type ScreenDefinition = z.infer<typeof ScreenDefinitionSchema>;
