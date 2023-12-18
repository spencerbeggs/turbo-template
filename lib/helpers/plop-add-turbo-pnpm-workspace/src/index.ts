import { readFile, writeFile } from "node:fs/promises";
import type { PlopTypes } from "@turbo/gen";
import { load, dump } from "js-yaml";

interface TurboAnswers extends Record<string, unknown> {
	turbo: {
		paths: {
			root: string;
			workspace: string;
		};
	};
}

interface PNPMWorkspaceYAML {
	packages: string[];
}

export interface AddPNPMWorkspacePackageAction extends PlopTypes.ActionConfig {
	type: "add-turbo-pnpm-workspace";
	workspace: string;
}

export default function (plop: PlopTypes.NodePlopAPI): void {
	plop.setDefaultInclude({ actionTypes: true });
	plop.setActionType("add-turbo-pnpm-workspace", async (answers, config) => {
		const { turbo } = answers as TurboAnswers;
		const { workspace } = config as AddPNPMWorkspacePackageAction;
		const yamlPath = `${turbo.paths.root}/pnpm-workspace.yaml`;
		try {
			// Read the YAML file
			const fileContents = await readFile(yamlPath, "utf8");

			// Parse the YAML content
			const data = load(fileContents) as PNPMWorkspaceYAML;

			// Modify the data
			const pkgs = new Set(data.packages);
			pkgs.add(workspace);
			data.packages = Array.from(pkgs);

			// Convert the modified object back to YAML
			const newYaml = dump(data);

			// Write the modified YAML back to the file
			await writeFile(yamlPath, newYaml, "utf8");

			return `Package '${workspace}' added to pnpm-workspace.yaml`;
		} catch (err) {
			console.error(err);
			return "Error modifying pnpm-workspace.yaml";
		}
	});
}
