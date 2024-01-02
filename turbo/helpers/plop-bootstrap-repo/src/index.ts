import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import type { PlopTypes } from "@turbo/gen";
import { load } from "js-yaml";
import get from "lodash/get";
import set from "lodash/set";
import { resolveConfig, format, type Options as PrettierOptions } from "prettier";
import { valid } from "semver";
import slugify from "slugify";
import type { Merge, PackageJson } from "type-fest";
import { Repo } from "./repo.js";

type TurboShim = {
	turbo: {
		paths: {
			root: string;
			workspace: string;
		};
	};
};

type Pkg = {
	name: string;
	description: string;
	version: string;
	homepage: string;
	repository: {
		url: string;
	};
};

export type BootstrapRepoAnswers = {
	init: boolean;
	single: boolean;
	workspace: string;
	rewriteRoot: boolean;
	root: {
		title: string;
		pkg: Pkg;
	};
	child: {
		title: string;
		pkg: Pkg;
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

export interface AddDependencyAction extends PlopTypes.ActionConfig {
	type: "add-dependency";
	dependency: string;
	kind?: "dev" | "peer" | "optional";
}

export interface DeleteDependencyAction extends PlopTypes.ActionConfig {
	type: "delete-dependency";
	dependency: string;
	kind?: "dev" | "peer" | "optional";
}

interface IPackageJSON {
	source: string;
	dest: string;
	prettier: PrettierOptions | null;
	isRoot: boolean;
}

type Author = {
	name: string;
	email?: string;
	url?: string;
};

function isAuthor(author: Author | string | undefined): author is Author {
	return typeof author === "object";
}

type Repository = {
	type: string;
	url: string;
};

class PackageJSON {
	source: string;
	dest: string;
	data: PackageJson;
	prettier: PrettierOptions | undefined;
	isRoot: boolean;
	private constructor(data: PackageJson, options: IPackageJSON) {
		this.source = options.source;
		this.dest = options.dest;
		this.data = data;
		this.prettier = options.prettier ?? undefined;
		this.isRoot = options.isRoot;
	}

	/** Typeguard to check if the .repository property of a package.json is an object or a string  */
	static isRepository(repository: Repository | string | undefined): repository is Repository {
		return typeof repository === "object";
	}

	static async create(answers: Merge<TurboShim, { workspace?: string }>) {
		const options = await resolveConfig(`${answers.turbo.paths.root}/.prettierrc`);

		const root = {
			source: `${answers.turbo.paths.root}/package.json`,
			dest: `${answers.turbo.paths.root}/package.json`,
			prettier: options,
			isRoot: true
		};
		const project = {
			source: answers.workspace
				? `${answers.turbo.paths.workspace}/${answers.workspace}/package.json`
				: `${answers.turbo.paths.workspace}/package.json`,
			dest: answers.workspace
				? `${answers.turbo.paths.root}/${answers.workspace}/package.json`
				: `${answers.turbo.paths.root}/package.json`,
			prettier: options,
			isRoot: false
		};
		return {
			root: new PackageJSON(await PackageJSON.read(root.source), root),
			project: new PackageJSON(await PackageJSON.read(project.source), project)
		};
	}

	static async read(path: string) {
		const data = await readFile(path, "utf-8");
		const json = JSON.parse(data) as PackageJson;
		return json;
	}

	get name() {
		return this.data.name as string;
	}

	set name(value: string) {
		this.data.name = value;
	}

	get version() {
		return this.data.version as string;
	}

	set version(value: string) {
		this.data.version = value;
	}

	get description() {
		return this.data.description as string;
	}

	set description(value: string) {
		this.data.description = value;
	}

	get homepage() {
		return this.data.homepage as string;
	}

	set homepage(value: string) {
		this.data.homepage = value;
	}

	get repository() {
		const data = this.data;
		return {
			get type(): string | undefined {
				if (PackageJSON.isRepository(data.repository)) {
					return data.repository.type;
				}
			},
			set type(value: string) {
				if (PackageJSON.isRepository(data.repository)) {
					set(data, "repository.type", value);
				} else {
					throw new Error("Cannot set type on repository string");
				}
			},
			get url(): string | undefined {
				if (PackageJSON.isRepository(data.repository)) {
					return data.repository.url;
				}
			},
			set url(value: string) {
				if (PackageJSON.isRepository(data.repository)) {
					set(data, "repository.url", value);
				} else {
					throw new Error("Cannot set url on repository string");
				}
			}
		};
	}

	delete(path: string) {
		set(this.data, path, undefined);
	}

	get author() {
		const data = this.data;
		return {
			get name(): string | undefined {
				if (isAuthor(data.author)) {
					return data.author.name;
				} else {
					return data.author;
				}
			},
			set name(value: string) {
				if (isAuthor(data.author)) {
					set(data, "author.name", value);
				} else {
					data.author = value;
				}
			},
			get email(): string | undefined {
				if (isAuthor(data.author)) {
					return data.author.email;
				} else {
					return undefined;
				}
			},
			set email(value: string) {
				if (isAuthor(data.author)) {
					set(data, "author.email", value);
				} else {
					throw new Error("Cannot set email on author string");
				}
			},
			get url(): string | undefined {
				if (isAuthor(data.author)) {
					return data.author.email;
				} else {
					return undefined;
				}
			},
			set url(value: string) {
				if (isAuthor(data.author)) {
					set(data, "author.url", value);
				} else {
					throw new Error("Cannot set url on author string");
				}
			}
		};
	}

	async save() {
		const formatted = await format(JSON.stringify(this.data, null, 2), this.prettier);
		const outputFolder = dirname(this.dest);
		await mkdir(outputFolder, { recursive: true });
		await writeFile(this.dest, formatted, "utf-8");
	}
}

class ProjectConfig {
	static async packageJson(): Promise<PackageJson> {
		const rootPackageJsonPath = resolve(__dirname, "../../../../package.json");
		const data = await readFile(rootPackageJsonPath, "utf-8");
		const pkg = JSON.parse(data) as PackageJson;
		return pkg;
	}

	/**
	 * Returns a Set of the packages property of pnpm-workspace.yaml omitting the utility workspaces.
	 * This is useful for checking if the repo is already bootstrapped.
	 * */
	static async workspaces(): Promise<Set<string>> {
		// Read the pnpm-workspace.yaml file
		const yamlPath = resolve(__dirname, "../../../../pnpm-workspace.yaml");
		const fileContents = await readFile(yamlPath, "utf8");

		// Parse the YAML content as JSON
		const json = load(fileContents) as PNPMWorkspaceYAML;

		// Modify the data
		const pkgs = new Set(json.packages);
		pkgs.delete("turbo/configs/*");
		pkgs.delete("turbo/helpers/*");
		pkgs.delete("turbo/templates/*");
		return pkgs;
	}
}

export const bootstrap = {
	/** Standard set of Inquirer prompts used to rewrite a package.json file in a Plop generator that uses the bootstrap-package-json action. */
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

	plop.setActionType("bootstrap-package-json", async (answers) => {
		const { root, child, author, init } = answers as Merge<TurboShim, BootstrapRepoAnswers>;

		const jsons = await PackageJSON.create(answers as Merge<TurboShim, BootstrapRepoAnswers>);

		/** Rewites the package.json file */
		async function rewrite(json: PackageJSON, pkg: Pkg) {
			json.name = pkg.name;
			if (pkg.description) {
				json.description = pkg.description;
			} else {
				json.delete("description");
			}
			if (pkg.homepage) {
				json.homepage = pkg.homepage;
			} else {
				json.delete("homepage");
			}
			json.version = pkg.version;
			if (author.name && author.email) {
				json.author.name = author.name;
				json.author.email = author.email;
				if (author.url) {
					json.author.url = author.url;
				} else {
					json.delete("author.url");
				}
			}
			if (pkg.repository.url) {
				json.repository.url = root.pkg.repository.url;
			} else {
				json.delete("repository");
			}

			// Write package.json to its destination
			await json.save();
		}

		try {
			if (init) {
				await rewrite(jsons.root, root.pkg);
			}

			await rewrite(jsons.project, child.pkg);
			return "Bootstrapped package.json";
		} catch (err) {
			console.error(err);
			return "Failed to bootstrap package.json";
		}
	});

	plop.setActionType("add-dependency", async (answers, config) => {
		console.log(answers, config);
		return `Added dependency`;
	});

	plop.setActionType("delete-dependency", async (answers, config) => {
		console.log(answers, config);
		return `Deleted dependency`;
	});
}
