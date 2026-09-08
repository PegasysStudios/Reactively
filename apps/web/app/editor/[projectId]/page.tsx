import { EditorShell } from "@/components/editor/editor-shell";

/**
 * The visual application builder.
 *
 * Architectural scaffolding only: this renders the workspace regions the editor will
 * occupy. No editing behaviour is implemented.
 *
 * Next code-splits per route, so everything the editor imports — the future canvas engine,
 * dnd-kit, the layout engine — stays out of the marketing and dashboard bundles by
 * construction.
 */
export default async function EditorPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <EditorShell projectId={projectId} />;
}
