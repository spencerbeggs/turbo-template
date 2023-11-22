import type { PlopTypes } from "@turbo/gen";

interface ModifyJSONAction extends PlopTypes.ActionConfig {
	type: "json-modify-file"; // Point to this action
	/** Overrides, create non existing */
	force: boolean;
	JSONFile: string; // File to modify
	JSONKey?: string; // Property to append to
	JSONEntryKey?: string; // Property to add
	JSONEntryValue: string | object;
}

type ActionTypes = PlopTypes.ActionType | ModifyJSONAction;

export default function generator(plop: PlopTypes.NodePlopAPI): void {
	plop.load("plop-pack-json-modify");

	// create a generator
	plop.setGenerator("ECMA package", {
		description: "Adds a new ECMA package to the project",
		prompts: [
			{
				name: "dir",
				type: "directory",
				default: "src"
			},
			{
				name: "pkg.name",
				type: "input",
				default: "my-package"
			},
			{
				name: "pkg.version",
				type: "input",
				default: "0.0.0"
			}
		],
		actions: (data) => {
			const actions: Array<ActionTypes> = [];

			if (data) {
				console.log(data);
				actions.push({
					type: "add",
					path: "{{turbo.paths.root}}/{{dir}}/package.json",
					templateFile: "templates/package.json",
					transform(template, data) {
						const pkg = JSON.parse(template);
						pkg.name = data.pkg.name;
						pkg.version = data.pkg.version;
						return JSON.stringify(pkg, null, 2);
					}
				});
				actions.push({
					type: "json-modify-file",
					force: false,
					JSONFile: `${data.turbo.paths.root}/.vscode/settings.json`,
					JSONKey: "eslint.workingDirectories",
					JSONEntryValue: `${data.dir}`
				} as ModifyJSONAction);
			}
			return actions;
		}
	});
}
