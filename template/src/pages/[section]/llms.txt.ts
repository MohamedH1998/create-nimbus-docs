/**
 * /{section}/llms.txt — Per-section page index for AI agents.
 *
 * Lists all pages within a top-level section with titles, descriptions,
 * and markdown URLs. One route per section via getStaticPaths.
 */

import type { APIRoute, GetStaticPaths } from "astro";
import { docsConfig } from "@/docs.config";
import { getAIPages, groupBySection, entryMarkdownUrl } from "@/lib/ai";

export const getStaticPaths = (async () => {
  const pages = await getAIPages();
  const { sections } = groupBySection(pages);

  return sections.map((section) => ({
    params: { section: section.slug },
    props: { label: section.label, pages: section.pages },
  }));
}) satisfies GetStaticPaths;

type Props = Awaited<ReturnType<typeof getStaticPaths>>[number]["props"];

export const GET: APIRoute<Props> = ({ props }) => {
  const base = docsConfig.site.replace(/\/$/, "");
  const { label, pages } = props;

  const lines: string[] = [];

  lines.push(`# ${label}`);
  lines.push("");
  lines.push(`> Links below point to Markdown versions of each page (\`index.md\` suffix).`);
  lines.push(`> For the full site directory, see [${docsConfig.title}](${base}/llms.txt).`);
  lines.push("");

  for (const page of pages) {
    const href = entryMarkdownUrl(base, page.id);
    const line = `- [${page.data.title}](${href})`;
    lines.push(page.data.description ? `${line}: ${page.data.description}` : line);
  }
  lines.push("");

  return new Response(lines.join("\n").trimEnd() + "\n", {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
