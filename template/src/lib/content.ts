import { getCollection, type CollectionEntry } from "astro:content";

export async function getVisibleDocs(): Promise<CollectionEntry<"docs">[]> {
  const all = await getCollection("docs");
  return import.meta.env.PROD ? all.filter((entry: CollectionEntry<"docs">) => !entry.data.draft) : all;
}
