/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Ambient module declaration for .astro file imports in .ts barrel exports.
// Astro's compiler resolves these at build time — this declaration satisfies
// TypeScript's module resolution in editors and tsc --noEmit.
declare module "*.astro" {
  const component: import("astro").AstroComponentFactory;
  export default component;
}
