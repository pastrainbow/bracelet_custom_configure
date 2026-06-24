// ─── TUNABLE CONSTANTS ───────────────────────────────────────────────────────
// Centralised so physics feel and layout can be adjusted in one place.

/** Available bead diameters (mm) offered in the size selector and size wheel. */
export const BEAD_SIZES = [6, 10, 12, 14] as const;
export type BeadSizeMm = (typeof BEAD_SIZES)[number];

export const DEFAULT_BEAD_SIZE: BeadSizeMm = 10;

/** Pixels of bead radius per millimetre of diameter. */
export const MM_TO_RADIUS = 2.2;

// ── Wrist fit ──
// A bracelet should sit a little larger than the wrist for comfort. The
// recommended bracelet length is the wrist circumference plus a comfort ease;
// the snug→loose ease range below also defines the "good fit" band.
export const WRIST_MIN_CM = 10;
export const WRIST_MAX_CM = 25;
/** Fallback wrist size (cm) applied when an out-of-range value is entered. */
export const DEFAULT_WRIST_CM = 16;
/** Comfort ease added to wrist circumference for a snug fit (cm). */
export const BRACELET_EASE_MIN_CM = 1.3;
/** Comfort ease added to wrist circumference for a loose fit (cm). */
export const BRACELET_EASE_MAX_CM = 2.3;

// ── Canvas sizing ──
export const CANVAS_MIN = 280;
export const CANVAS_MAX = 420;
/**
 * Canvas size (px) the bead scale is calibrated against. Bead radius is
 * multiplied by `canvasSize / REFERENCE_CANVAS` so a bead keeps a constant
 * proportion to the bowl/ring on every screen (otherwise beads stay a fixed
 * pixel size while the ring shrinks on phones, causing overlap). Using the max
 * canvas keeps large/desktop screens at the original 1:1 bead size.
 */
export const REFERENCE_CANVAS = CANVAS_MAX;
/** Bowl radius as a fraction of the canvas size. */
export const BOWL_RADIUS_RATIO = 0.44;
/** Bracelet ring radius as a fraction of the bowl radius. */
export const BRACELET_RADIUS_RATIO = 0.72;
/** Slack (px) allowed when checking whether a new bead fits the ring, so a
 *  snug "beads touching" arrangement isn't rejected by floating-point noise. */
export const BRACELET_FIT_TOLERANCE = 0.75;

// ── Physics (tuned to approximate real glass beads in a dish) ──
// Glass is hard, dense and fairly elastic: beads drop with weight, click off
// one another with a moderate-high bounce, roll easily, and settle firmly.
export const PHYSICS = {
  gravity: 1.0,
  /** Coefficient of restitution. Polished glass spheres are quite bouncy
   *  (real glass marbles sit around 0.5–0.7); 0.55 reads as a lively click
   *  that still loses enough energy to settle. */
  restitution: 0.55,
  /** Glass-on-glass kinetic friction (~0.3–0.4 in reality): smooth, but with
   *  enough grip that beads don't slide endlessly. */
  friction: 0.32,
  frictionStatic: 0.6,
  /** Low air drag so heavy glass keeps its momentum and doesn't "float"; just
   *  enough to damp jitter so a settled pile comes to rest. */
  frictionAir: 0.008,
  /** Dense, like real glass (~2.5 g/cm³) — beads feel weighty and authoritative
   *  when they collide and stack. */
  density: 0.0045,
  /** Soft mouse-repulsion that lets you nudge beads around in free mode.
   *  Bumped to stay usable now that the beads are heavier. */
  repelRadius: 64,
  repelStrength: 0.0026,
  /** Wall segment count for the circular bowl boundary. */
  wallSegments: 90,
  /** Bounce off the dish wall — matched to the bead restitution so the edge
   *  feels like the same hard glass-on-rim contact. */
  wallRestitution: 0.55,
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
