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

The `umd` build attaches `window.BraceletConfigurator.mount`. A ready-to-use
Liquid snippet (AJAX cart add with the design stored as line-item properties)
is in [`shopify/bracelet-configurator.liquid`](./shopify/bracelet-configurator.liquid).

The widget is scoped under a `.bcfg` root with Tailwind's preflight disabled, so
its styles neither leak into nor inherit from the host theme.

> **Note:** the store is a singleton, so one configurator per page is supported
> (the typical product-page case). Multiple simultaneous instances would need a
> per-instance store/context — straightforward to add if required.
