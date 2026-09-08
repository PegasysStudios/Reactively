/**
 * Exhaustiveness helper for discriminated unions.
 *
 * Reactively models component types, layout values, actions and validation issues as
 * discriminated unions. Routing every `switch` through this helper turns "someone added
 * a new variant" into a compile error instead of a silent runtime fallthrough.
 */
export function assertNever(value: never, message = "Unexpected variant"): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}

/** Narrowing runtime assertion for invariants that indicate a programming error. */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Invariant violation: ${message}`);
  }
}
