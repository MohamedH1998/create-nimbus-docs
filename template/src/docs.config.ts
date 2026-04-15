// ---------------------------------------------------------------------------
// docs.config.ts — Your documentation site configuration
//
// Edit this file to customize your site. Schema lives in docs.config.schema.ts.
// ---------------------------------------------------------------------------

import { defineConfig } from "./docs.config.schema";
export type { DocsConfig } from "./docs.config.schema";

export const docsConfig = defineConfig({
  site: "https://example.com",
  title: "Nimbus",
  logo: "H",
  locale: "en",
  github: null,
  footer: "Built with Nimbus",

  sidebar: {},

  search: {
    provider: "pagefind",
  },

  features: {
    search: true,
    editLinks: true,
    pagination: true,
    toc: true,
  },
});
