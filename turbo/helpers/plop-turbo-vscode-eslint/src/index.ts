import { readFile, writeFile } from "node:fs/promises";
import type { PlopTypes } from "@turbo/gen";
import { resolveConfig, format } from "prettier";

interface TurboAnswers extends Record<string, unknown> {
	turbo: {
		paths: {
			root: string;
			workspace: string;
		};
	};
}

class VSCodeSettings {
	settingsPath: string;
	prettierPath: string;
	data: Record<string, unknown>;
	workingDirectories: Set<string>;
	private constructor(data: Record<string, unknown>, settingsPath: string, prettierPath: string) {
		this.settingsPath = settingsPath;
		this.prettierPath = prettierPath;
		this.data = data;
		this.workingDirectories = new Set((data["eslint.workingDirectories"] as string[]) ?? []);
	}

	static async create(answers: TurboAnswers): Promise<VSCodeSettings> {
		const { turbo } = answers as TurboAnswers;
		const settingsPath = `${turbo.paths.root}/.vscode/settings.json`;
		const prettierPath = `${turbo.paths.root}/.prettierrc`;
		// Read the settings.json file
		const fileContents = await readFile(settingsPath, "utf8");

		// Parse the JSON content
		const data = JSON.parse(fileContents);
		return new VSCodeSettings(data, settingsPath, prettierPath);
	}

	add(workspace: string): void {
		this.workingDirectories.add(workspace);
		this.data["eslint.workingDirectories"] = Array.from(this.workingDirectories);
	}

	delete(workspace: string): void {
		this.workingDirectories.delete(workspace);
		this.data["eslint.workingDirectories"] = Array.from(this.workingDirectories);
	}

	async save() {
		// Format the modified settings.json with Prettier
		const options = await resolveConfig(this.prettierPath);
		const formatted = await format(JSON.stringify(this.data, null, 2), options ?? undefined);

		// Write the modified settings.json back to the file
		await writeFile(this.settingsPath, formatted, "utf8");
	}
}

export interface AddESLintWorkingDirectoryAction extends PlopTypes.ActionConfig {
	type: "add-eslint-working-directory";
	/** The workspace path to add to eslint.workingDirectories in VSCode's settings.json */
	workspace: string;
}

export interface DeleteESLintWorkingDirectoryAction extends PlopTypes.ActionConfig {
	type: "delete-eslint-working-directory";
	/** The workspace path to remove from eslint.workingDirectories in VSCode's settings.json */
	workspace: string;
}

export default async function (plop: PlopTypes.NodePlopAPI): Promise<void> {
	plop.setDefaultInclude({ actionTypes: true });

	plop.setActionType("add-eslint-working-directory", async (answers, config) => {
		let { workspace } = config as AddESLintWorkingDirectoryAction;
		if (!workspace.startsWith("./")) {
			workspace = `./${workspace}`;
		}
		try {
			const settings = await VSCodeSettings.create(answers as TurboAnswers);
			settings.add(workspace);
			await settings.save();
			return `Added '${workspace}' to settings.json`;
		} catch (err) {
			console.error(err);
			return "Error modifying settings.json";
		}
	});

	plop.setActionType("delete-eslint-working-directory", async (answers, config) => {
		let { workspace } = config as DeleteESLintWorkingDirectoryAction;
		if (!workspace.startsWith("./")) {
			workspace = `./${workspace}`;
		}
		try {
			const settings = await VSCodeSettings.create(answers as TurboAnswers);
			settings.delete(workspace);
			await settings.save();
			return `Deleted '${workspace}' from settings.json`;
		} catch (err) {
			console.error(err);
			return "Error modifying settings.json";
		}
	});
}
