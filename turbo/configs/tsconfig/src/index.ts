import { dir } from "node:console";
import { cp, writeFile, readFile } from "node:fs/promises";
import { PackageJson } from "type-fest";

export const processPackageJson = async (meta: ImportMeta) => {
	const root = new URL(meta.url);
	const source = new URL("./package.json", root);
	const dest = new URL("./dist/package.json", root);
	const json = await readFile(source.pathname, {
		encoding: "utf-8"
	});
	const pkg = JSON.parse(json) as PackageJson;
	if (pkg.exports) {
		const newExports = Object.entries(pkg.exports).reduce((acc, [exportKey, exportItems]) => {
			console.log(exportKey, exportItems);
			if (typeof exportItems !== "string") {
				acc[exportKey] = Object.entries(exportItems as Record<string, string>).reduce(
					(acc2, [key, value]) => {
						if (key === "types") {
							acc2[key] = value.replace("src/", "").replace(".ts", ".d.ts");
						} else {
							acc2[key] = value.replace("src/", "").replace(".ts", ".js");
						}
						return acc2;
					},
					{} as Record<string, string>
				);
			}
			return acc;
		}, {} as PackageJson.ExportConditions);
		pkg.exports = newExports;
	}
	delete pkg.publishConfig;
	delete pkg.devDependencies;
	delete pkg.scripts;
	if (pkg.files) {
		for await (const file of pkg.files) {
			const source = new URL(`./${file}`, root);
			const dest = new URL(`./dist/${file}`, root);
			await cp(source, dest);
		}
	}
	console.log(pkg);
	await writeFile(dest, JSON.stringify(pkg, null, 2), {
		encoding: "utf-8"
	});
};
