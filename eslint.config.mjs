import { baseConfig, corePackageRestrictedImports } from "@reactively/eslint-config/base";
import { nextConfig } from "@reactively/eslint-config/next";

/**
 * Root ESLint configuration for the whole monorepo.
 *
 * A single flat config keeps the package boundary rules in one auditable place:
 * `packages/**` is host-independent and may not import Next.js, while Next.js
 * rules apply only inside `apps/web`.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...baseConfig,

  // Reusable core packages: enforce host independence.
  {
    files: ["packages/**/*.ts", "packages/**/*.tsx"],
    rules: {
      "no-restricted-imports": ["error", corePackageRestrictedImports],
    },
  },

  // Next.js host application.
  ...nextConfig.map((config) => ({
    ...config,
    files: ["apps/web/**/*.ts", "apps/web/**/*.tsx"],
  })),

  // Test files may reach for dev-only globals and looser ergonomics.
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/e2e/**/*.ts", "**/tests/**/*.ts?(x)"],
    rules: {
      "no-console": "off",
    },
  },

  // Config files are plain Node scripts.
  {
    files: ["**/*.config.{js,mjs,ts}", "**/*.setup.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
