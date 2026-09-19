---
paths:
  - "packages/Angular/**"
---

# Angular

Loads when you open anything in `packages/Angular` — this app's MJExplorer
client bootstrap (`@mj-biz-apps/more-cheese-ng`).

Most of this package is CodeGen output under `src/lib/generated/`; see
[`generated-code.md`](generated-code.md) before editing there. Hand-written code
lives in `src/lib/custom/`.

## Standalone vs NgModule

- **Standalone** is preferred for new leaf components: dialogs, panels, widgets,
  lazy-loaded routes. Declare every dependency in the component's `imports`.
- **NgModules** for feature modules grouping many components, shared modules, and
  existing module-declared components — don't migrate for its own sake.
- Module-declared components must say `standalone: false` **explicitly** (Angular
  21 defaults to standalone). Never mix within one component, and follow the
  pattern already used in the package you're editing.

## Modern syntax — required for new code

- `@if` / `@for` / `@switch`, not `*ngIf` / `*ngFor`. The old ones are a
  deprecated direction, and `@for` is dramatically faster.
- `inject()` over constructor DI for new components.
- `@Input()`s needing reactive behavior use the **getter/setter pattern** for
  precise change detection, not `ngOnChanges`.
- `ExpressionChangedAfterItHasBeenCheckedError`: inject `ChangeDetectorRef` and
  call `cdr.detectChanges()` after programmatic view changes. Prefer
  `Promise.resolve().then()` over `setTimeout` for microtask timing.

## MJ component conventions

- UI controls come from **`@memberjunction/ng-ui-components`** (`mjButton`,
  `mj-dialog`, `mj-dropdown`, `mj-switch`, …) — not Kendo, PrimeNG, or Material.
  Grids: AG Grid. Splitters: `angular-split`. Icons: Font Awesome.
- Loading states use **`<mj-loading>`** from `@memberjunction/ng-shared-generic`,
  never a custom spinner.
- Dialog buttons: **confirm/submit LEFT, cancel RIGHT**.
- Any `BaseResourceComponent` subclass **must** call `this.NotifyLoadComplete()`
  when its initial load finishes, or the app loading screen hangs forever on
  direct-URL navigation. (`BaseDashboard` handles this for you.)

## Custom entity forms

To override a generated form, **extend the generated form class** — not
`BaseFormComponent` directly — and register with
`@RegisterClass(BaseFormComponent, '<Entity Name>')`. The import dependency is
what guarantees your registration lands after, and therefore outranks, the
generated one. Wrap form content in `<mj-record-form-container>`, not a raw
`<mj-form-toolbar>`: the container owns the History, Tags, and List panels.

## Design tokens — no hardcoded colors

Every color in component CSS uses a semantic `--mj-*` token
(`--mj-text-primary`, `--mj-bg-surface`, `--mj-border-default`,
`--mj-brand-primary`, `--mj-status-error`, …). Hardcoded hex breaks dark mode and
white-labeling. Translucent variants via
`color-mix(in srgb, var(--mj-brand-primary) 10%, transparent)`.

Never use primitive tokens (`--mj-color-neutral-*`) in components — they don't
adapt to dark mode. Acceptable hardcoded exceptions: SVG data URIs, code-editor
backgrounds, categorical chart palettes, `rgba(255,255,255,x)` overlays, and
`var(…, fallback)` fallbacks. The full token table lives in MJ's `_tokens.scss`.

This rule governs `packages/Angular` only. The `.css` under `website/assets/` is
a standalone static marketing site with no MJ token system — see
`npm run build:site`.
