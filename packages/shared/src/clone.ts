/**
 * Structural clone for plain project data.
 *
 * Project documents are plain JSON-compatible values, so `structuredClone` is both
 * correct and fast. Kept behind a helper so the implementation can change without
 * touching call sites.
 */
export function deepClone<TValue>(value: TValue): TValue {
  return structuredClone(value);
}
