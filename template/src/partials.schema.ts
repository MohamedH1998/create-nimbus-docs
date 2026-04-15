import { z } from "astro/zod";

// ---------------------------------------------------------------------------
// partials.schema.ts — Schema for reusable content partials
//
// Partials are MDX snippets that can be included in any docs page via
// <Render file="path" />. Parameters are declared in frontmatter and
// validated at build time.
// ---------------------------------------------------------------------------

export const partialsSchema = z
  .object({
    /**
     * Declared parameters this partial accepts.
     * Suffix with `?` for optional params: `["name", "deprecated?"]`
     */
    params: z.array(z.string()).optional(),
  })
  .default({});
