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

class PNPMWorkspaces {
	yamlPath: string;
	data: PNPMWorkspaceYAML;
	packages: Set<string>;
	private constructor(data: PNPMWorkspaceYAML, yamlPath: string) {
		this.yamlPath = yamlPath;
		this.data = data;
		this.packages = new Set(data.packages);
	}

	static async create(answers: TurboAnswers): Promise<PNPMWorkspaces> {
		const { turbo } = answers as TurboAnswers;
		const yamlPath = `${turbo.paths.root}/pnpm-workspace.yaml`;
		// Read the YAML file
		const fileContents = await readFile(yamlPath, "utf8");

		// Parse the YAML content
		const data = load(fileContents) as PNPMWorkspaceYAML;
		return new PNPMWorkspaces(data, yamlPath);
	}

	add(pkg: string): void {
		this.packages.add(pkg);
		this.data.packages = Array.from(this.packages);
	}

	delete(pkg: string): void {
		this.packages.delete(pkg);
		this.data.packages = Array.from(this.packages);
	}

	async save() {
		// Convert the modified object back to YAML
		const newYaml = dump(this.data);

		// Write the modified YAML back to the file
		await writeFile(this.yamlPath, newYaml, "utf8");
	}
}

export interface AddPNPMWorkspaceAction extends PlopTypes.ActionConfig {
	type: "add-pnpm-workspace";
	/** The workspace glob to add to pnpm-workspace.yaml */
	workspace: string;
}

export interface DeletePNPMWorkspaceAction extends PlopTypes.ActionConfig {
	type: "delete-pnpm-workspace";
	/** The workspace glob to remove from pnpm-workspace.yaml */
	workspace: string;
}

export default async function (plop: PlopTypes.NodePlopAPI): Promise<void> {
	plop.setDefaultInclude({ actionTypes: true });

	plop.setActionType("add-pnpm-workspace", async (answers, config) => {
		const data = answers as TurboAnswers;
		const { workspace } = config as AddPNPMWorkspaceAction;
		try {
			const workspaces = await PNPMWorkspaces.create(data);
			workspaces.add(workspace);
			await workspaces.save();

			return `Package '${workspace}' added to pnpm-workspace.yaml`;
		} catch (err) {
			console.error(err);
			return `Error adding '${workspace}' to pnpm-workspace.yaml`;
		}
	});

	plop.setActionType("delete-pnpm-workspace", async (answers, config) => {
		const data = answers as TurboAnswers;
		const { workspace } = config as AddPNPMWorkspaceAction;
		try {
			const workspaces = await PNPMWorkspaces.create(data);
			workspaces.delete(workspace);
			await workspaces.save();

			return `Package '${workspace}' deleted from pnpm-workspace.yaml`;
		} catch (err) {
			console.error(err);
			return `Error deleting '${workspace}' from pnpm-workspace.yaml`;
		}
	});
}
