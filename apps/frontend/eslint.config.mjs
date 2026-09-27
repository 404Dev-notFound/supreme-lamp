import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactPlugin from "eslint-plugin-react";

export default defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "public/**",
    "node_modules/**",
  ]),
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs}"],
    plugins: {
      react: reactPlugin,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "react/jsx-uses-vars": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^(React|_)" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-undef": "off",
    },
  },
]);
