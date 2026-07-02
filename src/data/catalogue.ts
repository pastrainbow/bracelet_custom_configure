import type {
  AccessoryDef,
  BeadDef,
  CategoryTab,
  ItemDef,
  RawCatalogue,
  RawCatalogueItem,
  SuperCategory,
} from '@/types';
import { expandBasePrice } from '@/data/pricing';

// ─── BEAD CATEGORIES ─────────────────────────────────────────────────────────

// Stub bead prices are authored as a 10 mm base price expanded into the
// per-size map every bead def carries (`prices`); restricted-size beads only
// get prices for the sizes they offer.
const p = expandBasePrice;

const crystal: BeadDef[] = [
  { id: 'white-crystal', name: 'White Crystal', prices: p(2), gradient: ['#f8f8ff', '#e8e8f0'], shimmer: true },
  { id: 'rose-quartz', name: 'Rose Quartz', prices: p(3), gradient: ['#f9c5d1', '#f48fb1'] },
  { id: 'amethyst', name: 'Amethyst', prices: p(4), gradient: ['#9c72b5', '#6a3fa1'] },
  { id: 'citrine', name: 'Citrine', prices: p(3), gradient: ['#f5c842', '#e8a800'] },
  { id: 'aquamarine', name: 'Aquamarine', prices: p(5), gradient: ['#7ec8e3', '#0b8dba'] },
  { id: 'obsidian', name: 'Obsidian', prices: p(3), gradient: ['#2c2c2c', '#111111'] },
  { id: 'moonstone', name: 'Moonstone', prices: p(6, [10, 12, 14]), gradient: ['#d4e8f5', '#a8d0ed'], shimmer: true, sizes: [10, 12, 14] },
  { id: 'labradorite', name: 'Labradorite', prices: p(7, [10, 12, 14]), gradient: ['#5c7a8a', '#3a566a'], sizes: [10, 12, 14] },
  { id: 'turquoise', name: 'Turquoise', prices: p(5), gradient: ['#40e0d0', '#1aa090'] },
  { id: 'sunstone', name: 'Sunstone', prices: p(6, [6, 10]), gradient: ['#ff9a3c', '#e06b00'], sizes: [6, 10] },
];

const stone: BeadDef[] = [
  { id: 'marble', name: 'White Marble', prices: p(4), gradient: ['#f0ede8', '#d8d4cc'] },
  { id: 'black-onyx', name: 'Black Onyx', prices: p(3), gradient: ['#1a1a1a', '#050505'] },
  { id: 'tiger-eye', name: 'Tiger Eye', prices: p(4), gradient: ['#c8860a', '#8b5e0a'] },
  { id: 'jade', name: 'Jade', prices: p(8, [6, 10, 12]), gradient: ['#5da85d', '#2d7a2d'], sizes: [6, 10, 12] },
  { id: 'lapis', name: 'Lapis Lazuli', prices: p(6), gradient: ['#1a3a7a', '#0d2050'] },
  { id: 'red-agate', name: 'Red Agate', prices: p(3), gradient: ['#c0392b', '#922b21'] },
  { id: 'jasper', name: 'Jasper', prices: p(3), gradient: ['#8b4513', '#5a2d0c'] },
  { id: 'malachite', name: 'Malachite', prices: p(7), gradient: ['#2e8b57', '#145a32'] },
];

const shell: BeadDef[] = [
  { id: 'pearl', name: 'Pearl', prices: p(8, [6, 10, 12]), gradient: ['#faf9f6', '#e8e4de'], shimmer: true, sizes: [6, 10, 12] },
  { id: 'abalone', name: 'Abalone', prices: p(10), gradient: ['#6bbfbf', '#4a9fa0'] },
  { id: 'mother-pearl', name: 'Mother of Pearl', prices: p(7), gradient: ['#f0ece8', '#c8c0b8'], shimmer: true },
  { id: 'paua', name: 'Paua Shell', prices: p(9), gradient: ['#5040a0', '#302060'] },
];

const accent: BeadDef[] = [
  { id: 'gold-spacer', name: 'Gold Spacer', prices: p(2), gradient: ['#d4af37', '#b8960c'] },
  { id: 'silver-spacer', name: 'Silver Spacer', prices: p(2), gradient: ['#c0c0c0', '#909090'] },
  { id: 'hematite', name: 'Hematite', prices: p(2), gradient: ['#4a4a4a', '#2a2a2a'] },
  { id: 'pyrite', name: 'Pyrite', prices: p(3), gradient: ['#c8b850', '#a09030'] },
  { id: 'clear-quartz', name: 'Clear Quartz', prices: p(2), gradient: ['#e8f4ff', '#cce0ff'], shimmer: true },
];

// ─── ACCESSORY CATEGORIES ────────────────────────────────────────────────────

const charms: AccessoryDef[] = [
  { id: 'heart-charm', name: 'Heart', price: 8, color: '#e91e8c', shape: 'heart' },
  { id: 'star-charm', name: 'Star', price: 6, color: '#d4af37', shape: 'star' },
  { id: 'moon-charm', name: 'Crescent', price: 7, color: '#b0c8e8', shape: 'moon' },
  { id: 'butterfly-charm', name: 'Butterfly', price: 9, color: '#9c27b0', shape: 'butterfly' },
  { id: 'flower-charm', name: 'Flower', price: 7, color: '#ff6b9d', shape: 'flower' },
  { id: 'infinity-charm', name: 'Infinity', price: 8, color: '#d4af37', shape: 'infinity' },
];

const spacers: AccessoryDef[] = [
  { id: 'gold-disc', name: 'Gold Disc', price: 2, color: '#d4af37', shape: 'flat-disc' },
  { id: 'silver-disc', name: 'Silver Disc', price: 2, color: '#c0c0c0', shape: 'flat-disc' },
  { id: 'gold-rondelle', name: 'Gold Rondelle', price: 3, color: '#d4af37', shape: 'rondelle' },
  { id: 'silver-rondelle', name: 'Silver Rondelle', price: 3, color: '#c0c0c0', shape: 'rondelle' },
  { id: 'crystal-rondelle', name: 'Crystal Rondelle', price: 4, color: '#d4f0ff', shape: 'rondelle' },
];

const pendants: AccessoryDef[] = [
  { id: 'gold-coin', name: 'Gold Coin', price: 10, color: '#d4af37', shape: 'coin' },
  { id: 'evil-eye', name: 'Evil Eye', price: 8, color: '#1565c0', shape: 'evil-eye' },
  { id: 'hexagon-silver', name: 'Hexagon', price: 7, color: '#9e9e9e', shape: 'hexagon' },
  { id: 'cross-gold', name: 'Gold Cross', price: 7, color: '#d4af37', shape: 'cross' },
  { id: 'cross-silver', name: 'Silver Cross', price: 7, color: '#c0c0c0', shape: 'cross' },
];

// ─── STUB CATALOGUE (dev / offline fallback) ─────────────────────────────────
// Used by the standalone SPA and whenever the host injects no Shopify catalogue.

const STUB_CATALOGUE: Record<string, ItemDef[]> = {
  crystal,
  stone,
  shell,
  accent,
  charms,
  spacers,
  pendants,
};

const STUB_SUPERCATS: Record<SuperCategory, CategoryTab[]> = {
  beads: [
    { cat: 'crystal', label: 'Crystal' },
    { cat: 'stone', label: 'Natural Stone' },
    { cat: 'shell', label: 'Shell' },
    { cat: 'accent', label: 'Accent' },
  ],
  accessories: [
    { cat: 'charms', label: 'Charms' },
    { cat: 'spacers', label: 'Spacers' },
    { cat: 'pendants', label: 'Pendants' },
  ],
};

/** Display labels for known category slugs; unknown slugs are title-cased. */
const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(STUB_SUPERCATS)
    .flat()
    .map((t) => [t.cat, t.label]),
);

function labelFor(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat.replace(/(^|[-_ ])(\w)/g, (_m, _s, c) => ' ' + c.toUpperCase()).trim();
}

// ─── LIVE CATALOGUE ──────────────────────────────────────────────────────────
// These bindings start on the stub and are replaced in place by `initCatalogue`
// (called from `mount()` before first render). Consumers import them as live
// ES bindings, so they see whatever `initCatalogue` installs.

export let CATALOGUE: Record<string, ItemDef[]> = STUB_CATALOGUE;
export let SUPERCATS: Record<SuperCategory, CategoryTab[]> = STUB_SUPERCATS;
/** Flat lookup of every item def by id (used to restore saved designs). */
export let ITEM_BY_ID: Record<string, ItemDef> = buildIndex(STUB_CATALOGUE);

/** Tag every def with its category/superCategory so `isAccessory` etc. work uniformly. */
function annotate(catalogue: Record<string, ItemDef[]>, supercats: Record<SuperCategory, CategoryTab[]>): void {
  for (const [superCat, tabs] of Object.entries(supercats) as [SuperCategory, CategoryTab[]][]) {
    for (const { cat } of tabs) {
      for (const def of catalogue[cat] ?? []) {
        def.superCategory = superCat;
        def.category = cat;
      }
    }
  }
}
annotate(STUB_CATALOGUE, STUB_SUPERCATS);

function buildIndex(catalogue: Record<string, ItemDef[]>): Record<string, ItemDef> {
  return Object.values(catalogue)
    .flat()
    .reduce<Record<string, ItemDef>>((acc, def) => {
      acc[def.id] = def;
      return acc;
    }, {});
}

/** Per-size prices for a raw bead: prefer the explicit per-size map (JSON keys
 *  arrive as strings); fall back to expanding a legacy single price with the
 *  standard size curve. */
function beadPricesOf(raw: RawCatalogueItem): Record<number, number> {
  const prices: Record<number, number> = {};
  for (const [mm, price] of Object.entries(raw.prices ?? {})) {
    const size = Number(mm);
    if (Number.isFinite(size) && Number.isFinite(price)) prices[size] = price;
  }
  if (Object.keys(prices).length) return prices;
  return expandBasePrice(raw.price ?? 0, raw.sizes && raw.sizes.length ? raw.sizes : undefined);
}

/** Turn one injected item into a renderable def. The gradient/shape here is only
 *  a neutral fallback for the rare case an image fails to load — the real look
 *  comes from `imageUrl`. */
function toItemDef(raw: RawCatalogueItem): ItemDef {
  const common = {
    id: raw.id,
    name: raw.name,
    superCategory: raw.superCategory,
    category: raw.category,
    imageUrl: raw.imageUrl,
  };
  if (raw.superCategory === 'accessories') {
    return { ...common, price: raw.price ?? 0, shape: 'coin', color: '#c9c9c9' } satisfies AccessoryDef;
  }
  return {
    ...common,
    gradient: ['#dcdcdc', '#a9a9a9'],
    sizes: raw.sizes && raw.sizes.length ? raw.sizes : undefined,
    prices: beadPricesOf(raw),
  } satisfies BeadDef;
}

/**
 * Install a host-provided (Shopify) catalogue, replacing the stub. Items are
 * grouped into `CATALOGUE` by category and `SUPERCATS` is rebuilt preserving
 * first-appearance order. With no payload (or an empty one) the stub is kept.
 */
export function initCatalogue(raw?: RawCatalogue): void {
  if (!raw || !Array.isArray(raw.items) || !raw.items.length) return;

  // Drop malformed entries (e.g. a store product missing its `super:`/`cat:`
  // tags emits empty fields from the Liquid feed) instead of letting them
  // group under `undefined` and disappear without a trace.
  // Beads accept either per-size `prices` or a legacy single `price`;
  // accessories need a single `price`.
  const hasPrice = (it: RawCatalogueItem) =>
    it.superCategory === 'beads'
      ? Object.values(it.prices ?? {}).some((v) => Number.isFinite(v)) || Number.isFinite(it.price)
      : Number.isFinite(it.price);
  const items = raw.items.filter(
    (it) =>
      it &&
      typeof it.id === 'string' && it.id &&
      typeof it.name === 'string' && it.name &&
      (it.superCategory === 'beads' || it.superCategory === 'accessories') &&
      hasPrice(it) &&
      typeof it.category === 'string' && it.category,
  );
  if (items.length < raw.items.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `[BraceletConfigurator] skipped ${raw.items.length - items.length} malformed catalogue item(s) — ` +
        'check each product has "super:beads|accessories" and "cat:<slug>" tags and a price.',
    );
  }
  if (!items.length) return; // nothing usable — keep the stub catalogue

  const catalogue: Record<string, ItemDef[]> = {};
  const superOrder: Record<SuperCategory, string[]> = { beads: [], accessories: [] };

  for (const item of items) {
    const def = toItemDef(item);
    (catalogue[item.category] ??= []).push(def);
    const order = superOrder[item.superCategory];
    if (order && !order.includes(item.category)) order.push(item.category);
  }

  const supercats = { beads: [], accessories: [] } as Record<SuperCategory, CategoryTab[]>;
  for (const superCat of Object.keys(superOrder) as SuperCategory[]) {
    supercats[superCat] = superOrder[superCat].map((cat) => ({ cat, label: labelFor(cat) }));
  }

  CATALOGUE = catalogue;
  SUPERCATS = supercats;
  ITEM_BY_ID = buildIndex(catalogue);
}
