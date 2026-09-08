/**
 * Stable identifier helpers.
 *
 * Reactively project documents reference everything by ID (nodes, screens, actions,
 * assets). IDs are opaque strings so that renaming a screen or component never breaks
 * an internal reference.
 */

const ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const ID_LENGTH = 12;

/**
 * Generates a URL-safe, collision-resistant identifier.
 *
 * Uses `crypto.getRandomValues`, which is available in Node 20+, browsers and React
 * Native's Hermes runtime, so this stays host-independent.
 */
export function createId(prefix?: string): string {
  const bytes = new Uint8Array(ID_LENGTH);
  crypto.getRandomValues(bytes);

  let id = "";
  for (const byte of bytes) {
    id += ID_ALPHABET[byte % ID_ALPHABET.length];
  }

  return prefix ? `${prefix}_${id}` : id;
}

/** Creates a deterministic ID factory. Used by tests and by deterministic generation. */
export function createSequentialIdFactory(prefix: string): () => string {
  let counter = 0;
  return () => {
    counter += 1;
    return `${prefix}_${counter}`;
  };
}
