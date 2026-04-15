/**
 * /llms.txt — Global section directory for AI agents.
 *
 * Lists all top-level sections, each linking to its own /{section}/llms.txt.
 * Root-level pages listed directly. Never a full page dump.
 *
 * Spec: https://llmstxt.org
 */

import type { APIRoute } from "astro";
import { docsConfig } from "@/docs.config";
import { getAIPages, groupBySection, entryMarkdownUrl } from "@/lib/ai";

export const GET: APIRoute = async () => {
  const base = docsConfig.site.replace(/\/$/, "");
  const pages = await getAIPages();
  const { rootPages, sections } = groupBySection(pages);

  const lines: string[] = [];

  lines.push(`# ${docsConfig.title}`);
  lines.push("");
  lines.push(`> Each section below links to its own llms.txt with a full page index.`);
  lines.push("");

  // Root pages listed directly (not behind a section llms.txt)
  if (rootPages.length > 0) {
    for (const page of rootPages) {
      const href = entryMarkdownUrl(base, page.id);
      const line = `- [${page.data.title}](${href})`;
      lines.push(page.data.description ? `${line}: ${page.data.description}` : line);
    }
    lines.push("");
  }

  // Section directory
  if (sections.length > 0) {
    lines.push("## Sections");
    lines.push("");
    for (const section of sections) {
      const line = `- [${section.label}](${base}/${section.slug}/llms.txt)`;
      const indexPage = section.pages.find((p) => p.id === section.slug || p.id === `${section.slug}/index`);
      lines.push(indexPage?.data.description ? `${line}: ${indexPage.data.description}` : line);
    }
    lines.push("");
  }

  return new Response(lines.join("\n").trimEnd() + "\n", {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
