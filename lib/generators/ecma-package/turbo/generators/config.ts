import type { PlopTypes } from "@turbo/gen";
import type { AddPNPMWorkspacePackageAction } from "plop-add-turbo-pnpm-workspace";
import type { AddVSCodeESLintWorkspaceAction } from "plop-add-vscode-eslint-workspace";
import { bootstrap, type BootstrapPackageJsonAction } from "plop-bootstrap-repo";
import type { Merge } from "type-fest";

type ActionTypes =
	| PlopTypes.ActionType
	| AddPNPMWorkspacePackageAction
	| AddVSCodeESLintWorkspaceAction
	| BootstrapPackageJsonAction;

export default async function generator(plop: PlopTypes.NodePlopAPI): Promise<void> {
	plop.load("plop-add-turbo-pnpm-workspace");
	plop.load("plop-add-vscode-eslint-workspace");
	plop.load("plop-bootstrap-repo");

	// create a generator
	plop.setGenerator("ECMA package", {
		description: "Adds a new ECMA package to the project",
		prompts: [
			{
				name: "workspace",
				message: "Package directory?",
				type: "directory",
				default: "pkg"
			},
			...bootstrap.prompts
		],
		actions: (answers) => {
			const { workspace } = answers as Merge<typeof answers, BootstrapPackageJsonAction>;
			const actions: Array<ActionTypes> = [];

			actions.push({
				type: "bootstrap-package-json",
				workspace: workspace as string,
				templateFile: "turbo/generators/templates/package.json"
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
				type: "add-vscode-eslint-workspace",
				workspace
			});

			actions.push({
				type: "add-turbo-pnpm-workspace",
				workspace
			});

			return actions;
		}
	});
}
