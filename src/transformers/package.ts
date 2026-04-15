import { readFileSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";

interface PackageOptions {
	name: string;
	deploy: "cloudflare" | "other";
}

/**
 * Update package.json with project name, deploy-specific deps & scripts.
 */
export async function updatePackageJson(dir: string, options: PackageOptions) {
	const pkgPath = join(dir, "package.json");
	const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

	// Set project name (use directory basename for clean names)
	pkg.name = basename(options.name);

	// Remove nimbus-starter specific fields
	delete pkg.private;
	pkg.version = "0.0.1";

	if (options.deploy === "cloudflare") {
		// Add cloudflare adapter dependency
		pkg.dependencies ??= {};
		pkg.dependencies["@astrojs/cloudflare"] = "^13.1.10";

		// Add deploy scripts
		pkg.scripts["preview:cf"] = "wrangler pages dev ./dist";
		pkg.scripts["deploy"] = "wrangler pages deploy ./dist";
	}

	writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}
