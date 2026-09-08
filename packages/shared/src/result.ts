/**
 * Minimal result type.
 *
 * Editor mutations and generation stages can fail for expected reasons (invalid
 * nesting, unknown node, failed validation). Those are modelled as values rather than
 * thrown exceptions so the editor UI can surface them without try/catch at every layer.
 */
export type Result<TValue, TError> =
  { readonly ok: true; readonly value: TValue } | { readonly ok: false; readonly error: TError };

export function ok<TValue>(value: TValue): Result<TValue, never> {
  return { ok: true, value };
}

export function err<TError>(error: TError): Result<never, TError> {
  return { ok: false, error };
}

export function isOk<TValue, TError>(
  result: Result<TValue, TError>,
): result is { readonly ok: true; readonly value: TValue } {
  return result.ok;
}

export function isErr<TValue, TError>(
  result: Result<TValue, TError>,
): result is { readonly ok: false; readonly error: TError } {
  return !result.ok;
}

/** Unwraps a result, throwing when it represents a failure. Intended for tests and scripts. */
export function unwrap<TValue, TError>(result: Result<TValue, TError>): TValue {
  if (result.ok) {
    return result.value;
  }
  throw new Error(`Attempted to unwrap a failed result: ${JSON.stringify(result.error)}`);
}
