/**
 * Isolated application preview.
 *
 * Intended architecture:
 *
 *     Editor
 *        -> Reactively project
 *        -> compiler
 *        -> preview runtime
 *        -> React Native Web
 *        -> isolated preview iframe
 *
 * The editor will embed this route in an iframe rather than rendering the preview inside
 * its own component tree. That buys:
 *
 * - runtime isolation      a crash in the user's app cannot take down the editor
 * - CSS isolation          Reactively's Tailwind cannot leak into the rendered app
 * - error isolation        errors are attributable to the app, not to editor chrome
 * - viewport resizing      device sizes are real layout, not a CSS transform
 * - reload support         re-running the app is one iframe reload
 * - console capture        the app's console can be forwarded to a preview log panel
 *
 * The long-term goal is that this renders the *same* runtime semantics as an exported
 * app — the project compiled and run through React Native Web — rather than a separate
 * HTML approximation of each component. A parallel HTML renderer would drift from the
 * generated app and hide exactly the parity bugs the preview exists to catch.
 *
 * The editor now embeds this boundary for its Preview layout. Runtime compilation and
 * React Native Web rendering remain intentionally unimplemented.
 */
export default async function PreviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-8 text-center text-[#11162a]">
      <div>
        <h1 className="text-sm font-semibold">Reactively Preview</h1>
        <p className="mt-2 text-xs leading-relaxed text-[#8791a5]">
          React Native Web preview will render here.
        </p>
        <p className="mt-4 font-mono text-[10px] text-[#8791a5]">{projectId}</p>
      </div>
    </main>
  );
}
