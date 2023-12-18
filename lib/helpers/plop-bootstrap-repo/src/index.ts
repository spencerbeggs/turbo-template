import { readFile, writeFile, mkdir } from "node:fs/promises";
import type { PlopTypes } from "@turbo/gen";
import { valid } from "semver";
import slugify from "slugify";
import type { Merge } from "type-fest";
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
	workspace: string;
	title: string;
	pkg: {
		name: string;
		description: string;
		version: string;
		repository: {
			url: string;
		};
		homepage: string;
	};
	author: {
		name: string;
		email: string;
		url: string;
	};
};

export interface BootstrapPackageJsonAction extends PlopTypes.ActionConfig {
	type: "bootstrap-package-json";
	workspace: string;
	templateFile: string;
}

export const bootstrap = {
	prompts: [
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
			name: "title",
			message: "Package title (human readable)?",
			type: "input",
			default: "My Package",
			validate: (input: string) => {
				if (!input.length) {
					return "You must adBootstrapPackageJBootstrapPackageJsonActiond a package title";
				}
				return true;
			}
		},
		{
			name: "pkg.name",
			message: "Package name (npm)?",
			type: "input",
			default: async (answers: BootstrapRepoAnswers) => {
				return slugify(answers.title, {
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
			default: async (answers: BootstrapRepoAnswers) => {
				console.log(answers);
				const repo = await Repo.create();
				return `${repo.remote}/${answers.workspace}#readme`;
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
		const { pkg, author, turbo } = answers as Merge<TurboShim, BootstrapRepoAnswers>;
		const { templateFile, workspace } = config as BootstrapPackageJsonAction;
		const temmplatePath = `${turbo.paths.workspace}/${templateFile}`;
		const fileContents = await readFile(temmplatePath, "utf8");
		const json = JSON.parse(fileContents);
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
			author.email = json.author.email;
			if (author.url) {
				json.author.url = author.url;
			} else {
				delete json.author.url;
			}
		}
		if (pkg.repository.url) {
			json.repository.url = pkg.repository.url;
		} else {
			delete json.repository;
		}
		const outputFolder = `${turbo.paths.root}/${workspace}`;
		const outputPath = `${outputFolder}/package.json`;
		await mkdir(outputFolder, { recursive: true });
		await writeFile(outputPath, JSON.stringify(json, null, 2), "utf8");
		return "Boostraped package.json";
	});
}
