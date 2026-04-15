import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import rehypeSlug from "rehype-slug";
import { docsConfig } from "./src/docs.config";

const pagefindIntegration = {
  name: "pagefind",
  hooks: {
    "astro:build:done": ({ dir }: { dir: URL }) => {
      const outDir = fileURLToPath(dir);
      const npx = process.platform === "win32" ? "npx.cmd" : "npx";
      execFileSync(npx, ["pagefind", "--site", outDir], { stdio: "inherit" });
    },
  },
};

export default defineConfig({
  site: docsConfig.site,
  markdown: {
    rehypePlugins: [rehypeSlug],
  },
  // expressiveCode must precede mdx — it replaces Shiki for code blocks.
  integrations: [
    expressiveCode({
      themes: ["github-light-default", "github-dark-dimmed"],
      // Map to Nimbus's dark mode attribute (not media query)
      themeCssSelector: (theme) => (theme.type === "dark" ? "[data-mode='dark']" : ":root:not([data-mode='dark'])"),
      // Inline styles to prevent flash of unstyled code blocks.
      // External stylesheet loads mid-body, causing a visible theme flash
      // on pages with code blocks (especially in dark mode).
      emitExternalStylesheet: false,
      styleOverrides: {
        // Wire to --nb-* tokens for consistent theming
        borderRadius: "0.75rem",
        borderWidth: "1px",
        borderColor: "var(--nb-line)",
        codeBackground: "var(--nb-base)",
        codeForeground: "var(--nb-text)",
        codeSelectionBackground: "var(--nb-brand-subtle)",
        codeFontFamily: "var(--nb-font-mono)",
        codeFontSize: "0.8125rem",
        codeLineHeight: "1.7",
        codePaddingBlock: "1.25rem",
        codePaddingInline: "1.25rem",
        gutterBorderColor: "var(--nb-line)",
        gutterBorderWidth: "1px",
        gutterForeground: "var(--nb-text-subtle)",
        gutterHighlightForeground: "var(--nb-text)",
        uiFontFamily: "var(--nb-font-sans)",
        focusBorder: "var(--nb-ring)",
        scrollbarThumbColor: "var(--nb-line-strong)",
        scrollbarThumbHoverColor: "var(--nb-text-subtle)",
        frames: {
          shadowColor: "transparent",
          editorBackground: "var(--nb-base)",
          editorTabBarBackground: "var(--nb-recessed)",
          editorTabBarBorderColor: "var(--nb-line)",
          editorTabBarBorderBottomColor: "var(--nb-line)",
          editorActiveTabForeground: "var(--nb-text)",
          editorActiveTabBackground: "var(--nb-base)",
          editorActiveTabBorderColor: "var(--nb-line)",
          editorActiveTabIndicatorTopColor: "transparent",
          editorActiveTabIndicatorBottomColor: "var(--nb-line)",
          editorActiveTabIndicatorHeight: "1px",
          terminalBackground: "var(--nb-recessed)",
          terminalTitlebarForeground: "var(--nb-text-subtle)",
          terminalTitlebarDotsForeground: "var(--nb-text-subtle)",
          terminalTitlebarDotsOpacity: "0.4",
          terminalTitlebarBackground: "var(--nb-recessed)",
          terminalTitlebarBorderBottomColor: "var(--nb-line)",
          inlineButtonForeground: "var(--nb-text-subtle)",
          inlineButtonBorder: "var(--nb-line-strong)",
        },
      },
      defaultProps: {
        wrap: false,
      },
    }),
    mdx(),
    sitemap(),
    ...(docsConfig.features.search ? [pagefindIntegration] : []),
  ],
});
