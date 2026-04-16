import * as p from "@clack/prompts";
import mri from "mri";
import { scaffold } from "./scaffold.js";
import { getPromptResponses } from "./prompts.js";

declare const __APP_VERSION__: string;
declare const __MIN_NODE_VERSION__: string;

const args = mri(process.argv.slice(2), {
	boolean: ["yes", "dry-run", "help", "version", "skip-install"],
	string: ["deploy", "content"],
	alias: { y: "yes", h: "help", v: "version" },
});

if (args.help) {
	console.log(`
  Usage: create-nimbus-docs [dir] [flags]

  Arguments:
    dir                    Project directory (default: prompted)

  Flags:
    --deploy <target>      cloudflare | other (default: other)
    --content <type>       starter | empty (default: starter)
    --yes, -y              Accept all defaults, skip prompts
    --skip-install         Write files but skip dependency installation
    --dry-run              Show what would be created without writing
    --help, -h             Show help
    --version, -v          Show version
`);
	process.exit(0);
}

if (args.version) {
	console.log(__APP_VERSION__);
	process.exit(0);
}

async function main() {
	p.intro("create-nimbus-docs");
	warnIfNodeVersionIsBelowRecommendation();

	const detected = detectPackageManager();

	const responses = await getPromptResponses({
		dir: args._[0] as string | undefined,
		deploy: args.deploy as "cloudflare" | "other" | undefined,
		content: args.content as "starter" | "empty" | undefined,
		packageManager: detected !== "npm" ? detected : undefined,
		git: undefined,
		yes: args.yes,
	});

	if (p.isCancel(responses)) {
		p.cancel("Cancelled.");
		process.exit(1);
	}

	const pm = responses.packageManager;

	// Summary
	p.note(
		[
			`Deploy:   ${responses.deploy === "cloudflare" ? "Cloudflare Pages" : "Static (deploy anywhere)"}`,
			`Content:  ${responses.content === "starter" ? "Getting started guide + example page" : "Empty shell"}`,
			`Manager:  ${pm}`,
			`Git:      ${responses.git ? "Initialize repository" : "Skip"}`,
		].join("\n"),
		"Creating project with",
	);

	if (args["dry-run"]) {
		p.outro("Dry run — no files written.");
		process.exit(0);
	}

	await scaffold({
		...responses,
		packageManager: pm,
		skipInstall: args["skip-install"],
	});

	const runCmd = pm === "npm" ? "npm run" : pm;

	p.note([`cd ${responses.dir}`, `${runCmd} dev`].join("\n"), "Next steps");

	p.outro("Done.");
}

function warnIfNodeVersionIsBelowRecommendation() {
	if (
		compareVersions(
			parseVersion(process.versions.node),
			parseVersion(__MIN_NODE_VERSION__),
		) >= 0
	) {
		return;
	}

	p.log.warn(
		`You are using Node.js ${process.versions.node}. For the smoothest setup, use Node.js ${__MIN_NODE_VERSION__}+; the generated docs site follows the current Astro/Vite toolchain and may ask you to upgrade during install or build.`,
	);
}

function detectPackageManager(): "npm" | "pnpm" | "yarn" | "bun" {
	const agent = process.env.npm_config_user_agent ?? "";
	if (agent.startsWith("pnpm")) return "pnpm";
	if (agent.startsWith("yarn")) return "yarn";
	if (agent.startsWith("bun")) return "bun";
	return "npm";
}

function parseVersion(version: string) {
	const [major = "0", minor = "0", patch = "0"] = version
		.replace(/^v/, "")
		.split(".");

	return [major, minor, patch].map((part) => Number.parseInt(part, 10) || 0);
}

function compareVersions(current: number[], minimum: number[]) {
	for (
		let index = 0;
		index < Math.max(current.length, minimum.length);
		index += 1
	) {
		const currentPart = current[index] ?? 0;
		const minimumPart = minimum[index] ?? 0;
		if (currentPart > minimumPart) return 1;
		if (currentPart < minimumPart) return -1;
	}

	return 0;
}

main().catch((err) => {
	p.cancel("Something went wrong.");
	console.error(err);
	process.exit(1);
});
