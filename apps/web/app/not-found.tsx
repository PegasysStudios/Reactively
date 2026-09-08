import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-sm text-foreground-muted">The page you are looking for does not exist.</p>
      <Button asChild variant="secondary">
        <Link href="/">Back to Reactively</Link>
      </Button>
    </main>
  );
}
