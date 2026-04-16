// ---------------------------------------------------------------------------
// docs.config.schema.ts — Validation internals for Nimbus config
//
// You shouldn't need to edit this file. Edit docs.config.ts instead.
// ---------------------------------------------------------------------------

import { z } from "astro/zod";

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

const BadgeSchema = z.union([
  z.string(),
  z.object({
    text: z.string(),
    variant: z.enum(["default", "info", "note", "success", "tip", "warning", "caution", "danger"]).default("default"),
  }),
]);

const SidebarSlugItem = z.string();

const SidebarLinkItem = z.object({
  label: z.string(),
  link: z.string(),
  badge: BadgeSchema.optional(),
});

const SidebarAutogenerateItem = z.object({
  label: z.string().optional(),
  autogenerate: z.object({
    directory: z.string(),
  }),
  collapsed: z.boolean().optional(),
  badge: BadgeSchema.optional(),
});

const SidebarGroupConfigItem: z.ZodType<SidebarGroupConfig> = z.lazy(() =>
  z.object({
    label: z.string(),
    items: z.array(SidebarConfigItem),
    collapsed: z.boolean().optional(),
    badge: BadgeSchema.optional(),
  }),
);

const SidebarConfigItem: z.ZodType<SidebarConfigItemType> = z.union([
  SidebarSlugItem,
  SidebarLinkItem,
  SidebarAutogenerateItem,
  SidebarGroupConfigItem,
]);

const SidebarConfigSchema = z
  .object({
    mode: z.enum(["full", "scoped"]).default("full"),
    items: z.array(SidebarConfigItem).default([]),
  })
  .default({ mode: "full" as const, items: [] });

type BadgeVariant = "default" | "info" | "note" | "success" | "tip" | "warning" | "caution" | "danger";
type SidebarBadge = string | { text: string; variant: BadgeVariant };

type SidebarGroupConfig = {
  label: string;
  items: SidebarConfigItemType[];
  collapsed?: boolean;
  badge?: SidebarBadge;
};

type SidebarConfigItemType =
  | string
  | { label: string; link: string; badge?: SidebarBadge }
  | {
      label?: string;
      autogenerate: { directory: string };
      collapsed?: boolean;
      badge?: SidebarBadge;
    }
  | SidebarGroupConfig;

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

const SearchConfigSchema = z.object({
  provider: z.literal("pagefind"),
  options: z
    .object({
      indexWeight: z.record(z.string(), z.number()).optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// AI / agent
// ---------------------------------------------------------------------------

const ContentSignalSchema = z.object({
  "ai-train": z.enum(["yes", "no"]).default("yes"),
  search: z.enum(["yes", "no"]).default("yes"),
  "ai-input": z.enum(["yes", "no"]).default("yes"),
});

const AIConfigSchema = z
  .object({
    signals: ContentSignalSchema.default({ "ai-train": "yes", search: "yes", "ai-input": "yes" }),
    disallow: z.array(z.string()).default([]),
  })
  .default({ signals: { "ai-train": "yes", search: "yes", "ai-input": "yes" }, disallow: [] });

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const FeaturesSchema = z.object({
  search: z.boolean().default(true),
  editLinks: z.boolean().default(true),
  pagination: z.boolean().default(true),
  toc: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Head elements
// ---------------------------------------------------------------------------

const HeadElementSchema = z.object({
  tag: z.enum(["meta", "link", "script", "style"]),
  attrs: z.record(z.string(), z.string()).default({}),
  content: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Main schema
// ---------------------------------------------------------------------------

export const DocsConfigSchema = z.object({
  site: z.url(),
  title: z.string(),
  logo: z.string().max(2),
  locale: z.string().default("en"),
  homeLabel: z.string().default("Home"),
  github: z.url().nullable(),
  editPattern: z.string().nullable().optional(),
  footer: z.string().default("Built with Nimbus"),
  head: z.array(HeadElementSchema).default([]),
  sidebar: SidebarConfigSchema,
  search: SearchConfigSchema.optional(),
  ai: AIConfigSchema,
  features: FeaturesSchema.default({ search: true, editLinks: true, pagination: true, toc: true }),
});

export type DocsConfig = z.infer<typeof DocsConfigSchema>;

/** Type-safe config with Zod validation. Errors surface at dev server start, not at runtime. */
export function defineConfig(config: z.input<typeof DocsConfigSchema>): DocsConfig {
  const result = DocsConfigSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid docs.config.ts:\n${issues}`);
  }
  return result.data;
}
