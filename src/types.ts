// ─── DOMAIN TYPES ────────────────────────────────────────────────────────────

/** A round gemstone/crystal/stone bead rendered as a shaded sphere. */
export interface BeadDef {
  id: string;
  name: string;
  price: number;
  /** [highlight, shadow] colours for the radial gradient. */
  gradient: [string, string];
  /** Pearlescent beads get a brighter, mobile highlight. */
  shimmer?: boolean;
  /**
   * Diameters (mm) this bead is offered in. Omit to allow every size in
   * `BEAD_SIZES`; provide a subset when a bead is only stocked in some sizes.
   */
  sizes?: number[];
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
export interface AccessoryDef {
  id: string;
  name: string;
  price: number;
  color: string;
  shape: AccessoryShape;
}

export type ItemDef = BeadDef | AccessoryDef;

/** Type guard: accessories carry a `shape`, beads carry a `gradient`. */
export function isAccessory(def: ItemDef): def is AccessoryDef {
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
