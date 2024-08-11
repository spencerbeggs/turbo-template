import nextPlugin from "@next/eslint-plugin-next";
import { fixupPluginRules } from "@eslint/compat";
import importPluginLegacy from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import tsdocPlugin from "eslint-plugin-tsdoc";
import turboPlugin from "eslint-plugin-turbo";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

const importPlugin = fixupPluginRules(importPluginLegacy);

const config = tseslint.config(
	{
		ignores: ["**/dist", "**/node_modules", "**/.next", "**/vendor"]
	},
	{
		files: ["**/*.ts", "**/*.tsx"],
		plugins: {
			import: importPlugin,
			turbo: turboPlugin,
			prettier: prettierPlugin,
			tsdoc: tsdocPlugin,
			next: nextPlugin
		},
		extends: [eslint.configs.reccomended, ...tseslint.configs.recommendedTypeChecked],
		languageOptions: {
			parserOptions: {
				projectService: true,
			}
		},
		rules: {
			"@typescript-eslint/array-type": "error",
			"@typescript-eslint/consistent-type-imports": "error",
			"@typescript-eslint/no-unsafe-member-access": "warn",
			"@typescript-eslint/no-unsafe-argument": "warn",
			"@typescript-eslint/no-unsafe-return": "warn",
			"@typescript-eslint/no-unsafe-assignment": "warn",
			"@typescript-eslint/no-unsafe-call": "warn",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					args: "all",
					argsIgnorePattern: "^_",
					caughtErrors: "all",
					caughtErrorsIgnorePattern: "^_|err",
					destructuredArrayIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					ignoreRestSiblings: true
				}
			],
			"import/order": [
				"error",
				{
					groups: ["builtin", "external", "internal", "parent", "sibling", "index", "object"],
					"newlines-between": "never",
					alphabetize: {
						order: "asc",
						caseInsensitive: true
					}
				}
			]
		}
	}
);

export default config;
