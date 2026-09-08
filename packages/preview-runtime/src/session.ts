import type { ProjectId, ScreenId } from "@reactively/project-schema";

import type { PreviewStatus } from "./protocol.js";

/**
 * Preview session contract.
 *
 * The long-term intent is that the preview renders the *same* runtime semantics as an
 * exported app — compile the project, run it through React Native Web — rather than a
 * separate HTML approximation of each component. A parallel HTML renderer would drift
 * from the generated app immediately and hide exactly the bugs the preview exists to
 * catch. That is why the preview reuses @reactively/generated-runtime contracts.
 */

/** Device the preview viewport is simulating. Frame chrome is presentation only. */
export interface PreviewViewport {
  readonly width: number;
  readonly height: number;
  readonly label: string;
}

export const DEFAULT_PREVIEW_VIEWPORT: PreviewViewport = {
  width: 390,
  height: 844,
  label: "iPhone 15",
};

export interface PreviewSessionState {
  readonly status: PreviewStatus;
  readonly projectId: ProjectId;
  readonly screenId: ScreenId | null;
  readonly viewport: PreviewViewport;
  readonly error: string | null;
}

/**
 * Builds the editor-embeddable preview URL.
 *
 * Kept as a pure function so the editor, tests and the future Electron shell agree on the
 * route without any of them depending on Next.js routing.
 */
export function buildPreviewPath(projectId: ProjectId, screenId?: ScreenId): string {
  const base = `/preview/${encodeURIComponent(projectId)}`;
  return screenId ? `${base}?screen=${encodeURIComponent(screenId)}` : base;
}

/** True when the preview is showing something the user can interact with. */
export function isPreviewInteractive(status: PreviewStatus): boolean {
  return status === "ready" || status === "refreshing";
}
