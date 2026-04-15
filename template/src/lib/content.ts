import { getCollection } from "astro:content";

export async function getVisibleDocs() {
  const all = await getCollection("docs");
  return import.meta.env.PROD ? all.filter((e) => !e.data.draft) : all;
}
