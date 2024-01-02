import { exec } from "node:child_process";
import { promisify } from "node:util";
import { Octokit } from "octokit";

const execAsync = promisify(exec);

export async function run(cmd: string): Promise<string> {
	const { stdout } = await execAsync(cmd);
	return stdout.trim();
}

export interface GitAuth {
	owner: string;
	repo: string;
}

export interface GitUser {
	name: string;
	email: string;
}

export class Repo {
	#client: Octokit;
	#owner: string;
	#repo: string;
	#remote: string;
	#user: GitUser;
	constructor(remote: string, auth: GitAuth, user: GitUser, client: Octokit) {
		this.#remote = remote;
		this.#owner = auth.owner;
		this.#repo = auth.repo;
		this.#client = client;
		this.#user = user;
	}

	get remote() {
		return this.#remote;
	}

	get user(): GitUser {
		return {
			name: this.#user.name,
			email: this.#user.email
		};
	}

	get auth(): GitAuth {
		return {
			owner: this.#owner,
			repo: this.#repo
		};
	}

	get client(): Octokit {
		return this.#client;
	}

	async description() {
		const description = await run("gh repo view --json description --jq '.description'");
		return description;
	}

	async title() {
		const title = await run("gh repo view --json name --jq '.name'");
		return title
			.split("-")
			.join(" ")
			.replace(/\w\S*/g, function (txt: string) {
				return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
			});
	}

	static async create(url?: string) {
		let remote = url;
		if (!remote) {
			remote = await run("git config --get remote.origin.url");
		}
		if (remote.startsWith("git@github.com:")) {
			remote = `https://github.com/${remote.replace("git@github.com:", "").trim()}`;
		}
		const arr = remote.split("/");
		const auth: GitAuth = {
			repo: arr.pop()?.replace(".git", "") as string,
			owner: arr.pop() as string
		};
		const token = await run("gh auth token");
		const client = new Octokit({
			auth: token
		});
		const user = {
			name: await run("git config --get user.name"),
			email: await run("git config --get user.email")
		};
		if (auth) {
			return new Repo(remote, auth, user, client);
		}
		throw new Error("Invalid remote");
	}
}
