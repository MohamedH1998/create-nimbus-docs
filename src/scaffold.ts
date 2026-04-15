import * as p from "@clack/prompts";
import { spawn } from "node:child_process";
import { cpSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { applyDeployTarget } from "./transformers/deploy.js";
import { applyStarterContent } from "./transformers/content.js";
import { updatePackageJson } from "./transformers/package.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = resolve(__dirname, "..", "template");

interface ScaffoldOptions {
	dir: string;
	deploy: "cloudflare" | "other";
	content: "starter" | "empty";
	packageManager: "npm" | "pnpm" | "yarn" | "bun";
}

export async function scaffold(options: ScaffoldOptions) {
	const { dir, deploy, content, packageManager } = options;

	const s = p.spinner();

	// 1. Copy template
	s.start("Scaffolding project…");
	const target = resolve(process.cwd(), dir);

	if (existsSync(target)) {
		s.stop("Failed.");
		p.log.error(`Directory "${dir}" already exists.`);
		process.exit(1);
	}

	cpSync(TEMPLATE_DIR, target, { recursive: true });
	s.stop("Project scaffolded.");

	// 2. Apply transformers
	s.start("Configuring project…");
	await applyDeployTarget(target, deploy);
	await applyStarterContent(target, content);
	await updatePackageJson(target, { name: dir, deploy });
	s.stop("Project configured.");

	// 3. Install dependencies
	s.start(`Installing dependencies via ${packageManager}…`);
	try {
		const cmd =
			packageManager === "yarn" ? "yarn" : `${packageManager} install`;
		const [bin, ...args] = cmd.split(" ");
		await new Promise<void>((resolve, reject) => {
			const child = spawn(bin, args, {
				cwd: target,
				stdio: ["ignore", "ignore", "inherit"],
			});
			child.on("close", (code) =>
				code === 0 ? resolve() : reject(new Error(`exit ${code}`)),
			);
			child.on("error", reject);
		});
	} catch {
		s.stop("Failed to install dependencies.");
		p.log.warn(
			`Could not install dependencies. Run \`${packageManager} install\` manually.`,
		);
		return;
	}
	s.stop("Dependencies installed.");
}
