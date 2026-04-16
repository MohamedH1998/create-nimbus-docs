/**
 * ai.ts — Shared utilities for AI output generation (llms.txt, agent discovery).
 *
 * Provides filtered page lists and section grouping consumed by
 * /llms.txt, /[section]/llms.txt, and AgentDirective.
 */

import { getVisibleDocs } from "@/lib/content";
import { isDisallowedByRobots } from "@/lib/robots";

type DocEntry = Awaited<ReturnType<typeof getVisibleDocs>>[number];

/** Memoized set of section slugs that have /{section}/llms.txt routes. */
let _sectionSlugs: Set<string> | null = null;

export async function getAISectionSlugs(): Promise<Set<string>> {
  if (_sectionSlugs) return _sectionSlugs;
  const pages = await getAIPages();
  const { sections } = groupBySection(pages);
  _sectionSlugs = new Set(sections.map((s) => s.slug));
  return _sectionSlugs;
}

/**
 * Converts an entry ID to its canonical markdown URL path.
 * Handles index pages: "index" → "/", "guides/index" → "/guides/".
 */
export function entryMarkdownUrl(base: string, id: string): string {
  // Strip trailing /index — Astro routes these to the parent path
  const slug = id.replace(/\/index$/, "").replace(/^index$/, "");
  return slug === "" ? `${base}/index.md` : `${base}/${slug}/index.md`;
}

/** Returns all docs pages eligible for AI outputs (filters draft, llms:false, robots disallows). */
export async function getAIPages(): Promise<DocEntry[]> {
  const allDocs = await getVisibleDocs();
  return allDocs.filter((entry: DocEntry) => {
    if (entry.data.llms === false) return false;
    const urlPath = entry.id === "index" ? "/" : `/${entry.id}/`;
    if (isDisallowedByRobots(urlPath)) return false;
    return true;
  });
}

/** Sort comparator: sidebar.order ascending, then title alphabetically. */
export function sortPages(a: DocEntry, b: DocEntry): number {
  const orderA = a.data.sidebar?.order ?? Infinity;
  const orderB = b.data.sidebar?.order ?? Infinity;
  if (orderA !== orderB) return orderA - orderB;
  return a.data.title.localeCompare(b.data.title);
}

export interface SectionGroup {
  slug: string;
  label: string;
  pages: DocEntry[];
}

/**
 * Groups pages by first slug segment. Returns root pages separately.
 * Sections sorted alphabetically by label; pages sorted by sidebar order then title.
 */
export function groupBySection(pages: DocEntry[]): { rootPages: DocEntry[]; sections: SectionGroup[] } {
  const sectionMap = new Map<string, DocEntry[]>();
  const rootPages: DocEntry[] = [];

  // First pass: collect all pages with slashes to establish known sections
  for (const page of pages) {
    const firstSlash = page.id.indexOf("/");
    if (firstSlash !== -1) {
      const slug = page.id.slice(0, firstSlash);
      if (!sectionMap.has(slug)) sectionMap.set(slug, []);
      sectionMap.get(slug)!.push(page);
    }
  }

  // Second pass: slash-less pages go to their section if one exists, otherwise root
  for (const page of pages) {
    if (page.id.indexOf("/") !== -1) continue;
    if (page.id !== "index" && sectionMap.has(page.id)) {
      sectionMap.get(page.id)!.push(page);
    } else {
      rootPages.push(page);
    }
  }

  rootPages.sort(sortPages);

  const sections: SectionGroup[] = [...sectionMap.entries()].map(([slug, sectionPages]) => {
    sectionPages.sort(sortPages);
    const indexPage = sectionPages.find((p) => p.id === slug || p.id === `${slug}/index`);
    const label = indexPage?.data.title ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return { slug, label, pages: sectionPages };
  });

  sections.sort((a, b) => a.label.localeCompare(b.label));

  return { rootPages, sections };
}
