/**
 * Shared filterable tree primitive.
 *
 * Filters a tree of items by label text, expanding/collapsing groups
 * as needed. Designed for sidebar navigation but reusable for any
 * details/summary tree structure.
 *
 * DOM contract:
 *   - [data-sidebar-filter-input]  — text input
 *   - [data-sidebar-link]          — leaf links to filter
 *   - [data-sidebar-group]         — collapsible groups (details elements)
 *   - [data-sidebar-group-label]   — group label element for matching
 *
 * Used by: SidebarFilter.astro
 */

export interface FilterableTreeConfig {
  /** Root element containing filter input */
  container: HTMLElement;
  /** Element to search within for links/groups (default: closest nav or parent) */
  scope?: HTMLElement;
}

// Inject CSS rule once so hiding is declarative (no inline style.display)
let cssInjected = false;
function injectHideRule(): void {
  if (cssInjected) return;
  cssInjected = true;
  const style = document.createElement("style");
  style.textContent = "[data-sidebar-hidden-by-filter] { display: none; }";
  document.head.appendChild(style);
}

export function initFilterableTree(config: FilterableTreeConfig): void {
  const { container } = config;
  const input = container.querySelector<HTMLInputElement>("[data-sidebar-filter-input]");
  if (!input) return;

  injectHideRule();

  const scope = config.scope ?? container.closest("nav") ?? container.parentElement;
  if (!scope) return;

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();

    if (!query) {
      resetFilter(scope);
      return;
    }

    applyFilter(scope, query);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      input.value = "";
      input.dispatchEvent(new Event("input"));
      input.blur();
    }
  });
}

function resetFilter(scope: Element): void {
  scope.querySelectorAll<HTMLElement>("[data-sidebar-hidden-by-filter]").forEach((el) => {
    el.removeAttribute("data-sidebar-hidden-by-filter");
  });

  scope.querySelectorAll<HTMLDetailsElement>("details[data-sidebar-opened-by-filter]").forEach((group) => {
    group.open = false;
    group.removeAttribute("data-sidebar-opened-by-filter");
  });
}

function applyFilter(scope: Element, query: string): void {
  const allLinks = scope.querySelectorAll<HTMLElement>("[data-sidebar-link]");
  const allGroups = scope.querySelectorAll<HTMLElement>("[data-sidebar-group]");

  // Hide everything first (CSS rule handles display:none)
  allLinks.forEach((link) => {
    link.setAttribute("data-sidebar-hidden-by-filter", "");
  });
  allGroups.forEach((group) => {
    group.setAttribute("data-sidebar-hidden-by-filter", "");
  });

  // Show matching links and their ancestor groups
  allLinks.forEach((link) => {
    const text = link.textContent?.toLowerCase() ?? "";
    if (!text.includes(query)) return;

    link.removeAttribute("data-sidebar-hidden-by-filter");
    revealAncestors(link, scope);
  });

  // Show groups whose label matches (reveal all their children)
  allGroups.forEach((group) => {
    const label = group.querySelector("[data-sidebar-group-label]");
    const text = label?.textContent?.toLowerCase() ?? "";
    if (!text.includes(query)) return;

    group.removeAttribute("data-sidebar-hidden-by-filter");
    expandIfCollapsed(group);

    group.querySelectorAll<HTMLElement>("[data-sidebar-link], [data-sidebar-group]").forEach((child) => {
      child.removeAttribute("data-sidebar-hidden-by-filter");
    });
  });
}

function revealAncestors(el: HTMLElement, scope: Element): void {
  let parent = el.parentElement;
  while (parent && parent !== scope) {
    if (parent.hasAttribute("data-sidebar-group")) {
      parent.removeAttribute("data-sidebar-hidden-by-filter");
      expandIfCollapsed(parent);
    }
    parent = parent.parentElement;
  }
}

function expandIfCollapsed(el: Element): void {
  if (el instanceof HTMLDetailsElement && !el.open) {
    el.open = true;
    el.setAttribute("data-sidebar-opened-by-filter", "");
  }
}
