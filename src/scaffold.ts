import * as p from "@clack/prompts";
import { spawn } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve, dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { applyDeployTarget } from "./transformers/deploy.js";
import { applyStarterContent } from "./transformers/content.js";
import { updatePackageJson } from "./transformers/package.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = resolve(__dirname, "..", "template");
const EXCLUDED_TEMPLATE_ENTRIES = new Set(["node_modules", ".astro", "dist"]);
const LOCKFILES_BY_PACKAGE_MANAGER = {
	npm: ["package-lock.json"],
	pnpm: ["pnpm-lock.yaml"],
	yarn: ["yarn.lock"],
	bun: ["bun.lock", "bun.lockb"],
} as const;

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

	cpSync(TEMPLATE_DIR, target, {
		recursive: true,
		filter: (source) => shouldCopyTemplatePath(source),
	});
	s.stop("Project scaffolded.");

	// 2. Apply transformers
	s.start("Configuring project…");
	normalizePackageManagerFiles(target, packageManager);
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

function shouldCopyTemplatePath(source: string) {
	const pathFromTemplate = relative(TEMPLATE_DIR, source);
	if (!pathFromTemplate) return true;

	return !pathFromTemplate
		.split(sep)
		.some((segment) => EXCLUDED_TEMPLATE_ENTRIES.has(segment));
}

function normalizePackageManagerFiles(
	dir: string,
	packageManager: ScaffoldOptions["packageManager"],
) {
	for (const entry of EXCLUDED_TEMPLATE_ENTRIES) {
		rmSync(join(dir, entry), { recursive: true, force: true });
	}

	const keep = new Set(LOCKFILES_BY_PACKAGE_MANAGER[packageManager]);
	for (const lockfiles of Object.values(LOCKFILES_BY_PACKAGE_MANAGER)) {
		for (const lockfile of lockfiles) {
			if (keep.has(lockfile)) continue;
			rmSync(join(dir, lockfile), { force: true });
		}
	}
}
