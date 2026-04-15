/**
 * Animated collapsible — smooth open/close for <details> elements.
 *
 * Uses grid-template-rows animation (0fr ↔ 1fr) for natural height transitions.
 * Respects prefers-reduced-motion. Cancels in-flight animations on rapid toggling.
 */

const DURATION = 250;
const EASING = "cubic-bezier(0.87, 0, 0.13, 1)";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const animating = new WeakSet<HTMLDetailsElement>();

function animateGrid(details: HTMLDetailsElement, content: HTMLElement, from: string, to: string, onDone?: () => void) {
  if (reducedMotion.matches) {
    onDone?.();
    return;
  }

  // Cancel any in-flight animation
  if (animating.has(details)) {
    for (const a of content.getAnimations()) a.cancel();
  }
  animating.add(details);

  const anim = content.animate([{ gridTemplateRows: from }, { gridTemplateRows: to }], {
    duration: DURATION,
    easing: EASING,
    fill: onDone ? "forwards" : "none",
  });

  const cleanup = () => animating.delete(details);
  anim.oncancel = cleanup;
  anim.onfinish = () => {
    onDone?.();
    anim.cancel();
    cleanup();
  };
}

export interface CollapsibleConfig {
  /** The <details> element */
  details: HTMLDetailsElement;
  /** The grid content wrapper (child of <details>, sibling of <summary>) */
  content: HTMLElement;
}

/** Initialize animated open/close on a collapsible <details> element. */
export function initCollapsible({ details, content }: CollapsibleConfig): void {
  const summary = details.querySelector("summary");
  if (!summary) return;

  summary.addEventListener("click", (e) => {
    e.preventDefault();

    if (details.open) {
      // Closing: animate 1fr → 0fr, then remove open
      details.setAttribute("data-state", "closed");
      animateGrid(details, content, "1fr", "0fr", () => {
        details.open = false;
      });
    } else {
      // Opening: set open, then animate 0fr → 1fr
      details.open = true;
      details.setAttribute("data-state", "open");
      animateGrid(details, content, "0fr", "1fr");
    }
  });

  // Set initial data-state
  details.setAttribute("data-state", details.open ? "open" : "closed");
}
