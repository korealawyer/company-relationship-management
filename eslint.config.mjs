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
    "test*.js",
    "test*.cjs",
    "test*.mjs",
    "test*.ts",
    "_docs/**"
  ]),
  {
    rules: {
      "max-lines": ["warn", { "max": 250, "skipBlankLines": true, "skipComments": true }],
      "max-lines-per-function": ["warn", { "max": 100, "skipBlankLines": true, "skipComments": true }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
      "prefer-const": "off",
      "react-compiler/react-compiler": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/purity": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "@next/next/no-html-link-for-pages": "off",
      "react-hooks/globals": "off"
    }
  }
]);

export default eslintConfig;
