# Bracelet Custom Configurator

An interactive custom-bracelet builder: drop gemstone beads and accessories into
a physics "dish," arrange them into a bracelet, resize individual beads, and add
the finished design to a Shopify cart.

Rewritten from a vanilla HTML/CSS/JS prototype into a maintainable
**React + TypeScript + Vite + Tailwind** widget with a clean Shopify embed API.
The original prototype is preserved under [`legacy/`](./legacy) for reference.

## Quick start

> Requires **Node.js 18+** and npm.

```bash
npm install
npm run dev          # http://localhost:5173 — standalone dev app
npm run build        # production SPA  → dist/
npm run build:widget # embeddable widget → dist-widget/
npm run typecheck    # tsc type-check, no emit
```

## Architecture

The imperative physics/canvas world is deliberately isolated from the
declarative React UI. Per-frame mutation never touches React; only serializable
*summaries* of placed items flow into the store, so the sidebar and price stay
reactive without re-rendering every frame.

```
src/
├─ engine/                  Imperative core — framework-agnostic
│  ├─ BraceletEngine.ts     Owns Matter bodies, the RAF loop, all pointer input
│  ├─ physics.ts            Engine, circular walls, pointer repulsion (tuned)
│  ├─ geometry.ts           Radius / angle / wheel-sector math
│  └─ render/               Pure canvas drawing
│     ├─ bead.ts            Shaded sphere with rotating shimmer
│     ├─ accessories.ts     12 vector charm/spacer/pendant shapes
│     ├─ textures.ts        5 bowl backgrounds
│     ├─ overlay.ts         Selection ring, trash badge, size wheel, thread
│     └─ color.ts           Colour + easing helpers
├─ store/store.ts           Zustand — UI state mirrored from the engine
├─ data/                    Typed catalogue + textures
├─ components/              Declarative React (Header, Studio, Sidebar, …)
│  ├─ sidebar/              Order summary, info, size/texture, bead list, steps, CTA
│  └─ ui/                   Primitives: Button, Badge, PillTabs (Radix), …
├─ hooks/                   useBraceletEngine (lifecycle), useMediaQuery
├─ shopify/integration.ts   Embed options, AddToCart payload, design encode/decode
├─ mount.tsx                mount(target, options) → { unmount }
├─ widget.ts               Library entry (exposes the mount API)
└─ App.tsx / main.tsx       Composition root / standalone dev entry
```

### State ownership

- **`BraceletEngine`** is the source of truth for physics: live Matter bodies,
  pointer drags, the arrange animation, the size wheel.
- **Zustand store** holds UI-facing state (`items`, `mode`, `selectedId`,
  `beadSize`, `texture`, `progress`). UI actions delegate to the engine; the
  engine calls back with an `EngineSummary` on every structural change.

## Interaction model

Pointer input is unified through **Pointer Events with pointer capture** (one
code path for mouse, touch, and pen), replacing the prototype's separate
mouse/touch handlers and manual touch→mouse relay.

| Action | Free (dish) mode | Bracelet mode |
| --- | --- | --- |
| Drag a bead | Move it; release outside the dish to delete | Reorder around the ring; release outside to delete |
| Drag empty space | — | Rotate the whole bracelet |
| Right-click / long-press a bead | Open the radial **size wheel** | Same |
| Tap a bead | Select it (inline resize in the sidebar) | Select it |

Physics were retuned for realistic stone beads (lower restitution, higher
friction/air damping, denser bodies, a finer-segmented bowl boundary, and
DPR-aware crisp rendering). All values live in
[`src/config/constants.ts`](./src/config/constants.ts).

## Shopify integration

Build the widget and embed it with the `mount` API:

```ts
import { mount } from 'bracelet-configurator';

mount('#bracelet-configurator', {
  wristHint: 'Wrist size: 15.5 – 16.5 cm',
  initialDesign: 'jade@10,pearl@12,heart-charm@10',
  onAddToCart: (payload) => fetch('/cart/add.js', { /* … */ }),
  onSaveDesign: (code, url) => navigator.clipboard.writeText(url),
});
```

**Design autosave.** Every design change (beads, sizes, texture, wrist size)
is persisted automatically, debounced ~0.8 s, as a `DesignSnapshot`
(`src/persistence/autosave.ts`):

- **Always** to `localStorage` (`bracelet-design-draft:<customerId|guest>`) —
  chosen over cookies for its larger quota and because drafts never need to
  travel with requests.
- **Logged-in customers** additionally sync to remote storage via the
  `onAutoSave(snapshot)` mount option. The Liquid section wires it to a
  `_bracelet_draft` **cart attribute** (`/cart/update.js`), which Shopify
  persists server-side with the customer's cart — the only account-following
  storage writable from the storefront without an app backend. It reads the
  attribute back (`/cart.js`) before mounting and passes it as `savedDesign`.

On mount the widget restores, in priority order: `initialDesign` →
a `?design=…&size=…` share link → the **newest** of `savedDesign` and the
local draft (a guest draft made before logging in also competes, so logging
in never loses the design). Autosave only arms after restore, so an empty
first paint can't clobber a stored draft. Pass `customerId` to namespace
local drafts per customer.

The `umd` build attaches `window.BraceletConfigurator.mount`. A ready-to-use
Liquid snippet is in
[`shopify/bracelet-configurator.liquid`](./shopify/bracelet-configurator.liquid).
Its cart handler posts `payload.lines` — the design aggregated into one line
per distinct Shopify variant (real variant ids come with the catalogue feed) —
to `/cart/add.js`, so the cart total always equals the configurator's total
and stock is drawn from the actual bead/accessory variants.

**One cart row per bracelet.** Every line of a design carries a shared, unique
`_bracelet_id` line-item property (plus `_design`, the exact design code, and
`_thumb`, a small JPEG render of the arranged bracelet produced at
add-to-cart time). Two modified Dawn sections, pushed by the deploy script,
turn those hidden properties into the shopper-facing display:

- [`shopify/main-cart-items.liquid`](./shopify/main-cart-items.liquid) —
  collapses each bracelet's bead lines into a single **"Custom Bracelet"** row
  whose image is the design render, priced at the summed line prices, with a
  component breakdown and a remove button that deletes all of the bracelet's
  lines at once.
- [`shopify/cart-icon-bubble.liquid`](./shopify/cart-icon-bubble.liquid) —
  makes the header cart count treat each bracelet as one item.

Both are copies of the live theme's sections with clearly-marked
`CUSTOM BRACELET` blocks; after a Dawn theme update, re-pull the sections and
re-apply those blocks. Note the grouping is cart-page display only: Shopify's
**checkout** (not theme-customisable on non-Plus plans) still lists the
individual bead variants — the charged total is identical either way.

The widget is scoped under a `.bcfg` root with Tailwind's preflight disabled, so
its styles neither leak into nor inherit from the host theme.

> **Note:** the store is a singleton, so one configurator per page is supported
> (the typical product-page case). Multiple simultaneous instances would need a
> per-instance store/context — straightforward to add if required.

## Catalogue admin app (embedded in the Shopify admin)

Managing the configurator's beads & accessories — name, category, per-size
price & stock, sprite image — happens in an **embedded Shopify custom app**:
Shopify admin → **Apps** → *Bracelet Catalogue Admin*. The app is a single
Cloudflare Worker ([`admin-app/worker.mjs`](./admin-app/worker.mjs) +
[`admin-app/ui.html`](./admin-app/ui.html)); one-time Cloudflare/Dev-Dashboard
setup is documented in [`admin-app/SETUP.md`](./admin-app/SETUP.md), after
which code changes ship with one command:

```bash
npm run deploy:admin
```

Per submitted item it (1) trims + frames the uploaded image **in the
browser** to the exact sprite layout the widget expects, (2) writes it to the
theme's `assets/` as `sprite-<handle>.png` via the Admin GraphQL
`themeFilesUpsert` mutation (`write_themes` scope — no Shopify CLI or Theme
Access token involved), (3) creates/updates the product via `productSet` —
handle = item id, `configurator`/`super:`/`cat:` tags, one "Size" variant per
size with SKU and stock — and (4) publishes it to the Online Store channel,
where the `bracelet-configurator-items` smart collection picks it up
automatically.

Auth: the UI runs only inside the store's admin iframe, every API call is
verified against an App Bridge **session token**, and Admin API access uses
the Dev Dashboard app's client-credentials grant (`SHOPIFY_CLIENT_ID` +
`SHOPIFY_CLIENT_SECRET` in `.env`, injected into the worker at deploy time).
