import * as p from "@clack/prompts";
import mri from "mri";
import { scaffold } from "./scaffold.js";
import { getPromptResponses } from "./prompts.js";

const args = mri(process.argv.slice(2), {
	boolean: ["yes", "dry-run", "help", "version"],
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
    --dry-run              Show what would be created without writing
    --help, -h             Show help
    --version, -v          Show version
`);
	process.exit(0);
}

if (args.version) {
	// Read from package.json at build time via tsup define
	console.log("0.1.0");
	process.exit(0);
}

async function main() {
	p.intro("create-nimbus-docs");

	const detected = detectPackageManager();

	const responses = await getPromptResponses({
		dir: args._[0] as string | undefined,
		deploy: args.deploy as "cloudflare" | "other" | undefined,
		content: args.content as "starter" | "empty" | undefined,
		packageManager: detected !== "npm" ? detected : undefined,
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
	});

	const runCmd = pm === "npm" ? "npm run" : pm;

	p.note([`cd ${responses.dir}`, `${runCmd} dev`].join("\n"), "Next steps");

	p.outro("Done.");
}

function detectPackageManager(): "npm" | "pnpm" | "yarn" | "bun" {
	const agent = process.env.npm_config_user_agent ?? "";
	if (agent.startsWith("pnpm")) return "pnpm";
	if (agent.startsWith("yarn")) return "yarn";
	if (agent.startsWith("bun")) return "bun";
	return "npm";
}

main().catch((err) => {
	p.cancel("Something went wrong.");
	console.error(err);
	process.exit(1);
});
