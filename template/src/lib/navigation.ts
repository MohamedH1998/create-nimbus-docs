import type { SidebarItem } from "./sidebar";
import { flattenSidebar } from "./sidebar";

export interface Breadcrumb {
  label: string;
  href: string;
}

export function getBreadcrumbs(slug: string, homeLabel = "Home"): Breadcrumb[] {
  const parts = slug.split("/").filter(Boolean);
  const crumbs: Breadcrumb[] = [{ label: homeLabel, href: "/" }];

  let path = "";
  for (const part of parts) {
    path += `/${part}`;
    crumbs.push({
      label: part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: path,
    });
  }

  return crumbs;
}

export interface PrevNext {
  prev?: { label: string; href: string };
  next?: { label: string; href: string };
}

interface PrevNextOverride {
  link?: string;
  label?: string;
}

interface PrevNextOverrides {
  prev?: string | PrevNextOverride | false;
  next?: string | PrevNextOverride | false;
}

function normalizeInternalPath(path: string): string {
  const [withoutHash] = path.split("#", 1);
  const [pathname] = withoutHash.split("?", 1);
  return pathname || "/";
}

function resolveOverride(
  override: string | PrevNextOverride | false | undefined,
  fallback: { label: string; href: string } | undefined,
  validInternalLinks?: Set<string>,
): { label: string; href: string } | undefined {
  if (override === false) return undefined;
  if (override === undefined) return fallback;
  if (typeof override === "string") {
    // String form: label-only override — keeps the sidebar neighbor's href, replaces the label
    if (!fallback) return undefined;
    return { label: override, href: fallback.href };
  }
  // Object form: merge with fallback — omitted fields inherit from sidebar neighbor
  if (override.link && !override.link.startsWith("/") && !override.link.startsWith("http")) {
    throw new Error(
      `prev/next override link "${override.link}" must be an absolute path (starting with /) or a full URL`,
    );
  }
  if (override.link?.startsWith("/") && validInternalLinks) {
    const targetPath = normalizeInternalPath(override.link);
    if (!validInternalLinks.has(targetPath)) {
      throw new Error(`prev/next override link "${override.link}" does not match any existing internal docs route`);
    }
  }
  const label = override.label ?? fallback?.label;
  const href = override.link ?? fallback?.href;

  // Without a sidebar neighbor, object overrides must be complete.
  if (!fallback && (label === undefined || href === undefined)) {
    throw new Error("prev/next object override requires both `label` and `link` when no sidebar neighbor exists");
  }

  if (!href) return undefined;
  return { label: label ?? "", href };
}

export function getPrevNext(
  currentPath: string,
  sidebarTree: SidebarItem[],
  overrides?: PrevNextOverrides,
  validInternalLinks?: Set<string>,
): PrevNext {
  const flat = flattenSidebar(sidebarTree);
  const index = flat.findIndex((item) => item.href === currentPath);

  const sidebarPrev = index > 0 ? { label: flat[index - 1].label, href: flat[index - 1].href! } : undefined;
  const sidebarNext =
    index >= 0 && index < flat.length - 1 ? { label: flat[index + 1].label, href: flat[index + 1].href! } : undefined;

  if (!overrides) {
    return { prev: sidebarPrev, next: sidebarNext };
  }

  return {
    prev: resolveOverride(overrides.prev, sidebarPrev, validInternalLinks),
    next: resolveOverride(overrides.next, sidebarNext, validInternalLinks),
  };
}
