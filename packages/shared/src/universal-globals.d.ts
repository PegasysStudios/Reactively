/**
 * Ambient declarations for the small set of universal globals Reactively core packages
 * rely on.
 *
 * Core packages deliberately do NOT include the DOM lib or `@types/node`: they must run
 * unchanged in the browser (editor), in Node (cloud workers, generation) and in Hermes
 * (generated apps). Declaring only what we use keeps `fs`, `path` and `window` out of
 * reach, which is the boundary docs/ARCHITECTURE.md asks for.
 *
 * Both globals below are part of the WinterCG Minimum Common API and are present in
 * Node 20+, all current browsers and React Native.
 */

declare function structuredClone<TValue>(value: TValue): TValue;

declare const crypto: {
  getRandomValues<TArray extends ArrayBufferView>(array: TArray): TArray;
  randomUUID(): string;
};
