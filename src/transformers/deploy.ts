import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Apply deploy target configuration.
 *
 * - "cloudflare": Add @astrojs/cloudflare adapter, wrangler.jsonc, deploy scripts
 * - "other": No adapter, vanilla static Astro output
 */
export async function applyDeployTarget(
	dir: string,
	target: "cloudflare" | "other",
) {
	if (target === "cloudflare") {
		await applyCloudflare(dir);
	}
	// "other" = no changes needed, default static output works everywhere
}

async function applyCloudflare(dir: string) {
	const configPath = join(dir, "astro.config.ts");
	let config = readFileSync(configPath, "utf-8");

	// Add cloudflare adapter import
	config = `import cloudflare from "@astrojs/cloudflare";\n${config}`;

	// Add adapter to defineConfig
	config = config.replace(
		/export default defineConfig\(\{/,
		`export default defineConfig({\n  adapter: cloudflare(),\n  output: "static",`,
	);

	writeFileSync(configPath, config);

	// Write wrangler.jsonc
	writeFileSync(
		join(dir, "wrangler.jsonc"),
		JSON.stringify(
			{
				$schema: "node_modules/wrangler/config-schema.json",
				name: "my-docs",
				pages_build_output_dir: "./dist",
				compatibility_date: "2026-04-15",
			},
			null,
			2,
		) + "\n",
	);
}
