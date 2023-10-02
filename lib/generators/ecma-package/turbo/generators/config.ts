import type { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
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
			console.log(data);
			const actions: Array<PlopTypes.ActionType> = [];
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
			return actions;
		}
	});
}
