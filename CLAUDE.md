# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StorePointWeb** is an Angular 21 point-of-sale (POS) web app with iOS/Android support via Capacitor 8. It handles product catalog browsing, cart management, and sales transactions.

## Commands

```bash
npm start              # Dev server at http://localhost:4200
npm run build          # Production build
npm test               # Run unit tests (Vitest)
npm run lint           # ESLint (TypeScript + HTML)
npm run cap:sync       # Build prod + sync Capacitor native projects
npm run cap:ios        # Build + sync + open Xcode
npm run cap:android    # Build + sync + open Android Studio
```

## Architecture

### Stack
- Angular 21, standalone components only (no NgModules)
- TypeScript 5.9 with `strict: true`
- SCSS with CSS variables for theming
- Angular signals for state (no RxJS state management)
- Vitest for testing, ESLint + Angular-ESLint for linting
- Capacitor 8.3 for native iOS/Android

**Loading state**: `LoadingService` uses an increment/decrement counter. `loadingInterceptor` (functional interceptor in `app.config.ts`) auto-increments on every HTTP request and decrements on finalize. The loader only hides when the counter reaches 0 — this safely handles concurrent requests.

**Theme system**: `ThemeService` reads stored preference from `StorageService` after render, sets `data-theme` on `<html>`, and persists changes via `effect()`. CSS variables in `styles.scss` handle both themes.

**Cross-platform storage**: `StorageService` detects `Capacitor.isNativePlatform()` at runtime and routes to either `@capacitor/preferences` (native) or `localStorage` (web). Components always call `StorageService` — never touch storage directly.

**Product data**: Mock products live in `features/products/products.data.ts` and are imported by both `ProductsComponent` and `SaleComponent`. No backend integration yet.

**Component prefix**: All selectors use `stp-` (element) or `stp` (attribute), enforced by ESLint.

### Routes

```
/ → redirects to /dashboard
/login
/dashboard
/products    # inventory catalog
/sale        # POS checkout
/suppliers   # supplier management
/caja        # cash register
/notices     # placeholder
/profile
/demo        # design system / component showcase
```

### Environment Files

`src/environments/` has `environment.ts` (dev), `environment.dev.ts`, `environment.prod.ts`. Each exports `{ production, appName, whatsappUrl, websiteUrl, logoUrl }`. `angular.json` swaps files at build time. Access via `AppConfigService`.

### Currency

- **Default currency: USD (US Dollar)**
- Always display the `$` icon **and** the label `USD` together on any monetary value (e.g. `$ 12.50 USD`)
- Never hardcode another currency unless explicitly required

### Incomplete Features (TODOs in code)

- Auth service integration (`login.component.ts`, `main-layout.component.ts`)
- Backend API calls for sale confirmation and product CRUD
- E2E test setup

---

## UI System Rules

These rules are **mandatory**. Follow them on every template and SCSS file.

1. **Use shared components** — never write raw `<input>`, `<button>`, `<select>` etc. when a shared component exists.
2. **Use CSS tokens** — never hardcode colors, font sizes, spacing, radii, shadows, or animation values.
3. **Use utility classes** — prefer `.text-*`, `.font-*`, `.p-*`, `.bg-*`, `.radius-*` over inline styles or one-off CSS.
4. **Use `MatBottomSheet`** for all modal/drawer UI — never build custom overlays or `position:fixed` drawers.
5. **Use SCSS partials** — import breakpoints and z-index from shared files, never redefine them.
6. **Live preview** — visit `/demo` to see every component rendered with all variants.
7. **StorageService** — use StorageService for save data storage instead use localStorage or sessionStorage

---

## Shared Components

All in `src/app/shared/components/`. Import the class directly — no module needed (standalone).

### Form controls

| Selector | Key inputs | Notes |
|---|---|---|
| `<stp-input>` | `label`, `type`, `hasError`, `[(value)]` | Float-label, password toggle, CVA |
| `<stp-input-numeric>` | `size`, `radius`, `min`, `max`, `[(value)]` | ± stepper, CVA |
| `<stp-select>` | `label`, `options`, `size`, `hasError`, `[(value)]` | Float-label native select, CVA |
| `<stp-checkbox>` | `label`, `variant`, `size`, `indeterminate`, `[(checked)]` | CVA |
| `<stp-search>` | `placeholder`, `size`, `[(value)]`, `(cleared)` | Search bar with clear button, CVA |

### Actions

| Selector | Key inputs | Notes |
|---|---|---|
| `<stp-button>` | `variant`, `btnStyle`, `size`, `radius`, `loading`, `disabled`, `href` | 8 variants × 3 styles |

`variant`: `primary` `success` `warning` `danger` `info` `default` `surface` `surface-alt`
`btnStyle`: `solid` `outlined` `ghost`
`size`: `sm` `md` `lg`
`radius`: `sm` `md` `xl` `full`

### Display

| Selector | Key inputs | Notes |
|---|---|---|
| `<stp-badge>` | `variant`, `badgeStyle`, `size`, `dot` | Status/count badge |
| `<stp-tag>` | `variant`, `tagStyle`, `size`, `removable`, `icon`, `(removed)` | Removable chip |
| `<stp-alert>` | `variant`, `title`, `message`, `dismissible`, `icon`, `(dismissed)` | Inline alert |
| `<stp-avatar>` | `name`, `src`, `size`, `variant`, `alt` | Image or initials fallback |
| `<stp-card>` | `padding`, `radius`, `shadow`, `border`, `interactive` | Generic container (`ng-content`) |
| `<stp-tabs>` | `tabs`, `variant`, `size`, `fullWidth`, `[(activeTab)]`, `(tabChange)` | 3 variants |
| `<stp-empty-state>` | `icon`, `title`, `description` | Empty list state |
| `<stp-shimmer>` | `radius` | Skeleton loading placeholder |
| `<stp-loader>` | `visible` | Full-screen loader |
| `[stp-icon]` | `name`, `autofill` | Phosphor icon (attribute selector on `<i>`) |

`variant` (badge/tag/avatar/alert): `primary` `success` `warning` `error` `info` `surface`
`badgeStyle` / `tagStyle`: `light` `solid` `outlined`
`tabs variant`: `underline` `pills` `segment`

### Drawers (open via `MatBottomSheet`)

| Class | Data in | Result out |
|---|---|---|
| `SupplierDrawerComponent` | `SupplierDrawerData { supplier? }` | `SupplierDrawerResult` |
| `InventoryDrawerComponent` | `InventoryDrawerData { products, prefilledName? }` | `InventoryDrawerResult` |
| `CartDrawerComponent` | `CartDrawerData { items }` | `CartDismissResult` |

Always pass `panelClass: 'stp-supplier-panel'` (or equivalent) when opening.

### Layout / navigation

`<stp-sidebar>`, `<stp-app-header>`, `<stp-app-footer>`, `<stp-bottom-bar>`, `<stp-swipe-item>`

---

## Shared Directives

All in `src/app/shared/directives/`. Import directly (standalone).

| Selector | Inputs | Notes |
|---|---|---|
| `stp-input[stpNumeric]` | `min`, `max`, `allowDecimal`, `allowNegative` | Blocks non-numeric keystrokes; clamps to range on blur |

```html
<!-- Only digits -->
<stp-input stpNumeric label="Cantidad" [(value)]="qty" />

<!-- Digits + decimal point -->
<stp-input stpNumeric [allowDecimal]="true" label="Precio" [(value)]="price" />

<!-- Digits + range clamp on blur -->
<stp-input stpNumeric [min]="0" [max]="100" label="Descuento %" [(value)]="discount" />

<!-- Full options -->
<stp-input stpNumeric [allowDecimal]="true" [allowNegative]="true" [min]="-9999" [max]="9999" />
```

---

## CSS Tokens

Defined in `src/styles.scss`, available in every component without import.

### Colors

```scss
/* Surfaces */
--color-bg              /* page background */
--color-surface         /* card / input background */
--color-surface-alt     /* hover / secondary surface */
--color-border          /* dividers, input borders */

/* Text */
--color-text-primary
--color-text-secondary
--color-text-disabled

/* Brand */
--color-primary         --color-primary-hover   --color-primary-fg   --color-primary-light
--color-success         --color-success-hover   --color-success-fg   --color-success-light
--color-warning         --color-warning-hover   --color-warning-fg   --color-warning-light
--color-error           --color-error-hover     --color-error-fg     --color-error-light
--color-info            --color-info-hover      --color-info-fg      --color-info-light

/* Liquid Glass */
--glass-backdrop        --glass-overlay-bg
--glass-surface-bg      --glass-surface-border  --glass-surface-shadow
```

### Spacing

```scss
/* Padding — 1 unit = 4 px */
--p-0   /* 0 */
--p-1   /* 4px  */
--p-2   /* 8px  */
--p-3   /* 12px */
--p-4   /* 16px */
--p-5   /* 20px */
--p-6   /* 24px */
--p-7   /* 32px */
--p-8   /* 40px */

/* Gap — 1 unit = 8 px */
--gap-1  /* 8px  */
--gap-2  /* 16px */
--gap-3  /* 24px */
--gap-4  /* 32px */
--gap-5  /* 40px */
--gap-6  /* 48px */
--gap-7  /* 56px */
--gap-8  /* 64px */
```

### Shape & elevation

```scss
/* Border radius */
--radius-sm    /* 8px  */
--radius-md    /* 14px */
--radius-lg    /* 20px */
--radius-xl    /* 28px */
--radius-full  /* 9999px */

/* Shadows */
--shadow-sm   /* 0 1px 3px … */
--shadow-md   /* 0 4px 12px … */
--shadow-lg   /* 0 8px 24px … */
--shadow-xl   /* 0 16px 40px … */
```

### Typography

```scss
/* Font sizes */
--text-xs    /* 12px */
--text-sm    /* 13px */
--text-base  /* 15px */
--text-md    /* 16px */
--text-lg    /* 17px */
--text-xl    /* 18px */
--text-2xl   /* 20px */
--text-3xl   /* 24px */
--text-4xl   /* 30px */

/* Font weights */
--font-regular: 400  |  --font-medium: 500  |  --font-semibold: 600  |  --font-bold: 700

/* Line heights */
--leading-tight: 1.25  |  --leading-snug: 1.375  |  --leading-normal: 1.5  |  --leading-relaxed: 1.625

/* Letter spacing */
--tracking-tight: -0.01em  |  --tracking-normal: 0  |  --tracking-wide: 0.01em  |  --tracking-wider: 0.025em

/* Component size scale */
--size-sm-height: 2rem    --size-sm-font: 0.8125rem
--size-md-height: 2.75rem --size-md-font: 0.9375rem
--size-lg-height: 3.5rem  --size-lg-font: 1.0625rem
```

### Animation

```scss
/* Durations */
--duration-fast:    100ms
--duration-base:    150ms
--duration-slow:    200ms
--duration-slower:  300ms
--duration-slowest: 500ms

/* Easing */
--ease-default   /* ease */
--ease-in        /* cubic-bezier(0.4, 0, 1, 1) */
--ease-out       /* cubic-bezier(0, 0, 0.2, 1) */
--ease-in-out    /* cubic-bezier(0.4, 0, 0.2, 1) */
--ease-spring    /* cubic-bezier(0.175, 0.885, 0.32, 1.275) */
```

---

## Utility Classes

Defined globally in `src/styles.scss` — usable in any template without imports.

### Typography

```html
<!-- Font size -->
<p class="text-xs">   <!-- 12px -->
<p class="text-sm">   <!-- 13px -->
<p class="text-base"> <!-- 15px -->
<p class="text-md">   <!-- 16px -->
<p class="text-lg">   <!-- 17px -->
<p class="text-xl">   <!-- 18px -->
<p class="text-2xl">  <!-- 20px -->
<p class="text-3xl">  <!-- 24px -->

<!-- Font weight -->
<span class="font-regular">   <!-- 400 -->
<span class="font-medium">    <!-- 500 -->
<span class="font-semibold">  <!-- 600 -->
<span class="font-bold">      <!-- 700 -->
```

### Spacing (padding)

```html
<!-- All sides: .p-0 … .p-8 -->
<!-- Top:   .pt-0 … .pt-8 -->
<!-- Bottom: .pb-0 … .pb-8 -->
<!-- Start:  .ps-0 … .ps-8 -->
<!-- End:    .pe-0 … .pe-8 -->
<div class="p-4">           <!-- padding: 16px -->
<div class="pt-2 pb-3">     <!-- top: 8px, bottom: 12px -->
```

### Border radius

```html
<div class="radius-sm">    <!-- 8px  -->
<div class="radius-md">    <!-- 14px -->
<div class="radius-lg">    <!-- 20px -->
<div class="radius-xl">    <!-- 28px -->
<div class="radius-full">  <!-- pill -->
```

### Color — background

```html
<!-- Surfaces -->
<div class="bg-base">         <!-- --color-bg -->
<div class="bg-surface">      <!-- --color-surface -->
<div class="bg-surface-alt">  <!-- --color-surface-alt -->

<!-- Semantic (sets bg + contrasting fg color) -->
<div class="bg-primary">        <div class="bg-primary-light">
<div class="bg-success">        <div class="bg-success-light">
<div class="bg-warning">        <div class="bg-warning-light">
<div class="bg-error">          <div class="bg-error-light">
<div class="bg-info">           <div class="bg-info-light">
```

### Color — text

```html
<span class="text-primary">    <!-- --color-text-primary   -->
<span class="text-secondary">  <!-- --color-text-secondary -->
<span class="text-disabled">   <!-- --color-text-disabled  -->
<span class="text-primary-c">  <!-- --color-primary        -->
<span class="text-success">    <!-- --color-success        -->
<span class="text-warning">    <!-- --color-warning        -->
<span class="text-error">      <!-- --color-error          -->
<span class="text-info">       <!-- --color-info           -->
```

### Border

```html
<div class="border-color">  <!-- border-color: --color-border -->
```

### Liquid Glass

```html
<!-- Frosted glass surface (card, panel) -->
<div class="liquid-glass">

<!-- Full-bleed backdrop overlay -->
<div class="liquid-glass-overlay">
<div class="liquid-glass-overlay--light">
```

### Sticky bar

```html
<!-- Sticky search/filter bar — add --stuck when scrolled past sentinel -->
<div class="sticky-bar" [class.sticky-bar--stuck]="isStuck()">
```

### Icon helpers (from `_icons.scss`)

```html
<!-- Icon size modifiers — apply to <i stp-icon> elements -->
<i stp-icon name="package" class="icon--xs">   <!-- 14px -->
<i stp-icon name="package" class="icon--sm">   <!-- 16px -->
<i stp-icon name="package" class="icon--md">   <!-- 20px – default -->
<i stp-icon name="package" class="icon--lg">   <!-- 24px -->
<i stp-icon name="package" class="icon--xl">   <!-- 32px -->
<i stp-icon name="package" class="icon--2xl">  <!-- 64px -->

<!-- Icon color -->
<i stp-icon name="check-circle" class="icon--success">
<i stp-icon name="warning"      class="icon--warning">
<i stp-icon name="x-circle"     class="icon--error">
<i stp-icon name="info"         class="icon--info">
<i stp-icon name="gear"         class="icon--muted">
<i stp-icon name="lock"         class="icon--disabled">

<!-- Icon badge — tinted square container -->
<span class="icon-badge icon-badge--success icon-badge--lg">
  <i stp-icon name="check-circle" class="icon--lg"></i>
</span>
<!-- sizes: (default 36px) | --sm 28px | --lg 48px | --xl 64px -->
<!-- colors: --primary --success --warning --error --info --surface -->

phosphor-icons<!-- Icon button — ghost button for icon-only actions -->
<button class="icon-btn" aria-label="Eliminar">
  <i stp-icon name="trash" class="icon--sm"></i>
</button>
<button class="icon-btn icon-btn--danger" aria-label="Eliminar">…</button>
<button class="icon-btn icon-btn--primary" aria-label="Editar">…</button>

<!-- Icon row — inline icon + label -->
<span class="icon-row">
  <i stp-icon name="truck" class="icon--sm"></i>
  Proveedor Norte SAC
</span>
```

---

## SCSS Shared Partials

Import these inside component SCSS files — never redefine breakpoints or z-index.

```scss
@use '../../shared/styles/breakpoints' as bp;
@use '../../shared/styles/z-index'     as z;

// Breakpoints
@include bp.xs-down    { … }  // ≤ 479px
@include bp.xs-up      { … }  // ≥ 480px
@include bp.mobile-only{ … }  // ≤ 639px  ← most common mobile check
@include bp.sm-up      { … }  // ≥ 640px  (tablet / desktop)
@include bp.md-up      { … }  // ≥ 768px  (desktop)

// Z-index layers
z-index: z.$base;          // 1   — internal stacking
z-index: z.$bottom-bar;    // 10  — fixed bottom nav
z-index: z.$sticky;        // 49  — sticky bars
z-index: z.$header;        // 50  — fixed top header
z-index: z.$dropdown;      // 55  — floating dropdowns
z-index: z.$cart-bar;      // 60  — sale cart action bar
z-index: z.$cart-drawer;   // 80  — drawer backdrop
z-index: z.$fixed-action;  // 100 — fixed utility buttons
z-index: z.$modal;         // 200 — modals / add drawers
z-index: z.$global-action; // 1000
z-index: z.$loader;        // 9999 — full-screen loader
```
