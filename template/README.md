# Nimbus Starter

A documentation site starter built with Astro and Tailwind CSS v4. You own every file.

## Quick start

```sh
npx create-nimbus-docs my-docs
cd my-docs
npm run dev
```

Or run directly from GitHub:

```sh
npx github:MohamedH1998/create-nimbus-docs my-docs
```

Open [http://localhost:4321](http://localhost:4321).

## Project structure

```
src/
├── docs.config.ts            # Site title, logo, sidebar, search, features
├── docs.schema.ts            # Content schema (frontmatter fields)
├── docs.route.astro          # Route composition (layout, sidebar, TOC)
├── styles/globals.css        # Theme tokens — THE file to rebrand
├── components/               # All UI components (yours to modify)
├── layouts/                  # BaseLayout, DocsLayout
├── lib/                      # Sidebar builder, navigation, TOC, utilities
├── content/docs/             # Your documentation pages
└── pages/                    # Astro routing (thin shims)
```

## Configuration

Edit `src/docs.config.ts`:

```ts
export const docsConfig = defineConfig({
  site: "https://example.com",
  title: "My Docs",
  logo: "M",
  github: "https://github.com/org/repo",
  sidebar: {},
  features: {
    search: true,
    editLinks: true,
    pagination: true,
    toc: true,
  },
});
```

## Theming

Edit `src/styles/globals.css`. All design tokens use the `--nb-*` prefix and oklch colors.

```css
:root {
  --nb-brand: oklch(0.145 0 0);        /* Primary color */
  --nb-font-sans: "Inter Variable", system-ui, sans-serif;
  --nb-h1-size: 2.1875rem;
}
```

Dark mode is automatic via `[data-mode="dark"]`. Change the dark block in the same file.

### Changing fonts

Fonts are self-hosted via `@fontsource-variable`. Update two places:

1. `src/layouts/BaseLayout.astro` — the import
2. `src/styles/globals.css` — the `--nb-font-sans` / `--nb-font-mono` variables

## Components

Import from `@/components`:

```astro
---
import { Aside, Badge, Card, Tabs, TabItem, Steps, FileTree } from "@/components";
---
```

| Component | What it does |
|-----------|-------------|
| `Aside` | Callout blocks — note, tip, caution, danger |
| `Badge` | Inline status labels with semantic variants |
| `Card` / `CardGrid` | Content cards with optional grid layout |
| `LinkCard` | Clickable card with arrow |
| `Tabs` / `TabItem` | Tabbed content with keyboard nav and sync |
| `Steps` | Numbered steps with connecting lines |
| `FileTree` | File/directory tree |
| `PackageManagers` | Multi-manager install command tabs |
| `Banner` | Dismissible site-wide banners |
| `Render` | Reusable content partials with typed params |

## Features

- **Search** — Pagefind with Cmd+K, lazy-loaded, zero runtime cost
- **Sidebar** — Auto-generated from file structure, filterable, scroll/state persistence
- **Dark mode** — System preference + toggle, no flash
- **TOC** — Scroll-tracking table of contents
- **Breadcrumbs** — Auto-generated from slug
- **Prev/next** — Auto-computed from sidebar order
- **Accessibility** — Skip link, focus indicators, reduced motion, keyboard navigation, ARIA

## Scripts

```sh
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview build locally
npm run check        # TypeScript check
npm run check:astro  # Astro template check
npm run lint         # ESLint
npm run ci           # Full pipeline (typecheck + astro check + lint + build)
```

If you scaffolded with Cloudflare, the project also includes:

```sh
npm run preview:cf   # Build, then preview with Wrangler Pages locally
npm run deploy       # Run the CI pipeline, then deploy with Wrangler
```

## Architecture

- **Astro 6** + content collections
- **Tailwind CSS v4** — `@theme` block bridges `--nb-*` tokens to utilities
- **Inline components** — everything in `src/`, imported via `@/`
- **No Starlight** — built from scratch, Starlight-compatible frontmatter
- **Single `docs` collection** — one schema, all extended fields optional
