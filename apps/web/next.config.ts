import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Reusable @reactively/* packages are compiled to `dist` by their own tsc build, so
  // Next consumes plain ESM and does not need `transpilePackages`. That also keeps the
  // packages honest: they must be buildable outside Next, because an Electron shell and
  // cloud workers will consume the same artifacts.

  typescript: {
    // Type errors fail the build. `pnpm typecheck` runs the same check independently.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
