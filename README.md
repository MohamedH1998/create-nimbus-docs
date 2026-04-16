# create-nimbus-docs

Scaffold a [Nimbus](https://github.com/MohamedH1998/nimbus-starter) docs site in seconds.

**Nimbus** is a documentation site starter built with Astro and Tailwind CSS v4. No framework abstraction layer — every file lives in your project, and you can modify anything.

Recommended: Node.js `22.13+` for the smoothest setup.

The CLI itself is lightweight, but the generated docs site follows the current Astro/Vite toolchain. If install or build fails on an older Node release, switch to Node.js `22.13+` and retry.

## What you get

- **Pagefind search** — Cmd+K, lazy-loaded, zero runtime cost
- **Auto sidebar** — generated from file structure, filterable, scroll persistence
- **Dark mode** — system preference + toggle, no flash
- **Components** — Aside, Tabs, Steps, FileTree, Cards, Badge, and more
- **Accessible by default** — keyboard nav, focus indicators, reduced motion, ARIA
- **Theming** — oklch design tokens, one CSS file to rebrand

## Usage

Or run directly from GitHub:

```sh
npx github:MohamedH1998/create-nimbus-docs my-docs
```

## What it does

1. Asks three questions: project directory, deploy target, starter content
2. Copies the template into your project
3. Configures for your deploy target
4. Installs dependencies

The generated project is cleaned before install, so cached `.astro/`, `node_modules/`, and mismatched lockfiles are not carried over from the template.

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

**Cloudflare Pages** — Adds `@astrojs/cloudflare`, `wrangler`, `wrangler.jsonc`, and production-safe `predeploy`/`deploy` scripts.

**Other** — Vanilla static Astro. Deploy anywhere: Vercel, Netlify, GitHub Pages, S3.

## Development

```sh
pnpm install
pnpm lint
pnpm typecheck
pnpm build
node dist/index.js my-docs
```

If setup or verification fails on an older Node release, switch to Node.js `22.13+` before running `pnpm verify` or the playground commands.

Quality scripts:

```sh
pnpm lint          # ESLint across the CLI repo
pnpm lint:fix      # Auto-fix lint issues where possible
pnpm format        # Prettier write pass across the CLI repo
pnpm format:check  # Prettier verification for CI
pnpm verify        # Lint + format check + typecheck + build
```

## Preview Workflow

Use `template/` for the fast inner loop when you are changing UI, styles, or markdown behavior:

```sh
pnpm template:dev
```

Use `.playground/` when you want to verify the actual scaffolded output:

```sh
pnpm playground:refresh
pnpm playground:dev

# Or do both in one command
pnpm playground:start
```

If you need to test the Cloudflare-specific scaffold:

```sh
pnpm playground:refresh:cloudflare
pnpm playground:dev
```

`template/` is live while you edit it. `.playground/` is a snapshot, so regenerate it after template or scaffold changes when you want to test the real created project.
