import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import customRules from "./eslint-rules/index.mjs";

export default tseslint.config(
  {
    ignores: [
      ".next",
      "node_modules",
      "dist",
      "build",
      "coverage",
      "next-env.d.ts",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    ignores: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "tests/**/*",
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      custom: customRules,
    },
    rules: {
      // コーディング規約: any型の使用禁止
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      // コーディング規約: 型アサーション（as）の使用禁止
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "never",
        },
      ],
      // コーディング規約: ifネストブロックの禁止
      "max-depth": ["error", 1],
      // コーディング規約: マジックナンバーの禁止
      "no-magic-numbers": [
        "error",
        {
          ignore: [-1, 0, 1],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          detectObjects: false,
          enforceConst: true,
        },
      ],
      // カスタムルール: オプショナルチェーン禁止
      "custom/no-optional-chain": "error",
      // カスタムルール: else if禁止
      "custom/no-else-if": "error",
      // カスタムルール: undefined型禁止
      "custom/no-undefined-type": "error",
      // カスタムルール: null型禁止
      "custom/no-null-type": "error",
      // カスタムルール: unknown型禁止
      "custom/no-unknown-type": "error",
      // カスタムルール: never型禁止
      "custom/no-never-type": "error",
      // カスタムルール: オプショナル型禁止
      "custom/no-optional-type": "error",
    },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "tests/**/*.ts",
      "tests/**/*.tsx",
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: "./tsconfig.test.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      custom: customRules,
    },
    rules: {
      // コーディング規約: any型の使用禁止
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      // コーディング規約: 型アサーション（as）の使用禁止
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "never",
        },
      ],
      // コーディング規約: ifネストブロックの禁止
      "max-depth": ["error", 1],
      // コーディング規約: マジックナンバーの禁止
      "no-magic-numbers": [
        "error",
        {
          ignore: [-1, 0, 1],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          detectObjects: false,
          enforceConst: true,
        },
      ],
      // カスタムルール: オプショナルチェーン禁止
      "custom/no-optional-chain": "error",
      // カスタムルール: else if禁止
      "custom/no-else-if": "error",
      // カスタムルール: undefined型禁止
      "custom/no-undefined-type": "error",
      // カスタムルール: null型禁止
      "custom/no-null-type": "error",
      // カスタムルール: unknown型禁止
      "custom/no-unknown-type": "error",
      // カスタムルール: never型禁止
      "custom/no-never-type": "error",
      // カスタムルール: オプショナル型禁止
      "custom/no-optional-type": "error",
    },
  },
  prettierConfig
);
