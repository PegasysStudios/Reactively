import { z } from "zod";

/**
 * React Native style model.
 *
 * This is an explicit typed subset of React Native styles, not arbitrary CSS. Reactively
 * only exposes properties it can reproduce identically in the editor canvas, the React
 * Native Web preview and the generated native app. See docs/LAYOUT_ENGINE.md.
 */

/**
 * A dimension expressed the way React Native accepts it.
 *
 * Modelled as a discriminated union rather than a string so the editor never has to
 * parse `"50%"` and so unsupported CSS units (`px`, `vw`, `rem`, `calc`) are
 * unrepresentable by construction.
 */
export const LayoutValueSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("points"), value: z.number() }),
  z.object({ type: z.literal("percent"), value: z.number() }),
  z.object({ type: z.literal("auto") }),
]);

export type LayoutValue = z.infer<typeof LayoutValueSchema>;

/**
 * Spacing shorthand.
 *
 * `all` is the weakest specificity, then `horizontal`/`vertical`, then explicit edges.
 * Normalization into concrete per-edge values lives in @reactively/layout-engine so the
 * document keeps the user's original intent.
 */
export const EdgeValuesSchema = z.object({
  all: z.number().optional(),
  horizontal: z.number().optional(),
  vertical: z.number().optional(),
  top: z.number().optional(),
  right: z.number().optional(),
  bottom: z.number().optional(),
  left: z.number().optional(),
});

export type EdgeValues = z.infer<typeof EdgeValuesSchema>;

export const PositionSchema = z.enum(["relative", "absolute", "static"]);
export const FlexDirectionSchema = z.enum(["row", "row-reverse", "column", "column-reverse"]);
export const JustifyContentSchema = z.enum([
  "flex-start",
  "flex-end",
  "center",
  "space-between",
  "space-around",
  "space-evenly",
]);
export const AlignItemsSchema = z.enum(["stretch", "flex-start", "flex-end", "center", "baseline"]);
export const AlignSelfSchema = z.enum([
  "auto",
  "stretch",
  "flex-start",
  "flex-end",
  "center",
  "baseline",
]);
export const FlexWrapSchema = z.enum(["nowrap", "wrap", "wrap-reverse"]);
export const OverflowSchema = z.enum(["visible", "hidden", "scroll"]);
export const TextAlignSchema = z.enum(["auto", "left", "right", "center", "justify"]);
export const FontStyleSchema = z.enum(["normal", "italic"]);
export const BorderStyleSchema = z.enum(["solid", "dotted", "dashed"]);

export type Position = z.infer<typeof PositionSchema>;
export type FlexDirection = z.infer<typeof FlexDirectionSchema>;
export type JustifyContent = z.infer<typeof JustifyContentSchema>;
export type AlignItems = z.infer<typeof AlignItemsSchema>;
export type AlignSelf = z.infer<typeof AlignSelfSchema>;
export type FlexWrap = z.infer<typeof FlexWrapSchema>;
export type Overflow = z.infer<typeof OverflowSchema>;

/**
 * Colors are stored as strings for now (hex, rgb/rgba, or `transparent`).
 * A future theme system will allow token references in this position.
 */
export const ColorSchema = z.string().min(1);

export const ComponentStyleSchema = z.object({
  // Positioning
  position: PositionSchema.optional(),
  top: LayoutValueSchema.optional(),
  right: LayoutValueSchema.optional(),
  bottom: LayoutValueSchema.optional(),
  left: LayoutValueSchema.optional(),
  zIndex: z.number().optional(),

  // Sizing
  width: LayoutValueSchema.optional(),
  height: LayoutValueSchema.optional(),
  minWidth: LayoutValueSchema.optional(),
  maxWidth: LayoutValueSchema.optional(),
  minHeight: LayoutValueSchema.optional(),
  maxHeight: LayoutValueSchema.optional(),

  // Flex container
  flexDirection: FlexDirectionSchema.optional(),
  justifyContent: JustifyContentSchema.optional(),
  alignItems: AlignItemsSchema.optional(),
  flexWrap: FlexWrapSchema.optional(),
  gap: z.number().optional(),
  rowGap: z.number().optional(),
  columnGap: z.number().optional(),

  // Flex item
  alignSelf: AlignSelfSchema.optional(),
  flex: z.number().optional(),
  flexGrow: z.number().optional(),
  flexShrink: z.number().optional(),
  flexBasis: LayoutValueSchema.optional(),

  // Spacing
  margin: EdgeValuesSchema.optional(),
  padding: EdgeValuesSchema.optional(),

  // Appearance
  backgroundColor: ColorSchema.optional(),
  opacity: z.number().min(0).max(1).optional(),
  overflow: OverflowSchema.optional(),
  borderWidth: z.number().optional(),
  borderColor: ColorSchema.optional(),
  borderStyle: BorderStyleSchema.optional(),
  borderRadius: z.number().optional(),

  // Typography (only meaningful on text-capable components)
  color: ColorSchema.optional(),
  fontSize: z.number().optional(),
  fontWeight: z.string().optional(),
  fontStyle: FontStyleSchema.optional(),
  textAlign: TextAlignSchema.optional(),
  letterSpacing: z.number().optional(),
  lineHeight: z.number().optional(),
});

export type ComponentStyle = z.infer<typeof ComponentStyleSchema>;

/** Convenience constructors so call sites read like the values they describe. */
export const points = (value: number): LayoutValue => ({ type: "points", value });
export const percent = (value: number): LayoutValue => ({ type: "percent", value });
export const auto = (): LayoutValue => ({ type: "auto" });
