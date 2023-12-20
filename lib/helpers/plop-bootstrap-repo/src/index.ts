import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import type { PlopTypes } from "@turbo/gen";
import { load } from "js-yaml";
import { set, get } from "lodash";
import { resolveConfig, format } from "prettier";
import { valid } from "semver";
import slugify from "slugify";
import type { Merge, PackageJson } from "type-fest";
import { Repo } from "./repo";

type TurboShim = {
	turbo: {
		paths: {
			root: string;
			workspace: string;
		};
	};
};

export type BootstrapRepoAnswers = {
	init: boolean;
	single: boolean;
	workspace: string;
	rewriteRoot: boolean;
	root: {
		title: string;
		pkg: {
			name: string;
			description: string;
			version: string;
			homepage: string;
			repository: {
				url: string;
			};
		};
	};
	child: {
		title: string;
		pkg: {
			name: string;
			description: string;
			version: string;
			homepage: string;
		};
	};
	author: {
		name: string;
		email: string;
		url: string;
	};
};

interface PNPMWorkspaceYAML {
	packages: string[];
}

export interface BootstrapPackageJsonAction extends PlopTypes.ActionConfig {
	type: "bootstrap-package-json";
	workspace: string;
	templateFile: string;
}

class ProjectConfig {
	static async packageJson(): Promise<PackageJson> {
		const rootPackageJsonPath = resolve(__dirname, "../../../../package.json");
		const data = await readFile(rootPackageJsonPath, "utf-8");
		const pkg = JSON.parse(data) as PackageJson;
		return pkg;
	}

	static async workspaces(): Promise<Set<string>> {
		// Read the pnpm-workspace.yaml file
		const yamlPath = resolve(__dirname, "../../../../pnpm-workspace.yaml");
		const fileContents = await readFile(yamlPath, "utf8");

		// Parse the YAML content as JSON
		const json = load(fileContents) as PNPMWorkspaceYAML;

		// Modify the data
		const pkgs = new Set(json.packages);
		pkgs.delete("lib/configs/*");
		pkgs.delete("lib/generators/*");
		pkgs.delete("lib/helpers/*");
		return pkgs;
	}
}

export const bootstrap = {
	prompts: [
		{
			name: "init",
			type: "confirm",
			default: false,
			when: async (answers: BootstrapRepoAnswers) => {
				const workspaces = await ProjectConfig.workspaces();
				answers.init = workspaces.size === 0;
				return false;
			}
		},
		{
			name: "single",
			message: "Will this child package be the only public package in the monorepo?",
			type: "confirm",
			default: async (answers: BootstrapRepoAnswers) => {
				return !answers.init;
			},
			when: async (answers: BootstrapRepoAnswers) => {
				if (answers.init) {
					answers.single = false;
				}
				return answers.init;
			}
		},
		{
			name: "workspace",
			message: "Workspace package directory?",
			type: "directory",
			default: (answers: BootstrapRepoAnswers) => {
				return answers.single ? "src" : "pkg";
			}
		},
		{
			name: "root.title",
			message: "Root package title (human readable)?",
			default: async () => {
				const repo = await Repo.create();
				const title = await repo.title();
				return title;
			},
			validate: (input: string) => {
				if (!input.length) {
					return "You must add a root package title";
				}
				return true;
			},
			when: async (answers: BootstrapRepoAnswers) => {
				if (answers.init) {
					const repo = await Repo.create();
					const title = await repo.title();
					set(answers, "root.title", title);
				}
				return answers.init && !answers.single;
			}
		},
		{
			name: "root.pkg.name",
			message: "Root package name (npm)?",
			type: "input",
			default: async (answers: BootstrapRepoAnswers) => {
				const pkg = await ProjectConfig.packageJson();
				if (answers.init) {
					return slugify(answers.root.title, {
						lower: true,
						trim: true,
						strict: true
					});
				}
				return pkg.name;
			},
			validate: async (input: string) => {
				const { default: validatePackageName } = await import("validate-npm-package-name");
				const { validForNewPackages, errors = [] } = validatePackageName(input);
				if (!validForNewPackages) {
					return errors.join(" ");
				}
				return true;
			},
			when: async (answers: BootstrapRepoAnswers) => {
				if (!answers.init) {
					const pkg = await ProjectConfig.packageJson();
					set(answers, "root.pkg.name", pkg.name);
				}
				return answers.init && !answers.single;
			}
		},
		{
			name: "root.pkg.description",
			message: "Root package description?",
			default: async () => {
				const repo = await Repo.create();
				const description = await repo.description();
				return description;
			},
			validate: (input: string) => {
				if (!input.length) {
					return "You must add a root package title";
				}
				return true;
			},
			when: async (answers: BootstrapRepoAnswers) => {
				if (!answers.init) {
					const pkg = await ProjectConfig.packageJson();
					set(answers, "root.pkg.description", pkg.description);
				}
				if (answers.init && answers.single) {
					const repo = await Repo.create();
					const description = await repo.description();
					set(answers, "root.pkg.description", description);
				}
				return answers.init && !answers.single;
			}
		},
		{
			name: "root.pkg.repository.url",
			message: "The URL of your package's parent git repo?",
			type: "input",
			default: async () => {
				const repo = await Repo.create();
				return repo.remote;
			},
			when: async (answers: BootstrapRepoAnswers) => {
				if (!answers.init) {
					const pkg = await ProjectConfig.packageJson();
					const url = get(pkg, "repository.url");
					set(answers, "root.pkg.repository.url", url);
				}
				return answers.init;
			}
		},
		{
			name: "root.pkg.homepage",
			message: "The URL of your root git repo?",
			type: "input",
			default: async () => {
				const repo = await Repo.create();
				return `${repo.remote}#readme`;
			},
			when: async (answers: BootstrapRepoAnswers) => {
				answers.root.pkg.homepage = `${answers.root.pkg.repository.url.replace(".git", "")}#readme`;
				return false;
			}
		},
		{
			name: "child.title",
			message: "Workspace package title (human readable)?",
			type: "input",
			default: async (answers: BootstrapRepoAnswers) => {
				const repo = await Repo.create();
				const title = await repo.title();
				return answers.single ? title : "My Package";
			},
			validate: (input: string) => {
				if (!input.length) {
					return "You must add a package title";
				}
				return true;
			}
		},
		{
			name: "child.pkg.name",
			message: "Package name (npm)?",
			type: "input",
			default: async (answers: BootstrapRepoAnswers) => {
				return slugify(answers.child.title, {
					lower: true,
					trim: true,
					strict: true
				});
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
			name: "child.pkg.description",
			message: "Package description?",
			type: "input",
			default: async (answers: BootstrapRepoAnswers) => {
				const repo = await Repo.create();
				const description = await repo.description();
				return answers.single ? description : "Write a short description for your package";
			},
			validate: (input: string) => {
				if (input.length < 1) {
					return "Write a short description for your package";
				}
				return true;
			}
		},
		{
			name: "child.pkg.version",
			message: "Package version (semver)?",
			type: "input",
			default: "0.0.0",
			validate: (input: string) => {
				return Boolean(valid(input));
			}
		},
		{
			name: "child.pkg.homepage",
			message: "The URL of your package's README.md?",
			type: "input",
			default: async (answers: BootstrapRepoAnswers) => {
				const repo = await Repo.create();
				if (answers.single) {
					return `${repo.remote.replace(".git", "")}#readme`;
				}
				return `${repo.remote.replace(".git", "")}/${answers.workspace}#readme`;
			}
		},
		{
			name: "root.pkg.version",
			message: "Root package version?",
			default: "0.0.0",
			when: (answers) => {
				set(answers, "root.pkg.version", "0.0.0");
				if (answers.init && answers.single) {
					set(answers, "root.pkg.name", answers.child.pkg.name);
					set(answers, "root.pkg.description", answers.child.pkg.description);
				} else if (!answers.init) {
					const pkg = ProjectConfig.packageJson();
					const name = get(pkg, "name");
					const description = get(pkg, "description");
					set(answers, "root.pkg.name", name);
					set(answers, "root.pkg.description", description);
				}
				return false;
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
	] as PlopTypes.PromptQuestion[]
};

export default function generator(this: PlopTypes.PlopGenerator, plop: PlopTypes.NodePlopAPI): void {
	plop.setDefaultInclude({
		actionTypes: true,
		generators: true,
		helpers: true,
		partials: true
	});

	plop.setActionType("bootstrap-package-json", async (answers, config) => {
		console.log(answers);
		const { root, child, author, turbo, init } = answers as Merge<TurboShim, BootstrapRepoAnswers>;
		const { templateFile, workspace } = config as BootstrapPackageJsonAction;
		const projectWorkspace = {
			source: `${turbo.paths.workspace}/${templateFile}`,
			dest: `${turbo.paths.root}/${workspace}/package.json`
		};
		const rootWorkspace = {
			source: `${turbo.paths.root}/package.json`,
			dest: `${turbo.paths.root}/package.json`
		};

		async function rewritePackageJson(source: string, dest: string) {
			const isRoot = source === dest;
			const fileContents = await readFile(source, "utf8");
			const json = JSON.parse(fileContents);
			const pkg = isRoot ? root.pkg : child.pkg;
			json.name = pkg.name;
			if (pkg.description) {
				json.description = pkg.description;
			} else {
				delete json.description;
			}
			if (pkg.homepage) {
				json.homepage = pkg.homepage;
			} else {
				delete json.homepage;
			}
			json.version = pkg.version;
			if (author.name && author.email) {
				json.author.name = author.name;
				json.author.email = author.email;
				if (author.url) {
					json.author.url = author.url;
				} else {
					delete json.author.url;
				}
			}
			if (root.pkg.repository.url) {
				json.repository.url = root.pkg.repository.url;
			} else {
				delete json.repository;
			}

			// Format the modified settings.json with Prettier
			const options = await resolveConfig(`${turbo.paths.root}/.prettierrc`);
			const formatted = await format(JSON.stringify(json, null, 2), options ?? undefined);

			// Write package.json to its destination
			const outputFolder = dirname(dest);
			await mkdir(outputFolder, { recursive: true });
			await writeFile(dest, formatted, "utf8");
		}

		try {
			if (init) {
				await rewritePackageJson(rootWorkspace.source, rootWorkspace.dest);
			}

			await rewritePackageJson(projectWorkspace.source, projectWorkspace.dest);
			return "Boostraped package.json";
		} catch (err) {
			console.error(err);
			return "Failed to bootsrap package.json";
		}
	});
}
