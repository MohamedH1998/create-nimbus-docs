import * as p from "@clack/prompts";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

interface PromptFlags {
	dir?: string;
	deploy?: "cloudflare" | "other";
	content?: "starter" | "empty";
	packageManager?: PackageManager;
	git?: boolean;
	yes?: boolean;
}

export interface PromptResponses {
	dir: string;
	deploy: "cloudflare" | "other";
	content: "starter" | "empty";
	packageManager: PackageManager;
	git: boolean;
}

export async function getPromptResponses(
	flags: PromptFlags,
): Promise<PromptResponses | symbol> {
	// --yes defaults
	if (flags.yes) {
		return {
			dir: flags.dir ?? "my-docs",
			deploy: flags.deploy ?? "other",
			content: flags.content ?? "starter",
			packageManager: flags.packageManager ?? "npm",
			git: flags.git ?? true,
		};
	}

	const dir =
		flags.dir ??
		(await p.text({
			message: "Where should we create your project?",
			placeholder: "./my-docs",
			defaultValue: "my-docs",
			validate(value) {
				if (!value) return "Please enter a directory name.";
				const resolved = resolve(value);
				if (existsSync(resolved)) return `Directory "${value}" already exists.`;
			},
		}));

	if (p.isCancel(dir)) return dir;

	const deploy =
		flags.deploy ??
		((await p.select({
			message: "Deploy target?",
			options: [
				{
					value: "cloudflare",
					label: "Cloudflare Pages",
				},
				{
					value: "other",
					label: "Other",
					hint: "Vercel, Netlify, GitHub Pages, etc.",
				},
			],
		})) as "cloudflare" | "other");

	if (p.isCancel(deploy)) return deploy;

	const content =
		flags.content ??
		((await p.select({
			message: "Starter content?",
			options: [
				{
					value: "starter",
					label: "Getting started guide + example page",
				},
				{
					value: "empty",
					label: "Empty — just the shell",
				},
			],
		})) as "starter" | "empty");

	if (p.isCancel(content)) return content;

	const packageManager =
		flags.packageManager ??
		((await p.select({
			message: "Package manager?",
			options: [
				{ value: "npm", label: "npm" },
				{ value: "pnpm", label: "pnpm" },
				{ value: "yarn", label: "yarn" },
				{ value: "bun", label: "bun" },
			],
		})) as PackageManager);

	if (p.isCancel(packageManager)) return packageManager;

	const git =
		flags.git ??
		(await p.confirm({
			message: "Initialize a git repository?",
			initialValue: true,
		}));

	if (p.isCancel(git)) return git;

	return { dir: dir as string, deploy, content, packageManager, git };
}
