import type { ItemDef } from '@/types';
import { isAccessory } from '@/types';
import { BEAD_SIZES } from '@/config/constants';

/**
 * Standard price curve by bead diameter (mm) — larger beads use more material
 * and cost more. Only used to expand a single base price into per-size prices
 * (stub catalogue entries and legacy feeds); items with explicit per-size
 * prices never touch it.
 */
export const SIZE_PRICE_FACTOR: Record<number, number> = {
  6: 0.6,
  10: 1,
  12: 1.4,
  14: 1.8,
};

/**
 * Expand a single 10 mm base price into per-size prices using the standard
 * curve. Sizes without a known factor fall back to 1×.
 */
export function expandBasePrice(base: number, sizes: readonly number[] = BEAD_SIZES): Record<number, number> {
  const prices: Record<number, number> = {};
  for (const mm of sizes) {
    prices[mm] = Math.round(base * (SIZE_PRICE_FACTOR[mm] ?? 1) * 100) / 100;
  }
  return prices;
}

/** Price of an item at a given size. Beads carry an explicit price per size;
 *  accessories are one-size. */
export function priceFor(def: ItemDef, mm: number): number {
  if (isAccessory(def)) return def.price;
  const sized = def.prices[mm];
  if (Number.isFinite(sized)) return sized;
  // Shouldn't happen — availability is gated on `sizes` which mirrors the
  // priced sizes — but if a bead is somehow placed at an unpriced size, charge
  // the nearest priced size rather than $0.
  const priced = Object.keys(def.prices).map(Number);
  if (!priced.length) return 0;
  const nearest = priced.reduce((a, b) => (Math.abs(b - mm) < Math.abs(a - mm) ? b : a));
  return def.prices[nearest];
}

/**
 * Shopify variant id backing an item at a given size, or null when the
 * catalogue carries none (stub catalogue, or a feed predating variant ids).
 * Mirrors `priceFor`'s nearest-size fallback so the variant charged in the
 * cart always matches the price the widget displayed.
 */
export function variantFor(def: ItemDef, mm: number): number | null {
  if (isAccessory(def)) return def.variantId ?? null;
  const ids = def.variantIds ?? {};
  if (ids[mm]) return ids[mm];
  const sized = Object.keys(ids).map(Number);
  if (!sized.length) return null;
  const nearest = sized.reduce((a, b) => (Math.abs(b - mm) < Math.abs(a - mm) ? b : a));
  return ids[nearest] ?? null;
}

/** Compact price label, e.g. "$2" or "$2.80". */
export function formatPrice(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}
