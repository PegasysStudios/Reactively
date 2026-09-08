import nextPlugin from "@next/eslint-plugin-next";

import { reactConfig } from "./react.js";

/**
 * Next.js host-application rules. Applied only inside apps/web so that Next.js
 * concerns never leak into reusable packages.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const nextConfig = [
  ...reactConfig,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,

      // Pages Router rule. Reactively is App Router only, and the rule resolves its
      // `pages/` directory relative to the process cwd, so running ESLint from the
      // monorepo root makes it warn on every file.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default nextConfig;
