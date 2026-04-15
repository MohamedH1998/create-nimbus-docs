// ---------------------------------------------------------------------------
// head.ts — Head tag types, merge utility, and canonical URL builder
//
// Provides the merge semantics for global (docs.config) + per-page (frontmatter)
// head elements. Deduplicates by tag identity key so later entries win.
// ---------------------------------------------------------------------------

export interface HeadElement {
  tag: "meta" | "link" | "script" | "style";
  attrs?: Record<string, string>;
  content?: string;
}

// ---------------------------------------------------------------------------
// Deduplication key
//
// Two head elements are "the same" when they'd conflict in the browser:
//   <meta name="X">        → "meta:name=X"
//   <meta property="X">    → "meta:property=X"
//   <meta http-equiv="X">  → "meta:http-equiv=X"
//   <link rel="canonical"> → "link:rel=canonical"
//   <link rel="sitemap">   → "link:rel=sitemap"
//
// Elements without a dedup key (scripts, styles, misc links) always append.
// ---------------------------------------------------------------------------

function dedupeKey(el: HeadElement): string | null {
  const a = el.attrs ?? {};

  if (el.tag === "meta") {
    if (a.name) return `meta:name=${a.name}`;
    if (a.property) return `meta:property=${a.property}`;
    if (a["http-equiv"]) return `meta:http-equiv=${a["http-equiv"]}`;
    if (a.charset !== undefined) return "meta:charset";
  }

  if (el.tag === "link") {
    // Only singleton rels get deduped (canonical, sitemap, icon).
    // Stylesheet and preconnect links should stack.
    const singletonRels = new Set(["canonical", "sitemap", "icon", "shortcut icon"]);
    if (a.rel && singletonRels.has(a.rel)) return `link:rel=${a.rel}`;
  }

  return null;
}

/**
 * Merge global and per-page head arrays. Per-page entries override global
 * entries with the same dedup key. Non-dedupable entries always append.
 *
 * Order: global entries first (preserving order), then page entries.
 * When a page entry overrides a global entry, it takes the global entry's
 * position to maintain predictable ordering.
 */
export function mergeHead(global: HeadElement[], page: HeadElement[]): HeadElement[] {
  // Build map of page overrides keyed by dedup key
  const pageByKey = new Map<string, HeadElement>();
  const pageUnkeyed: HeadElement[] = [];

  for (const el of page) {
    const key = dedupeKey(el);
    if (key) {
      pageByKey.set(key, el);
    } else {
      pageUnkeyed.push(el);
    }
  }

  // Walk global entries, replacing where page overrides exist
  const usedKeys = new Set<string>();
  const result: HeadElement[] = [];

  for (const el of global) {
    const key = dedupeKey(el);
    if (key && pageByKey.has(key)) {
      result.push(pageByKey.get(key)!);
      usedKeys.add(key);
    } else {
      result.push(el);
    }
  }

  // Append remaining page keyed entries (not already placed)
  for (const [key, el] of pageByKey) {
    if (!usedKeys.has(key)) result.push(el);
  }

  // Append unkeyed page entries
  result.push(...pageUnkeyed);

  return result;
}

// ---------------------------------------------------------------------------
// Canonical URL
// ---------------------------------------------------------------------------

/**
 * Build a canonical URL from the current pathname and site config.
 * Returns `null` when `site` is undefined (dev mode without site set).
 */
export function canonicalURL(pathname: string, site: URL | undefined): string | null {
  if (!site) return null;
  return new URL(pathname, site).href;
}
