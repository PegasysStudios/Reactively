import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

/**
 * React-specific rules. Registered rule-by-rule rather than through the plugin's
 * preset export so this config is not coupled to a specific preset key name.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const reactConfig = [
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: { "react-hooks": reactHooks },
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default reactConfig;
