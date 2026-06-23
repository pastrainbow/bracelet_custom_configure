// ─── TUNABLE CONSTANTS ───────────────────────────────────────────────────────
// Centralised so physics feel and layout can be adjusted in one place.

/** Available bead diameters (mm) offered in the size selector and size wheel. */
export const BEAD_SIZES = [6, 10, 12, 14] as const;
export type BeadSizeMm = (typeof BEAD_SIZES)[number];

export const DEFAULT_BEAD_SIZE: BeadSizeMm = 10;
export const MAX_BEADS = 40;

/** Pixels of bead radius per millimetre of diameter. */
export const MM_TO_RADIUS = 2.2;

// ── Canvas sizing ──
export const CANVAS_MIN = 280;
export const CANVAS_MAX = 420;
/** Bowl radius as a fraction of the canvas size. */
export const BOWL_RADIUS_RATIO = 0.44;
/** Bracelet ring radius as a fraction of the bowl radius. */
export const BRACELET_RADIUS_RATIO = 0.72;

// ── Physics (tuned for realistic stone beads settling in a dish) ──
export const PHYSICS = {
  gravity: 0.9,
  /** Beads are dense and only mildly bouncy — they settle rather than ping. */
  restitution: 0.32,
  friction: 0.18,
  frictionStatic: 0.5,
  frictionAir: 0.012,
  density: 0.0024,
  /** Soft mouse-repulsion that lets you nudge beads around in free mode. */
  repelRadius: 64,
  repelStrength: 0.0014,
  /** Wall segment count for the circular bowl boundary. */
  wallSegments: 90,
  wallRestitution: 0.45,
} as const;

// ── Arrange animation ──
/** Per-frame progress increment of the scatter→ring transition (0..1). */
export const ARRANGE_SPEED = 0.022;

// ── Size wheel (radial menu) ──
// Sectors 0-3 map clockwise to: right, bottom, left, top.
export const WHEEL_SIZES: BeadSizeMm[] = [10, 12, 14, 6];
export const WHEEL_INNER = 26;
export const WHEEL_OUTER = 70;
export const WHEEL_HIT_PAD = 12;
export const LONG_PRESS_MS = 500;

/** Pointer travel (px) below which a press counts as a tap, not a drag. */
export const TAP_THRESHOLD = 8;

/** Hit-test radius multiplier (beads are easier to grab than their visual size). */
export const HIT_SLOP = 1.3;
