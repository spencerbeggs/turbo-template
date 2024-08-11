import { cp, writeFile, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import type { Options } from "tsup";
import type { PackageJson } from "type-fest";

const reduceConditionalExports = (exportItems: PackageJson.ExportConditions, singleEntry = true) => {
	const entries = Object.entries(exportItems);
	return entries.reduce((acc, [key, value]) => {
		if (!acc["import"]) {
			acc["import"] = null;
		}
		if (!acc["require"]) {
			acc["require"] = null;
		}
		if (!acc["default"]) {
			acc["default"] = null;
		}
		if (!acc["types"]) {
			acc["types"] = null;
		}
		if (typeof value === "string") {
			let filename = value.split("/").pop() as string;
			let root = "./";
			if (!singleEntry) {
				const arr = value.match(/^.*\//g);
				if (arr) {
					root = arr[0];
				}
			}
			filename = filename.replace(/^.*\//, "");
			if (key === "types" && filename.endsWith(".ts") && !filename.endsWith(".d.ts")) {
				filename = filename.replace(".ts", ".d.ts");
			} else if (filename.endsWith(".ts")) {
				filename = filename.replace(".ts", ".js");
			}

			acc[key] = `${root}${filename}`;
		} else if (typeof value === "object" && value !== null) {
			acc[key] = reduceConditionalExports(value as PackageJson.ExportConditions);
		}
		return acc;
	}, {} as PackageJson.ExportConditions);
};

type PackageCallback = (pkg: PackageJson) => void;

export const processPackageJson = async (options: Options, cb: PackageCallback = () => void 0) => {
	const root = pathToFileURL(`${dirname(options.tsconfig as string)}/`);
	console.log(options);
	const source = new URL("./package.json", root);
	const dest = new URL("./dist/package.json", root);
	const json = await readFile(source.pathname, {
		encoding: "utf-8"
	});
	const pkg = JSON.parse(json) as PackageJson;
	if (pkg.exports) {
		const originalExports = Object.entries(pkg.exports);
		const newExports = originalExports.reduce((acc, [exportKey, exportItems]) => {
			if (typeof exportItems !== "string") {
				const singleEntry = Array.isArray(options.entry) && options.entry.length === 1;
				acc[exportKey] = reduceConditionalExports(exportItems as Record<string, string>, singleEntry);
			} else {
				if (exportKey === "types") {
					acc[exportKey] =
						exportItems.endsWith(".ts") && !exportItems.endsWith(".d.ts")
							? exportItems.replace(".ts", ".d.ts")
							: exportItems;
				} else {
					const publicDirname = options.publicDir === true ? "public" : options.publicDir;
					if (options.publicDir && exportItems.startsWith(`./${publicDirname}/`)) {
						acc[exportKey] = exportItems.replace(`./${publicDirname}/`, "./");
					} else {
						acc[exportKey] = exportItems.endsWith(".ts") ? exportItems.replace(".ts", ".js") : exportItems;
					}
				}
			}
			return acc;
		}, {} as PackageJson.ExportConditions);
		pkg.exports = newExports;
	}
	delete pkg.publishConfig;
	delete pkg.devDependencies;
	delete pkg.scripts;
	if (pkg.files) {
		for await (const [i, file] of pkg.files.entries()) {
			const source = new URL(`./${file}`, root);
			let dest = new URL(`./${options.outDir}/${file}`, root);
			if (file.startsWith("public/")) {
				dest = new URL(`./${options.outDir}/${file.substring(7)}`, root);
				pkg.files[i] = file.substring(7);
			}
			await cp(source, dest);
		}
	}

	if (cb) {
		cb(pkg);
	}

	await writeFile(dest, JSON.stringify(pkg, null, 2), {
		encoding: "utf-8"
	});
};
