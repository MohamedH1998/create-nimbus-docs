/**
 * Pagefind search integration and result rendering.
 *
 * Manages Pagefind lazy-loading, query execution, result building,
 * and keyboard navigation within a search results container.
 *
 * DOM contract:
 *   - [data-search-input]    — combobox input
 *   - [data-search-results]  — listbox container
 *   - [data-search-empty]    — empty/loading state text
 *   - [role="option"]        — individual result items (created dynamically)
 *
 * Used by: SearchDialog.astro
 */

export interface SearchConfig {
  input: HTMLInputElement;
  resultsContainer: HTMLElement;
  emptyState: HTMLElement;
  /** Called when a result link is clicked (e.g. to close dialog) */
  onNavigate?: () => void;
}

export interface SearchInstance {
  /** Reset search state (clear input, results, load pagefind) */
  reset(): Promise<void>;
  destroy(): void;
}

interface PagefindResult {
  url: string;
  excerpt?: string;
  meta?: { title?: string };
  sub_results?: Array<{ title?: string }>;
}

interface PagefindSearchResponse {
  results: Array<{ data(): Promise<PagefindResult> }>;
}

interface PagefindApi {
  init(): Promise<void>;
  search(query: string): Promise<PagefindSearchResponse>;
}

export function initSearch(config: SearchConfig): SearchInstance {
  const { input, resultsContainer, emptyState, onNavigate } = config;

  let pagefind: PagefindApi | null = null;
  let activeIndex = -1;
  let debounceTimer: ReturnType<typeof setTimeout>;
  let resultIdCounter = 0;
  let queryVersion = 0;

  function getOptions(): HTMLElement[] {
    return Array.from(resultsContainer.querySelectorAll<HTMLElement>("[role='option']"));
  }

  function updateActive(newIndex: number): void {
    const options = getOptions();
    if (options.length === 0) {
      activeIndex = -1;
      return;
    }
    activeIndex = Math.max(-1, Math.min(newIndex, options.length - 1));
    options.forEach((opt, i) => {
      if (i === activeIndex) {
        opt.setAttribute("data-highlighted", "");
        opt.scrollIntoView({ block: "nearest" });
        input.setAttribute("aria-activedescendant", opt.id);
      } else {
        opt.removeAttribute("data-highlighted");
      }
    });
    if (activeIndex < 0) input.removeAttribute("aria-activedescendant");
    input.setAttribute("aria-expanded", String(options.length > 0));
  }

  function clearResults(): void {
    for (const el of resultsContainer.querySelectorAll("[role='option']")) el.remove();
    input.setAttribute("aria-expanded", "false");
  }

  function buildResultEl(result: PagefindResult): HTMLElement {
    const id = `search-result-${resultIdCounter++}`;
    const section = result.sub_results?.[0]?.title ?? "";
    const title = result.meta?.title ?? "Untitled";

    const option = document.createElement("div");
    option.setAttribute("role", "option");
    option.id = id;
    option.className =
      "group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors cursor-pointer data-[highlighted]:bg-interact";

    const icon = document.createElement("div");
    icon.className = "flex shrink-0 items-center text-text-subtle";
    icon.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>';

    const content = document.createElement("a");
    content.href = result.url;
    content.className = "min-w-0 flex-1 no-underline";
    content.addEventListener("click", () => onNavigate?.());

    const titleEl = document.createElement("span");
    titleEl.className = "block truncate text-sm font-medium text-text";
    titleEl.textContent = title;
    content.appendChild(titleEl);

    if (section) {
      const sectionEl = document.createElement("span");
      sectionEl.className = "block truncate text-[11px] text-text-subtle";
      sectionEl.textContent = section;
      content.appendChild(sectionEl);
    }

    // Excerpt uses innerHTML intentionally — Pagefind returns <mark> tags for highlights
    if (result.excerpt) {
      const excerptEl = document.createElement("span");
      excerptEl.className = "block text-xs text-text-subtle line-clamp-1";
      excerptEl.innerHTML = result.excerpt;
      content.appendChild(excerptEl);
    }

    const arrow = document.createElement("div");
    arrow.className = "shrink-0 text-text-subtle opacity-0 transition-opacity group-data-[highlighted]:opacity-100";
    arrow.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"></path></svg>';

    option.appendChild(icon);
    option.appendChild(content);
    option.appendChild(arrow);
    option.addEventListener("click", () => content.click());

    return option;
  }

  // Keyboard navigation
  function handleKeydown(e: KeyboardEvent): void {
    const options = getOptions();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      updateActive(activeIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      updateActive(activeIndex - 1);
    } else if (e.key === "Enter" && activeIndex >= 0 && options[activeIndex]) {
      e.preventDefault();
      options[activeIndex].querySelector("a")?.click();
    }
  }

  // Debounced search
  function handleInput(): void {
    clearTimeout(debounceTimer);
    const requestVersion = ++queryVersion;

    debounceTimer = setTimeout(async () => {
      const query = input.value.trim();
      if (requestVersion !== queryVersion) return;

      if (!query || !pagefind) {
        clearResults();
        emptyState.style.display = "";
        emptyState.textContent = query ? "Search is loading\u2026" : "Type to search\u2026";
        activeIndex = -1;
        return;
      }

      try {
        const search = await pagefind.search(query);
        const results = await Promise.all(search.results.slice(0, 10).map((result) => result.data()));

        if (requestVersion !== queryVersion) return;

        clearResults();
        activeIndex = -1;

        if (results.length === 0) {
          emptyState.style.display = "";
          emptyState.textContent = "No results found.";
          return;
        }

        emptyState.style.display = "none";
        input.setAttribute("aria-expanded", "true");
        results.forEach((result) => {
          resultsContainer.appendChild(buildResultEl(result));
        });
      } catch {
        if (requestVersion !== queryVersion) return;

        clearResults();
        activeIndex = -1;
        input.removeAttribute("aria-activedescendant");
        input.setAttribute("aria-expanded", "false");
        emptyState.style.display = "";
        emptyState.textContent = "Search is temporarily unavailable.";
      }
    }, 150);
  }

  input.addEventListener("input", handleInput);
  input.closest("dialog")?.addEventListener("keydown", handleKeydown);

  async function reset(): Promise<void> {
    queryVersion += 1;
    clearTimeout(debounceTimer);
    input.value = "";
    input.focus();
    emptyState.textContent = "Type to search\u2026";
    emptyState.style.display = "";
    activeIndex = -1;
    clearResults();

    if (!pagefind) {
      try {
        const baseUrl = new URL(import.meta.env.BASE_URL ?? "/", window.location.origin);
        const pagefindUrl = new URL("pagefind/pagefind.js", baseUrl);
        pagefind = (await import(/* @vite-ignore */ pagefindUrl.href)) as PagefindApi;
        await pagefind.init();
      } catch {
        emptyState.textContent = "Search is only available in production builds.";
      }
    }
  }

  return {
    reset,
    destroy() {
      queryVersion += 1;
      input.removeEventListener("input", handleInput);
      input.closest("dialog")?.removeEventListener("keydown", handleKeydown);
      clearTimeout(debounceTimer);
    },
  };
}
