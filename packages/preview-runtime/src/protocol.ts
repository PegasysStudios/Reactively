import type { NodeId, ReactivelyProject, ScreenId } from "@reactively/project-schema";

/**
 * Editor <-> preview message protocol.
 *
 * The preview runs inside an isolated iframe rather than in the editor's React tree:
 *
 *     Editor -> Reactively project -> compiler -> preview runtime
 *            -> React Native Web -> isolated preview iframe
 *
 * Isolation buys runtime, CSS and error isolation, independent viewport sizing, cheap
 * reloads and console capture. It also forces the canvas and the preview to render from
 * the same document independently, which is how parity bugs get caught instead of hidden.
 *
 * Because the boundary is `postMessage`, everything crossing it must be structured-
 * cloneable — no functions, no class instances.
 */

/** Preview lifecycle, mirroring docs/PREVIEW_SYSTEM.md. */
export type PreviewStatus =
  "idle" | "preparing" | "starting" | "ready" | "refreshing" | "failed" | "stopping";

/** Messages the editor sends into the preview iframe. */
export type PreviewHostMessage =
  | { readonly type: "project:replace"; readonly project: ReactivelyProject }
  | { readonly type: "screen:navigate"; readonly screenId: ScreenId }
  | { readonly type: "selection:highlight"; readonly nodeIds: readonly NodeId[] }
  | { readonly type: "viewport:resize"; readonly width: number; readonly height: number }
  | { readonly type: "preview:reload" };

/** Messages the preview iframe sends back to the editor. */
export type PreviewClientMessage =
  | { readonly type: "status"; readonly status: PreviewStatus }
  | { readonly type: "error"; readonly message: string; readonly nodeId?: NodeId }
  | { readonly type: "console"; readonly level: "log" | "warn" | "error"; readonly message: string }
  | { readonly type: "node:pressed"; readonly nodeId: NodeId };

/**
 * Origin marker on every message.
 *
 * The preview iframe shares a window message channel with anything else on the page, so
 * both sides must be able to reject messages that are not ours.
 */
export const PREVIEW_MESSAGE_SOURCE = "reactively-preview";

export interface PreviewEnvelope<TMessage> {
  readonly source: typeof PREVIEW_MESSAGE_SOURCE;
  readonly projectId: string;
  readonly payload: TMessage;
}

export function createEnvelope<TMessage>(
  projectId: string,
  payload: TMessage,
): PreviewEnvelope<TMessage> {
  return { source: PREVIEW_MESSAGE_SOURCE, projectId, payload };
}

/**
 * Type guard for inbound messages.
 *
 * Written defensively: this runs against untrusted `MessageEvent.data`, which can be any
 * value at all.
 */
export function isPreviewEnvelope<TMessage>(
  value: unknown,
  projectId: string,
): value is PreviewEnvelope<TMessage> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<PreviewEnvelope<TMessage>>;
  return candidate.source === PREVIEW_MESSAGE_SOURCE && candidate.projectId === projectId;
}
