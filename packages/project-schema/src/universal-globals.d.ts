/**
 * See packages/shared/src/universal-globals.d.ts for why core packages declare the few
 * universal globals they use instead of pulling in the DOM lib or `@types/node`.
 */
declare function structuredClone<TValue>(value: TValue): TValue;
