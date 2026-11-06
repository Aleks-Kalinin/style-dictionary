import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
    // Build output and generated code -- linting minified bundles or
    // generated Prisma/Pothos files produces thousands of useless findings.
    "storybook-static/**",
    "src/generated/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
