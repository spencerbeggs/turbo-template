import { cp, writeFile } from "node:fs/promises";
import { defineConfig } from "tsup";
import { PackageJson } from "type-fest";

export default defineConfig(() => {
	return {
		entry: ["./src/index.ts"],
		format: "cjs",
		target: "node16",
		platform: "node",
		dts: true,
		outDir: "dist",
		publicDir: "public",
		shims: true,
		config: false,
		splitting: true,
		minify: false,
		sourcemap: false,
		clean: true,
		async onSuccess() {
			const json = await import("./package.json");
			const pkg = json.default as PackageJson;
			if (pkg.files) {
				for await (const file of pkg.files) {
					await cp(`./${file}`, `dist/${file}`);
				}
			}
			pkg.main = "index.js";
			pkg.types = "index.d.ts";
			delete pkg.devDependencies;
			delete pkg.scripts;
			await writeFile("dist/package.json", JSON.stringify(pkg, null, 2), {
				encoding: "utf-8"
			});
			await cp("./README.md", "./dist/README.md");
		}
	};
});
