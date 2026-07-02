// ─── DOMAIN TYPES ────────────────────────────────────────────────────────────

/** Fields shared by every catalogue item, however it's rendered. */
interface ItemCommon {
  id: string;
  name: string;
  /**
   * When present, the item is drawn from this (pre-loaded) image instead of the
   * procedural gradient/shape — this is the seam for Shopify-sourced sprites.
   * See `spriteCache.buildSprite` and `preloadSprites`.
   */
  imageUrl?: string;
  /** Which picker super-category this item belongs to (set for Shopify items). */
  superCategory?: SuperCategory;
  /** Machine slug of the item's type category, e.g. `crystal` (Shopify items). */
  category?: string;
}

/** A round gemstone/crystal/stone bead rendered as a shaded sphere. */
export interface BeadDef extends ItemCommon {
  /** [highlight, shadow] colours for the radial gradient. */
  gradient: [string, string];
  /** Pearlescent beads get a brighter, mobile highlight. */
  shimmer?: boolean;
  /**
   * Diameters (mm) this bead is offered in. Omit to allow every size in
   * `BEAD_SIZES`; provide a subset when a bead is only stocked in some sizes.
   */
  sizes?: number[];
  /** Price per bead for each offered diameter, keyed by mm. */
  prices: Record<number, number>;
}

export type AccessoryShape =
  | 'heart'
  | 'star'
  | 'moon'
  | 'butterfly'
  | 'flower'
  | 'infinity'
  | 'flat-disc'
  | 'rondelle'
  | 'coin'
  | 'evil-eye'
  | 'hexagon'
  | 'cross';

/** A charm / spacer / pendant rendered as a flat vector shape. */
export interface AccessoryDef extends ItemCommon {
  /** Accessories are one-size, so a single price. */
  price: number;
  color: string;
  shape: AccessoryShape;
}

export type ItemDef = BeadDef | AccessoryDef;

/**
 * Type guard for accessories. Shopify-sourced items are rendered from an image
 * and don't carry a vector `shape`, so we key off `superCategory` when it's set
 * (all catalogue items get one), falling back to the structural `'shape' in def`
 * check for any def built without it.
 */
export function isAccessory(def: ItemDef): def is AccessoryDef {
  if (def.superCategory) return def.superCategory === 'accessories';
  return 'shape' in def;
}

/**
 * Whether an item can be added at the given diameter (mm). Accessories are
 * size-agnostic and always available; a bead is available in every size unless
 * it declares an explicit `sizes` list, in which case only those diameters are.
 */
export function isSizeAvailable(def: ItemDef, mm: number): boolean {
  if (isAccessory(def)) return true;
  return !def.sizes || def.sizes.includes(mm);
}

// ─── CATALOGUE STRUCTURE ─────────────────────────────────────────────────────

export type SuperCategory = 'beads' | 'accessories';

export interface CategoryTab {
  cat: string;
  label: string;
}

/**
 * One catalogue item as delivered by the host (Shopify), before it's turned
 * into a renderable `ItemDef`. Emitted by the Liquid section as JSON and read
 * in `mount()`; see `initCatalogue`.
 */
export interface RawCatalogueItem {
  id: string;
  name: string;
  /**
   * Accessory price. For beads it's a legacy single/base price, consulted only
   * when `prices` is absent (a feed that predates per-size prices) — it's then
   * expanded with the standard size curve; see `expandBasePrice`.
   */
  price?: number;
  /** Bead price per offered diameter, keyed by mm (JSON keys are strings). */
  prices?: Record<string, number>;
  superCategory: SuperCategory;
  category: string;
  imageUrl?: string;
  /** Offered diameters (mm); empty/omitted for size-agnostic accessories. */
  sizes?: number[];
}

/** The injected catalogue payload (`<script id="bracelet-catalogue">`). */
export interface RawCatalogue {
  items: RawCatalogueItem[];
}

export interface TextureDef {
  id: string;
  label: string;
  /** CSS gradient string for the picker swatch. */
  swatch: string;
}

// ─── PLACED ITEM (engine ⇄ UI summary) ───────────────────────────────────────

/**
 * Serializable description of one item placed in the studio. The engine owns
 * the live Matter.js body; this is the lightweight mirror the React UI renders
 * from. Order is significant in bracelet mode.
 */
export interface PlacedItem {
  /** Stable unique id, assigned on placement. */
  id: string;
  def: ItemDef;
  /** Diameter in millimetres. */
  size: number;
}

export type StudioMode = 'free' | 'arranging' | 'bracelet';

/** Snapshot the engine pushes to the store whenever placement changes. */
export interface EngineSummary {
  items: PlacedItem[];
  mode: StudioMode;
  selectedId: string | null;
}
