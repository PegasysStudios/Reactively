import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Landing hero. Deliberately minimal — this is scaffolding, not a marketing site. */
export function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-24">
      <h1 className="text-5xl font-semibold tracking-tight">Reactively</h1>

      <p className="mt-4 text-2xl text-foreground-muted">React Native, visually.</p>

      <p className="mt-8 max-w-xl text-base leading-relaxed text-foreground-muted">
        Build real React Native applications in your browser. Reactively edits a structured
        application document using genuine React Native concepts — views, flex layout, components,
        routes — and generates a clean Expo project you can build for iOS, Android and web.
      </p>

      <div className="mt-10 flex items-center gap-3">
        <Button asChild size="lg">
          <Link href="/dashboard">Open Reactively</Link>
        </Button>
      </div>
    </section>
  );
}
