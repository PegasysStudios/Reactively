import { describe, expect, it } from "vitest";

import { finalizeNumericInput, parseNumericInput } from "@/lib/editor/parse-numeric-input";

describe("parseNumericInput", () => {
  it("treats blank and whitespace as empty", () => {
    expect(parseNumericInput("")).toEqual({ ok: false, reason: "empty" });
    expect(parseNumericInput("   ")).toEqual({ ok: false, reason: "empty" });
  });

  it("parses finite numbers without producing NaN", () => {
    expect(parseNumericInput("0")).toEqual({ ok: true, value: 0 });
    expect(parseNumericInput("56")).toEqual({ ok: true, value: 56 });
    expect(parseNumericInput(" 12.5 ")).toEqual({ ok: true, value: 12.5 });
    expect(parseNumericInput("-20")).toEqual({ ok: true, value: -20 });
  });

  it("keeps in-progress drafts out of project state", () => {
    expect(parseNumericInput("-")).toEqual({ ok: false, reason: "incomplete" });
    expect(parseNumericInput(".")).toEqual({ ok: false, reason: "incomplete" });
    expect(parseNumericInput("12.")).toEqual({ ok: false, reason: "incomplete" });
  });

  it("rejects invalid text instead of returning NaN", () => {
    expect(parseNumericInput("abc")).toEqual({ ok: false, reason: "invalid" });
    expect(parseNumericInput("20px")).toEqual({ ok: false, reason: "invalid" });
    expect(parseNumericInput("12,5")).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("finalizeNumericInput", () => {
  it("commits trailing decimals when the field blurs", () => {
    expect(finalizeNumericInput("12.")).toEqual({ ok: true, value: 12 });
  });

  it("does not invent a number from empty or invalid text", () => {
    expect(finalizeNumericInput("")).toEqual({ ok: false, reason: "empty" });
    expect(finalizeNumericInput("nope")).toEqual({ ok: false, reason: "invalid" });
    expect(finalizeNumericInput("-")).toEqual({ ok: false, reason: "invalid" });
  });
});
