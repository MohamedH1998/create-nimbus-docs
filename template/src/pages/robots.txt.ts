/**
 * robots.txt — Auto-generated with Content-Signal directives.
 *
 * Only serves if no static public/robots.txt exists (Astro serves public/
 * files before page routes). Reads config from docs.config.ts ai settings.
 *
 * Content-Signal spec: contentsignals.org
 * Legal basis: EU Directive 2019/790 on Copyright in the Digital Single Market
 */

import type { APIRoute } from "astro";
import { docsConfig } from "@/docs.config";

const CONTENT_SIGNAL_PREAMBLE = `# As a condition of accessing this website, you agree to
# abide by the following content signals:
#
# (a)  If a content-signal = yes, you may collect content
# for the corresponding use.
# (b)  If a content-signal = no, you may not collect content
# for the corresponding use.
# (c)  If the website operator does not include a content
# signal for a corresponding use, the website operator
# neither grants nor restricts permission via content signal
# with respect to the corresponding use.
#
# The content signals and their meanings are:
#
# search: building a search index and providing search
# results (e.g., returning hyperlinks and short excerpts
# from your website's contents).  Search does not include
# providing AI-generated search summaries.
# ai-input: inputting content into one or more AI models
# (e.g., retrieval augmented generation, grounding, or other
# real-time taking of content for generative AI search
# answers).
# ai-train: training or fine-tuning AI models.
#
# ANY RESTRICTIONS EXPRESSED VIA CONTENT SIGNALS ARE EXPRESS
# RESERVATIONS OF RIGHTS UNDER ARTICLE 4 OF THE EUROPEAN
# UNION DIRECTIVE 2019/790 ON COPYRIGHT AND RELATED RIGHTS
# IN THE DIGITAL SINGLE MARKET.`;

export const GET: APIRoute = () => {
  const { signals, disallow } = docsConfig.ai;

  const signalLine = `Content-Signal: ai-train=${signals["ai-train"]}, search=${signals.search}, ai-input=${signals["ai-input"]}`;

  const disallowLines = disallow.map((p) => `Disallow: ${p}`).join("\n");

  const sitemapLine = docsConfig.site
    ? `\nSitemap: ${docsConfig.site.replace(/\/$/, "")}/sitemap-index.xml`
    : "";

  const body = [
    CONTENT_SIGNAL_PREAMBLE,
    "",
    "User-agent: *",
    signalLine,
    "",
    "Allow: /",
    disallowLines,
    sitemapLine,
  ]
    .filter(Boolean)
    .join("\n")
    .trimEnd() + "\n";

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
