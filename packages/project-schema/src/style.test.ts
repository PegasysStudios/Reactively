import { describe, expect, it } from "vitest";

import {
  AlignItemsSchema,
  ComponentStyleSchema,
  FlexDirectionSchema,
  JustifyContentSchema,
} from "./style.js";

describe("container Flexbox style schema", () => {
  it.each(["column", "row", "column-reverse", "row-reverse"])(
    "accepts flexDirection %s",
    (value) => {
      expect(FlexDirectionSchema.safeParse(value).success).toBe(true);
    },
  );

  it("rejects invalid flexDirection values", () => {
    expect(FlexDirectionSchema.safeParse("horizontal").success).toBe(false);
  });

  it.each([
    "flex-start",
    "flex-end",
    "center",
    "space-between",
    "space-around",
    "space-evenly",
  ])("accepts justifyContent %s", (value) => {
    expect(JustifyContentSchema.safeParse(value).success).toBe(true);
  });

  it("rejects invalid justifyContent values", () => {
    expect(JustifyContentSchema.safeParse("start").success).toBe(false);
  });

  it.each(["stretch", "flex-start", "flex-end", "center", "baseline"])(
    "accepts alignItems %s",
    (value) => {
      expect(AlignItemsSchema.safeParse(value).success).toBe(true);
    },
  );

  it("rejects invalid alignItems values", () => {
    expect(AlignItemsSchema.safeParse("auto").success).toBe(false);
  });

  it.each([0, 0.5, 16])("accepts non-negative gap %s", (gap) => {
    expect(ComponentStyleSchema.safeParse({ gap }).success).toBe(true);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid gap %s", (gap) => {
    expect(ComponentStyleSchema.safeParse({ gap }).success).toBe(false);
  });
});
