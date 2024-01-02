import { cp, writeFile } from "node:fs/promises";
import { defineConfig } from "tsup";
import { PackageJson } from "type-fest";

export default defineConfig((options) => {
	const isProduction = options.watch !== true;
	return {
		entry: ["./src/index.ts"],
		format: ["esm", "cjs"],
		outExtension({ format }) {
			const ext = format === "cjs" ? "js" : "mjs";
			return {
				js: `.${ext}`,
				dts: ".d.ts"
			};
		},
		target: "node16",
		platform: "node",
		dts: true,
		outDir: "dist",
		publicDir: "public",
		shims: true,
		config: true,
		minify: false,
		splitting: false,
		cjsInterop: false,
		// esbuildOptions(opts) {
		// 	opts.target = "node16";
		// 	opts.platform = "node";
		// 	opts.logLevel = "verbose";
		// 	opts.keepNames = true;
		// },
		sourcemap: !isProduction,
		clean: true,
		async onSuccess() {
			const json = await import("./package.json");
			const pkg = json.default as PackageJson;
			pkg.exports = {
				".": {
					import: "./index.mjs",
					require: "./index.js",
					default: "./index.mjs",
					types: "./index.d.ts"
				}
			};
			delete pkg.publishConfig;
			delete pkg.devDependencies;
			delete pkg.scripts;
			await writeFile("dist/package.json", JSON.stringify(pkg, null, 2), {
				encoding: "utf-8"
			});
			if (pkg.files) {
				for await (const file of pkg.files) {
					await cp(`./${file}`, `dist/${file}`);
				}
			}
			if (isProduction) {
				await cp("./LICENSE", "./dist/LICENSE");
				await cp("./README.md", "./dist/README.md");
			}
		}
	};
});
