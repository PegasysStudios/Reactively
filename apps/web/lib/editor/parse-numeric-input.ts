/**
 * Safe inspector numeric parsing.
 *
 * Inspector text fields must never write `NaN` into the project document. Incomplete
 * drafts such as "-" or "12." stay local until they become a finite number.
 */

export type ParsedNumericInput =
  | { readonly ok: true; readonly value: number }
  | { readonly ok: false; readonly reason: "empty" | "invalid" | "incomplete" };

const COMPLETE_NUMBER = /^-?(?:\d+(?:\.\d+)?|\.\d+)$/;
const INCOMPLETE_NUMBER = /^(?:-|\.|-\.|\d+\.|-\d+\.)$/;

/** Parses live keystrokes. Incomplete drafts are not numbers and must not be stored. */
export function parseNumericInput(raw: string): ParsedNumericInput {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { ok: false, reason: "empty" };
  }

  if (INCOMPLETE_NUMBER.test(trimmed)) {
    return { ok: false, reason: "incomplete" };
  }

  if (!COMPLETE_NUMBER.test(trimmed)) {
    return { ok: false, reason: "invalid" };
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, value };
}

/**
 * Resolves a field when the user leaves it.
 *
 * Trailing decimals such as "12." become 12. Empty and invalid input stay non-numeric
 * so callers can clear or revert without writing `NaN`.
 */
export function finalizeNumericInput(raw: string): ParsedNumericInput {
  const parsed = parseNumericInput(raw);
  if (parsed.ok || parsed.reason !== "incomplete") {
    return parsed;
  }

  const value = Number(raw.trim());
  if (!Number.isFinite(value)) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, value };
}
