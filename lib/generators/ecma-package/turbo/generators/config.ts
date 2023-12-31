import type { PlopTypes } from "@turbo/gen";
import { bootstrap, type BootstrapPackageJsonAction, type BootstrapRepoAnswers } from "plop-bootstrap-repo";
import type { AddPNPMWorkspaceAction } from "plop-turbo-pnpm-workspace";
import type { AddESLintWorkingDirectoryAction } from "plop-turbo-vscode-eslint";

type ActionTypes =
	| PlopTypes.ActionType
	| AddPNPMWorkspaceAction
	| AddESLintWorkingDirectoryAction
	| BootstrapPackageJsonAction;

export default async function generator(plop: PlopTypes.NodePlopAPI): Promise<void> {
	plop.load("plop-turbo-pnpm-workspace");
	plop.load("plop-turbo-vscode-eslint");
	plop.load("plop-bootstrap-repo");

	// create a generator
	plop.setGenerator("ECMA package", {
		description: "Adds a new ECMA package to the project",
		prompts: [...bootstrap.prompts],
		actions: (answers) => {
			const { workspace } = answers as BootstrapRepoAnswers;
			const actions: Array<ActionTypes> = [];

			actions.push({
				type: "bootstrap-package-json",
				templateFile: "turbo/generators/templates/package.json",
				workspace
			});

			actions.push({
				type: "add",
				path: "{{turbo.paths.root}}/{{workspace}}/tsconfig.json",
				templateFile: "templates/tsconfig.json",
				transform(template: string) {
					const pkg = JSON.parse(template);
					pkg.extends = `./node_modules/${pkg.extends}`;
					return JSON.stringify(pkg, null, 2);
				}
			});

			actions.push({
				type: "addMany",
				destination: "{{turbo.paths.root}}/{{workspace}}",
				templateFiles: ["templates/**/*", "!templates/package.json", "!templates/tsconfig.json"]
			});

			actions.push({
				type: "add-eslint-working-directory",
				workspace
			});

			actions.push({
				type: "add-pnpm-workspace",
				workspace
			});

			return actions;
		}
	});
}
