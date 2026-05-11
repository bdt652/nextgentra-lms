import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Integrate Prettier - these rules turn off conflicting ESLint rules
  ...prettierConfig,
  {
    rules: {
      // Custom rules for Next.js + TypeScript + Prettier
      "prettier/prettier": "error",
    },
    plugins: ["prettier"],
  },
]);

export default eslintConfig;
