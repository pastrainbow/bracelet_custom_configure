import type { ItemDef } from '@/types';
import { isAccessory } from '@/types';

/**
 * Price multiplier by bead diameter (mm) — larger beads use more material and
 * cost more. Keyed to the offered sizes; unknown sizes fall back to 1×.
 */
export const SIZE_PRICE_FACTOR: Record<number, number> = {
  6: 0.6,
  10: 1,
  12: 1.4,
  14: 1.8,
};

/** Price of an item at a given size. Beads scale with size; accessories don't. */
export function priceFor(def: ItemDef, mm: number): number {
  if (isAccessory(def)) return def.price;
  const factor = SIZE_PRICE_FACTOR[mm] ?? 1;
  return Math.round(def.price * factor * 100) / 100;
}

/** Compact price label, e.g. "$2" or "$2.80". */
export function formatPrice(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}
