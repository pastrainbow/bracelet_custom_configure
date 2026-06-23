import { MM_TO_RADIUS, WHEEL_INNER, WHEEL_OUTER } from '@/config/constants';

/** Convert a bead diameter (mm) to its rendered radius (px). */
export function mmToRadius(mm: number): number {
  return mm * MM_TO_RADIUS;
}

/** Normalise an angle delta to the range (-π, π]. */
export function shortestAngle(delta: number): number {
  return ((delta + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
}

/**
 * Which size-wheel sector (0-3, clockwise from right) a vector points at.
 * Sectors map to right / bottom / left / top.
 */
export function wheelSector(dx: number, dy: number): number {
  const a = Math.atan2(dy, dx);
  const rotated = ((a + Math.PI / 4) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  return Math.floor(rotated / (Math.PI / 2)) % 4;
}

/** Whether a point lies within the wheel's annular hit region. */
export function isWithinWheel(dx: number, dy: number, pad: number): boolean {
  const d = Math.hypot(dx, dy);
  return d >= WHEEL_INNER && d <= WHEEL_OUTER + pad;
}
