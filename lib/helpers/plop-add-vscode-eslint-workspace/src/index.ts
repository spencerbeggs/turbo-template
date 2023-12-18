import { readFile, writeFile } from "node:fs/promises";
import type { PlopTypes } from "@turbo/gen";

interface TurboAnswers extends Record<string, unknown> {
	turbo: {
		paths: {
			root: string;
			workspace: string;
		};
	};
}

export interface AddVSCodeESLintWorkspaceAction extends PlopTypes.ActionConfig {
	type: "add-vscode-eslint-workspace";
	workspace: string;
}

export default async function (plop: PlopTypes.NodePlopAPI): Promise<void> {
	plop.setDefaultInclude({ actionTypes: true });
	plop.setActionType("add-vscode-eslint-workspace", async (answers, config) => {
		const { turbo } = answers as TurboAnswers;
		let { workspace } = config as AddVSCodeESLintWorkspaceAction;
		if (!workspace.startsWith("./")) {
			workspace = `./${workspace}`;
		}
		try {
			// Read the settings.json file
			const settingsPath = `${turbo.paths.root}/.vscode/settings.json`;
			const fileContents = await readFile(settingsPath, "utf8");
			const settings = JSON.parse(fileContents);

			// Modify the eslint.workingDirectories node
			const workspaces = new Set((settings["eslint.workingDirectories"] as string[]) ?? []);
			workspaces.add(workspace);
			settings["eslint.workingDirectories"] = Array.from(workspaces);

			// Write the modified settings.json back to the file
			await writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf8");
			return `Added '${workspace}' to settings.json`;
		} catch (err) {
			console.error(err);
			return "Error modifying settings.json";
		}
	});
}
