// ---------------------------------------------------------------------------
// sidebar.ts — Hybrid sidebar builder
//
// Supports three modes:
//   1. Config-defined: items array in docs.config.ts takes priority
//   2. Auto-generated: `autogenerate: { directory }` scans filesystem
//   3. Filesystem fallback: if no config items, build from all docs entries
//
// Scoped mode: when `sidebar.mode: 'scoped'`, only the current top-level
// section is shown. The full tree is still built, then filtered.
// ---------------------------------------------------------------------------

export type BadgeVariant = "default" | "info" | "note" | "success" | "tip" | "warning" | "caution" | "danger";
export type SidebarBadge = string | { text: string; variant: BadgeVariant };

export interface SidebarLinkItem {
  type: "link";
  label: string;
  href: string;
  isCurrent?: boolean;
  badge?: SidebarBadge;
  attrs?: Record<string, string>;
  order: number;
}

export interface SidebarExternalLinkItem {
  type: "external";
  label: string;
  href: string;
  badge?: SidebarBadge;
  order: number;
}

export interface SidebarGroupItem {
  type: "group";
  label: string;
  order: number;
  collapsed?: boolean;
  badge?: SidebarBadge;
  children: SidebarItem[];
  /** Internal: entry ID of the group's index page (for hideChildren matching) */
  _indexId?: string;
}

export type SidebarItem = SidebarLinkItem | SidebarExternalLinkItem | SidebarGroupItem;

/** Minimal shape needed from content entries */
interface CollectionEntry {
  id: string;
  data: {
    title: string;
    draft?: boolean;
    sidebar?: {
      order?: number;
      label?: string;
      badge?: SidebarBadge;
      hidden?: boolean;
      hideChildren?: boolean;
    };
  };
}

/** Sidebar config item types from docs.config.ts */
type ConfigItem =
  | string
  | { label: string; link: string; badge?: SidebarBadge }
  | {
      label?: string;
      autogenerate: { directory: string };
      collapsed?: boolean;
      badge?: SidebarBadge;
    }
  | { label: string; items: ConfigItem[]; collapsed?: boolean; badge?: SidebarBadge };

interface SidebarConfig {
  mode?: "full" | "scoped";
  items?: ConfigItem[];
}

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

const sortKeyByItem = new WeakMap<SidebarItem, string>();

function sortSidebarItems(a: SidebarItem, b: SidebarItem): number {
  const orderDiff = a.order - b.order;
  if (orderDiff !== 0) return orderDiff;

  const keyA = sortKeyByItem.get(a) ?? ("href" in a ? a.href : a.label);
  const keyB = sortKeyByItem.get(b) ?? ("href" in b ? b.href : b.label);
  const keyDiff = keyA.localeCompare(keyB);
  if (keyDiff !== 0) return keyDiff;

  return a.type.localeCompare(b.type);
}

// ---------------------------------------------------------------------------
// Link normalization
// ---------------------------------------------------------------------------

/** Ensure internal href has leading /, no trailing slash (except root) */
function normalizeInternalHref(href: string): string {
  let h = href.split("?")[0].split("#")[0];
  if (!h.startsWith("/")) h = `/${h}`;
  if (h.length > 1 && h.endsWith("/")) h = h.slice(0, -1);
  return h;
}

/** Strip query and hash for active-state matching */
function stripQueryHash(href: string): string {
  return href.split("?")[0].split("#")[0];
}

// ---------------------------------------------------------------------------
// Entry index — shared utilities for looking up content entries
// ---------------------------------------------------------------------------

function buildEntryIndex(entries: CollectionEntry[]) {
  const visible = entries.filter((e) => !e.data.sidebar?.hidden);
  const byId = new Map<string, CollectionEntry>();
  for (const entry of visible) {
    byId.set(entry.id, entry);
  }

  const hasChildren = new Set<string>();
  for (const entry of visible) {
    const parts = entry.id.split("/");
    for (let i = 1; i < parts.length; i++) {
      hasChildren.add(parts.slice(0, i).join("/"));
    }
  }

  return { visible, byId, hasChildren };
}

// ---------------------------------------------------------------------------
// Link/group creation from content entries
// ---------------------------------------------------------------------------

function createLink(entry: CollectionEntry, currentPath: string): SidebarLinkItem {
  const href = `/${entry.id}`;
  const badge = entry.data.draft
    ? (entry.data.sidebar?.badge ?? { text: "Draft", variant: "warning" })
    : entry.data.sidebar?.badge;

  const link: SidebarLinkItem = {
    type: "link",
    label: entry.data.sidebar?.label ?? entry.data.title,
    href,
    isCurrent: currentPath === href,
    badge,
    order: entry.data.sidebar?.order ?? Number.MAX_VALUE,
  };

  sortKeyByItem.set(link, entry.id);
  return link;
}

// ---------------------------------------------------------------------------
// Filesystem tree builder (used for autogenerate + fallback)
// ---------------------------------------------------------------------------

function buildFilesystemTree(entries: CollectionEntry[], currentPath: string, directory?: string): SidebarItem[] {
  const { visible, byId, hasChildren } = buildEntryIndex(entries);

  // Filter to entries under the target directory
  const scoped = directory ? visible.filter((e) => e.id === directory || e.id.startsWith(`${directory}/`)) : visible;

  function buildLevel(parentPath: string): SidebarItem[] {
    const result: SidebarItem[] = [];
    const groupsAtLevel = new Map<string, SidebarGroupItem>();

    for (const entry of scoped) {
      if (entry.id === "index") continue;

      const id = entry.id;
      const relativeTo = directory ?? "";
      const relativeId = relativeTo ? (id === relativeTo ? "" : id.slice(relativeTo.length + 1)) : id;

      // Skip if this entry doesn't belong at this level
      if (parentPath === "") {
        if (!relativeId || relativeId.includes("/") === false) {
          // Top-level entry relative to scope
          if (!relativeId) continue; // directory index, handled as group

          if (hasChildren.has(id)) {
            if (!groupsAtLevel.has(id)) {
              const group = createGroupFromEntry(id, entry, currentPath, byId);
              groupsAtLevel.set(id, group);
              result.push(group);
            }
          } else {
            result.push(createLink(entry, currentPath));
          }
        } else {
          // Multi-segment — belongs under first segment group
          const firstSeg = relativeId.split("/")[0];
          const topDir = directory ? `${directory}/${firstSeg}` : firstSeg;
          if (!groupsAtLevel.has(topDir)) {
            const indexEntry = byId.get(topDir);
            const group = createGroupFromEntry(topDir, indexEntry, currentPath, byId);
            groupsAtLevel.set(topDir, group);
            result.push(group);
          }
        }
      } else {
        if (!id.startsWith(`${parentPath}/`)) continue;
        const remainder = id.slice(parentPath.length + 1);
        const remainderParts = remainder.split("/");

        if (remainderParts.length === 1) {
          if (hasChildren.has(id)) {
            if (!groupsAtLevel.has(id)) {
              const group = createGroupFromEntry(id, entry, currentPath, byId);
              groupsAtLevel.set(id, group);
              result.push(group);
            }
          } else {
            result.push(createLink(entry, currentPath));
          }
        } else {
          const nextDir = `${parentPath}/${remainderParts[0]}`;
          if (!groupsAtLevel.has(nextDir)) {
            const indexEntry = byId.get(nextDir);
            const group = createGroupFromEntry(nextDir, indexEntry, currentPath, byId);
            groupsAtLevel.set(nextDir, group);
            result.push(group);
          }
        }
      }
    }

    // Recursively build children for each group
    for (const [groupPath, group] of groupsAtLevel) {
      const nestedChildren = buildLevel(groupPath);
      group.children = [...group.children, ...nestedChildren].sort(sortSidebarItems);

      if (group.children.length > 0) {
        const minChildOrder = Math.min(...group.children.map((item) => item.order));
        group.order = Math.min(group.order, minChildOrder);
      }
    }

    return result.sort(sortSidebarItems);
  }

  function createGroupFromEntry(
    dirPath: string,
    indexEntry: CollectionEntry | undefined,
    currentPath: string,
    _byId: Map<string, CollectionEntry>,
  ): SidebarGroupItem {
    const dirSegment = dirPath.split("/").pop()!;
    // Starlight parity: group label comes from the directory name, not the index page title.
    // Use sidebar.label on the index page to override, but never use title (that's for the link).
    const groupLabel = indexEntry?.data.sidebar?.label ?? formatLabel(dirSegment);
    const groupOrder = indexEntry?.data.sidebar?.order ?? Number.MAX_VALUE;
    const children: SidebarItem[] = [];

    // Index page as child link inside the group
    // (hideChildren is handled later by processHideChildren)
    if (indexEntry) {
      children.push(createLink(indexEntry, currentPath));
    }

    const group: SidebarGroupItem = {
      type: "group",
      label: groupLabel,
      order: groupOrder,
      badge: indexEntry?.data.sidebar?.badge,
      children,
      _indexId: indexEntry?.id,
    };

    sortKeyByItem.set(group, dirPath);
    return group;
  }

  // For directory-scoped autogenerate, just build the children level
  if (directory) {
    return buildLevel(directory);
  }

  return buildLevel("");
}

// ---------------------------------------------------------------------------
// Config-driven builder
// ---------------------------------------------------------------------------

function resolveConfigItems(
  configItems: ConfigItem[],
  entries: CollectionEntry[],
  currentPath: string,
  orderStart: number = 0,
): SidebarItem[] {
  const { byId } = buildEntryIndex(entries);
  const result: SidebarItem[] = [];

  for (let i = 0; i < configItems.length; i++) {
    const item = configItems[i];
    const order = orderStart + i;

    if (typeof item === "string") {
      // Slug reference
      const entry = byId.get(item);
      if (entry) {
        const link = createLink(entry, currentPath);
        link.order = order;
        result.push(link);
      } else {
        // Warn but don't crash — might be a typo
        console.warn(`[sidebar] Page "${item}" referenced in config but not found in docs collection`);
      }
    } else if ("link" in item) {
      const isExternal = !item.link.startsWith("/");
      if (isExternal) {
        const extLink: SidebarExternalLinkItem = {
          type: "external",
          label: item.label,
          href: item.link,
          badge: item.badge,
          order,
        };
        result.push(extLink);
      } else {
        // Internal link with custom label
        const href = normalizeInternalHref(item.link);
        const matchPath = stripQueryHash(href);

        // Validate against known docs routes
        if (!byId.has(href.slice(1)) && href !== "/") {
          console.warn(`[sidebar] Internal link "${item.link}" (label: "${item.label}") does not match any docs page`);
        }

        const link: SidebarLinkItem = {
          type: "link",
          label: item.label,
          href,
          isCurrent: currentPath === matchPath,
          badge: item.badge,
          order,
        };
        result.push(link);
      }
    } else if ("autogenerate" in item) {
      // Auto-generate from directory
      const autoItems = buildFilesystemTree(entries, currentPath, item.autogenerate.directory);

      // If the config item has a label, wrap in a group
      if (item.label) {
        const group: SidebarGroupItem = {
          type: "group",
          label: item.label,
          order,
          collapsed: item.collapsed,
          badge: item.badge,
          children: autoItems,
        };
        result.push(group);
      } else {
        // Inline autogenerate (inside a manual group's items)
        if (item.collapsed !== undefined) {
          for (const ai of autoItems) {
            if (ai.type === "group") {
              ai.collapsed = item.collapsed;
            }
          }
        }
        result.push(...autoItems);
      }
    } else if ("items" in item) {
      // Manual group
      const children = resolveConfigItems(item.items, entries, currentPath);
      const group: SidebarGroupItem = {
        type: "group",
        label: item.label,
        order,
        collapsed: item.collapsed,
        badge: item.badge,
        children,
      };
      result.push(group);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Scoped mode — filter to current top-level section
// ---------------------------------------------------------------------------

function scopeToCurrentSection(items: SidebarItem[], currentPath: string): SidebarItem[] {
  // Find which top-level group contains the current page
  const currentSegment = currentPath.split("/").filter(Boolean)[0];
  if (!currentSegment) return items;

  for (const item of items) {
    if (item.type === "group") {
      if (hasActivePage(item, currentPath)) {
        return item.children;
      }
    }
  }

  // Fallback: return full sidebar if current page isn't in any group
  return items;
}

function hasActivePage(item: SidebarItem, currentPath: string): boolean {
  if (item.type === "link") return item.isCurrent === true;
  if (item.type === "external") return false;
  return item.children.some((child) => hasActivePage(child, currentPath));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the sidebar tree from config + content entries.
 *
 * - If config has items: resolve them (config takes priority)
 * - If config has no items: auto-generate from filesystem
 * - If scoped mode: filter to current section
 */
export function buildSidebarTree(
  entries: CollectionEntry[],
  currentPath: string,
  config?: SidebarConfig,
): SidebarItem[] {
  let items: SidebarItem[];

  if (config?.items && config.items.length > 0) {
    // Config-driven
    items = resolveConfigItems(config.items, entries, currentPath);
  } else {
    // Filesystem fallback
    items = buildFilesystemTree(entries, currentPath);
  }

  // Apply hideChildren
  items = processHideChildren(items, entries);

  // Scoped mode
  if (config?.mode === "scoped") {
    items = scopeToCurrentSection(items, currentPath);
  }

  return items;
}

/**
 * Process hideChildren: replace groups whose index has hideChildren=true
 * with a single link to the index page.
 */
function processHideChildren(items: SidebarItem[], entries: CollectionEntry[]): SidebarItem[] {
  const entryById = new Map<string, CollectionEntry>();
  for (const e of entries) entryById.set(e.id, e);

  function process(items: SidebarItem[]): SidebarItem[] {
    const result: SidebarItem[] = [];
    for (const item of items) {
      if (item.type !== "group") {
        result.push(item);
        continue;
      }

      // Check if this group's index entry has hideChildren
      if (item._indexId) {
        const entry = entryById.get(item._indexId);
        if (entry?.data.sidebar?.hideChildren) {
          // Find the index link in children (by matching href to the index ID)
          const indexHref = `/${item._indexId}`;
          const indexLink = item.children.find((c): c is SidebarLinkItem => c.type === "link" && c.href === indexHref);
          if (indexLink) {
            // Replace group with single link
            const link: SidebarLinkItem = {
              ...indexLink,
              label: item.label,
            };
            result.push(link);
            continue;
          }
        }
      }

      // Recurse into children
      item.children = process(item.children);
      result.push(item);
    }
    return result;
  }

  return process(items);
}

/** Flatten sidebar tree into a list of links (for pagination) */
export function flattenSidebar(items: SidebarItem[]): SidebarLinkItem[] {
  const flat: SidebarLinkItem[] = [];
  for (const item of items) {
    if (item.type === "link") {
      flat.push(item);
    } else if (item.type === "group") {
      flat.push(...flattenSidebar(item.children));
    }
  }
  return flat;
}

function formatLabel(segment: string): string {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

// ---------------------------------------------------------------------------
// Sidebar hash — deterministic hash of sidebar structure for state invalidation.
// Uses DJBX33A (same as Starlight). When the hash changes (pages added/removed,
// labels renamed), persisted sidebar state is discarded.
// ---------------------------------------------------------------------------

function buildSidebarIdentity(items: SidebarItem[]): string {
  return items
    .flatMap((item) =>
      item.type === "group"
        ? item.label + buildSidebarIdentity(item.children)
        : item.label + ("href" in item ? item.href : ""),
    )
    .join("");
}

/** Hash the sidebar structure into a short string for sessionStorage invalidation. */
export function sidebarHash(items: SidebarItem[]): string {
  const identity = buildSidebarIdentity(items);
  let hash = 0;
  for (let i = 0; i < identity.length; i++) {
    hash = (hash << 5) - hash + identity.charCodeAt(i);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
}
