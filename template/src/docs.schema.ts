import { z } from "astro/zod";

// ---------------------------------------------------------------------------
// docs.schema.ts — Content contract for Nimbus
//
// This is the single source of truth for your documentation schema.
// Edit this file to add, remove, or modify frontmatter fields.
//
// Error messages target content writers, not developers.
// Astro uses Zod v4 — use `error` (not v3's `required_error`/`errorMap`).
// ---------------------------------------------------------------------------

export interface DocSchemaConfig {
  name?: string;
  fields?: Record<string, z.ZodType>;
}

const sidebarSchema = z
  .object({
    order: z.number({ error: '"sidebar.order" must be a number' }).optional(),
    label: z.string({ error: '"sidebar.label" must be a string' }).optional(),
    badge: z
      .union([
        z.string(),
        z.object({
          text: z.string({ error: 'sidebar badge needs a "text" field' }),
          variant: z
            .enum(["default", "info", "note", "success", "tip", "warning", "caution", "danger"], {
              error: '"variant" must be one of: default, info, note, success, tip, warning, caution, danger',
            })
            .default("default"),
        }),
      ])
      .optional(),
    hidden: z.boolean({ error: '"sidebar.hidden" must be true or false' }).optional(),
    /** Collapse this directory into a single link — children hidden from sidebar */
    hideChildren: z.boolean({ error: '"sidebar.hideChildren" must be true or false' }).optional(),
  })
  .optional();

const heroActionSchema = z.object({
  text: z.string({ error: 'hero action needs a "text" field' }),
  link: z.string({ error: 'hero action needs a "link" field' }),
  variant: z
    .enum(["primary", "secondary", "outline"], {
      error: 'hero action "variant" must be "primary", "secondary", or "outline"',
    })
    .default("primary"),
  icon: z.string().optional(),
});

const heroSchema = z
  .object({
    title: z.string().optional(),
    tagline: z.string().optional(),
    actions: z.array(heroActionSchema).optional(),
  })
  .optional();

const dismissibleSchema = z.object({
  /** Unique ID for localStorage key — changing this resets dismissal for all users */
  id: z.string({ error: 'dismissible needs an "id" field (string)' }),
  /** Days until the banner reappears after dismissal. Omit for permanent dismissal. */
  days: z.number({ error: '"dismissible.days" must be a number' }).int().min(1).optional(),
});

const bannerSchema = z
  .object({
    content: z.string({ error: 'banner needs a "content" field' }),
    type: z
      .enum(["note", "tip", "caution", "danger"], {
        error: 'banner "type" must be "note", "tip", "caution", or "danger"',
      })
      .default("note"),
    dismissible: dismissibleSchema.optional(),
  })
  .optional();

/**
 * Prev/next override. Starlight-compatible shapes:
 *   - `string`  → label-only override; keeps sidebar neighbor href, replaces label text
 *   - `object`  → partial override; omitted fields fall back to sidebar neighbor
 *   - `false`   → suppress the link entirely
 */
const prevNextSchema = z
  .union([z.string(), z.object({ link: z.string().optional(), label: z.string().optional() }), z.literal(false)])
  .optional();

const headElementSchema = z.object({
  tag: z.enum(["meta", "link", "script", "style"], {
    error: 'head element "tag" must be "meta", "link", "script", or "style"',
  }),
  attrs: z.record(z.string(), z.string()).default({}),
  content: z.string().optional(),
});

function baseDocSchema() {
  return z.object({
    title: z.string({
      error: (iss) =>
        iss.input === undefined
          ? 'Missing required "title" in frontmatter. Every doc needs:\n\n  ---\n  title: "Your Page Title"\n  ---'
          : `"title" must be a string, received ${typeof iss.input}`,
    }),
    description: z.string({ error: '"description" must be a string' }).optional(),
    template: z
      .enum(["doc", "splash"], {
        error: '"template" must be "doc" or "splash"',
      })
      .default("doc"),
    sidebar: sidebarSchema,
    hero: heroSchema,
    banner: bannerSchema,
    head: z.array(headElementSchema).default([]),
    draft: z.boolean({ error: '"draft" must be true or false' }).default(false),
    noindex: z.boolean({ error: '"noindex" must be true or false' }).default(false),
    /** Include this page in llms.txt and AI consumption indexes */
    llms: z.boolean({ error: '"llms" must be true or false' }).default(true),
    /** Signal AI crawlers to deprioritize this page */
    aiDeprioritize: z.boolean({ error: '"aiDeprioritize" must be true or false' }).default(false),
    pagefind: z.boolean({ error: '"pagefind" must be true or false' }).default(true),
    tableOfContents: z
      .object({
        minHeadingLevel: z.number({ error: '"minHeadingLevel" must be a number (1–6)' }).int().min(1).max(6).default(2),
        maxHeadingLevel: z.number({ error: '"maxHeadingLevel" must be a number (1–6)' }).int().min(1).max(6).default(3),
      })
      .refine((v) => v.minHeadingLevel <= v.maxHeadingLevel, {
        message: "minHeadingLevel must be <= maxHeadingLevel",
      })
      .optional(),
    lastUpdated: z.coerce.date({ error: '"lastUpdated" must be a valid date (e.g. 2024-01-15)' }).optional(),
    prev: prevNextSchema,
    next: prevNextSchema,
  });
}

export type DocSchema = ReturnType<typeof defineDocSchema>;

export function defineDocSchema(config: DocSchemaConfig = {}) {
  let schema = baseDocSchema();

  if (config.fields) {
    schema = schema.extend(config.fields) as typeof schema;
  }

  const enriched = Object.assign(schema, {
    extend(extraConfig: DocSchemaConfig) {
      return defineDocSchema({
        ...config,
        ...extraConfig,
        fields: { ...config.fields, ...extraConfig.fields },
      });
    },
  });

  return enriched;
}

/** Default docs schema — use as-is or call defineDocSchema() with config */
export const docsSchema = defineDocSchema();
