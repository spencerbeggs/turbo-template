import type { Options } from "tsup";
import { defineConfig } from "tsup";
import { processPackageJson } from "./src/index.js";

export default defineConfig({
	entry: ["src/index.ts"],
	format: "esm",
	outExtension({ format }) {
		const ext = format === "cjs" ? "cjs" : "js";
		return {
			js: `.${ext}`,
			dts: ".d.ts"
		};
	},
	outDir: "dist",
	publicDir: "public",
	shims: true,
	dts: true,
	splitting: false,
	sourcemap: false,
	clean: true,
	async onSuccess() {
		await processPackageJson(this as Options);
	}
});
