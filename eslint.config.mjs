import babelParser from "@babel/eslint-parser";
import nextPlugin from "@next/eslint-plugin-next";
import { fixupPluginRules } from "@eslint/compat";
import importPluginLegacy from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import tsdocPlugin from "eslint-plugin-tsdoc";
import turboPlugin from "eslint-plugin-turbo";
import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

const importPlugin = fixupPluginRules(importPluginLegacy);

const config = tseslint.config(
	{
		ignores: ["**/dist", "**/node_modules"]
	},
	{
		files: ["**/*.ts", "**/*.tsx"],
		plugins: {
			import: importPlugin,
			turbo: turboPlugin,
			prettier: prettierPlugin
		},
		extends: [eslint.configs.reccomended, ...tseslint.configs.recommendedTypeChecked],
		languageOptions: {
			parserOptions: {
				projectService: true
			}
		},
		rules: {
			"@typescript-eslint/array-type": "error",
			"@typescript-eslint/consistent-type-imports": "error"
		}
	}
);

export default config;
