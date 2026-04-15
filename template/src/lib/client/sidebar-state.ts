/**
 * sidebar-state.ts — Persist sidebar group open/close state + scroll position.
 *
 * Saves to sessionStorage on:
 *   - Group toggle (click on <summary>)
 *   - visibilitychange (tab hidden)
 *   - pagehide (navigation / tab close)
 *
 * Storage key: "sidebar-state"
 * Format: { hash: string, open: (boolean | null)[], scroll: number }
 *
 * Desktop only — mobile sidebar opens fresh each time.
 */

const STORAGE_KEY = "sidebar-state";
const INIT_ATTR = "data-sidebar-persistence-init";

interface SidebarState {
  hash: string;
  open: (boolean | null)[];
  scroll: number;
}

function getState(sidebar: HTMLElement, content: HTMLElement): SidebarState {
  const hash = content.dataset.sidebarHash ?? "";
  const groups = content.querySelectorAll<HTMLDetailsElement>("[data-sidebar-group]");
  const open: (boolean | null)[] = [];
  groups.forEach((g) => open.push(g.open));
  return { hash, open, scroll: sidebar.scrollTop };
}

function storeState(state: SidebarState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function initSidebarPersistence(): void {
  const sidebar = document.getElementById("desktop-sidebar");
  const content = sidebar?.querySelector<HTMLElement>("[data-sidebar-content]");
  if (!sidebar || !content) return;
  if (sidebar.hasAttribute(INIT_ATTR)) return;
  sidebar.setAttribute(INIT_ATTR, "");

  const save = () => storeState(getState(sidebar, content));

  // Track group toggles — <details> fires "toggle" when open changes.
  // The collapsible animation sets details.open, which triggers this.
  content.addEventListener("toggle", (e) => {
    if (e.target instanceof HTMLDetailsElement && e.target.hasAttribute("data-sidebar-group")) {
      save();
    }
  }, true); // capture phase to catch before bubbling is stopped

  // Save before leaving — covers same-tab navigation and tab close.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });
  window.addEventListener("pagehide", save);

  // Save scroll position (debounced)
  let raf = 0;
  sidebar.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(save);
  });
}
