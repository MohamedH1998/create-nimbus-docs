# create-nimbus-docs

Scaffold a [Nimbus](https://github.com/MohamedH1998/nimbus-starter) docs site in seconds.

**Nimbus** is a documentation site starter built with Astro and Tailwind CSS v4. No framework abstraction layer — every file lives in your project, and you can modify anything.

## What you get

- **Pagefind search** — Cmd+K, lazy-loaded, zero runtime cost
- **Auto sidebar** — generated from file structure, filterable, scroll persistence
- **Dark mode** — system preference + toggle, no flash
- **Components** — Aside, Tabs, Steps, FileTree, Cards, Badge, and more
- **Accessible by default** — keyboard nav, focus indicators, reduced motion, ARIA
- **Theming** — oklch design tokens, one CSS file to rebrand

## Usage

```sh
npx create-nimbus-docs my-docs
cd my-docs
npm run dev
```

Or run directly from GitHub:

```sh
npx github:MohamedH1998/create-nimbus-docs my-docs
```

## What it does

1. Asks three questions: project directory, deploy target, starter content
2. Copies the template into your project
3. Configures for your deploy target
4. Installs dependencies

```
$ npx create-nimbus-docs

┌  create-nimbus-docs
│
◇  Where should we create your project?
│  ./my-docs
│
◆  Deploy target?
│  ● Cloudflare Pages
│  ○ Other
│
◆  Starter content?
│  ● Getting started guide + example page
│  ○ Empty — just the shell
│
◇  Scaffolding into ./my-docs...
│
◇  Installing dependencies via pnpm...
│
└  Done. Next steps:

   cd my-docs
   pnpm dev
```

## Flags

```
create-nimbus-docs [dir] [flags]

Arguments:
  dir                    Project directory (default: prompted)

Flags:
  --deploy <target>      cloudflare | other (default: other)
  --content <type>       starter | empty (default: starter)
  --yes, -y              Accept all defaults, skip prompts
  --dry-run              Show what would be created without writing
  --help, -h             Show help
  --version, -v          Show version
```

## Non-interactive

```sh
# CI / scripting
npx create-nimbus-docs my-docs --deploy cloudflare --content starter

# Accept all defaults
npx create-nimbus-docs my-docs --yes
```

## Deploy targets

**Cloudflare Pages** — Adds `@astrojs/cloudflare` adapter, `wrangler.jsonc`, and deploy scripts.

**Other** — Vanilla static Astro. Deploy anywhere: Vercel, Netlify, GitHub Pages, S3.

## Development

```sh
npm install
npm run build
node dist/index.js my-docs
```
