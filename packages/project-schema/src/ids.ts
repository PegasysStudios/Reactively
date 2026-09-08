import { z } from "zod";

/**
 * Reactively identifiers are opaque, stable strings.
 *
 * They are deliberately plain `string` aliases rather than branded types: the document
 * is serialized to JSON, sent over postMessage to the preview iframe and stored in
 * IndexedDB, and a nominal type would add casts at every one of those boundaries
 * without preventing a real class of bug that validation does not already catch.
 */
export const IdSchema = z.string().min(1, "Identifiers must not be empty");

export type ProjectId = string;
export type ScreenId = string;
export type NodeId = string;
export type ActionId = string;
