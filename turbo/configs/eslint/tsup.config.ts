import { cp } from "node:fs/promises";
import { defineConfig } from "tsup";
import { processPackageJson } from "@config/tsconfig";

export default defineConfig((options) => {
	const isProduction = options.watch !== true;
	return {
		entry: ["./src/index.ts"],
		format: ["esm", "cjs"],
		outExtension({ format }) {
			const ext = format === "cjs" ? "cjs" : "js";
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
		cjsInterop: true,
		// esbuildOptions(opts) {
		// 	opts.target = "node16";
		// 	opts.platform = "node";
		// 	opts.logLevel = "verbose";
		// 	opts.keepNames = true;
		// },
		sourcemap: !isProduction,
		clean: true,
		async onSuccess() {
			await processPackageJson(import.meta);
			if (isProduction) {
				await cp("./LICENSE", "./dist/LICENSE");
				await cp("./README.md", "./dist/README.md");
			}
		}
	};
});
