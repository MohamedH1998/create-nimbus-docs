/**
 * robots.ts — Build-time robots.txt disallow utility.
 *
 * Reads disallow paths from the actual robots.txt source of truth:
 * 1. public/robots.txt (static file — takes precedence)
 * 2. docs.config.ts ai.disallow (generated endpoint fallback)
 *
 * Consumed by llms.txt generation and other AI outputs.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { docsConfig } from "@/docs.config";

function parseDisallowsFromRobotsTxt(content: string): string[] {
  const disallows: string[] = [];
  let inUserAgentAll = false;

  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (line.toLowerCase().startsWith("user-agent:")) {
      const agent = line.slice("user-agent:".length).trim();
      inUserAgentAll = agent === "*";
    } else if (inUserAgentAll && line.toLowerCase().startsWith("disallow:")) {
      const path = line.slice("disallow:".length).trim();
      if (path) disallows.push(path);
    }
  }

  return disallows;
}

function loadDisallowedPaths(): string[] {
  // Static public/robots.txt takes precedence (matches Astro's serving behavior)
  const staticPath = join(process.cwd(), "public", "robots.txt");
  if (existsSync(staticPath)) {
    return parseDisallowsFromRobotsTxt(readFileSync(staticPath, "utf-8"));
  }
  // Fall back to config-driven disallows
  return docsConfig.ai.disallow;
}

const DISALLOWED_PATHS = loadDisallowedPaths();

/**
 * Returns `true` if the given URL path is disallowed by robots.txt.
 * Uses standard robots.txt prefix matching (startsWith).
 */
export function isDisallowedByRobots(urlPath: string): boolean {
  return DISALLOWED_PATHS.some((d) => urlPath.startsWith(d));
}
