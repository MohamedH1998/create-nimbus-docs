import { rmSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Apply starter content selection.
 *
 * - "starter": Keep all example docs as-is
 * - "empty": Strip example content, leave minimal index.mdx
 */
export async function applyStarterContent(
	dir: string,
	content: "starter" | "empty",
) {
	if (content === "starter") return;

	const docsDir = join(dir, "src", "content", "docs");

	// Remove all content except index.mdx
	const entries = readdirSync(docsDir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.name === "index.mdx") continue;
		const entryPath = join(docsDir, entry.name);
		rmSync(entryPath, { recursive: true, force: true });
	}

	// Replace index.mdx with minimal version
	writeFileSync(
		join(docsDir, "index.mdx"),
		`---
title: Welcome
description: Your documentation starts here.
template: splash
hero:
  title: My Docs
  tagline: Beautiful documentation, powered by Nimbus.
  actions:
    - text: Get Started
      link: /getting-started
---
`,
	);
}
