import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Imports that reusable @reactively/* packages must never reach for.
 *
 * Reactively Core is host-independent: Next.js is only the first host application,
 * and an Electron shell plus cloud workers are expected to consume the same packages.
 * See docs/ARCHITECTURE.md.
 */
export const corePackageRestrictedImports = {
  patterns: [
    {
      group: ["next", "next/*"],
      message:
        "Reusable @reactively/* packages must not depend on Next.js. Move host-specific code into apps/web.",
    },
    {
      group: ["@reactively/web", "@reactively/web/*"],
      message: "Core packages must never depend on a host application.",
    },
    {
      group: ["@reactively/*/src/*", "@reactively/*/dist/*"],
      message:
        "Deep imports are not part of a package's public API. Import from the package root instead.",
    },
  ],
};

/** Shared rules applied to every TypeScript file in the monorepo. */
const sharedTypeScriptRules = {
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/consistent-type-imports": [
    "error",
    { prefer: "type-imports", fixStyle: "inline-type-imports" },
  ],
  "@typescript-eslint/no-unused-vars": [
    "error",
    { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
  ],
  "no-console": ["warn", { allow: ["warn", "error"] }],
  eqeqeq: ["error", "always", { null: "ignore" }],
};

/** @type {import("eslint").Linter.Config[]} */
export const baseConfig = [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/.corepack-bin/**",
      // The Expo template is generator input, not monorepo source. It is linted by
      // the generated app's own toolchain after materialization.
      "templates/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node, ...globals.es2023 },
    },
    rules: sharedTypeScriptRules,
  },
  prettier,
];

export default baseConfig;
