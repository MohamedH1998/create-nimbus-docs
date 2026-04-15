import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { docsSchema } from "./docs.schema";
import { partialsSchema } from "./partials.schema";

const docsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/docs" }),
  schema: docsSchema,
});

const partialsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/partials" }),
  schema: partialsSchema,
});

export const collections = {
  docs: docsCollection,
  partials: partialsCollection,
};
