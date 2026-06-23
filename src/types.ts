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
