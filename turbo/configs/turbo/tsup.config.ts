import { defineConfig } from "tsup";
import { processPackageJson } from "@config/tsconfig";

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
		// check if the file package.json exists
		await processPackageJson(import.meta);
	}
});
