import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const packageJson = JSON.parse(
	readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
) as { version: string };
const templatePackageJson = JSON.parse(
	readFileSync(new URL("./template/package.json", import.meta.url), "utf-8"),
) as { engines?: { node?: string } };
const minNodeVersion =
	templatePackageJson.engines?.node?.replace(/^>=/, "") ?? "22.13.0";

export default defineConfig({
	entry: ["src/index.ts"],
	format: "esm",
	target: "node18",
	clean: true,
	banner: { js: "#!/usr/bin/env node" },
	define: {
		__APP_VERSION__: JSON.stringify(packageJson.version),
		__MIN_NODE_VERSION__: JSON.stringify(minNodeVersion),
	},
});
