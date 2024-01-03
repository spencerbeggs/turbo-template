import babelParser from "@babel/eslint-parser";
import jsPlugin from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import type { Linter } from "eslint";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import tsdocPlugin from "eslint-plugin-tsdoc";
import turboPlugin from "eslint-plugin-turbo";
import globals from "globals";

export function makeConfig(nextApps: string[]): Linter.FlatConfig[] {
	return [
		{
			ignores: ["**/.next/**/*", "**/dist/**", "**/node_modules/**/*"]
		},
		{
			files: ["**/*.{js,jsx,cjs,mjs}"],
			ignores: [],
			plugins: {
				import: importPlugin,
				turbo: turboPlugin,
				prettier: prettierPlugin
			},
			languageOptions: {
				sourceType: "module",
				parser: babelParser,
				parserOptions: {
					requireConfigFile: false,
					babelOptions: {
						babelrc: false,
						configFile: false,
						// your babel options
						presets: ["@babel/preset-env"]
					}
				},
				globals: {
					...globals.node
				}
			},
			settings: {
				"import/resolver": {
					typescript: {}
				},
				"import/parsers": {
					"@typescript-eslint/parser": [".js", ".jsx", ".ts", ".tsx"]
				}
			},
			rules: {
				...jsPlugin.configs.recommended.rules,
				...turboPlugin.configs.recommended.rules,
				...importPlugin.configs.recommended.rules,
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
				],
				"import/no-mutable-exports": "error",
				"import/no-namespace": "error",
				"import/newline-after-import": ["error", { count: 1 }],
				"import/extensions": [
					"error",
					"ignorePackages",
					{
						js: "never",
						jsx: "never",
						ts: "never",
						tsx: "never"
					}
				]
			}
		},
		{
			files: [...nextApps.map((app) => `${app}/**/*.{ts,tsx}`)],
			ignores: [],
			plugins: {
				import: importPlugin,
				turbo: turboPlugin,
				//@ts-expect-error see: https://github.com/typescript-eslint/typescript-eslint/issues/7694
				"@typescript-eslint": typescriptPlugin,
				"@next/next": nextPlugin,
				prettier: prettierPlugin,
				tsdoc: tsdocPlugin
			},
			languageOptions: {
				sourceType: "module",
				//@ts-expect-error see: https://github.com/typescript-eslint/typescript-eslint/issues/7694
				parser: typescriptParser,
				parserOptions: {
					ecmaVersion: 2022,
					sourceType: "module"
				},
				globals: {
					...globals.node
				}
			},
			settings: {
				"import/parsers": {
					"@typescript-eslint/parser": [".ts", ".tsx", ".cts", ".mts"]
				},
				"import/resolver": {
					typescript: {
						alwaysTryTypes: true,
						project: nextApps.map((app) => `./${app}/tsconfig.json`)
					},
					node: {
						extensions: [".js", ".jsx", ".ts", ".tsx"]
					}
				},
				//"import/no-unresolved": [2, { ignore: ["^@components/(.*)$"] }],
				"@next/next": {
					rootDir: nextApps.map((app) => `./${app}/`)
				}
			},
			rules: {
				...turboPlugin.configs.recommended.rules,
				...typescriptPlugin.configs["eslint-recommended"].rules,
				...typescriptPlugin.configs.recommended.rules,
				...importPlugin.configs.recommended.rules,
				...nextPlugin.configs.recommended.rules,
				...nextPlugin.configs["core-web-vitals"].rules,
				"@next/next/no-html-link-for-pages": ["error", [...nextApps.map((app) => `./${app}/app/`)]],
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
				],
				"import/no-mutable-exports": "error",
				"import/no-namespace": "error",
				"import/newline-after-import": ["error", { count: 1 }],
				"import/extensions": [
					"error",
					"ignorePackages",
					{
						js: "never",
						jsx: "never",
						ts: "never",
						tsx: "never"
					}
				]
			}
		},
		{
			files: ["**/*.{ts,tsx}"],
			ignores: [...nextApps.map((app) => `${app}/**/*.{ts,tsx}`)],
			plugins: {
				import: importPlugin,
				turbo: turboPlugin,
				//@ts-expect-error see: https://github.com/typescript-eslint/typescript-eslint/issues/7694
				"@typescript-eslint": typescriptPlugin,
				prettier: prettierPlugin,
				tsdoc: tsdocPlugin
			},
			languageOptions: {
				sourceType: "module",
				//@ts-expect-error see: https://github.com/typescript-eslint/typescript-eslint/issues/7694
				parser: typescriptParser,
				parserOptions: {
					ecmaVersion: 2022,
					sourceType: "module"
				},
				globals: {
					...globals.node
				}
			},
			settings: {
				"import/parsers": {
					"@typescript-eslint/parser": [".ts", ".tsx", ".cts", ".mts"]
				},
				"import/resolver": {
					typescript: {
						alwaysTryTypes: true,
						project: "./tsconfig.json"
					},
					node: {
						extensions: [".js", ".jsx", ".ts", ".tsx"]
					}
				}
			},
			rules: {
				...turboPlugin.configs.recommended.rules,
				...typescriptPlugin.configs["eslint-recommended"].rules,
				...typescriptPlugin.configs.recommended.rules,
				...importPlugin.configs.recommended.rules,
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
				],
				"import/no-mutable-exports": "error",
				"import/no-namespace": "error",
				"import/newline-after-import": ["error", { count: 1 }],
				"import/extensions": [
					"error",
					"ignorePackages",
					{
						js: "never",
						jsx: "never",
						ts: "never",
						tsx: "never"
					}
				]
			}
		}
	];
}
