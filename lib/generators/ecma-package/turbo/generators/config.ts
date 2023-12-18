import type { PlopTypes } from "@turbo/gen";
import type { AddPNPMWorkspacePackageAction } from "plop-add-turbo-pnpm-workspace";
import type { AddAddVSCodeESLintWorkspace } from "plop-add-vscode-eslint-workspace";
import { valid } from "semver";
import { Repo } from "./repo";

interface ModifyJSONAction extends PlopTypes.ActionConfig {
	type: "json-modify-file"; // Point to this action
	/** Overrides, create non existing */
	force: boolean;
	JSONFile: string; // File to modify
	JSONKey?: string; // Property to append to
	JSONEntryKey?: string; // Property to add
	JSONEntryValue: string | object;
}

interface TurboAnswers extends Record<string, unknown> {
	dir: string;
	title: string;
	turbo: {
		paths: {
			root: string;
			workspace: string;
		};
	};
}

type ActionTypes = PlopTypes.ActionType | ModifyJSONAction | AddPNPMWorkspacePackageAction | AddAddVSCodeESLintWorkspace;

export default function generator(plop: PlopTypes.NodePlopAPI): void {
	plop.load("plop-add-turbo-pnpm-workspace");
	plop.load("plop-add-vscode-eslint-workspace");
	// create a generator
	plop.setGenerator("ECMA package", {
		description: "Adds a new ECMA package to the project",
		prompts: [
			{
				name: "dir",
				message: "Package directory?",
				type: "directory",
				default: "pkg"
			},
			{
				name: "title",
				message: "Package title (human readable)?",
				type: "input",
				default: "My Package",
				validate: (input: string) => {
					if (!input.length) {
						return "You must add a package title";
					}
					return true;
				}
			},
			{
				name: "pkg.name",
				message: "Package name (npm)?",
				type: "input",
				default: async (answers: TurboAnswers) => {
					const { default: slugify } = await import("@sindresorhus/slugify");
					return slugify(answers.title);
				},
				validate: async (input: string) => {
					const { default: validatePackageName } = await import("validate-npm-package-name");
					const { validForNewPackages, errors = [] } = validatePackageName(input);
					if (!validForNewPackages) {
						return errors.join(" ");
					}
					return true;
				}
			},
			{
				name: "pkg.description",
				message: "Package description?",
				type: "input",
				default: "Write a short description for your package",
				validate: (input: string) => {
					if (input.length < 1) {
						return "Write a short description for your package";
					}
					return true;
				}
			},
			{
				name: "pkg.version",
				message: "Package version (semver)?",
				type: "input",
				default: "0.0.0",
				validate: (input: string) => {
					return Boolean(valid(input));
				}
			},
			{
				name: "pkg.repository.url",
				message: "The URL of your package parent git repo?",
				type: "input",
				default: async () => {
					const repo = await Repo.create();
					return repo.remote;
				}
			},
			{
				name: "pkg.homepage",
				message: "The URL of your package's README.md?",
				type: "input",
				default: async (answers: TurboAnswers) => {
					const repo = await Repo.create();
					return `${repo.remote}/${answers.dir}#readme`;
				}
			},
			{
				name: "author.name",
				message: "Author name? (your full name)",
				type: "input",
				default: async () => {
					const repo = await Repo.create();
					return repo.user.name;
				}
			},
			{
				name: "author.email",
				message: "Author email? (will be public if your package is public)",
				type: "input",
				default: async () => {
					const repo = await Repo.create();
					return repo.user.email;
				}
			},
			{
				name: "author.url",
				message: "Author URL? (optional link to your website)",
				type: "input",
				default: ""
			}
		],
		actions: (data) => {
			const actions: Array<ActionTypes> = [];

			if (data) {
				actions.push({
					type: "add",
					path: "{{turbo.paths.root}}/{{dir}}/package.json",
					templateFile: "templates/package.json",
					transform(template, data) {
						const pkg = JSON.parse(template);
						pkg.name = data.pkg.name;
						if (data.pkg.description) {
							pkg.description = data.pkg.description;
						} else {
							delete pkg.description;
						}
						if (data.pkg.homepage) {
							pkg.homepage = data.pkg.homepage;
						} else {
							delete pkg.homepage;
						}
						pkg.version = data.pkg.version;
						if (data.author.name && data.author.email) {
							pkg.author.name = data.author.name;
							pkg.author.email = data.author.email;
							if (data.author.url) {
								pkg.author.url = data.author.url;
							} else {
								delete pkg.author.url;
							}
						}
						if (data.pkg.repository.url) {
							pkg.repository.url = data.pkg.repository.url;
						} else {
							delete pkg.repository;
						}
						return JSON.stringify(pkg, null, 2);
					}
				});
				actions.push({
					type: "add",
					path: "{{turbo.paths.root}}/{{dir}}/tsconfig.json",
					templateFile: "templates/tsconfig.json",
					transform(template) {
						const pkg = JSON.parse(template);
						pkg.extends = `./node_modules/${pkg.extends}`;
						return JSON.stringify(pkg, null, 2);
					}
				});
				actions.push({
					type: "addMany",
					destination: "{{turbo.paths.root}}/{{dir}}",
					templateFiles: ["templates/**/*", "!templates/package.json", "!templates/tsconfig.json"]
				});
				actions.push({
					type: "add-vscode-eslint-workspace",
					workspace: data.dir as string
				});
				actions.push({
					type: "add-turbo-pnpm-workspace",
					workspace: data.dir as string
				});
			}
			return actions;
		}
	});
}
