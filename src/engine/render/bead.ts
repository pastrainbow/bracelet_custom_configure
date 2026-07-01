import type { BeadDef } from '@/types';
import { lightenHex } from './color';

type Ctx = CanvasRenderingContext2D;

/**
 * Draw a spherical bead with a fixed upper-left key light, a secondary shimmer
 * highlight, and rim darkening for roundness. Rendered once into a sprite (see
 * `spriteCache.ts`); tumbling comes from rotating that sprite wholesale, the
 * same way a rotated photo would.
 */
export function drawBead(ctx: Ctx, x: number, y: number, r: number, def: BeadDef): void {
  // Base sphere with drop shadow.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;

  const base = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r);
  if (def.shimmer) {
    base.addColorStop(0, '#ffffff');
    base.addColorStop(0.25, def.gradient[0]);
    base.addColorStop(1, def.gradient[1]);
  } else {
    base.addColorStop(0, lightenHex(def.gradient[0], 0.4));
    base.addColorStop(0.5, def.gradient[0]);
    base.addColorStop(1, def.gradient[1]);
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = base;
  ctx.fill();
  ctx.restore();

  // Fixed primary specular highlight (light from upper-left).
  const spec = ctx.createRadialGradient(x - r * 0.32, y - r * 0.35, 0, x - r * 0.2, y - r * 0.2, r * 0.55);
  spec.addColorStop(0, 'rgba(255,255,255,0.75)');
  spec.addColorStop(0.4, 'rgba(255,255,255,0.2)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = spec;
  ctx.fill();

  // Secondary shimmer, offset from the primary highlight, clipped to the bead.
  const sa = -0.9;
  const sx = x + r * 0.42 * Math.cos(sa);
  const sy = y + r * 0.42 * Math.sin(sa);
  const spin = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 0.38);
  const alpha = def.shimmer ? 0.45 : 0.28;
  spin.addColorStop(0, `rgba(255,255,255,${alpha})`);
  spin.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = spin;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();

  // Rim darkening for roundness.
  const rim = ctx.createRadialGradient(x, y, r * 0.6, x, y, r);
  rim.addColorStop(0, 'rgba(0,0,0,0)');
  rim.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = rim;
  ctx.fill();
}
