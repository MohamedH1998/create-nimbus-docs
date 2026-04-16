/**
 * robots.ts — Runtime-safe robots disallow utility.
 *
 * Uses docs.config.ts ai.disallow as the shared source of truth for AI outputs.
 * This intentionally avoids node:fs so the helper works in Cloudflare/Workers
 * during local dev and server rendering.
 *
 * Consumed by llms.txt generation and other AI outputs.
 */

import { docsConfig } from "@/docs.config";

const DISALLOWED_PATHS = docsConfig.ai.disallow;

/**
 * Returns `true` if the given URL path is disallowed by robots.txt.
 * Uses standard robots.txt prefix matching (startsWith).
 */
export function isDisallowedByRobots(urlPath: string): boolean {
  return DISALLOWED_PATHS.some((d) => urlPath.startsWith(d));
}
