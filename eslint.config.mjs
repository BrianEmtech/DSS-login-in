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
    // The Python side. Without this, ESLint walks into the virtualenv and
    // lints django.contrib.admin's vendored jQuery/select2/xregexp bundles,
    // which drowns the app's own output in ~1500 irrelevant problems.
    "backend/**",
  ]),
]);

export default eslintConfig;
