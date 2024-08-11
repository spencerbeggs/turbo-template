import { processPackageJson } from "@config/tsconfig";
import { defineConfig } from "tsup";
import type { Options } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: "esm",
	outDir: "dist",
	publicDir: "public",
	shims: true,
	splitting: false,
	sourcemap: false,
	dts: true,
	clean: true,
	async onSuccess() {
		await processPackageJson(this as Options);
	}
});
